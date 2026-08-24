"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useGetMyDeliveryApplicationQuery, apiSlice } from "@/lib/redux/apiSlice";
import { useDispatch } from "react-redux";
import { subscribeToWebOrderUpdates } from "@/lib/socket";
import { toast } from "sonner";
import NotificationMenu from "@/components/customer/NotificationMenu";

export default function DeliveryPartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, authChecked, clearCart, setAddress } = useAppStore();
  const [mounted, setMounted] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    setMounted(true);

    const unsubscribeSocket = subscribeToWebOrderUpdates((orderData) => {
      console.log("⚡ [Delivery Partner Web] Real-Time Socket.io Order Event Received:", orderData);
      dispatch(apiSlice.util.invalidateTags(["Delivery", "Orders", "Notifications"]));
    });

    return () => unsubscribeSocket();
  }, [dispatch]);

  // Fetch delivery application details
  const {
    data: appResponse,
    isLoading: appLoading,
    refetch,
  } = useGetMyDeliveryApplicationQuery(undefined, {
    skip: !user,
  });

  const application = appResponse?.data;
  const approvalStatus = application?.approvalStatus;

  // Protect client route
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

  const links = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Nearby Orders", href: "/nearby-orders" },
    { label: "Earnings", href: "/earnings" },
  ];

  if (!mounted || !authChecked || appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary">autorenew</span>
          <p className="text-sm text-slate-500 font-medium">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  // If user has not logged in, wait for redirect effect
  if (!user) return null;

  // LOCK screen: User has not applied OR is pending OR is rejected
  const isApproved = user.role === "delivery" || approvalStatus === "approved";

  if (!isApproved) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fcf9f8] text-on-surface">
        {/* Header (Shell Implementation) */}
        <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white border-b border-slate-100 shadow-sm">
          <div className="text-headline-md font-headline-md font-bold text-primary">Cravingza Rider</div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-primary transition-colors cursor-pointer">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button
              onClick={handleLogout}
              className="text-error font-body-md flex items-center gap-xs cursor-pointer hover:underline"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Lock Screen Content */}
        <main className="flex-grow flex items-center justify-center px-6 pt-20 pb-20">
          {!application ? (
            /* No application submitted yet */
            <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-8 flex flex-col items-center text-center space-y-6 border border-slate-100">
              <div className="w-20 h-20 bg-primary/5 text-primary rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl font-bold">sports_motorsports</span>
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-on-surface">Rider Dashboard Locked</h1>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  You haven&rsquo;t submitted a delivery partner application yet. Apply now to get access to the Rider console and start delivering orders!
                </p>
              </div>
              <button
                onClick={() => router.push("/become-delivery-partner")}
                className="w-full py-3.5 bg-primary text-white rounded-full font-bold shadow-md shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                Become a Delivery Partner
              </button>
            </div>
          ) : approvalStatus === "pending" ? (
            /* Pending State UI (dashboard_pending match) */
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-8 flex flex-col items-center text-center space-y-6 border border-slate-100">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/5 rounded-full scale-150 blur-xl"></div>
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center relative z-10 animate-pulse">
                  <span className="material-symbols-outlined text-primary text-[40px]">pending_actions</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-on-surface">Your application is under review</h1>
                <p className="text-sm text-slate-500 px-2 leading-relaxed">
                  We are currently verifying your credentials and vehicle details. This process usually takes 2-3 business days.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full border border-amber-200/50">
                <span className="w-2 h-2 bg-accent-orange rounded-full animate-ping"></span>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending Approval</span>
              </div>

              <div className="w-full bg-[#fcf9f8] rounded-2xl p-4 space-y-3 border border-slate-100 text-left">
                <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                  <span className="text-xs text-slate-400 font-medium">Submitted on</span>
                  <span className="text-xs font-bold text-slate-800">
                    {new Date(application.submittedAt || application.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">Primary Zone</span>
                  <span className="text-xs font-bold text-slate-800">{application.city}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 italic">
                &ldquo;You will get full access to the delivery dashboard once approved.&rdquo;
              </p>

              <button
                onClick={() => toast.info("Support ticket created. We will reach out shortly.")}
                className="w-full py-3.5 bg-slate-100 text-slate-700 font-bold rounded-full transition-all active:scale-95 flex items-center justify-center gap-2 text-sm cursor-pointer hover:bg-slate-200"
              >
                <span className="material-symbols-outlined text-base">support_agent</span>
                Contact Support
              </button>
            </div>
          ) : (
            /* Rejected State UI (application_not_approved match) */
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-8 flex flex-col items-center text-center space-y-6 border border-slate-100">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center relative">
                <span className="material-symbols-outlined text-rose-600 text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  error
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-bold text-on-surface">Application Not Approved</h1>
                <p className="text-sm text-slate-500 px-2 leading-relaxed">
                  We reviewed your details, and unfortunately, we can&rsquo;t move forward with your application at this time.
                </p>
              </div>

              <div className="w-full bg-[#fcf9f8] rounded-2xl p-5 text-left border-l-4 border-rose-500 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Reason for rejection</p>
                <p className="text-sm font-semibold text-slate-800">
                  {application.rejectionReason || "Incomplete or blurry document photos"}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Please ensure your verification documents are clearly visible and all text is legible.
                </p>
              </div>

              <button
                onClick={() => router.push("/become-delivery-partner/apply")}
                className="w-full bg-accent-orange hover:bg-accent-orange/95 text-white py-3.5 rounded-full font-bold shadow-lg shadow-accent-orange/20 active:scale-95 transition-all cursor-pointer text-sm"
              >
                Reapply
              </button>

              <button
                onClick={() => toast.info("Routing to support chat...")}
                className="text-slate-400 hover:text-primary font-bold text-sm transition-colors cursor-pointer"
              >
                Contact Support
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-on-surface">
      {/* Header bar for delivery partners */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 w-full shadow-sm">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-3 flex items-center justify-between">
          <div className="flex items-center gap-lg">
            <Link href="/delivery-partner/dashboard">
              <span className="font-headline-sm text-headline-sm font-extrabold text-primary tracking-tight">
                Cravingza Rider
              </span>
            </Link>
            <nav className="hidden sm:flex gap-md ml-8">
              {links.map((link) => {
                const isActive = pathname.endsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={`/delivery-partner${link.href}`}
                    className={`font-body-md text-sm transition-colors px-3 py-1.5 rounded-lg ${
                      isActive
                        ? "text-primary font-bold bg-primary/5"
                        : "text-slate-500 hover:text-primary hover:bg-slate-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-md">
            <NotificationMenu />
            <span className="font-bold text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
              Active Rider Mode
            </span>
            <button
              onClick={handleLogout}
              className="text-rose-500 font-body-md flex items-center gap-xs cursor-pointer hover:underline text-sm ml-2"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-lg pb-20 sm:pb-lg">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (sm:hidden) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2.5 flex items-center justify-around z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {[
          { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
          { label: "Nearby Orders", href: "/nearby-orders", icon: "moped" },
          { label: "Earnings", href: "/earnings", icon: "account_balance_wallet" },
        ].map((link) => {
          const isActive = pathname.endsWith(link.href);
          return (
            <Link
              key={link.href}
              href={`/delivery-partner${link.href}`}
              className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
                isActive ? "text-primary font-bold" : "text-slate-500"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
