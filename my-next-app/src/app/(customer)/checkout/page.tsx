"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import {
  useCreateOrderMutation,
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
  useApplyCouponMutation,
} from "@/lib/redux/apiSlice";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const router = useRouter();

  const { user, authChecked, address, setAddress } = useAppStore();
  const cart = useSelector((state: RootState) => state.cart);

  const [createOrder, { isLoading: isCreatingCOD }] = useCreateOrderMutation();
  const [createRazorpayOrder, { isLoading: isCreatingRazorpay }] = useCreateRazorpayOrderMutation();
  const [verifyRazorpayPayment, { isLoading: isVerifying }] = useVerifyRazorpayPaymentMutation();
  const [applyCouponMutation, { isLoading: isApplyingCoupon }] = useApplyCouponMutation();

  // Form & Coupon states
  const [deliveryAddress, setDeliveryAddress] = useState(address);
  const [customerPhone, setCustomerPhone] = useState(user?.phone || "");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "razorpay">("razorpay");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    title: string;
    category?: string;
    isFreeDelivery?: boolean;
  } | null>(null);

  // Loading simulation states
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  useEffect(() => {
    if (authChecked && !user) {
      router.push("/login");
    }
  }, [authChecked, user, router]);

  // Sync state address with input
  useEffect(() => {
    setDeliveryAddress(address);
  }, [address]);

  const cartItems = cart.items;
  const restaurant = cart.restaurant;

  // Calculations (matching backend orderController: taxes = 5%, totalAmount = subtotal - discount + deliveryFee + taxes)
  const subtotal = cart.subtotal || 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const isFreeDelivery = appliedCoupon?.isFreeDelivery || appliedCoupon?.category === "delivery";
  const deliveryFee = isFreeDelivery ? 0 : (restaurant?.deliveryFee || 0);
  const taxAmount = discountedSubtotal * 0.05; // 5% tax on discounted subtotal
  const total = discountedSubtotal + deliveryFee + taxAmount;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code.");
      return;
    }

    try {
      const res = await applyCouponMutation({ code: couponCode.trim() }).unwrap();
      const freeDel = res.data.isFreeDelivery || res.data.category === "delivery";
      setAppliedCoupon({
        code: res.data.code,
        discountAmount: res.data.discountAmount,
        title: res.data.title,
        category: res.data.category,
        isFreeDelivery: freeDel,
      });
      toast.success(
        `Coupon ${res.data.code} applied! Saved ₹${res.data.discountAmount}${
          freeDel ? " + Free Delivery" : ""
        }`
      );
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to apply coupon code.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.info("Coupon code removed.");
  };

  // If cart is empty and not processing, redirect back to cart
  useEffect(() => {
    if (authChecked && user && cartItems.length === 0 && !isPlacingOrder) {
      toast.error("Your cart is empty. Add items before checking out.");
      router.push("/cart");
    }
  }, [authChecked, user, cartItems.length, router, isPlacingOrder]);

  if (!authChecked || !user || cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto py-32 text-center space-y-md">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <p className="text-on-surface-variant font-body-md text-body-md">Preparing checkout...</p>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deliveryAddress.trim()) {
      toast.error("Please provide a valid delivery address.");
      return;
    }

    if (!customerPhone.trim() || customerPhone.trim().length < 10) {
      toast.error("Please enter a valid 10-digit contact phone number.");
      return;
    }

    // Save final address to Zustand global state
    setAddress(deliveryAddress);
    setIsPlacingOrder(true);

    try {
      if (paymentMethod === "cash") {
        setLoadingStep("Processing order details...");
        await new Promise((resolve) => setTimeout(resolve, 600));

        setLoadingStep("Creating COD order...");
        const orderRes = await createOrder({
          deliveryAddress: {
            addressLine: deliveryAddress,
            city: "City Centre",
            label: "Home",
            phone: customerPhone.trim(),
          },
          couponCode: appliedCoupon?.code,
        }).unwrap();

        setLoadingStep("Order confirmed!");
        await new Promise((resolve) => setTimeout(resolve, 600));

        toast.success("COD Order placed successfully!");
        const orderId = orderRes?.data?._id || orderRes?._id;
        if (orderId) {
          router.push(`/orders/${orderId}`);
        } else {
          router.push("/orders");
        }
      } else {
        // Razorpay Online Flow
        setLoadingStep("Initiating online payment...");
        const razorpayOrderData = await createRazorpayOrder({
          couponCode: appliedCoupon?.code,
        }).unwrap();

        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          toast.error("Failed to load Razorpay SDK. Please check your connection.");
          setIsPlacingOrder(false);
          return;
        }

        const options = {
          key: razorpayOrderData.keyId,
          amount: razorpayOrderData.amount,
          currency: razorpayOrderData.currency,
          name: "Cravingza",
          description: `Food Order from ${restaurant?.name || "Cravingza"}`,
          order_id: razorpayOrderData.razorpayOrderId,
          prefill: {
            name: user.name,
            email: user.email,
            contact: customerPhone.trim(),
          },
          theme: {
            color: "#FF5A36",
          },
          handler: async (response: any) => {
            try {
              setLoadingStep("Verifying payment signature...");
              const verifyRes = await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                deliveryAddress: {
                  addressLine: deliveryAddress,
                  city: "City Centre",
                  label: "Home",
                },
                couponCode: appliedCoupon?.code,
              }).unwrap();

              toast.success("Payment successful & order placed!");
              const orderId = verifyRes?.data?._id || verifyRes?._id;
              if (orderId) {
                router.push(`/orders/${orderId}`);
              } else {
                router.push("/orders");
              }
            } catch (err: any) {
              toast.error(err?.data?.message || "Payment verification failed.");
              setIsPlacingOrder(false);
            }
          },
          modal: {
            ondismiss: () => {
              toast.error("Payment cancelled or closed before completion.");
              setIsPlacingOrder(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", (response: any) => {
          toast.error(response?.error?.description || "Payment failed. Please try again.");
          setIsPlacingOrder(false);
        });
        rzp.open();
      }
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to place order. Please try again.");
      setIsPlacingOrder(false);
    }
  };

  if (isPlacingOrder) {
    return (
      <div className="max-w-md mx-auto py-32 text-center space-y-lg px-margin-mobile">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <span className="material-symbols-outlined text-primary text-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            restaurant
          </span>
        </div>
        <div className="space-y-sm">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-background">Placing Your Order</h2>
          <p className="font-body-md text-body-md text-on-surface-variant animate-pulse">{loadingStep}</p>
        </div>
      </div>
    );
  }

  const isSubmitting = isCreatingCOD || isCreatingRazorpay || isVerifying;

  return (
    <div className="max-w-max-width mx-auto py-6 space-y-lg">
      <h1 className="font-headline-md text-headline-md text-on-background font-bold">Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-xl items-start">
        {/* Left Columns: Forms */}
        <div className="lg:col-span-2 space-y-lg">
          {/* Section 1: Contact Details */}
          <div className="bg-surface border border-outline-variant p-lg rounded-2xl shadow-sm space-y-md">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">person</span>
              Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-sm">Full Name</label>
                <input
                  type="text"
                  value={user.name}
                  disabled
                  className="w-full px-md py-2.5 border border-outline-variant rounded-xl bg-surface-container text-on-surface-variant focus:outline-none text-body-md outline-none"
                />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-sm">Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-md py-2.5 border border-outline-variant rounded-xl bg-surface-container text-on-surface-variant focus:outline-none text-body-md outline-none"
                />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-sm">Phone Number <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  required
                  className="w-full px-md py-2.5 border border-outline-variant rounded-xl focus:border-primary bg-white text-on-surface text-body-md outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Details */}
          <div className="bg-surface border border-outline-variant p-lg rounded-2xl shadow-sm space-y-md">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">location_on</span>
              Delivery Address
            </h3>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-sm">Address</label>
              <div className="relative">
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter full address"
                  required
                  className="w-full pl-xl pr-md py-2.5 border border-outline-variant rounded-xl focus:border-primary bg-white text-body-md outline-none"
                />
                <span className="material-symbols-outlined text-on-surface-variant absolute left-md top-1/2 -translate-y-1/2 text-lg">
                  home
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Payment Details */}
          <div className="bg-surface border border-outline-variant p-lg rounded-2xl shadow-sm space-y-md">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">credit_card</span>
              Payment Method
            </h3>

            {/* Selector Grid: Pay Online vs Cash on Delivery */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <button
                type="button"
                onClick={() => setPaymentMethod("razorpay")}
                className={`py-4 px-md rounded-2xl border font-label-md text-label-md flex flex-col items-center justify-center gap-xs cursor-pointer transition-all ${
                  paymentMethod === "razorpay"
                    ? "border-primary bg-primary/5 text-primary font-bold shadow-sm ring-2 ring-primary/20"
                    : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-2xl">credit_card</span>
                <span className="font-bold text-sm">Pay Online (Razorpay)</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  UPI, Cards, Netbanking
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`py-4 px-md rounded-2xl border font-label-md text-label-md flex flex-col items-center justify-center gap-xs cursor-pointer transition-all ${
                  paymentMethod === "cash"
                    ? "border-primary bg-primary/5 text-primary font-bold shadow-sm ring-2 ring-primary/20"
                    : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-2xl">handshake</span>
                <span className="font-bold text-sm">Cash on Delivery</span>
                <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  Pay at door
                </span>
              </button>
            </div>

            <div className="p-lg bg-surface-container rounded-xl text-center text-on-surface-variant text-body-md border border-outline-variant/40">
              {paymentMethod === "razorpay" ? (
                <span>
                  You will be securely redirected to Razorpay Checkout to complete your payment of{" "}
                  <span className="font-bold text-on-surface">₹{total.toFixed(2)}</span>.
                </span>
              ) : (
                <span>
                  Please prepare the exact amount of{" "}
                  <span className="font-bold text-on-surface">₹{total.toFixed(2)}</span> in cash upon delivery.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Summary & Place Button */}
        <div className="space-y-md">
          <div className="bg-surface rounded-2xl border border-outline-variant p-lg shadow-sm space-y-lg">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface border-b border-outline-variant pb-md">
              Order Summary
            </h3>

            {/* Items Mini Scroll */}
            <div className="max-h-[180px] overflow-y-auto space-y-md pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start gap-md">
                  <div className="min-w-0">
                    <span className="font-label-md text-label-md text-on-surface font-semibold truncate block">
                      {item.name}
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant">
                      Qty: {item.quantity} • ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Code Section */}
            <div className="border-t border-outline-variant pt-md space-y-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-sm">local_offer</span>
                  Apply Coupon Code
                </span>
                <Link href="/offers" target="_blank" className="text-[11px] font-bold text-primary hover:underline">
                  View Offers
                </Link>
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                      <span>{appliedCoupon.code} APPLIED</span>
                    </div>
                    <p className="text-[10px] text-emerald-700">Saved ₹{appliedCoupon.discountAmount.toFixed(2)} on this order</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter code (e.g. CRAVE50)"
                    className="flex-1 px-3 py-2 border border-outline-variant rounded-xl text-sm uppercase bg-white outline-none focus:border-primary font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isApplyingCoupon ? "Applying..." : "Apply"}
                  </button>
                </div>
              )}
            </div>

            {/* Calculations */}
            <div className="space-y-sm text-body-md pt-lg border-t border-outline-variant">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="text-on-surface font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Delivery Fee</span>
                <span className={deliveryFee === 0 ? "text-emerald-600 font-bold" : "text-on-surface font-semibold"}>
                  {deliveryFee === 0 ? "Free" : `₹${Math.round(deliveryFee)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Taxes (5%)</span>
                <span className="text-on-surface font-semibold">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-outline-variant pt-md font-bold text-headline-sm">
                <span className="text-on-surface">Total</span>
                <span className="text-primary font-bold">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white font-label-md text-label-md py-md rounded-xl active:scale-95 transition-all hover:bg-primary/95 flex items-center justify-center gap-sm cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
            >
              {paymentMethod === "razorpay" ? "Proceed to Pay Online" : "Place Order (COD)"}
              <span className="material-symbols-outlined text-base font-bold">arrow_forward</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
