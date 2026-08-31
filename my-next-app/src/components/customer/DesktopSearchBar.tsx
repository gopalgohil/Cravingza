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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const query = searchVal.trim();
    if (query.length >= 3) {
      params.set("search", query);
      router.push(`/home?${params.toString()}`, { scroll: false });
    } else if (query.length === 0) {
      params.delete("search");
      const queryString = params.toString();
      router.push(`/home${queryString ? `?${queryString}` : ""}`, { scroll: false });
    }
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      className="hidden md:flex flex-1 max-w-md bg-surface-container-lowest border border-outline-variant hover:border-outline rounded-xl items-center px-md py-1.5 gap-sm transition-all duration-300 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 shadow-sm focus-within:shadow"
    >
      <input
        type="text"
        value={searchVal}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => setSearchVal(e.target.value)}
        placeholder="Search restaurants, cuisines..."
        className="w-full bg-transparent border-none text-body-md font-body-md placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-0"
      />
      <button
        type="submit"
        className="flex items-center justify-center p-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
        title="Search"
      >
        <span className="material-symbols-outlined text-lg">search</span>
      </button>
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
