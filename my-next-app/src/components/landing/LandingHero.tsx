"use client";

import React from "react";
import { ArrowRight, Utensils } from "lucide-react";

export interface LandingHeroProps {
  onOrderNow: () => void;
  onExplore: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onOrderNow, onExplore }) => {
  return (
    <header className="relative w-full overflow-hidden bg-surface">
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center opacity-40"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB-qhe5HbLua3OLwiNFuRkkVjnA_ERkfowzvmWC_lPYkJFYWYlY378SIdsKWnbtvsa77uW5GkN5pJEiMNSQT7fC798vmNSDjZa9JaoxUbl8Hi3lYidS2oXph16Fap0lqnXJuzGtaxlv5Lx0IAQBUr28IPrdawRWKsOr-tacZLIUsjzFfwnjMjWAAyNr-YmFa3ZEZk-QBuX7CRtdmsfIlcxDJjo1_BjeraHDFRDjV7nNBjg_zsJvJwFPZQ')",
          }}
        />
        <div className="absolute inset-0 hero-gradient"></div>
      </div>
      <div className="relative z-10 max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-24 md:py-32 flex flex-col items-start gap-xl">
        <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg max-w-2xl text-on-background">
          Order food you'll crave, delivered fast
        </h1>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-md w-full max-w-2xl">
          <button
            type="button"
            onClick={onOrderNow}
            className="bg-primary-container text-on-primary font-headline-sm text-headline-sm px-xl py-md rounded-xl active:scale-95 transition-all hover:brightness-110 cursor-pointer shadow-md text-center flex items-center justify-center gap-xs"
          >
            <span>Order Now</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onExplore}
            className="border-2 border-outline-variant text-on-surface bg-surface font-headline-sm text-headline-sm px-xl py-md rounded-xl active:scale-95 transition-all hover:bg-surface-container cursor-pointer text-center flex items-center justify-center gap-xs"
          >
            <Utensils className="w-5 h-5" />
            <span>Explore Restaurants</span>
          </button>
        </div>

        {/* Social Proof */}
        <div className="flex items-center gap-md">
          <div className="flex -space-x-3">
            <img
              className="w-10 h-10 rounded-full border-2 border-surface object-cover"
              alt="User 1"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvxn7rx0FU0TCQcLko4Iog24-oTKOAEW0L31JYUYO_9A-diass2I0IYsMlegLZWv1ELD1xYWNWYzBy9Zh_ze7KuKY_N6qLzr8pxlNwcgIgk7dzB3KuLp_Td0elHlo47SAboz44XnmFSjsOuGRLqS4my_reCFAwgOnroGRirJ2eoeBOPSjL2Lys8KGShYUf0s0u5VBPMjLvl9irifbMotx3W3gdcAr60euyzTCcdtBREJErfTVwql-i3g"
            />
            <img
              className="w-10 h-10 rounded-full border-2 border-surface object-cover"
              alt="User 2"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC41weDk6WYoOOnHys8b8xG1R1iMksGK8Mnao02iqbf7HoZDdG9m8Ox1hFcyjeAmZV08Wu7StBDIkoYgLsLBs7oD3Oj5DBkU39XOQgFiczTNYpQy4JHdRLsL9kSKicGsnITFQgLDgR-3sTcMTWpTB-kU2Vgh3D21wkIJ2nkcAdhN9KcEFbZcD0-X9J7-MnWGEZpoNFcFzn8cmKMXH_LmSpxM16JeKBQdjEm6NhhAXPZnCMDE4EDmJOy3A"
            />
            <img
              className="w-10 h-10 rounded-full border-2 border-surface object-cover"
              alt="User 3"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6W7SHNgVPXYx_fuxMDCAOTUh-rG2uMHhRujDrdES4RJ0PStFwIqzbKE66QTrPEQ55bReceEe2KM7ixDbnd9h9bE8PMi391XUEksc4Ul9_z0495GMBmO2CCdetVBFJZSXH4vKz0JJlEKyqDi7e0TRop0JOtKrUroGAI44q5QDfV8QI5bhOexWez3f8tftxSWKqUSDiVCijneooBsybAP7gfB9PfDgFEY784jrABolLKHBqjfWoYGsUGQ"
            />
          </div>
          <span className="font-caption text-caption text-on-surface-variant">
            Trusted by 50,000+ hungry locals
          </span>
        </div>
      </div>
    </header>
  );
};

export default LandingHero;
