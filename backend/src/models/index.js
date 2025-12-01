const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import database configuration (supports PostgreSQL and SQLite)
const sequelize = require('../config/database');

// Import models
const User = require('./User')(sequelize);
const Profile = require('./Profile')(sequelize);
const Match = require('./Match')(sequelize);
const Payment = require('./Payment')(sequelize);
const Message = require('./Message')(sequelize);

// Define associations
// User <-> Profile (1:1)
User.hasOne(Profile, {
  foreignKey: 'user_id',
  as: 'profile',
  onDelete: 'CASCADE'
});
Profile.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User <-> Match (1:many as viewer)
User.hasMany(Match, {
  foreignKey: 'viewer_user_id',
  as: 'viewedMatches',
  onDelete: 'CASCADE'
});
Match.belongsTo(User, {
  foreignKey: 'viewer_user_id',
  as: 'viewer'
});

// User <-> Match (1:many as matched user)
User.hasMany(Match, {
  foreignKey: 'matched_user_id',
  as: 'receivedMatches',
  onDelete: 'CASCADE'
});
Match.belongsTo(User, {
  foreignKey: 'matched_user_id',
  as: 'matchedUser'
});

// User <-> Payment (1:many)
User.hasMany(Payment, {
  foreignKey: 'user_id',
  as: 'payments',
  onDelete: 'CASCADE'
});
Payment.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Match <-> Payment (1:1)
Match.hasOne(Payment, {
  foreignKey: 'match_id',
  as: 'payment'
});
Payment.belongsTo(Match, {
  foreignKey: 'match_id',
  as: 'match'
});

// Match <-> Message (1:many)
Match.hasMany(Message, {
  foreignKey: 'match_id',
  as: 'messages',
  onDelete: 'CASCADE'
});
Message.belongsTo(Match, {
  foreignKey: 'match_id',
  as: 'match'
});

// User <-> Message (1:many as sender)
User.hasMany(Message, {
  foreignKey: 'sender_user_id',
  as: 'sentMessages',
  onDelete: 'CASCADE'
});
Message.belongsTo(User, {
  foreignKey: 'sender_user_id',
  as: 'sender'
});

// User <-> Message (1:many as receiver)
User.hasMany(Message, {
  foreignKey: 'receiver_user_id',
  as: 'receivedMessages',
  onDelete: 'CASCADE'
});
Message.belongsTo(User, {
  foreignKey: 'receiver_user_id',
  as: 'receiver'
});

// Export database instance and models
const db = {
  sequelize,
  Sequelize,
  User,
  Profile,
  Match,
  Payment,
  Message
};

// Sync database (for development)
if (process.env.NODE_ENV === 'development') {
  sequelize.sync({ alter: false })
    .then(() => {
      console.log('✓ Database synchronized');
    })
    .catch(err => {
      console.error('✗ Database sync error:', err);
    });
}

module.exports = db;
