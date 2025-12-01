const jwt = require('jsonwebtoken');
const passport = require('../config/passport');
const { User } = require('../models');

/**
 * JWT Authentication Middleware
 */
const authenticateJWT = passport.authenticate('jwt', { session: false });

/**
 * Generate JWT token
 * @param {object} user - User object
 * @returns {string} JWT token
 */
function generateToken(user) {
  const payload = {
    user_id: user.user_id,
    email: user.email
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

/**
 * Verify JWT token manually (for socket.io or custom use)
 * @param {string} token - JWT token
 * @returns {object} Decoded payload
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Middleware to check if user has completed profile
 */
async function requireCompleteProfile(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findByPk(req.user.user_id, {
      include: ['profile']
    });

    if (!user.profile_complete) {
      return res.status(403).json({
        error: 'Profile incomplete',
        message: 'Please complete your profile before accessing this feature',
        required: {
          questionnaire: !user.questionnaire_complete,
          video: !user.video_uploaded
        }
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}

/**
 * Middleware to check if email is verified
 */
function requireEmailVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!req.user.email_verified) {
    return res.status(403).json({
      error: 'Email not verified',
      message: 'Please verify your email before accessing this feature'
    });
  }

  next();
}

/**
 * Middleware to check if OTP/2FA is verified
 */
function requireOTPVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!req.user.otp_verified) {
    return res.status(403).json({
      error: 'OTP not verified',
      message: 'Please complete two-factor authentication'
    });
  }

  next();
}

/**
 * Middleware to check if user is active
 */
function requireActiveUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!req.user.is_active) {
    return res.status(403).json({
      error: 'Account inactive',
      message: 'Your account has been deactivated'
    });
  }

  if (req.user.is_banned) {
    return res.status(403).json({
      error: 'Account banned',
      message: 'Your account has been banned'
    });
  }

  next();
}

/**
 * Optional authentication - attaches user if token is valid, but doesn't fail if missing
 */
const optionalAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

module.exports = {
  authenticateJWT,
  generateToken,
  verifyToken,
  requireCompleteProfile,
  requireEmailVerified,
  requireOTPVerified,
  requireActiveUser,
  optionalAuth
};
