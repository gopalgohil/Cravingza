"use client";

import React from "react";
import Link from "next/link";
import { Star, Clock } from "lucide-react";

export interface RestaurantData {
  _id: string;
  name: string;
  image: string;
  rating: number;
  cuisineTags?: string[];
  cuisine?: string;
  deliveryTime: string;
  deliveryFee: number;
}

export interface RestaurantCardProps {
  restaurant: RestaurantData;
  onClick?: () => void;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onClick }) => {
  const cuisineText = restaurant.cuisineTags?.join(", ") || restaurant.cuisine || "Multi-Cuisine";

  return (
    <div
      onClick={onClick}
      className="bg-surface rounded-xl overflow-hidden app-shadow hover:app-shadow-hover transition-all cursor-pointer group flex flex-col h-full border border-outline-variant/30"
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          alt={restaurant.name}
          src={restaurant.image}
        />
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm border border-slate-100">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="font-label-md text-xs font-bold text-slate-800">
            {restaurant.rating ? restaurant.rating.toFixed(1) : "NEW"}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-2 bg-white">
        <div>
          <h3 className="font-bold text-base text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
            {restaurant.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
            {cuisineText}
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-2 text-xs text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            {restaurant.deliveryTime} • {restaurant.deliveryFee === 0 ? "Free delivery" : `₹${Math.round(restaurant.deliveryFee)} delivery`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
