const nodemailer = require("nodemailer");
const { Resend } = require("resend");

// 1. Nodemailer Transporter (Gmail SMTP)
const createTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS.replace(/\s+/g, ""), // Trim spaces from 16-digit app password
      },
      connectionTimeout: 5000, // 5 seconds connection timeout
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  }
  return null;
};

// 2. Resend Client Fallback
const resendApiKey = process.env.RESEND_API_KEY || "re_dummy_fallback_key_123456789";
const resend = new Resend(resendApiKey);

/**
 * Sends a registration OTP verification email
 * @param {string} to - Destination email address
 * @param {string} name - Recipient's name
 * @param {string} otp - 6-digit OTP code
 */
const sendOTPEmail = async (to, name, otp) => {
  try {
    console.log(`[DEBUG OTP] Sending OTP verification email to ${to}: Code is ${otp}`);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Cravingza Account</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8F9FA; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #E9ECEF; }
          .header { background-color: #FF5A5F; padding: 32px; text-align: center; }
          .header h1 { color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
          .content { padding: 40px 32px; color: #333333; }
          .content h2 { font-size: 20px; margin-top: 0; color: #212529; }
          .content p { font-size: 16px; line-height: 1.6; color: #495057; margin-bottom: 24px; }
          .otp-container { background-color: #F8F9FA; border: 1px solid #E9ECEF; border-radius: 12px; padding: 20px; text-align: center; margin: 32px 0; }
          .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #FF5A5F; margin: 0; }
          .footer { background-color: #F8F9FA; padding: 24px; text-align: center; border-top: 1px solid #E9ECEF; font-size: 14px; color: #6C757D; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Cravingza</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Thank you for signing up for Cravingza! To complete your registration and verify your email address, please use the 6-digit verification code below:</p>
            
            <div class="otp-container">
              <div class="otp-code">${otp}</div>
            </div>
            
            <p><strong>Note:</strong> This verification code is valid for 5 minutes. If you did not request this, you can safely ignore this email.</p>
            <p>Happy eating,<br>The Cravingza Team</p>
          </div>
          <div class="footer">
            &copy; 2026 Cravingza Inc. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const transporter = createTransporter();
    if (transporter) {
      console.log(`[Gmail SMTP] Sending OTP email to ${to} via Gmail...`);
      const info = await transporter.sendMail({
        from: `"Cravingza" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Verify your Cravingza Account",
        html: htmlContent,
      });
      console.log("[Gmail SMTP Success]:", info.messageId);
      return { success: true, messageId: info.messageId };
    }

    // Resend fallback
    const data = await resend.emails.send({
      from: "Cravingza <onboarding@resend.dev>",
      to: [to],
      subject: "Verify your Cravingza Account",
      html: htmlContent,
    });
    console.log("Resend API response:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Email service error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Sends a password reset OTP email
 * @param {string} to - Destination email address
 * @param {string} name - Recipient's name
 * @param {string} otp - 6-digit OTP code
 */
const sendPasswordResetEmail = async (to, name, otp) => {
  try {
    console.log(`[DEBUG OTP] Sending password reset email to ${to}: Code is ${otp}`);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Cravingza Password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8F9FA; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #E9ECEF; }
          .header { background-color: #FF5A5F; padding: 32px; text-align: center; }
          .header h1 { color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
          .content { padding: 40px 32px; color: #333333; }
          .content h2 { font-size: 20px; margin-top: 0; color: #212529; }
          .content p { font-size: 16px; line-height: 1.6; color: #495057; margin-bottom: 24px; }
          .otp-container { background-color: #F8F9FA; border: 1px solid #E9ECEF; border-radius: 12px; padding: 20px; text-align: center; margin: 32px 0; }
          .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #FF5A5F; margin: 0; }
          .footer { background-color: #F8F9FA; padding: 24px; text-align: center; border-top: 1px solid #E9ECEF; font-size: 14px; color: #6C757D; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Cravingza</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>We received a request to reset your password. Please use the 6-digit OTP code below to reset your password:</p>
            
            <div class="otp-container">
              <div class="otp-code">${otp}</div>
            </div>
            
            <p><strong>Note:</strong> This OTP code is valid for 10 minutes. If you did not request a password reset, you can safely ignore this email; your password will remain unchanged.</p>
            <p>Happy eating,<br>The Cravingza Team</p>
          </div>
          <div class="footer">
            &copy; 2026 Cravingza Inc. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const transporter = createTransporter();
    if (transporter) {
      console.log(`[Gmail SMTP] Sending Reset OTP email to ${to} via Gmail...`);
      const info = await transporter.sendMail({
        from: `"Cravingza" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Reset your Cravingza Password",
        html: htmlContent,
      });
      console.log("[Gmail SMTP Success]:", info.messageId);
      return { success: true, messageId: info.messageId };
    }

    // Resend fallback
    const data = await resend.emails.send({
      from: "Cravingza <onboarding@resend.dev>",
      to: [to],
      subject: "Reset your Cravingza Password",
      html: htmlContent,
    });
    console.log("Resend API response (Password Reset):", data);
    return { success: true, data };
  } catch (error) {
    console.error("Email service error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail,
};
