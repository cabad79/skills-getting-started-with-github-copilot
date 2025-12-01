const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Profile = sequelize.define('Profile', {
    profile_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onDelete: 'CASCADE'
    },

    // Big Five personality traits (stored as JSONB for flexibility)
    personality_traits: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Big Five scores with uncertainty: {openness: {score, uncertainty}, ...}'
    },

    // IPIP-50 questionnaire responses
    questionnaire_responses: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Array of {itemId, response, responseTime}'
    },

    // Attention check results
    attention_checks: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Array of {itemNumber, passed, timestamp}'
    },

    // Video emotion analysis
    emotion_profile: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Aggregated emotion detection results from video analysis'
    },

    video_features: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Extracted facial features and gesture patterns'
    },

    // Matching preferences
    preferences: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        min_age: 18,
        max_age: 99,
        preferred_genders: ['male', 'female', 'other'],
        max_distance_km: 50
      },
      comment: 'User matching preferences'
    },

    // Profile visibility
    is_visible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether profile appears in matching'
    },

    is_searchable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    // Profile quality metrics
    profile_quality_score: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 1
      },
      comment: 'Composite quality score (0-1) based on completeness and response quality'
    },

    response_time_avg_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Average questionnaire response time for quality assessment'
    },

    // Match statistics
    total_matches_shown: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'How many times this profile was shown to others'
    },

    total_unlocks_received: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'How many times others paid to unlock this profile'
    },

    last_match_shown_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'], unique: true },
      { fields: ['is_visible'] },
      { fields: ['is_searchable'] },
      { fields: ['profile_quality_score'] },
      {
        fields: ['personality_traits'],
        using: 'gin',
        comment: 'GIN index for JSONB queries'
      }
    ]
  });

  // Instance methods
  Profile.prototype.calculateQualityScore = function() {
    let score = 0;
    let components = 0;

    // Questionnaire completion (40%)
    if (this.questionnaire_responses && this.questionnaire_responses.length >= 50) {
      score += 0.4;
    }
    components++;

    // Video upload (30%)
    if (this.emotion_profile && Object.keys(this.emotion_profile).length > 0) {
      score += 0.3;
    }
    components++;

    // Attention checks passed (20%)
    if (this.attention_checks && this.attention_checks.length > 0) {
      const passedChecks = this.attention_checks.filter(c => c.passed).length;
      const totalChecks = this.attention_checks.length;
      score += 0.2 * (passedChecks / totalChecks);
    }
    components++;

    // Response time quality (10% - penalize very fast responses)
    if (this.response_time_avg_ms) {
      const avgSeconds = this.response_time_avg_ms / 1000;
      if (avgSeconds >= 2 && avgSeconds <= 30) {
        score += 0.1; // Good response time
      } else if (avgSeconds < 2) {
        score += 0.05; // Too fast, might be random clicking
      } else {
        score += 0.08; // Slow but acceptable
      }
    }
    components++;

    this.profile_quality_score = score;
    return score;
  };

  Profile.prototype.getPersonalityVector = function() {
    if (!this.personality_traits) return null;

    return {
      openness: this.personality_traits.openness?.score || 0,
      conscientiousness: this.personality_traits.conscientiousness?.score || 0,
      extraversion: this.personality_traits.extraversion?.score || 0,
      agreeableness: this.personality_traits.agreeableness?.score || 0,
      neuroticism: this.personality_traits.neuroticism?.score || 0
    };
  };

  Profile.prototype.getUncertaintyVector = function() {
    if (!this.personality_traits) return null;

    return {
      openness: this.personality_traits.openness?.uncertainty || 1.0,
      conscientiousness: this.personality_traits.conscientiousness?.uncertainty || 1.0,
      extraversion: this.personality_traits.extraversion?.uncertainty || 1.0,
      agreeableness: this.personality_traits.agreeableness?.uncertainty || 1.0,
      neuroticism: this.personality_traits.neuroticism?.uncertainty || 1.0
    };
  };

  return Profile;
};
