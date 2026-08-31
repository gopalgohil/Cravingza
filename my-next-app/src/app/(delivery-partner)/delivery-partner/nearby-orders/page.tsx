"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useGetNearbyOrdersQuery,
  useAcceptOrderMutation,
  useUpdateDeliveryStatusMutation,
} from "@/lib/redux/apiSlice";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

export default function NearbyOrdersPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const storageKey = `cravingza_declined_orders_${user?.id || (user as any)?._id || "guest"}`;

  const {
    data: response,
    isLoading,
    isFetching,
    refetch,
  } = useGetNearbyOrdersQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  const [acceptOrder, { isLoading: isAccepting }] = useAcceptOrderMutation();
  const [updateStatus, { isLoading: isTogglingOnline }] = useUpdateDeliveryStatusMutation();

  // Local state to store declined order IDs
  const [declinedOrderIds, setDeclinedOrderIds] = useState<string[]>([]);

  // Synchronize declined orders from localStorage when user is loaded or on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const uId = user?.id || (user as any)?._id || user?.email || "guest";
        const userKey = `cravingza_declined_orders_${uId}`;
        const userSaved = localStorage.getItem(userKey);
        const globalSaved = localStorage.getItem("cravingza_declined_orders_global");
        
        let userList: string[] = userSaved ? JSON.parse(userSaved) : [];
        let globalList: string[] = globalSaved ? JSON.parse(globalSaved) : [];
        const combined = Array.from(new Set([...userList, ...globalList]));
        if (combined.length > 0) {
          setDeclinedOrderIds(combined);
        }
      } catch (e) {}
    }
  }, [user]);

  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 4; // 4 orders per page for clean pagination

  const isOnline = response?.isOnline ?? true;
  const hasActiveDelivery = response?.hasActiveDelivery ?? false;
  const rawOrders = response?.data || [];

  // Filter out declined orders (permanently hidden)
  const availableOrders = useMemo(() => {
    return rawOrders.filter((o: any) => !declinedOrderIds.includes(o._id));
  }, [rawOrders, declinedOrderIds]);

  // Filter by search query
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return availableOrders;
    const q = searchQuery.toLowerCase().trim();
      return availableOrders.filter((o: any) => {
        const name = o.restaurantName || o.restaurant?.name || "";
        const addr = o.restaurantAddress || o.restaurant?.address || o.restaurant?.location?.address || "";
        const deliv = typeof o.deliveryAddress === "object" && o.deliveryAddress !== null
          ? (o.deliveryAddress.addressLine || "")
          : (o.deliveryAddress || "");
        return (
          name.toLowerCase().includes(q) ||
          addr.toLowerCase().includes(q) ||
          deliv.toLowerCase().includes(q)
        );
      });
    }, [availableOrders, searchQuery]);

  // Reset to page 1 if search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const handlePageChange = (pageNum: number) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    setCurrentPage(pageNum);
    const container = document.getElementById("nearby-orders-container");
    if (container) {
      container.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleDecline = (orderId: string) => {
    setDeclinedOrderIds((prev) => {
      const updated = Array.from(new Set([...prev, orderId]));
      if (typeof window !== "undefined") {
        try {
          const uId = user?.id || (user as any)?._id || user?.email || "guest";
          const userKey = `cravingza_declined_orders_${uId}`;
          localStorage.setItem(userKey, JSON.stringify(updated));
          localStorage.setItem("cravingza_declined_orders_global", JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
    toast.info("Order declined. It is permanently removed from your list.", {
      id: `decline-${orderId}`,
    });
  };

  const handleAccept = async (orderId: string) => {
    try {
      setAcceptingId(orderId);
      const res = await acceptOrder(orderId).unwrap();
      if (res?.success) {
        toast.success("Order accepted! Navigating to Active Delivery...", {
          id: "accept-success",
        });
        router.push("/delivery-partner/active");
      }
    } catch (err: any) {
      if (err?.status === 409) {
        toast.error("This order was just accepted by another partner.");
        refetch();
      } else {
        toast.error(err?.data?.message || "Failed to accept order. Please try again.");
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const handleGoOnline = async () => {
    try {
      await updateStatus({ isOnline: true }).unwrap();
      toast.success("You are now ONLINE! Fetching nearby pickup orders...");
      refetch();
    } catch (err: any) {
      toast.error("Failed to update status.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-extrabold text-slate-700">Searching for nearby pickup requests...</p>
      </div>
    );
  }

  return (
    <div id="nearby-orders-container" className="max-w-4xl mx-auto space-y-6 pb-24 md:pb-8">
      {/* ── TOP TITLE & LIVE POLLING HEADER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Nearby Orders</h1>
              {isFetching ? (
                <span className="text-[11px] font-extrabold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-2 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Live Updating...
                </span>
              ) : (
                <span className="text-[11px] font-bold text-slate-300 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Auto 8s Poll
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300">
              Real-time restaurant pickup requests ready in your area
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all border border-slate-700 active:scale-95 cursor-pointer"
              title="Manual Refresh"
            >
              <span className="material-symbols-outlined text-lg block">refresh</span>
            </button>
            <Link
              href="/delivery-partner/dashboard"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs backdrop-blur-md border border-white/10 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">dashboard</span>
              <span>Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Quick Stats Bar */}
        {isOnline && !hasActiveDelivery && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-700/60 relative z-10 text-xs">
            <div className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-2xl border border-slate-700/50">
              <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">Available Orders</span>
              <span className="text-lg font-black text-white">{availableOrders.length} Ready</span>
            </div>
            <div className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-2xl border border-slate-700/50">
              <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">Est. Payout / Order</span>
              <span className="text-lg font-black text-emerald-400">₹40 Base Fee</span>
            </div>
            <div className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-2xl border border-slate-700/50 col-span-2 sm:col-span-1">
              <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">Declined Orders</span>
              <span className="text-lg font-black text-amber-400">{declinedOrderIds.length} Hidden</span>
            </div>
          </div>
        )}
      </div>

      {/* ── SEARCH & FILTER CONTROL BAR ── */}
      {isOnline && !hasActiveDelivery && availableOrders.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search restaurant or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="text-xs font-bold text-slate-500 self-end sm:self-auto">
            Showing <span className="text-slate-900 font-extrabold">{paginatedOrders.length}</span> of{" "}
            <span className="text-slate-900 font-extrabold">{filteredOrders.length}</span> orders
          </div>
        </div>
      )}

      {/* ── OFFLINE STATE ── */}
      {!isOnline && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 text-center space-y-4 border border-slate-700 shadow-xl my-6">
          <div className="w-16 h-16 bg-slate-800 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-slate-700 shadow-inner">
            <span className="material-symbols-outlined text-3xl">power_off</span>
          </div>
          <h2 className="text-xl font-bold">You are currently offline</h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            You must be online to view available nearby pickup orders and accept delivery jobs.
          </p>
          <button
            onClick={handleGoOnline}
            disabled={isTogglingOnline}
            className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-2xl text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            Go Online Now 🚀
          </button>
        </div>
      )}

      {/* ── ACTIVE DELIVERY IN PROGRESS STATE ── */}
      {isOnline && hasActiveDelivery && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">two_wheeler</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">Active Delivery in Progress</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Complete your current active delivery before accepting new orders from nearby restaurants.
          </p>
          <Link
            href="/delivery-partner/active"
            className="inline-block px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md active:scale-95"
          >
            Go to Active Delivery Screen →
          </Link>
        </div>
      )}

      {/* ── EMPTY STATE (ONLINE & NO ORDERS AVAILABLE) ── */}
      {isOnline && !hasActiveDelivery && filteredOrders.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4 my-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl animate-bounce">location_searching</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">
            {searchQuery ? "No Orders Matching Search" : "No Orders Ready Near You"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? "Try searching for a different restaurant name or address."
              : "We are actively checking for new restaurant pickup requests. Stay online and ready!"}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Clear Search
              </button>
            )}
            <button
              onClick={() => refetch()}
              className="px-6 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition-colors border border-emerald-200"
            >
              Refresh Now
            </button>
          </div>
        </div>
      )}

      {/* ── NEARBY ORDERS CARDS LIST ── */}
      {isOnline && !hasActiveDelivery && paginatedOrders.length > 0 && (
        <div className="space-y-4">
          {paginatedOrders.map((order: any) => (
            <div
              key={order._id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-4 relative overflow-hidden"
            >
              {/* Order Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold shrink-0 border border-orange-100">
                    <span className="material-symbols-outlined text-2xl">storefront</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <span>{order.restaurantName || order.restaurant?.name || "Restaurant"}</span>
                      <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        Ready for Pickup
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                      <span>{order.restaurantAddress || order.restaurant?.address || order.restaurant?.location?.address || "City Centre"}</span>
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right bg-emerald-50 border border-emerald-200/80 px-4 py-2.5 rounded-2xl self-start sm:self-auto shrink-0">
                  <span className="text-[10px] uppercase font-extrabold text-emerald-800 tracking-wider block">
                    Estimated Payout
                  </span>
                  <span className="text-2xl font-black text-emerald-600">₹{order.estimatedEarnings}</span>
                </div>
              </div>

              {/* Delivery Details Body */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-extrabold uppercase block text-[10px] tracking-wide">
                    Delivery Destination
                  </span>
                  <span className="font-semibold text-slate-800 leading-relaxed block mt-1">
                    {typeof order.deliveryAddress === "object" && order.deliveryAddress !== null
                      ? (order.deliveryAddress.addressLine || JSON.stringify(order.deliveryAddress))
                      : (order.deliveryAddress || "Customer Address")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-extrabold uppercase block text-[10px] tracking-wide">
                    Items & Total Bill
                  </span>
                  <span className="font-semibold text-slate-800 block mt-1">
                    {order.itemsCount || (order.items ? order.items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) : 0)} items • Total ₹{Number(order.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => handleDecline(order._id)}
                  className="flex-1 py-3 px-4 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold rounded-2xl text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">block</span>
                  <span>Decline</span>
                </button>
                <button
                  onClick={() => handleAccept(order._id)}
                  disabled={isAccepting && acceptingId === order._id}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isAccepting && acceptingId === order._id ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Accepting...</span>
                    </>
                  ) : (
                    <>
                      <span>Accept Order</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PAGINATION CONTROLS ── */}
      {isOnline && !hasActiveDelivery && totalPages > 1 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="text-xs font-semibold text-slate-500">
            Page <span className="font-bold text-slate-900">{currentPage}</span> of{" "}
            <span className="font-bold text-slate-900">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
              <span>Previous</span>
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                    currentPage === pageNum
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors flex items-center gap-1"
            >
              <span>Next</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
