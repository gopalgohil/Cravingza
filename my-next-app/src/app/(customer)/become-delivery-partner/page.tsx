"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useGetMyDeliveryApplicationQuery } from "@/lib/redux/apiSlice";

export default function BecomeDeliveryPartnerPage() {
  const router = useRouter();
  const { user } = useAppStore();

  // Query delivery application status if logged in
  const { data: appResponse, isLoading, error } = useGetMyDeliveryApplicationQuery(undefined, {
    skip: !user,
  });

  const application = appResponse?.data;

  const handleApplyClick = () => {
    if (!user) {
      router.push("/login?redirect=/become-delivery-partner/apply");
    } else {
      router.push("/become-delivery-partner/apply");
    }
  };

  const renderLandingPage = () => {
    return (
      <div className="space-y-16 py-6 animate-fade-in max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <span className="inline-block bg-primary/10 text-primary font-label-md text-label-md px-4 py-1.5 rounded-full border border-primary/20">
              Deliver with Cravingza
            </span>
            <h1 className="font-headline-lg text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-on-background">
              Earn on your <br className="hidden sm:inline" />
              <span className="text-orange-500 bg-gradient-to-r from-orange-500 to-primary bg-clip-text text-transparent">
                own schedule
              </span>
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mx-auto lg:mx-0">
              Flexible hours, weekly payouts, and a simple app to manage your earnings. Join the Cravingza fleet today and start earning immediately.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={handleApplyClick}
                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white px-8 py-4 rounded-full font-bold text-base shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer animate-pulse duration-[2000ms]"
              >
                Apply Now
              </button>
              <a
                href="#requirements"
                className="w-full sm:w-auto text-center bg-surface-container-lowest text-primary font-bold px-8 py-4 rounded-full border border-outline-variant/30 active:scale-95 transition-all cursor-pointer hover:bg-slate-50"
              >
                View Requirements
              </a>
            </div>
          </div>
          <div className="flex-1 w-full max-w-md lg:max-w-lg relative">
            <div className="relative h-80 sm:h-96 w-full overflow-hidden rounded-[32px] shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
              <img
                src="https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=800"
                alt="Delivery rider on electric scooter smiling warmly"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="font-headline-md text-headline-md text-on-background font-bold">
              Why deliver with Cravingza?
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Get the support, technology, and reliability of a premier delivery partner.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-outline-variant/30 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl font-bold">schedule</span>
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-on-background">Flexible Hours</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Choose when and where you want to work. Set your own hours and be your own boss.
              </p>
            </div>
            <div className="bg-white border border-outline-variant/30 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl font-bold">account_balance_wallet</span>
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-on-background">Weekly Payouts</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                No waiting. Get paid reliably every single week, directly deposited into your bank account.
              </p>
            </div>
            <div className="bg-primary text-white p-8 rounded-3xl shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl font-bold">smartphone</span>
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-white">Simple App</h3>
              <p className="font-body-md text-body-md text-white/90">
                A modern companion app helps you accept jobs, navigate routes, and track your metrics in real-time.
              </p>
            </div>
          </div>
        </div>



        {/* Requirements Section */}
        <div id="requirements" className="bg-slate-50 border border-slate-200/50 rounded-3xl p-8 md:p-12 space-y-8 scroll-mt-20">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="font-headline-md text-headline-md text-on-background font-bold">
              What do I need to apply?
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Make sure you have these details ready before applying.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4 items-start">
              <span className="material-symbols-outlined text-primary text-2xl font-bold shrink-0 mt-0.5">check_circle</span>
              <div>
                <h4 className="font-bold text-on-background text-base">Vehicle & Drivers License</h4>
                <p className="text-sm text-on-surface-variant mt-1">
                  A cycle, motorcycle, or car. Motorized vehicles require a valid Indian Driving License.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="material-symbols-outlined text-primary text-2xl font-bold shrink-0 mt-0.5">check_circle</span>
              <div>
                <h4 className="font-bold text-on-background text-base">Identity Verification</h4>
                <p className="text-sm text-on-surface-variant mt-1">
                  A valid Aadhaar Card or Govt ID for identity verification.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="material-symbols-outlined text-primary text-2xl font-bold shrink-0 mt-0.5">check_circle</span>
              <div>
                <h4 className="font-bold text-on-background text-base">Bank Account</h4>
                <p className="text-sm text-on-surface-variant mt-1">
                  An active bank account in your name to receive weekly direct payouts.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="material-symbols-outlined text-primary text-2xl font-bold shrink-0 mt-0.5">check_circle</span>
              <div>
                <h4 className="font-bold text-on-background text-base">Smartphone</h4>
                <p className="text-sm text-on-surface-variant mt-1">
                  An Android or iOS smartphone with an active internet connection to receive jobs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center py-6">
          <h2 className="font-headline-lg text-3xl font-extrabold text-on-background">Ready to get started?</h2>
          <p className="font-body-md text-on-surface-variant mt-2">Applications take less than 5 minutes to submit.</p>
          <div className="mt-8">
            <button
              onClick={handleApplyClick}
              className="bg-primary hover:bg-primary/95 text-white px-10 py-4 rounded-full font-bold text-base shadow-xl shadow-primary/20 active:scale-95 transition-all cursor-pointer"
            >
              Start My Application
            </button>
          </div>
          <p className="mt-4 text-xs text-on-surface-variant">
            By continuing, you agree to our <a href="#" className="underline text-primary">Terms of Service</a> & <a href="#" className="underline text-primary">Privacy Policy</a>
          </p>
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

  // If not logged in OR has no application, show the Marketing Landing Page
  if (!user || error || !application) {
    return renderLandingPage();
  }

  const status = application.approvalStatus;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8 animate-fade-in px-4">
      {status === "pending" && (
        <div className="bg-white border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
          {/* Top Banner (High-fidelity Stitch style) */}
          <div className="bg-amber-50 border-b border-amber-200/50 p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl animate-spin" style={{ animationDuration: "3s" }}>
                pending
              </span>
            </div>
            <div className="space-y-1">
              <h2 className="font-headline-sm text-lg font-bold text-amber-900">Application Under Review</h2>
              <p className="font-body-sm text-body-sm text-amber-800">
                We have received your application. Our operational review team is currently verifying your documents and bank details.
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
                    <h4 className="font-label-md text-label-md font-bold text-on-background">Operational Verification</h4>
                    <p className="font-caption text-caption text-on-surface-variant">
                      Verifying driving license, Aadhaar, and bank account status. Usually takes 24-48 hours.
                    </p>
                  </div>
                </div>

                {/* Step 3: Pending */}
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0 relative z-10 border border-outline-variant/30">
                    <span className="material-symbols-outlined text-lg font-bold">sports_motorsports</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md font-bold text-slate-400">Launch Rider Console</h4>
                    <p className="font-caption text-caption text-slate-400">
                      Receive delivery jobs, track earnings, and start delivering hot food in your city.
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
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Service Area</span>
                  <span className="font-body-md text-body-md font-bold text-on-background">{application.city}</span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Vehicle Type</span>
                  <span className="font-body-md text-body-md font-bold text-on-background capitalize">{application.vehicleType.replace("_", " ")}</span>
                </div>
                {application.vehicleNumber && (
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Vehicle Number</span>
                    <span className="font-body-md text-body-md font-bold text-on-background uppercase">{application.vehicleNumber}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Contact Phone</span>
                  <span className="font-body-md text-body-md text-on-background">{application.phone}</span>
                </div>
                <div className="md:col-span-2 border-t border-slate-200/50 pt-3 mt-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Aadhaar Verification</span>
                    <a
                      href={application.documents?.aadhaarCard}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary font-body-sm text-body-sm hover:underline flex items-center gap-1.5 mt-1"
                    >
                      <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                      View Uploaded Aadhaar Card
                    </a>
                  </div>
                  {application.documents?.drivingLicense && (
                    <div>
                      <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Driving License</span>
                      <a
                        href={application.documents?.drivingLicense}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary font-body-sm text-body-sm hover:underline flex items-center gap-1.5 mt-1"
                      >
                        <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                        View Uploaded Driving License
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {status === "rejected" && (
        <div className="bg-white border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
          {/* Top Banner (High-fidelity Stitch style) */}
          <div className="bg-rose-50 border-b border-rose-200/50 p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                error
              </span>
            </div>
            <div className="space-y-1">
              <h2 className="font-headline-sm text-lg font-bold text-rose-900">Application Not Approved</h2>
              <p className="font-body-sm text-body-sm text-rose-800">
                Unfortunately, our review team could not approve your application at this time. Please see the details below.
              </p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-rose-50/50 border border-rose-100 p-6 rounded-2xl space-y-2 border-l-4 border-l-rose-500">
              <span className="text-[10px] text-rose-800 font-bold uppercase tracking-wider block">Reason for rejection</span>
              <p className="font-body-md text-body-md text-on-surface font-semibold">
                {application.rejectionReason || "Blurry or incomplete verification documents"}
              </p>
              <p className="text-xs text-on-surface-variant mt-2">
                Please re-upload a clear copy of your Aadhaar card and/or Driving License. Make sure all text and photo details are fully visible and legible.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-between items-center border-t border-outline-variant/20">
              <p className="font-caption text-caption text-on-surface-variant max-w-sm text-center sm:text-left">
                You can correct the fields, re-upload clear copies of your documents, and submit again. Reviews take 24-48 hours.
              </p>
               <Link
                href="/become-delivery-partner/apply"
                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-center px-6 py-3.5 rounded-full font-bold active:scale-95 transition-all shadow-md shadow-orange-500/20"
              >
                Reapply
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
            <h2 className="font-headline-md text-headline-md text-on-background font-bold">Rider Application Approved!</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
              Welcome to the Cravingza Rider network! Your partner application has been approved. You are ready to log into the console and deliver orders.
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/delivery-partner/dashboard"
              className="bg-primary hover:bg-primary/95 text-white px-8 py-3.5 rounded-full font-bold shadow-md shadow-primary/20 active:scale-95 transition-all inline-block"
            >
              Go to Rider Console
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
