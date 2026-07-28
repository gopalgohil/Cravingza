/**
 * emailService.js — Cravingza Email Service (Nodemailer + Gmail SMTP)
 *
 * Uses Gmail SMTP to send OTP and password reset emails to ANY recipient.
 * Gmail accounts have a ~500 emails/day limit — sufficient for a portfolio/
 * testing project. For production scale, use a verified domain on a dedicated
 * transactional email provider (e.g. Resend, SendGrid, Mailgun).
 *
 * Setup:
 *   - Enable 2-Step Verification on your Google account
 *   - Generate a 16-char App Password at: myaccount.google.com/apppasswords
 *   - Set EMAIL_USER and EMAIL_PASS in your .env / Render environment vars
 */

const nodemailer = require("nodemailer");
const dns = require("dns");

// Force IPv4 DNS resolution to prevent ENETUNREACH IPv6 errors on cloud
// hosting providers (Render, AWS, Railway, etc.) that disable IPv6 routing
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

// ---------------------------------------------------------------------------
// Transporter — Gmail SMTP via Nodemailer
// ---------------------------------------------------------------------------

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS — more reliable than port 465 on cloud servers
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
      ? process.env.EMAIL_PASS.replace(/\s+/g, "") // strip spaces from App Password
      : undefined,
  },
  tls: {
    rejectUnauthorized: false, // allow self-signed certs on cloud proxies
  },
  family: 4, // force IPv4 socket connection
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

/**
 * verifyTransporter — call once at server startup to catch misconfiguration
 * early rather than only when a user triggers an email send.
 */
const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log(
      `[Email Service] ✅ Gmail SMTP ready. Sending as: ${process.env.EMAIL_USER}`
    );
  } catch (err) {
    console.error(
      "[Email Service] ❌ Gmail SMTP verification failed. Common causes:\n" +
        "  • EMAIL_USER or EMAIL_PASS not set in environment variables\n" +
        "  • 2-Step Verification not enabled on Gmail account\n" +
        "  • App Password not used (must use App Password, not normal password)\n" +
        `  • Error: ${err.message}`
    );
  }
};

// ---------------------------------------------------------------------------
// Core send helper
// ---------------------------------------------------------------------------

/**
 * @param {string} to       - Recipient email address
 * @param {string} subject  - Email subject line
 * @param {string} html     - HTML body content
 * @returns {{ success: boolean, messageId?: string, error?: string }}
 */
const sendMail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Cravingza" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email Service] ✅ Sent to ${to} — messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    // Log full error server-side for debugging; do NOT leak to user
    console.error(`[Email Service] ❌ Failed to send to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sends a 6-digit OTP verification email after registration.
 *
 * @param {string} to   - Recipient email
 * @param {string} name - Recipient name
 * @param {string} otp  - 6-digit OTP string
 */
const sendOTPEmail = async (to, name, otp) => {
  console.log(`[Email Service] Sending OTP email to ${to}…`);

  // Dev-mode console fallback — safety net in case SMTP fails during dev
  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV FALLBACK] OTP for ${to}: ${otp}`);
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Cravingza Account</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8F9FA; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #E9ECEF; }
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
        <div class="header"><h1>Cravingza</h1></div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>Thank you for signing up for Cravingza! Please use the 6-digit verification code below to complete your registration:</p>
          <div class="otp-container">
            <div class="otp-code">${otp}</div>
          </div>
          <p><strong>Note:</strong> This code is valid for 5 minutes. If you did not request this, you can safely ignore this email.</p>
          <p>Happy eating,<br>The Cravingza Team</p>
        </div>
        <div class="footer">&copy; 2026 Cravingza Inc. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;

  return await sendMail(to, "Verify your Cravingza Account", html);
};

/**
 * Sends a 6-digit OTP password reset email.
 *
 * @param {string} to   - Recipient email
 * @param {string} name - Recipient name
 * @param {string} otp  - 6-digit OTP string
 */
const sendPasswordResetEmail = async (to, name, otp) => {
  console.log(`[Email Service] Sending password reset email to ${to}…`);

  // Dev-mode console fallback — safety net in case SMTP fails during dev
  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV FALLBACK] Password reset OTP for ${to}: ${otp}`);
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Cravingza Password</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8F9FA; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #E9ECEF; }
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
        <div class="header"><h1>Cravingza</h1></div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>We received a request to reset your password. Use the 6-digit OTP below to reset it:</p>
          <div class="otp-container">
            <div class="otp-code">${otp}</div>
          </div>
          <p><strong>Note:</strong> This code is valid for 10 minutes. If you did not request this, ignore this email — your password will remain unchanged.</p>
          <p>Happy eating,<br>The Cravingza Team</p>
        </div>
        <div class="footer">&copy; 2026 Cravingza Inc. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;

  return await sendMail(to, "Reset your Cravingza Password", html);
};

module.exports = {
  verifyTransporter,
  sendOTPEmail,
  sendPasswordResetEmail,
};
