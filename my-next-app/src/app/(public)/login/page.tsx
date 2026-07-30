"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { signInWithPopup } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { auth, googleProvider } from "@/lib/firebase";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppStore((state) => state.user);
  const authChecked = useAppStore((state) => state.authChecked);
  const setUser = useAppStore((state) => state.setUser);
  
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const triggerLoginNotification = (userName?: string) => {
    toast.success("Login successfully!", {
      description: userName ? `Welcome back, ${userName}!` : "You have logged in successfully.",
    });

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("Login Successfully! 🎉", {
          body: userName ? `Welcome back, ${userName}!` : "You have logged in successfully to Cravingza.",
          icon: "/favicon.ico",
        });
      } catch (err) {
        console.error("Browser notification error:", err);
      }
    }
  };

  const getRedirectPath = (role: string) => {
    switch (role) {
      case "admin":
        return "/admin/dashboard";
      case "owner":
        return "/restaurant-owner/dashboard";
      case "delivery":
        return "/delivery-partner/dashboard";
      case "customer":
      default:
        return "/home";
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX - window.innerWidth / 2) / 100;
      const y = (e.clientY - window.innerHeight / 2) / 100;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Show verified message if user is redirected after email verification
    if (searchParams && searchParams.get("verified") === "true") {
      setSuccessMsg("Your email has been successfully verified! Please log in.");
    }

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (authChecked && user) {
      router.push(getRedirectPath(user.role));
    }
  }, [authChecked, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL + "/auth" : "http://localhost:5000/api/auth"}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email: identity, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        // Check if account is not verified yet
        if (res.status === 403 && data.isVerified === false) {
          setErrorMsg("Your email is not verified yet. Redirecting to verification page...");
          setTimeout(() => {
            router.push(`/verify-otp?email=${encodeURIComponent(identity)}`);
          }, 2000);
          return;
        }

        setErrorMsg(data.message || "Invalid email or password.");
        setIsLoading(false);
        return;
      }

      if (data.data?.token && typeof window !== "undefined") {
        localStorage.setItem("cravingza_token", data.data.token);
      }
      setUser(data.data.user);
      triggerLoginNotification(data.data.user.name);
      setSuccessMsg("Logged in successfully! Redirecting...");
      setTimeout(() => {
        router.push(getRedirectPath(data.data.user.role));
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMsg("Unable to connect to the server. Please try again later.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    setSuccessMsg("");
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

      if (data.data?.token && typeof window !== "undefined") {
        localStorage.setItem("cravingza_token", data.data.token);
      }
      setUser(data.data.user);
      triggerLoginNotification(data.data.user.name);
      setSuccessMsg("Logged in successfully! Redirecting...");
      setTimeout(() => {
        router.push(getRedirectPath(data.data.user.role));
      }, 1500);
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

  if (authChecked && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary">autorenew</span>
          <p className="font-label-md text-label-md text-on-surface-variant">Redirecting to console...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen text-slate-900 bg-slate-50/50">
      {/* Left Side: High-Quality Food Photography */}
      <section className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/60 via-slate-950/20 to-transparent z-10"></div>
        <div
          className="w-full h-full bg-cover bg-center transition-transform duration-300 ease-out"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=80')",
            transform: `scale(1.05) translate(${mousePos.x}px, ${mousePos.y}px)`,
          }}
        />
        {/* Overlay Testimonial */}
        <div className="absolute bottom-12 left-12 right-12 z-20 text-white">
          <div className="backdrop-blur-md bg-white/10 p-6 rounded-3xl border border-white/20 shadow-2xl space-y-3">
            <div className="flex gap-1 text-amber-400 text-sm">
              {"★".repeat(5)}
            </div>
            <p className="text-sm md:text-base italic font-medium leading-relaxed">
              "The fastest delivery service in the city. The food always arrives piping hot and perfectly packaged."
            </p>
            <p className="text-xs text-slate-300 font-bold">— Sarah Jenkins, Urban Professional</p>
          </div>
        </div>
      </section>

      {/* Right Side: Login Form */}
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
              <h2 className="font-extrabold text-xl text-slate-900">Welcome back!</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your details below to log in to your account.
              </p>
            </div>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-2xl border border-red-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-2xl border border-emerald-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            {/* Email/Phone Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="identity">
                Email or Phone Number
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  mail
                </span>
                <input
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  id="identity"
                  type="text"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder="name@example.com or phone"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  lock
                </span>
                <input
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
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
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                />
                <span>Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-primary font-bold hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          {/* Social Login */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">
                Or continue with
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2.5 py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm rounded-2xl transition-all shadow-2xs active:scale-98 cursor-pointer disabled:opacity-50"
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
            <span>Sign in with Google</span>
          </button>

          {/* Footer Register Link */}
          <div className="pt-2 text-center border-t border-slate-100">
            <p className="text-xs text-slate-500 font-medium">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary font-bold hover:underline ml-1">
                Register Now
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto py-32 text-center">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <p className="text-on-surface-variant font-body-md text-body-md">Loading...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
