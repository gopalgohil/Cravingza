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

export default function ApplyDeliveryPartnerPage() {
  const router = useRouter();
  const { user } = useAppStore();

  // Query existing application to support pre-filling for reapplication
  const { data: appResponse, isLoading: appLoading } = useGetMyDeliveryApplicationQuery(undefined, {
    skip: !user,
  });
  const existingApp = appResponse?.data;

  const [applyAsDeliveryPartner, { isLoading: isApplying }] = useApplyAsDeliveryPartnerMutation();
  const [reapplyAsDeliveryPartner, { isLoading: isReapplying }] = useReapplyAsDeliveryPartnerMutation();

  // Form State
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  
  const [vehicleType, setVehicleType] = useState<"bicycle" | "motorcycle" | "car" | "electric_scooter">("motorcycle");
  const [vehicleNumber, setVehicleNumber] = useState("");

  // Document Uploads
  const [aadhaarCardUrl, setAadhaarCardUrl] = useState("");
  const [drivingLicenseUrl, setDrivingLicenseUrl] = useState("");

  const [uploadingAadhaar, setUploadingAadhaar] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);

  // Bank Details
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");

  // File Inputs Refs
  const aadhaarInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  // Show Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!user) {
      toast.error("Please sign in to access the delivery partner application.");
      router.push("/login?redirect=/become-delivery-partner/apply");
    }
  }, [user, router]);

  // Pre-fill form if application is rejected and user wants to edit/reapply
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
      // If already pending or approved, redirect them to the status hub
      router.push("/become-delivery-partner");
    }
  }, [existingApp, router]);

  // Upload handler using backend `/api/upload` endpoint
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "aadhaar" | "license"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Document type validation
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

    // Field Validations
    if (!phone.trim() || phone.trim().length < 10) {
      return toast.error("Valid contact phone number is required (min 10 digits).");
    }
    if (!city.trim()) return toast.error("City is required.");
    if (!pincode.trim() || pincode.trim().length < 4) {
      return toast.error("Pincode must be at least 4 digits.");
    }
    if (vehicleType !== "bicycle") {
      if (!vehicleNumber.trim()) {
        return toast.error("Vehicle number is required for motorized vehicles.");
      }
      if (!drivingLicenseUrl) {
        return toast.error("Driving License document is required for motorized vehicles.");
      }
    }
    if (!aadhaarCardUrl) {
      return toast.error("Aadhaar Card document is required.");
    }
    if (!accountHolderName.trim()) {
      return toast.error("Bank Account Holder Name is required.");
    }
    if (!accountNumber.trim() || accountNumber.trim().length < 8) {
      return toast.error("Valid account number is required (min 8 digits).");
    }
    if (!ifscCode.trim() || ifscCode.trim().length < 4) {
      return toast.error("Bank IFSC code is required.");
    }
    if (!bankName.trim()) {
      return toast.error("Bank Name is required.");
    }

    const payload = {
      phone,
      vehicleType,
      vehicleNumber: vehicleType === "bicycle" ? "" : vehicleNumber,
      city,
      pincode,
      aadhaarCardUrl,
      drivingLicenseUrl: vehicleType === "bicycle" ? "" : drivingLicenseUrl,
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
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
      <div className="max-w-3xl mx-auto py-12 flex justify-center items-center">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary">autorenew</span>
      </div>
    );
  }

  const isSubmitting = isApplying || isReapplying;
  const isUploadingAny = uploadingAadhaar || uploadingLicense;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Header Visual Context */}
      <header className="relative h-48 w-full overflow-hidden flex items-center justify-center text-center px-4 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="max-w-xl space-y-2">
          <h1 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-primary tracking-tight">
            Become a Delivery Partner
          </h1>
          <p className="font-body-md text-sm md:text-base text-slate-500">
            Earn on your own terms with Cravingza&rsquo;s premium network. Complete the application below.
          </p>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="max-w-2xl mx-auto px-4 -mt-8 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Personal Details */}
          <section className="bg-white rounded-3xl p-6 md:p-8 border border-outline-variant/30 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <span className="material-symbols-outlined text-primary text-2xl font-bold">person_pin</span>
              <h2 className="font-headline-md text-lg font-bold text-on-surface">Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-3 font-body-md focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all cursor-not-allowed text-slate-500"
                  type="text"
                  value={user.name}
                  disabled
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-3 font-body-md focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all cursor-not-allowed text-slate-500"
                  type="email"
                  value={user.email}
                  disabled
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Phone Number</label>
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-body-md focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all text-slate-800"
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Date of Birth</label>
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-body-md focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all text-slate-800"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">City / Service Area</label>
                  <input
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-body-md focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all text-slate-800"
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Pincode</label>
                  <input
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-body-md focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all text-slate-800"
                    type="text"
                    placeholder="e.g. 400001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Card 2: Vehicle Selection */}
          <section className="bg-white rounded-3xl p-6 md:p-8 border border-outline-variant/30 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <span className="material-symbols-outlined text-primary text-2xl font-bold">directions_run</span>
              <h2 className="font-headline-md text-lg font-bold text-on-surface">Vehicle Selection</h2>
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Choose your primary transport mode</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { id: "bicycle", label: "Bicycle", icon: "pedal_bike" },
                { id: "motorcycle", label: "Motorcycle", icon: "moped" },
                { id: "car", label: "Car", icon: "directions_car" },
                { id: "electric_scooter", label: "E-Scooter", icon: "electric_moped" },
              ].map((v) => {
                const isSelected = vehicleType === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVehicleType(v.id as any)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-orange-500 bg-orange-50 text-orange-600 shadow-sm font-bold"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="material-symbols-outlined text-3xl mb-2">{v.icon}</span>
                    <span className="text-xs">{v.label}</span>
                  </button>
                );
              })}
            </div>

            {vehicleType !== "bicycle" && (
              <div className="pt-4 border-t border-slate-100 animate-fade-in">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Vehicle Number
                </label>
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-body-md focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all uppercase text-slate-800"
                  type="text"
                  placeholder="e.g. MH 01 AB 1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  required
                />
              </div>
            )}
          </section>

          {/* Card 3: Documents */}
          <section className="bg-white rounded-3xl p-6 md:p-8 border border-outline-variant/30 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <span className="material-symbols-outlined text-primary text-2xl font-bold">verified_user</span>
              <h2 className="font-headline-md text-lg font-bold text-on-surface">Documents</h2>
            </div>

            <div className="space-y-6">
              {/* Aadhaar Card */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <div>
                    <label className="block text-sm font-bold text-on-surface">Aadhaar Card (PDF / Image)</label>
                    <span className="text-xs text-slate-400">Must display name, DOB and photo clearly</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary uppercase">Required</span>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => aadhaarInputRef.current?.click()}
                    disabled={uploadingAadhaar}
                    className="bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-800 font-bold px-5 py-3 rounded-xl text-sm transition-all border border-slate-200/60 flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-base">cloud_upload</span>
                    {uploadingAadhaar ? "Uploading..." : "Upload Aadhaar"}
                  </button>
                  <input
                    type="file"
                    ref={aadhaarInputRef}
                    onChange={(e) => handleFileUpload(e, "aadhaar")}
                    accept="application/pdf,image/*"
                    className="hidden"
                  />
                  {aadhaarCardUrl && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-3 py-2 rounded-xl text-xs font-bold">
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <span>Uploaded</span>
                      <a href={aadhaarCardUrl} target="_blank" rel="noreferrer" className="underline ml-2">Preview</a>
                    </div>
                  )}
                </div>
              </div>

              {/* Driving License (Only if not bicycle) */}
              {vehicleType !== "bicycle" && (
                <div className="space-y-2 pt-4 border-t border-slate-100 animate-fade-in">
                  <div className="flex justify-between items-end">
                    <div>
                      <label className="block text-sm font-bold text-on-surface">Driving License (PDF / Image)</label>
                      <span className="text-xs text-slate-400">Must be valid and unexpired</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary uppercase">Required</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => licenseInputRef.current?.click()}
                      disabled={uploadingLicense}
                      className="bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-800 font-bold px-5 py-3 rounded-xl text-sm transition-all border border-slate-200/60 flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-base">cloud_upload</span>
                      {uploadingLicense ? "Uploading..." : "Upload License"}
                    </button>
                    <input
                      type="file"
                      ref={licenseInputRef}
                      onChange={(e) => handleFileUpload(e, "license")}
                      accept="application/pdf,image/*"
                      className="hidden"
                    />
                    {drivingLicenseUrl && (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-3 py-2 rounded-xl text-xs font-bold">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        <span>Uploaded</span>
                        <a href={drivingLicenseUrl} target="_blank" rel="noreferrer" className="underline ml-2">Preview</a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Card 4: Payout Details */}
          <section className="bg-white rounded-3xl p-6 md:p-8 border border-outline-variant/30 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <span className="material-symbols-outlined text-primary text-2xl font-bold">account_balance</span>
              <h2 className="font-headline-md text-lg font-bold text-on-surface">Payout Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Bank Account Holder Name
                </label>
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-body-md focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all text-slate-800"
                  type="text"
                  placeholder="As it appears on your passbook / ID"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Account Number
                </label>
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-body-md focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all text-slate-800"
                  type="password"
                  placeholder="••••••••••••"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Bank IFSC / Swift Code
                </label>
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-body-md focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all uppercase text-slate-800"
                  type="text"
                  placeholder="e.g. SBIN0001234"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Bank Name
                </label>
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-body-md focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all text-slate-800"
                  type="text"
                  placeholder="e.g. State Bank of India"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 items-start p-4 bg-slate-50 rounded-2xl border border-slate-200/30 mt-4">
              <span className="material-symbols-outlined text-primary text-sm mt-0.5">info</span>
              <p className="text-xs text-slate-500">
                Your bank details are fully encrypted and will only be used to process weekly payouts for your deliveries.
              </p>
            </div>
          </section>

          {/* Submit Actions */}
          <div className="pt-6 pb-12">
             <button
              disabled={isSubmitting || isUploadingAny}
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 disabled:bg-orange-300 text-white rounded-full font-bold shadow-lg shadow-orange-500/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="material-symbols-outlined text-lg animate-spin">autorenew</span>
              ) : null}
              <span>{existingApp?.approvalStatus === "rejected" ? "Submit Reapplication" : "Submit Application"}</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-3 px-6">
              By submitting, you agree to Cravingza&rsquo;s <a href="#" className="underline">Terms of Service</a> & <a href="#" className="underline">Privacy Policy</a>.
            </p>
          </div>
        </form>
      </main>

      {/* Success Modal Overlay */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h3 className="font-headline-md text-xl font-bold text-on-surface mb-2">Application Sent!</h3>
            <p className="text-sm text-slate-500 mb-6">
              We&rsquo;re currently verifying your details. Expect a status update on your application hub within 24-48 hours.
            </p>
            <button
              onClick={handleModalClose}
              type="button"
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-full transition-colors cursor-pointer text-sm"
            >
              Back to Status Hub
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
