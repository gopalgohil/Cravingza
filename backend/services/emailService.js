const nodemailer = require("nodemailer");
const { Resend } = require("resend");

// 1. Nodemailer Transporter (Gmail SMTP)
const createTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // Use SSL/TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS.replace(/\s+/g, ""), // Trim spaces from 16-digit app password
      },
      tls: {
        rejectUnauthorized: false, // Prevent SSL certificate rejection on cloud servers
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return null;
};

// 2. Resend Client Fallback
const resendApiKey = process.env.RESEND_API_KEY || "re_dummy_fallback_key_123456789";
const resend = new Resend(resendApiKey);

/**
 * Helper to send email using Gmail SMTP with seamless Resend API fallback
 */
const sendMailHelper = async (to, subject, htmlContent) => {
  const transporter = createTransporter();

  // 1. Try Gmail SMTP first if credentials are present
  if (transporter) {
    try {
      console.log(`[Gmail SMTP] Sending email to ${to}...`);
      const info = await transporter.sendMail({
        from: `"Cravingza" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent,
      });
      console.log("[Gmail SMTP Success]:", info.messageId);
      return { success: true, messageId: info.messageId, provider: "gmail" };
    } catch (gmailError) {
      console.error("[Gmail SMTP Failed] Falling back to Resend API:", gmailError.message);
    }
  }

  // 2. Fallback to Resend API if Gmail SMTP fails or is not configured
  try {
    console.log(`[Resend API] Sending email to ${to}...`);
    const response = await resend.emails.send({
      from: "Cravingza <onboarding@resend.dev>",
      to: [to],
      subject,
      html: htmlContent,
    });

    if (response.error) {
      console.error("[Resend API Error]:", response.error.message || response.error);
      return { success: false, error: response.error.message || "Resend API error", provider: "resend" };
    }

    console.log("[Resend API Success]:", response.data);
    return { success: true, data: response.data, provider: "resend" };
  } catch (resendError) {
    console.error("[Resend API Exception]:", resendError.message);
    return { success: false, error: resendError.message };
  }
};

/**
 * Sends a registration OTP verification email
 * @param {string} to - Destination email address
 * @param {string} name - Recipient's name
 * @param {string} otp - 6-digit OTP code
 */
const sendOTPEmail = async (to, name, otp) => {
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

  return await sendMailHelper(to, "Verify your Cravingza Account", htmlContent);
};

/**
 * Sends a password reset OTP email
 * @param {string} to - Destination email address
 * @param {string} name - Recipient's name
 * @param {string} otp - 6-digit OTP code
 */
const sendPasswordResetEmail = async (to, name, otp) => {
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

  return await sendMailHelper(to, "Reset your Cravingza Password", htmlContent);
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail,
};
