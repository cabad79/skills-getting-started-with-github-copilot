const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Match = sequelize.define('Match', {
    match_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },

    // User who is viewing the match
    viewer_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onDelete: 'CASCADE'
    },

    // User being shown as a match
    matched_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onDelete: 'CASCADE'
    },

    // Match score and metadata
    similarity_score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 1
      },
      comment: 'Mahalanobis distance-based similarity score (0-1)'
    },

    compatibility_breakdown: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Per-trait compatibility scores for explanation'
    },

    // Match status
    status: {
      type: DataTypes.ENUM('shown', 'unlocked', 'rejected', 'expired'),
      defaultValue: 'shown',
      allowNull: false
    },

    shown_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },

    unlocked_at: {
      type: DataTypes.DATE,
      allowNull: true
    },

    rejected_at: {
      type: DataTypes.DATE,
      allowNull: true
    },

    // Payment tracking
    is_unlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },

    payment_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'payments',
        key: 'payment_id'
      }
    },

    // User interactions
    viewer_interest: {
      type: DataTypes.ENUM('like', 'pass', 'undecided'),
      allowNull: true
    },

    matched_user_interest: {
      type: DataTypes.ENUM('like', 'pass', 'undecided'),
      allowNull: true
    },

    is_mutual: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'True if both users liked each other'
    },

    // Chat availability
    chat_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'True if match is unlocked and chat can begin'
    },

    // Expiration
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Match expires if not unlocked within timeframe'
    }
  }, {
    tableName: 'matches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['viewer_user_id'] },
      { fields: ['matched_user_id'] },
      { fields: ['status'] },
      { fields: ['is_unlocked'] },
      { fields: ['is_mutual'] },
      { fields: ['shown_at'] },
      { fields: ['expires_at'] },
      {
        fields: ['viewer_user_id', 'matched_user_id'],
        unique: true,
        comment: 'Ensure each pair only has one match record'
      }
    ]
  });

  // Class methods
  Match.findActiveMatchForUser = async function(userId) {
    return await this.findOne({
      where: {
        viewer_user_id: userId,
        status: 'shown',
        is_unlocked: false
      },
      order: [['shown_at', 'DESC']]
    });
  };

  Match.findUnlockedMatches = async function(userId) {
    return await this.findAll({
      where: {
        viewer_user_id: userId,
        is_unlocked: true
      },
      order: [['unlocked_at', 'DESC']]
    });
  };

  Match.checkMutualMatch = async function(user1Id, user2Id) {
    const match1 = await this.findOne({
      where: {
        viewer_user_id: user1Id,
        matched_user_id: user2Id,
        viewer_interest: 'like'
      }
    });

    const match2 = await this.findOne({
      where: {
        viewer_user_id: user2Id,
        matched_user_id: user1Id,
        matched_user_interest: 'like'
      }
    });

    return match1 && match2;
  };

  // Instance methods
  Match.prototype.unlock = async function(paymentId) {
    this.is_unlocked = true;
    this.unlocked_at = new Date();
    this.payment_id = paymentId;
    this.status = 'unlocked';
    this.chat_enabled = true;
    await this.save();
  };

  Match.prototype.reject = async function() {
    this.status = 'rejected';
    this.rejected_at = new Date();
    this.viewer_interest = 'pass';
    await this.save();
  };

  Match.prototype.like = async function() {
    this.viewer_interest = 'like';
    await this.save();

    // Check if mutual
    const reciprocal = await Match.findOne({
      where: {
        viewer_user_id: this.matched_user_id,
        matched_user_id: this.viewer_user_id
      }
    });

    if (reciprocal && reciprocal.viewer_interest === 'like') {
      this.is_mutual = true;
      reciprocal.is_mutual = true;
      await Promise.all([this.save(), reciprocal.save()]);
    }
  };

  return Match;
};
