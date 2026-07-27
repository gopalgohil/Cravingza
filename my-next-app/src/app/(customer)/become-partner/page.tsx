"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useGetMyApplicationQuery } from "@/lib/redux/apiSlice";

export default function BecomePartnerPage() {
  const router = useRouter();
  const { user } = useAppStore();

  // Only run query if user is logged in
  const { data: appResponse, isLoading, error } = useGetMyApplicationQuery(undefined, {
    skip: !user,
  });

  const application = appResponse?.data;

  // Render Marketing Landing Page
  const renderLandingPage = () => {
    return (
      <div className="space-y-16 py-6 animate-fade-in">
        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <span className="inline-block bg-primary-container/20 text-indigo-300 font-label-md text-label-md px-4 py-1.5 rounded-full border border-indigo-500/30">
              Partner with Cravingza
            </span>
            <h1 className="font-headline-lg text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Grow Your Business <br />
              <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">
                With Food Delivery
              </span>
            </h1>
            <p className="font-body-md text-body-md text-slate-300 max-w-lg mx-auto md:mx-0">
              Reach thousands of hungry customers in your city. Partner with us to list your menu, receive orders, and grow your revenue overnight.
            </p>
            <div className="pt-4">
              <button
                onClick={() => {
                  if (!user) {
                    router.push("/login?redirect=/become-partner/apply");
                  } else {
                    router.push("/become-partner/apply");
                  }
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/20 active:scale-95 hover:scale-[1.02] transition-all cursor-pointer"
              >
                Start Your Journey
              </button>
            </div>
          </div>
          <div className="flex-1 w-full max-w-sm md:max-w-md">
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800"
              alt="Busy professional kitchen preparing orders"
              className="rounded-2xl object-cover h-64 md:h-80 w-full shadow-lg border border-slate-700/50"
            />
          </div>
        </div>

        {/* Value Proposition Grid */}
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="font-headline-md text-headline-md text-on-background font-bold">
              Why Partner with Cravingza?
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              We provide the tools, the tech, and the delivery network so you can focus entirely on cooking delicious food.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-outline-variant/30 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">trending_up</span>
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-on-background">Massive Reach</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Unlock thousands of daily active users browsing on Cravingza. Instantly expand your customer base outside your local neighborhood.
              </p>
            </div>
            <div className="bg-white border border-outline-variant/30 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">local_shipping</span>
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-on-background">Seamless Logistics</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Our fleet of delivery partners ensures food is picked up hot and delivered fast. No need to manage your own drivers.
              </p>
            </div>
            <div className="bg-white border border-outline-variant/30 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">storefront</span>
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-on-background">Merchant Tools</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Manage your menu, track live sales, analyze customer ratings, and process payouts using our modern owner dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Process Steps */}
        <div className="bg-slate-50 rounded-3xl p-8 md:p-12 space-y-8 border border-outline-variant/20">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="font-headline-md text-headline-md text-on-background font-bold">
              Simple 3-Step Onboarding
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Submit your documents and we will get your restaurant live in less than 48 hours.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-headline-sm text-base font-bold text-on-background mb-1">Submit Application</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Fill out restaurant info and upload your business FSSAI License & Registration.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-headline-sm text-base font-bold text-on-background mb-1">Verification Review</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Our operations team reviews your license and approves your partner status.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-headline-sm text-base font-bold text-on-background mb-1">Go Live & Earn</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Log into your owner dashboard, upload your menu items, and start accepting orders!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-6">
        <div className="h-40 w-full bg-slate-100 rounded-3xl animate-pulse" />
        <div className="h-6 w-1/3 bg-slate-100 rounded-md animate-pulse" />
        <div className="h-24 w-full bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  // User is not logged in OR has no application
  if (!user || error || !application) {
    return renderLandingPage();
  }

  // Handle Application States
  const status = application.approvalStatus;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8 animate-fade-in">
      {status === "pending" && (
        <div className="bg-white border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
          {/* Top Banner */}
          <div className="bg-amber-50 border-b border-amber-200/50 p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl animate-spin" style={{ animationDuration: "3s" }}>pending</span>
            </div>
            <div className="space-y-1">
              <h2 className="font-headline-sm text-lg font-bold text-amber-900">Application Under Review</h2>
              <p className="font-body-sm text-body-sm text-amber-800">
                {"We've received your application and our team is verifying your business details and FSSAI license."}
              </p>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Visual Process Timeline */}
            <div className="relative">
              <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-100" />
              
              <div className="space-y-6 relative">
                {/* Step 1: Completed */}
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 relative z-10 shadow-sm shadow-green-500/20">
                    <span className="material-symbols-outlined text-lg">check</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md font-bold text-on-background">Application Submitted</h4>
                    <p className="font-caption text-caption text-on-surface-variant">
                      Submitted on {new Date(application.submittedAt || application.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Step 2: In Progress */}
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0 relative z-10 shadow-sm shadow-amber-500/20 animate-pulse">
                    <span className="material-symbols-outlined text-lg">history</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md font-bold text-on-background">Verification Review</h4>
                    <p className="font-caption text-caption text-on-surface-variant">
                      {"Operations team is verifying your FSSAI license & documents. (Usually takes 24-48 hours)"}
                    </p>
                  </div>
                </div>

                {/* Step 3: Pending */}
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0 relative z-10 border border-outline-variant/30">
                    <span className="material-symbols-outlined text-lg font-bold">store</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md font-bold text-slate-400">Launch Restaurant Console</h4>
                    <p className="font-caption text-caption text-slate-400">
                      Access dashboard, upload menu items, and start accepting orders.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Summary */}
            <div className="border-t border-outline-variant/30 pt-8 space-y-4">
              <h3 className="font-headline-sm text-base font-bold text-on-background">Application Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-outline-variant/25">
                <div>
                  <span className="text-caption text-on-surface-variant font-label-md block">Restaurant Name</span>
                  <span className="font-body-md text-body-md font-bold text-on-background">{application.name}</span>
                </div>
                <div>
                  <span className="text-caption text-on-surface-variant font-label-md block">Owner Phone</span>
                  <span className="font-body-md text-body-md text-on-background">{application.ownerPhone}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-caption text-on-surface-variant font-label-md block">Address</span>
                  <span className="font-body-md text-body-md text-on-background">
                    {application.location?.address}, {application.location?.city} - {application.pincode}
                  </span>
                </div>
                <div>
                  <span className="text-caption text-on-surface-variant font-label-md block">FSSAI License</span>
                  <a
                    href={application.documents?.fssaiLicense}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-body-sm text-body-sm hover:underline flex items-center gap-1.5 mt-1"
                  >
                    <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                    View FSSAI License
                  </a>
                </div>
                <div>
                  <span className="text-caption text-on-surface-variant font-label-md block">Business Registration</span>
                  <a
                    href={application.documents?.businessRegistration}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-body-sm text-body-sm hover:underline flex items-center gap-1.5 mt-1"
                  >
                    <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                    View Registration Document
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {status === "rejected" && (
        <div className="bg-white border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
          {/* Top Banner */}
          <div className="bg-rose-50 border-b border-rose-200/50 p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">error</span>
            </div>
            <div className="space-y-1">
              <h2 className="font-headline-sm text-lg font-bold text-rose-900">Application Rejected</h2>
              <p className="font-body-sm text-body-sm text-rose-800">
                Unfortunately, your application was not approved. Review the feedback below to reapply.
              </p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-rose-50/50 border border-rose-100 p-6 rounded-2xl space-y-2">
              <span className="font-label-md text-label-md text-rose-800 font-bold block">Reason for Rejection</span>
              <p className="font-body-md text-body-md text-on-surface">
                {application.rejectionReason || "No feedback left by reviewer. Please double-check FSSAI and registration uploads."}
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <p className="font-caption text-caption text-on-surface-variant max-w-md text-center sm:text-left">
                Ensure all documents are clearly legible and valid. If you believe there was a mistake, please correct the fields and submit again.
              </p>
              <Link
                href="/become-partner/apply"
                className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-white text-center px-6 py-3.5 rounded-xl font-bold active:scale-95 transition-all"
              >
                Edit & Reapply
              </Link>
            </div>
          </div>
        </div>
      )}

      {status === "approved" && (
        <div className="bg-white border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto shadow-sm">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>
          <div className="space-y-2">
            <h2 className="font-headline-md text-headline-md text-on-background font-bold">Partner Onboarding Complete!</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
              Welcome to Cravingza! Your restaurant partner application has been approved. You are ready to start listing dishes and accepting orders.
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/restaurant-owner/dashboard"
              className="bg-primary hover:bg-primary/95 text-white px-8 py-3.5 rounded-xl font-bold shadow-md shadow-primary/20 active:scale-95 transition-all inline-block"
            >
              Go to Owner Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
