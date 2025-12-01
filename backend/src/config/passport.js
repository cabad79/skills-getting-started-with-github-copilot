const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const { User } = require('../models');

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  scope: ['profile', 'email']
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findOne({
      where: { google_id: profile.id }
    });

    if (user) {
      // Update last login
      user.last_login = new Date();
      await user.save();
      return done(null, user);
    }

    // Check if email is already used with password auth
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    if (!email) {
      return done(new Error('No email found in Google profile'), null);
    }

    user = await User.findOne({
      where: { email }
    });

    if (user) {
      // Link Google account to existing user
      user.google_id = profile.id;
      user.email_verified = true; // Google emails are verified
      user.last_login = new Date();
      await user.save();
      return done(null, user);
    }

    // Create new user
    user = await User.create({
      email,
      google_id: profile.id,
      email_verified: true,
      last_login: new Date()
    });

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const user = await User.findByPk(payload.user_id);

    if (!user) {
      return done(null, false);
    }

    if (!user.is_active || user.is_banned) {
      return done(null, false);
    }

    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));

module.exports = passport;
