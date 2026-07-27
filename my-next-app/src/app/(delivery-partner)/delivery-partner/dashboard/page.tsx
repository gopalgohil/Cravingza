"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  useGetDeliveryDashboardQuery,
  useUpdateDeliveryStatusMutation,
} from "@/lib/redux/apiSlice";
import { DeliveryDashboardData } from "@/lib/models/Delivery";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function DeliveryDashboardPage() {
  const { permission, isSubscribing, enableNotifications } = usePushNotifications();
  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useGetDeliveryDashboardQuery(undefined, {
    pollingInterval: 15000, // Poll every 15s for new orders/status
  });

  const [updateStatus, { isLoading: isUpdating }] = useUpdateDeliveryStatusMutation();

  const dashboardData: DeliveryDashboardData | undefined = response?.data;

  // Local optimistic state for online toggle
  const [isOnlineLocal, setIsOnlineLocal] = useState<boolean>(false);

  useEffect(() => {
    if (dashboardData !== undefined) {
      setIsOnlineLocal(dashboardData.isOnline);
    }
  }, [dashboardData]);

  const handleToggleOnline = async () => {
    const nextState = !isOnlineLocal;
    // Optimistic UI update
    setIsOnlineLocal(nextState);

    try {
      const res = await updateStatus({ isOnline: nextState }).unwrap();
      if (res?.success) {
        toast.success(
          nextState
            ? "You are now ONLINE. You will receive nearby delivery requests!"
            : "You are now OFFLINE. Delivery requests paused."
        );
      }
    } catch (err: any) {
      // Revert on error
      setIsOnlineLocal(!nextState);
      toast.error(err?.data?.message || "Failed to update status. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Loading delivery dashboard...</p>
      </div>
    );
  }

  if (isError || !dashboardData) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl">error_outline</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Failed to load dashboard</h2>
        <p className="text-sm text-slate-500">
          Make sure your delivery partner profile is approved and your connection is active.
        </p>
        <button
          onClick={() => refetch()}
          className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  const {
    earningsToday,
    deliveriesCompletedToday,
    activeHoursToday,
    distanceCoveredToday,
    averageRating,
    lifetimeDeliveries,
    activeDelivery,
  } = dashboardData;

  return (
    <div className="space-y-6 pb-24 md:pb-8 max-w-6xl mx-auto">
      {/* ── TOP HEADER CARD & TOGGLE (Online vs Offline Variant) ── */}
      <div
        className={`rounded-3xl p-6 md:p-8 transition-all duration-300 border ${
          isOnlineLocal
            ? "bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border-emerald-500/30 shadow-xl shadow-emerald-950/20"
            : "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white border-slate-800 shadow-lg"
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  isOnlineLocal ? "bg-emerald-400 animate-ping" : "bg-slate-500"
                }`}
              />
              <span
                className={`text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full ${
                  isOnlineLocal
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {isOnlineLocal ? "You are Online" : "You are Offline"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {isOnlineLocal ? "Ready to Receive Deliveries 🚀" : "Duty Paused"}
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              {isOnlineLocal
                ? "You will automatically receive notifications for nearby order pickup requests."
                : "Toggle your status to Online whenever you are ready to start accepting delivery orders."}
            </p>
          </div>

          {/* ONLINE / OFFLINE TOGGLE BUTTON */}
          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
            <button
              onClick={handleToggleOnline}
              disabled={isUpdating}
              className={`w-full md:w-auto px-8 py-4 rounded-2xl font-extrabold text-base transition-all duration-200 flex items-center justify-center gap-3 shadow-lg cursor-pointer ${
                isOnlineLocal
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95 shadow-emerald-500/20"
                  : "bg-gradient-to-r from-primary to-orange-500 hover:opacity-95 text-white active:scale-95 shadow-primary/30"
              }`}
            >
              <span className="material-symbols-outlined text-2xl">
                {isOnlineLocal ? "power_settings_new" : "play_circle"}
              </span>
              <span>{isOnlineLocal ? "Go Offline" : "Go Online Now"}</span>
            </button>
            <span className="text-[11px] text-slate-400 font-medium">
              {isOnlineLocal ? "Tap to pause receiving orders" : "Tap to start accepting orders"}
            </span>
          </div>
        </div>
      </div>

      {/* ── WEB PUSH NOTIFICATIONS OPT-IN BANNER ── */}
      {permission === "default" && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 text-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
              <span className="material-symbols-outlined text-2xl text-white">notifications_active</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Enable Push Notifications</h4>
              <p className="text-xs text-slate-600">Get instant alerts on your phone or desktop when new delivery orders are ready for pickup!</p>
            </div>
          </div>
          <button
            onClick={enableNotifications}
            disabled={isSubscribing}
            className="w-full md:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
          >
            {isSubscribing ? "Enabling..." : "Enable Notifications"}
          </button>
        </div>
      )}

      {/* ── ACTIVE DELIVERY BANNER (IF ANY) ── */}
      {activeDelivery && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-xl shadow-orange-500/20 border border-amber-400/30 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-3xl animate-bounce">
                two_wheeler
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase bg-white/20 px-2.5 py-0.5 rounded-full text-white tracking-wider">
                  Active Delivery Job
                </span>
                <span className="text-xs font-mono opacity-80">
                  #{activeDelivery.orderId.slice(-6)}
                </span>
              </div>
              <h3 className="text-lg font-bold mt-1">
                Pickup from {activeDelivery.restaurantName}
              </h3>
              {activeDelivery.customerAddress && (
                <p className="text-xs opacity-90 truncate max-w-md">
                  Destination: {activeDelivery.customerAddress}
                </p>
              )}
            </div>
          </div>
          <Link
            href="/delivery-partner/active"
            className="w-full md:w-auto px-6 py-3 bg-white text-orange-600 font-extrabold rounded-2xl shadow-md hover:bg-orange-50 active:scale-95 transition-all text-center text-sm shrink-0"
          >
            Continue Active Delivery →
          </Link>
        </div>
      )}

      {/* ── TODAY'S PERFORMANCE SUMMARY METRICS ── */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">today</span>
          <span>Today&apos;s Performance</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Today's Earnings */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Earnings</span>
              <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-2 rounded-xl text-xl">
                payments
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900">
              ₹{earningsToday.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Payout today</p>
          </div>

          {/* Completed Deliveries */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Deliveries</span>
              <span className="material-symbols-outlined text-blue-500 bg-blue-50 p-2 rounded-xl text-xl">
                check_circle
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900">
              {deliveriesCompletedToday}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Orders completed</p>
          </div>

          {/* Distance Covered */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Distance</span>
              <span className="material-symbols-outlined text-purple-500 bg-purple-50 p-2 rounded-xl text-xl">
                distance
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900">
              {distanceCoveredToday} <span className="text-base font-semibold text-slate-500">km</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Travelled today</p>
          </div>

          {/* Active Hours Placeholder */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Duty Hours</span>
              <span className="material-symbols-outlined text-amber-500 bg-amber-50 p-2 rounded-xl text-xl">
                schedule
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900">
              {/* TODO: Real time-tracking is a future enhancement */}
              {activeHoursToday > 0 ? `${activeHoursToday} hrs` : "—"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Time online today</p>
          </div>
        </div>
      </div>

      {/* ── OVERALL STATS & RATINGS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lifetime Stats Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Lifetime Achievements</h3>
              <p className="text-xs text-slate-400">Total historical completed deliveries</p>
            </div>
          </div>
          <div className="flex items-baseline gap-3 pt-2">
            <span className="text-4xl font-extrabold text-primary">{lifetimeDeliveries}</span>
            <span className="text-sm font-semibold text-slate-500">Total Completed Orders</span>
          </div>
          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
            Keep delivering consistently to unlock higher priority order assignments and bonus incentives.
          </p>
        </div>

        {/* Rating Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined">star</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Customer Feedback Rating</h3>
              <p className="text-xs text-slate-400">Based on recent customer reviews</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            {/* TODO: Review model currently only supports restaurant reviews; future DeliveryReview model needed */}
            <span className="text-4xl font-extrabold text-slate-800">
              {typeof averageRating === "number" && averageRating > 0 ? averageRating.toFixed(1) : "—"}
            </span>
            <div className="flex flex-col">
              <div className="flex text-amber-400 text-lg">
                {"★★★★★"}
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {typeof averageRating === "number" && averageRating > 0
                  ? "Overall rating"
                  : "No ratings recorded yet"}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
            Maintain safe driving and polite customer interaction to keep ratings high!
          </p>
        </div>
      </div>

      {/* ── QUICK ACTION LINKS & NAVIGATION ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/delivery-partner/nearby-orders"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-primary/50 hover:shadow-md transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">explore</span>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">
              Explore Nearby Orders
            </h4>
            <p className="text-xs text-slate-400">View available pickup requests in your area</p>
          </div>
        </Link>

        <Link
          href="/delivery-partner/earnings"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm group-hover:text-emerald-600 transition-colors">
              Earnings & Payouts
            </h4>
            <p className="text-xs text-slate-400">Check weekly payout history and bank transfers</p>
          </div>
        </Link>

        <Link
          href="/profile"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-purple-500/50 hover:shadow-md transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">manage_accounts</span>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm group-hover:text-purple-600 transition-colors">
              Rider Profile & Vehicle
            </h4>
            <p className="text-xs text-slate-400">Update documents and vehicle details</p>
          </div>
        </Link>
      </div>

      {/* ── MOBILE BOTTOM NAVIGATION BAR ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl z-50 px-6 py-2 flex justify-around items-center">
        <Link
          href="/delivery-partner/dashboard"
          className="flex flex-col items-center gap-1 text-primary font-bold"
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px]">Dashboard</span>
        </Link>
        <Link
          href="/delivery-partner/nearby-orders"
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">explore</span>
          <span className="text-[10px]">Orders</span>
        </Link>
        <Link
          href="/delivery-partner/earnings"
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">payments</span>
          <span className="text-[10px]">Earnings</span>
        </Link>
        <Link
          href="/profile"
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px]">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
