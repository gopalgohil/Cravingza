"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  useGetMerchantOrdersQuery,
  useUpdateOrderStatusMutation,
  useGetMyMenuQuery,
} from "@/lib/redux/apiSlice";
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Sparkles,
  DollarSign,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import DashboardStatCard from "@/components/restaurant-owner/DashboardStatCard";

const RecentOrdersTableSkeleton = () => (
  <>
    {[1, 2, 3, 4].map((i) => (
      <tr key={i} className="animate-pulse border-b border-outline-variant/10">
        <td className="p-4 space-y-2">
          <div className="h-4 bg-slate-100 rounded w-16"></div>
          <div className="h-4 bg-slate-100 rounded w-24"></div>
          <div className="h-3 bg-slate-100 rounded w-20"></div>
        </td>
        <td className="p-4 space-y-2">
          <div className="h-3.5 bg-slate-100 rounded w-28"></div>
          <div className="h-3.5 bg-slate-100 rounded w-20"></div>
        </td>
        <td className="p-4">
          <div className="h-4 bg-slate-100 rounded w-12"></div>
        </td>
        <td className="p-4">
          <div className="h-6 bg-slate-100 rounded-full w-20"></div>
        </td>
        <td className="p-4 text-right">
          <div className="h-8 bg-slate-100 rounded-lg w-20 ml-auto"></div>
        </td>
      </tr>
    ))}
  </>
);

export default function RestaurantDashboardPage() {
  const { data: orders = [], isLoading: isOrdersLoading, error: ordersError } = useGetMerchantOrdersQuery(undefined, { refetchOnMountOrArgChange: true, refetchOnFocus: true });
  const { data: menuItems = [], isLoading: isMenuLoading } = useGetMyMenuQuery();
  const [updateOrderStatus, { isLoading: isUpdatingStatus }] = useUpdateOrderStatusMutation();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);

  // Compute metrics
  const stats = useMemo(() => {
    // Only count delivered orders as earnings
    const deliveredOrders = orders.filter((o) => o.status === "delivered");
    const totalEarnings = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const pendingOrders = orders.filter((o) => o.status === "placed").length;
    const activeOrders = orders.filter(
      (o) => ["accepted", "preparing", "out_for_delivery"].includes(o.status)
    ).length;

    const outOfStockItems = menuItems.filter((item) => !item.isAvailable).length;

    return {
      totalEarnings,
      totalOrders: orders.length,
      pendingOrders,
      activeOrders,
      totalMenuItems: menuItems.length,
      outOfStockItems,
    };
  }, [orders, menuItems]);

  const ITEMS_PER_PAGE = 4;
  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);

  const paginatedRecentOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return orders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [orders, currentPage]);

  const handlePageChange = (pageNum: number) => {
    setIsPageLoading(true);
    setCurrentPage(pageNum);

    const element = document.getElementById("recent-orders-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setTimeout(() => {
      setIsPageLoading(false);
    }, 400);
  };

  // Handle Quick Status Update
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus({ id: orderId, status: newStatus }).unwrap();
      toast.success(`Order status updated to "${newStatus}"!`);
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update order status.");
    }
  };

  const getStatusColor = (status: string) => {
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

  const formatStatusText = (status: string) => {
    if (status === "placed") return "New Order";
    if (status === "ready_for_pickup") return "Ready for Pickup";
    if (status === "picked_up") return "Picked Up";
    if (status === "out_for_delivery") return "Out for Delivery";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const isLoading = isOrdersLoading || isMenuLoading;

  return (
    <div className="space-y-lg max-w-6xl mx-auto p-4 md:p-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary to-orange-600 text-white p-lg rounded-3xl shadow-xl shadow-primary/10 relative overflow-hidden">
        {/* Subtle grid decoration */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="relative space-y-xs">
          <div className="flex items-center gap-2 font-bold text-orange-200">
            <Sparkles className="w-5 h-5 fill-orange-200" />
            <span>Restaurant Partner Portal</span>
          </div>
          <h1 className="font-headline-md text-headline-md font-extrabold tracking-tight">
            Dashboard Overview
          </h1>
          <p className="font-body-md text-body-md text-white/95 max-w-xl">
            Monitor real-time earnings, incoming orders, and manage kitchen status updates efficiently from this panel.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white border border-outline-variant/30 h-28 rounded-2xl"></div>
            ))}
          </div>
          <div className="bg-white border border-outline-variant/30 h-64 rounded-2xl animate-pulse"></div>
        </div>
      )}

      {/* Error State */}
      {ordersError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-md rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-body-md">Failed to load analytics</h4>
            <p className="text-body-sm mt-1">Please check your network connection or verify authentication.</p>
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      {!isLoading && !ordersError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
          <DashboardStatCard
            title="Total Earnings"
            value={`₹${stats.totalEarnings.toLocaleString("en-IN")}`}
            icon={<DollarSign className="w-6 h-6" />}
            iconBgClass="bg-green-50 text-green-600 border-green-200/50"
            badge={{
              icon: <TrendingUp className="w-3.5 h-3.5" />,
              label: "Delivered Sales",
              colorClass: "text-green-600",
            }}
          />

          <DashboardStatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<ShoppingBag className="w-6 h-6" />}
            iconBgClass="bg-indigo-50 text-indigo-600 border-indigo-200/50"
            badge={{
              icon: <ShoppingBag className="w-3.5 h-3.5" />,
              label: "All Orders Lifetime",
              colorClass: "text-indigo-600",
            }}
          />

          <DashboardStatCard
            title="Active Kitchen Orders"
            value={stats.activeOrders}
            icon={<ChefHat className="w-6 h-6" />}
            iconBgClass={
              stats.pendingOrders > 0
                ? "bg-orange-50 text-orange-600 border-orange-200/50 animate-bounce"
                : "bg-amber-50 text-amber-600 border-amber-200/50"
            }
            badge={
              stats.pendingOrders > 0
                ? {
                    icon: <Clock className="w-3.5 h-3.5" />,
                    label: `${stats.pendingOrders} new waiting acceptance`,
                    colorClass: "text-orange-600 animate-pulse",
                  }
                : {
                    icon: <CheckCircle className="w-3.5 h-3.5" />,
                    label: "Fully caught up",
                    colorClass: "text-slate-500",
                  }
            }
          />

          <DashboardStatCard
            title="Active Menu Cards"
            value={stats.totalMenuItems}
            icon={<Utensils className="w-6 h-6" />}
            iconBgClass="bg-teal-50 text-teal-600 border-teal-200/50"
            badge={
              stats.outOfStockItems > 0
                ? {
                    icon: <TrendingDown className="w-3.5 h-3.5" />,
                    label: `${stats.outOfStockItems} items out of stock`,
                    colorClass: "text-red-600",
                  }
                : {
                    icon: <CheckCircle className="w-3.5 h-3.5" />,
                    label: "All items available",
                    colorClass: "text-green-600",
                  }
            }
          />
        </div>
      )}

      {/* Dashboard Core Content Layout */}
      {!isLoading && !ordersError && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          {/* Incoming Orders Panel - Left 2 Columns */}
          <div id="recent-orders-section" className="lg:col-span-2 space-y-md scroll-mt-8">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-background">
                Recent Orders
              </h3>
              <Link
                href="/restaurant-owner/orders"
                className="text-body-sm text-primary font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>View All Orders</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white border border-outline-variant/30 rounded-3xl p-xl text-center space-y-md shadow-sm">
                <ShoppingBag className="w-12 h-12 text-on-surface-variant/30 mx-auto" />
                <h4 className="font-bold text-body-lg text-on-background">No orders received yet</h4>
                <p className="text-body-sm text-on-surface-variant max-w-sm mx-auto">
                  Once customers place orders at your restaurant, they will show up here in real-time.
                </p>
              </div>
            ) : (
              <div className="space-y-sm">
                <div className="bg-white border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm">
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container/40 text-on-surface-variant border-b border-outline-variant/20 text-caption font-bold">
                          <th className="p-4">Order ID / Customer</th>
                          <th className="p-4">Items Summary</th>
                          <th className="p-4">Total Amount</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Quick Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {isPageLoading ? (
                          <RecentOrdersTableSkeleton />
                        ) : (
                          paginatedRecentOrders.map((order) => (
                            <tr key={order._id} className="hover:bg-slate-50/50 transition-colors text-body-sm animate-fade-in">
                              {/* Order Details / Customer */}
                              <td className="p-4 space-y-0.5">
                                <span className="font-mono text-xs font-bold text-on-surface-variant">
                                  #{order._id.slice(-6).toUpperCase()}
                                </span>
                                <div className="font-bold text-on-background truncate max-w-[150px]">
                                  {order.customer?.name || "Guest User"}
                                </div>
                                <div className="text-caption text-on-surface-variant/75 truncate max-w-[150px]">
                                  {order.customer?.phone || "No Phone"}
                                </div>
                              </td>

                              {/* Items summary */}
                              <td className="p-4">
                                <div className="max-w-[200px] space-y-1">
                                  {order.items.map((item) => (
                                    <div key={item._id} className="text-xs truncate">
                                      <span className="font-bold text-primary mr-1">x{item.quantity}</span>
                                      <span className="text-on-background">{item.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </td>

                              {/* Total Price */}
                              <td className="p-4 font-black text-on-background">
                                ₹{order.totalAmount.toFixed(0)}
                              </td>

                              {/* Status & Payment badge */}
                              <td className="p-4 space-y-1">
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-full text-caption font-extrabold border ${getStatusColor(
                                    order.status
                                  )}`}
                                >
                                  {formatStatusText(order.status)}
                                </span>
                                <div>
                                  {order.paymentMethod === "razorpay" ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      <span>PAID ONLINE</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                      <span>COD</span>
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Interactive Action Buttons */}
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                  {order.status === "placed" && (
                                    <>
                                      <button
                                        onClick={() => handleStatusUpdate(order._id, "accepted")}
                                        disabled={isUpdatingStatus}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-sm shadow-indigo-100"
                                      >
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => handleStatusUpdate(order._id, "cancelled")}
                                        disabled={isUpdatingStatus}
                                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg cursor-pointer"
                                        title="Reject/Cancel"
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}

                                  {order.status === "accepted" && (
                                    <button
                                      onClick={() => handleStatusUpdate(order._id, "preparing")}
                                      disabled={isUpdatingStatus}
                                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs cursor-pointer"
                                    >
                                      Start Preparing
                                    </button>
                                  )}

                                  {order.status === "preparing" && (
                                    <button
                                      onClick={() => handleStatusUpdate(order._id, "ready_for_pickup")}
                                      disabled={isUpdatingStatus}
                                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-sm"
                                    >
                                      Ready for Pickup
                                    </button>
                                  )}

                                  {order.status === "ready_for_pickup" && (
                                    <span className="text-caption text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
                                      Waiting for Rider
                                    </span>
                                  )}

                                  {["picked_up", "out_for_delivery"].includes(order.status) && (
                                    <span className="text-caption text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200/60">
                                      In Transit (Rider)
                                    </span>
                                  )}

                                  {["delivered", "cancelled"].includes(order.status) && (
                                    <span className="text-caption text-on-surface-variant/50 font-bold italic">
                                      No Actions Pending
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Compact List View (No Horizontal Scroll) */}
                  <div className="block md:hidden divide-y divide-outline-variant/15">
                    {isPageLoading ? (
                      <div className="p-4 space-y-3 animate-pulse">
                        <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                      </div>
                    ) : (
                      paginatedRecentOrders.map((order) => (
                        <div key={order._id} className="p-3.5 space-y-2.5 animate-fade-in hover:bg-slate-50/50 transition-colors">
                          {/* Top Row: Customer Avatar, Name, Order ID & Status */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                {(order.customer?.name || "G").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-on-background text-sm truncate">
                                  {order.customer?.name || "Guest User"}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                                  <span className="font-mono font-bold text-on-surface-variant">
                                    #{order._id.slice(-6).toUpperCase()}
                                  </span>
                                  {order.customer?.phone && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate">{order.customer?.phone}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${getStatusColor(
                                  order.status
                                )}`}
                              >
                                {formatStatusText(order.status)}
                              </span>
                              {order.paymentMethod === "razorpay" ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.25 rounded text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                                  <span>PAID</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.25 rounded text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                                  <span className="w-1 h-1 rounded-full bg-amber-500"></span>
                                  <span>COD</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Items Summary */}
                          <div className="bg-surface-container/30 rounded-lg p-2 text-xs space-y-0.5">
                            {order.items.map((item) => (
                              <div key={item._id} className="flex justify-between items-center text-on-background">
                                <span className="truncate pr-2">
                                  <span className="font-bold text-primary mr-1.5">x{item.quantity}</span>
                                  {item.name}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Bottom Row: Total & Action */}
                          <div className="flex items-center justify-between pt-1 border-t border-outline-variant/15">
                            <div>
                              <span className="text-[11px] text-on-surface-variant block">Total Amount</span>
                              <span className="font-black text-on-background text-base">₹{order.totalAmount.toFixed(0)}</span>
                            </div>

                            <div>
                              {order.status === "placed" && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleStatusUpdate(order._id, "accepted")}
                                    disabled={isUpdatingStatus}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(order._id, "cancelled")}
                                    disabled={isUpdatingStatus}
                                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg cursor-pointer"
                                    title="Reject/Cancel"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              )}

                              {order.status === "accepted" && (
                                <button
                                  onClick={() => handleStatusUpdate(order._id, "preparing")}
                                  disabled={isUpdatingStatus}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                                >
                                  Start Preparing
                                </button>
                              )}

                              {order.status === "preparing" && (
                                <button
                                  onClick={() => handleStatusUpdate(order._id, "ready_for_pickup")}
                                  disabled={isUpdatingStatus}
                                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                                >
                                  Ready for Pickup
                                </button>
                              )}

                              {order.status === "ready_for_pickup" && (
                                <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded-full border border-amber-200/60">
                                  Waiting for Rider
                                </span>
                              )}

                              {["picked_up", "out_for_delivery"].includes(order.status) && (
                                <span className="text-[11px] text-purple-700 font-bold bg-purple-50 px-2 py-1 rounded-full border border-purple-200/60">
                                  In Transit
                                </span>
                              )}

                              {["delivered", "cancelled"].includes(order.status) && (
                                <span className="text-xs text-on-surface-variant/50 font-bold italic">
                                  No Actions Pending
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                      onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                      disabled={currentPage === 1 || isPageLoading}
                      className={`p-1.5 rounded-lg border flex items-center justify-center transition-all ${
                        currentPage === 1 || isPageLoading
                          ? "bg-slate-50 text-slate-400 border-outline-variant/10 cursor-not-allowed"
                          : "bg-white text-on-surface hover:bg-slate-50 border-outline-variant/30 cursor-pointer active:scale-95"
                      }`}
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, idx) => {
                      const pageNum = idx + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          disabled={isPageLoading}
                          className={`w-8 h-8 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center border ${
                            currentPage === pageNum
                              ? "bg-primary text-white border-primary shadow-sm shadow-primary/15"
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
                      className={`p-1.5 rounded-lg border flex items-center justify-center transition-all ${
                        currentPage === totalPages || isPageLoading
                          ? "bg-slate-50 text-slate-400 border-outline-variant/10 cursor-not-allowed"
                          : "bg-white text-on-surface hover:bg-slate-50 border-outline-variant/30 cursor-pointer active:scale-95"
                      }`}
                      title="Next Page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Menu Card - Right 1 Column */}
          <div className="space-y-md">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-background">
              Menu Quick Look
            </h3>

            <div className="bg-white border border-outline-variant/30 rounded-3xl p-md shadow-sm space-y-md">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary border border-primary/10">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-body-md text-on-background">Menu Card Status</h4>
                  <p className="text-caption text-on-surface-variant">Quick toggle and preview</p>
                </div>
              </div>

              {/* Counts list */}
              <div className="space-y-sm pt-2">
                <div className="flex justify-between items-center text-body-sm">
                  <span className="text-on-surface-variant font-bold">Total Dishes</span>
                  <span className="font-black text-on-background">{stats.totalMenuItems}</span>
                </div>
                <div className="flex justify-between items-center text-body-sm">
                  <span className="text-on-surface-variant font-bold">Out of Stock Items</span>
                  <span className={`font-black ${stats.outOfStockItems > 0 ? "text-red-600" : "text-slate-600"}`}>
                    {stats.outOfStockItems}
                  </span>
                </div>
              </div>

              <div className="border-t border-outline-variant/20 pt-4">
                <Link
                  href="/restaurant-owner/menu"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary/10 to-orange-500/10 hover:from-primary/20 hover:to-orange-500/20 text-primary font-bold px-4 py-2.5 rounded-xl transition-all text-body-sm cursor-pointer"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Go to Menu Manager</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
