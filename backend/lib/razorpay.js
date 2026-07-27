const Razorpay = require("razorpay");

const keyId = process.env.RAZORPAY_KEY_ID || process.env.API_key || "rzp_test_TIQT6DdrsWqxAT";
const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.Secret || "fIHVsqDdaClXHWcNom6uEA1E";

const razorpayInstance = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

module.exports = razorpayInstance;
