"use client";

import React from "react";

export default function CommissionSettingsPage() {
  return (
    <div className="space-y-lg max-w-xl">
      <div className="bg-white p-xl rounded-xl login-card-shadow border border-outline-variant/30 text-center space-y-md">
        <div className="w-16 h-16 bg-primary-container/10 text-primary rounded-full flex items-center justify-center mx-auto mb-md">
          <span className="material-symbols-outlined text-4xl">settings_suggest</span>
        </div>
        <h1 className="font-headline-md text-headline-md text-on-background">Commission Settings</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Adjust restaurant commission percentages, delivery base rates, service fees, and tax ratios.
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
