"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useGetRestaurantsQuery } from "@/lib/redux/apiSlice";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingHero from "@/components/landing/LandingHero";
import HowItWorks from "@/components/landing/HowItWorks";
import CategoryCard from "@/components/customer/CategoryCard";
import RestaurantCard from "@/components/customer/RestaurantCard";
import CustomerFooter from "@/components/customer/Footer";
import { Smartphone, Apple } from "lucide-react";

const CATEGORIES = [
  {
    title: "Pizza",
    href: "/home?category=pizza",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB068WXNCGe5BOTQEBektQKV1KxjFEdyUkOgKw6fUX0rKd0EAfss-vhCu1tx7lOxMBizT5F2r68x4rO5ACENWNZ3jGFmiK2ptq0WgPv2locYsBDEeZP8X1f9cWPYXUQtwwlQBcFsXHam-VDlvlDBtSOv4pjX01GPv5OOuImSuXNlqRb17P1u3-Bqwg1WTw3LJu72bERZ1yN9N6ZRWBHpULuc2D8oqopF-7V2uGxBNPkcurN_FvlIq4Cxw",
  },
  {
    title: "Burgers",
    href: "/home?category=burgers",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuABiiNTIuNLqqocuPGe2NmV0V-UpBxHunZ_QVn736VzHCwDOTH_eASts7L5I7EaUytFZ1EoKUyvw4CvMIxxmKJmx9BEqZD7Cp2rjgaV-pSd2ka9O17XxdcmXWlpBjeyl4G9iXjBtvBms49bqYPUNu-3EmWeV1ZUeCjeBAQ-STqZz_rRiDkt1_5jLGa7k1HcVvqGKPzMtbcKrA55xhI3s6D_X4Us6bD5MIGHb3F0CeDqH-VMxthDJAzcag",
  },
  {
    title: "Biryani",
    href: "/home?category=biryani",
    image:
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&auto=format&fit=crop&q=60",
  },
  {
    title: "Desserts",
    href: "/home?category=desserts",
    image:
      "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&auto=format&fit=crop&q=60",
  },
  {
    title: "Healthy",
    href: "/home?category=healthy",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDsntSmNvOtuH5-AyNXpgaY8ZmMMcYzWphvTiRRAi3PxgcTuBis9zGbrBKBYwXVKDKXm0ymYtePbFhlup_U9shHQ60gzjshFnYQKcy2jZdqdguZbupK4BWbvuK5EU7YoktdaLyWUOEkEddwCji_fMcqpt4Y_bWLe4Et9mito4Vqmf9lTU7EsZejshiadlhsP750bHC2VQsuHdeNsvIQAPYl-gsQKth4CtVmNljAMV1cmJmbGC32N5djGA",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { data: response, isLoading } = useGetRestaurantsQuery({});
  const restaurants = response?.data || [];
  const popularRestaurants = restaurants.slice(0, 3);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("logout") === "true") {
      toast.success("Logged out successfully.");
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const handleOrderNow = () => router.push("/offers");
  const handleExplore = () => router.push("/home");

  return (
    <div className="text-on-surface bg-background min-h-screen flex flex-col">
      {/* Reusable Navbar */}
      <LandingNavbar />

      {/* Reusable Hero Header */}
      <LandingHero onOrderNow={handleOrderNow} onExplore={handleExplore} />

      {/* Reusable How It Works */}
      <HowItWorks />

      {/* Reusable Categories Section */}
      <section className="w-full py-24 bg-surface">
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
          <h2 className="font-headline-md text-headline-md text-on-background mb-xl">
            What are you craving?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-md">
            {CATEGORIES.map((cat, idx) => (
              <CategoryCard key={idx} title={cat.title} image={cat.image} href={cat.href} />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Near You Section */}
      <section className="w-full py-24 bg-surface-container-lowest">
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="flex justify-between items-end mb-xl">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-background">
                Popular near you
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Top rated spots in your area
              </p>
            </div>
            <Link href="/home" className="text-primary font-label-md text-label-md hover:underline font-bold">
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
                <RestaurantCard
                  key={restaurant._id}
                  restaurant={restaurant}
                  onClick={() => router.push(`/restaurants/${restaurant._id}`)}
                />
              ))
            ) : (
              <p className="text-center text-on-surface-variant col-span-3 py-8">
                No restaurants available.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Download App Section */}
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
              <button className="bg-on-primary text-primary px-xl py-md rounded-xl font-bold flex items-center justify-center gap-sm hover:bg-surface-container transition-colors cursor-pointer">
                <Apple className="w-5 h-5" />
                <span>App Store</span>
              </button>
              <button className="bg-on-primary text-primary px-xl py-md rounded-xl font-bold flex items-center justify-center gap-sm hover:bg-surface-container transition-colors cursor-pointer">
                <Smartphone className="w-5 h-5" />
                <span>Google Play</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Reusable Customer Footer */}
      <CustomerFooter />
    </div>
  );
}
