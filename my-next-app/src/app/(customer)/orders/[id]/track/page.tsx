"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderTrackingPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-md">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-container/10 text-primary mb-2">
        <span className="material-symbols-outlined text-4xl">local_shipping</span>
      </div>
      <h2 className="font-headline-sm text-headline-sm text-on-background">Order Tracking Coming Soon!</h2>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mx-auto">
        Track order #{id} live in real-time, view delivery progress, and contact your rider here.
      </p>
      <div className="pt-md">
        <button
          onClick={() => router.push("/home")}
          className="bg-primary-container text-on-primary font-label-md text-label-md px-xl py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          Back to Browse
        </button>
      </div>
    </div>
  );
}
