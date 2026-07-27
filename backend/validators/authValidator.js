const { z } = require("zod");

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, { message: "Name must be at least 3 characters long" }),
    email: z
      .string()
      .trim()
      .email({ message: "Please provide a valid email address" }),
    phone: z.string().trim().optional(),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please provide a valid email address" }),
  password: z
    .string()
    .min(1, { message: "Password is required" }),
});

const verifyOTPSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please provide a valid email address" }),
  otp: z
    .string()
    .length(6, { message: "OTP must be exactly 6 digits" }),
});

const resendOTPSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please provide a valid email address" }),
});

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please provide a valid email address" }),
});

const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email({ message: "Please provide a valid email address" }),
    otp: z
      .string()
      .length(6, { message: "OTP must be exactly 6 digits" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

module.exports = {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  resendOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
