"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useGetOrdersQuery,
  useAddToCartMutation,
  useClearCartMutation,
  useGetCartQuery,
  useCreateReviewMutation,
  useLazyGetRestaurantByIdQuery,
  useCancelOrderMutation,
} from "@/lib/redux/apiSlice";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";

import OrdersLoading from "./loading";
import { isOrderCancelable } from "@/lib/utils/orderStatus";

export default function OrdersPage() {
  const router = useRouter();
  const { user, authChecked } = useAppStore();

  // RTK Query endpoints
  const { data: response, isLoading, isFetching, isError, refetch } = useGetOrdersQuery(undefined, {
    skip: !user,
  });

  // Current Cart details for conflict checks
  const { data: cartResponse } = useGetCartQuery(undefined, { skip: !user });
  const currentCartRestaurant = cartResponse?.data?.restaurant;

  const [addToCart] = useAddToCartMutation();
  const [clearCart] = useClearCartMutation();
  const [createReview] = useCreateReviewMutation();
  const [triggerGetRestaurant] = useLazyGetRestaurantByIdQuery();
  const [cancelOrderMutation, { isLoading: isCancelling }] = useCancelOrderMutation();

  // Cancel Order Modal States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<any>(null);
  const [cancellationReason, setCancellationReason] = useState("Ordered by mistake");

  const handleOpenCancelModal = (order: any) => {
    setSelectedOrderForCancel(order);
    setCancellationReason("Ordered by mistake");
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancelOrder = async () => {
    if (!selectedOrderForCancel) return;
    try {
      toast.loading("Cancelling your order...", { id: "cancel-order" });
      await cancelOrderMutation({
        id: selectedOrderForCancel._id,
        reason: cancellationReason,
      }).unwrap();
      toast.success("Order cancelled successfully!", { id: "cancel-order" });
      setIsCancelModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to cancel order.", { id: "cancel-order" });
    }
  };

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(3);
  const [isTabLoading, setIsTabLoading] = useState(false);

  // Handle tab click with skeleton loader transition
  const handleFilterChange = (filterKey: string) => {
    if (selectedFilter === filterKey) return;
    setIsTabLoading(true);
    setSelectedFilter(filterKey);
    setTimeout(() => {
      setIsTabLoading(false);
    }, 400);
  };

  // Reset visible count when filter or search changes
  useEffect(() => {
    setVisibleCount(3);
  }, [selectedFilter, searchQuery]);

  const [isAppendingMore, setIsAppendingMore] = useState(false);

  // Handle Show More with Skeleton Loader transition
  const handleShowMore = () => {
    setIsAppendingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 3);
      setIsAppendingMore(false);
    }, 450);
  };

  // Collapse orders back to initial 3 with smooth scroll
  const handleShowLess = () => {
    setVisibleCount(3);
    const element = document.getElementById("customer-orders-container");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Review Modal States
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Reorder Conflict Modal States
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [pendingReorderItems, setPendingReorderItems] = useState<{ menuItemId: string; quantity: number }[]>([]);
  const [pendingRestaurantName, setPendingRestaurantName] = useState("");
  const [isReordering, setIsReordering] = useState(false);

  const [isNavigating, setIsNavigating] = useState(true);

  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (authChecked && !user) {
      router.push("/login");
    }
  }, [authChecked, user, router]);

  // Refetch orders when component mounts or user changes
  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [user, refetch]);

  if (!authChecked || !user || isLoading || isNavigating) {
    return <OrdersLoading />;
  }

  if (isError) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-md">
        <span className="material-symbols-outlined text-6xl text-error">error</span>
        <h2 className="font-headline-md text-headline-md text-on-background">Error Loading Orders</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mx-auto">
          We were unable to load your order history. Please try again.
        </p>
        <button
          onClick={() => refetch()}
          className="bg-primary text-white font-label-md text-label-md px-xl py-3 rounded-xl hover:bg-primary/95 cursor-pointer shadow-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  const allOrders = response?.data || [];

  // Helper to map status to design system classes
  const getStatusBadge = (status: string, paymentStatus?: string) => {
    if (status === "cancelled") {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-label-sm text-xs flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">cancel</span>
            Cancelled
          </span>
          {paymentStatus === "refunded" && (
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-label-sm text-xs flex items-center gap-1 font-bold">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
              Refunded
            </span>
          )}
        </div>
      );
    }
    switch (status) {
      case "delivered":
        return (
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-label-sm text-xs flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Delivered
          </span>
        );
      default: // placed, accepted, preparing, out_for_delivery
        return (
          <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-label-sm text-xs flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
            {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")}
          </span>
        );
    }
  };

  // 1. Filter and search logic
  const filteredOrders = allOrders.filter((order: any) => {
    const restaurantName = order.restaurant?.name || "";
    const query = searchQuery.toLowerCase();
    const matchesRestaurant = restaurantName.toLowerCase().includes(query);
    const matchesItems = order.items?.some((item: any) =>
      item.name?.toLowerCase().includes(query)
    ) || false;
    const matchesSearch = matchesRestaurant || matchesItems;

    if (selectedFilter === "all") {
      return matchesSearch;
    } else if (selectedFilter === "placed") {
      return (
        matchesSearch &&
        ["placed", "accepted", "preparing", "out_for_delivery"].includes(order.status)
      );
    } else {
      return matchesSearch && order.status === selectedFilter;
    }
  });

  // 2. Reorder Process
  const handleReorder = async (order: any) => {
    try {
      toast.loading("Verifying menu item availability...", { id: "reorder" });

      // Fetch restaurant menu to check item availability
      const restResponse = await triggerGetRestaurant(order.restaurant._id).unwrap();
      const availableMenu = restResponse?.data?.menu || [];

      // Check which past items are still available
      const itemsToAdd: { menuItemId: string; quantity: number; name: string }[] = [];
      const unavailableNames: string[] = [];

      for (const item of order.items) {
        const targetItemId =
          typeof item.menuItem === "object" && item.menuItem?._id
            ? String(item.menuItem._id)
            : String(item.menuItem || "");

        const matchingMenuItem = availableMenu.find(
          (menuItem: any) => String(menuItem._id) === targetItemId
        );

        if (matchingMenuItem && matchingMenuItem.isAvailable !== false) {
          itemsToAdd.push({
            menuItemId: targetItemId,
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

      // Check for restaurant conflict
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
      // Add items sequentially
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

  // 3. Review Submission
  const handleOpenReviewModal = (order: any) => {
    setSelectedOrderForReview(order);
    setRating(0);
    setComment("");
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error("Please select a rating before submitting.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      await createReview({
        orderId: selectedOrderForReview._id,
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
    <div className="w-full">
      {/* Search & Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-surface mb-2">
            My Orders
          </h1>
          <p className="font-body-md text-on-surface-variant">
            Manage your recent culinary adventures and reorder favorites.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-body-md transition-all text-on-surface"
            placeholder="Search restaurants or food..."
            type="text"
          />
        </div>
      </div>

      {/* Filter Chips - Single row horizontal scroll on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap flex-nowrap scrollbar-none pb-2 mb-8">
        {[
          { key: "all", label: "All" },
          { key: "placed", label: "Placed" },
          { key: "delivered", label: "Delivered" },
          { key: "cancelled", label: "Cancelled" },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => handleFilterChange(filter.key)}
            className={`px-5 py-2.5 rounded-full font-label-md transition-all text-xs md:text-sm cursor-pointer whitespace-nowrap flex-shrink-0 ${
              selectedFilter === filter.key
                ? "bg-primary-container text-on-primary shadow-sm font-bold"
                : "bg-secondary-container text-on-secondary-container border border-outline-variant hover:border-primary"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Orders List / Tab Skeleton / Empty State */}
      {isTabLoading ? (
        <div className="grid grid-cols-1 gap-6 animate-pulse">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/30 flex flex-col md:flex-row gap-6"
            >
              {/* Image Skeleton */}
              <div className="w-full md:w-32 h-32 rounded-lg bg-outline-variant/30 flex-shrink-0"></div>

              {/* Content Skeleton */}
              <div className="flex-grow flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="h-6 w-48 bg-outline-variant/30 rounded"></div>
                    <div className="h-4 w-32 bg-outline-variant/20 rounded"></div>
                  </div>
                  <div className="h-7 w-24 bg-outline-variant/30 rounded-full"></div>
                </div>

                <div className="h-4 w-3/4 bg-outline-variant/20 rounded"></div>

                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
                  <div className="h-6 w-20 bg-outline-variant/30 rounded"></div>
                  <div className="flex gap-3">
                    <div className="h-9 w-24 bg-outline-variant/30 rounded-lg"></div>
                    <div className="h-9 w-24 bg-outline-variant/30 rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : allOrders.length === 0 ? (
        /* Empty State */
        <div className="py-16 text-center max-w-xl mx-auto">
          <div className="relative w-64 h-64 mx-auto mb-xl">
            <div className="absolute inset-0 bg-primary-container/10 rounded-full scale-110 animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-48 h-48">
                <div className="w-full h-full rounded-xl bg-surface-container-lowest shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
                  <div className="h-2/3 bg-surface-container-low flex items-center justify-center overflow-hidden">
                    <img
                      className="w-full h-full object-cover"
                      alt="Empty order history illustration"
                      src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60"
                    />
                  </div>
                  <div className="p-md space-y-xs">
                    <div className="h-2 w-3/4 bg-outline-variant/30 rounded"></div>
                    <div className="h-2 w-1/2 bg-outline-variant/30 rounded"></div>
                  </div>
                </div>
                <span
                  className="material-symbols-outlined absolute -top-4 -right-4 text-primary text-4xl transform rotate-12"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  restaurant
                </span>
                <span
                  className="material-symbols-outlined absolute -bottom-2 -left-6 text-secondary-container text-5xl transform -rotate-12"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  bakery_dining
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-md mb-xl">
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
              No orders yet
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mx-auto">
              When you place an order, it'll show up here. Your delicious journey is just one click away!
            </p>
          </div>
          <button
            onClick={() => router.push("/home")}
            className="inline-flex items-center justify-center px-xl py-md bg-primary-container text-on-primary font-label-md text-label-md rounded-full shadow-[0px_4px_20px_rgba(0,0,0,0.04)] hover:bg-primary transition-all duration-300 scale-100 active:scale-95 cursor-pointer"
          >
            Browse Restaurants
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-2">search_off</span>
          <p className="text-on-surface-variant font-body-md">No orders match your query.</p>
        </div>
      ) : (
        <div id="customer-orders-container" className="grid grid-cols-1 gap-6 scroll-mt-8">
          {filteredOrders.slice(0, visibleCount).map((order: any) => {
            const dateStr = new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            });
            const timeStr = new Date(order.createdAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });

            const itemSummary = order.items
              .map((it: any) => `${it.quantity}x ${it.name}`)
              .join(", ");

            return (
              <article
                key={order._id}
                className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0px_8px_30px_rgba(0,0,0,0.08)] border border-outline-variant/30 transition-transform hover:-translate-y-1 duration-200 overflow-hidden"
              >
                {/* ── MOBILE LAYOUT (< md) ── */}
                <div className="flex md:hidden flex-col">
                  {/* Top: thumbnail + info */}
                  <div className="flex gap-3.5 p-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-low">
                      <img
                        className="w-full h-full object-cover"
                        src={order.restaurant?.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60"}
                        alt={order.restaurant?.name || "Restaurant Image"}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-on-surface text-base leading-tight">
                        {order.restaurant?.name || "Cravingza Restaurant"}
                      </h3>
                      <div className="mt-1.5 mb-1.5 flex items-center gap-1.5 flex-wrap">
                        {getStatusBadge(order.status, order.paymentStatus)}
                      </div>
                      <p className="text-[11px] text-on-surface-variant mb-1">
                        {dateStr} • {timeStr}
                      </p>
                      <p className="text-xs text-on-surface line-clamp-1">{itemSummary}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-primary text-base">
                          ₹{order.totalAmount.toFixed(2)}
                        </span>
                        {order.review && (
                          <div className="flex items-center gap-0.5 text-yellow-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className="material-symbols-outlined text-[14px]"
                                style={{ fontVariationSettings: star <= order.review.rating ? "'FILL' 1" : "'FILL' 0" }}
                              >
                                star
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: full-width buttons */}
                  <div className="border-t border-outline-variant/20 px-4 pb-4 pt-3 flex flex-col gap-2">
                    <div className="flex items-center justify-end mb-1">
                      <Link
                        className="text-primary font-semibold text-xs hover:underline"
                        href={`/orders/${order._id}`}
                      >
                        View Details →
                      </Link>
                    </div>
                    <button
                      onClick={() => handleReorder(order)}
                      className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
                      Reorder
                    </button>

                    {isOrderCancelable(order.status) && (
                      <button
                        onClick={() => handleOpenCancelModal(order)}
                        className="w-full py-2.5 border border-red-300 text-red-600 bg-red-50/50 hover:bg-red-50 rounded-xl font-bold text-sm active:scale-95 transition-all cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}

                    {order.status === "delivered" && !order.review && (
                      <button
                        onClick={() => handleOpenReviewModal(order)}
                        className="w-full py-2.5 bg-primary-container text-on-primary rounded-xl font-bold text-sm active:scale-95 transition-all cursor-pointer hover:brightness-95"
                      >
                        ⭐ Rate Order
                      </button>
                    )}
                  </div>
                </div>

                {/* ── DESKTOP LAYOUT (md+) — unchanged ── */}
                <div className="hidden md:flex flex-row gap-6 p-6">
                  <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-low relative">
                    <img
                      className="w-full h-full object-cover"
                      src={order.restaurant?.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60"}
                      alt={order.restaurant?.name || "Restaurant Image"}
                    />
                  </div>
                  <div className="flex-grow flex flex-col justify-between">
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-2">
                      <div>
                        <h3 className="font-headline-md text-headline-md text-on-surface">
                          {order.restaurant?.name || "Cravingza Restaurant"}
                        </h3>
                        <p className="font-body-md text-on-surface-variant">
                          {dateStr} • {timeStr}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(order.status, order.paymentStatus)}
                        {order.review && (
                          <div className="flex items-center gap-0.5 text-yellow-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className="material-symbols-outlined text-[18px]"
                                style={{ fontVariationSettings: star <= order.review.rating ? "'FILL' 1" : "'FILL' 0" }}
                              >
                                star
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="font-body-md text-on-surface mb-4">{itemSummary}</p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant/20">
                      <span className="font-headline-md text-primary">
                        ₹{order.totalAmount.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-4">
                        <Link className="text-primary font-label-md hover:underline" href={`/orders/${order._id}`}>
                          View Details
                        </Link>
                        <button
                          onClick={() => handleReorder(order)}
                          className="px-6 py-2 border-2 border-primary text-primary rounded-xl font-label-md hover:bg-primary hover:text-white transition-all active:scale-95 cursor-pointer text-sm"
                        >
                          Reorder
                        </button>
                        {isOrderCancelable(order.status) && (
                          <button
                            onClick={() => handleOpenCancelModal(order)}
                            className="px-5 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-label-md transition-all active:scale-95 cursor-pointer text-sm font-bold shadow-sm"
                          >
                            Cancel Order
                          </button>
                        )}
                        {order.status === "delivered" && !order.review && (
                          <button
                            onClick={() => handleOpenReviewModal(order)}
                            className="px-6 py-2 bg-primary-container text-on-primary rounded-xl font-label-md hover:brightness-95 transition-all active:scale-95 cursor-pointer text-sm font-bold shadow-sm"
                          >
                            Rate Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {/* Skeleton cards rendered when clicking 'Show more orders' */}
          {isAppendingMore && (
            <div className="grid grid-cols-1 gap-6 animate-pulse pt-2">
              {[1, 2, 3].map((index) => (
                <div
                  key={`append-skeleton-${index}`}
                  className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/30 flex flex-col md:flex-row gap-6"
                >
                  <div className="w-full md:w-32 h-32 rounded-lg bg-outline-variant/30 flex-shrink-0"></div>
                  <div className="flex-grow flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="h-6 w-48 bg-outline-variant/30 rounded"></div>
                        <div className="h-4 w-32 bg-outline-variant/20 rounded"></div>
                      </div>
                      <div className="h-7 w-24 bg-outline-variant/30 rounded-full"></div>
                    </div>
                    <div className="h-4 w-3/4 bg-outline-variant/20 rounded"></div>
                    <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
                      <div className="h-6 w-20 bg-outline-variant/30 rounded"></div>
                      <div className="flex gap-3">
                        <div className="h-9 w-24 bg-outline-variant/30 rounded-lg"></div>
                        <div className="h-9 w-24 bg-outline-variant/30 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(filteredOrders.length > visibleCount || visibleCount > 3) && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              {filteredOrders.length > visibleCount && (
                <button
                  onClick={handleShowMore}
                  disabled={isAppendingMore}
                  className="flex items-center gap-1 text-primary font-bold font-label-md text-label-md py-2.5 px-6 rounded-xl hover:bg-primary/5 transition-all select-none cursor-pointer border border-outline-variant/60 hover:border-primary/30 bg-surface-container-lowest shadow-sm disabled:opacity-50"
                >
                  {isAppendingMore ? (
                    <>
                      <span className="material-symbols-outlined text-lg animate-spin">
                        progress_activity
                      </span>
                      <span>Loading orders...</span>
                    </>
                  ) : (
                    <>
                      <span>Show more orders</span>
                      <span className="material-symbols-outlined text-lg">
                        keyboard_arrow_down
                      </span>
                    </>
                  )}
                </button>
              )}

              {visibleCount > 3 && (
                <button
                  onClick={handleShowLess}
                  disabled={isAppendingMore}
                  className="flex items-center gap-1 text-on-surface-variant font-bold font-label-md text-label-md py-2.5 px-6 rounded-xl hover:bg-surface-container transition-all select-none cursor-pointer border border-outline-variant/60 hover:border-outline bg-surface-container-lowest shadow-sm disabled:opacity-50"
                >
                  <span>Show less orders</span>
                  <span className="material-symbols-outlined text-lg">
                    keyboard_arrow_up
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================= */}
      {/* 4. RATE ORDER MODAL                     */}
      {/* ======================================= */}
      {isReviewModalOpen && selectedOrderForReview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] relative overflow-hidden transform transition-all duration-300 scale-100 animate-in fade-in zoom-in border border-outline-variant/35">
            {/* Close Button */}
            <button
              aria-label="Close modal"
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors p-1 cursor-pointer"
              onClick={() => setIsReviewModalOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Modal Content */}
            <div className="p-lg md:p-xl flex flex-col items-center text-center">
              {/* Header */}
              <div className="mb-lg">
                <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">
                  Rate Your Order
                </h2>
                <p className="font-label-md text-primary tracking-wide mb-1 uppercase font-bold text-xs">
                  {selectedOrderForReview.restaurant?.name}
                </p>
                <p className="text-on-surface-variant text-body-md italic px-4 text-sm mt-1 leading-snug">
                  {selectedOrderForReview.items
                    .map((it: any) => `${it.quantity}x ${it.name}`)
                    .join(", ")}
                </p>
              </div>

              {/* Rating Stars Section */}
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

              {/* Comment Input */}
              <div className="w-full mb-xl">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full h-32 p-md bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface resize-none transition-all outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 text-sm"
                  placeholder="Share your experience..."
                ></textarea>
              </div>

              {/* Action Buttons */}
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

            {/* Bottom brand decoration */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20"></div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 5. REORDER CONFLICT MODAL               */}
      {/* ======================================= */}
      {isConflictModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface max-w-md w-full rounded-2xl border border-outline-variant p-lg shadow-xl space-y-lg animate-scale-up">
            {/* Header */}
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

            {/* Action Buttons */}
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
      {/* 6. CANCEL ORDER MODAL                   */}
      {/* ======================================= */}
      {isCancelModalOpen && selectedOrderForCancel && (
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
                #{selectedOrderForCancel._id.slice(-6).toUpperCase()}
              </span>{" "}
              from <span className="font-bold text-on-surface">{selectedOrderForCancel.restaurant?.name}</span>?
            </p>

            {/* Select Reason */}
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

            {/* Refund Eligibility Notice Banner */}
            {selectedOrderForCancel.paymentMethod === "razorpay" && selectedOrderForCancel.paymentStatus === "paid" && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  selectedOrderForCancel.status === "placed" &&
                  Math.floor((new Date().getTime() - new Date(selectedOrderForCancel.createdAt).getTime()) / 1000) <= 60
                    ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                    : "bg-amber-50 text-amber-900 border-amber-200"
                }`}
              >
                <span className="material-symbols-outlined text-lg flex-shrink-0">
                  {selectedOrderForCancel.status === "placed" &&
                  Math.floor((new Date().getTime() - new Date(selectedOrderForCancel.createdAt).getTime()) / 1000) <= 60
                    ? "verified"
                    : "warning"}
                </span>
                <span>
                  {selectedOrderForCancel.status === "placed" &&
                  Math.floor((new Date().getTime() - new Date(selectedOrderForCancel.createdAt).getTime()) / 1000) <= 60
                    ? "Eligible for 100% Full Refund via Razorpay (Within 1 minute grace period)."
                    : "100% Cancellation Charge applies (No refund) as cancellation is after 1 minute / restaurant acceptance."}
                </span>
              </div>
            )}

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
