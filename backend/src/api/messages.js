const express = require('express');
const router = express.Router();
const { authenticateJWT, requireActiveUser } = require('../middleware/auth');
const { Message, Match } = require('../models');
const chatService = require('../services/chatService');

/**
 * GET /api/messages/match/:matchId
 * Get messages for a specific match
 */
router.get('/match/:matchId', authenticateJWT, requireActiveUser, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.user_id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    // Verify user has access to this match
    const match = await Match.findOne({
      where: {
        match_id: matchId,
        is_unlocked: true
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found or not unlocked' });
    }

    // Verify user is part of this match
    if (match.viewer_user_id !== userId && match.matched_user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get messages
    const messages = await Message.getConversation(matchId, limit, offset);

    // Decrypt messages
    const decryptedMessages = messages.map(msg =>
      msg.toSafeObject(process.env.ENCRYPTION_KEY)
    );

    res.json({
      messages: decryptedMessages.reverse(), // Oldest first
      total: messages.length
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

/**
 * GET /api/messages/unread
 * Get unread message count
 */
router.get('/unread', authenticateJWT, requireActiveUser, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const count = await chatService.getUnreadCount(userId);

    res.json({ unread_count: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

/**
 * GET /api/messages/conversations
 * Get all conversations for user
 */
router.get('/conversations', authenticateJWT, requireActiveUser, async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Get all unlocked matches
    const matches = await Match.findAll({
      where: {
        is_unlocked: true
      },
      include: [
        {
          model: Message,
          as: 'messages',
          limit: 1,
          order: [['sent_at', 'DESC']],
          required: false
        }
      ],
      order: [['unlocked_at', 'DESC']]
    });

    // Filter matches where user is involved
    const userMatches = matches.filter(m =>
      m.viewer_user_id === userId || m.matched_user_id === userId
    );

    // Format conversations
    const conversations = await Promise.all(
      userMatches.map(async (match) => {
        const otherUserId = match.viewer_user_id === userId ?
          match.matched_user_id : match.viewer_user_id;

        const unreadCount = await Message.count({
          where: {
            match_id: match.match_id,
            receiver_user_id: userId,
            is_read: false
          }
        });

        const lastMessage = match.messages && match.messages[0] ?
          match.messages[0].toSafeObject(process.env.ENCRYPTION_KEY) : null;

        return {
          match_id: match.match_id,
          other_user_id: otherUserId,
          last_message: lastMessage,
          unread_count: unreadCount,
          unlocked_at: match.unlocked_at
        };
      })
    );

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

/**
 * DELETE /api/messages/:messageId
 * Delete a message (soft delete)
 */
router.delete('/:messageId', authenticateJWT, requireActiveUser, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.user_id;

    const message = await Message.findByPk(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only sender can delete their own messages
    if (message.sender_user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    message.is_deleted_by_sender = true;
    message.deleted_at = new Date();
    await message.save();

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

/**
 * POST /api/messages/:messageId/flag
 * Flag a message for moderation
 */
router.post('/:messageId/flag', authenticateJWT, requireActiveUser, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reason } = req.body;
    const userId = req.user.user_id;

    const message = await Message.findByPk(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only receiver can flag messages
    if (message.receiver_user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await message.flag(reason || 'Inappropriate content');

    res.json({ message: 'Message flagged for review' });
  } catch (error) {
    console.error('Flag message error:', error);
    res.status(500).json({ error: 'Failed to flag message' });
  }
});

module.exports = router;
