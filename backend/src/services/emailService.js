const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  /**
   * Send OTP email
   * @param {string} email - Recipient email
   * @param {string} otp - OTP code
   * @param {string} name - User name (optional)
   */
  async sendOTP(email, otp, name = null) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@personalitymatch.com',
      to: email,
      subject: 'Your PersonalityMatch Verification Code',
      html: this.getOTPEmailTemplate(otp, name)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('OTP email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email send error:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  /**
   * Send welcome email
   * @param {string} email - Recipient email
   * @param {string} name - User name
   */
  async sendWelcomeEmail(email, name) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@personalitymatch.com',
      to: email,
      subject: 'Welcome to PersonalityMatch!',
      html: this.getWelcomeEmailTemplate(name)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email send error:', error);
      // Don't throw - welcome email is not critical
      return { success: false, error: error.message };
    }
  }

  /**
   * Send match notification email
   * @param {string} email - Recipient email
   * @param {string} matchName - Name of the match
   */
  async sendMatchNotification(email, matchName) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@personalitymatch.com',
      to: email,
      subject: 'You have a new match!',
      html: this.getMatchNotificationTemplate(matchName)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * OTP Email Template
   */
  getOTPEmailTemplate(otp, name) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-code { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PersonalityMatch</h1>
          </div>
          <div class="content">
            ${name ? `<p>Hi ${name},</p>` : '<p>Hi there,</p>'}
            <p>Your verification code is:</p>
            <div class="otp-code">${otp}</div>
            <p>This code will expire in <strong>5 minutes</strong>.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} PersonalityMatch. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Welcome Email Template
   */
  getWelcomeEmailTemplate(name) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to PersonalityMatch!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for joining PersonalityMatch! We're excited to help you find meaningful connections based on personality compatibility.</p>
            <p><strong>Next steps:</strong></p>
            <ol>
              <li>Complete your personality questionnaire (IPIP-50)</li>
              <li>Upload a video showing different emotions</li>
              <li>Start viewing your matches!</li>
            </ol>
            <p>Our science-backed matching algorithm uses the Big Five personality model to find you the most compatible matches.</p>
            <a href="${process.env.FRONTEND_URL}" class="button">Get Started</a>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
            <p>&copy; ${new Date().getFullYear()} PersonalityMatch. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Match Notification Template
   */
  getMatchNotificationTemplate(matchName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 You Have a New Match!</h1>
          </div>
          <div class="content">
            <p>Great news! We found someone who matches your personality profile.</p>
            <p>This match has a high compatibility score based on your Big Five personality traits.</p>
            <a href="${process.env.FRONTEND_URL}/matches" class="button">View Your Match</a>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              Remember: You can unlock contact details for $1 to start chatting with your match.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
            <p>&copy; ${new Date().getFullYear()} PersonalityMatch. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
