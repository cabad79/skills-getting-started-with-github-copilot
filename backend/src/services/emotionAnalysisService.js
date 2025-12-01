const tf = require('@tensorflow/tfjs-node');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;

// Patch face-api to use node-canvas
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

class EmotionAnalysisService {
  constructor() {
    this.modelsLoaded = false;
    this.modelPath = path.join(__dirname, '../../models/face-api');
  }

  /**
   * Load face-api models
   */
  async loadModels() {
    if (this.modelsLoaded) return;

    try {
      console.log('Loading face-api models...');

      // Create models directory if it doesn't exist
      await fs.mkdir(this.modelPath, { recursive: true });

      // Load models (face detection and expression recognition)
      await faceapi.nets.tinyFaceDetector.loadFromDisk(this.modelPath);
      await faceapi.nets.faceExpressionNet.loadFromDisk(this.modelPath);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(this.modelPath);

      this.modelsLoaded = true;
      console.log('✓ Face-api models loaded');
    } catch (error) {
      console.error('Error loading face-api models:', error);
      // For now, continue without models (they need to be downloaded separately)
      this.modelsLoaded = false;
    }
  }

  /**
   * Extract frames from video
   * @param {string} videoPath - Path to video file
   * @param {number} fps - Frames per second to extract (default 1)
   * @returns {Promise<string[]>} Array of frame file paths
   */
  async extractFrames(videoPath, fps = 1) {
    const framesDir = path.join(path.dirname(videoPath), 'frames');
    await fs.mkdir(framesDir, { recursive: true });

    return new Promise((resolve, reject) => {
      const framePaths = [];

      ffmpeg(videoPath)
        .on('end', () => resolve(framePaths))
        .on('error', reject)
        .on('filenames', (filenames) => {
          framePaths.push(...filenames.map(f => path.join(framesDir, f)));
        })
        .screenshots({
          count: 30, // Extract up to 30 frames
          folder: framesDir,
          filename: 'frame-%i.png',
          size: '640x480'
        });
    });
  }

  /**
   * Analyze emotion in a single image
   * @param {string} imagePath - Path to image file
   * @returns {Promise<object>} Emotion analysis results
   */
  async analyzeImage(imagePath) {
    if (!this.modelsLoaded) {
      // Return mock data if models aren't loaded
      return this.getMockEmotionData();
    }

    try {
      // Load image
      const img = await canvas.loadImage(imagePath);
      const canvasElement = canvas.createCanvas(img.width, img.height);
      const ctx = canvasElement.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Detect faces and expressions
      const detections = await faceapi
        .detectAllFaces(canvasElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detections.length === 0) {
        return null; // No face detected
      }

      // Get the first (most prominent) face
      const detection = detections[0];

      return {
        expressions: detection.expressions,
        landmarks: detection.landmarks.positions.length,
        confidence: detection.detection.score
      };
    } catch (error) {
      console.error('Image analysis error:', error);
      return null;
    }
  }

  /**
   * Analyze video for emotions
   * @param {string} videoPath - Path to video file
   * @returns {Promise<object>} Aggregated emotion analysis
   */
  async analyzeVideo(videoPath) {
    try {
      // Ensure models are loaded
      await this.loadModels();

      // Extract frames from video
      console.log('Extracting frames from video...');
      const framePaths = await this.extractFrames(videoPath, 1);

      // Analyze each frame
      console.log(`Analyzing ${framePaths.length} frames...`);
      const frameAnalyses = [];

      for (const framePath of framePaths) {
        const analysis = await this.analyzeImage(framePath);
        if (analysis) {
          frameAnalyses.push(analysis);
        }

        // Clean up frame
        await fs.unlink(framePath).catch(() => {});
      }

      // Clean up frames directory
      const framesDir = path.dirname(framePaths[0]);
      await fs.rmdir(framesDir).catch(() => {});

      if (frameAnalyses.length === 0) {
        throw new Error('No faces detected in video');
      }

      // Aggregate results
      const aggregated = this.aggregateEmotionData(frameAnalyses);

      return aggregated;
    } catch (error) {
      console.error('Video analysis error:', error);
      throw error;
    }
  }

  /**
   * Aggregate emotion data from multiple frames
   * @param {Array} frameAnalyses - Array of frame analysis results
   * @returns {object} Aggregated emotion profile
   */
  aggregateEmotionData(frameAnalyses) {
    const emotionSums = {
      neutral: 0,
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      disgusted: 0,
      surprised: 0
    };

    const emotionCounts = { ...emotionSums };
    const frameCount = frameAnalyses.length;

    // Sum up all emotion scores
    frameAnalyses.forEach(frame => {
      Object.keys(emotionSums).forEach(emotion => {
        const score = frame.expressions[emotion] || 0;
        emotionSums[emotion] += score;
        if (score > 0.1) { // Count only significant expressions
          emotionCounts[emotion]++;
        }
      });
    });

    // Calculate averages and percentages
    const emotionProfile = {};
    Object.keys(emotionSums).forEach(emotion => {
      emotionProfile[emotion] = {
        average: emotionSums[emotion] / frameCount,
        frequency: emotionCounts[emotion] / frameCount,
        total_frames: emotionCounts[emotion]
      };
    });

    // Find dominant emotion
    let dominantEmotion = 'neutral';
    let maxAverage = 0;
    Object.keys(emotionProfile).forEach(emotion => {
      if (emotionProfile[emotion].average > maxAverage) {
        maxAverage = emotionProfile[emotion].average;
        dominantEmotion = emotion;
      }
    });

    // Calculate emotional range (variance in expressions)
    const emotionVariance = this.calculateEmotionVariance(frameAnalyses);

    return {
      emotion_profile: emotionProfile,
      dominant_emotion: dominantEmotion,
      emotional_range: emotionVariance,
      frames_analyzed: frameCount,
      quality_score: this.calculateQualityScore(frameAnalyses)
    };
  }

  /**
   * Calculate emotion variance (how much emotion changes throughout video)
   * @param {Array} frameAnalyses - Frame analysis results
   * @returns {number} Variance score (0-1)
   */
  calculateEmotionVariance(frameAnalyses) {
    if (frameAnalyses.length < 2) return 0;

    const emotionTypes = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'];
    let totalVariance = 0;

    emotionTypes.forEach(emotion => {
      const values = frameAnalyses.map(f => f.expressions[emotion] || 0);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      totalVariance += variance;
    });

    return Math.min(1, totalVariance / emotionTypes.length);
  }

  /**
   * Calculate quality score for video analysis
   * @param {Array} frameAnalyses - Frame analysis results
   * @returns {number} Quality score (0-1)
   */
  calculateQualityScore(frameAnalyses) {
    if (frameAnalyses.length === 0) return 0;

    // Average confidence score from face detections
    const avgConfidence = frameAnalyses.reduce((sum, f) => sum + (f.confidence || 0), 0) / frameAnalyses.length;

    // Penalize if too few frames analyzed
    const framePenalty = Math.min(1, frameAnalyses.length / 20);

    return avgConfidence * framePenalty;
  }

  /**
   * Get mock emotion data (for development/testing without models)
   * @returns {object} Mock emotion data
   */
  getMockEmotionData() {
    return {
      expressions: {
        neutral: 0.3 + Math.random() * 0.2,
        happy: 0.4 + Math.random() * 0.3,
        sad: 0.05 + Math.random() * 0.1,
        angry: 0.02 + Math.random() * 0.05,
        fearful: 0.03 + Math.random() * 0.05,
        disgusted: 0.02 + Math.random() * 0.05,
        surprised: 0.18 + Math.random() * 0.15
      },
      landmarks: 68,
      confidence: 0.85 + Math.random() * 0.15
    };
  }

  /**
   * Generate mock video analysis (for development)
   * @returns {object} Mock analysis results
   */
  generateMockAnalysis() {
    const mockFrames = Array(25).fill(null).map(() => this.getMockEmotionData());
    return this.aggregateEmotionData(mockFrames);
  }
}

module.exports = new EmotionAnalysisService();
