"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import ProfileMenu from "@/components/ProfileMenu";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { useGetCartQuery } from "@/lib/redux/apiSlice";
import ConflictModal from "@/components/customer/ConflictModal";
import DesktopSearchBar from "@/components/customer/DesktopSearchBar";
import PageLoader from "@/components/PageLoader";
import CustomerFooter from "@/components/customer/Footer";
import NotificationMenu from "@/components/customer/NotificationMenu";

import { showAttractiveAuthToast } from "@/lib/authToast";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAppStore();
  const [mounted, setMounted] = useState(false);
  // pageReady: false during the very first render after a reload/refresh
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Small delay lets React finish hydration so skeleton feels intentional
    const t = setTimeout(() => setPageReady(true), 600);
    return () => clearTimeout(t);
  }, []);

  // Auto-fetch cart from database if user is authenticated
  useGetCartQuery(undefined, { skip: !user });

  const reduxCart = useSelector((state: RootState) => state.cart.items);
  const cartCount = reduxCart.reduce((acc, item) => acc + item.quantity, 0);


  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      {/* Sticky Top Navbar for Desktop */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/40 w-full transition-all duration-300">
        <div className="w-full px-margin-mobile md:px-margin-desktop py-3.5 flex items-center justify-between gap-md">
          {/* Logo & Icon */}
          <div className="flex items-center gap-lg flex-shrink-0">
            <Link href="/home" className="flex items-center gap-2 group">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-orange-500 flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-lg font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
              </span>
              <span className="font-headline-md text-headline-md font-extrabold bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent tracking-tight">
                Cravingza
              </span>
            </Link>
          </div>

          {/* Search Bar - Desktop (Only shown on home page) */}
          {pathname === "/home" ? (
            <DesktopSearchBar />
          ) : (
            <div className="flex-1 max-w-md hidden md:block" />
          )}

          {/* Nav Links & Cart */}
          <div className="flex items-center gap-4">
            
            {/* Offers Button */}
            <Link
              href="/offers"
              className={`font-label-md text-label-md px-4 py-2.5 rounded-xl active:scale-95 transition-all hidden md:flex items-center gap-2 cursor-pointer ${
                pathname === "/offers"
                  ? "bg-primary text-white font-bold shadow-sm"
                  : "text-on-surface hover:text-primary hover:bg-primary/5"
              }`}
            >
              <span className="material-symbols-outlined text-lg">local_offer</span>
              <span>Offers</span>
            </Link>

            {/* Cart Button */}
            <Link
              href="/cart"
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  showAttractiveAuthToast(
                    router,
                    "Sign in to View Cart",
                    "Create an account or log in to view your cart & place an order!"
                  );
                }
              }}
              className="relative w-10 h-10 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/95 hover:to-orange-500/95 text-white rounded-xl active:scale-95 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 hidden md:flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>

            {user && <NotificationMenu />}

            <ProfileMenu />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-lg pb-24 md:pb-lg">
        {!pageReady ? <PageLoader /> : children}
      </main>

      {/* Customer Footer */}
      <CustomerFooter />

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-outline-variant z-50 flex justify-around items-center py-2 shadow-lg">
        <Link
          href="/home"
          className={`flex flex-col items-center gap-0.5 text-xs ${
            pathname === "/home" ? "text-primary font-bold" : "text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined">explore</span>
          <span>Browse</span>
        </Link>
        
        <Link
          href="/home?focus=search"
          className={`flex flex-col items-center gap-0.5 text-xs ${
            pathname.includes("search") ? "text-primary font-bold" : "text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined">search</span>
          <span>Search</span>
        </Link>

        <Link
          href="/cart"
          onClick={(e) => {
            if (!user) {
              e.preventDefault();
              showAttractiveAuthToast(
                router,
                "Sign in to View Cart",
                "Create an account or log in to view your cart & place an order!"
              );
            }
          }}
          className={`relative flex flex-col items-center gap-0.5 text-xs ${
            pathname === "/cart" ? "text-primary font-bold" : "text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined">shopping_cart</span>
          <span>Cart</span>
          {mounted && cartCount > 0 && (
            <span className="absolute top-0 right-1 bg-primary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>

        <Link
          href="/offers"
          className={`flex flex-col items-center gap-0.5 text-xs ${
            pathname === "/offers" ? "text-primary font-bold" : "text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined">local_offer</span>
          <span>Offers</span>
        </Link>

        <Link
          href="/orders"
          className={`flex flex-col items-center gap-0.5 text-xs ${
            pathname === "/orders" ? "text-primary font-bold" : "text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined">receipt_long</span>
          <span>Orders</span>
        </Link>

        <Link
          href="/profile"
          className={`flex flex-col items-center gap-0.5 text-xs ${
            pathname === "/profile" ? "text-primary font-bold" : "text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined">person</span>
          <span>Profile</span>
        </Link>
      </nav>
      <ConflictModal />
    </div>
  );
}
