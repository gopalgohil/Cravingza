"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProfileMenu from "@/components/ProfileMenu";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { useGetRestaurantsQuery } from "@/lib/redux/apiSlice";

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [address, setAddress] = useState("");
  const { user, cart } = useAppStore();
  const cartCount = cart ? cart.reduce((acc, item) => acc + item.quantity, 0) : 0;

  const { data: response, isLoading } = useGetRestaurantsQuery({});
  const restaurants = response?.data || [];
  const popularRestaurants = restaurants.slice(0, 3);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("logout") === "true") {
      toast.success("Logged out successfully.");
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const handleFindFood = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/home");
  };

  return (
    <div className="text-on-surface bg-background min-h-screen flex flex-col">
      {/* TopNavBar */}
      <nav
        className={`w-full sticky top-0 z-50 bg-surface border-b border-outline-variant transition-shadow duration-200 ${
          scrolled ? "app-shadow" : ""
        }`}
      >
        <div className="w-full flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4">
          <Link href="/" className="font-headline-md text-headline-md font-bold text-primary">
            Cravingza
          </Link>
          <div className="flex items-center gap-md">
            <ProfileMenu />
            <Link
              href="/cart"
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  toast("Please sign in to view your cart and place an order.", {
                    action: {
                      label: "Sign In",
                      onClick: () => router.push("/login"),
                    },
                  });
                }
              }}
              className="relative bg-primary-container text-on-primary p-2.5 rounded-xl active:scale-95 transition-transform hover:opacity-90 hidden md:flex items-center justify-center cursor-pointer"
              aria-label="View Cart"
            >
              <span className="material-symbols-outlined text-xl">shopping_cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative w-full overflow-hidden bg-surface">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center opacity-40"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB-qhe5HbLua3OLwiNFuRkkVjnA_ERkfowzvmWC_lPYkJFYWYlY378SIdsKWnbtvsa77uW5GkN5pJEiMNSQT7fC798vmNSDjZa9JaoxUbl8Hi3lYidS2oXph16Fap0lqnXJuzGtaxlv5Lx0IAQBUr28IPrdawRWKsOr-tacZLIUsjzFfwnjMjWAAyNr-YmFa3ZEZk-QBuX7CRtdmsfIlcxDJjo1_BjeraHDFRDjV7nNBjg_zsJvJwFPZQ')",
            }}
          />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>
        <div className="relative z-10 max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-24 md:py-32 flex flex-col items-start gap-xl">
          <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg max-w-2xl text-on-background">
            Order food you'll crave, delivered fast
          </h1>
          
          <form
            onSubmit={handleFindFood}
            className="w-full max-w-2xl bg-surface-container-lowest p-xs rounded-xl flex flex-col md:flex-row items-stretch gap-xs app-shadow"
          >
            <div className="flex-1 flex items-center px-md py-sm gap-sm">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border-none focus:outline-none focus:ring-0 bg-transparent text-body-md font-body-md placeholder:text-on-surface-variant outline-none"
                placeholder="Enter delivery address"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-primary-container text-on-primary font-headline-sm text-headline-sm px-xl py-md rounded-xl active:scale-95 transition-all hover:brightness-110 cursor-pointer"
            >
              Find Food
            </button>
          </form>

          <div className="flex items-center gap-md">
            <div className="flex -space-x-3">
              <img
                className="w-10 h-10 rounded-full border-2 border-surface object-cover"
                alt="User 1"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvxn7rx0FU0TCQcLko4Iog24-oTKOAEW0L31JYUYO_9A-diass2I0IYsMlegLZWv1ELD1xYWNWYzBy9Zh_ze7KuKY_N6qLzr8pxlNwcgIgk7dzB3KuLp_Td0elHlo47SAboz44XnmFSjsOuGRLqS4my_reCFAwgOnroGRirJ2eoeBOPSjL2Lys8KGShYUf0s0u5VBPMjLvl9irifbMotx3W3gdcAr60euyzTCcdtBREJErfTVwql-i3g"
              />
              <img
                className="w-10 h-10 rounded-full border-2 border-surface object-cover"
                alt="User 2"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC41weDk6WYoOOnHys8b8xG1R1iMksGK8Mnao02iqbf7HoZDdG9m8Ox1hFcyjeAmZV08Wu7StBDIkoYgLsLBs7oD3Oj5DBkU39XOQgFiczTNYpQy4JHdRLsL9kSKicGsnITFQgLDgR-3sTcMTWpTB-kU2Vgh3D21wkIJ2nkcAdhN9KcEFbZcD0-X9J7-MnWGEZpoNFcFzn8cmKMXH_LmSpxM16JeKBQdjEm6NhhAXPZnCMDE4EDmJOy3A"
              />
              <img
                className="w-10 h-10 rounded-full border-2 border-surface object-cover"
                alt="User 3"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6W7SHNgVPXYx_fuxMDCAOTUh-rG2uMHhRujDrdES4RJ0PStFwIqzbKE66QTrPEQ55bReceEe2KM7ixDbnd9h9bE8PMi391XUEksc4Ul9_z0495GMBmO2CCdetVBFJZSXH4vKz0JJlEKyqDi7e0TRop0JOtKrUroGAI44q5QDfV8QI5bhOexWez3f8tftxSWKqUSDiVCijneooBsybAP7gfB9PfDgFEY784jrABolLKHBqjfWoYGsUGQ"
              />
            </div>
            <span className="font-caption text-caption text-on-surface-variant">
              Trusted by 50,000+ hungry locals
            </span>
          </div>
        </div>
      </header>

      {/* How it Works */}
      <section className="w-full bg-surface-container-lowest py-24">
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center mb-16">
            <h2 className="font-headline-md text-headline-md text-on-background mb-base">How it works</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Delicious food in just three simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
            <div className="flex flex-col items-center text-center p-lg rounded-xl hover:bg-surface-container-low transition-colors group">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-lg group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-3xl">search</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm mb-sm">Browse</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Explore thousands of local restaurants and global chains near you.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-lg rounded-xl hover:bg-surface-container-low transition-colors group">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-lg group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-3xl">shopping_cart</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm mb-sm">Order</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Add your cravings to the cart and pay securely in seconds.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-lg rounded-xl hover:bg-surface-container-low transition-colors group">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-lg group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-3xl">local_shipping</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm mb-sm">Track</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Follow your delivery in real-time until it arrives at your door.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="w-full py-24 bg-surface">
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
          <h2 className="font-headline-md text-headline-md text-on-background mb-xl">What are you craving?</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-md">
            {/* Pizza */}
            <Link
              href="/home?category=pizza"
              className="bg-surface-container-lowest p-lg rounded-xl flex flex-col items-center gap-md app-shadow hover:app-shadow-hover transition-all border border-transparent hover:border-primary-container"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  alt="Pizza"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB068WXNCGe5BOTQEBektQKV1KxjFEdyUkOgKw6fUX0rKd0EAfss-vhCu1tx7lOxMBizT5F2r68x4rO5ACENWNZ3jGFmiK2ptq0WgPv2locYsBDEeZP8X1f9cWPYXUQtwwlQBcFsXHam-VDlvlDBtSOv4pjX01GPv5OOuImSuXNlqRb17P1u3-Bqwg1WTw3LJu72bERZ1yN9N6ZRWBHpULuc2D8oqopF-7V2uGxBNPkcurN_FvlIq4Cxw"
                />
              </div>
              <span className="font-label-md text-label-md">Pizza</span>
            </Link>
            {/* Burgers */}
            <Link
              href="/home?category=burgers"
              className="bg-surface-container-lowest p-lg rounded-xl flex flex-col items-center gap-md app-shadow hover:app-shadow-hover transition-all border border-transparent hover:border-primary-container"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  alt="Burgers"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuABiiNTIuNLqqocuPGe2NmV0V-UpBxHunZ_QVn736VzHCwDOTH_eASts7L5I7EaUytFZ1EoKUyvw4CvMIxxmKJmx9BEqZD7Cp2rjgaV-pSd2ka9O17XxdcmXWlpBjeyl4G9iXjBtvBms49bqYPUNu-3EmWeV1ZUeCjeBAQ-STqZz_rRiDkt1_5jLGa7k1HcVvqGKPzMtbcKrA55xhI3s6D_X4Us6bD5MIGHb3F0CeDqH-VMxthDJAzcag"
                />
              </div>
              <span className="font-label-md text-label-md">Burgers</span>
            </Link>
            {/* Biryani */}
            <Link
              href="/home?category=biryani"
              className="bg-surface-container-lowest p-lg rounded-xl flex flex-col items-center gap-md app-shadow hover:app-shadow-hover transition-all border border-transparent hover:border-primary-container"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  alt="Biryani"
                  src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&auto=format&fit=crop&q=60"
                />
              </div>
              <span className="font-label-md text-label-md">Biryani</span>
            </Link>
            {/* Desserts */}
            <Link
              href="/home?category=desserts"
              className="bg-surface-container-lowest p-lg rounded-xl flex flex-col items-center gap-md app-shadow hover:app-shadow-hover transition-all border border-transparent hover:border-primary-container"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  alt="Desserts"
                  src="https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&auto=format&fit=crop&q=60"
                />
              </div>
              <span className="font-label-md text-label-md">Desserts</span>
            </Link>
            {/* Healthy */}
            <Link
              href="/home?category=healthy"
              className="bg-surface-container-lowest p-lg rounded-xl flex flex-col items-center gap-md app-shadow hover:app-shadow-hover transition-all border border-transparent hover:border-primary-container"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  alt="Healthy"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsntSmNvOtuH5-AyNXpgaY8ZmMMcYzWphvTiRRAi3PxgcTuBis9zGbrBKBYwXVKDKXm0ymYtePbFhlup_U9shHQ60gzjshFnYQKcy2jZdqdguZbupK4BWbvuK5EU7YoktdaLyWUOEkEddwCji_fMcqpt4Y_bWLe4Et9mito4Vqmf9lTU7EsZejshiadlhsP750bHC2VQsuHdeNsvIQAPYl-gsQKth4CtVmNljAMV1cmJmbGC32N5djGA"
                />
              </div>
              <span className="font-label-md text-label-md">Healthy</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Near You */}
      <section className="w-full py-24 bg-surface-container-lowest">
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="flex justify-between items-end mb-xl">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-background">Popular near you</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Top rated spots in your area</p>
            </div>
            <Link href="/home" className="text-primary font-label-md text-label-md hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {isLoading ? (
              [...Array(3)].map((_, idx) => (
                <div
                  key={idx}
                  className="bg-surface rounded-xl overflow-hidden border border-outline-variant/35 p-0 flex flex-col h-full animate-pulse"
                >
                  <div className="aspect-video bg-surface-container-high w-full"></div>
                  <div className="p-lg space-y-md flex-1 bg-white">
                    <div className="h-6 bg-surface-container rounded w-3/4"></div>
                    <div className="h-4 bg-surface-container-low rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : popularRestaurants.length > 0 ? (
              popularRestaurants.map((restaurant: any) => (
                <div
                  key={restaurant._id}
                  onClick={() => router.push(`/restaurants/${restaurant._id}`)}
                  className="bg-surface rounded-xl overflow-hidden app-shadow hover:app-shadow-hover transition-all cursor-pointer group flex flex-col h-full border border-outline-variant/30"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={restaurant.name}
                      src={restaurant.image}
                    />
                    <div className="absolute top-md right-md bg-surface-container-lowest px-sm py-xs rounded-lg flex items-center gap-xs shadow-sm">
                      <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                      <span className="font-label-md text-label-md">{restaurant.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="p-lg flex-1 flex flex-col justify-between gap-sm bg-white">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm mb-xs group-hover:text-primary transition-colors">
                        {restaurant.name}
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant line-clamp-1">
                        {restaurant.cuisineTags?.join(", ") || restaurant.cuisine}
                      </p>
                    </div>
                    <div className="flex items-center gap-sm mt-md">
                      <span className="material-symbols-outlined text-on-surface-variant text-body-md">schedule</span>
                      <span className="font-caption text-caption text-on-surface-variant">
                        {restaurant.deliveryTime} • {restaurant.deliveryFee === 0 ? "Free delivery" : `₹${Math.round(restaurant.deliveryFee)} delivery`}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-on-surface-variant col-span-3 py-8">No restaurants available.</p>
            )}
          </div>
        </div>
      </section>

      {/* Download App */}
      <section className="w-full py-24 bg-primary text-on-primary">
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row items-center gap-xl">
          <div className="flex-1 text-center md:text-left">
            <h2 className="font-display-lg-mobile md:font-headline-md text-display-lg-mobile md:text-headline-md mb-lg">
              Unlock the full Cravingza experience
            </h2>
            <p className="font-body-lg text-body-lg mb-xl opacity-90">
              Get exclusive offers, real-time tracking, and faster checkout with our mobile app.
            </p>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-md">
              <button className="bg-on-primary text-primary px-xl py-md rounded-xl font-bold flex items-center justify-center gap-sm hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">apps</span>
                App Store
              </button>
              <button className="bg-on-primary text-primary px-xl py-md rounded-xl font-bold flex items-center justify-center gap-sm hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">play_books</span>
                Google Play
              </button>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative w-64 h-[500px] bg-on-primary rounded-[3rem] p-4 shadow-2xl overflow-hidden">
              <img
                className="w-full h-full object-cover rounded-[2.5rem]"
                alt="Smartphone app mockup"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCY6N4NjqI1wGFY1cBARKrfdJcBO90cf2P3Ux0CSRYyXKw4EMe-mcAhs0N1ICKUvLHB218JP0GuI0BQwaT7txocCeiMMFR67rwocg6JssNripcqYCCJpr9XVfwlYM8G87NQQKA7elCZd1wrkPhnRcVTzBHxT24M3vh2T-pxM9lDR9vdT04lx3QbUa_kSVvppybV0d3qn5F5UNe-2cHzUokkqrwTR-2h__lHRblUHJVfo3um_In2ySPJwA"
              />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-on-primary rounded-b-xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full mt-xl bg-surface-container-highest pb-24 md:pb-0">
        <div className="flex flex-col md:flex-row justify-between items-start px-margin-mobile md:px-margin-desktop py-lg md:py-xl max-w-max-width mx-auto gap-lg md:gap-xl">
          <div className="flex flex-col gap-sm md:gap-md max-w-xs">
            <span className="font-headline-sm text-headline-sm text-primary font-bold">Cravingza</span>
            <p className="text-xs sm:text-caption font-caption text-on-surface-variant leading-relaxed">
              Bringing your favorite flavors right to your doorstep. Fast, reliable, and always fresh.
            </p>
            <div className="flex gap-md pt-1 md:pt-0">
              <a href="#" className="text-on-surface-variant hover:text-primary transition-opacity">
                <span className="material-symbols-outlined">face_nod</span>
              </a>
              <a href="#" className="text-on-surface-variant hover:text-primary transition-opacity">
                <span className="material-symbols-outlined">public</span>
              </a>
              <a href="#" className="text-on-surface-variant hover:text-primary transition-opacity">
                <span className="material-symbols-outlined">share</span>
              </a>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-6 md:gap-xl w-full md:w-auto">
            <div className="flex flex-col gap-1.5 sm:gap-sm">
              <span className="text-xs sm:text-label-md font-label-md text-on-background font-bold">Company</span>
              <a className="text-[11px] sm:text-caption font-caption text-on-surface-variant hover:underline transition-all" href="#">
                About Us
              </a>
              <a className="text-[11px] sm:text-caption font-caption text-on-surface-variant hover:underline transition-all" href="#">
                Careers
              </a>
              <Link className="text-[11px] sm:text-caption font-caption text-primary hover:underline font-bold transition-all flex items-center gap-0.5 sm:gap-1" href="/become-partner">
                <span>Partner with Us</span>
                <span className="material-symbols-outlined text-[10px] sm:text-xs">arrow_forward</span>
              </Link>
            </div>
            <div className="flex flex-col gap-1.5 sm:gap-sm">
              <span className="text-xs sm:text-label-md font-label-md text-on-background font-bold">Support</span>
              <a className="text-[11px] sm:text-caption font-caption text-on-surface-variant hover:underline transition-all" href="#">
                Help Center
              </a>
              <a className="text-[11px] sm:text-caption font-caption text-on-surface-variant hover:underline transition-all" href="#">
                Safety
              </a>
              <a className="text-[11px] sm:text-caption font-caption text-on-surface-variant hover:underline transition-all" href="#">
                Terms of Service
              </a>
            </div>
            <div className="flex flex-col gap-1.5 sm:gap-sm">
              <span className="text-xs sm:text-label-md font-label-md text-on-background font-bold">Legal</span>
              <a className="text-[11px] sm:text-caption font-caption text-on-surface-variant hover:underline transition-all" href="#">
                Privacy Policy
              </a>
              <a className="text-[11px] sm:text-caption font-caption text-on-surface-variant hover:underline transition-all" href="#">
                Cookies
              </a>
              <a className="text-[11px] sm:text-caption font-caption text-on-surface-variant hover:underline transition-all" href="#">
                Refunds
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-md md:py-lg border-t border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-sm sm:gap-0">
          <span className="text-[11px] sm:text-caption font-caption text-on-surface-variant text-center sm:text-left">
            © 2024 Cravingza Inc. All rights reserved.
          </span>
          <div className="flex gap-md">
            <img
              className="h-3.5 sm:h-4 opacity-50 grayscale"
              alt="Visa"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuGcFugiiKorAdUCstGkUHLCdhupShhk8XFmmc5SSp_hsqAfTaelRpQpIkiK6nrpysqgMXPrTeRfF9VjiXZWhZNyfdDmugPDSnNOnvX009Dry_IHB2aWx1Zgl9wJcDH1QnzToSPmKJj4ZAUemu-IMvIYiWFjeeFegyOFL6NlRhjlDQWC4JfWDUKhSlJz_JCRS_4A97G--_GRbWHU5xAN4RRugjuVuRXH39bILePV8nEnMMeXkD1EKyjw"
            />
            <img
              className="h-3.5 sm:h-4 opacity-50 grayscale"
              alt="Mastercard"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAysbuTcIG8EWstBOQqZwGJq-Qk9g7tqcR768bFR3dhFlRlL-GbNa6MdMl7zSCm5ryOwYvZonXFOejgmVChFV_jqf-X-UllfgAzXTfsGd9Of2B0qGUZg7hcT7AkIBCdgfpknDJ34XfJLSICP2EDoDzlkwAs1eAtkf8RMzFIz5XZOPpvRxCpejZvtlLxRfmomkFhlkkQPIECaLhQ46YTZIEYcCqiOL-4ZRS_Z4jVsfs-zW8-6HaDYzpNVw"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
