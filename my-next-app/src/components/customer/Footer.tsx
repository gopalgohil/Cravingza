"use client";

import React from "react";
import Link from "next/link";

export default function CustomerFooter() {
  return (
    <footer className="w-full mt-auto bg-surface-container-highest border-t border-outline-variant/40 pb-24 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start px-margin-mobile md:px-margin-desktop py-lg md:py-xl max-w-max-width mx-auto gap-lg md:gap-xl">
        <div className="flex flex-col gap-sm md:gap-md max-w-xs">
          <span className="font-headline-sm text-headline-sm text-primary font-bold">Cravingza</span>
          <p className="text-xs sm:text-caption font-caption text-on-surface-variant leading-relaxed">
            Bringing your favorite flavors right to your doorstep. Fast, reliable, and always fresh.
          </p>
          <div className="flex gap-md pt-1 md:pt-0">
            <a href="#" className="text-on-surface-variant hover:text-primary transition-opacity">
              <span className="material-symbols-outlined">face_nod</span>
            </a>
            <a href="#" className="text-on-surface-variant hover:text-primary transition-opacity">
              <span className="material-symbols-outlined">public</span>
            </a>
            <a href="#" className="text-on-surface-variant hover:text-primary transition-opacity">
              <span className="material-symbols-outlined">share</span>
            </a>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-6 md:gap-xl w-full md:w-auto">
          <div className="flex flex-col gap-1.5 sm:gap-sm">
            <span className="text-xs sm:text-label-md font-label-md text-on-background font-bold">Company</span>
            <a className="text-[11px] sm:text-caption font-caption text-on-surface-variant hover:underline transition-all" href="#">
              About Us
            </a>
            <a className="text-[11px] sm:text-caption font-caption text-on-surface-variant hover:underline transition-all" href="#">
              Careers
            </a>
            <Link className="text-[11px] sm:text-caption font-caption text-primary hover:underline font-bold transition-all flex items-center gap-0.5 sm:gap-1" href="/become-partner">
              <span>Partner with Us</span>
              <span className="material-symbols-outlined text-[10px] sm:text-xs">arrow_forward</span>
            </Link>
          </div>
          <div className="flex flex-col gap-1.5 sm:gap-sm">
            <span className="text-xs sm:text-label-md font-label-md text-on-background font-bold">Support</span>
            <a className="text-[11px] sm:text-caption font-caption text-on-surface-variant hover:underline transition-all" href="#">
              Help Center
            </a>
            <a className="text-[11px] sm:text-caption font-caption text-on-surface-variant hover:underline transition-all" href="#">
              Safety
            </a>
            <a className="text-[11px] sm:text-caption font-caption text-on-surface-variant hover:underline transition-all" href="#">
              Terms of Service
            </a>
          </div>
          <div className="flex flex-col gap-1.5 sm:gap-sm">
            <span className="text-xs sm:text-label-md font-label-md text-on-background font-bold">Legal</span>
            <a className="text-[11px] sm:text-caption font-caption text-on-surface-variant hover:underline transition-all" href="#">
              Privacy Policy
            </a>
            <a className="text-[11px] sm:text-caption font-caption text-on-surface-variant hover:underline transition-all" href="#">
              Cookies
            </a>
            <Link className="text-[11px] sm:text-caption font-caption text-on-surface-variant hover:underline transition-all font-medium" href="/cancellation-policy">
              Cancellation & Refunds
            </Link>
          </div>
        </div>
      </div>
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-md md:py-lg border-t border-outline-variant/40 flex flex-col sm:flex-row justify-between items-center gap-sm sm:gap-0">
        <span className="text-[11px] sm:text-caption font-caption text-on-surface-variant text-center sm:text-left">
          © 2024 Cravingza Inc. All rights reserved.
        </span>
        <div className="flex gap-md">
          <img
            className="h-3.5 sm:h-4 opacity-50 grayscale"
            alt="Visa"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuGcFugiiKorAdUCstGkUHLCdhupShhk8XFmmc5SSp_hsqAfTaelRpQpIkiK6nrpysqgMXPrTeRfF9VjiXZWhZNyfdDmugPDSnNOnvX009Dry_IHB2aWx1Zgl9wJcDH1QnzToSPmKJj4ZAUemu-IMvIYiWFjeeFegyOFL6NlRhjlDQWC4JfWDUKhSlJz_JCRS_4A97G--_GRbWHU5xAN4RRugjuVuRXH39bILePV8nEnMMeXkD1EKyjw"
          />
          <img
            className="h-3.5 sm:h-4 opacity-50 grayscale"
            alt="Mastercard"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAysbuTcIG8EWstBOQqZwGJq-Qk9g7tqcR768bFR3dhFlRlL-GbNa6MdMl7zSCm5ryOwYvZonXFOejgmVChFV_jqf-X-UllfgAzXTfsGd9Of2B0qGUZg7hcT7AkIBCdgfpknDJ34XfJLSICP2EDoDzlkwAs1eAtkf8RMzFIz5XZOPpvRxCpejZvtlLxRfmomkFhlkkQPIECaLhQ46YTZIEYcCqiOL-4ZRS_Z4jVsfs-zW8-6HaDYzpNVw"
          />
        </div>
      </div>
    </footer>
  );
}
