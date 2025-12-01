const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    user_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },

    // Authentication fields
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },

    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true  // Null for Google OAuth users
    },

    google_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },

    // OTP/2FA fields
    otp_secret: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    otp_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    // Basic profile data (encrypted)
    encrypted_gender: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted gender (male/female/other)'
    },

    encrypted_location: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted location data (city, country)'
    },

    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 18,
        max: 120
      }
    },

    age_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    // Profile completion status
    profile_complete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    questionnaire_complete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    video_uploaded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    // Video analysis results
    video_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'S3 URL or path to uploaded video'
    },

    emotion_analysis: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'TensorFlow.js emotion detection results'
    },

    // Account status
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    is_banned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },

    // Privacy consent
    consent_version: {
      type: DataTypes.STRING(50),
      allowNull: true
    },

    consent_timestamp: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['email'], unique: true },
      { fields: ['google_id'], unique: true, sparse: true },
      { fields: ['is_active'] },
      { fields: ['profile_complete'] }
    ]
  });

  // Instance methods
  User.prototype.setPassword = async function(password) {
    this.password_hash = await bcrypt.hash(password, 12);
  };

  User.prototype.validatePassword = async function(password) {
    if (!this.password_hash) return false;
    return await bcrypt.compare(password, this.password_hash);
  };

  User.prototype.encryptField = function(value, encryptionKey) {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(encryptionKey, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  };

  User.prototype.decryptField = function(encryptedValue, encryptionKey) {
    if (!encryptedValue) return null;
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(encryptionKey, 'hex');
    const parts = encryptedValue.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  };

  User.prototype.toSafeObject = function(encryptionKey) {
    return {
      user_id: this.user_id,
      email: this.email,
      gender: this.encrypted_gender ? this.decryptField(this.encrypted_gender, encryptionKey) : null,
      location: this.encrypted_location ? this.decryptField(this.encrypted_location, encryptionKey) : null,
      age: this.age,
      profile_complete: this.profile_complete,
      questionnaire_complete: this.questionnaire_complete,
      video_uploaded: this.video_uploaded,
      email_verified: this.email_verified,
      created_at: this.created_at
    };
  };

  return User;
};
