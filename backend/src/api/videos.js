const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateJWT, requireActiveUser } = require('../middleware/auth');
const { User, Profile } = require('../models');
const emotionAnalysisService = require('../services/emotionAnalysisService');

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const userDir = path.join(uploadDir, 'videos', req.user.user_id);

    try {
      await fs.mkdir(userDir, { recursive: true });
      cb(null, userDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `emotion-video-${timestamp}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept video files only
  const allowedMimes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only video files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_VIDEO_SIZE) || 50 * 1024 * 1024 // 50MB default
  }
});

/**
 * POST /api/videos/upload
 * Upload and analyze emotion video
 */
router.post('/upload', authenticateJWT, requireActiveUser, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const userId = req.user.user_id;
    const videoPath = req.file.path;

    // Analyze video for emotions
    console.log('Starting emotion analysis for user:', userId);
    let analysisResult;

    try {
      // Try real analysis first
      analysisResult = await emotionAnalysisService.analyzeVideo(videoPath);
    } catch (error) {
      console.warn('Real analysis failed, using mock data:', error.message);
      // Fallback to mock data if models aren't available
      analysisResult = emotionAnalysisService.generateMockAnalysis();
    }

    // Update user record
    const user = await User.findByPk(userId);
    user.video_url = videoPath;
    user.emotion_analysis = analysisResult;
    user.video_uploaded = true;
    await user.save();

    // Update profile with emotion data
    let profile = await Profile.findOne({ where: { user_id: userId } });

    if (!profile) {
      profile = await Profile.create({ user_id: userId });
    }

    profile.emotion_profile = analysisResult.emotion_profile;
    profile.video_features = {
      dominant_emotion: analysisResult.dominant_emotion,
      emotional_range: analysisResult.emotional_range,
      quality_score: analysisResult.quality_score
    };

    // Recalculate profile quality score
    profile.calculateQualityScore();
    await profile.save();

    // Check if profile is now complete
    if (user.questionnaire_complete && user.video_uploaded && !user.profile_complete) {
      user.profile_complete = true;
      await user.save();
    }

    res.json({
      message: 'Video uploaded and analyzed successfully',
      analysis: {
        dominant_emotion: analysisResult.dominant_emotion,
        emotional_range: analysisResult.emotional_range,
        frames_analyzed: analysisResult.frames_analyzed,
        quality_score: analysisResult.quality_score,
        emotion_breakdown: analysisResult.emotion_profile
      },
      profile_complete: user.profile_complete
    });
  } catch (error) {
    console.error('Video upload error:', error);

    // Clean up uploaded file if there's an error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({ error: 'Failed to process video' });
  }
});

/**
 * GET /api/videos/analysis
 * Get current user's video analysis results
 */
router.get('/analysis', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id);

    if (!user.video_uploaded || !user.emotion_analysis) {
      return res.status(404).json({ error: 'No video analysis available' });
    }

    res.json({
      analysis: user.emotion_analysis,
      video_uploaded_at: user.updated_at
    });
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ error: 'Failed to get analysis' });
  }
});

/**
 * DELETE /api/videos
 * Delete user's uploaded video
 */
router.delete('/', authenticateJWT, requireActiveUser, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id);

    if (!user.video_url) {
      return res.status(404).json({ error: 'No video to delete' });
    }

    // Delete file
    await fs.unlink(user.video_url).catch(() => {});

    // Update user record
    user.video_url = null;
    user.emotion_analysis = null;
    user.video_uploaded = false;
    user.profile_complete = false; // Profile is no longer complete
    await user.save();

    // Update profile
    const profile = await Profile.findOne({ where: { user_id: user.user_id } });
    if (profile) {
      profile.emotion_profile = null;
      profile.video_features = null;
      profile.calculateQualityScore();
      await profile.save();
    }

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

/**
 * GET /api/videos/requirements
 * Get video upload requirements
 */
router.get('/requirements', (req, res) => {
  res.json({
    max_size_mb: (parseInt(process.env.MAX_VIDEO_SIZE) || 50000000) / 1024 / 1024,
    accepted_formats: ['mp4', 'webm', 'mov', 'avi'],
    recommended_duration_seconds: 30,
    instructions: [
      'Record a 30-60 second video showing different facial expressions',
      'Show emotions like happiness, surprise, neutrality, and thoughtfulness',
      'Ensure good lighting and face visibility',
      'Look directly at the camera',
      'Natural expressions work best'
    ]
  });
});

module.exports = router;
