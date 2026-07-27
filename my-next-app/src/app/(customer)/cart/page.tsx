"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import {
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} from "@/lib/redux/apiSlice";
import { useAppStore } from "@/lib/store";
import QuantityStepper from "@/components/customer/QuantityStepper";
import { toast } from "sonner";

import CartLoading from "./loading";

export default function CartPage() {
  const router = useRouter();
  
  const { user, authChecked } = useAppStore();
  const cart = useSelector((state: RootState) => state.cart);
  
  const [updateCartItem, { isLoading: isUpdating }] = useUpdateCartItemMutation();
  const [removeCartItem, { isLoading: isRemoving }] = useRemoveCartItemMutation();
  const [clearCart, { isLoading: isClearing }] = useClearCartMutation();

  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [isNavigating, setIsNavigating] = useState(true);

  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (authChecked && !user) {
      router.push("/login");
    }
  }, [authChecked, user, router]);

  if (!authChecked || !user || isNavigating) {
    return <CartLoading />;
  }

  const restaurant = cart.restaurant;
  const cartItems = cart.items;

  // Pricing calculations
  const subtotal = cart.subtotal || 0;
  const deliveryFee = restaurant?.deliveryFee || 0;
  const serviceFee = subtotal > 0 ? 1.99 : 0;
  const discountAmount = subtotal * (discountPercent / 100);
  const taxAmount = (subtotal - discountAmount) * 0.08; // 8% tax
  const total = subtotal - discountAmount + deliveryFee + serviceFee + taxAmount;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === "CRAVING10") {
      setDiscountPercent(10);
      setPromoApplied(true);
      toast.success("Promo code applied! 10% discount on subtotal.");
    } else {
      toast.error("Invalid promo code. Try 'CRAVING10'");
    }
  };

  const handleRemovePromo = () => {
    setDiscountPercent(0);
    setPromoApplied(false);
    setPromoCode("");
    toast.info("Promo code removed.");
  };

  const handleIncrease = async (item: any) => {
    try {
      await updateCartItem({ menuItemId: item.id, quantity: item.quantity + 1 }).unwrap();
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to update quantity");
    }
  };

  const handleDecrease = async (item: any) => {
    try {
      if (item.quantity === 1) {
        await removeCartItem(item.id).unwrap();
        toast.success(`${item.name} removed from cart`);
      } else {
        await updateCartItem({ menuItemId: item.id, quantity: item.quantity - 1 }).unwrap();
      }
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to update quantity");
    }
  };

  const handleRemove = async (item: any) => {
    try {
      await removeCartItem(item.id).unwrap();
      toast.success(`Removed ${item.name} from cart`);
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to remove item");
    }
  };

  const handleClear = async () => {
    try {
      await clearCart().unwrap();
      toast.success("Cart cleared");
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to clear cart");
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-surface-container text-outline-variant mb-2">
          <span className="material-symbols-outlined text-5xl">shopping_cart_off</span>
        </div>
        <h2 className="font-headline-md text-headline-md text-on-background">Your Cart is Empty</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mx-auto">
          Add fresh, delicious dishes from your favorite local restaurants to satisfy your cravings.
        </p>
        <div className="pt-md">
          <button
            onClick={() => router.push("/home")}
            className="bg-primary text-white font-label-md text-label-md px-xl py-3 rounded-xl active:scale-95 transition-all hover:bg-primary/95 cursor-pointer shadow-sm"
          >
            Explore Restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-max-width mx-auto py-6 space-y-lg">
      {/* Title Header */}
      <div>
        <h1 className="font-headline-md text-headline-md text-on-background font-bold">Your Cart</h1>
        {restaurant && (
          <p className="font-body-md text-on-surface-variant flex items-center gap-1 mt-1">
            Ordering from{" "}
            <Link
              href={`/restaurants/${restaurant._id}`}
              className="text-primary font-bold hover:underline"
            >
              {restaurant.name}
            </Link>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl items-start">
        {/* Left Side: Items List */}
        <div className="lg:col-span-2 space-y-md">
          <div className="bg-surface rounded-2xl border border-outline-variant divide-y divide-outline-variant/60 shadow-sm overflow-hidden">
            {cartItems.map((item) => (
              <div key={item.id} className="p-lg flex gap-md items-center">
                {/* Item Image */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-surface-container flex-shrink-0">
                  <img
                    src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400";
                    }}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <span className="font-headline-sm text-headline-sm font-semibold text-on-surface block truncate">
                    {item.name}
                  </span>
                  <span className="font-body-md text-body-md text-on-surface-variant block mt-0.5">
                    ₹{item.price.toFixed(2)} each
                  </span>
                </div>

                {/* Stepper and Delete */}
                <div className="flex items-center gap-md">
                  <QuantityStepper
                    quantity={item.quantity}
                    onIncrease={() => handleIncrease(item)}
                    onDecrease={() => handleDecrease(item)}
                    size="sm"
                    disabled={isUpdating || isRemoving}
                  />
                  <button
                    onClick={() => handleRemove(item)}
                    disabled={isRemoving}
                    className="text-on-surface-variant hover:text-red-500 p-2 rounded-lg hover:bg-surface-container active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    aria-label="Remove item"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Keep shopping link */}
          <div className="flex justify-between items-center px-xs">
            <Link
              href={restaurant ? `/restaurants/${restaurant._id}` : "/home"}
              className="text-primary font-label-md text-label-md hover:underline flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Add more items
            </Link>

            <button
              onClick={handleClear}
              disabled={isClearing}
              className="text-on-surface-variant hover:text-red-500 font-label-md text-label-md hover:underline flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
              Clear Cart
            </button>
          </div>
        </div>

        {/* Right Side: Promo & Bill Summary */}
        <div className="space-y-4">
          {/* Promo Code Card */}
          <div className="bg-white rounded-2xl border border-outline-variant/60 p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-on-surface text-body-md">Promo Code</h4>
            {!promoApplied ? (
              <form onSubmit={handleApplyPromo} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter code (e.g. CRAVING10)"
                  className="flex-1 min-w-0 px-4 py-2.5 bg-[#FFF2EE] border border-transparent rounded-xl text-body-sm focus:outline-none focus:border-primary/50 outline-none uppercase placeholder:normal-case placeholder:text-on-surface-variant/50 font-medium"
                />
                <button
                  type="submit"
                  className="shrink-0 bg-[#251510] text-white font-bold text-body-sm px-5 py-2.5 rounded-xl hover:bg-black active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  Apply
                </button>
              </form>
            ) : (
              <div className="flex justify-between items-center bg-green-50 text-green-800 px-4 py-2.5 rounded-xl border border-green-200">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">local_offer</span>
                  <span className="font-bold text-body-sm">CRAVING10 Applied</span>
                </div>
                <button
                  onClick={handleRemovePromo}
                  className="text-green-800 hover:text-red-500 text-caption font-bold hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Bill Summary Card */}
          <div className="bg-white rounded-2xl border border-outline-variant/60 p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-on-surface text-headline-sm">Bill Summary</h3>

            <div className="space-y-3 text-body-md text-on-surface-variant">
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span className="font-semibold text-on-surface">₹{subtotal.toFixed(2)}</span>
              </div>

              {discountPercent > 0 && (
                <div className="flex justify-between items-center text-green-600 font-semibold">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Delivery Fee</span>
                <span className="font-semibold text-on-surface">
                  {deliveryFee === 0 ? "Free" : `₹${deliveryFee.toFixed(2)}`}
                </span>
              </div>

              {serviceFee > 0 && (
                <div className="flex justify-between items-center">
                  <span>Service Fee</span>
                  <span className="font-semibold text-on-surface">₹{serviceFee.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Taxes</span>
                <span className="font-semibold text-on-surface">₹{taxAmount.toFixed(2)}</span>
              </div>

              <div className="pt-4 border-t border-outline-variant/50 flex justify-between items-center">
                <span className="font-bold text-on-surface text-headline-sm">Total</span>
                <span className="font-bold text-[#E03512] text-headline-md">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => router.push("/checkout")}
              className="w-full bg-[#FF4D2D] hover:bg-[#E03512] text-white font-bold text-body-md py-3.5 px-4 rounded-xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              Proceed to Checkout
            </button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-on-surface-variant/70 pt-1">
              <span className="material-symbols-outlined text-sm">lock</span>
              <span>Secure encrypted checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
