"use client";

import dynamic from "next/dynamic";

const LiveTrackingMapInner = dynamic(
  () => import("./LiveTrackingMapInner"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[380px] rounded-3xl bg-slate-100 border border-slate-200 animate-pulse flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-4xl text-primary animate-bounce">map</span>
        <p className="text-xs font-bold text-slate-500">Loading Delivery Route Map...</p>
      </div>
    ),
  }
);

interface LiveTrackingMapProps {
  status: string;
  restaurantName?: string;
  restaurantAddress?: string;
  deliveryAddress?: string;
  restaurantLat?: number;
  restaurantLng?: number;
  customerLat?: number;
  customerLng?: number;
}

export default function LiveTrackingMap(props: LiveTrackingMapProps) {
  return <LiveTrackingMapInner {...props} />;
}
