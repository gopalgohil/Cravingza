"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useGetDeliveryEarningsQuery } from "@/lib/redux/apiSlice";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 4;

export default function RiderEarningsPage() {
  const { data: response, isLoading, isError, refetch } = useGetDeliveryEarningsQuery(undefined, {
    pollingInterval: 15000,
  });

  const [activeFilter, setActiveFilter] = useState<"all" | "today" | "week">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageChanging, setIsPageChanging] = useState(false);

  const earnings = response?.data;
  const history = earnings?.history || [];

  const filterHistory = () => {
    if (activeFilter === "today") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      return history.filter((item: any) => new Date(item.deliveredAt) >= startOfToday);
    }
    if (activeFilter === "week") {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);
      return history.filter((item: any) => new Date(item.deliveredAt) >= startOfWeek);
    }
    return history;
  };

  const filteredItems = filterHistory();
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;

  // Slice items for current page
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage || newPage < 1 || newPage > totalPages) return;
    setIsPageChanging(true);
    setCurrentPage(newPage);
    setTimeout(() => {
      setIsPageChanging(false);
    }, 380); // Smooth skeleton transition
  };

  const handleFilterChange = (filter: "all" | "today" | "week") => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Loading your earnings dashboard...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-red-200 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900">Failed to load earnings</h2>
        <p className="text-xs text-slate-500">Could not connect to server. Please try refreshing.</p>
        <button
          onClick={() => refetch()}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 md:pb-8 px-2 sm:px-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Earnings & Payouts</span>
            <span className="text-emerald-500 text-xl font-normal">💰</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time track of your daily payouts, trip earnings, and bank settlements
          </p>
        </div>

        <button
          onClick={() => {
            refetch();
            toast.success("Earnings updated!");
          }}
          className="self-start sm:self-auto px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base text-slate-500">refresh</span>
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Earnings */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-3xl p-5 shadow-lg shadow-emerald-500/15 space-y-2 relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-10">
            <span className="material-symbols-outlined text-7xl">today</span>
          </div>
          <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Today&apos;s Earnings</p>
          <h2 className="text-3xl font-black tracking-tight">₹{earnings?.todayEarnings || 0}</h2>
          <div className="flex items-center gap-1 text-[11px] text-emerald-100/90 font-medium">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span>Refreshes on completion</span>
          </div>
        </div>

        {/* Card 2: Weekly Total */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2 relative">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
            <span className="material-symbols-outlined text-xl">date_range</span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">This Week</p>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">₹{earnings?.weeklyEarnings || 0}</h2>
          <p className="text-[11px] text-slate-500">Last 7 days accumulated</p>
        </div>

        {/* Card 3: Total Earnings */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2 relative">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
            <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Lifetime</p>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">₹{earnings?.totalEarnings || 0}</h2>
          <p className="text-[11px] text-slate-500">All completed deliveries</p>
        </div>

        {/* Card 4: Completed Trips & Avg */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2 relative">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
            <span className="material-symbols-outlined text-xl">two_wheeler</span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Completed Trips</p>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{earnings?.completedCount || 0} Jobs</h2>
          <p className="text-[11px] text-emerald-600 font-bold">Avg ₹{earnings?.avgPerDelivery || "0.00"} / trip</p>
        </div>
      </div>

      {/* Payout Bank Account Summary Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">account_balance</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-sm">Direct Bank Payout Account</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Bank: <strong className="text-slate-800">{earnings?.bankDetails?.bankName || "Registered Bank"}</strong> • A/C: <strong className="text-slate-800">•••• {earnings?.bankDetails?.accountNumber?.slice(-4) || "XXXX"}</strong> • IFSC: <strong className="text-slate-800">{earnings?.bankDetails?.ifsc || "N/A"}</strong>
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-slate-500 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 w-full sm:w-auto">
          <span className="block text-[10px] font-bold text-slate-400 uppercase">Payout Schedule</span>
          <span className="font-bold text-emerald-700">Weekly Auto Transfer (Mondays)</span>
        </div>
      </div>

      {/* Recent Trips & Payout History Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        {/* Section Header & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Completed Job Payouts</h3>
            <p className="text-xs text-slate-400">Detailed list of food orders delivered by you (Showing 4 per page)</p>
          </div>

          {/* Filter Pills */}
          <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-bold">
            <button
              onClick={() => handleFilterChange("all")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All ({history.length})
            </button>
            <button
              onClick={() => handleFilterChange("today")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeFilter === "today" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleFilterChange("week")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeFilter === "week" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              This Week
            </button>
          </div>
        </div>

        {/* Trips History List with Skeleton Loading */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">receipt_long</span>
            </div>
            <h4 className="text-sm font-bold text-slate-700">No completed trip earnings yet</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Deliver nearby food orders to start accumulating daily earnings in your wallet!
            </p>
            <Link
              href="/delivery-partner/nearby-orders"
              className="inline-block px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 transition-all shadow-sm"
            >
              Find Nearby Orders
            </Link>
          </div>
        ) : isPageChanging ? (
          /* Skeleton Loader (4 items) during page transition */
          <div className="space-y-3">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/60 animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[76px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0"></div>
                  <div className="space-y-2">
                    <div className="w-36 h-4 bg-slate-200 rounded"></div>
                    <div className="w-28 h-3 bg-slate-200 rounded"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/50">
                  <div className="w-20 h-6 bg-slate-200 rounded-full"></div>
                  <div className="w-16 h-6 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Actual Paginated Order Cards */
          <div className="space-y-3">
            {paginatedItems.map((item: any) => {
              const formattedDate = new Date(item.deliveredAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={item._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200/70 transition-all gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 font-bold">
                      <span className="material-symbols-outlined text-xl">storefront</span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{item.restaurantName}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>Order #{String(item.orderId).slice(-6)}</span>
                        <span>•</span>
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-200/60 pt-2 sm:pt-0">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check_circle</span>
                      <span>Delivered</span>
                    </span>
                    <span className="font-black text-emerald-600 text-base sm:text-lg">
                      +₹{item.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar Controls */}
        {filteredItems.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs">
            <span className="text-slate-400 font-medium text-center sm:text-left">
              Showing <strong className="text-slate-700">{startIndex + 1}</strong> -{" "}
              <strong className="text-slate-700">{Math.min(startIndex + ITEMS_PER_PAGE, filteredItems.length)}</strong> of{" "}
              <strong className="text-slate-700">{filteredItems.length}</strong> payouts
            </span>

            <div className="flex items-center justify-center gap-1.5">
              {/* Prev Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isPageChanging}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
                <span>Prev</span>
              </button>

              {/* Page Number Buttons */}
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  disabled={isPageChanging}
                  className={`w-8 h-8 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isPageChanging}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer flex items-center gap-1"
              >
                <span>Next</span>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
