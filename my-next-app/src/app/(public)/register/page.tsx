"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { toast } from "sonner";

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
    <main className="flex min-h-screen text-on-surface bg-surface">
      {/* Left Side: Visual/Branding (Hidden on mobile) */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 scale-110">
          <div
            className="w-full h-full bg-cover bg-center opacity-90 transition-transform duration-[20s] hover:scale-110 ease-out"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAx-NCsRuMgCCfaRutmuSRh0HRJgUGh6dBpuUdbYNB_MKgb4KGvKNKVpRefKjszXxhIwJtjbA0I7oschXKqcnH3VZoC4n5-EFqZCX0U-2U5nXb2lI9zuoIEoe2Gsa55d7loy-8IWRWuiZOgKRgorvhrnR8jA7Q6dSwp9IodXN5FqT5eQyeudDlNXvaNtyJOmv2jDiasBRK5AENfJIGUuWZOkoEKvSLldT4uKoF7GUPJB6-ouVmiwS-enA')",
            }}
          />
        </div>
        {/* Overlay Content */}
        <div className="relative z-10 w-full max-w-lg p-xl text-white">
          <div className="mb-md">
            <span className="font-headline-md text-headline-md font-bold tracking-tight bg-white/20 backdrop-blur-md px-4 py-1 rounded-full border border-white/30">
              Cravingza
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg mb-md leading-tight drop-shadow-lg">
            Discover your next <span className="text-primary-fixed">favourite</span> meal.
          </h1>
          <p className="font-body-lg text-body-lg text-white/90 max-w-md">
            Join thousands of food lovers getting fresh, local ingredients and chef-inspired meals delivered to their doorstep in minutes.
          </p>
          <div className="mt-xl flex gap-md">
            <div className="flex -space-x-3">
              <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  alt="Reviewer 1"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKeTrOT81p6EJRRkA9r8UkaXpTmUyfjAis7dGj3GAAID9WErC5_-1tph_9K6i1p601KUWgErBW9-vv6_tIgYcbQz7HBWLd3rvqCYizVq6a_96q9Bk-d5ertjYrWJRxydbrkk3nvtnC16R_h0Knr4jvbf-QiOkcBZvBEaZ6c0GBe-avJC6FIJvKfB1MndNcZ4sLwGV8DihLHX7W4YXoecMr83IRYawrJrMoXj8QztCmphot_Gqabi7k3A"
                />
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  alt="Reviewer 2"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEbuHNOvFEcRZQHD8oD2mZ-pTh1IP_bUXIiR08Bcj0Eep2rXMal4ZBP3fu8D5O_QF-KHff705n4NqO5gGvWTl3I35W--scDjKD4efLHtwtCLdIG7dfbFXu_SsIH92hmdkwEkuwJAT92Oe4hGWlnkrhnHRAPUdt178SkG3lHmBcLelXRuUsxzM7sTB9IBDWW4rfi9glbzPYbQEqkXFyH-tOxF7plQcHhgejm0xztz6bvonyvy4DZ3nNfA"
                />
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  alt="Reviewer 3"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuATAKYZDfU3J4FC9ybe7DzBblWMOa8WBAABBCMlbzYdObCA3G0ds4Q1WAsxFpM2MDR-nZcC9C3aJDh_vSzXkpakKvbbotzCnLl3I6nRDXHMrI3kiJu85z-hlpKAj3kO51tf8a0APVrpmXUBzldQ4XTBC007gvPvCARZi4bav2i6EdV7a1WFC1DGWhmdtFk9eOsK-QvbfSR-ERgv-LYmjyoO3uvZSQUQlF7Y0abdOygfalRnbKi1gjT7jQ"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-label-md text-label-md font-bold">4.8/5 Rating</span>
              <span className="font-caption text-caption opacity-80">from 50,000+ hungry users</span>
            </div>
          </div>
        </div>
        {/* Subtle Mesh Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-on-primary-container/60 via-transparent to-transparent pointer-events-none"></div>
      </section>

      {/* Right Side: Sign Up Form */}
      <section className="w-full lg:w-1/2 flex items-center justify-center py-4 px-margin-mobile md:p-margin-desktop bg-surface">
        <div className="w-full max-w-md flex flex-col">
          {/* Mobile Branding */}
          <div className="lg:hidden mb-xs flex justify-center">
            <span className="font-headline-md text-headline-md font-black text-primary">Cravingza</span>
          </div>

          <div className="mb-sm md:mb-xl">
            <h2 className="font-display-lg-mobile text-display-lg-mobile md:text-headline-md md:font-headline-md text-on-surface mb-xs">
              Create your account
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Join Cravingza today and start exploring the best eats near you.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-lg border border-outline-variant/30">
            {/* Social Sign Up */}
            <div className="w-full mb-sm md:mb-xl">
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 md:py-3 bg-surface-container border border-outline-variant rounded-2xl hover:bg-surface-container-high transition-all font-body-md text-body-md font-bold text-on-surface cursor-pointer active:scale-95 duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="relative mb-sm md:mb-xl text-center">
              <hr className="border-outline-variant" />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 font-caption text-caption text-on-surface-variant uppercase tracking-widest">
                or continue with email
              </span>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-md p-md bg-red-50 text-red-500 text-sm rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}

            {/* Registration Form */}
            <form className="flex flex-col gap-xs md:gap-md" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface ml-1" htmlFor="name">
                  Full Name
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                    person
                  </span>
                  <input
                    className="w-full pl-12 pr-4 py-2 md:py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md focus-ring transition-all outline-none"
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                {errors.name && (
                  <span className="text-red-500 text-xs ml-1">{errors.name}</span>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface ml-1" htmlFor="email">
                  Email Address
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                    mail
                  </span>
                  <input
                    className="w-full pl-12 pr-4 py-2 md:py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md focus-ring transition-all outline-none"
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                {errors.email && (
                  <span className="text-red-500 text-xs ml-1">{errors.email}</span>
                )}
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface ml-1" htmlFor="phone">
                  Phone Number
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                    call
                  </span>
                  <input
                    className="w-full pl-12 pr-4 py-2 md:py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md focus-ring transition-all outline-none"
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </div>
                {errors.phone && (
                  <span className="text-red-500 text-xs ml-1">{errors.phone}</span>
                )}
              </div>

              {/* Passwords Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-xs md:gap-md">
                {/* Password */}
                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-on-surface ml-1" htmlFor="password">
                    Password
                  </label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                      lock
                    </span>
                    <input
                      className="w-full pl-12 pr-12 py-2 md:py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md focus-ring transition-all outline-none"
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
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary focus:outline-none transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="text-red-500 text-xs ml-1">{errors.password}</span>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-on-surface ml-1" htmlFor="confirm_password">
                    Confirm
                  </label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                      verified_user
                    </span>
                    <input
                      className="w-full pl-12 pr-12 py-2 md:py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md focus-ring transition-all outline-none"
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
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary focus:outline-none transition-colors cursor-pointer"
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="text-red-500 text-xs ml-1">{errors.confirmPassword}</span>
                  )}
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="flex flex-col gap-xs">
                <div className="flex items-start gap-sm mt-0">
                  <div className="flex items-center h-5">
                    <input
                      className="w-5 h-5 rounded border-outline-variant text-primary-container focus:ring-primary-container transition-all cursor-pointer"
                      id="terms"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                    />
                  </div>
                  <label className="font-caption text-caption text-on-surface-variant" htmlFor="terms">
                    I agree to the{" "}
                    <a className="text-primary font-bold hover:underline" href="#">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a className="text-primary font-bold hover:underline" href="#">
                      Privacy Policy
                    </a>
                    .
                  </label>
                </div>
                {errors.agreeTerms && (
                  <span className="text-red-500 text-xs ml-1">{errors.agreeTerms}</span>
                )}
              </div>

              {/* CTA */}
              <button
                className={`w-full mt-md text-on-primary font-body-lg text-body-lg py-2.5 md:py-4 rounded-xl soft-shadow transition-all duration-200 flex items-center justify-center min-h-[44px] md:min-h-[56px] cursor-pointer ${
                  success
                    ? "bg-tertiary-container text-white"
                    : "bg-primary-container hover:brightness-110 active:scale-95"
                }`}
                type="submit"
                disabled={isLoading || success}
              >
                {isLoading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : success ? (
                  "Account Created!"
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
          </div>

          {/* Footer Link */}
          <div className="mt-md md:mt-xl text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
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
        onClick={() => alert("How can we help you today?")}
        className="fixed bottom-margin-mobile right-margin-mobile md:bottom-margin-desktop md:right-margin-desktop w-14 h-14 bg-white rounded-full flex items-center justify-center text-primary-container shadow-lg border border-outline-variant hover:bg-primary-container hover:text-white transition-all group z-50 cursor-pointer"
      >
        <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">
          help
        </span>
      </button>
    </main>
  );
}
