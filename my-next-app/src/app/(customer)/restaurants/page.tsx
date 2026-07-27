"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RestaurantsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home");
  }, [router]);

  return <div className="py-12 text-center text-on-surface-variant">Redirecting to home...</div>;
}
