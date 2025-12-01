const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const Message = sequelize.define('Message', {
    message_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },

    match_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'matches',
        key: 'match_id'
      },
      onDelete: 'CASCADE'
    },

    sender_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onDelete: 'CASCADE'
    },

    receiver_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onDelete: 'CASCADE'
    },

    // Message content (encrypted)
    encrypted_content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'AES-256 encrypted message content'
    },

    // Message metadata
    message_type: {
      type: DataTypes.ENUM('text', 'image', 'system'),
      defaultValue: 'text',
      allowNull: false
    },

    // Read status
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },

    read_at: {
      type: DataTypes.DATE,
      allowNull: true
    },

    // Delivery status
    is_delivered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },

    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true
    },

    // Message state
    is_deleted_by_sender: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    is_deleted_by_receiver: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },

    // Moderation
    is_flagged: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    flag_reason: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    flagged_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    createdAt: 'sent_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['match_id'] },
      { fields: ['sender_user_id'] },
      { fields: ['receiver_user_id'] },
      { fields: ['sent_at'] },
      { fields: ['is_read'] },
      { fields: ['is_flagged'] },
      {
        fields: ['match_id', 'sent_at'],
        comment: 'Efficient retrieval of chat history'
      }
    ]
  });

  // Class methods
  Message.getConversation = async function(matchId, limit = 50, offset = 0) {
    return await this.findAll({
      where: {
        match_id: matchId,
        is_deleted_by_sender: false,
        is_deleted_by_receiver: false
      },
      order: [['sent_at', 'DESC']],
      limit,
      offset
    });
  };

  Message.getUnreadCount = async function(userId) {
    return await this.count({
      where: {
        receiver_user_id: userId,
        is_read: false,
        is_deleted_by_receiver: false
      }
    });
  };

  Message.markConversationAsRead = async function(matchId, userId) {
    return await this.update(
      {
        is_read: true,
        read_at: new Date()
      },
      {
        where: {
          match_id: matchId,
          receiver_user_id: userId,
          is_read: false
        }
      }
    );
  };

  // Instance methods
  Message.prototype.encryptContent = function(content, encryptionKey) {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(encryptionKey, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    this.encrypted_content = iv.toString('hex') + ':' + encrypted;
  };

  Message.prototype.decryptContent = function(encryptionKey) {
    if (!this.encrypted_content) return null;
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(encryptionKey, 'hex');
    const parts = this.encrypted_content.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  };

  Message.prototype.markAsRead = async function() {
    if (!this.is_read) {
      this.is_read = true;
      this.read_at = new Date();
      await this.save();
    }
  };

  Message.prototype.markAsDelivered = async function() {
    if (!this.is_delivered) {
      this.is_delivered = true;
      this.delivered_at = new Date();
      await this.save();
    }
  };

  Message.prototype.flag = async function(reason) {
    this.is_flagged = true;
    this.flag_reason = reason;
    this.flagged_at = new Date();
    await this.save();
  };

  Message.prototype.toSafeObject = function(encryptionKey) {
    return {
      message_id: this.message_id,
      match_id: this.match_id,
      sender_user_id: this.sender_user_id,
      receiver_user_id: this.receiver_user_id,
      content: this.decryptContent(encryptionKey),
      message_type: this.message_type,
      is_read: this.is_read,
      sent_at: this.sent_at,
      read_at: this.read_at
    };
  };

  return Message;
};
