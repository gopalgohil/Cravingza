"use client";

import React, { use } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ActiveDeliveryPage({ params }: PageProps) {
  const { id } = use(params);

  return (
    <div className="max-w-xl mx-auto space-y-lg py-12">
      <div className="bg-white p-xl rounded-xl login-card-shadow border border-outline-variant/30 text-center space-y-md">
        <div className="w-16 h-16 bg-primary-container/10 text-primary rounded-full flex items-center justify-center mx-auto mb-md">
          <span className="material-symbols-outlined text-4xl">navigation</span>
        </div>
        <h1 className="font-headline-md text-headline-md text-on-background">Active Delivery: #{id}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Navigate to restaurant, confirm order pickup, and guide transit to customer address.
        </p>
        <div className="pt-md">
          <span className="font-caption text-caption text-primary bg-primary-container/10 px-md py-sm rounded-full font-bold">
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  );
}
