"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useGetMyApplicationQuery, apiSlice } from "@/lib/redux/apiSlice";
import { useDispatch } from "react-redux";
import { subscribeToWebOrderUpdates } from "@/lib/socket";
import { toast } from "sonner";
import NotificationMenu from "@/components/customer/NotificationMenu";

const RestaurantDashboardSkeleton = () => (
  <div className="space-y-lg animate-pulse">
    {/* Page Header Skeleton */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md pb-md border-b border-outline-variant/30">
      <div className="space-y-2 w-full md:w-auto">
        <div className="h-8 bg-slate-200 rounded-lg w-48"></div>
        <div className="h-4 bg-slate-200 rounded-lg w-64"></div>
      </div>
      <div className="flex items-center gap-sm">
        <div className="h-10 bg-slate-200 rounded-xl w-32"></div>
        <div className="h-10 bg-slate-200 rounded-xl w-28"></div>
      </div>
    </div>

    {/* Metric Cards Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-3 bg-slate-200 rounded w-20"></div>
            <div className="w-8 h-8 bg-slate-200 rounded-xl"></div>
          </div>
          <div className="h-7 bg-slate-200 rounded-lg w-28"></div>
          <div className="h-3 bg-slate-200 rounded w-24"></div>
        </div>
      ))}
    </div>

    {/* Recent Activity Skeleton */}
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
      <div className="h-5 bg-slate-200 rounded-lg w-40"></div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-slate-50 rounded-2xl p-4"></div>
        ))}
      </div>
    </div>
  </div>
);

export default function RestaurantOwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, authChecked, clearCart, setAddress } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [cachedStatus, setCachedStatus] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  // Profile Dropdown state
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const dispatch = useDispatch();

  // Real-Time WebSockets (Socket.io) Instant Sync for Partner Web Console
  useEffect(() => {
    const unsubscribeSocket = subscribeToWebOrderUpdates((orderData) => {
      console.log("⚡ [Partner Portal Web] Real-Time Socket.io Order Update Received:", orderData);
      dispatch(apiSlice.util.invalidateTags(["MerchantOrders", "Orders", "AdminDashboard", "Notifications"]));
      toast.info(`🔔 Live Order Alert: Status updated to ${orderData?.status?.toUpperCase() || "NEW"}`);
    });

    return () => unsubscribeSocket();
  }, [dispatch]);

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
    setIsRouteLoading(true);
    const timer = setTimeout(() => {
      setIsRouteLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Fetch the application details
  const { data: appResponse, isLoading } = useGetMyApplicationQuery(undefined, {
    skip: !user,
  });

  const application = appResponse?.data;
  const status = application?.approvalStatus;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("cravingza_application_status");
      if (cached) setCachedStatus(cached);
    }
  }, []);

  useEffect(() => {
    if (status) {
      localStorage.setItem("cravingza_application_status", status);
      setCachedStatus(status);
    }
  }, [status]);

  useEffect(() => {
    if (application?.name) {
      localStorage.setItem("cravingza_restaurant_name", application.name);
    }
  }, [application?.name]);

  useEffect(() => {
    let active = true;
    setTimeout(() => {
      if (active) setMounted(true);
    }, 0);
    return () => {
      active = false;
    };
  }, []);

  // Redirect to login if auth is checked and user is not authenticated
  useEffect(() => {
    if (authChecked && !user) {
      router.push(`/login?redirect=${pathname}`);
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

  const isDeactivated = application?.adminDeactivated || false;
  const deactivationReason = application?.deactivationReason || "Your restaurant has been deactivated by Cravingza. Contact support.";

  if (mounted && authChecked && (cachedStatus !== "approved" || isDeactivated)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-md">
        <div className="max-w-md w-full bg-white rounded-3xl p-xl shadow-xl border border-outline-variant/40 text-center space-y-md">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            <span className="material-symbols-outlined text-3xl">
              {isDeactivated ? "block" : status === "rejected" ? "cancel" : "storefront"}
            </span>
          </div>

          <div className="space-y-xs">
            <h1 className="font-headline-sm text-headline-sm font-extrabold text-on-surface">
              {isDeactivated
                ? "Restaurant Deactivated"
                : status === "rejected"
                ? "Application Rejected"
                : status === "pending"
                ? "Application Under Review"
                : "Console Locked"}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {isDeactivated
                ? deactivationReason
                : status === "rejected"
                ? application?.rejectionReason || "Your partner application was not approved by super admin."
                : status === "pending"
                ? "Your application to become a restaurant partner is being reviewed by Cravingza Admin."
                : "You must apply and be approved as a restaurant partner to access this console."}
            </p>
          </div>

          {!isDeactivated && (
            <div className="bg-slate-50 rounded-2xl p-md border border-outline-variant/30 text-left space-y-xs text-xs">
              <p className="font-bold text-on-surface">Application Details:</p>
              <p><span className="text-on-surface-variant">Restaurant:</span> {application?.name || "N/A"}</p>
              <p><span className="text-on-surface-variant">Status:</span> <span className="font-bold text-primary capitalize">{status || "Pending"}</span></p>
              {application?.submittedAt && (
                <p><span className="text-on-surface-variant">Submitted:</span> {new Date(application.submittedAt).toLocaleDateString()}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-col gap-3">
            {!isDeactivated && (
              <Link
                href="/become-partner"
                className="bg-primary hover:bg-primary/95 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-primary/10 active:scale-95 text-center block"
              >
                {status === "rejected" ? "Review & Reapply" : status === "pending" ? "View Application Status" : "Apply as Partner"}
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="border border-outline-variant/60 hover:bg-slate-50 text-on-surface font-bold py-3 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full Navigation Links
  const links = [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { label: "Menu Management", href: "/menu", icon: "restaurant_menu" },
    { label: "Incoming Orders", href: "/orders", icon: "receipt_long" },
    { label: "Offers & Coupons", href: "/offers", icon: "local_offer" },
    { label: "Analytics", href: "/analytics", icon: "analytics" },
    { label: "Customer Reviews", href: "/reviews", icon: "star" },
    { label: "Settings", href: "/settings", icon: "settings" },
  ];

  const displayName = mounted
    ? (application?.name || (typeof window !== "undefined" ? localStorage.getItem("cravingza_restaurant_name") : null) || "Chef's Bistro")
    : "Chef's Bistro";
  const displayInitials = displayName.substring(0, 2).toUpperCase();

  // We are checking auth or loading the status from the server
  const isContentLoading = !mounted || !authChecked || (isLoading && cachedStatus !== "approved") || isRouteLoading;

  return (
    <div className="h-screen flex bg-background text-on-surface overflow-hidden">
      {/* Sidebar Nav */}
      <aside className="w-64 h-screen bg-white border-r border-outline-variant flex flex-col justify-between hidden md:flex flex-shrink-0">
        <div className="p-lg space-y-xl">
          <Link href="/restaurant-owner/dashboard">
            <span className="font-headline-md text-headline-md font-bold text-primary block">
              Cravingza Partner
            </span>
          </Link>
          <nav className="flex flex-col gap-sm">
            {links.map((link) => {
              const isActive = pathname.endsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={`/restaurant-owner${link.href}`}
                  className={`flex items-center gap-md px-md py-3 rounded-xl font-body-md text-body-md transition-colors ${
                    isActive
                      ? "bg-primary/5 text-primary font-bold border-l-4 border-primary"
                      : "text-on-surface-variant hover:text-primary hover:bg-slate-50"
                  }`}
                >
                  <span className="material-symbols-outlined">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="pt-3 border-t border-outline-variant/40 mt-3">
              <Link
                href="/home"
                className="flex items-center gap-md px-md py-3 rounded-2xl font-body-md text-body-md text-amber-800 bg-amber-50 hover:bg-amber-100/80 font-bold border border-amber-200/80 transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-amber-600">storefront</span>
                <span>Customer Site</span>
              </Link>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header bar - with Notification Menu and Profile Dropdown */}
        <header className="flex justify-between items-center bg-white border-b border-outline-variant px-3 sm:px-6 py-3 shadow-sm shrink-0 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-on-surface hover:bg-slate-100 transition-colors focus:outline-none"
            >
              <span className="material-symbols-outlined text-2xl block">menu</span>
            </button>
            <span className="font-headline-sm text-headline-sm font-extrabold text-slate-800 tracking-tight hidden md:block">
              Partner Portal
            </span>
            <span className="text-base font-black text-primary tracking-tight md:hidden">
              Cravingza
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Notification Menu */}
            <NotificationMenu />

            {/* Profile Avatar & Interactive Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-slate-200 focus:outline-none"
              >
                <div className="text-right hidden sm:block">
                  {!mounted || !authChecked ? (
                    <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
                  ) : (
                    <>
                      <p className="font-label-md text-label-md font-extrabold text-slate-900 leading-none">
                        {displayName}
                      </p>
                      <p className="font-caption text-caption text-slate-400 mt-1">
                        Restaurant Partner
                      </p>
                    </>
                  )}
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-primary to-orange-500 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-md shadow-primary/20 shrink-0">
                  {mounted ? displayInitials : ""}
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-outline-variant/30 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100 sm:hidden">
                    <p className="font-bold text-sm text-slate-900">{mounted ? displayName : ""}</p>
                    <p className="text-xs text-slate-400">Restaurant Partner</p>
                  </div>

                  <Link
                    href="/restaurant-owner/settings"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-body-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-all"
                  >
                    <span className="material-symbols-outlined text-lg text-slate-500">settings</span>
                    <span>Restaurant Settings</span>
                  </Link>

                  <Link
                    href="/home"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-body-sm font-semibold text-amber-800 bg-amber-50/60 hover:bg-amber-100/80 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg text-amber-600">storefront</span>
                    <span>Customer Site</span>
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
              <div className="flex items-center justify-between mb-xl">
                <span className="font-headline-md text-headline-md font-bold text-primary">
                  Cravingza Partner
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined text-on-surface-variant block">close</span>
                </button>
              </div>

              <nav className="flex-1 flex flex-col gap-sm overflow-y-auto pr-sm -mr-sm">
                {links.map((link) => {
                  const isActive = pathname.endsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={`/restaurant-owner${link.href}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-md px-md py-3 rounded-xl font-body-md text-body-md transition-colors ${
                        isActive
                          ? "bg-primary/5 text-primary font-bold border-l-4 border-primary"
                          : "text-on-surface-variant hover:text-primary hover:bg-slate-50"
                      }`}
                    >
                      <span className="material-symbols-outlined">{link.icon}</span>
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
            
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes slideInLeft {
                from { transform: translateX(-100%); }
                to { transform: translateX(0); }
              }
              .animate-slide-in-left {
                animation: slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
            `}} />
          </div>
        )}

        {/* Main page content area */}
        <main className="flex-1 overflow-y-auto p-md md:p-xl bg-background pb-24 md:pb-8">
          {isContentLoading ? <RestaurantDashboardSkeleton /> : children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 py-1.5 px-2 shadow-lg flex justify-around items-center">
          {links.map((link) => {
            const isActive = pathname.endsWith(link.href);
            return (
              <Link
                key={link.href}
                href={`/restaurant-owner${link.href}`}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                  isActive ? "text-primary font-bold scale-105" : "text-slate-500 hover:text-slate-900"
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
