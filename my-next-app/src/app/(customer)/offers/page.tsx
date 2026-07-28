"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGetOffersQuery } from "@/lib/redux/apiSlice";
import {
  Tag,
  Gift,
  Copy,
  Check,
  ArrowRight,
  Clock,
  Sparkles,
  CreditCard,
  Truck,
  Percent,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

const CouponSkeleton = () => (
  <div className="bg-white border border-outline-variant/30 rounded-3xl p-6 space-y-4 shadow-sm animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-6 bg-slate-100 rounded-full w-24"></div>
      <div className="h-5 bg-slate-100 rounded-lg w-16"></div>
    </div>
    <div className="space-y-2">
      <div className="h-6 bg-slate-100 rounded-lg w-3/4"></div>
      <div className="h-4 bg-slate-100 rounded-lg w-full"></div>
    </div>
    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
      <div className="h-4 bg-slate-100 rounded w-28"></div>
      <div className="h-10 bg-slate-100 rounded-2xl w-28"></div>
    </div>
  </div>
);

export default function OffersPage() {
  const router = useRouter();
  const { data: response, isLoading, error } = useGetOffersQuery();
  const coupons = response?.data || [];

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code "${code}" copied to clipboard!`, {
      description: "Paste it at checkout to get instant discount.",
    });

    setTimeout(() => {
      setCopiedCode(null);
    }, 3000);
  };

  const filteredCoupons = useMemo(() => {
    if (activeCategory === "all") return coupons;
    return coupons.filter((c: any) => c.category === activeCategory);
  }, [coupons, activeCategory]);

  const categories = [
    { id: "all", label: "All Offers", icon: Sparkles },
    { id: "flat", label: "Flat Discounts", icon: Percent },
    { id: "payment", label: "UPI & Bank Deals", icon: CreditCard },
    { id: "delivery", label: "Free Delivery", icon: Truck },
  ];

  return (
    <div className="max-w-max-width mx-auto py-6 space-y-lg px-4 md:px-0">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-primary to-amber-600 p-8 md:p-12 text-white shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold uppercase tracking-wider text-white">
            <Gift className="w-4 h-4 animate-bounce" />
            <span>Super Saver Festival</span>
          </div>
          <h1 className="font-headline-md text-3xl md:text-5xl font-black leading-tight tracking-tight">
            Delicious Food, Unbeatable Discounts!
          </h1>
          <p className="text-white/90 text-sm md:text-base leading-relaxed">
            Save big on every craving. Use promo codes at checkout for instant price cuts, free delivery, and cashbacks.
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs md:text-sm whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-2 border ${
                isActive
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105"
                  : "bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-primary"}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <CouponSkeleton key={n} />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-3xl text-center space-y-2">
          <p className="font-bold">Failed to load active offers.</p>
          <p className="text-xs">Please refresh or try again later.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredCoupons.length === 0 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-orange-50 text-primary rounded-full flex items-center justify-center mx-auto">
            <Tag className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-xl text-slate-900">No coupons in this category</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Check back soon or explore our restaurants for auto-applied food deals!
          </p>
        </div>
      )}

      {/* Coupon Cards Grid */}
      {!isLoading && !error && filteredCoupons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCoupons.map((coupon: any) => (
            <div
              key={coupon._id || coupon.code}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-6 relative overflow-hidden group"
            >
              {/* Top Banner Accent */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${coupon.bgGradient || "from-primary to-orange-500"}`}></div>

              {/* Coupon Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black text-white bg-gradient-to-r ${coupon.bgGradient || "from-primary to-orange-500"} shadow-2xs`}>
                    {coupon.badgeText || "SPECIAL OFFER"}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Expires soon</span>
                  </div>
                </div>

                <h3 className="font-headline-sm text-xl font-extrabold text-slate-900 leading-snug">
                  {coupon.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {coupon.description}
                </p>
              </div>

              {/* Bottom Actions & Code Copy */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Promo Code</span>
                  <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80">
                    <span className="font-mono font-black text-slate-900 tracking-wider text-sm">
                      {coupon.code}
                    </span>
                    <button
                      onClick={() => handleCopyCode(coupon.code)}
                      className="text-primary hover:text-primary/80 transition-colors p-1 cursor-pointer"
                      title="Copy Code"
                    >
                      {copiedCode === coupon.code ? (
                        <Check className="w-4 h-4 text-emerald-600 animate-in zoom-in" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs md:text-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>Apply Deal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
