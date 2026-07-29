"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useIsTabVisible } from "@/hooks/useIsTabVisible";
import {
  useGetNotificationsListQuery,
  useMarkNotificationsReadMutation,
  useClearNotificationsListMutation,
} from "@/lib/redux/apiSlice";
import { toast } from "sonner";

export default function NotificationMenu() {
  const router = useRouter();
  const { user } = useAppStore();
  const isTabVisible = useIsTabVisible();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevIsTabVisible = useRef(isTabVisible);

  // Poll notifications every 30 seconds (30000ms)
  // Pauses automatically if user is unauthenticated OR tab is not visible
  const { data: response, refetch } = useGetNotificationsListQuery(undefined, {
    skip: !user || !isTabVisible,
    pollingInterval: 30000,
  });

  const [markRead] = useMarkNotificationsReadMutation();
  const [clearList] = useClearNotificationsListMutation();

  const notifications = response?.data || [];
  const unreadCount = response?.unreadCount || 0;

  // Immediate refetch when tab becomes visible again
  useEffect(() => {
    if (isTabVisible && !prevIsTabVisible.current && user) {
      refetch();
    }
    prevIsTabVisible.current = isTabVisible;
  }, [isTabVisible, user, refetch]);

  // Request browser Notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenToggle = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    // Instant manual refetch when bell icon is clicked
    if (user) {
      refetch();
    }

    if (nextState && unreadCount > 0) {
      try {
        await markRead({}).unwrap();
      } catch (err) {
        console.error("Failed to mark notifications read:", err);
      }
    }
  };

  const handleNotificationClick = async (notif: any) => {
    setIsOpen(false);
    if (!notif.isRead) {
      try {
        await markRead({ notificationId: notif._id }).unwrap();
      } catch (err) {}
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await clearList().unwrap();
      toast.success("Notifications cleared");
    } catch (err) {
      toast.error("Failed to clear notifications");
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpenToggle}
        className="relative p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all cursor-pointer select-none active:scale-95 flex items-center justify-center"
        title="Notifications"
      >
        <span className="material-symbols-outlined text-[22px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse border-2 border-white shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="fixed inset-x-4 top-16 max-w-sm mx-auto sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 bg-white rounded-2xl border border-outline-variant shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-outline-variant/60 flex justify-between items-center bg-surface-container-lowest">
            <div className="flex items-center gap-2">
              <span className="font-bold text-on-surface text-body-md">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-primary/10 text-primary font-bold text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-on-surface-variant hover:text-red-500 font-semibold cursor-pointer hover:underline"
              >
                Clear All
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/40">
            {notifications.length > 0 ? (
              notifications.map((notif: any) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex gap-3 items-start transition-all cursor-pointer hover:bg-surface-container-low ${
                    !notif.isRead ? "bg-primary/5 font-medium" : "bg-white"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      notif.title.includes("Cancelled")
                        ? "bg-red-100 text-red-600"
                        : notif.title.includes("Accepted")
                        ? "bg-green-100 text-green-700"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {notif.title.includes("Cancelled")
                        ? "cancel"
                        : notif.title.includes("Accepted")
                        ? "check_circle"
                        : "local_shipping"}
                    </span>
                  </div>

                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex justify-between items-center gap-1">
                      <h5 className="text-body-sm font-bold text-on-surface truncate">
                        {notif.title}
                      </h5>
                      <span className="text-[10px] text-on-surface-variant/70 shrink-0">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-caption text-on-surface-variant line-clamp-2 leading-tight">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center space-y-2 px-4">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">
                  notifications_off
                </span>
                <p className="text-body-sm text-on-surface-variant font-medium">
                  No notifications yet
                </p>
                <p className="text-caption text-on-surface-variant/60">
                  Order updates & important alerts will appear here.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 text-center border-t border-outline-variant/60 bg-surface-container-lowest">
            <Link
              href="/orders"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-primary hover:underline"
            >
              View Order History →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
