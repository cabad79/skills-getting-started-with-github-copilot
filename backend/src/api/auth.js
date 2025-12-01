const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const passport = require('../config/passport');
const { User } = require('../models');
const { generateToken, authenticateJWT } = require('../middleware/auth');
const otpService = require('../services/otpService');
const emailService = require('../services/emailService');

// Temporary OTP storage (in production, use Redis with TTL)
const otpStore = new Map();

/**
 * POST /api/auth/register
 * Register with email and password
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('age').optional().isInt({ min: 18, max: 120 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, age, gender, location } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user
    const user = await User.create({
      email,
      age,
      age_verified: false
    });

    // Set password
    await user.setPassword(password);
    await user.save();

    // Encrypt and store gender/location if provided
    if (gender) {
      user.encrypted_gender = user.encryptField(gender, process.env.ENCRYPTION_KEY);
    }
    if (location) {
      user.encrypted_location = user.encryptField(location, process.env.ENCRYPTION_KEY);
    }
    await user.save();

    // Generate OTP secret
    const otpSecret = otpService.generateSecret();
    user.otp_secret = otpSecret;
    await user.save();

    // Generate and send OTP
    const otp = otpService.generateNumericOTP();
    const otpHash = otpService.hashOTP(otp, otpSecret);

    // Store OTP hash temporarily (5 minutes)
    otpStore.set(user.user_id, {
      hash: otpHash,
      expires: Date.now() + 5 * 60 * 1000,
      attempts: 0
    });

    // Send OTP email
    await emailService.sendOTP(email, otp);

    res.status(201).json({
      message: 'User registered successfully. Please verify OTP sent to your email.',
      user_id: user.user_id,
      email: user.email,
      requires_otp: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Validate password
    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if account is active
    if (!user.is_active || user.is_banned) {
      return res.status(403).json({ error: 'Account is not active' });
    }

    // Generate and send OTP for 2FA
    const otp = otpService.generateNumericOTP();
    const otpHash = otpService.hashOTP(otp, user.otp_secret);

    // Store OTP hash temporarily
    otpStore.set(user.user_id, {
      hash: otpHash,
      expires: Date.now() + 5 * 60 * 1000,
      attempts: 0
    });

    // Send OTP email
    await emailService.sendOTP(email, otp);

    res.json({
      message: 'OTP sent to your email',
      user_id: user.user_id,
      requires_otp: true
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and complete login
 */
router.post('/verify-otp', [
  body('user_id').isUUID(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user_id, otp } = req.body;

    // Find user
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get stored OTP data
    const otpData = otpStore.get(user_id);
    if (!otpData) {
      return res.status(400).json({ error: 'OTP expired or not found' });
    }

    // Check expiration
    if (Date.now() > otpData.expires) {
      otpStore.delete(user_id);
      return res.status(400).json({ error: 'OTP expired' });
    }

    // Check attempts (max 3)
    if (otpData.attempts >= 3) {
      otpStore.delete(user_id);
      return res.status(429).json({ error: 'Too many failed attempts' });
    }

    // Verify OTP
    const isValid = otpService.verifyOTPHash(otp, otpData.hash, user.otp_secret);
    if (!isValid) {
      otpData.attempts++;
      otpStore.set(user_id, otpData);
      return res.status(401).json({
        error: 'Invalid OTP',
        attempts_remaining: 3 - otpData.attempts
      });
    }

    // OTP verified successfully
    otpStore.delete(user_id);
    user.otp_verified = true;
    user.email_verified = true;
    user.last_login = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: user.toSafeObject(process.env.ENCRYPTION_KEY)
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /api/auth/resend-otp
 * Resend OTP
 */
router.post('/resend-otp', [
  body('user_id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user_id } = req.body;

    // Find user
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new OTP
    const otp = otpService.generateNumericOTP();
    const otpHash = otpService.hashOTP(otp, user.otp_secret);

    // Store OTP hash
    otpStore.set(user_id, {
      hash: otpHash,
      expires: Date.now() + 5 * 60 * 1000,
      attempts: 0
    });

    // Send OTP email
    await emailService.sendOTP(user.email, otp);

    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

/**
 * GET /api/auth/google
 * Initiate Google OAuth login
 */
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = generateToken(req.user);

      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id, {
      include: ['profile']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: user.toSafeObject(process.env.ENCRYPTION_KEY),
      profile: user.profile
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal, but we can add token to blacklist)
 */
router.post('/logout', authenticateJWT, (req, res) => {
  // In a more sophisticated setup, add token to Redis blacklist
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
