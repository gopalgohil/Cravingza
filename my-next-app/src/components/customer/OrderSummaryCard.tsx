"use client";

import React from "react";
import { ShoppingBag, Store, MapPin, Receipt, CheckCircle, RotateCcw } from "lucide-react";

export interface OrderItem {
  _id?: string;
  name: string;
  price: number;
  quantity: number;
  isVeg?: boolean;
}

export interface OrderSummaryCardProps {
  order: {
    _id: string;
    items: OrderItem[];
    subtotal?: number;
    deliveryFee?: number;
    discountAmount?: number;
    taxesAndCharges?: number;
    totalAmount: number;
    restaurant?: {
      _id: string;
      name: string;
      image?: string;
    };
    deliveryAddress?: {
      addressLine: string;
      city?: string;
    };
    paymentMethod?: string;
    paymentStatus?: string;
  };
  onReorder?: () => void;
  isReordering?: boolean;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  order,
  onReorder,
  isReordering = false,
}) => {
  return (
    <div className="bg-surface border border-outline-variant p-lg rounded-2xl shadow-sm space-y-lg">
      <div className="flex items-center justify-between border-b border-outline-variant/30 pb-md">
        <div className="flex items-center gap-md">
          <div className="w-10 h-10 bg-primary-container text-on-primary rounded-xl flex items-center justify-center font-bold">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-on-background">{order.restaurant?.name || "Cravingza Partner"}</h3>
            <span className="text-caption text-on-surface-variant">Order Summary</span>
          </div>
        </div>
        {onReorder && (
          <button
            onClick={onReorder}
            disabled={isReordering}
            className="flex items-center gap-xs text-caption font-bold text-primary hover:bg-primary-container/20 px-md py-xs rounded-lg transition-colors cursor-pointer border border-primary/20"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isReordering ? "Reordering..." : "Reorder"}</span>
          </button>
        )}
      </div>

      {/* Items List */}
      <div className="space-y-sm">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-body-md py-xs border-b border-dashed border-outline-variant/20 last:border-0">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
              <span className="font-medium text-slate-800">{item.name}</span>
              <span className="text-caption text-slate-500 font-bold">x{item.quantity}</span>
            </div>
            <span className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Delivery Address */}
      {order.deliveryAddress && (
        <div className="bg-slate-50 p-md rounded-xl border border-slate-100 space-y-xs">
          <div className="flex items-center gap-xs text-caption font-bold text-slate-600">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Delivery Location</span>
          </div>
          <p className="text-body-sm text-slate-700 font-medium pl-5">
            {order.deliveryAddress.addressLine}{order.deliveryAddress.city ? `, ${order.deliveryAddress.city}` : ""}
          </p>
        </div>
      )}

      {/* Financial Breakdown */}
      <div className="space-y-xs pt-xs border-t border-outline-variant/30 text-body-sm">
        <div className="flex justify-between text-on-surface-variant">
          <span>Subtotal</span>
          <span>₹{(order.subtotal || order.totalAmount).toFixed(2)}</span>
        </div>
        {(order.deliveryFee ?? 0) > 0 && (
          <div className="flex justify-between text-on-surface-variant">
            <span>Delivery Fee</span>
            <span>₹{(order.deliveryFee || 0).toFixed(2)}</span>
          </div>
        )}
        {(order.discountAmount ?? 0) > 0 && (
          <div className="flex justify-between text-green-600 font-medium">
            <span>Discount Applied</span>
            <span>-₹{(order.discountAmount || 0).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-body-md font-bold text-on-background pt-sm border-t border-outline-variant/40">
          <span>Total Paid ({order.paymentMethod?.toUpperCase() || "COD"})</span>
          <span className="text-primary text-headline-sm">₹{order.totalAmount.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummaryCard;
