"use client";

import React from "react";
import { Search, ShoppingBag, Truck } from "lucide-react";

export interface StepItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const STEPS: StepItem[] = [
  {
    icon: <Search className="w-8 h-8 text-primary" />,
    title: "Browse",
    description: "Explore thousands of local restaurants and global chains near you.",
  },
  {
    icon: <ShoppingBag className="w-8 h-8 text-primary" />,
    title: "Order",
    description: "Add your cravings to the cart and pay securely in seconds.",
  },
  {
    icon: <Truck className="w-8 h-8 text-primary" />,
    title: "Track",
    description: "Follow your delivery in real-time until it arrives at your door.",
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section className="w-full bg-surface-container-lowest py-24">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="text-center mb-16">
          <h2 className="font-headline-md text-headline-md text-on-background mb-base">
            How it works
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Delicious food in just three simple steps
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
          {STEPS.map((step, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-lg rounded-xl hover:bg-surface-container-low transition-colors group"
            >
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-lg group-hover:scale-110 transition-transform">
                {step.icon}
              </div>
              <h3 className="font-headline-sm text-headline-sm mb-sm">{step.title}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
