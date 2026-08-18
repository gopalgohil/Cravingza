import crypto from "crypto";

const generateOTP = () => {
  // Generate a secure 6-digit number
  return Math.floor(100000 + crypto.randomInt(900000)).toString();
};

const hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

const verifyOTP = (otp, hash) => {
  if (!otp || !hash) return false;
  const currentHash = hashOTP(otp);
  return crypto.timingSafeEqual(Buffer.from(currentHash), Buffer.from(hash));
};

export {
  generateOTP,
  hashOTP,
  verifyOTP,
};
