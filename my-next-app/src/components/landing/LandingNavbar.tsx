"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProfileMenu from "@/components/ProfileMenu";
import { useAppStore } from "@/lib/store";
import { showAttractiveAuthToast } from "@/lib/authToast";
import { ShoppingCart } from "lucide-react";

export const LandingNavbar: React.FC = () => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const { user, cart } = useAppStore();
  const cartCount = cart ? cart.reduce((acc, item) => acc + item.quantity, 0) : 0;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`w-full sticky top-0 z-50 bg-surface border-b border-outline-variant transition-shadow duration-200 ${
        scrolled ? "app-shadow" : ""
      }`}
    >
      <div className="w-full flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4">
        <Link href="/" className="font-headline-md text-headline-md font-bold text-primary">
          Cravingza
        </Link>
        <div className="flex items-center gap-md">
          <ProfileMenu />
          <Link
            href="/cart"
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                showAttractiveAuthToast(
                  router,
                  "Sign in to View Cart",
                  "Create an account or log in to view your cart & place an order!"
                );
              }
            }}
            className="relative bg-primary-container text-on-primary p-2.5 rounded-xl active:scale-95 transition-transform hover:opacity-90 hidden md:flex items-center justify-center cursor-pointer"
            aria-label="View Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
