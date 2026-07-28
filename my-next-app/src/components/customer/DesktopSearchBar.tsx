"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

function SearchBarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamVal = searchParams.get("search") || "";

  const [searchVal, setSearchVal] = useState(searchParamVal);
  const [isFocused, setIsFocused] = useState(false);

  // Sync state with URL query parameter when pathname or URL changes,
  // but ONLY when the input is NOT focused to prevent overwriting user typing.
  useEffect(() => {
    if (!isFocused) {
      setSearchVal(searchParamVal);
    }
  }, [pathname, searchParamVal, isFocused]);

  // Handle debounced search routing as user types
  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    const cleanSearch = searchVal.trim();

    if (cleanSearch === currentSearch) return;

    if (cleanSearch === "") {
      // Clear search instantly if input is empty
      const params = new URLSearchParams(searchParams.toString());
      params.delete("search");
      const queryString = params.toString();
      const newUrl = `/home${queryString ? `?${queryString}` : ""}`;
      router.push(newUrl);
    } else {
      // Debounce user keystrokes
      const handler = setTimeout(() => {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set("search", cleanSearch);
        const newUrl = `/home?${newParams.toString()}`;
        router.push(newUrl);
      }, 250);
      return () => clearTimeout(handler);
    }
  }, [searchVal, router, searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const cleanSearch = searchVal.trim();
    if (cleanSearch) {
      params.set("search", cleanSearch);
      router.push(`/home?${params.toString()}`);
    } else {
      params.delete("search");
      const queryString = params.toString();
      router.push(`/home${queryString ? `?${queryString}` : ""}`);
    }
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      className="hidden md:flex flex-1 max-w-md bg-surface-container-lowest border border-outline-variant hover:border-outline rounded-xl items-center px-md py-2 gap-sm transition-all duration-300 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 shadow-sm focus-within:shadow"
    >
      <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
      <input
        type="text"
        value={searchVal}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => setSearchVal(e.target.value)}
        placeholder="Search restaurants, cuisines..."
        className="w-full bg-transparent border-none text-body-md font-body-md placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-0"
      />
    </form>
  );
}

export default function DesktopSearchBar() {
  return (
    <Suspense fallback={
      <div className="hidden md:flex flex-1 max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl items-center px-md py-2 gap-sm shadow-sm opacity-60">
        <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
        <input
          type="text"
          disabled
          placeholder="Search restaurants, cuisines..."
          className="w-full bg-transparent border-none text-body-md font-body-md placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-0"
        />
      </div>
    }>
      <SearchBarContent />
    </Suspense>
  );
}
