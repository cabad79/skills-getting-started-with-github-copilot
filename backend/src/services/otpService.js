const otplib = require('otplib');
const crypto = require('crypto');

class OTPService {
  constructor() {
    // Configure TOTP
    otplib.authenticator.options = {
      step: 300, // 5 minutes validity
      window: 1  // Allow 1 step before/after for clock skew
    };
  }

  /**
   * Generate OTP secret for a user
   */
  generateSecret() {
    return otplib.authenticator.generateSecret();
  }

  /**
   * Generate a 6-digit OTP token
   * @param {string} secret - User's OTP secret
   * @returns {string} 6-digit OTP code
   */
  generateToken(secret) {
    return otplib.authenticator.generate(secret);
  }

  /**
   * Verify OTP token
   * @param {string} token - User-provided OTP
   * @param {string} secret - User's OTP secret
   * @returns {boolean} True if valid
   */
  verifyToken(token, secret) {
    try {
      return otplib.authenticator.check(token, secret);
    } catch (error) {
      console.error('OTP verification error:', error);
      return false;
    }
  }

  /**
   * Generate a simple numeric OTP for email
   * @param {number} length - OTP length (default 6)
   * @returns {string} Numeric OTP
   */
  generateNumericOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      otp += digits[randomBytes[i] % 10];
    }

    return otp;
  }

  /**
   * Create OTP hash for storage (to verify later without storing plain OTP)
   * @param {string} otp - Plain OTP
   * @param {string} secret - User's secret
   * @returns {string} Hashed OTP
   */
  hashOTP(otp, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(otp)
      .digest('hex');
  }

  /**
   * Verify OTP against stored hash
   * @param {string} otp - User-provided OTP
   * @param {string} hash - Stored hash
   * @param {string} secret - User's secret
   * @returns {boolean} True if valid
   */
  verifyOTPHash(otp, hash, secret) {
    const computedHash = this.hashOTP(otp, secret);
    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(computedHash)
    );
  }
}

module.exports = new OTPService();
