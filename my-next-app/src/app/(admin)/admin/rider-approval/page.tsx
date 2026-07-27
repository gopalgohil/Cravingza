"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RiderApprovalRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "pending";
  const id = searchParams.get("id") || "";

  useEffect(() => {
    router.replace(`/admin/approvals?type=delivery_partners&status=${status}${id ? `&id=${id}` : ""}`);
  }, [router, status, id]);

  return (
    <div className="h-64 flex items-center justify-center">
      <span className="material-symbols-outlined text-3xl animate-spin text-primary">autorenew</span>
    </div>
  );
}
