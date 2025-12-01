const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateJWT, requireActiveUser } = require('../middleware/auth');
const { Profile, User } = require('../models');

/**
 * POST /api/profiles
 * Create or update user profile
 */
router.post('/', authenticateJWT, requireActiveUser, [
  body('personality_traits').optional().isObject(),
  body('questionnaire_responses').optional().isArray(),
  body('preferences').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.user_id;
    const {
      personality_traits,
      questionnaire_responses,
      attention_checks,
      preferences
    } = req.body;

    // Find or create profile
    let profile = await Profile.findOne({ where: { user_id: userId } });

    if (!profile) {
      profile = await Profile.create({ user_id: userId });
    }

    // Update profile fields
    if (personality_traits) {
      profile.personality_traits = personality_traits;
    }

    if (questionnaire_responses) {
      profile.questionnaire_responses = questionnaire_responses;

      // Calculate average response time
      const responseTimes = questionnaire_responses
        .filter(r => r.responseTime)
        .map(r => r.responseTime);

      if (responseTimes.length > 0) {
        const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        profile.response_time_avg_ms = avgTime;
      }

      // Update user's questionnaire_complete flag
      if (questionnaire_responses.length >= 50) {
        await User.update(
          { questionnaire_complete: true },
          { where: { user_id: userId } }
        );
      }
    }

    if (attention_checks) {
      profile.attention_checks = attention_checks;
    }

    if (preferences) {
      profile.preferences = { ...profile.preferences, ...preferences };
    }

    // Calculate profile quality score
    profile.calculateQualityScore();

    await profile.save();

    // Check if profile is complete
    const user = await User.findByPk(userId);
    if (user.questionnaire_complete && user.video_uploaded && !user.profile_complete) {
      user.profile_complete = true;
      await user.save();
    }

    res.json({
      message: 'Profile updated successfully',
      profile: {
        profile_id: profile.profile_id,
        personality_traits: profile.personality_traits,
        profile_quality_score: profile.profile_quality_score,
        is_visible: profile.is_visible
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * GET /api/profiles/me
 * Get current user's profile
 */
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      where: { user_id: req.user.user_id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['user_id', 'email', 'age', 'profile_complete', 'questionnaire_complete', 'video_uploaded']
      }]
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * PATCH /api/profiles/visibility
 * Update profile visibility settings
 */
router.patch('/visibility', authenticateJWT, requireActiveUser, [
  body('is_visible').optional().isBoolean(),
  body('is_searchable').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { is_visible, is_searchable } = req.body;

    const profile = await Profile.findOne({
      where: { user_id: req.user.user_id }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (typeof is_visible !== 'undefined') {
      profile.is_visible = is_visible;
    }

    if (typeof is_searchable !== 'undefined') {
      profile.is_searchable = is_searchable;
    }

    await profile.save();

    res.json({
      message: 'Visibility settings updated',
      is_visible: profile.is_visible,
      is_searchable: profile.is_searchable
    });
  } catch (error) {
    console.error('Update visibility error:', error);
    res.status(500).json({ error: 'Failed to update visibility' });
  }
});

/**
 * PATCH /api/profiles/preferences
 * Update matching preferences
 */
router.patch('/preferences', authenticateJWT, requireActiveUser, [
  body('min_age').optional().isInt({ min: 18, max: 120 }),
  body('max_age').optional().isInt({ min: 18, max: 120 }),
  body('preferred_genders').optional().isArray(),
  body('max_distance_km').optional().isInt({ min: 1, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const profile = await Profile.findOne({
      where: { user_id: req.user.user_id }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Update preferences
    profile.preferences = { ...profile.preferences, ...req.body };
    await profile.save();

    res.json({
      message: 'Preferences updated',
      preferences: profile.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

/**
 * GET /api/profiles/stats
 * Get profile statistics
 */
router.get('/stats', authenticateJWT, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      where: { user_id: req.user.user_id }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      total_matches_shown: profile.total_matches_shown,
      total_unlocks_received: profile.total_unlocks_received,
      profile_quality_score: profile.profile_quality_score,
      last_match_shown_at: profile.last_match_shown_at
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router;
