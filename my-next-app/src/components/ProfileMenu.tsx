"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { LogOut, User as UserIcon, ChevronDown, Receipt, Store, Shield } from "lucide-react";

export default function ProfileMenu() {
  const { user, setUser, authChecked, clearCart, setAddress } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL + "/auth" : "http://localhost:5000/api/auth"}/logout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      if (res.ok) {
        setUser(null);
        clearCart();
        setAddress("123 Main Street, City Centre");
        setIsOpen(false);
        router.push("/?logout=true");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // 1. While client is mounting OR initial auth check is resolving -> Show neutral skeleton placeholder (NO flash of Sign In)
  if (!mounted || !authChecked) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-28 h-9 rounded-xl bg-outline-variant/30 animate-pulse" />
      </div>
    );
  }

  // 2. Auth resolved & user is NOT logged in -> Show Sign In / Sign Up
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="hidden md:inline-block font-label-md text-label-md text-on-surface-variant px-4 py-2.5 rounded-xl hover:text-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="bg-gradient-to-r from-primary to-orange-500 text-white font-label-md text-label-md px-5 py-2.5 rounded-xl active:scale-95 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 inline-block cursor-pointer font-bold"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  // Get initial letters for avatar placeholder
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 px-2.5 hover:bg-surface-container rounded-xl transition-all duration-200 focus:outline-none cursor-pointer border border-transparent hover:border-outline-variant/30"
      >
        <div className="w-8 h-8 bg-gradient-to-tr from-primary to-orange-500 text-white rounded-xl flex items-center justify-center font-extrabold text-sm shadow-md shadow-primary/20">
          {getInitials(user.name)}
        </div>
        <div className="hidden md:flex flex-col items-start text-left max-w-[120px]">
          <span className="font-label-md text-label-md font-bold text-on-surface truncate w-full">
            {user.name}
          </span>
          <span className="font-caption text-caption text-on-surface-variant/80 truncate w-full leading-none mt-0.5">
            {user.role}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-on-surface-variant transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-outline-variant rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-outline-variant">
            <p className="font-body-md text-body-md font-bold text-on-surface truncate">{user.name}</p>
            <p className="font-caption text-caption text-on-surface-variant truncate">{user.email}</p>
          </div>

          {/* Links */}
          <div className="p-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container text-on-surface hover:text-primary transition-all duration-150 font-body-md text-body-md"
            >
              <UserIcon className="w-4 h-4 text-on-surface-variant" />
              <span>My Profile</span>
            </Link>
            
            <Link
              href="/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container text-on-surface hover:text-primary transition-all duration-150 font-body-md text-body-md"
            >
              <Receipt className="w-4 h-4 text-on-surface-variant" />
              <span>My Orders</span>
            </Link>

            {user.role === "admin" && (
              <Link
                href="/admin/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 text-rose-700 font-bold transition-all duration-150 font-body-md text-body-md border border-rose-200/50"
              >
                <Shield className="w-4 h-4 text-rose-600" />
                <span>Admin Console</span>
              </Link>
            )}

            {user.role === "owner" && (
              <Link
                href="/restaurant-owner/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100/80 text-orange-600 font-bold transition-all duration-150 font-body-md text-body-md border border-orange-200/50"
              >
                <Store className="w-4 h-4 text-orange-500" />
                <span>Owner Dashboard</span>
              </Link>
            )}

            {user.role === "delivery" && (
              <Link
                href="/delivery-partner/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100/80 text-orange-600 font-bold transition-all duration-150 font-body-md text-body-md border border-orange-200/50"
              >
                <Store className="w-4 h-4 text-orange-500" />
                <span>Rider Dashboard</span>
              </Link>
            )}

            {user.role === "customer" && (
              <Link
                href="/become-delivery-partner"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container text-on-surface hover:text-primary transition-all duration-150 font-body-md text-body-md"
              >
                <Store className="w-4 h-4 text-on-surface-variant" />
                <span>Become a Rider</span>
              </Link>
            )}
          </div>

          {/* Logout Footer */}
          <div className="p-1 border-t border-outline-variant">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-all duration-150 font-body-md text-body-md text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
