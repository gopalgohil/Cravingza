"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { signInWithPopup } from "firebase/auth";
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
    <main className="flex min-h-screen text-on-background bg-background">
      {/* Left Side: Login Form */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-margin-mobile md:p-margin-desktop bg-surface-bright relative z-10">
        <div className="w-full max-w-md">
          {/* App Logo & Title */}
          <div className="text-center mb-xl">
            <Link href="/">
              <h1 className="font-headline-md text-headline-md text-primary-container font-bold mb-2 cursor-pointer">
                Cravingza
              </h1>
            </Link>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Welcome back! Please enter your details.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white p-lg md:p-xl rounded-xl login-card-shadow">
            {errorMsg && (
              <div className="mb-md p-md bg-red-50 text-red-500 text-sm rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mb-md p-md bg-green-50 text-green-600 text-sm rounded-xl border border-green-200">
                {successMsg}
              </div>
            )}
            <form className="space-y-md" onSubmit={handleLogin}>
              {/* Email/Phone Input */}
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="identity">
                  Email or Phone
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                    mail
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md input-focus-ring transition-all outline-none"
                    id="identity"
                    type="text"
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                    placeholder="Enter your email or phone"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                    lock
                  </span>
                  <input
                    className="w-full pl-10 pr-12 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md input-focus-ring transition-all outline-none"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="font-caption text-caption text-primary hover:underline font-medium"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Primary Log In Button */}
              <button
                className="w-full py-3 bg-primary-container text-white font-body-lg text-body-lg rounded-xl hover:opacity-90 active:scale-[0.98] transition-all font-bold flex items-center justify-center min-h-[48px] cursor-pointer"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="inline-block animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  "Log In"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-xl">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant"></div>
              </div>
              <div className="relative flex justify-center text-caption font-caption">
                <span className="bg-white px-4 text-on-surface-variant">or continue with</span>
              </div>
            </div>

            {/* Social Logins */}
            <div className="w-full">
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-surface-container border border-outline-variant rounded-2xl hover:bg-surface-container-high transition-all font-body-md text-body-md font-bold text-on-surface cursor-pointer active:scale-95 duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                Google
              </button>
            </div>
          </div>

          {/* Footer Register Link */}
          <div className="mt-xl text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary font-bold hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Right Side: High-Quality Food Photography */}
      <section className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-on-primary-container/40 to-transparent z-10"></div>
        <div
          className="w-full h-full bg-cover bg-center transition-transform duration-300 ease-out"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB8foXQWiErHHRAlYGNkT0sPYGbgIZiOJfCCegQ_t4kQNX8klPhIhB_7oC3iR3Tddf8kAsEpSvuT1ywElHnBWpssvBVQyPqQSJAbK0h1_CdfzuPGwkubIeSWvQ9pscyzHQzm18kYh_Ce_JCSH8DCBS06klfuz2dKWSWx2ry8VDGXjfT316Yw7PmmlUv2eFOHUs8WeOfSb2Xk8uUXe6SIbLNJFLpxxzfr8k9xxTXJvbQSBd-gqAOSrmwWg')",
            transform: `scale(1.1) translate(${mousePos.x}px, ${mousePos.y}px)`,
          }}
        />
        {/* Overlay Content */}
        <div className="absolute bottom-12 left-12 right-12 z-20 text-white">
          <div className="backdrop-blur-md bg-white/10 p-lg rounded-xl border border-white/20">
            <div className="flex gap-1 mb-2">
              <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
            </div>
            <p className="font-headline-sm text-headline-sm italic mb-2">
              "The fastest delivery service in the city. The food always arrives piping hot and perfectly packaged."
            </p>
            <p className="font-label-md text-label-md opacity-80">— Sarah Jenkins, Urban Professional</p>
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
