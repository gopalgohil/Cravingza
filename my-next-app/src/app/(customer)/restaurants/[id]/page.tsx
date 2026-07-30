"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import {
  useGetRestaurantByIdQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} from "@/lib/redux/apiSlice";
import MenuItemCard from "@/components/customer/MenuItemCard";
import QuantityStepper from "@/components/customer/QuantityStepper";
import { toast } from "sonner";

import RestaurantLoading from "./loading";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RestaurantDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { id } = use(params);

  // Fetch restaurant from database
  const { data: response, isLoading, isError } = useGetRestaurantByIdQuery(id);
  const restaurant = response?.data?.restaurant;
  const menu = response?.data?.menu || [];

  const cart = useSelector((state: RootState) => state.cart);

  const [updateCartItem, { isLoading: isUpdating }] = useUpdateCartItemMutation();
  const [removeCartItem, { isLoading: isRemoving }] = useRemoveCartItemMutation();
  const [clearCart, { isLoading: isClearing }] = useClearCartMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExpandingMenu, setIsExpandingMenu] = useState(false);
  const [isMenuLoading, setIsMenuLoading] = useState(false);

  const handleToggleExpand = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      setIsExpandingMenu(true);
      setTimeout(() => {
        setIsExpanded(true);
        setIsExpandingMenu(false);
      }, 500);
    }
  };

  const handleCategorySelect = (cat: string) => {
    if (selectedCategory === cat) return;
    setIsMenuLoading(true);
    setSelectedCategory(cat);
    setTimeout(() => {
      setIsMenuLoading(false);
    }, 400);
  };

  // Collapse menu when category or search changes
  useEffect(() => {
    setIsExpanded(false);
    setIsExpandingMenu(false);
  }, [selectedCategory, debouncedSearch]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      setIsMenuLoading(true);
    }
    if (searchQuery.length < 3) {
      setDebouncedSearch("");
      if (searchQuery.length === 0) {
        setIsMenuLoading(false);
      }
    } else {
      const handler = setTimeout(() => {
        setDebouncedSearch(searchQuery);
        setIsMenuLoading(false);
      }, 350);
      return () => clearTimeout(handler);
    }
  }, [searchQuery]);

  if (isLoading) {
    return <RestaurantLoading />;
  }

  if (isError || !restaurant) {
    return (
      <div className="py-16 text-center space-y-md">
        <span className="material-symbols-outlined text-6xl text-primary">warning</span>
        <h3 className="font-headline-sm text-headline-sm">Restaurant not found</h3>
        <Link href="/home" className="text-primary font-bold hover:underline">
          Back to Browse
        </Link>
      </div>
    );
  }

  // Filter menu items based on category and search query
  const filteredMenuItems = menu.filter((item: any) => {
    const matchesSearch =
      item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(debouncedSearch.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "popular" && item.isBestSeller) ||
      (selectedCategory === "veg" && item.isVeg) ||
      (selectedCategory === "non-veg" && !item.isVeg);

    return matchesSearch && matchesCategory;
  });

  // Calculate cart details (ensure restaurant IDs match, considering MongoDB ObjectIds)
  const isThisRestaurant =
    cart.restaurant?._id === restaurant._id || cart.restaurant === restaurant._id;

  const cartItemsFromThisRestaurant = isThisRestaurant ? cart.items : [];
  const cartCount = cartItemsFromThisRestaurant.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = isThisRestaurant ? cart.subtotal : 0;

  const handleClearCart = async () => {
    try {
      await clearCart().unwrap();
      toast.success("Cart cleared");
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to clear cart");
    }
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

  const handleCheckout = () => {
    router.push("/checkout");
  };

  return (
    <div className="space-y-xl max-w-max-width mx-auto py-6 pb-24 md:pb-12">
      {/* Back Button */}
      <button
        onClick={() => router.push("/home")}
        className="flex items-center gap-xs text-primary font-label-md text-label-md hover:underline cursor-pointer select-none"
      >
        <span className="material-symbols-outlined text-md">arrow_back</span>
        Back to Restaurants
      </button>

      {/* Hero Banner */}
      <div className="relative aspect-[21/9] md:aspect-[3/1] rounded-2xl overflow-hidden shadow-md">
        <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-lg md:p-xl text-white">
          <div className="space-y-sm">
            <h1 className="font-display-md text-headline-lg font-bold text-white leading-tight">
              {restaurant.name}
            </h1>
            <p className="font-body-md opacity-90">{restaurant.cuisineTags?.join(", ")}</p>

            <div className="flex flex-wrap items-center gap-md text-caption font-caption pt-xs">
              <span className="bg-white/20 backdrop-blur-sm px-sm py-1 rounded-lg flex items-center gap-1 font-semibold">
                <span
                  className="material-symbols-outlined text-sm text-yellow-400"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                {restaurant.rating?.toFixed(1) || "0.0"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span>
                {restaurant.deliveryTime}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">local_shipping</span>
                {restaurant.deliveryFee === 0
                  ? "Free Delivery"
                  : `₹${Math.round(restaurant.deliveryFee)}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl items-start">
        {/* Menu Column */}
        <div className="lg:col-span-2 space-y-lg">
          {/* Menu Search and Categories */}
          <div className="flex flex-col sm:flex-row gap-md justify-between items-stretch sm:items-center py-2">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategorySelect("all")}
                className={`px-4 py-2 rounded-xl font-label-md text-label-md border transition-all cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-primary text-white border-primary"
                    : "bg-surface border-outline-variant text-on-surface hover:bg-surface-container"
                }`}
              >
                All Menu
              </button>
              <button
                onClick={() => handleCategorySelect("popular")}
                className={`px-4 py-2 rounded-xl font-label-md text-label-md border transition-all cursor-pointer ${
                  selectedCategory === "popular"
                    ? "bg-primary text-white border-primary"
                    : "bg-surface border-outline-variant text-on-surface hover:bg-surface-container"
                }`}
              >
                Popular Items
              </button>
              <button
                onClick={() => handleCategorySelect("veg")}
                className={`px-4 py-2 rounded-xl font-label-md text-label-md border transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === "veg"
                    ? "bg-green-600 text-white border-green-600 shadow-sm"
                    : "bg-surface border-outline-variant text-green-700 hover:bg-green-50/50"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Veg
              </button>
              <button
                onClick={() => handleCategorySelect("non-veg")}
                className={`px-4 py-2 rounded-xl font-label-md text-label-md border transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === "non-veg"
                    ? "bg-red-700 text-white border-red-700 shadow-sm"
                    : "bg-surface border-outline-variant text-red-700 hover:bg-red-50/50"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                Non-Veg
              </button>
            </div>

            {/* Menu search bar */}
            <div className="flex bg-white border border-outline-variant rounded-xl items-center px-md py-2 gap-sm shadow-sm flex-1 sm:max-w-xs">
              <span className="material-symbols-outlined text-on-surface-variant text-base">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search menu items..."
                className="w-full bg-transparent border-none text-body-md font-body-md placeholder:text-on-surface-variant focus:outline-none focus:ring-0 outline-none"
              />
            </div>
          </div>

          {/* Menu Items List */}
          <div className="space-y-md">
            {isMenuLoading ? (
              <div className="space-y-md">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-surface rounded-2xl p-lg border border-outline-variant/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md shadow-xs animate-pulse"
                  >
                    <div className="flex gap-md items-start sm:items-center w-full sm:w-auto flex-1">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-outline-variant/30 flex-shrink-0"></div>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-outline-variant/30"></div>
                          <div className="h-5 w-44 bg-outline-variant/30 rounded"></div>
                        </div>
                        <div className="h-4 w-full max-w-sm bg-outline-variant/20 rounded"></div>
                        <div className="h-5 w-20 bg-outline-variant/30 rounded"></div>
                      </div>
                    </div>
                    <div className="w-24 h-10 bg-outline-variant/30 rounded-xl flex-shrink-0 self-end sm:self-center"></div>
                  </div>
                ))}
              </div>
            ) : filteredMenuItems.length > 0 ? (
              <>
                {(isExpanded ? filteredMenuItems : filteredMenuItems.slice(0, 4)).map((item: any) => (
                  <MenuItemCard
                    key={item._id}
                    item={item}
                    restaurantId={restaurant._id}
                    restaurantName={restaurant.name}
                  />
                ))}

                {/* Skeleton Loader during full menu expansion */}
                {isExpandingMenu && (
                  <div className="space-y-md animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={`expand-skeleton-${i}`}
                        className="bg-surface rounded-2xl p-lg border border-outline-variant/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md shadow-xs"
                      >
                        <div className="flex gap-md items-start sm:items-center w-full sm:w-auto flex-1">
                          <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-outline-variant/30 flex-shrink-0"></div>
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded bg-outline-variant/30"></div>
                              <div className="h-5 w-44 bg-outline-variant/30 rounded"></div>
                            </div>
                            <div className="h-4 w-full max-w-sm bg-outline-variant/20 rounded"></div>
                            <div className="h-5 w-20 bg-outline-variant/30 rounded"></div>
                          </div>
                        </div>
                        <div className="w-24 h-10 bg-outline-variant/30 rounded-xl flex-shrink-0 self-end sm:self-center"></div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredMenuItems.length > 4 && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleToggleExpand}
                      disabled={isExpandingMenu}
                      className="flex items-center gap-2 text-primary font-bold font-label-md text-label-md py-2.5 px-6 rounded-xl hover:bg-primary/5 transition-all select-none cursor-pointer border border-outline-variant/60 hover:border-primary/30 bg-surface shadow-sm disabled:opacity-75"
                    >
                      {isExpandingMenu ? (
                        <>
                          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                          <span>Loading full menu...</span>
                        </>
                      ) : (
                        <>
                          <span>{isExpanded ? "Show less" : `View full menu (${filteredMenuItems.length - 4} more)`}</span>
                          <span 
                            className="material-symbols-outlined text-lg transition-transform duration-300"
                            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                          >
                            keyboard_arrow_down
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 space-y-md bg-surface rounded-2xl border border-outline-variant">
                <span className="material-symbols-outlined text-5xl text-primary animate-pulse">
                  search_off
                </span>
                <p className="font-headline-sm text-headline-sm text-on-surface">
                  {debouncedSearch ? `No menu items found for "${debouncedSearch}"` : "No menu items match your filter"}
                </p>
                <p className="text-on-surface-variant font-body-md max-w-sm mx-auto">
                  {debouncedSearch ? (
                    "Please check the spelling of your query or try searching for another dish."
                  ) : (
                    "Try adjusting your filters or category selection."
                  )}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="text-primary font-bold hover:underline pt-2"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Mini Cart Sidebar (Desktop only) */}
        <div className="hidden lg:block sticky top-24">
          <div className="bg-surface rounded-2xl border border-outline-variant p-lg flex flex-col gap-lg shadow-md max-h-[calc(100vh-120px)] overflow-y-auto">
            <div className="flex justify-between items-center pb-md border-b border-outline-variant">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">shopping_basket</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-background">
                  Your Cart
                </h3>
              </div>
              {cartItemsFromThisRestaurant.length > 0 && (
                <button
                  onClick={handleClearCart}
                  disabled={isClearing}
                  className="text-on-surface-variant hover:text-red-500 font-label-sm text-label-sm hover:underline flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Clear
                </button>
              )}
            </div>

            {cartItemsFromThisRestaurant.length > 0 ? (
              <>
                {/* Cart Items list */}
                <div className="space-y-md overflow-y-auto max-h-[300px] pr-1">
                  {cartItemsFromThisRestaurant.map((item) => (
                    <div key={item.id} className="flex gap-sm items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <span className="font-label-md text-label-md text-on-surface font-semibold truncate block">
                          {item.name}
                        </span>
                        <span className="font-caption text-caption text-primary font-bold">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex-shrink-0 scale-90 origin-right">
                        <QuantityStepper
                          quantity={item.quantity}
                          onIncrease={() => handleIncrease(item)}
                          onDecrease={() => handleDecrease(item)}
                          size="sm"
                          disabled={isUpdating || isRemoving}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-outline-variant pt-lg space-y-md">
                  {/* Totals */}
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-on-surface">Subtotal</span>
                    <span className="text-primary text-headline-sm font-bold">
                      ₹{cartSubtotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-primary text-white font-label-md text-label-md py-md rounded-xl active:scale-95 transition-all hover:bg-primary/95 flex items-center justify-center gap-sm cursor-pointer shadow-sm hover:shadow-md"
                  >
                    Go to Checkout
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 space-y-md">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto text-outline-variant">
                  <span className="material-symbols-outlined text-3xl">shopping_cart</span>
                </div>
                <div className="space-y-xs">
                  <p className="font-label-md text-label-md font-semibold text-on-surface">
                    Cart is empty
                  </p>
                  <p className="font-caption text-caption text-on-surface-variant max-w-[200px] mx-auto">
                    Add delicious items from the menu to start your order.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar (Mobile only) */}
      {cartItemsFromThisRestaurant.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant p-md flex items-center justify-between z-45 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col">
            <span className="font-caption text-caption text-on-surface-variant">
              {cartCount} {cartCount === 1 ? "item" : "items"}
            </span>
            <span className="font-headline-sm text-headline-sm text-primary font-bold">
              ₹{cartSubtotal.toFixed(2)}
            </span>
          </div>
          <button
            onClick={() => router.push("/cart")}
            className="bg-primary text-white font-label-md text-label-md px-xl py-3 rounded-xl active:scale-95 transition-all hover:bg-primary/95 flex items-center gap-xs cursor-pointer shadow-sm"
          >
            View Cart
            <span className="material-symbols-outlined text-base">shopping_cart</span>
          </button>
        </div>
      )}
    </div>
  );
}
