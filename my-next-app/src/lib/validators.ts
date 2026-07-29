import { z } from "zod";

/**
 * Shared Indian Pincode Zod Schema
 * Rule: Exactly 6 digits, first digit must be 1-9 (never starts with 0).
 */
export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit pincode");

/**
 * Strips non-digit characters and caps length at 6.
 */
export const sanitizePincode = (val: string): string => {
  return (val || "").replace(/\D/g, "").slice(0, 6);
};

/**
 * Helper to validate Indian pincode format.
 */
export const isValidPincode = (val: string): boolean => {
  return /^[1-9][0-9]{5}$/.test((val || "").trim());
};

/**
 * Shared Indian Phone Number Zod Schema
 * Rule: Exactly 10 digits, first digit 6-9 (never 0-5).
 * Strips +91 / 91 prefix, normalizes to 10-digit clean string.
 */
export const phoneSchema = z
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

/**
 * Strips non-digit characters and caps length at 10.
 * Also removes leading +91 / 91 if user pastes full number with country code.
 */
export const sanitizePhone = (val: string): string => {
  let clean = (val || "").replace(/^\+?91/, "").replace(/\D/g, "");
  return clean.slice(0, 10);
};

/**
 * Helper to validate Indian mobile number format (10 digits starting 6-9).
 */
export const isValidPhone = (val: string): boolean => {
  const clean = sanitizePhone(val);
  return /^[6-9][0-9]{9}$/.test(clean);
};
