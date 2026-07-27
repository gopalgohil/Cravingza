"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useGetNearbyOrdersQuery,
  useAcceptOrderMutation,
  useUpdateDeliveryStatusMutation,
} from "@/lib/redux/apiSlice";
import { toast } from "sonner";

export default function NearbyOrdersPage() {
  const router = useRouter();
  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetNearbyOrdersQuery(undefined, {
    pollingInterval: 8000, // 8-second polling interval
  });

  const [acceptOrder, { isLoading: isAccepting }] = useAcceptOrderMutation();
  const [updateStatus, { isLoading: isTogglingOnline }] = useUpdateDeliveryStatusMutation();

  // Local state to store declined order IDs (client-side filter)
  const [declinedOrderIds, setDeclinedOrderIds] = useState<string[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const isOnline = response?.isOnline ?? true;
  const hasActiveDelivery = response?.hasActiveDelivery ?? false;
  const rawOrders = response?.data || [];

  // Filter out declined orders
  const orders = rawOrders.filter((o: any) => !declinedOrderIds.includes(o._id));

  const handleDecline = (orderId: string) => {
    setDeclinedOrderIds((prev) => [...prev, orderId]);
    toast.info("Order hidden from your list.");
  };

  const handleAccept = async (orderId: string) => {
    try {
      setAcceptingId(orderId);
      const res = await acceptOrder(orderId).unwrap();
      if (res?.success) {
        toast.success("Order accepted! Navigating to Active Delivery...");
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
      toast.success("You are now ONLINE!");
      refetch();
    } catch (err: any) {
      toast.error("Failed to update status.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Searching for nearby orders...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 md:pb-8">
      {/* Top Title & Polling Indicator Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Nearby Orders</h1>
            {isFetching && (
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                Updating...
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time pickup requests ready near you • Auto-refreshes every 8s
          </p>
        </div>

        <Link
          href="/delivery-partner/dashboard"
          className="text-xs font-bold text-slate-600 hover:text-primary transition-colors flex items-center gap-1 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-sm">dashboard</span>
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* ── OFFLINE STATE VIEW ── */}
      {!isOnline && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 text-center space-y-4 border border-slate-700 shadow-xl my-6">
          <div className="w-16 h-16 bg-slate-800 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-slate-700">
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

      {/* ── HAS ACTIVE DELIVERY STATE ── */}
      {isOnline && hasActiveDelivery && (
        <div className="bg-orange-50 border border-orange-200 rounded-3xl p-6 text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-orange-500">two_wheeler</span>
          <h3 className="text-lg font-bold text-slate-900">Active Delivery in Progress</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Complete your current active delivery before accepting new orders.
          </p>
          <Link
            href="/delivery-partner/active"
            className="inline-block px-6 py-2.5 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/95 transition-all shadow-sm"
          >
            Go to Active Delivery →
          </Link>
        </div>
      )}

      {/* ── EMPTY STATE (ONLINE & NO ORDERS) ── */}
      {isOnline && !hasActiveDelivery && orders.length === 0 && (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-sm space-y-4 my-4">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl animate-bounce">location_searching</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Orders Ready Near You</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We are actively checking for new restaurant pickup requests. Stay online and ready!
          </p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            Refresh Now
          </button>
        </div>
      )}

      {/* ── NEARBY ORDERS LIST ── */}
      {isOnline && !hasActiveDelivery && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div
              key={order._id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold shrink-0">
                    <span className="material-symbols-outlined text-2xl">storefront</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{order.restaurantName}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                      <span>{order.restaurantAddress}</span>
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right bg-emerald-50 border border-emerald-200/60 px-4 py-2 rounded-2xl self-start sm:self-auto">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">Estimated Payout</span>
                  <span className="text-xl font-extrabold text-emerald-600">₹{order.estimatedEarnings}</span>
                </div>
              </div>

              {/* Order Details Body */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">Delivery Destination</span>
                  <span className="font-semibold text-slate-800 leading-snug block mt-0.5">
                    {order.deliveryAddress || "Customer Address"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">Items & Amount</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {order.itemsCount} items • Total ₹{order.totalAmount}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => handleDecline(order._id)}
                  className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-2xl text-xs transition-all active:scale-95 cursor-pointer"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleAccept(order._id)}
                  disabled={isAccepting && acceptingId === order._id}
                  className="flex-1 py-3 px-4 bg-primary hover:bg-primary/95 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-primary/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isAccepting && acceptingId === order._id ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Accepting...
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
    </div>
  );
}
