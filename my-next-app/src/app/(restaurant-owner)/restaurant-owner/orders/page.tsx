"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  useGetMerchantOrdersQuery,
  useUpdateOrderStatusMutation,
} from "@/lib/redux/apiSlice";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  Calendar,
  IndianRupee,
  Check,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";

const OrderCardSkeleton = () => (
  <div className="bg-white border border-outline-variant/20 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between p-md space-y-md animate-pulse">
    {/* Top section */}
    <div className="flex justify-between items-start border-b border-outline-variant/10 pb-md">
      <div className="space-y-2">
        <div className="h-5 bg-slate-100 rounded-lg w-20"></div>
        <div className="h-3.5 bg-slate-100 rounded-lg w-28"></div>
      </div>
      <div className="space-y-2 text-right">
        <div className="h-3 bg-slate-100 rounded-lg w-16 ml-auto"></div>
        <div className="h-5 bg-slate-100 rounded-lg w-20 ml-auto"></div>
      </div>
    </div>
    {/* Customer info */}
    <div className="bg-slate-50/50 p-3 rounded-2xl border border-outline-variant/10 space-y-2">
      <div className="h-4 bg-slate-100 rounded w-24"></div>
      <div className="h-3 bg-slate-100 rounded w-48"></div>
    </div>
    {/* Items info */}
    <div className="space-y-3 flex-1 py-2">
      <div className="h-4 bg-slate-100 rounded w-28"></div>
      <div className="space-y-2">
        <div className="h-3.5 bg-slate-100 rounded w-full"></div>
        <div className="h-3.5 bg-slate-100 rounded w-2/3"></div>
      </div>
    </div>
    {/* Bottom buttons */}
    <div className="pt-md border-t border-outline-variant/10 flex justify-between items-center bg-slate-50/30 -mx-md -mb-md p-md">
      <div className="h-4 bg-slate-100 rounded w-24"></div>
      <div className="h-8 bg-slate-100 rounded-xl w-32"></div>
    </div>
  </div>
);

export default function RestaurantOrdersPage() {
  const { data: orders = [], isLoading, error } = useGetMerchantOrdersQuery();
  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);

  const handlePageChange = (pageNum: number) => {
    setIsPageLoading(true);
    setCurrentPage(pageNum);

    // Smooth scroll back to the top of the orders container
    const element = document.getElementById("kitchen-console-orders");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setTimeout(() => {
      setIsPageLoading(false);
    }, 400);
  };

  const handleTabClick = (tabId: string) => {
    if (activeTab === tabId) return;
    setIsPageLoading(true);
    setActiveTab(tabId);
    setTimeout(() => {
      setIsPageLoading(false);
    }, 400);
  };

  // Status categories for filtering
  const statusTabs = useMemo(() => {
    const counts = {
      all: orders.length,
      placed: orders.filter((o) => o.status === "placed").length,
      accepted: orders.filter((o) => o.status === "accepted").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      ready_for_pickup: orders.filter((o) => o.status === "ready_for_pickup").length,
      out_for_delivery: orders.filter((o) => o.status === "out_for_delivery" || o.status === "picked_up").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };

    return [
      { id: "all", label: "All Orders", count: counts.all, color: "bg-slate-100 text-slate-700" },
      { id: "placed", label: "New (Placed)", count: counts.placed, color: "bg-blue-100 text-blue-700" },
      { id: "accepted", label: "Accepted", count: counts.accepted, color: "bg-indigo-100 text-indigo-700" },
      { id: "preparing", label: "Preparing", count: counts.preparing, color: "bg-amber-100 text-amber-700" },
      { id: "ready_for_pickup", label: "Ready for Pickup", count: counts.ready_for_pickup, color: "bg-emerald-100 text-emerald-700" },
      { id: "out_for_delivery", label: "Out for Delivery", count: counts.out_for_delivery, color: "bg-purple-100 text-purple-700" },
      { id: "delivered", label: "Delivered", count: counts.delivered, color: "bg-green-100 text-green-700" },
      { id: "cancelled", label: "Cancelled", count: counts.cancelled, color: "bg-red-100 text-red-700" },
    ];
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders;
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  // Reset page when active tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const ITEMS_PER_PAGE = 4;
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  // Update order status trigger
  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus({ id: orderId, status }).unwrap();
      toast.success(`Order status successfully updated to: ${status}`);
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update order status.");
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "placed":
        return "bg-blue-50 text-blue-700 border-blue-200/50";
      case "accepted":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/50";
      case "preparing":
        return "bg-amber-50 text-amber-700 border-amber-200/50";
      case "ready_for_pickup":
        return "bg-teal-50 text-teal-700 border-teal-200/50";
      case "picked_up":
        return "bg-blue-50 text-blue-700 border-blue-200/50";
      case "out_for_delivery":
        return "bg-purple-50 text-purple-700 border-purple-200/50";
      case "delivered":
        return "bg-green-50 text-green-700 border-green-200/50";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200/50";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/50";
    }
  };

  const formatStatus = (status: string) => {
    if (status === "placed") return "New Order";
    if (status === "ready_for_pickup") return "Ready for Pickup";
    if (status === "picked_up") return "Picked Up";
    if (status === "out_for_delivery") return "Out for Delivery";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="space-y-lg max-w-6xl mx-auto p-4 md:p-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md bg-gradient-to-r from-primary/10 to-indigo-500/10 p-lg rounded-3xl border border-outline-variant/30">
        <div className="space-y-xs">
          <div className="flex items-center gap-2 text-primary font-bold">
            <ShoppingBag className="w-5 h-5 animate-pulse" />
            <span>Real-time Orders Management</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-background font-extrabold">
            Kitchen Console
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Accept delivery requests, track food preparations, and manage handovers.
          </p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-outline-variant/20">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`px-4 py-2 rounded-xl text-body-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-2 border ${
              activeTab === tab.id
                ? "bg-primary text-white border-primary shadow-md shadow-primary/15"
                : "bg-surface-container text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-high"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Loading Screen */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white border border-outline-variant/30 rounded-2xl p-md space-y-md animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-6 bg-surface-container rounded w-1/3"></div>
                <div className="h-6 bg-surface-container rounded w-1/4"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-surface-container rounded w-3/4"></div>
                <div className="h-4 bg-surface-container rounded w-1/2"></div>
              </div>
              <div className="h-10 bg-surface-container rounded w-full"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-md rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-body-md">Failed to load incoming orders</h4>
            <p className="text-body-sm mt-1">Please try refreshing the page or contact support.</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredOrders.length === 0 && (
        <div className="text-center py-20 bg-white border border-outline-variant/30 rounded-3xl p-lg space-y-md shadow-sm">
          <div className="w-16 h-16 bg-surface-container text-on-surface-variant/40 rounded-full flex items-center justify-center mx-auto">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-headline-sm text-on-background">No orders found</h3>
          <p className="text-body-md text-on-surface-variant max-w-sm mx-auto">
            There are currently no orders in the <strong>{statusTabs.find((t) => t.id === activeTab)?.label}</strong> queue.
          </p>
        </div>
      )}

      {/* List of Orders */}
      {!isLoading && !error && filteredOrders.length > 0 && (
        <div id="kitchen-console-orders" className="space-y-lg scroll-mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
            {isPageLoading ? (
              Array.from({ length: Math.min(ITEMS_PER_PAGE, filteredOrders.length - (currentPage - 1) * ITEMS_PER_PAGE) }).map((_, idx) => (
                <OrderCardSkeleton key={idx} />
              ))
            ) : (
              paginatedOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white border rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between transition-all duration-200 border-outline-variant/30 hover:shadow-md animate-fade-in"
                >
                {/* Card Top / Meta */}
                <div className="p-md space-y-md border-b border-outline-variant/20">
                  <div className="flex items-center justify-between">
                    <div className="space-y-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-body-md font-extrabold text-on-surface-variant">
                          #{order._id.slice(-6).toUpperCase()}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-caption font-extrabold border ${getStatusStyle(
                            order.status
                          )}`}
                        >
                          {formatStatus(order.status)}
                        </span>

                        {/* Industry Standard Payment Status Badge */}
                        {order.paymentMethod === "razorpay" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>PAID ONLINE</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>CASH ON DELIVERY</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-caption text-on-surface-variant/70">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(order.createdAt).toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-caption text-on-surface-variant block font-bold">Total Amount</span>
                      <span className="text-headline-xs font-black text-on-background flex items-center justify-end">
                        <IndianRupee className="w-4 h-4 mt-0.5" />
                        {order.totalAmount.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-slate-50/50 p-3 rounded-2xl border border-outline-variant/15 space-y-2">
                    <div className="font-bold text-body-sm text-on-background flex items-center justify-between">
                      <span>{order.customer?.name || "Guest User"}</span>
                      {order.customer?.phone && (
                        <a
                          href={`tel:${order.customer.phone}`}
                          className="text-primary hover:underline flex items-center gap-1 text-xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Customer</span>
                        </a>
                      )}
                    </div>
                    <div className="text-caption text-on-surface-variant flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        {order.deliveryAddress.addressLine}, {order.deliveryAddress.city}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body / Dishes List */}
                <div className="p-md space-y-sm flex-1">
                  <span className="font-label-md text-label-md text-on-surface-variant font-bold block">
                    Items Summary
                  </span>
                  <div className="divide-y divide-outline-variant/10">
                    {order.items.map((item) => (
                      <div key={item._id} className="py-2.5 flex items-center justify-between text-body-sm">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-primary/5 text-primary rounded-lg font-black text-xs flex items-center justify-center border border-primary/10 shrink-0">
                            x{item.quantity}
                          </span>
                          <span className="font-semibold text-on-background">{item.name}</span>
                        </div>
                        <span className="font-bold text-on-surface-variant">
                          ₹{(item.price * item.quantity).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Cost summary table */}
                  <div className="pt-2 border-t border-outline-variant/10 text-caption text-on-surface-variant/80 space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{order.subtotal.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Charges</span>
                      <span>₹{order.deliveryFee.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes & GST (5%)</span>
                      <span>₹{order.taxes.toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom / Action Buttons */}
                <div className="p-md bg-slate-50/50 border-t border-outline-variant/20 flex items-center justify-between">
                  <span className="text-caption text-on-surface-variant font-bold">
                    {["delivered", "cancelled"].includes(order.status) ? "Completed Order" : "Change Status to:"}
                  </span>

                  <div className="flex items-center gap-2">
                    {order.status === "placed" && (
                      <>
                        <button
                          onClick={() => handleStatusChange(order._id, "cancelled")}
                          disabled={isUpdating}
                          className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 font-bold rounded-xl text-xs cursor-pointer active:scale-95 transition-all"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleStatusChange(order._id, "accepted")}
                          disabled={isUpdating}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer active:scale-95 transition-all shadow-sm shadow-indigo-100"
                        >
                          Accept Order
                        </button>
                      </>
                    )}

                    {order.status === "accepted" && (
                      <button
                        onClick={() => handleStatusChange(order._id, "preparing")}
                        disabled={isUpdating}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs cursor-pointer active:scale-95 transition-all"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Start Preparing</span>
                      </button>
                    )}

                    {order.status === "preparing" && (
                      <button
                        onClick={() => handleStatusChange(order._id, "ready_for_pickup")}
                        disabled={isUpdating}
                        className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs cursor-pointer active:scale-95 transition-all shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Ready for Pickup</span>
                      </button>
                    )}

                    {order.status === "ready_for_pickup" && (
                      <span className="flex items-center gap-1 text-xs text-amber-700 font-bold bg-amber-50 border border-amber-200/60 px-3 py-1.5 rounded-xl">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        <span>Waiting for Delivery Partner...</span>
                      </span>
                    )}

                    {order.status === "picked_up" && (
                      <span className="flex items-center gap-1 text-xs text-blue-700 font-bold bg-blue-50 border border-blue-200/60 px-3 py-1.5 rounded-xl">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Picked Up by Partner</span>
                      </span>
                    )}

                    {order.status === "out_for_delivery" && (
                      <span className="flex items-center gap-1 text-xs text-purple-700 font-bold bg-purple-50 border border-purple-200/60 px-3 py-1.5 rounded-xl">
                        <ChevronRight className="w-3.5 h-3.5 animate-pulse" />
                        <span>Out for Delivery</span>
                      </span>
                    )}

                    {order.status === "delivered" && (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Delivered</span>
                      </span>
                    )}

                    {order.status === "cancelled" && (
                      <span className="flex items-center gap-1 text-xs text-red-500 font-bold">
                        <XCircle className="w-4 h-4" />
                        <span>Cancelled / Rejected</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <button
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1 || isPageLoading}
                className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                  currentPage === 1 || isPageLoading
                    ? "bg-slate-50 text-slate-400 border-outline-variant/10 cursor-not-allowed"
                    : "bg-white text-on-surface hover:bg-slate-50 border-outline-variant/30 cursor-pointer active:scale-95"
                }`}
                title="Previous Page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: totalPages }, (_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isPageLoading}
                    className={`w-10 h-10 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center border ${
                      currentPage === pageNum
                        ? "bg-primary text-white border-primary shadow-md shadow-primary/15"
                        : "bg-white text-on-surface-variant hover:text-primary hover:bg-slate-50 border-outline-variant/30"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages || isPageLoading}
                className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                  currentPage === totalPages || isPageLoading
                    ? "bg-slate-50 text-slate-400 border-outline-variant/10 cursor-not-allowed"
                    : "bg-white text-on-surface hover:bg-slate-50 border-outline-variant/30 cursor-pointer active:scale-95"
                }`}
                title="Next Page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
