"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Check, Mail, Lock, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Verify OTP & Reset Password, 3 = Success
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Client side validation for password reset
  const validateResetForm = () => {
    const errors: Record<string, string> = {};
    
    if (otp.length !== 6) {
      errors.otp = "OTP must be exactly 6 digits";
    }

    if (password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    } else {
      if (!/[A-Z]/.test(password)) {
        errors.password = "Password must contain at least one uppercase letter";
      }
      if (!/[a-z]/.test(password)) {
        errors.password = "Password must contain at least one lowercase letter";
      }
      if (!/[0-9]/.test(password)) {
        errors.password = "Password must contain at least one number";
      }
      if (!/[^A-Za-z0-9]/.test(password)) {
        errors.password = "Password must contain at least one special character";
      }
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL + "/auth" : "http://localhost:5000/api/auth"}/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Failed to send reset code.");
        setIsLoading(false);
        return;
      }

      setStep(2);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Unable to connect to the server. Please try again later.");
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!validateResetForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL + "/auth" : "http://localhost:5000/api/auth"}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, otp, password, confirmPassword }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          const mapErrs: Record<string, string> = {};
          data.errors.forEach((err: any) => {
            mapErrs[err.field] = err.message;
          });
          setFieldErrors(mapErrs);
        } else {
          setErrorMsg(data.message || "Invalid OTP code or password request.");
        }
        setIsLoading(false);
        return;
      }

      setStep(3);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Unable to connect to the server. Please try again later.");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-margin-mobile bg-surface text-on-surface">
      <div className="w-full max-w-md bg-white p-lg md:p-xl rounded-xl login-card-shadow text-center">
        
        {step !== 3 && (
          <h2 className="font-headline-md text-headline-md text-primary mb-xs font-extrabold">
            Reset Password
          </h2>
        )}

        {/* Global Error message */}
        {errorMsg && (
          <div className="mb-md p-md bg-red-50 text-red-500 text-sm rounded-xl border border-red-200 text-left">
            {errorMsg}
          </div>
        )}

        {step === 1 && (
          <>
            <p className="font-body-md text-body-md text-on-surface-variant mb-xl">
              Enter your email address and we will send you a 6-digit OTP code to verify your request.
            </p>
            <form className="space-y-md" onSubmit={handleRequestOTP}>
              <div className="space-y-xs text-left">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                    <Mail className="w-5 h-5 text-outline" />
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md input-focus-ring transition-all outline-none"
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                className="w-full py-3 bg-primary-container text-white font-body-lg text-body-lg rounded-xl hover:opacity-90 active:scale-[0.98] transition-all font-bold cursor-pointer min-h-[48px] flex items-center justify-center"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="inline-block animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  "Send OTP Code"
                )}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
              We have sent a verification code to <strong>{email}</strong>. Please enter the details below to complete your password reset.
            </p>
            <form className="space-y-md" onSubmit={handleResetPassword}>
              
              {/* OTP Field */}
              <div className="space-y-xs text-left">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="otp">
                  6-Digit OTP Code
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                    <KeyRound className="w-5 h-5 text-outline" />
                  </span>
                  <input
                    className={`w-full pl-10 pr-4 py-3 bg-surface-container-lowest border ${
                      fieldErrors.otp ? "border-red-400" : "border-outline-variant"
                    } rounded-xl font-body-md text-body-md input-focus-ring transition-all outline-none`}
                    id="otp"
                    type="text"
                    maxLength={6}
                    pattern="[0-9]*"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    required
                    disabled={isLoading}
                  />
                </div>
                {fieldErrors.otp && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.otp}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-xs text-left">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="password">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                    <Lock className="w-5 h-5 text-outline" />
                  </span>
                  <input
                    className={`w-full pl-10 pr-12 py-3 bg-surface-container-lowest border ${
                      fieldErrors.password ? "border-red-400" : "border-outline-variant"
                    } rounded-xl font-body-md text-body-md input-focus-ring transition-all outline-none`}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-xs text-left">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                    <Lock className="w-5 h-5 text-outline" />
                  </span>
                  <input
                    className={`w-full pl-10 pr-12 py-3 bg-surface-container-lowest border ${
                      fieldErrors.confirmPassword ? "border-red-400" : "border-outline-variant"
                    } rounded-xl font-body-md text-body-md input-focus-ring transition-all outline-none`}
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors focus:outline-none"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    type="button"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              <button
                className="w-full py-3 bg-primary-container text-white font-body-lg text-body-lg rounded-xl hover:opacity-90 active:scale-[0.98] transition-all font-bold cursor-pointer min-h-[48px] flex items-center justify-center"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="inline-block animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <div className="space-y-md my-4">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-200">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="font-headline-md text-headline-md text-green-600 font-extrabold">Success!</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mx-auto">
              Your password has been successfully reset. You can now sign in using your new credentials.
            </p>
            <div className="pt-sm">
              <Link
                href="/login"
                className="inline-block bg-primary text-white font-label-md text-label-md px-lg py-3 rounded-xl hover:opacity-95 active:scale-95 duration-200 transition-all font-bold"
              >
                Sign In Now
              </Link>
            </div>
          </div>
        )}

        {step !== 3 && (
          <div className="mt-xl text-center">
            <Link href="/login" className="text-primary font-bold hover:underline">
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
