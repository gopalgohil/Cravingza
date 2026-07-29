const { z } = require("zod");

/**
 * Shared Indian Pincode Validator
 * Rule: Exactly 6 digits, first digit must be 1-9 (never starts with 0).
 */
const pincodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit pincode");

/**
 * Shared Indian Phone Number Validator
 * Rule: Exactly 10 digits, first digit 6-9 (never 0-5).
 * Strips +91 / 91 prefix if included, stores clean 10-digit number.
 */
const phoneSchema = z
  .string()
  .transform((val) => {
    let clean = (val || "").trim().replace(/\D/g, "");
    if (clean.length === 12 && clean.startsWith("91")) {
      clean = clean.slice(2);
    }
    return clean;
  })
  .refine((val) => /^[6-9][0-9]{9}$/.test(val), {
    message: "Please enter a valid 10-digit mobile number",
  });

module.exports = {
  pincodeSchema,
  phoneSchema,
};
