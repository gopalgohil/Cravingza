"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  useGetMyDeliveryApplicationQuery,
  useApplyAsDeliveryPartnerMutation,
  useReapplyAsDeliveryPartnerMutation,
} from "@/lib/redux/apiSlice";
import { toast } from "sonner";

import { sanitizePincode, isValidPincode, sanitizePhone, isValidPhone } from "@/lib/validators";

export default function ApplyDeliveryPartnerPage() {
  const router = useRouter();
  const { user } = useAppStore();

  const { data: appResponse, isLoading: appLoading } = useGetMyDeliveryApplicationQuery(undefined, {
    skip: !user,
  });
  const existingApp = appResponse?.data;

  const [applyAsDeliveryPartner, { isLoading: isApplying }] = useApplyAsDeliveryPartnerMutation();
  const [reapplyAsDeliveryPartner, { isLoading: isReapplying }] = useReapplyAsDeliveryPartnerMutation();

  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [dob, setDob] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [pincodeTouched, setPincodeTouched] = useState(false);
  const [vehicleType, setVehicleType] = useState<"bicycle" | "motorcycle" | "car" | "electric_scooter">("motorcycle");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [aadhaarCardUrl, setAadhaarCardUrl] = useState("");
  const [drivingLicenseUrl, setDrivingLicenseUrl] = useState("");
  const [uploadingAadhaar, setUploadingAadhaar] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const aadhaarInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error("Please sign in to access the delivery partner application.");
      router.push("/login?redirect=/become-delivery-partner/apply");
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.phone && !phone && (!existingApp || existingApp.approvalStatus !== "rejected")) {
      setPhone(user.phone);
    }
  }, [user, existingApp, phone]);

  useEffect(() => {
    if (existingApp && existingApp.approvalStatus === "rejected") {
      setPhone(existingApp.phone || "");
      setCity(existingApp.city || "");
      setPincode(existingApp.pincode || "");
      setVehicleType(existingApp.vehicleType || "motorcycle");
      setVehicleNumber(existingApp.vehicleNumber || "");
      setAadhaarCardUrl(existingApp.documents?.aadhaarCard || "");
      setDrivingLicenseUrl(existingApp.documents?.drivingLicense || "");
      setAccountHolderName(existingApp.bankDetails?.accountHolderName || "");
      setAccountNumber(existingApp.bankDetails?.accountNumber || "");
      setIfscCode(existingApp.bankDetails?.ifscCode || "");
      setBankName(existingApp.bankDetails?.bankName || "");
    } else if (existingApp && (existingApp.approvalStatus === "pending" || existingApp.approvalStatus === "approved")) {
      router.push("/become-delivery-partner");
    }
  }, [existingApp, router]);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "aadhaar" | "license"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      toast.error("Please upload only PDF or image files (JPEG/PNG) for verification documents.");
      return;
    }
    const setUploading = type === "aadhaar" ? setUploadingAadhaar : setUploadingLicense;
    const setUrl = type === "aadhaar" ? setAadhaarCardUrl : setDrivingLicenseUrl;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "delivery-documents");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const resData = await response.json();
      if (resData.success) {
        setUrl(resData.url);
        toast.success(`${file.name} uploaded successfully.`);
      } else {
        throw new Error(resData.message || "Failed to upload file.");
      }
    } catch (err) {
      const error = err as { message?: string };
      toast.error(error.message || "Something went wrong during file upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneTouched(true);
    setPincodeTouched(true);
    if (!isValidPhone(phone)) return toast.error("Please enter a valid 10-digit mobile number.");
    if (!city.trim()) return toast.error("City is required.");
    if (!isValidPincode(pincode)) return toast.error("Please enter a valid 6-digit pincode.");
    if (vehicleType !== "bicycle") {
      if (!vehicleNumber.trim()) return toast.error("Vehicle number is required for motorized vehicles.");
      if (!drivingLicenseUrl) return toast.error("Driving License document is required for motorized vehicles.");
    }
    if (!aadhaarCardUrl) return toast.error("Aadhaar Card document is required.");
    if (!accountHolderName.trim()) return toast.error("Bank Account Holder Name is required.");
    if (!accountNumber.trim() || accountNumber.trim().length < 8) return toast.error("Valid account number is required (min 8 digits).");
    if (!ifscCode.trim() || ifscCode.trim().length < 4) return toast.error("Bank IFSC code is required.");
    if (!bankName.trim()) return toast.error("Bank Name is required.");

    const payload = {
      phone, vehicleType,
      vehicleNumber: vehicleType === "bicycle" ? "" : vehicleNumber,
      city, pincode, aadhaarCardUrl,
      drivingLicenseUrl: vehicleType === "bicycle" ? "" : drivingLicenseUrl,
      accountHolderName, accountNumber, ifscCode, bankName,
    };

    try {
      if (existingApp?.approvalStatus === "rejected") {
        await reapplyAsDeliveryPartner(payload).unwrap();
        toast.success("Reapplication submitted successfully!");
      } else {
        await applyAsDeliveryPartner(payload).unwrap();
        toast.success("Application submitted successfully!");
      }
      setShowSuccessModal(true);
    } catch (err) {
      const error = err as { data?: { message?: string } };
      toast.error(error.data?.message || "Failed to submit application. Please try again.");
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    router.push("/become-delivery-partner");
  };

  if (appLoading || !user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-orange-50 to-rose-50">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-5xl animate-spin text-orange-500">autorenew</span>
          <p className="text-slate-500 font-medium">Loading your application...</p>
        </div>
      </div>
    );
  }

  const isSubmitting = isApplying || isReapplying;
  const isUploadingAny = uploadingAadhaar || uploadingLicense;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-rose-50/20 pb-20">

      {/* ── Hero Banner ───────────────────────────────────── */}
      <header className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-rose-600 text-white">
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-6 py-14 md:py-20 flex flex-col md:flex-row items-center gap-10">
          {/* Text */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-semibold mb-5">
              <span className="material-symbols-outlined text-base">local_shipping</span>
              Delivery Partner Program
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4">
              Become a<br />
              <span className="text-yellow-300">Delivery Partner</span>
            </h1>
            <p className="text-white/80 text-base md:text-lg max-w-md leading-relaxed">
              Earn on your own schedule with Cravingza&rsquo;s premium delivery network. Complete the application below to get started.
            </p>

            {/* Stats Strip */}
            <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-8">
              {[
                { icon: "payments", value: "₹25K+", label: "Avg. Monthly" },
                { icon: "schedule", value: "Flexible", label: "Work Hours" },
                { icon: "speed", value: "24–48h", label: "Approval Time" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-3">
                  <span className="material-symbols-outlined text-yellow-300 text-2xl">{s.icon}</span>
                  <div>
                    <div className="font-extrabold text-lg leading-none">{s.value}</div>
                    <div className="text-white/70 text-xs mt-0.5">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Illustration Icon */}
          <div className="hidden md:flex shrink-0 w-48 h-48 rounded-full bg-white/10 border border-white/20 items-center justify-center shadow-2xl">
            <span className="material-symbols-outlined text-[7rem] text-white/90">delivery_dining</span>
          </div>
        </div>
      </header>

      {/* ── Progress Steps ────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 -mt-6 relative z-10 mb-10">
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-4">
          <div className="flex items-center justify-between gap-2">
            {[
              { step: 1, label: "Personal Info", icon: "person" },
              { step: 2, label: "Vehicle", icon: "moped" },
              { step: 3, label: "Documents", icon: "verified_user" },
              { step: 4, label: "Bank Details", icon: "account_balance" },
            ].map((s, i) => (
              <div key={s.step} className="flex-1 flex items-center">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-sm shadow-orange-500/30">
                    <span className="material-symbols-outlined text-white text-base">{s.icon}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 hidden sm:block">{s.label}</span>
                </div>
                {i < 3 && <div className="h-0.5 flex-1 bg-gradient-to-r from-orange-200 to-rose-200 mx-1" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Form ─────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ─── Card 1: Personal Information ─────────────── */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-rose-50 border-b border-orange-100/60 px-8 py-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-sm shadow-orange-500/30">
                <span className="material-symbols-outlined text-white text-xl">person_pin</span>
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-800">Personal Information</h2>
                <p className="text-xs text-slate-500">Your basic details — name and email are auto-filled</p>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Full Name */}
                <div className="xl:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-xl">badge</span>
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-400 cursor-not-allowed focus:outline-none text-sm font-medium"
                      type="text" value={user.name} disabled
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="xl:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-xl">mail</span>
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-400 cursor-not-allowed focus:outline-none text-sm font-medium"
                      type="email" value={user.email} disabled
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="xl:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Phone Number <span className="text-rose-500">*</span></label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 flex items-center gap-1 text-slate-500 font-bold text-sm pointer-events-none select-none z-10">
                      <span className="material-symbols-outlined text-orange-400 text-lg">phone</span>
                      <span className="text-slate-700 font-bold border-r border-slate-300 pr-2">+91</span>
                    </div>
                    <input
                      className={`w-full bg-white border rounded-xl pl-20 pr-4 py-3.5 text-slate-800 focus:outline-none transition-all text-sm font-medium placeholder:text-slate-300 ${
                        phoneTouched && phone.length > 0 && !isValidPhone(phone)
                          ? "border-rose-500 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                          : "border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                      }`}
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => {
                        setPhone(sanitizePhone(e.target.value));
                        if (!phoneTouched) setPhoneTouched(true);
                      }}
                      onBlur={() => setPhoneTouched(true)}
                      required
                    />
                  </div>
                  {phoneTouched && phone.length > 0 && !isValidPhone(phone) && (
                    <span className="text-rose-500 text-xs font-semibold mt-1 block">Please enter a valid 10-digit mobile number</span>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="xl:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Date of Birth <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-orange-400 text-xl">cake</span>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-800 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium"
                      type="date" value={dob} onChange={(e) => setDob(e.target.value)} required
                    />
                  </div>
                </div>

                {/* City */}
                <div className="xl:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">City / Service Area <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-orange-400 text-xl">location_city</span>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-800 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium placeholder:text-slate-300"
                      type="text" placeholder="e.g. Mumbai"
                      value={city} onChange={(e) => setCity(e.target.value)} required
                    />
                  </div>
                </div>

                {/* Pincode */}
                <div className="xl:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Pincode <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-orange-400 text-xl">pin_drop</span>
                    <input
                      className={`w-full bg-white border rounded-xl pl-11 pr-4 py-3.5 text-slate-800 focus:outline-none transition-all text-sm font-medium placeholder:text-slate-300 ${
                        pincodeTouched && pincode.length > 0 && !isValidPincode(pincode)
                          ? "border-rose-500 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                          : "border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                      }`}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      pattern="[1-9][0-9]{5}"
                      placeholder="e.g. 390001"
                      value={pincode}
                      onChange={(e) => {
                        setPincode(sanitizePincode(e.target.value));
                        if (!pincodeTouched) setPincodeTouched(true);
                      }}
                      onBlur={() => setPincodeTouched(true)}
                      required
                    />
                  </div>
                  {pincodeTouched && pincode.length > 0 && !isValidPincode(pincode) && (
                    <span className="text-rose-500 text-xs font-semibold mt-1 block">Please enter a valid 6-digit pincode</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ─── Card 2: Vehicle Selection ────────────────── */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/60 px-8 py-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm shadow-blue-500/30">
                <span className="material-symbols-outlined text-white text-xl">directions_run</span>
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-800">Vehicle Selection</h2>
                <p className="text-xs text-slate-500">Choose your primary mode of transport</p>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: "bicycle", label: "Bicycle", icon: "pedal_bike", color: "emerald" },
                  { id: "motorcycle", label: "Motorcycle", icon: "moped", color: "orange" },
                  { id: "car", label: "Car", icon: "directions_car", color: "blue" },
                  { id: "electric_scooter", label: "E-Scooter", icon: "electric_moped", color: "violet" },
                ].map((v) => {
                  const isSelected = vehicleType === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVehicleType(v.id as any)}
                      className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer group ${
                        isSelected
                          ? "border-orange-500 bg-gradient-to-br from-orange-50 to-rose-50 shadow-md shadow-orange-500/15 scale-[1.03]"
                          : "border-slate-200 bg-slate-50 hover:border-orange-200 hover:bg-orange-50/50 hover:scale-[1.02]"
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-gradient-to-br from-orange-500 to-rose-500 shadow-lg shadow-orange-500/30"
                          : "bg-white border border-slate-200 group-hover:border-orange-200"
                      }`}>
                        <span className={`material-symbols-outlined text-3xl transition-all ${isSelected ? "text-white" : "text-slate-500"}`}>
                          {v.icon}
                        </span>
                      </div>
                      <span className={`text-sm font-bold transition-all ${isSelected ? "text-orange-600" : "text-slate-600"}`}>
                        {v.label}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">Selected</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {vehicleType !== "bicycle" && (
                <div className="pt-6 border-t border-slate-100 animate-fade-in">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Vehicle Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative max-w-md">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-orange-400 text-xl">confirmation_number</span>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-800 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-bold uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-300"
                      type="text" placeholder="e.g. MH 01 AB 1234"
                      value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} required
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ─── Card 3: Documents ────────────────────────── */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100/60 px-8 py-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm shadow-emerald-500/30">
                <span className="material-symbols-outlined text-white text-xl">verified_user</span>
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-800">Identity Documents</h2>
                <p className="text-xs text-slate-500">Upload PDF or image files (JPEG/PNG accepted)</p>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Aadhaar Card */}
              <div className={`group relative rounded-2xl border-2 border-dashed p-6 transition-all ${
                aadhaarCardUrl ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200 hover:border-orange-300 hover:bg-orange-50/30"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                    aadhaarCardUrl ? "bg-emerald-100" : "bg-slate-100"
                  }`}>
                    <span className={`material-symbols-outlined text-3xl ${aadhaarCardUrl ? "text-emerald-600" : "text-slate-400"}`}>
                      {aadhaarCardUrl ? "task_alt" : "id_card"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800">Aadhaar Card</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 uppercase">Required</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Must display your name, DOB and photo clearly</p>
                    {aadhaarCardUrl && (
                      <a href={aadhaarCardUrl} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-emerald-600 hover:underline">
                        <span className="material-symbols-outlined text-sm">open_in_new</span> Preview uploaded file
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => aadhaarInputRef.current?.click()}
                    disabled={uploadingAadhaar}
                    className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                      aadhaarCardUrl
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/25 hover:from-orange-600 hover:to-rose-600"
                    } disabled:opacity-50`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {uploadingAadhaar ? "autorenew" : aadhaarCardUrl ? "sync" : "cloud_upload"}
                    </span>
                    {uploadingAadhaar ? "Uploading..." : aadhaarCardUrl ? "Replace" : "Upload Aadhaar"}
                  </button>
                  <input type="file" ref={aadhaarInputRef} onChange={(e) => handleFileUpload(e, "aadhaar")}
                    accept="application/pdf,image/*" className="hidden" />
                </div>
              </div>

              {/* Driving License */}
              {vehicleType !== "bicycle" && (
                <div className={`group relative rounded-2xl border-2 border-dashed p-6 transition-all animate-fade-in ${
                  drivingLicenseUrl ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200 hover:border-orange-300 hover:bg-orange-50/30"
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                      drivingLicenseUrl ? "bg-emerald-100" : "bg-slate-100"
                    }`}>
                      <span className={`material-symbols-outlined text-3xl ${drivingLicenseUrl ? "text-emerald-600" : "text-slate-400"}`}>
                        {drivingLicenseUrl ? "task_alt" : "drive_eta"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800">Driving License</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 uppercase">Required</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Must be valid and unexpired</p>
                      {drivingLicenseUrl && (
                        <a href={drivingLicenseUrl} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-emerald-600 hover:underline">
                          <span className="material-symbols-outlined text-sm">open_in_new</span> Preview uploaded file
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => licenseInputRef.current?.click()}
                      disabled={uploadingLicense}
                      className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                        drivingLicenseUrl
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/25 hover:from-orange-600 hover:to-rose-600"
                      } disabled:opacity-50`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {uploadingLicense ? "autorenew" : drivingLicenseUrl ? "sync" : "cloud_upload"}
                      </span>
                      {uploadingLicense ? "Uploading..." : drivingLicenseUrl ? "Replace" : "Upload License"}
                    </button>
                    <input type="file" ref={licenseInputRef} onChange={(e) => handleFileUpload(e, "license")}
                      accept="application/pdf,image/*" className="hidden" />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ─── Card 4: Payout / Bank Details ────────────── */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100/60 px-8 py-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm shadow-violet-500/30">
                <span className="material-symbols-outlined text-white text-xl">account_balance</span>
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-800">Payout Details</h2>
                <p className="text-xs text-slate-500">Bank account for receiving weekly earnings</p>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Account Holder Name */}
                <div className="xl:col-span-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Account Holder Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-violet-400 text-xl">person</span>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 transition-all text-sm font-medium placeholder:text-slate-300"
                      type="text" placeholder="As it appears on your passbook / ID"
                      value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} required
                    />
                  </div>
                </div>

                {/* Account Number */}
                <div className="xl:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Account Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-violet-400 text-xl">pin</span>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 transition-all text-sm font-medium placeholder:text-slate-300"
                      type="password" placeholder="••••••••••••"
                      value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required
                    />
                  </div>
                </div>

                {/* IFSC */}
                <div className="xl:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    IFSC / Swift Code <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-violet-400 text-xl">tag</span>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 transition-all text-sm font-bold uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-300"
                      type="text" placeholder="e.g. SBIN0001234"
                      value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} required
                    />
                  </div>
                </div>

                {/* Bank Name */}
                <div className="xl:col-span-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Bank Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-violet-400 text-xl">corporate_fare</span>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 transition-all text-sm font-medium placeholder:text-slate-300"
                      type="text" placeholder="e.g. State Bank of India"
                      value={bankName} onChange={(e) => setBankName(e.target.value)} required
                    />
                  </div>
                </div>
              </div>

              {/* Security note */}
              <div className="flex gap-3 items-start p-4 bg-violet-50 rounded-2xl border border-violet-100">
                <span className="material-symbols-outlined text-violet-500 text-xl mt-0.5">lock</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold">Fully encrypted & secure.</span> Your bank details are encrypted end-to-end and used only to process weekly payouts. They are never shared with third parties.
                </p>
              </div>
            </div>
          </section>

          {/* ─── Submit Button ────────────────────────────── */}
          <div className="pb-4">
            <button
              disabled={isSubmitting || isUploadingAny}
              type="submit"
              className="w-full py-5 bg-gradient-to-r from-orange-500 via-orange-600 to-rose-600 hover:from-orange-600 hover:via-orange-700 hover:to-rose-700 disabled:opacity-60 text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-500/25 hover:shadow-2xl hover:shadow-orange-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="material-symbols-outlined text-xl animate-spin">autorenew</span>
              ) : (
                <span className="material-symbols-outlined text-xl">rocket_launch</span>
              )}
              <span>{existingApp?.approvalStatus === "rejected" ? "Submit Reapplication" : "Submit Application"}</span>
              {!isSubmitting && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
            </button>
            <p className="text-center text-xs text-slate-400 mt-4 px-6">
              By submitting, you agree to Cravingza&rsquo;s{" "}
              <a href="#" className="underline hover:text-orange-500 transition-colors">Terms of Service</a>{" "}
              &amp;{" "}
              <a href="#" className="underline hover:text-orange-500 transition-colors">Privacy Policy</a>.
            </p>
          </div>
        </form>
      </main>

      {/* ─── Success Modal ─────────────────────────────────── */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-30" />
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <span className="material-symbols-outlined text-white text-5xl">check_circle</span>
              </div>
            </div>
            <h3 className="font-extrabold text-2xl text-slate-800 mb-2">Application Sent! 🎉</h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              We&rsquo;re reviewing your details. You&rsquo;ll get a status update on your application hub within <strong>24–48 hours</strong>.
            </p>
            <button
              onClick={handleModalClose}
              type="button"
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold rounded-xl transition-all shadow-md shadow-orange-500/25 cursor-pointer"
            >
              View Application Status
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
