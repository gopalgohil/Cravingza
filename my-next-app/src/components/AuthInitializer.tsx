"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export default function AuthInitializer() {
  const { setUser, setAuthChecked } = useAppStore();

  useEffect(() => {
    // Step 1: Synchronously rehydrate user from localStorage immediately
    // This avoids 1-2 second flash of skeleton/unauthenticated UI on reload
    let hadCachedUser = false;
    try {
      const cachedUser = localStorage.getItem("cravingza_user");
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
        // Mark auth as checked immediately so UI shows profile right away
        setAuthChecked(true);
        hadCachedUser = true;
      }
    } catch {
      // Ignore JSON parse error
    }

    // Step 2: Verify session with server ONLY if token or cached user exists
    async function checkAuth() {
      const hasToken = typeof window !== "undefined" && Boolean(localStorage.getItem("cravingza_token"));
      if (!hadCachedUser && !hasToken) {
        setUser(null);
        setAuthChecked(true);
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${apiUrl}/auth/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // Crucial: send cookies with request
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.user) {
            setUser(data.data.user);
          } else {
            setUser(null);
          }
        } else {
          // If not ok (e.g. 401), user is not logged in — clear stale cache
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to check auth state:", err);
        // On network error, keep cached user (offline-friendly)
        if (!hadCachedUser) setUser(null);
      } finally {
        setAuthChecked(true);
      }
    }
    checkAuth();
  }, [setUser, setAuthChecked]);

  return null;
}
