"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { sanitizePincode, isValidPincode, sanitizePhone, isValidPhone } from "@/lib/validators";
import {
  useUpdateProfileMutation,
  useUpdatePasswordMutation,
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useUpdateNotificationsMutation,
  useDeleteAccountMutation,
} from "@/lib/redux/apiSlice";
import type { Address, NotificationPreferences } from "@/lib/redux/apiSlice";

// Toggle component
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer ${
        checked ? "bg-primary" : "bg-outline-variant"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// Edit Profile Modal
function EditProfileModal({
  name,
  phone,
  email,
  onClose,
  onSave,
  isLoading,
}: {
  name: string;
  phone: string;
  email: string;
  onClose: () => void;
  onSave: (name: string, phone: string) => void;
  isLoading: boolean;
}) {
  const [tempName, setTempName] = useState(name);
  const [tempPhone, setTempPhone] = useState(sanitizePhone(phone));
  const [phoneTouched, setPhoneTouched] = useState(false);

  const isPhoneInvalid = phoneTouched && tempPhone.length > 0 && !isValidPhone(tempPhone);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneTouched(true);
    if (tempPhone && !isValidPhone(tempPhone)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    onSave(tempName, tempPhone);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Edit Profile</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-all cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">Full Name</label>
            <input
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Your full name"
              className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface bg-surface focus:outline-none focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">Email Address</label>
            <div className="w-full border border-outline-variant/50 rounded-xl px-4 py-2.5 text-on-surface-variant bg-surface-container/50 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-outline-variant">lock</span>
              <span className="text-sm">{email}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">Phone Number</label>
            <div className="relative flex items-center">
              <div className="absolute left-3 flex items-center gap-1 text-on-surface-variant font-bold text-xs pointer-events-none select-none z-10">
                <span className="material-symbols-outlined text-base">call</span>
                <span className="text-slate-700 font-bold border-r border-slate-300 pr-1.5">+91</span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={tempPhone}
                onChange={(e) => {
                  setTempPhone(sanitizePhone(e.target.value));
                  if (!phoneTouched) setPhoneTouched(true);
                }}
                onBlur={() => setPhoneTouched(true)}
                placeholder="9876543210"
                className={`w-full pl-16 pr-4 py-2.5 text-on-surface bg-surface border rounded-xl focus:outline-none transition-all ${
                  isPhoneInvalid
                    ? "border-red-500 focus:border-red-500"
                    : "border-outline-variant focus:border-primary"
                }`}
              />
            </div>
            {isPhoneInvalid && (
              <span className="text-red-500 text-xs mt-1 block">Please enter a valid 10-digit mobile number</span>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-semibold hover:bg-surface-container transition-all cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-white font-bold shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Change Password Modal
function ChangePasswordModal({
  onClose,
  onSave,
  isLoading,
  error,
  setError,
}: {
  onClose: () => void;
  onSave: (current: string, newPw: string, confirm: string) => void;
  isLoading: boolean;
  error: string;
  setError: (e: string) => void;
}) {
  const [form, setForm] = useState({ current: "", newPw: "", confirm: "" });
  const [show, setShow] = useState({ current: false, newPw: false, confirm: false });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form.current, form.newPw, form.confirm);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Change Password</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-all cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {[
            { key: "current" as const, label: "Current Password" },
            { key: "newPw" as const, label: "New Password" },
            { key: "confirm" as const, label: "Confirm New Password" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={show[key] ? "text" : "password"}
                  value={form[key]}
                  onChange={(e) => {
                    setError("");
                    setForm((f) => ({ ...f, [key]: e.target.value }));
                  }}
                  placeholder="••••••••"
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 pr-12 text-on-surface bg-surface focus:outline-none focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => ({ ...s, [key]: !s[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">{show[key] ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>
          ))}
          {error && (
            <p className="text-red-600 text-sm font-medium flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-semibold hover:bg-surface-container transition-all cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-white font-bold shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Inner Address Form inside Manage Addresses Modal
function AddressFormModal({
  initial,
  onClose,
  onSave,
  isLoading,
}: {
  initial?: Address;
  onClose: () => void;
  onSave: (data: Omit<Address, "_id">) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<Omit<Address, "_id">>({
    label: initial?.label || "Home",
    addressLine: initial?.addressLine || "",
    city: initial?.city || "",
    pincode: initial?.pincode || "",
    isDefault: initial?.isDefault || false,
  });
  const [pincodeTouched, setPincodeTouched] = useState(false);

  const isPincodeInvalid = pincodeTouched && !!form.pincode && !isValidPincode(form.pincode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPincodeTouched(true);
    if (!form.addressLine.trim() || !form.city.trim()) {
      toast.error("Address line and city are required");
      return;
    }
    if (form.pincode && !isValidPincode(form.pincode)) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            {initial ? "Edit Address" : "Add Address"}
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-all cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">Label</label>
            <div className="flex gap-2">
              {(["Home", "Work", "Other"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, label: l }))}
                  className={`px-4 py-1.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                    form.label === l
                      ? "bg-primary text-white border-primary"
                      : "bg-surface border-outline-variant text-on-surface-variant hover:border-primary/40"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">Address Line *</label>
            <input
              value={form.addressLine}
              onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))}
              placeholder="Street, Apartment, Area..."
              className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface bg-surface focus:outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">City *</label>
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="City"
                className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface bg-surface focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">Pincode</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                pattern="[1-9][0-9]{5}"
                value={form.pincode}
                onChange={(e) => {
                  setForm((f) => ({ ...f, pincode: sanitizePincode(e.target.value) }));
                  if (!pincodeTouched) setPincodeTouched(true);
                }}
                onBlur={() => setPincodeTouched(true)}
                placeholder="6-digit pincode"
                className={`w-full border rounded-xl px-4 py-2.5 text-on-surface bg-surface focus:outline-none transition-all ${
                  isPincodeInvalid
                    ? "border-red-500 focus:border-red-500"
                    : "border-outline-variant focus:border-primary"
                }`}
              />
              {isPincodeInvalid && (
                <span className="text-red-500 text-xs mt-1 block">Please enter a valid 6-digit pincode</span>
              )}
            </div>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-on-surface-variant font-medium">Set as default address</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-semibold hover:bg-surface-container transition-all cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-white font-bold shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Manage Addresses List Modal
function ManageAddressesModal({
  addresses,
  loading,
  onClose,
  onAdd,
  onEdit,
  onDelete,
  isSaving,
}: {
  addresses: Address[];
  loading: boolean;
  onClose: () => void;
  onAdd: (d: Omit<Address, "_id">) => void;
  onEdit: (id: string, d: Omit<Address, "_id">) => void;
  onDelete: (id: string) => void;
  isSaving: boolean;
}) {
  const [formOpen, setFormOpen] = useState<{ open: boolean; editing?: Address }>({ open: false });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 flex-shrink-0">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Saved Addresses</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-all cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-on-surface-variant py-8">
              <span className="inline-block animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : (
            <>
              {addresses.length === 0 && (
                <p className="text-on-surface-variant text-sm py-4 text-center">No saved addresses yet.</p>
              )}
              {addresses.map((addr) => (
                <div
                  key={addr._id}
                  className="flex items-start justify-between gap-3 p-4 rounded-xl border border-outline-variant/40 bg-surface hover:border-primary/35 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                      location_on
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-on-surface text-sm">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-on-surface-variant text-sm mt-0.5">
                        {addr.addressLine}, {addr.city}
                        {addr.pincode ? ` - ${addr.pincode}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => setFormOpen({ open: true, editing: addr })}
                      className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => addr._id && onDelete(addr._id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-on-surface-variant hover:text-red-600 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        <div className="p-6 border-t border-outline-variant/20 flex-shrink-0 flex gap-3">
          <button
            onClick={() => setFormOpen({ open: true })}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-white font-bold shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add New Address
          </button>
        </div>

        {formOpen.open && (
          <AddressFormModal
            initial={formOpen.editing}
            onClose={() => setFormOpen({ open: false })}
            onSave={(data) => {
              if (formOpen.editing?._id) {
                onEdit(formOpen.editing._id, data);
              } else {
                onAdd(data);
              }
              setFormOpen({ open: false });
            }}
            isLoading={isSaving}
          />
        )}
      </div>
    </div>
  );
}

// Delete Account Modal
function DeleteAccountModal({
  onClose,
  onConfirm,
  confirmText,
  setConfirmText,
  isLoading,
}: {
  onClose: () => void;
  onConfirm: () => void;
  confirmText: string;
  setConfirmText: (t: string) => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <h3 className="font-headline-sm text-headline-sm font-bold text-red-600">Delete Account</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-all cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-red-600 mt-0.5">warning</span>
            <div>
              <p className="font-bold text-red-700 text-sm">This action is irreversible</p>
              <p className="text-red-600/80 text-xs mt-0.5">Your account will be permanently deactivated. Type "DELETE" below to confirm.</p>
            </div>
          </div>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='Type "DELETE" to confirm'
            className="w-full border border-red-300 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-red-500 transition-all animate-input-ring"
          />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-semibold hover:bg-surface-container transition-all cursor-pointer">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading || confirmText !== "DELETE"}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, clearCart } = useAppStore();

  // Redirect to login if user not set
  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  // Redux API Mutations/Queries
  const [updateProfile, { isLoading: isSavingProfile }] = useUpdateProfileMutation();
  const [updatePassword, { isLoading: isSavingPw }] = useUpdatePasswordMutation();
  const { data: addressesRes, isLoading: loadingAddresses } = useGetAddressesQuery(undefined, { skip: !user });
  const addresses: Address[] = addressesRes?.data || [];
  const [addAddress, { isLoading: isAddingAddr }] = useAddAddressMutation();
  const [updateAddress, { isLoading: isUpdatingAddr }] = useUpdateAddressMutation();
  const [deleteAddress, { isLoading: isDeletingAddr }] = useDeleteAddressMutation();
  const [updateNotifications] = useUpdateNotificationsMutation();
  const [deleteAccountMutation, { isLoading: isDeletingAccount }] = useDeleteAccountMutation();

  // Modals state
  const [modals, setModals] = useState<{
    profile: boolean;
    password: boolean;
    addresses: boolean;
    delete: boolean;
  }>({
    profile: false,
    password: false,
    addresses: false,
    delete: false,
  });

  const [pwError, setPwError] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Notification Preferences State
  const [notifs, setNotifs] = useState<NotificationPreferences>({
    orderUpdates: true,
    promotionalOffers: true,
    newRestaurantAlerts: false,
  });

  // Sync notification prefs from user model on load
  useEffect(() => {
    const stored = (user as any)?.notificationPreferences;
    if (stored) setNotifs(stored);
  }, [user]);

  if (!user) return null;

  // Handlers
  const handleProfileSave = async (name: string, phone: string) => {
    if (!name.trim() || name.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    try {
      const res = await updateProfile({ name: name.trim(), phone: phone.trim() }).unwrap();
      setUser({ ...user, name: res.data.user.name, ...(res.data.user as any) });
      toast.success("Profile updated!");
      setModals((m) => ({ ...m, profile: false }));
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update profile");
    }
  };

  const handlePasswordSave = async (curr: string, newPw: string, conf: string) => {
    if (newPw !== conf) {
      setPwError("Passwords do not match");
      return;
    }
    if (newPw.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }
    try {
      await updatePassword({ currentPassword: curr, newPassword: newPw }).unwrap();
      toast.success("Password changed successfully!");
      setModals((m) => ({ ...m, password: false }));
      setPwError("");
    } catch (err: any) {
      setPwError(err?.data?.message || "Failed to change password");
    }
  };

  const handleAddAddress = async (data: Omit<Address, "_id">) => {
    try {
      await addAddress(data).unwrap();
      toast.success("Address added");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to add address");
    }
  };

  const handleEditAddress = async (id: string, data: Omit<Address, "_id">) => {
    try {
      await updateAddress({ addressId: id, ...data }).unwrap();
      toast.success("Address updated");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update address");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    try {
      await deleteAddress(id).unwrap();
      toast.success("Address deleted");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete address");
    }
  };

  const handleToggleNotif = async (key: keyof NotificationPreferences, value: boolean) => {
    const prev = notifs;
    const next = { ...notifs, [key]: value };
    setNotifs(next); // Optimistic Update
    try {
      await updateNotifications({ [key]: value }).unwrap();
    } catch {
      setNotifs(prev); // Rollback
      toast.error("Failed to update notification preference");
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL + "/auth" : "http://localhost:5000/api/auth"}/logout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      if (res.ok) {
        setUser(null);
        clearCart();
        toast.success("Logged out successfully");
        router.push("/?logout=true");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Type DELETE to confirm");
      return;
    }
    try {
      await deleteAccountMutation({ confirmText: "DELETE" }).unwrap();
      setUser(null);
      clearCart();
      toast.success("Account deleted");
      router.push("/");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete account");
    }
  };

  // Get Initials for Avatar
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-0 py-8 space-y-8 animate-fade-in">
      {/* Profile Header */}
      <div className="flex items-center gap-6">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-orange-500 text-white font-black text-3xl flex items-center justify-center shadow-lg flex-shrink-0">
            {initials}
          </div>
          {/* Edit Badge overlay */}
          <button
            onClick={() => setModals((m) => ({ ...m, profile: true }))}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-outline-variant shadow-md flex items-center justify-center text-on-surface hover:text-primary transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
        </div>
        <div>
          <h1 className="font-headline-lg text-on-surface font-extrabold text-3xl tracking-tight">{user.name}</h1>
          <p className="text-on-surface-variant text-sm mt-0.5">{user.email}</p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Account & Actions */}
        <div className="space-y-6">
          {/* Account Card */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">account_circle</span>
              <h2 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant font-label-md">Account</h2>
            </div>
            <div className="divide-y divide-outline-variant/10">
              <button
                onClick={() => setModals((m) => ({ ...m, profile: true }))}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-container/30 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">person</span>
                  </div>
                  <span className="font-semibold text-on-surface text-sm">Edit Profile</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant/50 text-xl group-hover:translate-x-1 transition-transform">
                  chevron_right
                </span>
              </button>

              <button
                onClick={() => setModals((m) => ({ ...m, password: true }))}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-container/30 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">lock</span>
                  </div>
                  <span className="font-semibold text-on-surface text-sm">Change Password</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant/50 text-xl group-hover:translate-x-1 transition-transform">
                  chevron_right
                </span>
              </button>

              <button
                onClick={() => setModals((m) => ({ ...m, addresses: true }))}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-container/30 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">location_on</span>
                  </div>
                  <span className="font-semibold text-on-surface text-sm">Manage Addresses</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant/50 text-xl group-hover:translate-x-1 transition-transform">
                  chevron_right
                </span>
              </button>
            </div>
          </div>

          {/* Account Actions Card */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600 text-[22px]">warning</span>
              <h2 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant font-label-md">Account Actions</h2>
            </div>
            <div className="divide-y divide-outline-variant/10">
              <button
                onClick={handleLogout}
                className="w-full px-6 py-4 flex items-center gap-3 hover:bg-surface-container/30 transition-all text-left text-on-surface-variant hover:text-primary cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary/5 transition-colors">
                  <span className="material-symbols-outlined text-lg">logout</span>
                </div>
                <span className="font-semibold text-sm text-on-surface">Logout</span>
              </button>

              <button
                onClick={() => setModals((m) => ({ ...m, delete: true }))}
                className="w-full px-6 py-4 flex items-center gap-3 hover:bg-red-50/50 transition-all text-left text-red-600 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600 transition-colors">
                  <span className="material-symbols-outlined text-lg text-red-600">delete_forever</span>
                </div>
                <span className="font-semibold text-sm text-red-600">Delete Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Notifications & Premium Banner */}
        <div className="space-y-6">
          {/* Notifications Card */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-outline-variant/10 pb-4">
              <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                notifications
              </span>
              <h2 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant font-label-md">Notifications</h2>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-on-surface text-sm">Order Updates</p>
                  <p className="text-on-surface-variant text-xs mt-0.5">Real-time tracking notifications</p>
                </div>
                <Toggle checked={notifs.orderUpdates} onChange={(v) => handleToggleNotif("orderUpdates", v)} />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-on-surface text-sm">Promotions</p>
                  <p className="text-on-surface-variant text-xs mt-0.5">Exclusive deals and offers</p>
                </div>
                <Toggle checked={notifs.promotionalOffers} onChange={(v) => handleToggleNotif("promotionalOffers", v)} />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-on-surface text-sm">New Alerts</p>
                  <p className="text-on-surface-variant text-xs mt-0.5">System news and updates</p>
                </div>
                <Toggle checked={notifs.newRestaurantAlerts} onChange={(v) => handleToggleNotif("newRestaurantAlerts", v)} />
              </div>
            </div>
          </div>

          {/* Premium Pro Promo Card */}
          <div className="relative rounded-2xl bg-gradient-to-br from-primary to-orange-500 text-white p-6 shadow-md overflow-hidden flex flex-col justify-between h-48 group">
            {/* Background fork-spoon icon watermark */}
            <div className="absolute right-[-20px] bottom-[-20px] opacity-15 rotate-12 transition-transform duration-500 group-hover:scale-110 pointer-events-none">
              <span className="material-symbols-outlined text-[160px] select-none font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                restaurant
              </span>
            </div>

            <div className="relative z-10 space-y-2">
              <h3 className="font-headline-md text-xl font-black tracking-tight">Cravingza Pro</h3>
              <p className="text-white/90 text-sm max-w-[280px]">Enjoy unlimited free delivery on all orders.</p>
            </div>

            <div className="relative z-10 pt-2">
              <button
                onClick={() => toast.success("Cravingza Pro feature coming soon!")}
                className="bg-white text-primary hover:bg-white/95 font-bold text-sm px-6 py-2.5 rounded-full active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {modals.profile && (
        <EditProfileModal
          name={user.name}
          phone={(user as any).phone || ""}
          email={user.email}
          onClose={() => setModals((m) => ({ ...m, profile: false }))}
          onSave={handleProfileSave}
          isLoading={isSavingProfile}
        />
      )}

      {modals.password && (
        <ChangePasswordModal
          onClose={() => setModals((m) => ({ ...m, password: false }))}
          onSave={handlePasswordSave}
          isLoading={isSavingPw}
          error={pwError}
          setError={setPwError}
        />
      )}

      {modals.addresses && (
        <ManageAddressesModal
          addresses={addresses}
          loading={loadingAddresses}
          onClose={() => setModals((m) => ({ ...m, addresses: false }))}
          onAdd={handleAddAddress}
          onEdit={handleEditAddress}
          onDelete={handleDeleteAddress}
          isSaving={isAddingAddr || isUpdatingAddr || isDeletingAddr}
        />
      )}

      {modals.delete && (
        <DeleteAccountModal
          onClose={() => setModals((m) => ({ ...m, delete: false }))}
          onConfirm={handleDeleteAccount}
          confirmText={deleteConfirmText}
          setConfirmText={setDeleteConfirmText}
          isLoading={isDeletingAccount}
        />
      )}
    </div>
  );
}
