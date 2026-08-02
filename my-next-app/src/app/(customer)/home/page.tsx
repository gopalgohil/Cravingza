"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import CategoryTab from "@/components/customer/CategoryTab";
import { useGetRestaurantsQuery } from "@/lib/redux/apiSlice";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "";
  const urlSearch = searchParams.get("search") || "";
  const focusSearch = searchParams.get("focus") === "search";
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<string>("");
  const [selectedSort, setSelectedSort] = useState<string>("rating");

  // Focus mobile search input once on mount if focus=search is in URL
  useEffect(() => {
    if (focusSearch && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [focusSearch]);

  // Keep searchQuery in sync with URL search parameter when URL changes and input is not focused
  useEffect(() => {
    if (!isFocused) {
      setSearchQuery(urlSearch);
    }
  }, [urlSearch, isFocused]);

  // Sync mobile input debounced search back to the URL search param
  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth >= 768) return;

    const params = new URLSearchParams(searchParams.toString());
    const currentSearch = params.get("search") || "";
    
    // Determine effective target search string based on the 3-character threshold
    const targetSearch = searchQuery.trim().length >= 3 ? searchQuery.trim() : "";

    if (targetSearch === currentSearch) return;

    if (targetSearch === "") {
      params.delete("search");
      const queryString = params.toString();
      router.replace(`/home${queryString ? `?${queryString}` : ""}`, { scroll: false });
    } else {
      const handler = setTimeout(() => {
        if (searchQuery.trim().length < 3) return;
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set("search", searchQuery.trim());
        router.replace(`/home?${newParams.toString()}`, { scroll: false });
      }, 350);
      return () => clearTimeout(handler);
    }
  }, [searchQuery, router, searchParams]);

  const [isCategoryLoading, setIsCategoryLoading] = useState(false);

  // Compute effective active search query to send to backend
  // On mobile when input is focused: use live searchQuery (so backspace clears results immediately)
  // Otherwise: fallback to URL param (handles desktop & unfocused state)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const activeSearchQuery = isFocused && isMobile
    ? (searchQuery.trim().length >= 3 ? searchQuery.trim() : "")
    : (urlSearch.trim().length >= 3 ? urlSearch.trim() : "");

  // Fetch restaurants from MongoDB using RTK Query
  const { data: response, isLoading, isFetching, isError } = useGetRestaurantsQuery({
    cuisine: activeCategory,
    search: activeSearchQuery.length >= 3 ? activeSearchQuery : "",
    sort: selectedSort,
  });

  const restaurants = response?.data || [];

  // Price mapping based on minOrderAmount
  // $ <= 10, $$ <= 15, $$$ > 15
  const filteredRestaurants = restaurants.filter((restaurant: any) => {
    if (!selectedPrice) return true;
    const minOrder = restaurant.minOrderAmount || 0;
    if (selectedPrice === "$") return minOrder <= 10;
    if (selectedPrice === "$$") return minOrder > 10 && minOrder <= 15;
    if (selectedPrice === "$$$") return minOrder > 15;
    return true;
  });

  // Pagination Settings (9 Restaurants per page)
  const RESTAURANTS_PER_PAGE = 9;
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageChanging, setIsPageChanging] = useState(false);

  // Reset pagination when category, search, price, or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, activeSearchQuery, selectedPrice, selectedSort]);

  const totalPages = Math.ceil(filteredRestaurants.length / RESTAURANTS_PER_PAGE) || 1;

  const paginatedRestaurants = React.useMemo(() => {
    const startIndex = (currentPage - 1) * RESTAURANTS_PER_PAGE;
    return filteredRestaurants.slice(startIndex, startIndex + RESTAURANTS_PER_PAGE);
  }, [filteredRestaurants, currentPage]);

  const handlePageChange = (newPage: number) => {
    setIsPageChanging(true);
    setCurrentPage(newPage);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 300, behavior: "smooth" });
    }
    setTimeout(() => {
      setIsPageChanging(false);
    }, 250);
  };

  // Categories list matching layout.html
  const categories = [
    {
      id: "all",
      label: "All",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&auto=format&fit=crop&q=60",
    },
    {
      id: "pizza",
      label: "Pizza",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop&q=60",
    },
    {
      id: "burgers",
      label: "Burgers",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=60",
    },
    {
      id: "curry",
      label: "Indian",
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&auto=format&fit=crop&q=60",
    },
    {
      id: "desserts",
      label: "Desserts",
      image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&auto=format&fit=crop&q=60",
    },
    {
      id: "healthy",
      label: "Healthy",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&auto=format&fit=crop&q=60",
    },
  ];

  const toggleCategory = (catId: string) => {
    setIsCategoryLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    if (catId === "all" || activeCategory === catId) {
      params.delete("category");
    } else {
      params.set("category", catId);
    }
    router.push(`/home?${params.toString()}`, { scroll: false });
    setTimeout(() => {
      setIsCategoryLoading(false);
    }, 450);
  };

  const handleMobileSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const query = searchQuery.trim();
    if (query.length >= 3) {
      params.set("search", query);
    } else {
      params.delete("search");
    }
    const queryString = params.toString();
    router.replace(`/home${queryString ? `?${queryString}` : ""}`, { scroll: false });
  };

  return (
    <div className="space-y-xl">
      {/* Mobile Search - Visible only on mobile when focused */}
      <div className="md:hidden block mb-md">
        <form
          onSubmit={handleMobileSearchSubmit}
          className="flex bg-white border border-outline-variant rounded-xl items-center px-md py-3 gap-sm shadow-sm"
        >
          <span className="material-symbols-outlined text-on-surface-variant">search</span>
          <input
            ref={mobileInputRef}
            type="text"
            value={searchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search restaurants, cuisines..."
            className="w-full bg-transparent border-none text-body-md font-body-md placeholder:text-on-surface-variant focus:outline-none focus:ring-0"
          />
        </form>
      </div>

      {/* Category Chips Carousel */}
      <section className="space-y-md">
        <h2 className="font-headline-sm text-headline-sm text-on-background">What are you craving?</h2>
        <div className="flex gap-md overflow-x-auto pb-2 scrollbar-hide -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0">
          {categories.map((cat) => (
            <CategoryTab
              key={cat.id}
              id={cat.id}
              label={cat.label}
              image={cat.image}
              isSelected={cat.id === "all" ? !activeCategory : activeCategory === cat.id}
              onClick={() => toggleCategory(cat.id)}
            />
          ))}
        </div>
      </section>

      {/* Toolbar / Filters */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md py-3 border-b border-outline-variant">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-headline-sm text-headline-sm text-on-background">
              {activeCategory
                ? `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} spots`
                : "All Restaurants"}
            </h2>
            {activeCategory && (
              <button
                onClick={() => toggleCategory("all")}
                className="flex items-center gap-1 text-xs text-primary font-bold bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-full cursor-pointer transition-all active:scale-95 shadow-xs"
                title="Show all restaurants"
              >
                <span>Show All</span>
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
          <p className="font-caption text-caption text-on-surface-variant">
            {isLoading ? "Loading..." : `${filteredRestaurants.length} restaurants available`}
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-hide py-1 w-full sm:w-auto flex-nowrap sm:flex-wrap -mx-margin-mobile px-margin-mobile sm:mx-0 sm:px-0">
          {/* Price Filters */}
          <div className="relative shrink-0">
            <select
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-1.5 sm:px-md sm:py-2 border border-outline-variant/80 rounded-full sm:rounded-xl bg-white text-xs sm:text-body-md font-semibold text-on-surface-variant focus:outline-none cursor-pointer shrink-0 transition-all shadow-2xs hover:border-outline"
            >
              <option value="">All Prices</option>
              <option value="$">₹ (Low Min Order)</option>
              <option value="$$">₹ (Medium Min Order)</option>
              <option value="$$$">₹ (High Min Order)</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Sort options */}
          <div className="relative shrink-0">
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-1.5 sm:px-md sm:py-2 border border-outline-variant/80 rounded-full sm:rounded-xl bg-white text-xs sm:text-body-md font-semibold text-on-surface-variant focus:outline-none cursor-pointer shrink-0 transition-all shadow-2xs hover:border-outline"
            >
              <option value="rating">Top Rated</option>
              <option value="deliveryTime">Delivery Speed</option>
              <option value="deliveryFee">Low Delivery Fee</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant pointer-events-none">
              expand_more
            </span>
          </div>
        </div>
      </section>

      {/* Restaurants List */}
      {isLoading && restaurants.length === 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          {[...Array(9)].map((_, idx) => (
            <div
              key={idx}
              className="bg-surface rounded-xl overflow-hidden border border-outline-variant/35 p-0 flex flex-col h-full animate-pulse shadow-xs"
            >
              <div className="aspect-video bg-slate-200 w-full"></div>
              <div className="p-lg space-y-md flex-1 bg-white">
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="h-4 bg-slate-200 rounded w-1/3 pt-2"></div>
              </div>
            </div>
          ))}
        </section>
      ) : isError ? (
        <section className="text-center py-16 space-y-md">
          <span className="material-symbols-outlined text-6xl text-error">error</span>
          <h3 className="font-headline-sm text-headline-sm">Error Loading Restaurants</h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mx-auto">
            Unable to connect to the backend API. Please make sure the backend is running.
          </p>
        </section>
      ) : filteredRestaurants.length > 0 ? (
        <section className={`space-y-8 transition-opacity duration-200 ${isFetching || isCategoryLoading || isPageChanging ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {paginatedRestaurants.map((restaurant: any) => (
              <Link
                href={`/restaurants/${restaurant._id}`}
                key={restaurant._id}
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
                      {restaurant.cuisineTags?.join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-sm mt-md">
                    <span className="material-symbols-outlined text-on-surface-variant text-body-md">schedule</span>
                    <span className="font-caption text-caption text-on-surface-variant">
                      {restaurant.deliveryTime} • {restaurant.deliveryFee === 0 ? "Free delivery" : `₹${Math.round(restaurant.deliveryFee)} delivery`}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-outline-variant/30 shadow-sm mt-8">
            <p className="text-body-sm text-on-surface-variant font-medium">
              Showing <span className="font-bold text-on-background">{Math.min((currentPage - 1) * RESTAURANTS_PER_PAGE + 1, filteredRestaurants.length)}</span> to{" "}
              <span className="font-bold text-on-background">{Math.min(currentPage * RESTAURANTS_PER_PAGE, filteredRestaurants.length)}</span> of{" "}
              <span className="font-bold text-primary">{filteredRestaurants.length}</span> restaurants
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-background font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center"
                title="Previous Page"
              >
                <span className="material-symbols-outlined text-sm font-bold">chevron_left</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-9 h-9 rounded-xl font-bold text-body-sm transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-background font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center"
                title="Next Page"
              >
                <span className="material-symbols-outlined text-sm font-bold">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="text-center py-16 space-y-md">
          <span className="material-symbols-outlined text-6xl text-primary animate-pulse">search_off</span>
          <h3 className="font-headline-sm text-headline-sm text-on-background">
            {activeSearchQuery ? `No restaurants found for "${activeSearchQuery}"` : "No spots found"}
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mx-auto">
            {activeSearchQuery ? (
              <>
                Please check the spelling of your query or try browsing other <span className="text-primary font-semibold hover:underline cursor-pointer" onClick={() => router.push('/home')}>categories</span> instead.
              </>
            ) : (
              "Try adjusting your search query, price point, or category filter to find something tasty."
            )}
          </p>
        </section>
      )}
    </div>
  );
}

export default function CustomerHomePage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-on-surface-variant">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
