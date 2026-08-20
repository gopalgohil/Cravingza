"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  useGetMyApplicationQuery,
  useUpdateRestaurantProfileMutation,
  useUpdateRestaurantStatusMutation,
  useGetPayoutDetailsQuery,
  useUpdatePayoutDetailsMutation,
  useCloseRestaurantPermanentlyMutation,
  useUpdateProfileMutation,
  useUpdatePasswordMutation,
  useUpdateNotificationsMutation,
} from "@/lib/redux/apiSlice";
import { toast } from "sonner";
import { sanitizePhone, isValidPhone } from "@/lib/validators";

export default function RestaurantSettingsPage() {
  const router = useRouter();
  const { user, setUser, clearCart, setAddress } = useAppStore();

  // Fetch restaurant application & details
  const { data: appResponse, isLoading: isAppLoading } = useGetMyApplicationQuery();
  const restaurant = appResponse?.data;

  // RTK Query Mutations
  const [updateProfile, { isLoading: isProfileUpdating }] = useUpdateRestaurantProfileMutation();
  const [updateStatus, { isLoading: isStatusUpdating }] = useUpdateRestaurantStatusMutation();
  const { data: payoutResponse, isLoading: isPayoutLoading } = useGetPayoutDetailsQuery();
  const [updatePayout, { isLoading: isPayoutUpdating }] = useUpdatePayoutDetailsMutation();
  const [closePermanently, { isLoading: isClosing }] = useCloseRestaurantPermanentlyMutation();

  // Owner User Mutations
  const [updateOwnerUser, { isLoading: isOwnerUserUpdating }] = useUpdateProfileMutation();
  const [updateOwnerPassword, { isLoading: isPasswordUpdating }] = useUpdatePasswordMutation();
  const [updateOwnerNotifications, { isLoading: isNotifUpdating }] = useUpdateNotificationsMutation();

  // Local Form States
  // 1. Profile
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cuisineTagsInput, setCuisineTagsInput] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("15-25 min");
  const [deliveryFee, setDeliveryFee] = useState<number | string>(29);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // 2. Status Toggle
  const [isOpen, setIsOpen] = useState(true);

  // 3. Owner Account
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notifications
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotionalOffers, setPromotionalOffers] = useState(true);

  // 4. Payout Details
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");

  // 5. Danger Zone Modal
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closureReason, setClosureReason] = useState("");

  // Populate data when fetched
  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name || "");
      setDescription(restaurant.description || "");
      setCuisineTagsInput((restaurant.cuisineTags || []).join(", "));
      setAddressInput(restaurant.location?.address || "");
      setCoverImageUrl(restaurant.image || "");
      setDeliveryTime(restaurant.deliveryTime || "15-25 min");
      setDeliveryFee(restaurant.deliveryFee !== undefined ? restaurant.deliveryFee : 29);
      setIsOpen(restaurant.isOpen !== undefined ? restaurant.isOpen : true);
    }
  }, [restaurant]);

  useEffect(() => {
    if (user) {
      setOwnerName(user.name || "");
      setOwnerPhone(user.phone || "");
      if (user.notifications) {
        setOrderUpdates(user.notifications.orderUpdates ?? true);
        setPromotionalOffers(user.notifications.promotionalOffers ?? true);
      }
    }
  }, [user]);

  useEffect(() => {
    if (payoutResponse?.data) {
      setAccountHolderName(payoutResponse.data.accountHolderName || "");
      setAccountNumber(payoutResponse.data.accountNumber || "");
      setIfscCode(payoutResponse.data.ifscCode || "");
    }
  }, [payoutResponse]);

  // Handlers
  // Cover Photo Upload Flow
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCover(true);
      const formData = new FormData();
      formData.append("file", file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok && data.url) {
        setCoverImageUrl(data.url);
        toast.success("Cover photo uploaded! Click Save Profile to apply.");
      } else {
        toast.error(data.message || "Failed to upload image.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while uploading cover photo.");
    } finally {
      setIsUploadingCover(false);
    }
  };

  // 1. Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tags = cuisineTagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await updateProfile({
        name,
        description,
        cuisineTags: tags,
        coverImageUrl,
        deliveryTime,
        deliveryFee: Number(deliveryFee) || 0,
      }).unwrap();

      toast.success(res.message || "Restaurant profile updated successfully!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update profile.");
    }
  };

  // 2. Status Toggle
  const handleStatusToggle = async () => {
    const newStatus = !isOpen;
    setIsOpen(newStatus);
    try {
      const res = await updateStatus({ isOpen: newStatus }).unwrap();
      toast.success(res.message);
    } catch (err: any) {
      setIsOpen(!newStatus); // Revert on failure
      toast.error(err?.data?.message || "Failed to toggle status.");
    }
  };

  // 4. Owner Account Update
  const handleSaveOwnerAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneTouched(true);
    if (ownerPhone && !isValidPhone(ownerPhone)) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    try {
      const res = await updateOwnerUser({ name: ownerName, phone: ownerPhone }).unwrap();
      if (res.user) setUser(res.user);
      toast.success("Account profile updated successfully!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update owner profile.");
    }
  };

  // Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    try {
      const res = await updateOwnerPassword({ currentPassword, newPassword }).unwrap();
      toast.success(res.message || "Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to change password.");
    }
  };

  // Notifications
  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateOwnerNotifications({
        orderUpdates,
        promotionalOffers,
        newRestaurantAlerts: false,
      }).unwrap();
      if (res.user) setUser(res.user);
      toast.success("Notification preferences updated!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update notification settings.");
    }
  };

  // 5. Payout Details
  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updatePayout({
        accountHolderName,
        accountNumber,
        ifscCode,
      }).unwrap();

      toast.success(res.message || "Payout details saved!");
      if (res.data?.accountNumber) {
        setAccountNumber(res.data.accountNumber);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save payout details.");
    }
  };

  // 6. Permanent Closure
  const handleClosePermanently = async () => {
    if (!closureReason.trim()) {
      toast.error("Please enter a reason for closing the restaurant.");
      return;
    }
    try {
      const res = await closePermanently({ reason: closureReason }).unwrap();
      toast.success(res.message || "Restaurant permanently closed.");
      setUser(null);
      clearCart();
      setAddress("123 Main Street, City Centre");
      setIsCloseModalOpen(false);
      router.push("/login");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to close restaurant permanently.");
    }
  };

  // Logout flow
  const handleLogout = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok) {
        setUser(null);
        clearCart();
        setAddress("123 Main Street, City Centre");
        router.push("/login");
        toast.success("Signed out successfully.");
      }
    } catch (err) {
      toast.error("Failed to sign out.");
    }
  };

  if (isAppLoading) {
    return (
      <div className="p-xl space-y-md animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-64"></div>
        <div className="h-48 bg-slate-200 rounded-3xl"></div>
        <div className="h-64 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-xl pb-24">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-outline-variant/40">
        <div>
          <h1 className="font-headline-md text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Restaurant & Account Settings
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your store profile, delivery settings, bank payout details, and security.
          </p>
        </div>
      </div>

      {/* ── TOP BANNER: RESTAURANT STATUS TOGGLE CARD ─────────────────────── */}
      <div className={`p-6 rounded-3xl border transition-all shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
        isOpen
          ? "bg-gradient-to-r from-emerald-500/10 via-emerald-50/50 to-white border-emerald-200"
          : "bg-gradient-to-r from-rose-500/10 via-rose-50/50 to-white border-rose-200"
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md ${
            isOpen ? "bg-emerald-500 shadow-emerald-500/20" : "bg-rose-500 shadow-rose-500/20"
          }`}>
            <span className="material-symbols-outlined text-3xl">
              {isOpen ? "storefront" : "store_down"}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? "bg-emerald-500 animate-ping" : "bg-rose-500"}`}></span>
              <span className={`text-xs font-bold uppercase tracking-wider ${isOpen ? "text-emerald-700" : "text-rose-700"}`}>
                {isOpen ? "Store Open — Accepting Orders" : "Store Temporarily Closed"}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              {name || "Your Restaurant"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Toggle this switch if you need to pause incoming orders temporarily during rush hours or emergencies.
            </p>
          </div>
        </div>

        <button
          onClick={handleStatusToggle}
          disabled={isStatusUpdating}
          className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer shrink-0 ${
            isOpen
              ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20"
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
          }`}
        >
          <span className="material-symbols-outlined text-xl">
            {isOpen ? "power_settings_new" : "play_arrow"}
          </span>
          <span>{isOpen ? "Pause Incoming Orders" : "Open Store Now"}</span>
        </button>
      </div>

      {/* ── SECTION 1: RESTAURANT PROFILE ───────────────────────────────────── */}
      <section className="bg-white rounded-3xl border border-outline-variant/40 p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">restaurant</span>
            <div>
              <h2 className="font-headline-sm text-lg font-bold text-slate-900">Restaurant Profile</h2>
              <p className="text-xs text-slate-500">Update your restaurant name, cuisine, address, and cover image.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Cover Image Upload Flow */}
          <div className="space-y-3">
            <label className="block text-xs font-extrabold uppercase text-slate-600 tracking-wider">
              Restaurant Cover Photo
            </label>
            <div className="relative w-full h-48 md:h-56 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 group">
              {coverImageUrl ? (
                <img
                  src={coverImageUrl}
                  alt={name || "Cover"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2">add_photo_alternate</span>
                  <span className="text-xs font-semibold">No cover image uploaded</span>
                </div>
              )}

              <label className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md hover:bg-white text-slate-800 font-bold px-4 py-2 rounded-xl text-xs shadow-md border border-slate-200 transition-all cursor-pointer flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">upload</span>
                <span>{isUploadingCover ? "Uploading..." : "Change Cover Photo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={isUploadingCover}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Restaurant Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Restaurant Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 text-sm font-medium transition-all"
                placeholder="e.g. Burger Boss"
              />
            </div>

            {/* Address (Permanent & Locked) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Full Street Address (Registered)
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <span className="material-symbols-outlined text-xs">lock</span>
                  Locked
                </span>
              </div>
              <input
                type="text"
                value={addressInput}
                disabled
                readOnly
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-medium text-sm outline-none cursor-not-allowed select-none"
                placeholder="Registered Store Address"
              />
              <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">info</span>
                Store address submitted during partner registration is permanent & cannot be edited. Contact Cravingza Support for relocation.
              </p>
            </div>
          </div>

          {/* Estimated Delivery Time */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Estimated Delivery Time
            </label>
            <input
              type="text"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 text-sm font-medium transition-all"
              placeholder="e.g. 15-25 min"
            />
          </div>

          {/* Cuisine Tags */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Cuisine Tags <span className="text-slate-400 font-normal">(Comma separated)</span>
            </label>
            <input
              type="text"
              value={cuisineTagsInput}
              onChange={(e) => setCuisineTagsInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 text-sm font-medium transition-all"
              placeholder="e.g. American, Burgers, Fast Food, Fries"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Description / Bio
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-900 text-sm font-medium transition-all"
              placeholder="Describe your restaurant specials, ingredients, and story..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isProfileUpdating}
              className="bg-primary hover:bg-primary/95 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-primary/20 active:scale-95 text-sm cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">save</span>
              <span>{isProfileUpdating ? "Saving Profile..." : "Save Restaurant Profile"}</span>
            </button>
          </div>
        </form>
      </section>



      {/* ── SECTION 3: ACCOUNT & SECURITY ────────────────────────────────────── */}
      <section className="bg-white rounded-3xl border border-outline-variant/40 p-6 md:p-8 shadow-xs space-y-8">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="material-symbols-outlined text-primary text-2xl">manage_accounts</span>
          <div>
            <h2 className="font-headline-sm text-lg font-bold text-slate-900">Owner Account & Security</h2>
            <p className="text-xs text-slate-500">Update account credentials, password, and order notification alerts.</p>
          </div>
        </div>

        {/* Owner Details */}
        <form onSubmit={handleSaveOwnerAccount} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs text-slate-500">
            Account Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Owner Full Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Owner Phone Number</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center gap-1 text-slate-500 font-bold text-xs pointer-events-none select-none z-10">
                  <span className="material-symbols-outlined text-sm text-primary">call</span>
                  <span className="text-slate-700 font-bold border-r border-slate-300 pr-1.5">+91</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={ownerPhone}
                  onChange={(e) => {
                    setOwnerPhone(sanitizePhone(e.target.value));
                    if (!phoneTouched) setPhoneTouched(true);
                  }}
                  onBlur={() => setPhoneTouched(true)}
                  placeholder="9876543210"
                  className={`w-full pl-16 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                    phoneTouched && ownerPhone.length > 0 && !isValidPhone(ownerPhone)
                      ? "border-red-500 focus:border-red-500"
                      : "border-slate-200 focus:border-primary"
                  }`}
                />
              </div>
              {phoneTouched && ownerPhone.length > 0 && !isValidPhone(ownerPhone) && (
                <span className="text-red-500 text-xs mt-1 block font-semibold">Please enter a valid 10-digit mobile number</span>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isOwnerUserUpdating}
              className="bg-slate-900 hover:bg-black text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
            >
              {isOwnerUserUpdating ? "Updating..." : "Update Owner Profile"}
            </button>
          </div>
        </form>

        <hr className="border-slate-100" />

        {/* Change Password Form (Reuses PATCH /api/user/password) */}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPasswordUpdating}
              className="bg-slate-900 hover:bg-black text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
            >
              {isPasswordUpdating ? "Changing Password..." : "Update Password"}
            </button>
          </div>
        </form>

        <hr className="border-slate-100" />

        {/* Notifications */}
        <form onSubmit={handleSaveNotifications} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Notification Alerts</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={orderUpdates}
                onChange={(e) => setOrderUpdates(e.target.checked)}
                className="w-4 h-4 accent-primary rounded"
              />
              <span className="text-xs font-semibold text-slate-800">
                Receive real-time push & sound alerts for incoming customer orders
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={promotionalOffers}
                onChange={(e) => setPromotionalOffers(e.target.checked)}
                className="w-4 h-4 accent-primary rounded"
              />
              <span className="text-xs font-semibold text-slate-800">
                Receive email summaries of daily revenue and performance analytics
              </span>
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isNotifUpdating}
              className="bg-slate-900 hover:bg-black text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
            >
              {isNotifUpdating ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </form>
      </section>

      {/* ── SECTION 4: PAYOUT DETAILS ───────────────────────────────────────── */}
      <section className="bg-white rounded-3xl border border-outline-variant/40 p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="material-symbols-outlined text-primary text-2xl">account_balance</span>
          <div>
            <h2 className="font-headline-sm text-lg font-bold text-slate-900">Bank Payout Details</h2>
            <p className="text-xs text-slate-500">
              Provide your bank account details for weekly settlement payouts.
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePayout} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Account Holder Name</label>
              <input
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-primary"
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-primary"
                placeholder="Enter account number"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">IFSC Code</label>
              <input
                type="text"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium uppercase outline-none focus:border-primary"
                placeholder="e.g. SBIN0001234"
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 text-xl shrink-0">lock</span>
            <p className="text-xs text-amber-900 font-medium">
              Your account number is securely stored and masked in display (e.g. <span className="font-bold">XXXXXX1234</span>).
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPayoutUpdating}
              className="bg-primary hover:bg-primary/95 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-primary/20 active:scale-95 text-sm cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">verified_user</span>
              <span>{isPayoutUpdating ? "Saving Payout..." : "Save Payout Details"}</span>
            </button>
          </div>
        </form>
      </section>

      {/* ── SECTION 5: DANGER ZONE ───────────────────────────────────────────── */}
      <section className="bg-rose-50/40 rounded-3xl border border-rose-200/80 p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-rose-200/60 pb-4">
          <span className="material-symbols-outlined text-rose-600 text-2xl">warning</span>
          <div>
            <h2 className="font-headline-sm text-lg font-bold text-rose-950">Danger Zone</h2>
            <p className="text-xs text-rose-700">Actions here affect restaurant availability or logout your session.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-rose-200 shadow-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Close Restaurant Permanently</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Permanently hides your restaurant from customer listings. Your past orders, reviews, and menu data remain intact for records.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCloseModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer shrink-0"
          >
            Close Restaurant Permanently
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold px-6 py-2.5 rounded-xl text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base text-slate-600">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </section>

      {/* ── PERMANENT CLOSURE CONFIRMATION MODAL ──────────────────────────────── */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCloseModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-2xl z-50 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-2xl">
              <span className="material-symbols-outlined text-3xl">domain_disabled</span>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900">Close Restaurant Permanently?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This will immediately remove your restaurant from the customer app. You will be logged out and need to contact support if you ever wish to re-open.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Reason for Permanent Closure <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                required
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-rose-500 outline-none"
                placeholder="e.g. Relocating business / Personal reasons..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCloseModalOpen(false)}
                className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClosePermanently}
                disabled={isClosing || !closureReason.trim()}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 active:scale-95 disabled:opacity-50"
              >
                {isClosing ? "Closing..." : "Confirm & Close Store"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
