"use client";

import React from "react";

// Individual skeleton shimmer block
function SkeletonBlock({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-surface-container ${className}`}
      style={style}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
          animation: "skeleton-shimmer 1.6s infinite",
        }}
      />
    </div>
  );
}

// Skeleton card for restaurant / menu items
function RestaurantCardSkeleton() {
  return (
    <div className="rounded-2xl bg-surface-container-low p-0 overflow-hidden shadow-sm">
      <SkeletonBlock className="h-44 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <SkeletonBlock className="h-5 w-3/4" />
        <SkeletonBlock className="h-4 w-1/2" />
        <div className="flex gap-2 pt-1">
          <SkeletonBlock className="h-6 w-16 rounded-full" />
          <SkeletonBlock className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Hero banner skeleton
function HeroSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden mb-8">
      <SkeletonBlock className="h-48 md:h-64 w-full rounded-2xl" />
    </div>
  );
}

// Category chips skeleton row
function CategoryRowSkeleton() {
  return (
    <div className="flex gap-3 mb-6 overflow-hidden">
      {Array.from({ length: 7 }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className="h-9 flex-shrink-0 rounded-full"
          style={{ width: `${60 + i * 8}px` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export default function PageLoader() {
  return (
    <>
      {/* Inject keyframe once */}
      <style>{`
        @keyframes skeleton-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      <div className="w-full animate-fade-in">
        {/* Hero */}
        <HeroSkeleton />

        {/* Section heading */}
        <div className="flex items-center justify-between mb-4">
          <SkeletonBlock className="h-7 w-40" />
          <SkeletonBlock className="h-5 w-20 rounded-full" />
        </div>

        {/* Category pills */}
        <CategoryRowSkeleton />

        {/* Grid of cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
