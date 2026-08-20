"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
  useUpdatePasswordMutation,
} from "@/lib/redux/apiSlice";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "commission" | "security">("general");

  const { data: response, isLoading } = useGetAdminSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateAdminSettingsMutation();
  const [updatePassword, { isLoading: isPassSaving }] = useUpdatePasswordMutation();

  // General Settings State
  const [platformName, setPlatformName] = useState("Cravingza");
  const [supportEmail, setSupportEmail] = useState("support@cravingza.com");
  const [supportPhone, setSupportPhone] = useState("+91 98765 43210");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Commission & Fees State
  const [restaurantCommission, setRestaurantCommission] = useState("15");
  const [baseDeliveryFee, setBaseDeliveryFee] = useState("30");
  const [serviceFeePercent, setServiceFeePercent] = useState("5");
  const [taxPercent, setTaxPercent] = useState("5");

  // Populate state when live settings are loaded from MongoDB
  useEffect(() => {
    if (response?.data) {
      const s = response.data;
      if (s.platformName) setPlatformName(s.platformName);
      if (s.supportEmail) setSupportEmail(s.supportEmail);
      if (s.supportPhone) setSupportPhone(s.supportPhone);
      if (typeof s.maintenanceMode === "boolean") setMaintenanceMode(s.maintenanceMode);
      if (s.restaurantCommissionRate !== undefined) setRestaurantCommission(String(s.restaurantCommissionRate));
      if (s.baseDeliveryFee !== undefined) setBaseDeliveryFee(String(s.baseDeliveryFee));
      if (s.serviceFeePercent !== undefined) setServiceFeePercent(String(s.serviceFeePercent));
      if (s.taxPercent !== undefined) setTaxPercent(String(s.taxPercent));
    }
  }, [response]);

  // Security State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    try {
      await updateSettings({
        platformName: platformName.trim() || "Cravingza",
        supportEmail: supportEmail.trim() || "support@cravingza.com",
        supportPhone: supportPhone.trim() || "+91 98765 43210",
        maintenanceMode,
        restaurantCommissionRate: isNaN(Number(restaurantCommission)) ? 15 : Number(restaurantCommission),
        baseDeliveryFee: isNaN(Number(baseDeliveryFee)) ? 30 : Number(baseDeliveryFee),
        serviceFeePercent: isNaN(Number(serviceFeePercent)) ? 5 : Number(serviceFeePercent),
        taxPercent: isNaN(Number(taxPercent)) ? 5 : Number(taxPercent),
      }).unwrap();

      toast.success("System settings updated & saved successfully!", { id: "admin-settings-toast" });
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      toast.error(err?.data?.message || "Failed to save settings", { id: "admin-settings-toast" });
    }
  };

  const handleToggleMaintenance = async () => {
    if (isSaving) return;
    const newMode = !maintenanceMode;
    setMaintenanceMode(newMode);
    try {
      await updateSettings({
        platformName: platformName.trim() || "Cravingza",
        supportEmail: supportEmail.trim() || "support@cravingza.com",
        supportPhone: supportPhone.trim() || "+91 98765 43210",
        maintenanceMode: newMode,
        restaurantCommissionRate: isNaN(Number(restaurantCommission)) ? 15 : Number(restaurantCommission),
        baseDeliveryFee: isNaN(Number(baseDeliveryFee)) ? 30 : Number(baseDeliveryFee),
        serviceFeePercent: isNaN(Number(serviceFeePercent)) ? 5 : Number(serviceFeePercent),
        taxPercent: isNaN(Number(taxPercent)) ? 5 : Number(taxPercent),
      }).unwrap();

      toast.success(newMode ? "Maintenance Mode Enabled!" : "Maintenance Mode Disabled!", { id: "admin-settings-toast" });
    } catch (err: any) {
      setMaintenanceMode(!newMode); // Revert state on failure
      console.error("Failed to update maintenance mode:", err);
      toast.error(err?.data?.message || "Failed to update maintenance mode", { id: "admin-settings-toast" });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Please enter current password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    try {
      const res = await updatePassword({ currentPassword, newPassword }).unwrap();
      toast.success(res?.message || "Admin password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Failed to update password:", err);
      toast.error(err?.data?.message || "Failed to update password. Incorrect current password.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="font-extrabold text-2xl md:text-3xl text-slate-800 tracking-tight">Admin Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Configure platform rules, commission rates, and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Online
          </span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 bg-white px-4 pt-3 rounded-2xl border border-slate-100 shadow-xs">
        {[
          { id: "general", label: "General & Platform", icon: "tune" },
          { id: "commission", label: "Commission & Fees", icon: "percent" },
          { id: "security", label: "Security", icon: "shield" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: General & Platform */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="font-bold text-lg text-slate-800">Platform Settings</h2>
            <p className="text-xs text-slate-500">Manage basic application info and operational status</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Platform Name</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Support Phone</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-200/60">
              <div>
                <span className="font-bold text-amber-900 text-sm">Maintenance Mode</span>
                <p className="text-xs text-amber-700 mt-0.5">Temporarily pause new customer orders on the platform</p>
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleToggleMaintenance}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                  maintenanceMode ? "bg-amber-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    maintenanceMode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? <span className="material-symbols-outlined text-lg animate-spin">autorenew</span> : <span className="material-symbols-outlined text-lg">save</span>}
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Commission & Fees */}
      {activeTab === "commission" && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="font-bold text-lg text-slate-800">Commission & Platform Rates</h2>
            <p className="text-xs text-slate-500">Configure global rates for restaurant partners, deliveries, and taxes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <span className="material-symbols-outlined text-xl">storefront</span>
                Restaurant Commission Rate
              </div>
              <p className="text-xs text-slate-500">Percentage deducted per completed order from restaurants</p>
              <div className="relative pt-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={restaurantCommission}
                  onChange={(e) => setRestaurantCommission(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 pr-10 focus:outline-none focus:border-primary"
                />
                <span className="absolute right-4 top-5 font-bold text-slate-400">%</span>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <span className="material-symbols-outlined text-xl">moped</span>
                Base Delivery Fee
              </div>
              <p className="text-xs text-slate-500">Standard starting delivery fee charged to customers</p>
              <div className="relative pt-2">
                <span className="absolute left-4 top-5 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  value={baseDeliveryFee}
                  onChange={(e) => setBaseDeliveryFee(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <span className="material-symbols-outlined text-xl">receipt_long</span>
                Service Charge Rate
              </div>
              <p className="text-xs text-slate-500">Customer platform convenience fee percentage</p>
              <div className="relative pt-2">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={serviceFeePercent}
                  onChange={(e) => setServiceFeePercent(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 pr-10 focus:outline-none focus:border-primary"
                />
                <span className="absolute right-4 top-5 font-bold text-slate-400">%</span>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                GST / Tax Ratio
              </div>
              <p className="text-xs text-slate-500">Applicable tax rate included in invoice calculation</p>
              <div className="relative pt-2">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 pr-10 focus:outline-none focus:border-primary"
                />
                <span className="absolute right-4 top-5 font-bold text-slate-400">%</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? <span className="material-symbols-outlined text-lg animate-spin">autorenew</span> : <span className="material-symbols-outlined text-lg">save</span>}
              Save Commission Rates
            </button>
          </div>
        </form>
      )}



      {/* Tab 4: Security */}
      {activeTab === "security" && (
        <form onSubmit={handlePasswordChange} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="font-bold text-lg text-slate-800">Admin Account & Security</h2>
            <p className="text-xs text-slate-500">Update admin password and manage authentication settings</p>
          </div>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">New Password</label>
              <input
                type="password"
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isPassSaving}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
            >
              {isPassSaving ? <span className="material-symbols-outlined text-lg animate-spin">autorenew</span> : <span className="material-symbols-outlined text-lg">lock_reset</span>}
              Update Password
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
