"use client";

import React from "react";
import Link from "next/link";
import { useGetAdminDashboardQuery } from "@/lib/redux/apiSlice";

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useGetAdminDashboardQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  if (isLoading) {
    return (
      <div className="space-y-xl animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-10 w-24 bg-slate-200 rounded-lg"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-3xl border border-slate-100 p-6 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                <div className="h-8 w-8 bg-slate-200 rounded-xl"></div>
              </div>
              <div className="h-8 w-16 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Details Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-80 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm"></div>
            <div className="h-64 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm"></div>
          </div>
          <div className="h-96 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm"></div>
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-lg rounded-3xl flex flex-col items-center gap-4 text-center">
        <span className="material-symbols-outlined text-4xl">error</span>
        <div>
          <h3 className="font-bold text-lg">Failed to load dashboard data</h3>
          <p className="text-sm text-red-600/90 mt-1">There was an error communicating with the administration API.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const {
    totalOrdersToday,
    platformRevenueToday,
    activeRestaurants,
    activeDeliveryPartners,
    pendingApprovals,
    pendingApprovalsList = [],
    recentActivity = [],
    orderTrend = [],
  } = data.data;

  // Calculate chart metrics
  const maxOrders = Math.max(...orderTrend.map((t: any) => t.orderCount), 5);

  const kpis = [
    {
      label: "Today's Orders",
      value: totalOrdersToday,
      icon: "shopping_bag",
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
      description: "Orders placed since midnight",
    },
    {
      label: "Today's Revenue",
      value: `₹${platformRevenueToday.toLocaleString("en-IN")}`,
      icon: "payments",
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      description: "Net platform intake today",
    },
    {
      label: "Active Restaurants",
      value: activeRestaurants,
      icon: "storefront",
      color: "bg-amber-50 text-amber-600 border-amber-100",
      description: "Approved & open restaurants",
    },
    {
      label: "Delivery Fleet",
      value: activeDeliveryPartners,
      icon: "delivery_dining",
      color: "bg-sky-50 text-sky-600 border-sky-100",
      description: "Active partners on shift",
    },
  ];

  return (
    <div className="space-y-xl animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-md">
        <div>
          <h1 className="font-headline-md text-headline-md font-extrabold text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="font-body-md text-body-md text-slate-500 mt-1">
            Real-time platform status, revenue growth, and merchant registration onboarding.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="self-start flex items-center gap-sm px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm transition-all cursor-pointer text-sm"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <span className="font-label-md text-label-md text-slate-500 font-bold tracking-tight">
                {kpi.label}
              </span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${kpi.color}`}>
                <span className="material-symbols-outlined">{kpi.icon}</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{kpi.value}</span>
              <p className="text-xs text-slate-400 mt-1.5">{kpi.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Left Column (Chart & Pending), Right Column (Activity & Delivery) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Area: 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* SVG Trend Chart */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-lg tracking-tight">Order Trend (7 Days)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Order volume over the past week</p>
              </div>
              <div className="flex items-center gap-xs text-xs text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
                <span>Completed Orders</span>
              </div>
            </div>

            {/* Custom SVG Chart */}
            <div className="h-64 relative flex items-end">
              <div className="absolute inset-y-0 left-0 w-8 flex flex-col justify-between text-right pr-2 text-xs text-slate-400 select-none pointer-events-none">
                <span>{maxOrders}</span>
                <span>{Math.round(maxOrders * 0.75)}</span>
                <span>{Math.round(maxOrders * 0.5)}</span>
                <span>{Math.round(maxOrders * 0.25)}</span>
                <span>0</span>
              </div>

              {/* Chart Grid Lines */}
              <div className="absolute inset-y-0 left-8 right-0 flex flex-col justify-between select-none pointer-events-none py-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="border-t border-slate-100 w-full h-px"></div>
                ))}
              </div>

              {/* Chart Bars */}
              <div className="flex-1 ml-8 h-full flex justify-around items-end pt-4 pb-2 z-10">
                {orderTrend.map((trend: any, idx: number) => {
                  const percent = (trend.orderCount / maxOrders) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 h-full group justify-end">
                      <div className="relative w-8 sm:w-12 flex-1 flex items-end justify-center">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 font-bold pointer-events-none">
                          {trend.orderCount} orders
                          <span className="block text-[10px] text-slate-400 font-normal">{trend.date}</span>
                        </div>

                        {/* Bar */}
                        <div
                          style={{ height: `${percent}%` }}
                          className="w-full bg-gradient-to-t from-primary to-orange-400 rounded-t-lg group-hover:brightness-95 transition-all duration-300 min-h-[4px]"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 font-bold select-none">{trend.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pending Applications List (Combined Restaurants & Delivery Partners) */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-lg tracking-tight">Pending Approvals</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  You have {pendingApprovals} onboarding applications (Restaurants & Delivery Partners) awaiting review
                </p>
              </div>
              <Link
                href="/admin/approvals"
                className="text-xs font-bold text-primary hover:text-orange-600 transition-colors flex items-center gap-xs"
              >
                View All
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            {pendingApprovalsList.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-slate-300 text-4xl">rule</span>
                <p className="text-sm text-slate-500 font-bold mt-2">All caught up!</p>
                <p className="text-xs text-slate-400 mt-0.5">No pending onboarding requests.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 font-bold">Applicant Name</th>
                      <th className="pb-3 font-bold">Type</th>
                      <th className="pb-3 font-bold">Applied On</th>
                      <th className="pb-3 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pendingApprovalsList.map((app: any) => {
                      const isRestaurant = app.type === "restaurant";
                      const targetType = isRestaurant ? "restaurants" : "delivery_partners";
                      const icon = isRestaurant ? "storefront" : "sports_motorsports";
                      const badgeColor = isRestaurant
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-blue-50 text-blue-700 border-blue-200";

                      return (
                        <tr key={app.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 font-bold text-slate-800 text-sm">{app.name}</td>
                          <td className="py-4 text-xs">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                              <span className="material-symbols-outlined text-[12px]">{icon}</span>
                              {isRestaurant ? "Restaurant" : "Rider"}
                            </span>
                          </td>
                          <td className="py-4 text-xs text-slate-500">
                            {new Date(app.submittedAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-4 text-right">
                            <Link
                              href={`/admin/approvals?type=${targetType}&status=pending&id=${app.id}`}
                              className="inline-flex items-center gap-xs px-3.5 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded-xl transition-all"
                            >
                              <span>Review</span>
                              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Area: 1 Col */}
        <div className="space-y-6">
          {/* Recent Activity Feed */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col h-[520px]">
            <div className="mb-6">
              <h3 className="font-bold text-slate-800 text-lg tracking-tight">Recent Activity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time actions occurring across Cravingza</p>
            </div>

            {recentActivity.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-md">
                <span className="material-symbols-outlined text-slate-300 text-4xl">history</span>
                <p className="text-sm text-slate-400 font-bold mt-2">No activity recorded yet</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                {recentActivity.map((act: any) => {
                  let dotColor = "bg-primary";
                  let icon = "info";

                  if (act.type === "order") {
                    dotColor = "bg-orange-500";
                    icon = "shopping_bag";
                  } else if (act.type === "application") {
                    dotColor = "bg-indigo-500";
                    icon = "storefront";
                  } else if (act.type === "review") {
                    dotColor = act.message.includes("approved") ? "bg-emerald-500" : "bg-rose-500";
                    icon = act.message.includes("approved") ? "check_circle" : "cancel";
                  }

                  return (
                    <div key={act.id} className="flex gap-md group items-start">
                      <div className="relative flex flex-col items-center shrink-0 mt-1">
                        <div className={`w-8 h-8 rounded-xl ${dotColor}/10 text-slate-700 flex items-center justify-center border border-white shadow-sm`}>
                          <span className={`material-symbols-outlined text-[16px] ${dotColor.replace("bg-", "text-")}`}>
                            {icon}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 bg-slate-50/50 hover:bg-slate-50 border border-slate-100/50 rounded-2xl p-3.5 transition-colors">
                        <p className="text-xs text-slate-700 font-semibold leading-relaxed break-words">
                          {act.message}
                        </p>
                        <span className="text-[10px] text-slate-400 font-bold block mt-1">
                          {new Date(act.timestamp).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
