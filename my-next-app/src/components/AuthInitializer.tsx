"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export default function AuthInitializer() {
  const { setUser, setAuthChecked } = useAppStore();

  useEffect(() => {
    // Rehydrate cached user from localStorage on client mount to avoid hydration mismatch
    try {
      const cachedUser = localStorage.getItem("cravingza_user");
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      }
    } catch {
      // Ignore JSON parse error
    }

    async function checkAuth() {
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
          // If not ok (e.g. 401), user is not logged in
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to check auth state:", err);
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    }
    checkAuth();
  }, [setUser, setAuthChecked]);

  return null;
}
