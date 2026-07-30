"use client";

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/lib/redux/store";
import {
  setConflictModal,
  optimisticAddToCart,
  optimisticUpdateQuantity,
  optimisticRemoveFromCart,
} from "@/lib/redux/cartSlice";
import {
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
} from "@/lib/redux/apiSlice";
import QuantityStepper from "./QuantityStepper";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { showAttractiveAuthToast } from "@/lib/authToast";

interface MenuItemCardProps {
  item: {
    _id: string;
    name: string;
    price: number;
    description?: string;
    image?: string;
    isVeg?: boolean;
    isAvailable?: boolean;
    isBestSeller?: boolean;
  };
  restaurantId: string;
  restaurantName: string;
}

export default function MenuItemCard({ item, restaurantId, restaurantName }: MenuItemCardProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useAppStore();
  
  // Select the item from the Redux cart state (using item._id)
  const cartItem = useSelector((state: RootState) =>
    state.cart.items.find((i) => i.id === item._id)
  );

  const [addToCart] = useAddToCartMutation();
  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeCartItem] = useRemoveCartItemMutation();

  const showSignInToast = () => {
    showAttractiveAuthToast(
      router,
      "Sign in to Add Items",
      "Create an account or log in to start ordering your favorite food!"
    );
  };

  const handleAdd = async () => {
    // Check login state before making the API call
    if (!user) {
      showSignInToast();
      return;
    }
    
    // Instant 0ms Optimistic UI update!
    dispatch(optimisticAddToCart({ item, restaurantId, restaurantName }));
    toast.success(`${item.name} added to cart!`);

    try {
      await addToCart({ menuItemId: item._id, quantity: 1 }).unwrap();
    } catch (err: any) {
      if (err.status === 409 && err.data?.conflict) {
        // Trigger conflict modal
        dispatch(
          setConflictModal({
            open: true,
            pendingItem: { menuItemId: item._id, quantity: 1 },
            currentRestaurantName: err.data.currentRestaurant?.name || "Another Restaurant",
          })
        );
      } else if (err.status === 401) {
        showSignInToast();
      } else {
        toast.error(err.data?.message || "Failed to add item to cart.");
      }
    }
  };

  const handleIncrease = async () => {
    if (cartItem) {
      const newQty = cartItem.quantity + 1;
      // Instant 0ms Optimistic UI update!
      dispatch(optimisticUpdateQuantity({ id: item._id, quantity: newQty }));

      try {
        await updateCartItem({ menuItemId: item._id, quantity: newQty }).unwrap();
      } catch (err: any) {
        toast.error(err.data?.message || "Failed to update quantity");
      }
    }
  };

  const handleDecrease = async () => {
    if (cartItem) {
      const newQty = cartItem.quantity - 1;
      // Instant 0ms Optimistic UI update!
      if (newQty <= 0) {
        dispatch(optimisticRemoveFromCart(item._id));
        toast.success(`${item.name} removed from cart`);
      } else {
        dispatch(optimisticUpdateQuantity({ id: item._id, quantity: newQty }));
      }

      try {
        if (newQty <= 0) {
          await removeCartItem(item._id).unwrap();
        } else {
          await updateCartItem({ menuItemId: item._id, quantity: newQty }).unwrap();
        }
      } catch (err: any) {
        toast.error(err.data?.message || "Failed to update quantity");
      }
    }
  };

  return (
    <div className="flex gap-3 md:gap-md bg-surface p-3.5 sm:p-4 md:p-lg rounded-2xl border border-outline-variant/60 hover:app-shadow transition-all group items-center">
      {/* Text Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0 pr-1">
        <div className="flex flex-col gap-1">
          {/* Veg/Non-Veg & Bestseller */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border ${item.isVeg ? "border-green-600 bg-green-50" : "border-red-600 bg-red-50"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`}></span>
            </span>
            {item.isBestSeller && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                Bestseller
              </span>
            )}
          </div>

          <h4 className="font-bold text-sm md:text-headline-sm text-on-surface truncate">
            {item.name}
          </h4>

          <span className="font-bold text-sm md:text-headline-sm text-slate-900">
            ₹{item.price.toFixed(2)}
          </span>

          {item.description && (
            <p className="text-xs md:text-body-md text-on-surface-variant line-clamp-2 md:line-clamp-3 mt-0.5">
              {item.description}
            </p>
          )}
        </div>

        {/* Action Button for Desktop Only */}
        <div className="mt-md w-fit hidden md:block">
          {cartItem ? (
            <QuantityStepper
              quantity={cartItem.quantity}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
              size="sm"
            />
          ) : (
            <button
              onClick={handleAdd}
              className="bg-primary text-white font-label-md text-label-md px-lg py-sm rounded-xl active:scale-95 transition-all hover:bg-primary-container hover:text-on-primary flex items-center gap-xs cursor-pointer border border-transparent"
            >
              <span className="material-symbols-outlined text-base">add_shopping_cart</span>
              Add to Cart
            </button>
          )}
        </div>
      </div>

      {/* Image with Swiggy/Zomato Floating ADD Badge on Mobile */}
      <div className="relative flex flex-col items-center shrink-0 my-auto pb-2 md:pb-0">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-slate-100 relative shadow-sm border border-slate-100">
          <img
            src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400";
            }}
          />
        </div>

        {/* Mobile-Only Floating ADD Badge (Exact Screenshot UI) */}
        <div className="md:hidden absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-10 shadow-md rounded-xl">
          {cartItem ? (
            <div className="bg-white border border-emerald-500/40 rounded-xl shadow-md overflow-hidden flex items-center">
              <QuantityStepper
                quantity={cartItem.quantity}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
                size="sm"
              />
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="bg-white text-emerald-600 font-extrabold text-xs px-5 py-1.5 rounded-xl border border-slate-200/90 shadow-md hover:bg-slate-50 uppercase tracking-wider cursor-pointer active:scale-95 transition-all flex items-center justify-center min-w-[72px]"
            >
              ADD
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
