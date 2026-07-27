"use client";

import React, { useState } from "react";
import {
  useGetMerchantOffersQuery,
  useCreateMerchantOfferMutation,
  useDeleteMerchantOfferMutation,
} from "@/lib/redux/apiSlice";
import {
  Tag,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Percent,
  Clock,
  AlertCircle,
  X,
  Gift,
} from "lucide-react";
import { toast } from "sonner";

export default function RestaurantOwnerOffersPage() {
  const { data: response, isLoading, error } = useGetMerchantOffersQuery();
  const [createOffer, { isLoading: isCreating }] = useCreateMerchantOfferMutation();
  const [deleteOffer, { isLoading: isDeleting }] = useDeleteMerchantOfferMutation();

  const coupons = response?.data || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    discountType: "percentage",
    discountValue: 20,
    minOrderAmount: 199,
    maxDiscountAmount: 100,
    badgeText: "CHEF DEAL",
    bgGradient: "from-orange-500 to-amber-500",
    validDays: 30,
    category: "flat",
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.title || !formData.discountValue) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      await createOffer(formData).unwrap();
      toast.success(`Offer "${formData.code.toUpperCase()}" created successfully!`, {
        description: "It is now live for customers on the Offers page and Checkout.",
      });
      setIsModalOpen(false);
      setFormData({
        code: "",
        title: "",
        description: "",
        discountType: "percentage",
        discountValue: 20,
        minOrderAmount: 199,
        maxDiscountAmount: 100,
        badgeText: "CHEF DEAL",
        bgGradient: "from-orange-500 to-amber-500",
        validDays: 30,
        category: "flat",
      });
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create offer.");
    }
  };

  const handleDeleteOffer = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete offer "${code}"?`)) return;
    try {
      await deleteOffer(id).unwrap();
      toast.success(`Offer "${code}" deleted successfully.`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete offer.");
    }
  };

  const gradientOptions = [
    { label: "Warm Orange", value: "from-orange-500 to-amber-500" },
    { label: "Rose Red", value: "from-rose-500 to-red-600" },
    { label: "Emerald Green", value: "from-emerald-500 to-teal-600" },
    { label: "Indigo Blue", value: "from-indigo-600 to-blue-500" },
  ];

  return (
    <div className="space-y-lg max-w-6xl mx-auto p-4 md:p-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md bg-gradient-to-r from-primary/10 to-orange-500/10 p-lg rounded-3xl border border-outline-variant/30">
        <div className="space-y-xs">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Gift className="w-5 h-5 animate-pulse" />
            <span>Promotional Coupons & Deals</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-background font-extrabold">
            Offers Management Console
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Create restaurant promo codes, set minimum cart values, and boost your daily order volume.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3.5 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-2xl transition-all shadow-md shadow-primary/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Offer</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Deals</span>
            <Tag className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">{coupons.length}</h3>
          <p className="text-xs text-slate-500">Active campaigns live</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Flat Discounts</span>
            <Percent className="w-5 h-5 text-rose-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            {coupons.filter((c: any) => c.category === "flat").length}
          </h3>
          <p className="text-xs text-slate-500">Percentage & fixed price cuts</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Free Delivery</span>
            <Sparkles className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            {coupons.filter((c: any) => c.category === "delivery").length}
          </h3>
          <p className="text-xs text-slate-500">Zero shipping promos</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Online Payment</span>
            <Clock className="w-5 h-5 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            {coupons.filter((c: any) => c.category === "payment").length}
          </h3>
          <p className="text-xs text-slate-500">Razorpay specials</p>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 animate-pulse">
              <div className="h-6 bg-slate-100 rounded-full w-24"></div>
              <div className="h-6 bg-slate-100 rounded-lg w-3/4"></div>
              <div className="h-10 bg-slate-100 rounded-2xl w-full"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-3xl text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
          <p className="font-bold">Failed to load restaurant offers.</p>
          <p className="text-xs">Please refresh or check your internet connection.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && coupons.length === 0 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-orange-50 text-primary rounded-full flex items-center justify-center mx-auto">
            <Tag className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-xl text-slate-900">No active offers created</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Click <strong>"Create New Offer"</strong> above to launch your first promotional discount coupon!
          </p>
        </div>
      )}

      {/* Offers Cards Grid */}
      {!isLoading && !error && coupons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coupons.map((coupon: any) => (
            <div
              key={coupon._id || coupon.code}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-6 relative overflow-hidden group"
            >
              {/* Top Accent Line */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${coupon.bgGradient || "from-primary to-orange-500"}`}></div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black text-white bg-gradient-to-r ${coupon.bgGradient || "from-primary to-orange-500"} shadow-2xs`}>
                    {coupon.badgeText || "SPECIAL OFFER"}
                  </span>
                  <button
                    onClick={() => handleDeleteOffer(coupon._id, coupon.code)}
                    disabled={isDeleting}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-xl hover:bg-red-50 cursor-pointer"
                    title="Delete Offer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-headline-sm text-xl font-extrabold text-slate-900 leading-snug">
                  {coupon.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {coupon.description}
                </p>
                <div className="text-xs text-slate-500 space-y-1 pt-1">
                  <p>• Min Order: <strong>₹{coupon.minOrderAmount}</strong></p>
                  {coupon.maxDiscountAmount && (
                    <p>• Max Discount Cap: <strong>₹{coupon.maxDiscountAmount}</strong></p>
                  )}
                  <p>• Valid Till: <strong>{new Date(coupon.validTill).toLocaleDateString()}</strong></p>
                </div>
              </div>

              {/* Bottom Promo Code Row */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PROMO CODE</span>
                  <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80">
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {coupon.code}
                    </span>
                    <button
                      onClick={() => handleCopyCode(coupon.code)}
                      className="text-primary hover:text-primary/80 transition-colors p-1 cursor-pointer"
                    >
                      {copiedCode === coupon.code ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                  ● LIVE ON CUSTOMER SITE
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE OFFER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white max-w-lg w-full rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-6 relative overflow-hidden animate-scale-up">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h2 className="font-bold text-xl text-slate-900">Create New Promo Offer</h2>
              <p className="text-xs text-slate-500">Launch a discount coupon for your customers instantly.</p>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. CHEF30"
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl uppercase font-mono font-bold text-slate-900 outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Badge Tag *</label>
                  <input
                    type="text"
                    value={formData.badgeText}
                    onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                    placeholder="e.g. 30% OFF"
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Offer Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 30% OFF on Chef Specials"
                  required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-primary bg-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Value ({formData.discountType === "percentage" ? "%" : "₹"}) *
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    min="1"
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                    min="0"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })}
                    min="1"
                    placeholder="Leave empty if none"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Card Color Theme</label>
                <select
                  value={formData.bgGradient}
                  onChange={(e) => setFormData({ ...formData, bgGradient: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-primary bg-white"
                >
                  {gradientOptions.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? "Publishing..." : "Publish Offer Live"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
