"use client";

import React, { useState, useMemo } from "react";
import { useGetMerchantReviewsQuery } from "@/lib/redux/apiSlice";
import {
  Star,
  MessageSquare,
  Search,
  AlertCircle,
  ThumbsUp,
  User,
  ShoppingBag,
  Calendar,
  Frown,
} from "lucide-react";

export default function RestaurantReviewsPage() {
  const { data: response, isLoading, isError, refetch } = useGetMerchantReviewsQuery();

  const reviews = response?.data || [];

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<string>("all"); // "all", "5", "4", "3", "2", "1", "comments"

  // Compute Metrics
  const stats = useMemo(() => {
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        recommendRate: 0,
      };
    }

    const total = reviews.length;
    const sum = reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
    const avg = sum / total;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let positiveReviews = 0;

    reviews.forEach((r: any) => {
      const roundedRating = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
      if (distribution[roundedRating] !== undefined) {
        distribution[roundedRating]++;
      }
      if (r.rating >= 4) {
        positiveReviews++;
      }
    });

    const recommend = (positiveReviews / total) * 100;

    return {
      averageRating: Math.round(avg * 10) / 10,
      totalReviews: total,
      distribution,
      recommendRate: Math.round(recommend),
    };
  }, [reviews]);

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((review: any) => {
      // 1. Search Query Match
      const comment = review.comment || "";
      const customerName = review.customer?.name || "Customer";
      const itemsString = review.order?.items
        ?.map((item: any) => item.name)
        .join(" ") || "";

      const query = searchQuery.toLowerCase();
      const matchesSearch =
        comment.toLowerCase().includes(query) ||
        customerName.toLowerCase().includes(query) ||
        itemsString.toLowerCase().includes(query);

      // 2. Rating Filter Match
      let matchesFilter = true;
      if (selectedRatingFilter === "comments") {
        matchesFilter = !!review.comment?.trim();
      } else if (selectedRatingFilter !== "all") {
        matchesFilter = review.rating === parseInt(selectedRatingFilter, 10);
      }

      return matchesSearch && matchesFilter;
    });
  }, [reviews, searchQuery, selectedRatingFilter]);

  const renderStars = (rating: number, size = 16) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= rating;
          return (
            <Star
              key={star}
              size={size}
              className={`${
                isFilled ? "fill-amber-400 text-amber-400" : "text-slate-200"
              }`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-lg w-full p-4 md:p-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary to-orange-600 text-white p-lg rounded-3xl shadow-xl shadow-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="relative space-y-xs">
          <div className="flex items-center gap-2 font-bold text-orange-200">
            <Star className="w-5 h-5 fill-orange-200 text-orange-200" />
            <span>Customer Feedback Center</span>
          </div>
          <h1 className="font-headline-md text-headline-md font-extrabold tracking-tight">
            Reviews & Ratings
          </h1>
          <p className="font-body-md text-body-md text-white/95 max-w-xl">
            Read direct customer feedback, track ratings metrics, and improve your culinary experience.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-md">
          {/* Skeleton Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-outline-variant/30 h-36 rounded-2xl"></div>
            ))}
          </div>
          {/* Skeleton Feed */}
          <div className="bg-white border border-outline-variant/30 h-64 rounded-2xl animate-pulse"></div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-md rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-body-md">Failed to load reviews</h4>
            <p className="text-body-sm mt-1">Please try again or contact support.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !isError && (
        <>
          {reviews.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-outline-variant/30 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-md shadow-sm">
              <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-100 shadow-inner">
                <MessageSquare className="w-10 h-10" />
              </div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
                No reviews yet
              </h2>
              <p className="font-body-md text-on-surface-variant leading-relaxed text-sm">
                When customer ratings and reviews start rolling in for your restaurant, they will appear here. Encourage your clients to leave feedback!
              </p>
            </div>
          ) : (
            <div className="space-y-lg">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                {/* Average Rating Score Card */}
                <div className="bg-white p-lg rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col justify-between items-center text-center">
                  <span className="font-label-md text-label-md text-on-surface-variant font-bold">
                    Average Rating
                  </span>
                  <div className="my-md">
                    <h2 className="text-6xl font-black text-on-background tracking-tighter">
                      {stats.averageRating}
                    </h2>
                    <div className="flex justify-center mt-2">
                      {renderStars(stats.averageRating, 22)}
                    </div>
                  </div>
                  <span className="text-caption text-on-surface-variant">
                    Based on {stats.totalReviews} customer {stats.totalReviews === 1 ? "review" : "reviews"}
                  </span>
                </div>

                {/* Rating Distribution Card */}
                <div className="bg-white p-lg rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col justify-center gap-2">
                  <span className="font-label-md text-label-md text-on-surface-variant font-bold mb-1">
                    Rating Distribution
                  </span>
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = (stats.distribution as any)[stars] || 0;
                    const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3 text-body-sm">
                        <span className="w-3 font-bold text-slate-600">{stars}</span>
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-black text-slate-500">{count}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Recommendation Score Card */}
                <div className="bg-white p-lg rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col justify-between items-center text-center">
                  <span className="font-label-md text-label-md text-on-surface-variant font-bold">
                    Customer Satisfaction
                  </span>
                  <div className="my-md relative flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full border-[6px] border-emerald-500/10 flex items-center justify-center relative">
                      <div className="absolute inset-0 rounded-full border-[6px] border-emerald-500 border-t-transparent animate-pulse" />
                      <ThumbsUp className="w-8 h-8 text-emerald-500 fill-emerald-500/10" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-emerald-600 text-lg">
                      {stats.recommendRate}% Recommended
                    </h3>
                    <p className="text-caption text-on-surface-variant">
                      Rated 4★ or 5★ stars by customers
                    </p>
                  </div>
                </div>
              </div>

              {/* Filtering and Search Area */}
              <div className="bg-white p-md rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search input */}
                <div className="relative w-full md:w-80">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-all"
                    placeholder="Search reviews or dishes..."
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end overflow-x-auto pb-1 md:pb-0">
                  {[
                    { key: "all", label: "All Reviews" },
                    { key: "5", label: "5★ Only" },
                    { key: "4", label: "4★ Only" },
                    { key: "3", label: "3★" },
                    { key: "2", label: "2★" },
                    { key: "1", label: "1★" },
                    { key: "comments", label: "With Comments" },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setSelectedRatingFilter(filter.key)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap cursor-pointer select-none ${
                        selectedRatingFilter === filter.key
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <p className="text-body-sm text-slate-500 font-bold">
                    Showing {filteredReviews.length} of {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                  </p>
                </div>

                {filteredReviews.length === 0 ? (
                  <div className="bg-white border border-outline-variant/20 rounded-2xl p-12 text-center text-slate-400 space-y-2">
                    <Frown className="w-10 h-10 mx-auto" />
                    <p className="font-bold text-sm">No reviews match your filter criteria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-md">
                    {filteredReviews.map((review: any) => {
                      const dateStr = new Date(review.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      });

                      const userInitials = (review.customer?.name || "Customer")
                        .substring(0, 2)
                        .toUpperCase();

                      return (
                        <article
                          key={review._id}
                          className="bg-white rounded-3xl p-lg border border-outline-variant/20 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col md:flex-row gap-lg"
                        >
                          {/* User Avatar */}
                          <div className="flex items-center md:items-start gap-md shrink-0">
                            {review.customer?.image ? (
                              <img
                                src={review.customer.image}
                                alt={review.customer.name}
                                className="w-12 h-12 rounded-full object-cover border border-slate-100 shadow-sm"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-orange-100 text-primary font-bold flex items-center justify-center border border-orange-200/50 shadow-sm">
                                {userInitials}
                              </div>
                            )}

                            {/* Mobile User Metadata */}
                            <div className="md:hidden">
                              <h4 className="font-bold text-on-surface text-sm">
                                {review.customer?.name || "Anonymous Customer"}
                              </h4>
                              <p className="text-caption text-slate-400 flex items-center gap-1 mt-0.5">
                                <Calendar size={12} />
                                <span>{dateStr}</span>
                              </p>
                            </div>
                          </div>

                          {/* Review Details */}
                          <div className="flex-1 flex flex-col justify-between space-y-md">
                            <div>
                              {/* Desktop User Metadata */}
                              <div className="hidden md:flex justify-between items-start gap-4 mb-2">
                                <div>
                                  <h4 className="font-bold text-on-surface">
                                    {review.customer?.name || "Anonymous Customer"}
                                  </h4>
                                  <p className="text-caption text-slate-400 flex items-center gap-1 mt-0.5 text-xs">
                                    <Calendar size={12} />
                                    <span>{dateStr}</span>
                                  </p>
                                </div>
                                <div className="text-right">
                                  {renderStars(review.rating, 18)}
                                </div>
                              </div>

                              {/* Mobile Star Rating (placed here for better layout) */}
                              <div className="md:hidden flex items-center mb-1">
                                {renderStars(review.rating, 18)}
                              </div>

                              {/* Comment Text */}
                              <p className="font-body-md text-slate-700 text-sm leading-relaxed mt-2 p-md bg-slate-50 rounded-2xl border border-slate-100/50 italic">
                                {review.comment?.trim() ? (
                                  `"${review.comment}"`
                                ) : (
                                  <span className="text-slate-400 font-normal">Customer rated order without comments.</span>
                                )}
                              </p>
                            </div>

                            {/* Order Details Accordion Banner */}
                            {review.order && (
                              <div className="flex flex-wrap items-center justify-between gap-4 p-md bg-slate-50/50 rounded-2xl border border-slate-100 text-xs">
                                <div className="flex items-center gap-2 text-slate-600 font-medium">
                                  <ShoppingBag size={14} className="text-primary" />
                                  <span>
                                    {review.order.items
                                      ?.map((item: any) => `${item.quantity}x ${item.name}`)
                                      .join(", ")}
                                  </span>
                                </div>
                                <span className="font-black text-primary bg-primary/5 px-3 py-1 rounded-full">
                                  ₹{review.order.totalAmount?.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
