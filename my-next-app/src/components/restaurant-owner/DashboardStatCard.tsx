"use client";

import React from "react";

export interface DashboardStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgClass?: string;
  badge?: {
    icon?: React.ReactNode;
    label: string;
    colorClass?: string;
  };
}

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  value,
  icon,
  iconBgClass = "bg-green-50 text-green-600 border-green-200/50",
  badge,
}) => {
  return (
    <div className="bg-white p-md rounded-2xl border border-outline-variant/30 shadow-sm flex items-center justify-between">
      <div className="space-y-xs">
        <span className="font-label-md text-label-md text-on-surface-variant font-bold">
          {title}
        </span>
        <h2 className="font-headline-sm text-headline-sm font-black text-on-background">
          {value}
        </h2>
        {badge && (
          <span className={`flex items-center gap-1 text-caption font-bold ${badge.colorClass || "text-green-600"}`}>
            {badge.icon}
            <span>{badge.label}</span>
          </span>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${iconBgClass}`}>
        {icon}
      </div>
    </div>
  );
};

export default DashboardStatCard;
