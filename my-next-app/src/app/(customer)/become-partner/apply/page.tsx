"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  useGetMyApplicationQuery,
  useApplyAsPartnerMutation,
  useReapplyAsPartnerMutation,
} from "@/lib/redux/apiSlice";
import { toast } from "sonner";

const PREDEFINED_CUISINES = [
  "Indian",
  "Chinese",
  "Italian",
  "American",
  "Fast Food",
  "Healthy",
  "Desserts",
  "Bakery",
  "Pizza",
  "Burgers",
];

import { sanitizePincode, isValidPincode, sanitizePhone, isValidPhone } from "@/lib/validators";

export default function ApplyPartnerPage() {
  const router = useRouter();
  const { user } = useAppStore();

  // Query existing application to support pre-filling for reapplication
  const { data: appResponse, isLoading: appLoading } = useGetMyApplicationQuery(undefined, {
    skip: !user,
  });
  const existingApp = appResponse?.data;

  const [applyAsPartner, { isLoading: isApplying }] = useApplyAsPartnerMutation();
  const [reapplyAsPartner, { isLoading: isReapplying }] = useReapplyAsPartnerMutation();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!user) {
      toast.error("Please sign in to access the partner application form.");
      router.push("/login?redirect=/become-partner/apply");
    }
  }, [user, router]);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [customCuisine, setCustomCuisine] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [pincodeTouched, setPincodeTouched] = useState(false);
  const [ownerPhone, setOwnerPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);

  useEffect(() => {
    if (user?.phone && !ownerPhone && (!existingApp || existingApp.approvalStatus !== "rejected")) {
      setOwnerPhone(user.phone);
    }
  }, [user, existingApp, ownerPhone]);

  // Upload States
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [fssaiLicenseUrl, setFssaiLicenseUrl] = useState("");
  const [businessRegistrationUrl, setBusinessRegistrationUrl] = useState("");

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFssai, setUploadingFssai] = useState(false);
  const [uploadingReg, setUploadingReg] = useState(false);

  // File Input Refs
  const coverInputRef = useRef<HTMLInputElement>(null);
  const fssaiInputRef = useRef<HTMLInputElement>(null);
  const regInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill form if application is rejected and user wants to edit/reapply
  useEffect(() => {
    if (existingApp && existingApp.approvalStatus === "rejected") {
      const timer = setTimeout(() => {
        setName(existingApp.name || "");
        setDescription(existingApp.description || "");
        setSelectedCuisines(existingApp.cuisineTags || []);
        setAddressLine(existingApp.location?.address || "");
        setCity(existingApp.location?.city || "");
        setPincode(existingApp.pincode || "");
        setOwnerPhone(existingApp.ownerPhone || "");
        setCoverImageUrl(existingApp.image || "");
        setFssaiLicenseUrl(existingApp.documents?.fssaiLicense || "");
        setBusinessRegistrationUrl(existingApp.documents?.businessRegistration || "");
      }, 0);
      return () => clearTimeout(timer);
    } else if (existingApp && (existingApp.approvalStatus === "pending" || existingApp.approvalStatus === "approved")) {
      // If already pending or approved, redirect them to the status hub
      router.push("/become-partner");
    }
  }, [existingApp, router]);

  // Toggle predefined cuisines
  const toggleCuisine = (cuisine: string) => {
    if (selectedCuisines.includes(cuisine)) {
      setSelectedCuisines(selectedCuisines.filter((c) => c !== cuisine));
    } else {
      setSelectedCuisines([...selectedCuisines, cuisine]);
    }
  };

  // Add custom cuisine
  const handleAddCustomCuisine = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customCuisine.trim();
    if (trimmed && !selectedCuisines.includes(trimmed)) {
      setSelectedCuisines([...selectedCuisines, trimmed]);
      setCustomCuisine("");
    }
  };

  // Remove cuisine tag
  const removeCuisine = (cuisine: string) => {
    setSelectedCuisines(selectedCuisines.filter((c) => c !== cuisine));
  };

  // Upload handler
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cover" | "fssai" | "reg"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation checks
    if (type !== "cover" && file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      toast.error("Please upload only PDF or image files for official documents.");
      return;
    }
    if (type === "cover" && !file.type.startsWith("image/")) {
      toast.error("Please upload an image file for the cover photo.");
      return;
    }

    const setUploading = type === "cover" ? setUploadingCover : type === "fssai" ? setUploadingFssai : setUploadingReg;
    const setUrl = type === "cover" ? setCoverImageUrl : type === "fssai" ? setFssaiLicenseUrl : setBusinessRegistrationUrl;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "restaurant-documents");

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

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    setPhoneTouched(true);
    setPincodeTouched(true);
    if (!name.trim()) return toast.error("Restaurant name is required.");
    if (description.trim().length < 10) return toast.error("Description must be at least 10 characters.");
    if (selectedCuisines.length === 0) return toast.error("Please select or add at least one cuisine tag.");
    if (!addressLine.trim()) return toast.error("Address is required.");
    if (!city.trim()) return toast.error("City is required.");
    if (!isValidPincode(pincode)) return toast.error("Please enter a valid 6-digit pincode.");
    if (!isValidPhone(ownerPhone)) return toast.error("Please enter a valid 10-digit mobile number.");
    if (!coverImageUrl) return toast.error("Cover image is required.");
    if (!fssaiLicenseUrl) return toast.error("FSSAI License document is required.");
    if (!businessRegistrationUrl) return toast.error("Business Registration document is required.");

    const submissionData = {
      name,
      description,
      cuisineTags: selectedCuisines,
      addressLine,
      city,
      pincode,
      coverImageUrl,
      fssaiLicenseUrl,
      businessRegistrationUrl,
      ownerPhone,
    };

    try {
      if (existingApp?.approvalStatus === "rejected") {
        await reapplyAsPartner(submissionData).unwrap();
        toast.success("Reapplication submitted successfully!");
      } else {
        await applyAsPartner(submissionData).unwrap();
        toast.success("Application submitted successfully!");
      }
      router.push("/become-partner");
    } catch (err) {
      const error = err as { data?: { message?: string } };
      toast.error(error.data?.message || "Failed to submit application. Please try again.");
    }
  };

  if (appLoading || !user) {
    return (
      <div className="max-w-3xl mx-auto py-12 flex justify-center items-center">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary">autorenew</span>
      </div>
    );
  }

  const isPendingSubmit = isApplying || isReapplying;
  const isUploadingAny = uploadingCover || uploadingFssai || uploadingReg;

  return (
    <div className="max-w-3xl mx-auto py-8 animate-fade-in">
      <div className="bg-white border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2 border-b border-outline-variant/20 pb-6">
          <h1 className="font-headline-md text-headline-md text-on-background font-bold">
            {existingApp?.approvalStatus === "rejected" ? "Edit & Reapply" : "Partner Application Form"}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Enter your restaurant details and upload your operating certifications below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Restaurant Profile */}
          <div className="space-y-6">
            <h3 className="font-headline-sm text-lg font-bold text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">storefront</span>
              Restaurant Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-label-md text-label-md text-on-background block font-bold">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. The Italian Bistro"
                  className="w-full bg-slate-50 border border-outline-variant/60 rounded-xl px-4 py-3 font-body-md focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-label-md text-label-md text-on-background block font-bold">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell customers what makes your restaurant special (minimum 10 characters)..."
                  className="w-full bg-slate-50 border border-outline-variant/60 rounded-xl px-4 py-3 font-body-md focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all h-28 resize-none"
                  required
                />
              </div>

              <div className="space-y-3 md:col-span-2">
                <label className="font-label-md text-label-md text-on-background block font-bold">
                  Cuisines / Tags
                </label>
                {/* Predefined tags selector */}
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_CUISINES.map((cuisine) => {
                    const isSelected = selectedCuisines.includes(cuisine);
                    return (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => toggleCuisine(cuisine)}
                        className={`px-3 py-1.5 rounded-full font-label-md text-xs border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary text-white border-primary"
                            : "bg-slate-50 hover:bg-slate-100 text-on-surface-variant border-outline-variant/60"
                        }`}
                      >
                        {cuisine}
                      </button>
                    );
                  })}
                </div>

                {/* Custom tag adder */}
                <div className="flex gap-2 max-w-sm">
                  <input
                    type="text"
                    value={customCuisine}
                    onChange={(e) => setCustomCuisine(e.target.value)}
                    placeholder="Add custom cuisine..."
                    className="flex-1 bg-slate-50 border border-outline-variant/60 rounded-xl px-4 py-2 font-body-sm text-sm focus:outline-none focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCuisine}
                    className="bg-slate-100 hover:bg-slate-200 text-on-background font-bold px-4 py-2 rounded-xl text-sm transition-all cursor-pointer border border-outline-variant/30"
                  >
                    Add
                  </button>
                </div>

                {/* Active tags display */}
                {selectedCuisines.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/10">
                    {selectedCuisines.map((cuisine) => (
                      <span
                        key={cuisine}
                        className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-primary px-3 py-1 rounded-lg font-label-md text-xs font-bold"
                      >
                        {cuisine}
                        <button
                          type="button"
                          onClick={() => removeCuisine(cuisine)}
                          className="material-symbols-outlined text-sm font-bold hover:text-rose-500 cursor-pointer"
                        >
                          close
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-label-md text-label-md text-on-background block font-bold">
                  Owner Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center gap-1 text-slate-500 font-bold text-sm pointer-events-none select-none z-10">
                    <span className="material-symbols-outlined text-primary text-base">call</span>
                    <span className="text-slate-700 font-bold border-r border-slate-300 pr-2">+91</span>
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
                    className={`w-full bg-slate-50 border rounded-xl pl-20 pr-4 py-3 font-body-md focus:outline-none transition-all ${
                      phoneTouched && ownerPhone.length > 0 && !isValidPhone(ownerPhone)
                        ? "border-red-500 focus:border-red-500 focus:ring-3 focus:ring-red-500/10"
                        : "border-outline-variant/60 focus:border-primary focus:ring-3 focus:ring-primary/10"
                    }`}
                    required
                  />
                </div>
                {phoneTouched && ownerPhone.length > 0 && !isValidPhone(ownerPhone) && (
                  <span className="text-red-500 text-xs font-semibold mt-1 block">Please enter a valid 10-digit mobile number</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Restaurant Location */}
          <div className="space-y-6 border-t border-outline-variant/20 pt-8">
            <h3 className="font-headline-sm text-lg font-bold text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">pin_drop</span>
              Location Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5 md:col-span-3">
                <label className="font-label-md text-label-md text-on-background block font-bold">
                  Address Line
                </label>
                <input
                  type="text"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="e.g. Shop 12, Ground Floor, Ocean Heights"
                  className="w-full bg-slate-50 border border-outline-variant/60 rounded-xl px-4 py-3 font-body-md focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-label-md text-label-md text-on-background block font-bold">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="w-full bg-slate-50 border border-outline-variant/60 rounded-xl px-4 py-3 font-body-md focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-label-md text-label-md text-on-background block font-bold">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[1-9][0-9]{5}"
                  value={pincode}
                  onChange={(e) => {
                    setPincode(sanitizePincode(e.target.value));
                    if (!pincodeTouched) setPincodeTouched(true);
                  }}
                  onBlur={() => setPincodeTouched(true)}
                  placeholder="e.g. 390001"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 font-body-md focus:outline-none transition-all ${
                    pincodeTouched && pincode.length > 0 && !isValidPincode(pincode)
                      ? "border-red-500 focus:border-red-500 focus:ring-3 focus:ring-red-500/10"
                      : "border-outline-variant/60 focus:border-primary focus:ring-3 focus:ring-primary/10"
                  }`}
                  required
                />
                {pincodeTouched && pincode.length > 0 && !isValidPincode(pincode) && (
                  <span className="text-red-500 text-xs font-semibold mt-1 block">Please enter a valid 6-digit pincode</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Verification Documents */}
          <div className="space-y-6 border-t border-outline-variant/20 pt-8">
            <h3 className="font-headline-sm text-lg font-bold text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">demography</span>
              Verification Documents
            </h3>

            <div className="space-y-6">
              {/* Cover Image */}
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-background block font-bold">
                  Restaurant Cover Photo (JPEG/PNG)
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-on-background font-bold px-5 py-3 rounded-xl text-sm transition-all border border-outline-variant/30 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">cloud_upload</span>
                    {uploadingCover ? "Uploading..." : "Upload Cover Image"}
                  </button>
                  <input
                    type="file"
                    ref={coverInputRef}
                    onChange={(e) => handleFileUpload(e, "cover")}
                    accept="image/*"
                    className="hidden"
                  />
                  {coverImageUrl && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-3 py-2 rounded-xl text-sm font-semibold">
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <span>Uploaded!</span>
                      <a href={coverImageUrl} target="_blank" rel="noreferrer" className="underline font-bold text-xs ml-2">
                        Preview
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* FSSAI License */}
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-background block font-bold">
                  FSSAI License Document (PDF / Image)
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fssaiInputRef.current?.click()}
                    disabled={uploadingFssai}
                    className="bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-on-background font-bold px-5 py-3 rounded-xl text-sm transition-all border border-outline-variant/30 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">cloud_upload</span>
                    {uploadingFssai ? "Uploading..." : "Upload FSSAI License"}
                  </button>
                  <input
                    type="file"
                    ref={fssaiInputRef}
                    onChange={(e) => handleFileUpload(e, "fssai")}
                    accept="application/pdf,image/*"
                    className="hidden"
                  />
                  {fssaiLicenseUrl && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-3 py-2 rounded-xl text-sm font-semibold">
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <span>Uploaded!</span>
                      <a href={fssaiLicenseUrl} target="_blank" rel="noreferrer" className="underline font-bold text-xs ml-2">
                        Preview
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Business Registration */}
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-background block font-bold">
                  GST/Business Registration Certificate (PDF / Image)
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => regInputRef.current?.click()}
                    disabled={uploadingReg}
                    className="bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-on-background font-bold px-5 py-3 rounded-xl text-sm transition-all border border-outline-variant/30 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">cloud_upload</span>
                    {uploadingReg ? "Uploading..." : "Upload Document"}
                  </button>
                  <input
                    type="file"
                    ref={regInputRef}
                    onChange={(e) => handleFileUpload(e, "reg")}
                    accept="application/pdf,image/*"
                    className="hidden"
                  />
                  {businessRegistrationUrl && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-3 py-2 rounded-xl text-sm font-semibold">
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <span>Uploaded!</span>
                      <a href={businessRegistrationUrl} target="_blank" rel="noreferrer" className="underline font-bold text-xs ml-2">
                        Preview
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t border-outline-variant/20 pt-8 flex flex-col-reverse sm:flex-row gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.push("/become-partner")}
              className="bg-slate-100 hover:bg-slate-200 text-on-background font-bold px-6 py-3.5 rounded-xl transition-all cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPendingSubmit || isUploadingAny}
              className="bg-primary hover:bg-primary/95 disabled:bg-indigo-300 text-white font-bold px-8 py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isPendingSubmit && (
                <span className="material-symbols-outlined text-lg animate-spin">autorenew</span>
              )}
              {existingApp?.approvalStatus === "rejected" ? "Submit Reapplication" : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
