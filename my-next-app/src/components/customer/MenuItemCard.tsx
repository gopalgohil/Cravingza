"use client";

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/lib/redux/store";
import { setConflictModal } from "@/lib/redux/cartSlice";
import {
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
} from "@/lib/redux/apiSlice";
import QuantityStepper from "./QuantityStepper";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";

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

import { showAttractiveAuthToast } from "@/lib/authToast";

export default function MenuItemCard({ item, restaurantId, restaurantName }: MenuItemCardProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useAppStore();
  
  // Select the item from the Redux cart state (using item._id)
  const cartItem = useSelector((state: RootState) =>
    state.cart.items.find((i) => i.id === item._id)
  );

  const [addToCart, { isLoading: isAdding }] = useAddToCartMutation();
  const [updateCartItem, { isLoading: isUpdating }] = useUpdateCartItemMutation();
  const [removeCartItem, { isLoading: isRemoving }] = useRemoveCartItemMutation();

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
    try {
      await addToCart({ menuItemId: item._id, quantity: 1 }).unwrap();
      toast.success(`${item.name} added to cart!`);
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
        // Fallback for 401 unauthorized
        showSignInToast();
      } else {
        toast.error(err.data?.message || "Failed to add item. Please try again.");
      }
    }
  };

  const handleIncrease = async () => {
    if (cartItem) {
      try {
        await updateCartItem({ menuItemId: item._id, quantity: cartItem.quantity + 1 }).unwrap();
      } catch (err: any) {
        toast.error(err.data?.message || "Failed to update quantity");
      }
    }
  };

  const handleDecrease = async () => {
    if (cartItem) {
      try {
        if (cartItem.quantity === 1) {
          await removeCartItem(item._id).unwrap();
          toast.success(`${item.name} removed from cart`);
        } else {
          await updateCartItem({ menuItemId: item._id, quantity: cartItem.quantity - 1 }).unwrap();
        }
      } catch (err: any) {
        toast.error(err.data?.message || "Failed to update quantity");
      }
    }
  };

  const isLoading = isAdding || isUpdating || isRemoving;

  return (
    <div className="flex gap-md bg-surface p-lg rounded-xl border border-outline-variant hover:app-shadow transition-all group">
      {/* Text Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="flex flex-col gap-xs">
          <div className="flex items-center gap-sm flex-wrap">
            <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">
              {item.name}
            </h4>
            {item.isBestSeller && (
              <span className="bg-primary-container text-on-primary text-[10px] font-bold px-sm py-0.5 rounded-full uppercase tracking-wider">
                Bestseller
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${item.isVeg ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
              {item.isVeg ? "Veg" : "Non-Veg"}
            </span>
          </div>
          <span className="font-headline-sm text-headline-sm text-primary font-bold">
            ₹{item.price.toFixed(2)}
          </span>
          <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2 md:line-clamp-3">
            {item.description}
          </p>
        </div>

        {/* Action Button / Stepper */}
        <div className="mt-md w-fit">
          {cartItem ? (
            <QuantityStepper
              quantity={cartItem.quantity}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
              size="sm"
              disabled={isLoading}
            />
          ) : (
            <button
              onClick={handleAdd}
              disabled={isLoading}
              className="bg-primary text-white font-label-md text-label-md px-lg py-sm rounded-xl active:scale-95 transition-all hover:bg-primary-container hover:text-on-primary flex items-center gap-xs cursor-pointer border border-transparent disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">add_shopping_cart</span>
              Add to Cart
            </button>
          )}
        </div>
      </div>

      {/* Image */}
      <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden bg-surface-container relative flex-shrink-0">
        <img
          src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400";
          }}
        />
      </div>
    </div>
  );
}
