const express = require('express');
const router = express.Router();
const { authenticateJWT, requireActiveUser, requireCompleteProfile } = require('../middleware/auth');
const { Match } = require('../models');
const matchingService = require('../services/matchingService');

/**
 * GET /api/matches/next
 * Get next match for user (ONE match at a time)
 */
router.get('/next', authenticateJWT, requireActiveUser, requireCompleteProfile, async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Check if user can receive matches
    const canReceive = await matchingService.canReceiveMatches(userId);
    if (!canReceive) {
      return res.status(403).json({
        error: 'Cannot receive matches',
        message: 'Please complete your profile first'
      });
    }

    // Check if there's already an active (unviewed) match
    const existingMatch = await Match.findActiveMatchForUser(userId);
    if (existingMatch) {
      // Return existing active match instead of creating new one
      const matchDetails = await matchingService.getMatchDetails(existingMatch.match_id, userId);
      return res.json({
        match: matchDetails,
        is_new: false
      });
    }

    // Find next match
    const match = await matchingService.findNextMatch(userId);

    if (!match) {
      return res.status(404).json({
        error: 'No matches available',
        message: 'We couldn\'t find any more matches for you at this time. Check back later!'
      });
    }

    // Get match details
    const matchDetails = await matchingService.getMatchDetails(match.match_id, userId);

    res.json({
      match: matchDetails,
      is_new: true
    });
  } catch (error) {
    console.error('Get next match error:', error);
    res.status(500).json({ error: 'Failed to get match' });
  }
});

/**
 * GET /api/matches/:matchId
 * Get specific match details
 */
router.get('/:matchId', authenticateJWT, requireActiveUser, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.user_id;

    const matchDetails = await matchingService.getMatchDetails(matchId, userId);

    res.json({ match: matchDetails });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ error: 'Failed to get match details' });
  }
});

/**
 * POST /api/matches/:matchId/like
 * Like a match
 */
router.post('/:matchId/like', authenticateJWT, requireActiveUser, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.user_id;

    const match = await Match.findOne({
      where: {
        match_id: matchId,
        viewer_user_id: userId
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    await match.like();

    res.json({
      message: 'Match liked',
      is_mutual: match.is_mutual
    });
  } catch (error) {
    console.error('Like match error:', error);
    res.status(500).json({ error: 'Failed to like match' });
  }
});

/**
 * POST /api/matches/:matchId/reject
 * Reject/pass on a match
 */
router.post('/:matchId/reject', authenticateJWT, requireActiveUser, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.user_id;

    const match = await Match.findOne({
      where: {
        match_id: matchId,
        viewer_user_id: userId
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    await match.reject();

    res.json({ message: 'Match rejected' });
  } catch (error) {
    console.error('Reject match error:', error);
    res.status(500).json({ error: 'Failed to reject match' });
  }
});

/**
 * GET /api/matches/unlocked/list
 * Get all unlocked matches
 */
router.get('/unlocked/list', authenticateJWT, requireActiveUser, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const matches = await Match.findAll({
      where: {
        viewer_user_id: userId,
        is_unlocked: true
      },
      order: [['unlocked_at', 'DESC']],
      limit,
      offset
    });

    // Get detailed info for each match
    const detailedMatches = await Promise.all(
      matches.map(m => matchingService.getMatchDetails(m.match_id, userId))
    );

    res.json({
      matches: detailedMatches,
      total: matches.length
    });
  } catch (error) {
    console.error('Get unlocked matches error:', error);
    res.status(500).json({ error: 'Failed to get unlocked matches' });
  }
});

/**
 * GET /api/matches/history
 * Get match history (all matches)
 */
router.get('/history', authenticateJWT, requireActiveUser, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const matches = await Match.findAll({
      where: { viewer_user_id: userId },
      order: [['shown_at', 'DESC']],
      limit,
      offset,
      attributes: ['match_id', 'similarity_score', 'status', 'shown_at', 'unlocked_at', 'is_unlocked', 'is_mutual']
    });

    res.json({
      matches,
      total: matches.length
    });
  } catch (error) {
    console.error('Get match history error:', error);
    res.status(500).json({ error: 'Failed to get match history' });
  }
});

module.exports = router;
