"use client";

import React, { useMemo } from "react";
import {
  useGetMerchantOrdersQuery,
  useGetMyMenuQuery,
} from "@/lib/redux/apiSlice";
import {
  TrendingUp,
  Award,
  CircleDollarSign,
  UtensilsCrossed,
  Percent,
  Calendar,
  AlertCircle,
  Truck,
  Pizza,
} from "lucide-react";

export default function RestaurantAnalyticsPage() {
  const { data: orders = [], isLoading: isOrdersLoading, error: ordersError } = useGetMerchantOrdersQuery();
  const { data: menuItems = [], isLoading: isMenuLoading } = useGetMyMenuQuery();

  const isLoading = isOrdersLoading || isMenuLoading;

  // Calculate business intelligence metrics
  const analyticsData = useMemo(() => {
    const deliveredOrders = orders.filter((o) => o.status === "delivered");
    
    // Revenue calculations
    const grossRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const subtotalRevenue = deliveredOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const deliveryFees = deliveredOrders.reduce((sum, o) => sum + o.deliveryFee, 0);
    const taxes = deliveredOrders.reduce((sum, o) => sum + o.taxes, 0);
    const avgOrderValue = deliveredOrders.length > 0 ? grossRevenue / deliveredOrders.length : 0;

    // Calculate top selling dishes
    const dishSales: Record<string, { count: number; revenue: number; isVeg?: boolean }> = {};
    deliveredOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!dishSales[item.name]) {
          // Find if it's veg in the menu items list
          const menuItem = menuItems.find((m) => m.name === item.name);
          dishSales[item.name] = {
            count: 0,
            revenue: 0,
            isVeg: menuItem ? menuItem.isVeg : true,
          };
        }
        dishSales[item.name].count += item.quantity;
        dishSales[item.name].revenue += item.price * item.quantity;
      });
    });

    const topDishes = Object.entries(dishSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    // Sales by Category
    const categorySales: Record<string, number> = {};
    deliveredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const menuItem = menuItems.find((m) => m.name === item.name);
        const cat = menuItem?.category || "Main Course";
        categorySales[cat] = (categorySales[cat] || 0) + item.price * item.quantity;
      });
    });

    // Veg vs Non Veg Sales
    let vegSales = 0;
    let nonVegSales = 0;
    Object.values(dishSales).forEach((dish) => {
      if (dish.isVeg) {
        vegSales += dish.revenue;
      } else {
        nonVegSales += dish.revenue;
      }
    });

    // Group sales by day of week for graph (last 7 days)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyRevenue = [0, 0, 0, 0, 0, 0, 0];
    
    deliveredOrders.forEach((order) => {
      const dayIndex = new Date(order.createdAt).getDay();
      weeklyRevenue[dayIndex] += order.totalAmount;
    });

    // Re-align weekly data starting from 6 days ago to today
    const graphData: { day: string; amount: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayIdx = d.getDay();
      graphData.push({
        day: dayNames[dayIdx],
        amount: Math.round(weeklyRevenue[dayIdx]),
      });
    }

    return {
      grossRevenue,
      subtotalRevenue,
      deliveryFees,
      taxes,
      avgOrderValue,
      topDishes,
      categorySales,
      vegSales,
      nonVegSales,
      graphData,
      completedOrdersCount: deliveredOrders.length,
    };
  }, [orders, menuItems]);

  // Determine highest sales point for graphing scale
  const maxGraphAmount = useMemo(() => {
    const max = Math.max(...analyticsData.graphData.map((d) => d.amount));
    return max > 0 ? max * 1.15 : 1000; // 15% padding
  }, [analyticsData.graphData]);

  // SVG Graph Coordinate Generation
  const svgPoints = useMemo(() => {
    const data = analyticsData.graphData;
    const width = 500;
    const height = 180;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const points = data.map((item, index) => {
      const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
      const y = maxGraphAmount > 0
        ? height - paddingBottom - (item.amount / maxGraphAmount) * chartHeight
        : height - paddingBottom;
      return { x, y, amount: item.amount, day: item.day };
    });

    const pathString = points.length > 0
      ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ")
      : "";

    // Closed path for fill gradient
    const fillString = points.length > 0
      ? `${pathString} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
      : "";

    return { points, pathString, fillString, height, width, paddingBottom, paddingLeft };
  }, [analyticsData.graphData, maxGraphAmount]);

  return (
    <div className="space-y-lg max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md bg-gradient-to-r from-orange-500/10 to-primary/10 p-lg rounded-3xl border border-outline-variant/30">
        <div className="space-y-xs">
          <div className="flex items-center gap-2 text-primary font-bold">
            <TrendingUp className="w-5 h-5 animate-pulse" />
            <span>Business Intelligence Portal</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-background font-extrabold">
            Performance & Analytics
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Analyze customer preferences, top-performing products, and weekly sales metrics.
          </p>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="space-y-lg animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-outline-variant/30 h-32 rounded-2xl"></div>
            ))}
          </div>
          <div className="bg-white border border-outline-variant/30 h-80 rounded-2xl"></div>
        </div>
      )}

      {ordersError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-md rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-body-md">Failed to load analytics data</h4>
            <p className="text-body-sm mt-1">Please try logging in again or refresh the page.</p>
          </div>
        </div>
      )}

      {!isLoading && !ordersError && (
        <>
          {/* Top Row: Business KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
            {/* KPI 1: Gross Sales */}
            <div className="bg-white p-md rounded-2xl border border-outline-variant/30 shadow-sm flex items-center justify-between">
              <div className="space-y-xs">
                <span className="font-label-md text-label-md text-on-surface-variant font-bold">
                  Gross Delivered Sales
                </span>
                <h2 className="font-headline-sm text-headline-sm font-black text-on-background">
                  ₹{analyticsData.grossRevenue.toLocaleString("en-IN")}
                </h2>
                <p className="text-caption text-on-surface-variant">
                  Total revenue including delivery fees & GST.
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center border border-orange-200/50">
                <CircleDollarSign className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 2: AOV */}
            <div className="bg-white p-md rounded-2xl border border-outline-variant/30 shadow-sm flex items-center justify-between">
              <div className="space-y-xs">
                <span className="font-label-md text-label-md text-on-surface-variant font-bold">
                  Avg. Order Value (AOV)
                </span>
                <h2 className="font-headline-sm text-headline-sm font-black text-on-background">
                  ₹{analyticsData.avgOrderValue.toFixed(0)}
                </h2>
                <p className="text-caption text-on-surface-variant">
                  Average spend per customer request.
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-200/50">
                <Percent className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 3: Order Counts */}
            <div className="bg-white p-md rounded-2xl border border-outline-variant/30 shadow-sm flex items-center justify-between">
              <div className="space-y-xs">
                <span className="font-label-md text-label-md text-on-surface-variant font-bold">
                  Completed Sales Volume
                </span>
                <h2 className="font-headline-sm text-headline-sm font-black text-on-background">
                  {analyticsData.completedOrdersCount} orders
                </h2>
                <p className="text-caption text-on-surface-variant">
                  Delivered orders processed successfully.
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center border border-green-200/50">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Second Row: Weekly Revenue Graph */}
          <div className="bg-white p-md md:p-lg border border-outline-variant/20 rounded-3xl shadow-sm space-y-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-body-lg text-on-background flex items-center gap-1.5">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>Weekly Revenue Curve</span>
                </h3>
                <p className="text-caption text-on-surface-variant">Daily sales performance over the past 7 days</p>
              </div>
              <span className="text-caption font-bold text-primary bg-primary/5 border border-primary/10 px-3 py-1 rounded-full">
                Live Data
              </span>
            </div>

            {/* Zero-Dependency SVG Graph */}
            <div className="relative w-full h-[200px]">
              {analyticsData.grossRevenue === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface-variant/40 space-y-xs">
                  <TrendingUp className="w-8 h-8 stroke-[1.5]" />
                  <span className="text-body-sm font-bold">No sales records to plot graph</span>
                </div>
              ) : (
                <svg
                  viewBox={`0 0 ${svgPoints.width} ${svgPoints.height}`}
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary, #E65100)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--primary, #E65100)" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = svgPoints.height - svgPoints.paddingBottom - ratio * (svgPoints.height - 20 - svgPoints.paddingBottom);
                    return (
                      <line
                        key={idx}
                        x1={svgPoints.paddingLeft}
                        y1={y}
                        x2={svgPoints.width - 20}
                        y2={y}
                        stroke="#F1F5F9"
                        strokeWidth="1.5"
                        strokeDasharray="4"
                      />
                    );
                  })}

                  {/* Gradient Area Fill */}
                  {svgPoints.fillString && (
                    <path d={svgPoints.fillString} fill="url(#chartGradient)" />
                  )}

                  {/* Trend line path */}
                  {svgPoints.pathString && (
                    <path
                      d={svgPoints.pathString}
                      fill="none"
                      stroke="var(--primary, #E65100)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Points on path */}
                  {svgPoints.points.map((p, idx) => (
                    <g key={idx}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="5"
                        fill="var(--primary, #E65100)"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        className="transition-all hover:scale-150 duration-200 cursor-pointer"
                      />
                      {/* Amount Labels */}
                      <text
                        x={p.x}
                        y={p.y - 12}
                        textAnchor="middle"
                        fill="#64748B"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        {p.amount > 0 ? `₹${p.amount}` : ""}
                      </text>
                      {/* Day Labels */}
                      <text
                        x={p.x}
                        y={svgPoints.height - 10}
                        textAnchor="middle"
                        fill="#94A3B8"
                        fontSize="10"
                        fontWeight="black"
                      >
                        {p.day}
                      </text>
                    </g>
                  ))}
                </svg>
              )}
            </div>
          </div>

          {/* Third Row: Top Selling Dishes & Category Splits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {/* Top Items Card */}
            <div className="bg-white p-md md:p-lg border border-outline-variant/20 rounded-3xl shadow-sm space-y-md">
              <h3 className="font-bold text-body-lg text-on-background flex items-center gap-1.5">
                <Pizza className="w-5 h-5 text-primary" />
                <span>Top Selling Dishes</span>
              </h3>
              <p className="text-caption text-on-surface-variant">Signature items customers order the most</p>

              {analyticsData.topDishes.length === 0 ? (
                <div className="py-10 text-center text-on-surface-variant/40 space-y-xs">
                  <UtensilsCrossed className="w-8 h-8 mx-auto" />
                  <p className="text-body-sm">No dishes sold yet.</p>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {analyticsData.topDishes.map((dish, index) => {
                    const maxCount = analyticsData.topDishes[0]?.count || 1;
                    const percentWidth = (dish.count / maxCount) * 100;
                    return (
                      <div key={dish.name} className="space-y-1">
                        <div className="flex justify-between items-center text-body-sm text-on-background">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-slate-100 rounded text-xs font-bold flex items-center justify-center text-slate-500">
                              {index + 1}
                            </span>
                            <span className="font-bold truncate max-w-[180px]">{dish.name}</span>
                            <span
                              className={`w-2 h-2 rounded-full ${dish.isVeg ? "bg-green-500" : "bg-red-500"}`}
                              title={dish.isVeg ? "Veg" : "Non-Veg"}
                            />
                          </div>
                          <span className="font-black">{dish.count} orders</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full"
                            style={{ width: `${percentWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* General Revenue breakdown */}
            <div className="bg-white p-md md:p-lg border border-outline-variant/20 rounded-3xl shadow-sm space-y-md flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-body-lg text-on-background flex items-center gap-1.5">
                  <CircleDollarSign className="w-5 h-5 text-primary" />
                  <span>Cost Components</span>
                </h3>
                <p className="text-caption text-on-surface-variant">Tax, logistics, and item sales split</p>
              </div>

              {analyticsData.grossRevenue === 0 ? (
                <div className="py-10 text-center text-on-surface-variant/40 space-y-xs flex-1 flex flex-col items-center justify-center">
                  <CircleDollarSign className="w-8 h-8" />
                  <p className="text-body-sm">No sales records.</p>
                </div>
              ) : (
                <div className="space-y-sm py-2">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-body-sm font-bold text-on-surface-variant">Food Subtotal</span>
                    <span className="font-black text-on-background">₹{analyticsData.subtotalRevenue.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-body-sm font-bold text-on-surface-variant flex items-center gap-1">
                      <Truck className="w-4 h-4 text-slate-400" />
                      <span>Delivery Fees Collected</span>
                    </span>
                    <span className="font-black text-on-background">₹{analyticsData.deliveryFees.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-body-sm font-bold text-on-surface-variant">GST & Taxes Collected</span>
                    <span className="font-black text-on-background">₹{analyticsData.taxes.toLocaleString("en-IN")}</span>
                  </div>

                  {/* Veg vs Non-Veg Sales split indicator */}
                  <div className="pt-2 space-y-1">
                    <span className="font-label-md text-label-md text-on-surface-variant font-bold block">
                      Sales Profile (Veg vs Non-Veg)
                    </span>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                      {analyticsData.vegSales === 0 && analyticsData.nonVegSales === 0 ? (
                        <div className="w-full bg-slate-200" />
                      ) : (
                        <>
                          <div
                            className="bg-green-500 h-full"
                            style={{
                              width: `${(analyticsData.vegSales / (analyticsData.vegSales + analyticsData.nonVegSales || 1)) * 100}%`,
                            }}
                            title={`Veg Sales: ₹${analyticsData.vegSales}`}
                          />
                          <div
                            className="bg-red-500 h-full"
                            style={{
                              width: `${(analyticsData.nonVegSales / (analyticsData.vegSales + analyticsData.nonVegSales || 1)) * 100}%`,
                            }}
                            title={`Non-Veg Sales: ₹${analyticsData.nonVegSales}`}
                          />
                        </>
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-on-surface-variant/80">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Veg: ₹{analyticsData.vegSales.toFixed(0)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span>Non-Veg: ₹{analyticsData.nonVegSales.toFixed(0)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
