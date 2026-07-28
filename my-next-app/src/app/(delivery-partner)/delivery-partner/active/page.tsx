"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useGetActiveDeliveryQuery,
  useUpdateActiveDeliveryStatusMutation,
} from "@/lib/redux/apiSlice";
import { toast } from "sonner";

export default function ActiveDeliveryPage() {
  const router = useRouter();
  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useGetActiveDeliveryQuery(undefined, {
    pollingInterval: 10000,
  });

  const [updateStatus, { isLoading: isUpdating }] = useUpdateActiveDeliveryStatusMutation();

  const delivery = response?.data;
  const order = delivery?.order;

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Loading active delivery status...</p>
      </div>
    );
  }

  if (!delivery || !order) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl">check_circle</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800">No Active Delivery</h2>
        <p className="text-sm text-slate-500">
          You currently don&apos;t have any assigned delivery jobs in progress.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link
            href="/delivery-partner/nearby-orders"
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/95 transition-all shadow-sm"
          >
            Find Nearby Jobs
          </Link>
          <Link
            href="/delivery-partner/dashboard"
            className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = delivery.status; // assigned, picked_up, out_for_delivery, delivered

  const getStepNumber = (s: string) => {
    switch (s) {
      case "assigned":
        return 1;
      case "picked_up":
        return 2;
      case "out_for_delivery":
        return 3;
      case "delivered":
        return 4;
      default:
        return 1;
    }
  };

  const activeStep = getStepNumber(currentStatus);

  const handleNextStage = async () => {
    let nextStatus = "";
    if (currentStatus === "assigned") nextStatus = "picked_up";
    else if (currentStatus === "picked_up") nextStatus = "out_for_delivery";
    else if (currentStatus === "out_for_delivery") nextStatus = "delivered";

    if (!nextStatus) return;

    try {
      const res = await updateStatus({
        deliveryId: delivery._id,
        status: nextStatus,
      }).unwrap();

      if (res?.success) {
        if (nextStatus === "delivered") {
          toast.success("Delivery completed! Earnings added to your payout.");
        } else {
          toast.success(`Status updated to ${nextStatus.replace(/_/g, " ")}!`);
        }
        refetch();
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update status.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-orange-100 text-orange-700 px-3 py-1 rounded-full border border-orange-200">
            Active Job #{order._id.slice(-6).toUpperCase()}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">Active Delivery Fulfillment</h1>
        </div>

        <Link
          href="/delivery-partner/dashboard"
          className="text-xs font-bold text-slate-600 hover:text-primary transition-colors flex items-center gap-1 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-sm">dashboard</span>
          <span>Dashboard</span>
        </Link>
      </div>

      {/* ── STEPPER STATUS BAR ── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="relative pt-2 pb-2">
          {/* Background Connecting Line */}
          <div className="absolute top-[24px] left-[10%] right-[10%] h-[4px] bg-slate-100 z-0 rounded-full"></div>
          {/* Active Connecting Line */}
          <div
            className="absolute top-[24px] left-[10%] h-[4px] bg-primary z-0 rounded-full transition-all duration-500"
            style={{ width: `${((activeStep - 1) / 3) * 80}%` }}
          ></div>

          <div className="relative z-10 flex justify-between">
            {/* Step 1: Assigned */}
            <div className="flex flex-col items-center gap-2 max-w-[22%] text-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all font-bold ${
                  activeStep >= 1 ? "bg-primary border-primary text-white" : "bg-white border-slate-300 text-slate-400"
                }`}
              >
                <span className="material-symbols-outlined text-lg">assignment</span>
              </div>
              <span className={`text-xs font-bold ${activeStep >= 1 ? "text-slate-900" : "text-slate-400"}`}>
                Assigned
              </span>
            </div>

            {/* Step 2: Picked Up */}
            <div className="flex flex-col items-center gap-2 max-w-[22%] text-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all font-bold ${
                  activeStep >= 2 ? "bg-primary border-primary text-white" : "bg-white border-slate-300 text-slate-400"
                }`}
              >
                <span className="material-symbols-outlined text-lg">storefront</span>
              </div>
              <span className={`text-xs font-bold ${activeStep >= 2 ? "text-slate-900" : "text-slate-400"}`}>
                Picked Up
              </span>
            </div>

            {/* Step 3: Out for Delivery */}
            <div className="flex flex-col items-center gap-2 max-w-[22%] text-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all font-bold ${
                  activeStep >= 3 ? "bg-primary border-primary text-white" : "bg-white border-slate-300 text-slate-400"
                }`}
              >
                <span className="material-symbols-outlined text-lg">two_wheeler</span>
              </div>
              <span className={`text-xs font-bold ${activeStep >= 3 ? "text-slate-900" : "text-slate-400"}`}>
                On the Way
              </span>
            </div>

            {/* Step 4: Delivered */}
            <div className="flex flex-col items-center gap-2 max-w-[22%] text-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all font-bold ${
                  activeStep >= 4 ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-300 text-slate-400"
                }`}
              >
                <span className="material-symbols-outlined text-lg">check_circle</span>
              </div>
              <span className={`text-xs font-bold ${activeStep >= 4 ? "text-emerald-700" : "text-slate-400"}`}>
                Delivered
              </span>
            </div>
          </div>
        </div>

        {/* ── ACTION BUTTON FOR STAGE PROGRESSION ── */}
        {currentStatus !== "delivered" ? (
          <button
            onClick={handleNextStage}
            disabled={isUpdating}
            className="w-full py-4 bg-primary hover:bg-primary/95 text-white font-extrabold rounded-2xl text-base transition-all shadow-lg shadow-primary/20 active:scale-95 cursor-pointer flex items-center justify-center gap-3"
          >
            {isUpdating ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Updating Status...
              </>
            ) : currentStatus === "assigned" ? (
              <>
                <span className="material-symbols-outlined">storefront</span>
                <span>Mark Food Picked Up from Restaurant</span>
              </>
            ) : currentStatus === "picked_up" ? (
              <>
                <span className="material-symbols-outlined">two_wheeler</span>
                <span>Start Delivery (Out for Delivery)</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">check_circle</span>
                <span>Mark Order Delivered to Customer</span>
              </>
            )}
          </button>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <h3 className="text-xl font-extrabold text-emerald-900">Order Completed Successfully! 🎉</h3>
            <p className="text-xs text-emerald-700 font-medium">
              Payout of <strong className="text-emerald-900">₹{delivery.earnings || 40}</strong> has been credited to your today&apos;s earnings.
            </p>
            <Link
              href="/delivery-partner/dashboard"
              className="inline-block px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm mt-2"
            >
              Back to Dashboard
            </Link>
          </div>
        )}
      </div>

      {/* ── RESTAURANT & CUSTOMER CONTACT CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Restaurant Contact Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined">storefront</span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">{order.restaurant?.name || "Restaurant"}</h3>
                <p className="text-xs text-slate-400">Pickup Location</p>
              </div>
            </div>

            <a
              href={`tel:${order.restaurant?.phone || ""}`}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-base">call</span>
              <span>Call Store</span>
            </a>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl text-xs border border-slate-100">
            <span className="text-slate-400 font-bold uppercase block text-[10px]">Address</span>
            <p className="font-medium text-slate-700 mt-0.5">{order.restaurant?.location?.address || "City Centre"}</p>
          </div>
        </div>

        {/* Customer Contact Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined">person</span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">{order.customer?.name || "Customer"}</h3>
                <p className="text-xs text-slate-400">Delivery Recipient</p>
              </div>
            </div>

            <a
              href={`tel:${order.deliveryAddress?.phone || order.customer?.phone || ""}`}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-base">call</span>
              <span>Call Customer</span>
            </a>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl text-xs border border-slate-100">
            <span className="text-slate-400 font-bold uppercase block text-[10px]">Delivery Address</span>
            <p className="font-medium text-slate-700 mt-0.5">{order.deliveryAddress?.addressLine || "Home Address"}</p>
          </div>
        </div>
      </div>

      {/* ── ORDER ITEMS & PAYMENT BREAKDOWN ── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">
          Order Items & Collectable Cash
        </h3>

        <div className="space-y-2.5 text-xs">
          {order.items?.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center text-slate-700 font-medium">
              <span>{item.quantity}x {item.name}</span>
              <span className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">payments</span>
            <span className="font-bold text-slate-700 text-xs uppercase">Collect Cash from Customer</span>
          </div>
          <span className="text-lg font-extrabold text-primary">₹{order.totalAmount?.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
