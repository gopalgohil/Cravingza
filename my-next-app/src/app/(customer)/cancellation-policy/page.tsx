"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Clock, ShieldCheck, HelpCircle } from "lucide-react";

export default function CancellationRefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Back */}
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Page Header */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
            <RefreshCw className="w-3.5 h-3.5" />
            Official Policy Document
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Cancellation & Refund Policy
          </h1>
          <p className="text-slate-500 text-sm">
            Last updated: August 2026 • Applies to all Cravingza web & mobile app orders
          </p>
        </div>

        {/* Policy Content Sections */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8 text-slate-700 leading-relaxed text-sm">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3 text-slate-900 font-bold text-lg border-b border-slate-100 pb-2">
              <Clock className="w-5 h-5 text-primary" />
              <h2>1. Order Cancellation Grace Period</h2>
            </div>
            <p>
              At Cravingza, we strive to deliver your meals fresh and piping hot. Once an order is placed, our partner restaurants begin meal preparation promptly.
            </p>
            <div className="bg-emerald-50 border border-emerald-200/60 p-4 rounded-2xl text-emerald-900 space-y-2">
              <span className="font-bold block">🟢 1-Minute Free Cancellation Window:</span>
              <p className="text-xs text-emerald-800">
                You can cancel your order within <strong>60 seconds (1 minute)</strong> of placing it, provided the restaurant has not yet accepted or started preparing your meal. In this case, a <strong>100% Full Refund</strong> will be automatically credited to your payment source.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3 text-slate-900 font-bold text-lg border-b border-slate-100 pb-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <h2>2. Late Cancellation Fee (After 1 Minute)</h2>
            </div>
            <p>
              If an order is cancelled after the <strong>1-minute grace period</strong> or after the restaurant has marked the order as <strong>"Accepted / Preparing"</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>
                A <strong>100% Cancellation Charge</strong> equal to the total order value will be levied.
              </li>
              <li>
                No refund will be issued for late cancellations because ingredient costs and kitchen resources are non-recoverable once cooking has commenced.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3 text-slate-900 font-bold text-lg border-b border-slate-100 pb-2">
              <RefreshCw className="w-5 h-5 text-emerald-600" />
              <h2>3. Restaurant / Merchant Rejection Refunds</h2>
            </div>
            <p>
              If a restaurant is unable to fulfill your order due to out-of-stock items, kitchen closure, or heavy rush:
            </p>
            <div className="bg-blue-50 border border-blue-200/60 p-4 rounded-2xl text-blue-900">
              <p className="text-xs leading-relaxed">
                You will receive a <strong>100% Full Refund automatically</strong>, regardless of the time elapsed. You do not need to contact support — the Razorpay auto-refund API will process your payment return immediately.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3 text-slate-900 font-bold text-lg border-b border-slate-100 pb-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <h2>4. Refund Processing Timelines & Modes</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-1">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">
                  Original Payment Source (Razorpay)
                </span>
                <p className="text-xs text-slate-600">
                  Refunds for online orders (UPI, Debit/Credit Card, Netbanking) are processed via Razorpay and take <strong>3 to 5 business days</strong> to reflect in your bank account statement.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-1">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">
                  Cash on Delivery (COD)
                </span>
                <p className="text-xs text-slate-600">
                  Since no advance payment is collected for COD orders, no refund is required upon pre-delivery cancellation.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="font-bold text-slate-900 text-base">Need Assistance with a Refund?</h2>
            <p className="text-xs text-slate-500">
              If your refund has not reflected after 5 business days or if you received incorrect items, please contact our support team at{" "}
              <a href="mailto:support@cravingza.com" className="text-primary font-bold hover:underline">
                support@cravingza.com
              </a>{" "}
              with your Order ID.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
