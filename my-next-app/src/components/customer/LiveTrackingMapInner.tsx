"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { getUIStageInfo } from "@/lib/utils/orderStatus";

interface LiveTrackingMapInnerProps {
  status: string;
  restaurantName?: string;
  deliveryAddress?: string;
  restaurantLat?: number;
  restaurantLng?: number;
  customerLat?: number;
  customerLng?: number;
}

// FUTURE ENHANCEMENT NOTE:
// True live-moving GPS tracking requires delivery partner's mobile device to periodically send
// real geolocation via browser Geolocation API (POST /api/delivery/active/:deliveryId/location),
// storing { lat, lng, updatedAt } on the Delivery document, which this tracking page could then poll.
// Currently, we render an honest static map showing pickup & drop locations and route line.

// Function to auto-center and fit map bounds to markers
function MapBoundsFitter({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
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
  deliveryAddress = "Customer Address",
  restaurantLat = 22.3072,
  restaurantLng = 73.1812,
  customerLat = 22.3175,
  customerLng = 73.155,
}: LiveTrackingMapInnerProps) {
  const storePos: [number, number] = [restaurantLat || 22.3072, restaurantLng || 73.1812];
  const customerPos: [number, number] = [customerLat || 22.3175, customerLng || 73.155];

  const mapBounds: L.LatLngBoundsExpression = [storePos, customerPos];
  const routePolyline: [number, number][] = [storePos, customerPos];

  const stageInfo = getUIStageInfo(status);

  return (
    <div className="relative w-full h-[380px] rounded-3xl overflow-hidden shadow-md border border-slate-200 z-10">
      <MapContainer
        center={storePos}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsFitter bounds={mapBounds} />

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
            <div className="p-1 text-center font-sans">
              <strong className="text-slate-900 block text-xs">{restaurantName}</strong>
              <span className="text-[10px] text-slate-500">Pickup Location</span>
            </div>
          </Popup>
        </Marker>

        {/* Customer Marker (Drop) */}
        <Marker position={customerPos} icon={createCustomIcon("home")}>
          <Popup>
            <div className="p-1 text-center font-sans">
              <strong className="text-slate-900 block text-xs">Delivery Address</strong>
              <span className="text-[10px] text-slate-500">{deliveryAddress}</span>
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
