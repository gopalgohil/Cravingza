"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Mail, ArrowLeft, RefreshCw } from "lucide-react";

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split("");
    setOtp(digits);
    inputRefs.current[5]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const code = otp.join("");
    if (code.length !== 6) {
      setErrorMsg("Please enter all 6 digits of the verification code.");
      return;
    }

    if (!email) {
      setErrorMsg("Email address is missing. Please register again.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL + "/auth" : "http://localhost:5000/api/auth"}/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, otp: code }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Invalid or expired verification code.");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setSuccessMsg("Account verified successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 2000);
    } catch (err) {
      console.error(err);
      setErrorMsg("Unable to connect to the server. Please try again.");
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0 || isResending) return;
    setErrorMsg("");
    setSuccessMsg("");
    setIsResending(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL + "/auth" : "http://localhost:5000/api/auth"}/resend-otp`,
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
        setErrorMsg(data.message || "Failed to resend verification code.");
        setIsResending(false);
        return;
      }

      setIsResending(false);
      setSuccessMsg("A new verification code has been sent!");
      setTimeLeft(300); // Reset countdown timer
    } catch (err) {
      console.error(err);
      setErrorMsg("Unable to connect to the server. Please try again.");
      setIsResending(false);
    }
  };

  return (
    <main className="flex min-h-screen text-on-surface bg-surface items-center justify-center p-6 relative overflow-hidden">
      {/* Background Graphic elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md bg-white border border-outline-variant rounded-2xl p-8 md:p-10 shadow-xl transition-all duration-300">
        {/* Back Link */}
        <Link
          href="/register"
          className="inline-flex items-center gap-xs font-body-sm text-body-sm text-on-surface-variant hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Register</span>
        </Link>

        {/* Icon & Headings */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary animate-pulse">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface mb-2">
            Verify your email
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant flex items-center justify-center gap-sm">
            <Mail className="w-4 h-4 text-primary" />
            <span className="truncate max-w-[280px]" title={email}>
              {email || "your email address"}
            </span>
          </p>
          <p className="font-caption text-caption text-on-surface-variant mt-sm">
            We have sent a 6-digit verification code to this email. Enter it below to complete registration.
          </p>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 text-green-600 text-sm rounded-xl border border-green-200">
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex justify-between gap-sm">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength={1}
                value={digit}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                className="w-12 h-14 text-center text-xl font-bold bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                required
              />
            ))}
          </div>

          {/* Countdown & Resend */}
          <div className="text-center font-body-sm text-body-sm">
            {timeLeft > 0 ? (
              <p className="text-on-surface-variant">
                Code expires in: <span className="text-primary font-bold">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-primary font-bold hover:underline inline-flex items-center gap-xs cursor-pointer disabled:opacity-50"
              >
                {isResending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Resend Verification Code</span>
                )}
              </button>
            )}
          </div>

          {/* CTA */}
          <button
            type="submit"
            disabled={isLoading || otp.includes("")}
            className="w-full text-on-primary font-body-lg text-body-lg py-4 bg-primary-container hover:brightness-110 active:scale-95 disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:brightness-100 disabled:scale-100 disabled:cursor-not-allowed rounded-xl soft-shadow transition-all duration-200 flex items-center justify-center min-h-[56px] cursor-pointer"
          >
            {isLoading ? (
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
              <span>Verify Code</span>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto py-32 text-center">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <p className="text-on-surface-variant font-body-md text-body-md">Loading...</p>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}
