"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useGetOrderQuery,
  useAddToCartMutation,
  useClearCartMutation,
  useGetCartQuery,
  useCreateReviewMutation,
  useLazyGetRestaurantByIdQuery,
  useCancelOrderMutation,
} from "@/lib/redux/apiSlice";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import LiveTrackingMap from "@/components/customer/LiveTrackingMap";
import SingleOrderLoading from "./loading";
import {
  getUIStageInfo,
  isOrderCancelable,
  isTerminalOrderStatus,
} from "@/lib/utils/orderStatus";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { user, authChecked } = useAppStore();

  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const isTerminal = isTerminalOrderStatus(currentStatus || "");

  // Fetch single order details with conditional 5-second polling (stops automatically when terminal)
  const { data: response, isLoading, isError, refetch } = useGetOrderQuery(id, {
    skip: !user || !id,
    pollingInterval: isTerminal ? undefined : 5000,
  });

  const order = response?.data;

  useEffect(() => {
    if (order?.status) {
      setCurrentStatus(order.status);
    }
  }, [order?.status]);

  // Current Cart details for conflict checks
  const { data: cartResponse } = useGetCartQuery(undefined, { skip: !user });
  const currentCartRestaurant = cartResponse?.data?.restaurant;

  const [addToCart] = useAddToCartMutation();
  const [clearCart] = useClearCartMutation();
  const [createReview] = useCreateReviewMutation();
  const [triggerGetRestaurant] = useLazyGetRestaurantByIdQuery();
  const [cancelOrderMutation, { isLoading: isCancelling }] = useCancelOrderMutation();

  // Cancel Modal States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("Ordered by mistake");

  const handleConfirmCancelOrder = async () => {
    try {
      toast.loading("Cancelling your order...", { id: "cancel-order" });
      await cancelOrderMutation({
        id,
        reason: cancellationReason,
      }).unwrap();
      toast.success("Order cancelled successfully!", { id: "cancel-order" });
      setIsCancelModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to cancel order.", { id: "cancel-order" });
    }
  };

  // Review Modal States
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Reorder Conflict Modal States
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [pendingReorderItems, setPendingReorderItems] = useState<{ menuItemId: string; quantity: number }[]>([]);
  const [pendingRestaurantName, setPendingRestaurantName] = useState("");
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    if (authChecked && !user) {
      router.push("/login");
    }
  }, [authChecked, user, router]);

  const [isNavigating, setIsNavigating] = useState(true);

  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  if (!authChecked || !user || isLoading || isNavigating) {
    return <SingleOrderLoading />;
  }

  if (isError || !order) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-md">
        <span className="material-symbols-outlined text-6xl text-error">error</span>
        <h2 className="font-headline-md text-headline-md text-on-background">Order Not Found</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mx-auto">
          We were unable to load details for this order. It may have been deleted or you may not have permission to view it.
        </p>
        <button
          onClick={() => router.push("/orders")}
          className="bg-primary text-white font-label-md text-label-md px-xl py-3 rounded-xl hover:bg-primary/95 cursor-pointer shadow-sm"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const stageInfo = getUIStageInfo(order.status);
  const canCancel = isOrderCancelable(order.status);

  // 1. Reorder Process
  const handleReorder = async () => {
    try {
      toast.loading("Verifying menu item availability...", { id: "reorder" });

      const restResponse = await triggerGetRestaurant(order.restaurant._id).unwrap();
      const availableMenu = restResponse?.data?.menu || [];

      const itemsToAdd: { menuItemId: string; quantity: number; name: string }[] = [];
      const unavailableNames: string[] = [];

      for (const item of order.items) {
        const matchingMenuItem = availableMenu.find(
          (menuItem: any) => menuItem._id === item.menuItem
        );
        if (matchingMenuItem) {
          itemsToAdd.push({
            menuItemId: item.menuItem,
            quantity: item.quantity,
            name: item.name,
          });
        } else {
          unavailableNames.push(item.name);
        }
      }

      if (itemsToAdd.length === 0) {
        toast.dismiss("reorder");
        toast.error("None of the items from this order are currently available.");
        return;
      }

      if (unavailableNames.length > 0) {
        toast.warning(
          `Some items are no longer available: ${unavailableNames.join(", ")}`
        );
      }

      if (
        currentCartRestaurant &&
        currentCartRestaurant._id !== order.restaurant._id &&
        cartResponse?.data?.items?.length > 0
      ) {
        toast.dismiss("reorder");
        setPendingReorderItems(itemsToAdd);
        setPendingRestaurantName(order.restaurant.name);
        setIsConflictModalOpen(true);
      } else {
        toast.loading("Adding items to cart...", { id: "reorder" });
        await executeReorder(itemsToAdd);
      }
    } catch (error: any) {
      toast.dismiss("reorder");
      toast.error(error.message || "Something went wrong. Please try again.");
    }
  };

  const executeReorder = async (items: { menuItemId: string; quantity: number }[]) => {
    setIsReordering(true);
    try {
      for (const item of items) {
        await addToCart({ menuItemId: item.menuItemId, quantity: item.quantity }).unwrap();
      }
      toast.success("Items added to cart!", { id: "reorder" });
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to add items to cart.", { id: "reorder" });
    } finally {
      setIsReordering(false);
      setIsConflictModalOpen(false);
    }
  };

  const handleConfirmConflict = async () => {
    toast.loading("Clearing cart & adding new items...", { id: "reorder" });
    try {
      await clearCart().unwrap();
      await executeReorder(pendingReorderItems);
    } catch (err: any) {
      toast.error("Failed to replace cart. Please try again.", { id: "reorder" });
    }
  };

  // 2. Review Submission
  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error("Please select a rating before submitting.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      await createReview({
        orderId: order._id,
        rating,
        comment: comment.trim(),
      }).unwrap();

      toast.success("Review submitted successfully!");
      setIsReviewModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to submit review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-max-width mx-auto py-6 space-y-xl">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center gap-sm">
        <Link
          href="/orders"
          className="p-2 text-primary hover:bg-surface-container rounded-xl flex items-center justify-center cursor-pointer transition-all border border-outline-variant/30"
          title="Back to Orders"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <span className="text-caption text-on-surface-variant font-medium">Order Detail</span>
          <h1 className="font-headline-md text-headline-md text-on-background font-bold leading-tight">
            Order #{order._id.substring(order._id.length - 8).toUpperCase()}
          </h1>
        </div>
      </div>

      {/* Main Grid: Tracking Stepper / Map & Sidebar Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl items-start">
        {/* Left Column: Tracking and Map */}
        <div className="lg:col-span-2 space-y-lg">
          {/* Tracking Stepper / Cancelled Banner Card */}
          <div className="bg-surface border border-outline-variant p-lg rounded-2xl shadow-sm space-y-xl">
            {/* Header Details */}
            <div className="flex justify-between items-start flex-wrap gap-md">
              <div>
                <span className="bg-primary-container text-on-primary font-label-sm text-label-sm px-md py-1 rounded-full uppercase tracking-wider font-bold text-[10px]">
                  {order.status === "delivered" || order.status === "cancelled" ? "Past Order" : "Active Order"}
                </span>
                <h2 className="font-headline-md text-headline-md font-bold mt-sm text-on-background">
                  {order.restaurant?.name || "Cravingza Partner"}
                </h2>
                <p className="font-caption text-caption text-on-surface-variant mt-0.5">
                  Placed at {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <span className="font-caption text-caption text-on-surface-variant block">Status</span>
                <span
                  className={`font-display-md text-headline-lg font-bold ${
                    order.status === "delivered"
                      ? "text-green-600"
                      : order.status === "cancelled"
                      ? "text-red-600"
                      : "text-primary animate-pulse"
                  }`}
                >
                  {stageInfo.activeStageLabel}
                </span>
              </div>
            </div>

            {/* Render Cancelled Banner for Cancelled orders, or 4-Stage Stepper otherwise */}
            {stageInfo.isCancelled ? (
              <div className="bg-red-50 border border-red-200/80 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-red-800 animate-fade-in">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                    <span className="material-symbols-outlined text-2xl">cancel</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-lg font-bold text-red-900">
                      This order was cancelled
                    </h3>
                    <p className="text-xs text-red-700 mt-0.5">
                      {order.cancelledAt
                        ? `Cancelled on ${new Date(order.cancelledAt).toLocaleString()}`
                        : `Cancelled on ${new Date(order.updatedAt).toLocaleString()}`}
                      {order.cancellationReason && ` • Reason: ${order.cancellationReason}`}
                    </p>
                  </div>
                </div>
                <span className="px-3.5 py-1 bg-red-200/70 text-red-900 rounded-full text-xs font-extrabold uppercase tracking-wider">
                  Cancelled
                </span>
              </div>
            ) : (
              <div className="relative pt-4 pb-2">
                {/* Connecting Line background */}
                <div className="absolute top-[28px] left-[10%] right-[10%] h-[4px] bg-surface-container-high z-0 rounded-full"></div>
                {/* Active connecting line based on stageInfo.index */}
                <div
                  className="absolute top-[28px] left-[10%] h-[4px] bg-primary z-0 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(stageInfo.index / 3, 1) * 80}%`,
                  }}
                ></div>

                {/* Steps container */}
                <div className="relative z-10 flex justify-between">
                  {/* Step 0: Placed */}
                  <div className="flex flex-col items-center gap-sm max-w-[20%] text-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        stageInfo.index >= 0
                          ? "bg-primary border-primary text-white"
                          : "bg-surface border-outline-variant text-on-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">receipt_long</span>
                    </div>
                    <span className={`font-label-sm text-label-sm font-bold ${stageInfo.index >= 0 ? "text-on-surface" : "text-on-surface-variant"}`}>
                      Placed
                    </span>
                  </div>

                  {/* Step 1: Preparing */}
                  <div className="flex flex-col items-center gap-sm max-w-[20%] text-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        stageInfo.index >= 1
                          ? "bg-primary border-primary text-white"
                          : "bg-surface border-outline-variant text-on-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">restaurant</span>
                    </div>
                    <span className={`font-label-sm text-label-sm font-bold ${stageInfo.index >= 1 ? "text-on-surface" : "text-on-surface-variant"}`}>
                      Preparing
                    </span>
                  </div>

                  {/* Step 2: On the Way */}
                  <div className="flex flex-col items-center gap-sm max-w-[20%] text-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        stageInfo.index >= 2
                          ? "bg-primary border-primary text-white"
                          : "bg-surface border-outline-variant text-on-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">local_shipping</span>
                    </div>
                    <span className={`font-label-sm text-label-sm font-bold ${stageInfo.index >= 2 ? "text-on-surface" : "text-on-surface-variant"}`}>
                      On the Way
                    </span>
                  </div>

                  {/* Step 3: Arrived */}
                  <div className="flex flex-col items-center gap-sm max-w-[20%] text-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        stageInfo.index >= 3
                          ? "bg-primary border-primary text-white"
                          : "bg-surface border-outline-variant text-on-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">home</span>
                    </div>
                    <span className={`font-label-sm text-label-sm font-bold ${stageInfo.index >= 3 ? "text-on-surface" : "text-on-surface-variant"}`}>
                      Arrived
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map Container */}
          <LiveTrackingMap
            status={order.status}
            restaurantName={order.restaurant?.name}
            restaurantAddress={
              order.restaurant?.location?.address
                ? `${order.restaurant.location.address}${order.restaurant.location.city ? `, ${order.restaurant.location.city}` : ""}`
                : "Pickup Location"
            }
            deliveryAddress={
              order.deliveryAddress?.addressLine
                ? `${order.deliveryAddress.addressLine}${order.deliveryAddress.city ? `, ${order.deliveryAddress.city}` : ""}${order.deliveryAddress.pincode ? ` - ${order.deliveryAddress.pincode}` : ""}`
                : "Customer Address"
            }
          />
        </div>

        {/* Right Column: Order Details & Bill Summary Card */}
        <div className="space-y-md">
          <div className="bg-white rounded-3xl border border-outline-variant/40 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-2xl">restaurant_menu</span>
                <h3 className="font-headline-sm text-lg font-bold text-slate-900">
                  Order Items
                </h3>
              </div>
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200">
                {order.items.reduce((sum: number, i: any) => sum + i.quantity, 0)} {order.items.length === 1 && order.items[0].quantity === 1 ? "Item" : "Items"}
              </span>
            </div>

            {/* Items list */}
            <div className="space-y-3">
              {order.items.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-black text-xs flex items-center justify-center border border-primary/20 shrink-0">
                      {item.quantity}x
                    </span>
                    <span className="text-slate-900 font-bold text-sm truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-slate-900 font-extrabold text-sm shrink-0">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Delivery Address Block */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span className="material-symbols-outlined text-base text-primary">location_on</span>
                <span>Delivery Address</span>
              </div>
              <div className="text-slate-900 font-semibold text-sm leading-snug pl-5">
                {order.deliveryAddress?.label && (
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase mr-2 border border-primary/20">
                    {order.deliveryAddress.label}
                  </span>
                )}
                {order.deliveryAddress?.addressLine}
              </div>
            </div>

            {/* Bill Breakdown & Payment Method */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              {/* Payment Method Badge */}
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 font-medium text-xs">Payment Method</span>
                {order.paymentMethod === "razorpay" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>PAID ONLINE</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>CASH ON DELIVERY</span>
                  </span>
                )}
              </div>

              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">₹{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                  <span>Coupon Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                  <span>-₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-600">
                <span>Delivery Fee</span>
                <span className={order.deliveryFee === 0 ? "font-bold text-emerald-600" : "font-semibold text-slate-900"}>
                  {order.deliveryFee === 0 ? "Free" : `₹${order.deliveryFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Taxes & Charges (5%)</span>
                <span className="font-semibold text-slate-900">₹{order.taxes.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/80 pt-3 text-base">
                <span className="font-extrabold text-slate-900">Total Bill</span>
                <span className="font-black text-xl text-primary">₹{order.totalAmount.toFixed(2)}</span>
              </div>

              {/* Review details if already rated */}
              {order.review && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 mt-3 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-amber-900 uppercase tracking-wide">Your Review</span>
                    <div className="flex gap-0.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className="material-symbols-outlined text-[16px]"
                          style={{
                            fontVariationSettings: star <= order.review.rating ? "'FILL' 1" : "'FILL' 0",
                          }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                  {order.review.comment && (
                    <p className="text-xs text-slate-700 italic leading-relaxed bg-white/70 p-2.5 rounded-xl border border-amber-100">
                      "{order.review.comment}"
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons for this order */}
              <div className="pt-3 space-y-3">
                <button
                  onClick={handleReorder}
                  className="w-full py-3.5 bg-gradient-to-r from-primary to-orange-600 hover:from-primary/95 hover:to-orange-600/95 text-white rounded-2xl font-bold text-sm transition-all shadow-md shadow-primary/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">autorenew</span>
                  <span>Reorder Food</span>
                </button>

                {/* Cancel Order Section with Policy Enforced */}
                {canCancel ? (
                  <button
                    onClick={() => setIsCancelModalOpen(true)}
                    className="w-full py-3.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-2xl font-bold text-sm transition-all active:scale-95 cursor-pointer text-center flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg text-rose-500">cancel</span>
                    <span>Cancel Order</span>
                  </button>
                ) : !isTerminal ? (
                  <div className="space-y-1">
                    <button
                      disabled
                      className="w-full py-3 bg-slate-100 border border-slate-200 text-slate-400 rounded-2xl font-bold text-sm cursor-not-allowed text-center"
                    >
                      Cancel Order
                    </button>
                    <p className="text-[11px] text-slate-400 text-center italic leading-tight">
                      Cancellation is only available before the restaurant starts preparing your order.
                    </p>
                  </div>
                ) : null}

                {order.status === "delivered" && !order.review && (
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 cursor-pointer text-center shadow-sm"
                  >
                    Rate Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================= */}
      {/* RATE ORDER MODAL                        */}
      {/* ======================================= */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] relative overflow-hidden transform transition-all duration-300 scale-100 animate-in fade-in zoom-in border border-outline-variant/35">
            <button
              aria-label="Close modal"
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors p-1 cursor-pointer"
              onClick={() => setIsReviewModalOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="p-lg md:p-xl flex flex-col items-center text-center">
              <div className="mb-lg">
                <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">
                  Rate Your Order
                </h2>
                <p className="font-label-md text-primary tracking-wide mb-1 uppercase font-bold text-xs">
                  {order.restaurant?.name}
                </p>
              </div>

              <div className="flex gap-2 mb-xl">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isActive = starValue <= (hoverRating || rating);
                  return (
                    <button
                      key={starValue}
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="cursor-pointer transition-all duration-150 transform hover:scale-110 p-1"
                    >
                      <span
                        className={`material-symbols-outlined text-[40px] ${
                          isActive ? "text-yellow-500" : "text-outline"
                        }`}
                        style={{
                          fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                        }}
                      >
                        star
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="w-full mb-xl">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full h-32 p-md bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface resize-none transition-all outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 text-sm"
                  placeholder="Share your experience..."
                ></textarea>
              </div>

              <div className="w-full flex flex-col items-center gap-md">
                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview}
                  className="w-full py-4 bg-primary-container text-on-primary font-headline-md text-[18px] rounded-full shadow-sm hover:brightness-95 active:scale-[0.98] transition-all flex items-center justify-center gap-sm cursor-pointer select-none font-bold"
                >
                  {isSubmittingReview ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">
                        progress_activity
                      </span>
                      Sending...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </button>
                <button
                  className="text-on-surface-variant font-label-md hover:text-primary transition-colors py-1 cursor-pointer font-bold text-sm"
                  onClick={() => setIsReviewModalOpen(false)}
                >
                  Skip
                </button>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20"></div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* REORDER CONFLICT MODAL                  */}
      {/* ======================================= */}
      {isConflictModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface max-w-md w-full rounded-2xl border border-outline-variant p-lg shadow-xl space-y-lg animate-scale-up">
            <div className="flex items-start gap-md">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <div className="space-y-xs">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Replace Cart?
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed text-sm">
                  Your cart contains items from{" "}
                  <span className="font-bold text-on-surface">
                    {currentCartRestaurant?.name || "another restaurant"}
                  </span>
                  . Would you like to clear your cart and add items from{" "}
                  <span className="font-bold text-on-surface">{pendingRestaurantName}</span> instead?
                </p>
              </div>
            </div>

            <div className="flex gap-md justify-end pt-2">
              <button
                onClick={() => setIsConflictModalOpen(false)}
                disabled={isReordering}
                className="px-lg py-2 border border-outline-variant rounded-xl font-label-md text-label-md hover:bg-surface-container active:scale-95 transition-all text-on-surface cursor-pointer select-none"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConflict}
                disabled={isReordering}
                className="px-lg py-2 bg-primary text-white rounded-xl font-label-md text-label-md hover:bg-primary/95 active:scale-95 transition-all flex items-center justify-center gap-xs cursor-pointer select-none shadow-sm font-bold"
              >
                {isReordering ? (
                  <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  "Clear & Add"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* CANCEL ORDER MODAL                      */}
      {/* ======================================= */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-xl border border-outline-variant/35 p-6 space-y-6 animate-scale-up relative">
            <button
              aria-label="Close modal"
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors p-1 cursor-pointer"
              onClick={() => setIsCancelModalOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-3 text-red-600">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Cancel Order?
              </h3>
            </div>

            <p className="font-body-md text-on-surface-variant text-sm">
              Are you sure you want to cancel order{" "}
              <span className="font-bold text-on-surface">
                #{order._id.slice(-6).toUpperCase()}
              </span>{" "}
              from <span className="font-bold text-on-surface">{order.restaurant?.name}</span>?
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Reason for Cancellation
              </label>
              <select
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full p-3 bg-surface border border-outline-variant rounded-xl text-sm font-body-md text-on-surface outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Delivery time takes too long">Delivery time takes too long</option>
                <option value="Changed my mind">Changed my mind</option>
                <option value="Selected wrong delivery address">Selected wrong delivery address</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
                className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface font-label-md text-sm hover:bg-surface-container active:scale-95 transition-all cursor-pointer font-semibold"
              >
                Keep Order
              </button>
              <button
                onClick={handleConfirmCancelOrder}
                disabled={isCancelling}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-label-md text-sm active:scale-95 transition-all cursor-pointer font-bold flex items-center gap-2 shadow-sm"
              >
                {isCancelling ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">
                      progress_activity
                    </span>
                    <span>Cancelling...</span>
                  </>
                ) : (
                  "Confirm Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
