"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import NotificationMenu from "@/components/customer/NotificationMenu";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, authChecked, clearCart, setAddress } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Profile Dropdown state
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Admin protection
  useEffect(() => {
    if (authChecked) {
      if (!user) {
        router.push(`/login?redirect=${pathname}`);
      } else if (user.role !== "admin") {
        toast.error("Access denied. Admin role required.");
        // Redirect non-admin users to appropriate page
        if (user.role === "owner") {
          router.push("/restaurant-owner/dashboard");
        } else {
          router.push("/home");
        }
      }
    }
  }, [authChecked, user, router, pathname]);

  const handleLogout = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (res.ok) {
        setUser(null);
        clearCart();
        setAddress("123 Main Street, City Centre");
        router.push("/login");
        toast.success("Signed out successfully.");
      }
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error("Failed to sign out.");
    }
  };

  const links = [
    { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
    { label: "Approvals", href: "/admin/approvals", icon: "rule" },
    { label: "User Management", href: "/admin/users", icon: "group" },
    { label: "Analytics", href: "/admin/analytics", icon: "insights" },
    { label: "Settings", href: "/admin/settings", icon: "settings" },
  ];

  return (
    <div className="h-screen flex bg-background text-on-surface overflow-hidden">
      {/* Sidebar: Desktop (>= 1024px) & Collapsed on Tablet (>= 768px and < 1024px) */}
      <aside className="hidden md:flex flex-col justify-between border-r border-outline-variant bg-white transition-all duration-300 lg:w-64 md:w-20 h-full shrink-0">
        <div className="p-lg space-y-xl">
          {/* Logo / Branding */}
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl font-extrabold lg:hidden">
              admin_panel_settings
            </span>
            <span className="font-headline-sm text-headline-sm font-extrabold text-primary hidden lg:block tracking-tight">
              Cravingza Admin
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-sm">
            {links.map((link) => {
              const isActive = pathname === link.href || (link.href === "/admin/approvals" && (pathname.includes("/restaurant-approval") || pathname.includes("/rider-approval")));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  className={`flex items-center gap-md px-md py-3.5 rounded-2xl font-body-md text-body-md transition-all duration-200 group relative ${isActive
                    ? "bg-primary-container/10 text-primary font-bold shadow-sm"
                    : "text-on-surface-variant hover:text-primary hover:bg-slate-50"
                    }`}
                >
                  <span className={`material-symbols-outlined text-2xl shrink-0 ${isActive ? "text-primary" : "text-on-surface-variant/70 group-hover:text-primary"}`}>
                    {link.icon}
                  </span>
                  <span className="hidden lg:block whitespace-nowrap truncate">{link.label}</span>

                  {/* Tooltip for collapsed mode */}
                  <div className="lg:hidden absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {link.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Customer Site Link matching partner design */}
          <div className="pt-3 border-t border-outline-variant/40 mt-3">
            <Link
              href="/home"
              title="Customer Site"
              className="flex items-center gap-md px-md py-3 rounded-2xl font-body-md text-body-md text-amber-800 bg-amber-50 hover:bg-amber-100/80 font-bold border border-amber-200/80 transition-all shadow-xs group relative"
            >
              <span className="material-symbols-outlined text-2xl text-amber-600 shrink-0">storefront</span>
              <span className="hidden lg:block whitespace-nowrap">Customer Site</span>
              <div className="lg:hidden absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Customer Site
              </div>
            </Link>
          </div>
        </div>


      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header bar */}
        <header className="flex justify-between items-center bg-white border-b border-outline-variant px-6 py-4 shadow-sm shrink-0 z-20">
          <div className="flex items-center gap-sm">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-on-surface hover:bg-slate-100 transition-colors focus:outline-none"
            >
              <span className="material-symbols-outlined text-2xl block">menu</span>
            </button>
            <Link href="/admin/dashboard" className="flex items-center gap-1.5 md:hidden" title="Admin Home">
              <span className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-primary via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-primary/30 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                  restaurant
                </span>
              </span>
            </Link>
            <span className="font-headline-sm text-headline-sm font-extrabold text-slate-800 tracking-tight hidden md:block">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Menu */}
            <NotificationMenu />

            {/* Profile Avatar & Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-md hover:bg-slate-50 p-1.5 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-slate-200 focus:outline-none"
              >
                <div className="text-right hidden sm:block">
                  {!mounted || !authChecked ? (
                    <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                  ) : (
                    <>
                      <p className="font-label-md text-label-md font-extrabold text-slate-900 leading-none">
                        {user ? user.name : "Admin"}
                      </p>
                      <p className="font-caption text-caption text-slate-400 mt-1">
                        Super Admin
                      </p>
                    </>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden bg-slate-100 shadow-sm flex items-center justify-center shrink-0">
                  <img
                    src={user?.avatar || "/admin-avatar.png"}
                    alt={user?.name || "Admin"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/admin-avatar.png";
                    }}
                  />
                </div>
                <span className="material-symbols-outlined text-slate-400 text-sm hidden sm:block">
                  {isProfileMenuOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-outline-variant/30 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100 sm:hidden">
                    <p className="font-bold text-sm text-slate-900">{user?.name || ""}</p>
                    <p className="text-xs text-slate-400">Super Admin</p>
                  </div>

                  <Link
                    href="/admin/settings"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-body-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-all"
                  >
                    <span className="material-symbols-outlined text-lg text-slate-500">settings</span>
                    <span>Admin Settings</span>
                  </Link>

                  <Link
                    href="/home"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-body-sm font-semibold text-amber-800 bg-amber-50/60 hover:bg-amber-100/80 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg text-amber-600">storefront</span>
                    <span>View Customer Site</span>
                  </Link>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-body-sm font-semibold text-error hover:bg-rose-50 transition-all cursor-pointer text-left"
                    >
                      <span className="material-symbols-outlined text-lg">logout</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop overlay */}
            <div
              className="fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer content panel */}
            <div className="relative flex-1 flex flex-col max-w-[280px] w-full bg-white shadow-2xl p-lg z-50 animate-slide-in-left">
              <div className="flex items-center justify-between mb-xl pb-md border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-primary via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-primary/30">
                    <span className="material-symbols-outlined text-xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                      restaurant
                    </span>
                  </span>
                  <div>
                    <h3 className="font-headline-sm text-sm font-extrabold text-slate-900 leading-none">
                      Cravingza
                    </h3>
                    <p className="text-[10px] font-extrabold text-primary tracking-wide uppercase mt-0.5">
                      Admin Panel
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined text-on-surface-variant block">close</span>
                </button>
              </div>

              <nav className="flex-1 flex flex-col gap-sm overflow-y-auto pr-sm -mr-sm">
                {links.map((link) => {
                  const isActive = pathname === link.href || (link.href === "/admin/approvals" && (pathname.includes("/restaurant-approval") || pathname.includes("/rider-approval")));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-md px-md py-3 rounded-xl font-body-md text-body-md transition-colors ${isActive
                        ? "bg-primary-container/10 text-primary font-bold"
                        : "text-on-surface-variant hover:text-primary hover:bg-slate-50"
                        }`}
                    >
                      <span className="material-symbols-outlined text-2xl">{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  );
                })}

                <div className="pt-3 border-t border-outline-variant/40 mt-3">
                  <Link
                    href="/home"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-md px-md py-3 rounded-2xl font-body-md text-body-md text-amber-800 bg-amber-50 hover:bg-amber-100/80 font-bold border border-amber-200/80 transition-all shadow-xs"
                  >
                    <span className="material-symbols-outlined text-amber-600">storefront</span>
                    <span>Customer Site</span>
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          {!mounted || !authChecked ? (
            <div className="h-full min-h-[300px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-4xl animate-spin text-primary">autorenew</span>
                <p className="font-label-md text-label-md text-on-surface-variant">Verifying admin access...</p>
              </div>
            </div>
          ) : user?.role !== "admin" ? (
            <div className="h-full min-h-[300px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-4xl text-error animate-bounce">lock</span>
                <p className="font-label-md text-label-md text-on-surface-variant">Redirecting to authorized panel...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 py-1.5 px-2 shadow-lg flex justify-around items-center">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href === "/admin/approvals" && (pathname.includes("/restaurant-approval") || pathname.includes("/rider-approval")));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${isActive ? "text-primary font-bold scale-105" : "text-slate-500 hover:text-slate-900"
                  }`}
              >
                <span className={`material-symbols-outlined text-xl ${isActive ? "text-primary font-bold" : "text-slate-400"}`}>
                  {link.icon}
                </span>
                <span className="text-[10px] tracking-tight">{link.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
