"use client";

import { useState, useEffect } from "react";
import { useSubscribePushMutation } from "@/lib/redux/apiSlice";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribePushMutation] = useSubscribePushMutation();

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }
  }, []);

  const enableNotifications = async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Push notifications are not supported by this browser.");
      setPermission("unsupported");
      return;
    }

    try {
      setIsSubscribing(true);
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        toast.error("Notification permission was denied.");
        setIsSubscribing(false);
        return;
      }

      // Register Service Worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BBm3KR9GQffm2hEsYvl7vLuTybEEMawm45mWOGBr-3xr1OtGJeTEUyxoWbwP0pPC_TroNmYAoI2XRPbLowFeSBA";
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // Send subscription to backend
      await subscribePushMutation(subscription.toJSON()).unwrap();
      toast.success("Web push notifications enabled successfully!");
    } catch (err: any) {
      console.error("Failed to subscribe to push notifications:", err);
      toast.error(err.data?.message || err.message || "Failed to enable notifications.");
    } finally {
      setIsSubscribing(false);
    }
  };

  return {
    permission,
    isSubscribing,
    enableNotifications,
  };
}
