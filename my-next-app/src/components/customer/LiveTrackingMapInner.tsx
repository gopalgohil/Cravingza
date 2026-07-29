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

/**
 * Helper to resolve coordinates:
 * 1. Uses explicit lat/lng if provided (> 0)
 * 2. Fallbacks to a deterministic coordinate generated from address text so every distinct address
 *    gets its own unique location marker on the map!
 */
function resolveCoords(
  lat?: number,
  lng?: number,
  addressStr?: string,
  baseLat: number = 22.3072,
  baseLng: number = 73.1812
): [number, number] {
  if (lat && lng && (lat !== 0 || lng !== 0)) {
    return [lat, lng];
  }

  if (!addressStr || addressStr === "Customer Address" || addressStr === "Pickup Location") {
    return [baseLat, baseLng];
  }

  // Create hash from address string to derive unique offsets
  let hash = 0;
  for (let i = 0; i < addressStr.length; i++) {
    hash = (hash << 5) - hash + addressStr.charCodeAt(i);
    hash |= 0;
  }

  const latOffset = ((Math.abs(hash) % 400) - 200) / 10000; // ±0.02 deg (~1-3 km)
  const lngOffset = ((Math.abs(hash * 31) % 400) - 200) / 10000;

  return [baseLat + latOffset, baseLng + lngOffset];
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
const createCustomIcon = (type: "store" | "home") => {
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
  restaurantLat,
  restaurantLng,
  customerLat,
  customerLng,
}: LiveTrackingMapInnerProps) {
  const storePos: [number, number] = resolveCoords(
    restaurantLat,
    restaurantLng,
    restaurantName + restaurantAddress,
    22.3072,
    73.1812
  );
  const customerPos: [number, number] = resolveCoords(
    customerLat,
    customerLng,
    deliveryAddress,
    22.3275,
    73.155
  );

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
