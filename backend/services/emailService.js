/**
 * emailService.js — Cravingza Email Service (Brevo HTTP API)
 *
 * Uses Brevo's transactional email REST API (HTTPS port 443) which works
 * on all hosting providers including Render free tier. Unlike SMTP-based
 * senders, Brevo API calls are never port-blocked by cloud firewalls.
 *
 * Free tier: 300 emails/day — sufficient for portfolio/testing projects.
 * For higher scale, upgrade to a paid Brevo plan.
 *
 * Setup:
 *   1. Sign up free at brevo.com
 *   2. Dashboard → SMTP & API → API Keys → Generate API Key
 *   3. Dashboard → Senders & IP → Add & verify a sender email address
 *   4. Set BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_FROM_NAME in .env
 */

const { BrevoClient } = require("@getbrevo/brevo");

// ---------------------------------------------------------------------------
// Startup sanity check — log clear warnings if env vars are missing
// ---------------------------------------------------------------------------

const verifyTransporter = () => {
  const key = process.env.BREVO_API_KEY;
  const from = process.env.BREVO_FROM_EMAIL;

  if (!key || !from) {
    console.error(
      "[Email Service] ❌ Brevo configuration missing!\n" +
        `  BREVO_API_KEY    : ${key ? "✅ found" : "❌ NOT SET"}\n` +
        `  BREVO_FROM_EMAIL : ${from ? "✅ found (" + from + ")" : "❌ NOT SET"}\n` +
        "  → Add these to your Render environment variables and redeploy."
    );
    return;
  }

  console.log(
    `[Email Service] ✅ Brevo ready. Sending from: ${from}`
  );
};

// ---------------------------------------------------------------------------
// Core send helper — HTTPS call to Brevo REST API
// ---------------------------------------------------------------------------

/**
 * @param {string} to       - Recipient email address
 * @param {string} subject  - Email subject line
 * @param {string} html     - HTML body content
 * @returns {{ success: boolean, messageId?: string, error?: string }}
 */
const sendMail = async (to, subject, html) => {
  try {
    const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

    const result = await client.transactionalEmails.sendTransacEmail({
      sender: {
        name: process.env.BREVO_FROM_NAME || "Cravingza",
        email: process.env.BREVO_FROM_EMAIL,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });

    console.log(`[Email Service] ✅ Sent to ${to} — messageId: ${result?.body?.messageId || "ok"}`);
    return { success: true, messageId: result?.body?.messageId };
  } catch (err) {
    // Log full Brevo error server-side for debugging
    const brevoMsg = err?.response?.body?.message || err?.message || "Unknown Brevo error";
    const brevoCode = err?.response?.body?.code || err?.status || "";
    console.error(
      `[Email Service] ❌ Brevo API error sending to ${to}:\n` +
        `  code: ${brevoCode}\n` +
        `  message: ${brevoMsg}`
    );
    return { success: false, error: brevoMsg };
  }
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sends a 6-digit OTP verification email after registration.
 */
const sendOTPEmail = async (to, name, otp) => {
  console.log(`[Email Service] Sending OTP email to ${to}…`);

  // Dev-mode console fallback — safety net for local testing without real API
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
 */
const sendPasswordResetEmail = async (to, name, otp) => {
  console.log(`[Email Service] Sending password reset email to ${to}…`);

  // Dev-mode console fallback — safety net for local testing without real API
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
