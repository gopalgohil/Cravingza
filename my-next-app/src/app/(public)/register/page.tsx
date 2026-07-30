"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { toast } from "sonner";
import { sanitizePhone, isValidPhone } from "@/lib/validators";

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAppStore((state) => state.setUser);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setErrorMsg("");

    const newErrors: { [key: string]: string } = {};
    if (name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters long.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (phone && !isValidPhone(phone)) {
      newErrors.phone = "Please enter a valid 10-digit mobile number";
    }
    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    } else {
      if (!/[A-Z]/.test(password)) {
        newErrors.password = "Password must contain at least one uppercase letter.";
      } else if (!/[a-z]/.test(password)) {
        newErrors.password = "Password must contain at least one lowercase letter.";
      } else if (!/[0-9]/.test(password)) {
        newErrors.password = "Password must contain at least one number.";
      } else if (!/[^A-Za-z0-9]/.test(password)) {
        newErrors.password = "Password must contain at least one special character.";
      }
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    if (!agreeTerms) {
      newErrors.agreeTerms = "You must agree to the Terms of Service and Privacy Policy.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL + "/auth" : "http://localhost:5000/api/auth"}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password,
            confirmPassword,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && data.errors.length > 0) {
          const apiErrors: { [key: string]: string } = {};
          data.errors.forEach((err: { field: string; message: string }) => {
            apiErrors[err.field] = err.message;
          });
          setErrors(apiErrors);
        }
        setErrorMsg(data.message || "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMsg("Unable to connect to the server. Please try again later.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    setErrors({});
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Google sign-in failed.");
        setIsLoading(false);
        return;
      }

      setUser(data.data.user);
      router.push("/home");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMsg("Google Sign-In popup closed before completion.");
      } else {
        setErrorMsg(err.message || "Unable to connect or login with Google. Please try again.");
      }
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen text-slate-900 bg-slate-50/50">
      {/* Left Side: Visual/Branding (Hidden on mobile) */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 scale-110">
          <div
            className="w-full h-full bg-cover bg-center opacity-90 transition-transform duration-[20s] hover:scale-110 ease-out"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000')",
            }}
          />
        </div>
        <div className="relative z-10 w-full max-w-lg p-10 text-white">
          <div className="mb-6">
            <span className="text-sm font-bold tracking-tight bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30">
              Cravingza
            </span>
          </div>
          <h1 className="text-4xl font-extrabold mb-4 leading-tight drop-shadow-lg">
            Discover your next <span className="text-amber-300">favourite</span> meal.
          </h1>
          <p className="text-base text-white/90 max-w-md">
            Join thousands of food lovers getting fresh, local ingredients and chef-inspired meals delivered to their doorstep in minutes.
          </p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/60 via-transparent to-transparent pointer-events-none"></div>
      </section>

      {/* Right Side: Registration Form */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-12 relative z-10 my-auto">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-5">
          {/* App Logo & Title */}
          <div className="text-center space-y-2">
            <Link href="/" className="inline-flex items-center justify-center gap-2 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">restaurant</span>
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">
                Cravingza
              </span>
            </Link>
            <div>
              <h2 className="font-extrabold text-xl text-slate-900">Create your account</h2>
              <p className="text-xs text-slate-500 mt-1">
                Join Cravingza today and start exploring top eats near you.
              </p>
            </div>
          </div>

          {/* Google Sign In Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all text-xs sm:text-sm font-bold text-slate-800 cursor-pointer active:scale-95 duration-200 disabled:opacity-50"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                ></path>
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                ></path>
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81.61z"
                  fill="#FBBC05"
                ></path>
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                ></path>
              </svg>
              <span>Sign up with Google</span>
            </button>
          </div>

          {/* Clean OR Divider */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">
                or register with email
              </span>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-2xl border border-red-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-3.5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="name">
                Full Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  person
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              {errors.name && <span className="text-red-500 text-[11px] block mt-0.5">{errors.name}</span>}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  mail
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
              {errors.email && <span className="text-red-500 text-[11px] block mt-0.5">{errors.email}</span>}
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="phone">
                Phone Number
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center gap-1 text-slate-500 font-bold text-xs pointer-events-none select-none z-10">
                  <span className="material-symbols-outlined text-sm text-primary">call</span>
                  <span className="text-slate-700 font-bold border-r border-slate-300 pr-1.5">+91</span>
                </div>
                <input
                  className={`w-full pl-20 pr-4 py-2.5 bg-slate-50 border rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all ${
                    errors.phone ? "border-red-500" : "border-slate-200"
                  }`}
                  id="phone"
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    setPhone(sanitizePhone(e.target.value));
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                  }}
                  placeholder="9876543210"
                  required
                />
              </div>
              {errors.phone && <span className="text-red-500 text-[11px] block mt-0.5">{errors.phone}</span>}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  lock
                </span>
                <input
                  className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <span className="text-red-500 text-[11px] block mt-0.5">{errors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="confirm_password">
                Confirm Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  verified_user
                </span>
                <input
                  className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onPaste={(e) => {
                    e.preventDefault();
                    toast.warning("For security, copy-pasting is disabled for Confirm Password.");
                  }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="text-red-500 text-[11px] block mt-0.5">{errors.confirmPassword}</span>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="pt-1">
              <div className="flex items-start gap-2">
                <input
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                  id="terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <label className="text-xs text-slate-600 leading-tight" htmlFor="terms">
                  I agree to the{" "}
                  <a className="text-primary font-bold hover:underline" href="#">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a className="text-primary font-bold hover:underline" href="#">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.agreeTerms && (
                <span className="text-red-500 text-[11px] block mt-1">{errors.agreeTerms}</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || success}
              className={`w-full py-3.5 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-98 ${
                success
                  ? "bg-emerald-600 shadow-emerald-500/25"
                  : "bg-primary hover:bg-primary/90 shadow-primary/25"
              }`}
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
              ) : success ? (
                "Account Created! Redirecting..."
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="pt-2 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?
              <Link href="/login" className="text-primary font-bold hover:underline ml-1">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Floating Help Button */}
      <button
        type="button"
        onClick={() => alert("How can we help you today?")}
        className="fixed bottom-4 right-4 w-12 h-12 bg-white text-slate-700 rounded-full flex items-center justify-center shadow-lg border border-slate-200 hover:bg-primary hover:text-white transition-all z-50 cursor-pointer"
        title="Help"
      >
        <span className="material-symbols-outlined text-xl">help</span>
      </button>
    </main>
  );
}
