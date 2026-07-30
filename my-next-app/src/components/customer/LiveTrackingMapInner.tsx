"use client";

import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { getUIStageInfo } from "@/lib/utils/orderStatus";

interface LiveTrackingMapInnerProps {
  status: string;
  restaurantName?: string;
  restaurantAddress?: string;
  deliveryAddress?: string;
  restaurantLat?: number;
  restaurantLng?: number;
  customerLat?: number;
  customerLng?: number;
}

// Function to auto-center and fit map bounds ONLY once on initial render
// Prevents auto-resetting user's manual zoom during 5-second polling updates
function MapBoundsFitter({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (bounds && !hasFittedRef.current) {
      map.fitBounds(bounds, { padding: [50, 50] });
      hasFittedRef.current = true;
    }
  }, [bounds, map]);

  return null;
}

// Floating control button allowing user to manually re-center map anytime
function RecenterControl({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  return (
    <button
      type="button"
      onClick={() => map.fitBounds(bounds, { padding: [50, 50] })}
      className="absolute top-3 right-3 bg-white/95 hover:bg-white text-slate-800 font-bold px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs flex items-center gap-1.5 z-[400] transition-all cursor-pointer hover:scale-105 active:scale-95 select-none"
      title="Recenter Map to Fit Route"
    >
      <span className="material-symbols-outlined text-primary text-base">center_focus_strong</span>
      <span>Recenter</span>
    </button>
  );
}

// Custom Leaflet Icons using SVG DivIcons
const createCustomIcon = (type: "store" | "home" | "rider") => {
  if (type === "store") {
    return L.divIcon({
      className: "custom-leaflet-icon",
      html: `
        <div style="background: #b52603; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(181, 38, 3, 0.4); text-align: center;">
          <span class="material-symbols-outlined" style="font-size: 20px; vertical-align: middle;">storefront</span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }

  if (type === "rider") {
    return L.divIcon({
      className: "custom-leaflet-icon",
      html: `
        <div style="background: linear-gradient(135deg, #ea580c, #b52603); color: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 6px 16px rgba(234, 88, 12, 0.5); text-align: center; position: relative; animation: pulse 2s infinite;">
          <span class="material-symbols-outlined" style="font-size: 22px; vertical-align: middle; transform: scaleX(-1);">two_wheeler</span>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });
  }

  // Home / Drop Icon
  return L.divIcon({
    className: "custom-leaflet-icon",
    html: `
      <div style="background: #006d37; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(0, 109, 55, 0.4); text-align: center;">
        <span class="material-symbols-outlined" style="font-size: 20px; vertical-align: middle;">home</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export default function LiveTrackingMapInner({
  status,
  restaurantName = "Restaurant",
  restaurantAddress = "",
  deliveryAddress = "Customer Address",
  restaurantLat = 22.3072,
  restaurantLng = 73.1812,
  customerLat = 22.3175,
  customerLng = 73.155,
  riderLat,
  riderLng,
  riderName = "Delivery Partner",
}: LiveTrackingMapInnerProps) {
  const storePos: [number, number] = [restaurantLat || 22.3072, restaurantLng || 73.1812];
  const customerPos: [number, number] = [customerLat || 22.3175, customerLng || 73.155];

  // Rider position calculation (always offset along route so Store 🏪, Rider 🛵, and Customer 🏠 are all 3 visible)
  let riderPos: [number, number] | null = null;
  if (riderLat && riderLng) {
    riderPos = [riderLat, riderLng];
  } else if (status === "out_for_delivery") {
    // Rider is en-route (~50% midway between store & customer)
    riderPos = [
      storePos[0] + (customerPos[0] - storePos[0]) * 0.5,
      storePos[1] + (customerPos[1] - storePos[1]) * 0.5,
    ];
  } else if (status === "delivered") {
    // Rider near customer (88% towards customer)
    riderPos = [
      storePos[0] + (customerPos[0] - storePos[0]) * 0.88,
      storePos[1] + (customerPos[1] - storePos[1]) * 0.88,
    ];
  } else {
    // Preparing / Placed: Rider near restaurant waiting for pickup (20% from store)
    riderPos = [
      storePos[0] + (customerPos[0] - storePos[0]) * 0.2,
      storePos[1] + (customerPos[1] - storePos[1]) * 0.2,
    ];
  }

  const mapBounds: L.LatLngBoundsExpression = [storePos, customerPos];
  const routePolyline: [number, number][] = [storePos, customerPos];

  const stageInfo = getUIStageInfo(status);

  return (
    <div className="relative w-full h-[380px] rounded-3xl overflow-hidden shadow-md border border-slate-200 z-10">
      <MapContainer
        center={storePos}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsFitter bounds={mapBounds} />
        <RecenterControl bounds={mapBounds} />

        {/* Straight Route Line between Store and Customer */}
        <Polyline
          positions={routePolyline}
          color="#b52603"
          weight={4}
          opacity={0.7}
          dashArray="8, 12"
        />

        {/* Store Marker (Pickup) */}
        <Marker position={storePos} icon={createCustomIcon("store")}>
          <Popup>
            <div className="p-1 text-center font-sans max-w-[200px]">
              <strong className="text-slate-900 block text-xs font-bold">{restaurantName}</strong>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5 leading-tight">
                {restaurantAddress || "Pickup Location"}
              </span>
            </div>
          </Popup>
        </Marker>

        {/* Customer Marker (Drop) */}
        <Marker position={customerPos} icon={createCustomIcon("home")}>
          <Popup>
            <div className="p-1 text-center font-sans max-w-[200px]">
              <strong className="text-slate-900 block text-xs font-bold">Delivery Address</strong>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5 leading-tight">
                {deliveryAddress}
              </span>
            </div>
          </Popup>
        </Marker>

        {/* Delivery Rider Marker (Scooter 🛵) */}
        {riderPos && (
          <Marker position={riderPos} icon={createCustomIcon("rider")} zIndexOffset={1000}>
            <Popup>
              <div className="p-1 text-center font-sans max-w-[210px]">
                <strong className="text-slate-900 text-xs font-bold flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-orange-600 text-sm">two_wheeler</span>
                  {riderName}
                </strong>
                <span className="text-[10px] text-slate-600 font-medium block mt-1 leading-tight bg-orange-50 p-1 rounded border border-orange-100">
                  {status === "out_for_delivery"
                    ? "🛵 On the way to deliver your order!"
                    : status === "delivered"
                    ? "✅ Arrived & Order Delivered"
                    : "⏳ Waiting at restaurant for pickup"}
                </span>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Honest Status Overlay Badge */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-slate-200/80 flex items-center justify-between z-[400]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-md shrink-0">
            <span className="material-symbols-outlined text-xl">map</span>
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-900 leading-none">
              {stageInfo.statusDescription}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Pickup & Drop Locations Route Map
            </p>
          </div>
        </div>

        <span className="text-xs font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap">
          Delivery Route
        </span>
      </div>
    </div>
  );
}
