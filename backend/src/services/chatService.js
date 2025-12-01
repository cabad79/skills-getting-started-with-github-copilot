const { Server } = require('socket.io');
const { Message, Match, User } = require('../models');
const { verifyToken } = require('../middleware/auth');

class ChatService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> socketId mapping
  }

  /**
   * Initialize Socket.io
   * @param {object} server - HTTP server instance
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const payload = verifyToken(token);
        const user = await User.findByPk(payload.user_id);

        if (!user || !user.is_active || user.is_banned) {
          return next(new Error('Invalid user'));
        }

        socket.userId = user.user_id;
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('✓ Socket.io chat service initialized');
  }

  /**
   * Handle new socket connection
   * @param {object} socket - Socket instance
   */
  handleConnection(socket) {
    const userId = socket.userId;
    console.log(`User connected: ${userId}`);

    // Track user's socket
    this.userSockets.set(userId, socket.id);

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Send connection confirmation
    socket.emit('connected', {
      userId,
      message: 'Connected to chat service'
    });

    // Handle join match room
    socket.on('join_match', async (data) => {
      await this.handleJoinMatch(socket, data);
    });

    // Handle send message
    socket.on('send_message', async (data) => {
      await this.handleSendMessage(socket, data);
    });

    // Handle mark as read
    socket.on('mark_read', async (data) => {
      await this.handleMarkAsRead(socket, data);
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      this.handleTyping(socket, data);
    });

    // Handle stop typing
    socket.on('stop_typing', (data) => {
      this.handleStopTyping(socket, data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  /**
   * Handle join match room
   */
  async handleJoinMatch(socket, { match_id }) {
    try {
      const userId = socket.userId;

      // Verify user has access to this match
      const match = await Match.findOne({
        where: {
          match_id,
          is_unlocked: true
        }
      });

      if (!match) {
        return socket.emit('error', { message: 'Match not found or not unlocked' });
      }

      // Verify user is part of this match
      if (match.viewer_user_id !== userId && match.matched_user_id !== userId) {
        return socket.emit('error', { message: 'Unauthorized access to match' });
      }

      // Join match room
      const roomName = `match:${match_id}`;
      socket.join(roomName);

      // Get conversation history
      const messages = await Message.getConversation(match_id, 50, 0);
      const decryptedMessages = messages.map(msg =>
        msg.toSafeObject(process.env.ENCRYPTION_KEY)
      );

      socket.emit('match_joined', {
        match_id,
        messages: decryptedMessages.reverse() // Oldest first
      });

      // Notify other user that this user joined
      const otherUserId = match.viewer_user_id === userId ?
        match.matched_user_id : match.viewer_user_id;

      this.io.to(`user:${otherUserId}`).emit('user_joined_match', {
        match_id,
        user_id: userId
      });
    } catch (error) {
      console.error('Join match error:', error);
      socket.emit('error', { message: 'Failed to join match' });
    }
  }

  /**
   * Handle send message
   */
  async handleSendMessage(socket, { match_id, content, message_type = 'text' }) {
    try {
      const senderId = socket.userId;

      // Get match
      const match = await Match.findOne({
        where: {
          match_id,
          is_unlocked: true,
          chat_enabled: true
        }
      });

      if (!match) {
        return socket.emit('error', { message: 'Chat not available for this match' });
      }

      // Verify sender is part of match
      if (match.viewer_user_id !== senderId && match.matched_user_id !== senderId) {
        return socket.emit('error', { message: 'Unauthorized' });
      }

      // Determine receiver
      const receiverId = match.viewer_user_id === senderId ?
        match.matched_user_id : match.viewer_user_id;

      // Create message
      const message = await Message.create({
        match_id,
        sender_user_id: senderId,
        receiver_user_id: receiverId,
        message_type
      });

      // Encrypt and save content
      message.encryptContent(content, process.env.ENCRYPTION_KEY);
      await message.save();

      // Mark as delivered if receiver is online
      const receiverSocketId = this.userSockets.get(receiverId);
      if (receiverSocketId) {
        await message.markAsDelivered();
      }

      // Broadcast to match room
      const messageData = message.toSafeObject(process.env.ENCRYPTION_KEY);

      this.io.to(`match:${match_id}`).emit('new_message', messageData);

      // Send notification to receiver
      this.io.to(`user:${receiverId}`).emit('message_notification', {
        match_id,
        sender_id: senderId,
        preview: content.substring(0, 50)
      });
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  /**
   * Handle mark messages as read
   */
  async handleMarkAsRead(socket, { match_id }) {
    try {
      const userId = socket.userId;

      await Message.markConversationAsRead(match_id, userId);

      socket.emit('messages_marked_read', { match_id });

      // Notify sender that their messages were read
      const match = await Match.findByPk(match_id);
      if (match) {
        const otherUserId = match.viewer_user_id === userId ?
          match.matched_user_id : match.viewer_user_id;

        this.io.to(`user:${otherUserId}`).emit('messages_read', {
          match_id,
          read_by: userId
        });
      }
    } catch (error) {
      console.error('Mark as read error:', error);
      socket.emit('error', { message: 'Failed to mark as read' });
    }
  }

  /**
   * Handle typing indicator
   */
  handleTyping(socket, { match_id }) {
    const userId = socket.userId;
    socket.to(`match:${match_id}`).emit('user_typing', {
      match_id,
      user_id: userId
    });
  }

  /**
   * Handle stop typing
   */
  handleStopTyping(socket, { match_id }) {
    const userId = socket.userId;
    socket.to(`match:${match_id}`).emit('user_stopped_typing', {
      match_id,
      user_id: userId
    });
  }

  /**
   * Handle disconnect
   */
  handleDisconnect(socket) {
    const userId = socket.userId;
    console.log(`User disconnected: ${userId}`);

    // Remove from tracking
    this.userSockets.delete(userId);

    // Broadcast to all match rooms this user was in
    // (Socket.io automatically removes them from rooms on disconnect)
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId) {
    return await Message.getUnreadCount(userId);
  }

  /**
   * Send notification to user
   */
  sendNotification(userId, event, data) {
    this.io.to(`user:${userId}`).emit(event, data);
  }
}

module.exports = new ChatService();
