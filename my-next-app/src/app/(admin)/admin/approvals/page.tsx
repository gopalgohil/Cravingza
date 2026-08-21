"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useGetAdminRestaurantsQuery,
  useGetAdminRestaurantByIdQuery,
  useApproveRestaurantMutation,
  useRejectRestaurantMutation,
  useDeactivateRestaurantMutation,
  useReactivateRestaurantMutation,
  useGetAdminDeliveryProfilesQuery,
  useGetAdminDeliveryProfileByIdQuery,
  useApproveDeliveryPartnerMutation,
  useRejectDeliveryPartnerMutation,
} from "@/lib/redux/apiSlice";
import { toast } from "sonner";

export default function ApprovalsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Controlled Local State for Tabs (guarantees instant tab switching)
  const [activeType, setActiveType] = useState<string>("restaurants");
  const [activeStatus, setActiveStatus] = useState<string>("pending");
  const [selectedId, setSelectedId] = useState<string>("");

  // Sync state with URL searchParams on mount or searchParams change
  useEffect(() => {
    const paramType = searchParams.get("type");
    const paramStatus = searchParams.get("status");
    const paramId = searchParams.get("id");

    if (paramType && paramType !== activeType) {
      setActiveType(paramType);
    }
    if (paramStatus && paramStatus !== activeStatus) {
      setActiveStatus(paramStatus);
    }
    if (paramId !== null && paramId !== selectedId) {
      setSelectedId(paramId);
    }
  }, [searchParams]);

  // ── RESTAURANT QUERIES & MUTATIONS ──
  const {
    data: restaurantListData,
    isLoading: restaurantListLoading,
    isFetching: restaurantListFetching,
    refetch: refetchRestaurantList,
  } = useGetAdminRestaurantsQuery(activeStatus, { skip: activeType !== "restaurants" });

  const {
    data: restaurantDetailData,
    isLoading: restaurantDetailLoading,
    isFetching: restaurantDetailFetching,
  } = useGetAdminRestaurantByIdQuery(selectedId, {
    skip: activeType !== "restaurants" || !selectedId,
  });

  const [approveRestaurant, { isLoading: isApprovingRestaurant }] = useApproveRestaurantMutation();
  const [rejectRestaurant, { isLoading: isRejectingRestaurant }] = useRejectRestaurantMutation();

  // ── DELIVERY PARTNER QUERIES & MUTATIONS ──
  const {
    data: deliveryListData,
    isLoading: deliveryListLoading,
    isFetching: deliveryListFetching,
    refetch: refetchDeliveryList,
  } = useGetAdminDeliveryProfilesQuery(activeStatus, { skip: activeType !== "delivery_partners" });

  const {
    data: deliveryDetailData,
    isLoading: deliveryDetailLoading,
    isFetching: deliveryDetailFetching,
  } = useGetAdminDeliveryProfileByIdQuery(selectedId, {
    skip: activeType !== "delivery_partners" || !selectedId,
  });

  const [approveDelivery, { isLoading: isApprovingDelivery }] = useApproveDeliveryPartnerMutation();
  const [rejectDelivery, { isLoading: isRejectingDelivery }] = useRejectDeliveryPartnerMutation();
  const [deactivateRestaurant, { isLoading: isDeactivatingRestaurant }] = useDeactivateRestaurantMutation();
  const [reactivateRestaurant, { isLoading: isReactivatingRestaurant }] = useReactivateRestaurantMutation();

  // Local Modal States
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState("");
  const [suspendOwner, setSuspendOwner] = useState(false);
  const [isReactivateConfirmOpen, setIsReactivateConfirmOpen] = useState(false);

  // Pagination State (4 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageChanging, setIsPageChanging] = useState(false);
  const ITEMS_PER_PAGE = 4;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeType, activeStatus]);

  // Derived datasets
  const isRestaurants = activeType === "restaurants";
  const listLoading = isRestaurants
    ? restaurantListLoading || restaurantListFetching
    : deliveryListLoading || deliveryListFetching;
  const detailLoading = isRestaurants
    ? restaurantDetailLoading || restaurantDetailFetching
    : deliveryDetailLoading || deliveryDetailFetching;

  const items = isRestaurants ? restaurantListData?.data || [] : deliveryListData?.data || [];
  const counts = isRestaurants
    ? restaurantListData?.counts || { pending: 0, approved: 0, rejected: 0, all: 0 }
    : deliveryListData?.counts || { pending: 0, approved: 0, rejected: 0, all: 0 };

  const selectedItem = isRestaurants
    ? restaurantDetailData?.data || null
    : deliveryDetailData?.data || null;

  // Pagination calculations
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage === safeCurrentPage || newPage < 1 || newPage > totalPages) return;
    setIsPageChanging(true);
    setCurrentPage(newPage);
    setTimeout(() => {
      setIsPageChanging(false);
    }, 300);
  };

  const showSkeleton = listLoading || isPageChanging;

  // Auto-select first item if none selected or if selectedId is invalid for current status/type list
  useEffect(() => {
    if (items.length > 0 && typeof window !== "undefined" && window.innerWidth >= 1024) {
      const isSelectedInList = items.some((item: any) => item._id === selectedId);
      if (!selectedId || !isSelectedInList) {
        const firstId = items[0]._id;
        setSelectedId(firstId);
        router.replace(`/admin/approvals?type=${activeType}&status=${activeStatus}&id=${firstId}`);
      }
    } else if (items.length === 0 && selectedId) {
      setSelectedId("");
    }
  }, [items, selectedId, activeType, activeStatus, router]);

  const handleTypeChange = (type: string) => {
    setIsPageChanging(true);
    setActiveType(type);
    setSelectedId("");
    router.push(`/admin/approvals?type=${type}&status=${activeStatus}`);
    setTimeout(() => setIsPageChanging(false), 300);
  };

  const handleStatusChange = (status: string) => {
    setIsPageChanging(true);
    setActiveStatus(status);
    setSelectedId("");
    router.push(`/admin/approvals?type=${activeType}&status=${status}`);
    setTimeout(() => setIsPageChanging(false), 300);
  };

  const handleSelectItem = (id: string) => {
    setSelectedId(id);
    router.push(`/admin/approvals?type=${activeType}&status=${activeStatus}&id=${id}`);
  };

  const handleApprove = async () => {
    if (!selectedId) return;
    try {
      if (isRestaurants) {
        const res = await approveRestaurant(selectedId).unwrap();
        if (res.success) {
          toast.success("Restaurant application approved successfully!");
          refetchRestaurantList();
        }
      } else {
        const res = await approveDelivery(selectedId).unwrap();
        if (res.success) {
          toast.success("Delivery partner application approved successfully!");
          refetchDeliveryList();
        }
      }
      setIsApproveConfirmOpen(false);
      router.push(`/admin/approvals?type=${activeType}&status=${activeStatus}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.data?.message || "Failed to approve application.");
    }
  };

  const handleReject = async () => {
    if (!selectedId || !rejectionReason.trim()) return;
    try {
      if (isRestaurants) {
        const res = await rejectRestaurant({ id: selectedId, reason: rejectionReason }).unwrap();
        if (res.success) {
          toast.success("Restaurant application rejected.");
          refetchRestaurantList();
        }
      } else {
        const res = await rejectDelivery({ id: selectedId, reason: rejectionReason }).unwrap();
        if (res.success) {
          toast.success("Delivery partner application rejected.");
          refetchDeliveryList();
        }
      }
      setIsRejectModalOpen(false);
      setRejectionReason("");
      router.push(`/admin/approvals?type=${activeType}&status=${activeStatus}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.data?.message || "Failed to reject application.");
    }
  };

  const handleDeactivate = async () => {
    if (!selectedId || !deactivationReason.trim()) return;
    try {
      const res = await deactivateRestaurant({
        id: selectedId,
        reason: deactivationReason.trim(),
        suspendOwner,
      }).unwrap();
      if (res.success) {
        toast.success(`"${selectedItem?.name || "Restaurant"}" has been deactivated.`);
        refetchRestaurantList();
        setIsDeactivateModalOpen(false);
        setDeactivationReason("");
        setSuspendOwner(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.data?.message || "Failed to deactivate restaurant.");
    }
  };

  const handleReactivate = async () => {
    if (!selectedId) return;
    try {
      const res = await reactivateRestaurant(selectedId).unwrap();
      if (res.success) {
        toast.success(`"${selectedItem?.name || "Restaurant"}" has been reactivated.`);
        refetchRestaurantList();
        setIsReactivateConfirmOpen(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.data?.message || "Failed to reactivate restaurant.");
    }
  };

  const isApproving = isRestaurants ? isApprovingRestaurant : isApprovingDelivery;
  const isRejecting = isRestaurants ? isRejectingRestaurant : isRejectingDelivery;

  return (
    <div className="space-y-lg animate-fade-in pb-12 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="font-headline-md text-headline-md font-extrabold text-slate-900 tracking-tight">
          Application Approvals Console
        </h1>
        <p className="font-body-md text-body-md text-slate-500 mt-1">
          Review onboarding requests, verify credentials and permits for restaurants and delivery partners.
        </p>
      </div>

      {/* ── TOP-LEVEL TYPE TAB SWITCH ("Restaurants" vs "Delivery Partners") ── */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm inline-flex gap-1">
        <button
          onClick={() => handleTypeChange("restaurants")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            isRestaurants
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <span className="material-symbols-outlined text-lg">storefront</span>
          <span>Restaurants</span>
        </button>

        <button
          onClick={() => handleTypeChange("delivery_partners")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            !isRestaurants
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <span className="material-symbols-outlined text-lg">sports_motorsports</span>
          <span>Delivery Partners</span>
        </button>
      </div>

      {/* ── STATUS FILTER TABS (Pending | Approved | Rejected) ── */}
      <div className="flex gap-sm border-b border-slate-200 pb-px">
        {[
          { key: "pending", label: "Pending", count: counts.pending, color: "text-amber-600 bg-amber-50" },
          { key: "approved", label: "Approved", count: counts.approved, color: "text-emerald-600 bg-emerald-50" },
          { key: "rejected", label: "Rejected", count: counts.rejected, color: "text-rose-600 bg-rose-50" },
        ].map((tab) => {
          const isActive = activeStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleStatusChange(tab.key)}
              className={`flex items-center gap-sm px-6 py-3.5 font-label-md text-label-md transition-all border-b-2 font-bold cursor-pointer -mb-0.5 ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${tab.color}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: LIST OF APPLICATIONS */}
        <div className="lg:col-span-2 space-y-md">
          {showSkeleton ? (
            <div className="space-y-md animate-fade-in">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm animate-pulse space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 bg-slate-200 rounded-lg w-48"></div>
                      <div className="h-3 bg-slate-200 rounded-lg w-72"></div>
                    </div>
                    <div className="h-4 bg-slate-200 rounded-md w-16"></div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <div className="h-3 bg-slate-200 rounded w-20"></div>
                    <div className="h-3 bg-slate-200 rounded w-24"></div>
                    <div className="h-3 bg-slate-200 rounded w-28"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
              <span className="material-symbols-outlined text-5xl text-slate-300">
                {isRestaurants ? "storefront" : "sports_motorsports"}
              </span>
              <h3 className="font-bold text-slate-700 text-lg mt-3">No applications found</h3>
              <p className="text-sm text-slate-400 mt-1">
                There are no {isRestaurants ? "restaurant" : "delivery partner"} requests in the {activeStatus} stage.
              </p>
            </div>
          ) : (
            <div key={`${activeType}-${activeStatus}-${safeCurrentPage}`} className="space-y-md animate-fade-in">
              {paginatedItems.map((item: any) => {
                const isSelected = selectedId === item._id;

                if (isRestaurants) {
                  // Restaurant item row
                  const docCount =
                    (item.documents?.fssaiLicense ? 1 : 0) + (item.documents?.businessRegistration ? 1 : 0);

                  return (
                    <div
                      key={item._id}
                      onClick={() => handleSelectItem(item._id)}
                      className={`bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/10 bg-primary/5"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-md">
                        <div className="space-y-sm min-w-0">
                          <div className="flex items-center gap-sm">
                            <h3 className="font-bold text-slate-800 text-base truncate pr-2">{item.name}</h3>
                            {item.adminDeactivated ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase">
                                Deactivated
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 uppercase">
                                {item.deliveryTime}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{item.description || "No description provided."}</p>

                          <div className="flex flex-wrap items-center gap-x-md gap-y-sm text-xs text-slate-400 font-medium pt-1">
                            <span className="flex items-center gap-xs">
                              <span className="material-symbols-outlined text-base">person</span>
                              {item.owner?.name || "Unassigned"}
                            </span>
                            <span className="flex items-center gap-xs">
                              <span className="material-symbols-outlined text-base">pin_drop</span>
                              {item.location?.city || "Unknown City"}
                            </span>
                            <span className="flex items-center gap-xs">
                              <span className="material-symbols-outlined text-base">description</span>
                              {docCount} perm/{docCount === 2 ? "FSSAI Verified" : "Partial"}
                            </span>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-sm shrink-0 border-t sm:border-t-0 border-slate-50 pt-2 sm:pt-0">
                          <span className="text-[10px] text-slate-400 font-bold">
                            Applied:{" "}
                            {new Date(item.submittedAt || item.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                          <span className="material-symbols-outlined text-slate-400 hidden sm:block">
                            arrow_forward
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Delivery partner item row
                  const hasAadhaar = Boolean(item.documents?.aadhaarCard);
                  const hasLicense = Boolean(item.documents?.drivingLicense);
                  const docCount = (hasAadhaar ? 1 : 0) + (hasLicense ? 1 : 0);

                  return (
                    <div
                      key={item._id}
                      onClick={() => handleSelectItem(item._id)}
                      className={`bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/10 bg-primary/5"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-md">
                        <div className="space-y-sm min-w-0">
                          <div className="flex items-center gap-sm">
                            <h3 className="font-bold text-slate-800 text-base truncate pr-2">
                              {item.user?.name || "Delivery Partner"}
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-primary/10 text-primary uppercase">
                              {item.vehicleType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {item.user?.email} • {item.phone}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-md gap-y-sm text-xs text-slate-400 font-medium pt-1">
                            <span className="flex items-center gap-xs">
                              <span className="material-symbols-outlined text-base">directions_bike</span>
                              {item.vehicleNumber || item.vehicleType}
                            </span>
                            <span className="flex items-center gap-xs">
                              <span className="material-symbols-outlined text-base">pin_drop</span>
                              {item.city} ({item.pincode})
                            </span>
                            <span className="flex items-center gap-xs">
                              <span className="material-symbols-outlined text-base">badge</span>
                              {docCount} Verification Docs
                            </span>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-sm shrink-0 border-t sm:border-t-0 border-slate-50 pt-2 sm:pt-0">
                          <span className="text-[10px] text-slate-400 font-bold">
                            Applied:{" "}
                            {new Date(item.submittedAt || item.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                          <span className="material-symbols-outlined text-slate-400 hidden sm:block">
                            arrow_forward
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}

              {/* ── PAGINATION CONTROLS ── */}
              {items.length > ITEMS_PER_PAGE && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/80 bg-white/80 p-4 rounded-3xl shadow-sm">
                  <span className="text-xs text-slate-500 font-medium">
                    Showing <strong className="text-slate-800">{startIndex + 1}</strong> to{" "}
                    <strong className="text-slate-800">{Math.min(startIndex + ITEMS_PER_PAGE, items.length)}</strong> of{" "}
                    <strong className="text-slate-800">{items.length}</strong> {isRestaurants ? "restaurants" : "delivery partners"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePageChange(safeCurrentPage - 1)}
                      disabled={safeCurrentPage === 1 || isPageChanging}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                      Prev
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        disabled={isPageChanging}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          safeCurrentPage === page
                            ? "bg-primary text-white shadow-sm shadow-primary/20 scale-105"
                            : "border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(safeCurrentPage + 1)}
                      disabled={safeCurrentPage === totalPages || isPageChanging}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      Next
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DETAIL REVIEW PANEL */}
        <div className="lg:sticky lg:top-6">
          {!selectedId ? (
            <div className="hidden lg:block bg-slate-100/50 border border-slate-200/50 rounded-3xl p-8 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2">find_in_page</span>
              <p className="text-sm font-bold">No application selected</p>
              <p className="text-xs mt-1">Select an item from the left list to review complete verification details.</p>
            </div>
          ) : detailLoading ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-lg animate-pulse space-y-xl">
              <div className="h-6 w-32 bg-slate-200 rounded"></div>
              <div className="space-y-sm">
                <div className="h-4 w-full bg-slate-200 rounded"></div>
                <div className="h-4 w-4/5 bg-slate-200 rounded"></div>
              </div>
              <div className="h-24 bg-slate-200 rounded-2xl"></div>
            </div>
          ) : !selectedItem ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center text-slate-500">
              <span className="material-symbols-outlined text-4xl text-rose-500 mb-2">error</span>
              <p className="text-sm font-bold">Application details not found</p>
            </div>
          ) : isRestaurants ? (
            /* RESTAURANT DETAIL PANEL */
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md space-y-xl animate-fade-in relative">
              <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                    Restaurant Details
                  </span>
                  <h2 className="font-headline-sm text-headline-sm font-extrabold text-slate-900 mt-1">
                    {selectedItem.name}
                  </h2>
                </div>
                <button
                  onClick={() => router.push(`/admin/approvals?type=${activeType}&status=${activeStatus}`)}
                  className="lg:hidden p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined text-slate-500">close</span>
                </button>
              </div>

              {/* Cover Photo Banner Preview */}
              {selectedItem.image ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.name}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">image</span>
                    Cover Photo
                  </div>
                  <a
                    href={selectedItem.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-slate-800 font-bold text-xs px-3 py-1.5 rounded-xl shadow-md backdrop-blur-md transition-all flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    View Full Image
                  </a>
                </div>
              ) : (
                <div className="p-4 bg-amber-50/60 border border-amber-200/60 rounded-2xl text-amber-800 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-amber-600">image_not_supported</span>
                  <span>No cover photo uploaded for this restaurant.</span>
                </div>
              )}

              <div className="space-y-md">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Cuisine & Tags</h4>
                  <div className="flex flex-wrap gap-xs mt-2">
                    {selectedItem.cuisineTags?.map((tag: string, index: number) => (
                      <span key={index} className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Owner Contact</h4>
                  <div className="bg-slate-50/50 border border-slate-100/50 rounded-2xl p-3.5 space-y-2 mt-2">
                    <p className="text-sm text-slate-700 font-semibold flex items-center gap-xs">
                      <span className="material-symbols-outlined text-slate-400 text-base">person</span>
                      {selectedItem.owner?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-xs">
                      <span className="material-symbols-outlined text-slate-400 text-base">mail</span>
                      {selectedItem.owner?.email || "No Email"}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-xs">
                      <span className="material-symbols-outlined text-slate-400 text-base">call</span>
                      {selectedItem.ownerPhone || "No Phone"}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Location Details</h4>
                  <p className="text-sm text-slate-700 font-semibold mt-1 flex items-start gap-xs">
                    <span className="material-symbols-outlined text-slate-400 text-lg shrink-0 mt-0.5">pin_drop</span>
                    {selectedItem.location?.address}, {selectedItem.location?.city}
                  </p>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-md border-t border-slate-50 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Business Credentials & Verification Documents</h4>
                <div className="grid grid-cols-1 gap-md">
                  {selectedItem.documents?.fssaiLicense ? (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
                          <div>
                            <p className="text-xs font-bold text-slate-800">FSSAI Permit License</p>
                            <p className="text-[10px] text-slate-400">Official Food Safety Certificate</p>
                          </div>
                        </div>
                        <a
                          href={selectedItem.documents.fssaiLicense}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <span>View Original</span>
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </a>
                      </div>

                      {/* Image Preview Thumbnail */}
                      <a
                        href={selectedItem.documents.fssaiLicense}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative rounded-xl overflow-hidden border border-slate-200 mt-2 hover:opacity-90 transition-opacity bg-white"
                      >
                        <img
                          src={selectedItem.documents.fssaiLicense}
                          alt="FSSAI License Document"
                          className="w-full h-36 object-contain p-2 bg-slate-100/50"
                          onError={(e) => {
                            // Fallback if not direct image
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </a>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-rose-50/50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-sm text-xs">
                      <span className="material-symbols-outlined text-lg">warning</span>
                      <span>Missing FSSAI License Document</span>
                    </div>
                  )}

                  {selectedItem.documents?.businessRegistration ? (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
                          <div>
                            <p className="text-xs font-bold text-slate-800">Business Registration</p>
                            <p className="text-[10px] text-slate-400">Official Business Registry Copy</p>
                          </div>
                        </div>
                        <a
                          href={selectedItem.documents.businessRegistration}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <span>View Original</span>
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </a>
                      </div>

                      {/* Image Preview Thumbnail */}
                      <a
                        href={selectedItem.documents.businessRegistration}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative rounded-xl overflow-hidden border border-slate-200 mt-2 hover:opacity-90 transition-opacity bg-white"
                      >
                        <img
                          src={selectedItem.documents.businessRegistration}
                          alt="Business Registration Document"
                          className="w-full h-36 object-contain p-2 bg-slate-100/50"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </a>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-rose-50/50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-sm text-xs">
                      <span className="material-symbols-outlined text-lg">warning</span>
                      <span>Missing Business Registry copy</span>
                    </div>
                  )}
                </div>
              </div>

              {/* History */}
              {selectedItem.approvalStatus === "rejected" || selectedItem.rejectionReason ? (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-1">
                  <p className="text-xs font-extrabold text-amber-800 flex items-center gap-xs">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    Review History
                  </p>
                  <p className="text-[11px] text-amber-700 leading-normal">
                    Previously reviewed on{" "}
                    {new Date(selectedItem.reviewedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    {selectedItem.reviewedBy?.name ? ` by ${selectedItem.reviewedBy.name}` : ""}.
                  </p>
                  <p className="text-[11px] text-amber-700 font-bold bg-amber-100/60 p-2 rounded-lg mt-1 italic">
                    Reason: &ldquo;{selectedItem.rejectionReason}&rdquo;
                  </p>
                </div>
              ) : null}

              {/* Deactivation Banner */}
              {selectedItem.adminDeactivated && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-1">
                  <p className="text-xs font-extrabold text-rose-800 flex items-center gap-xs">
                    <span className="material-symbols-outlined text-sm">block</span>
                    Restaurant Deactivated
                  </p>
                  <p className="text-[11px] text-rose-700 leading-normal">
                    Deactivated on{" "}
                    {new Date(selectedItem.deactivatedAt || selectedItem.updatedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    {selectedItem.deactivatedBy?.name ? ` by ${selectedItem.deactivatedBy.name}` : ""}.
                  </p>
                  {selectedItem.deactivationReason && (
                    <p className="text-[11px] text-rose-700 font-bold bg-rose-100/60 p-2 rounded-lg mt-1 italic">
                      Reason: &ldquo;{selectedItem.deactivationReason}&rdquo;
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              {selectedItem.approvalStatus === "pending" && (
                <div className="flex gap-md pt-md border-t border-slate-50">
                  <button
                    onClick={() => setIsRejectModalOpen(true)}
                    className="flex-1 px-4 py-3 border border-rose-200 text-error hover:bg-rose-50 font-bold text-sm rounded-2xl transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setIsApproveConfirmOpen(true)}
                    className="flex-1 px-4 py-3 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-sm rounded-2xl transition-colors shadow-sm cursor-pointer"
                  >
                    Approve
                  </button>
                </div>
              )}

              {selectedItem.approvalStatus === "approved" && (
                <div className="pt-md border-t border-slate-50">
                  {selectedItem.adminDeactivated ? (
                    <button
                      onClick={() => setIsReactivateConfirmOpen(true)}
                      className="w-full px-4 py-3 border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold text-sm rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">settings_backup_restore</span>
                      Reactivate Restaurant
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setDeactivationReason("");
                        setSuspendOwner(false);
                        setIsDeactivateModalOpen(true);
                      }}
                      className="w-full px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-sm rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">block</span>
                      Deactivate Restaurant
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* DELIVERY PARTNER DETAIL PANEL */
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md space-y-xl animate-fade-in relative">
              <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                    Delivery Partner Application
                  </span>
                  <h2 className="font-headline-sm text-headline-sm font-extrabold text-slate-900 mt-1">
                    {selectedItem.user?.name || "Rider Applicant"}
                  </h2>
                </div>
                <button
                  onClick={() => router.push(`/admin/approvals?type=${activeType}&status=${activeStatus}`)}
                  className="lg:hidden p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined text-slate-500">close</span>
                </button>
              </div>

              <div className="space-y-md">
                {/* Personal & Vehicle Info */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Applicant Info</h4>
                  <div className="bg-slate-50/50 border border-slate-100/50 rounded-2xl p-3.5 space-y-2 mt-2">
                    <p className="text-sm text-slate-700 font-semibold flex items-center gap-xs">
                      <span className="material-symbols-outlined text-slate-400 text-base">person</span>
                      {selectedItem.user?.name}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-xs">
                      <span className="material-symbols-outlined text-slate-400 text-base">mail</span>
                      {selectedItem.user?.email}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-xs">
                      <span className="material-symbols-outlined text-slate-400 text-base">call</span>
                      {selectedItem.phone}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Vehicle & Location</h4>
                  <div className="bg-slate-50/50 border border-slate-100/50 rounded-2xl p-3.5 space-y-2 mt-2">
                    <p className="text-sm text-slate-700 font-semibold flex items-center gap-xs">
                      <span className="material-symbols-outlined text-primary text-base">two_wheeler</span>
                      Vehicle: <span className="uppercase text-primary font-bold">{selectedItem.vehicleType}</span>
                    </p>
                    {selectedItem.vehicleNumber && (
                      <p className="text-xs text-slate-600 flex items-center gap-xs font-mono font-bold">
                        <span className="material-symbols-outlined text-slate-400 text-base">pin</span>
                        Reg #: {selectedItem.vehicleNumber}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 flex items-center gap-xs">
                      <span className="material-symbols-outlined text-slate-400 text-base">pin_drop</span>
                      Service City: {selectedItem.city} ({selectedItem.pincode})
                    </p>
                  </div>
                </div>

                {/* Government Documents */}
                <div className="space-y-md border-t border-slate-50 pt-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Verification Documents</h4>
                  <div className="grid grid-cols-1 gap-md">
                    {selectedItem.documents?.aadhaarCard ? (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">badge</span>
                            <div>
                              <p className="text-xs font-bold text-slate-800">Aadhaar Card / Govt ID</p>
                              <p className="text-[10px] text-slate-400">Official Government Identification</p>
                            </div>
                          </div>
                          <a
                            href={selectedItem.documents.aadhaarCard}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            <span>View Original</span>
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                          </a>
                        </div>

                        <a
                          href={selectedItem.documents.aadhaarCard}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block relative rounded-xl overflow-hidden border border-slate-200 mt-2 hover:opacity-90 transition-opacity bg-white"
                        >
                          <img
                            src={selectedItem.documents.aadhaarCard}
                            alt="Aadhaar Card Document"
                            className="w-full h-36 object-contain p-2 bg-slate-100/50"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        </a>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-rose-50/50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-sm text-xs">
                        <span className="material-symbols-outlined text-lg">warning</span>
                        <span>Missing Aadhaar Card Document</span>
                      </div>
                    )}

                    {selectedItem.vehicleType !== "bicycle" && (
                      selectedItem.documents?.drivingLicense ? (
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-xl">id_card</span>
                              <div>
                                <p className="text-xs font-bold text-slate-800">Driving License</p>
                                <p className="text-[10px] text-slate-400">Official Motorized Vehicle Permit</p>
                              </div>
                            </div>
                            <a
                              href={selectedItem.documents.drivingLicense}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                            >
                              <span>View Original</span>
                              <span className="material-symbols-outlined text-sm">open_in_new</span>
                            </a>
                          </div>

                          <a
                            href={selectedItem.documents.drivingLicense}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block relative rounded-xl overflow-hidden border border-slate-200 mt-2 hover:opacity-90 transition-opacity bg-white"
                          >
                            <img
                              src={selectedItem.documents.drivingLicense}
                              alt="Driving License Document"
                              className="w-full h-36 object-contain p-2 bg-slate-100/50"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          </a>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-rose-50/50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-sm text-xs">
                          <span className="material-symbols-outlined text-lg">warning</span>
                          <span>Missing Driving License Document</span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Masked Bank Details */}
                <div className="space-y-xs border-t border-slate-50 pt-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Masked Bank Account</h4>
                  <div className="bg-slate-50/50 border border-slate-100/50 rounded-2xl p-3.5 space-y-1.5">
                    <p className="text-xs text-slate-700">
                      <span className="text-slate-400">Holder:</span>{" "}
                      <strong className="text-slate-900">{selectedItem.bankDetails?.accountHolderName || "—"}</strong>
                    </p>
                    <p className="text-xs text-slate-700 font-mono">
                      <span className="text-slate-400 font-sans">Account #:</span>{" "}
                      <strong className="text-slate-900">{selectedItem.bankDetails?.accountNumber || "—"}</strong>
                    </p>
                    <p className="text-xs text-slate-700">
                      <span className="text-slate-400">Bank:</span>{" "}
                      <span className="text-slate-800">{selectedItem.bankDetails?.bankName} ({selectedItem.bankDetails?.ifscCode})</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* History */}
              {selectedItem.approvalStatus === "rejected" || selectedItem.rejectionReason ? (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-1">
                  <p className="text-xs font-extrabold text-amber-800 flex items-center gap-xs">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    Review History
                  </p>
                  <p className="text-[11px] text-amber-700 leading-normal">
                    Previously reviewed on{" "}
                    {new Date(selectedItem.reviewedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    {selectedItem.reviewedBy?.name ? ` by ${selectedItem.reviewedBy.name}` : ""}.
                  </p>
                  <p className="text-[11px] text-amber-700 font-bold bg-amber-100/60 p-2 rounded-lg mt-1 italic">
                    Reason: &ldquo;{selectedItem.rejectionReason}&rdquo;
                  </p>
                </div>
              ) : null}

              {/* Actions */}
              {selectedItem.approvalStatus === "pending" && (
                <div className="flex gap-md pt-md border-t border-slate-50">
                  <button
                    onClick={() => setIsRejectModalOpen(true)}
                    className="flex-1 px-4 py-3 border border-rose-200 text-error hover:bg-rose-50 font-bold text-sm rounded-2xl transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setIsApproveConfirmOpen(true)}
                    className="flex-1 px-4 py-3 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-sm rounded-2xl transition-colors shadow-sm cursor-pointer"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Approve Dialog Modal */}
      {isApproveConfirmOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/45 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-md animate-scale-in">
            <h3 className="font-headline-sm text-headline-sm font-extrabold text-slate-800">
              Confirm {isRestaurants ? "Restaurant" : "Delivery Partner"} Approval
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Are you sure you want to approve{" "}
              <strong>&ldquo;{isRestaurants ? selectedItem.name : selectedItem.user?.name || "Applicant"}&rdquo;</strong>?
              This will grant full platform access and update their account role to{" "}
              <strong>&ldquo;{isRestaurants ? "owner" : "delivery"}&rdquo;</strong>.
            </p>
            <div className="flex gap-md pt-sm">
              <button
                onClick={() => setIsApproveConfirmOpen(false)}
                disabled={isApproving}
                className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-2xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-sm rounded-2xl transition-colors shadow-sm flex items-center justify-center gap-xs cursor-pointer"
              >
                {isApproving ? (
                  <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
                ) : (
                  "Yes, Approve"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal Dialog */}
      {isRejectModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/45 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-md animate-scale-in">
            <h3 className="font-headline-sm text-headline-sm font-extrabold text-slate-800">
              Reject Application
            </h3>
            <p className="text-sm text-slate-500">
              Provide a clear, descriptive reason for rejecting{" "}
              <strong>&ldquo;{isRestaurants ? selectedItem.name : selectedItem.user?.name || "Applicant"}&rdquo;</strong>.
            </p>

            <div className="space-y-sm">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
                Rejection Reason
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Verification documents are blurry or registration name does not match."
                className="w-full h-32 border border-slate-200 rounded-2xl p-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder-slate-400"
              />
            </div>

            <div className="flex gap-md pt-sm">
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectionReason("");
                }}
                disabled={isRejecting}
                className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-2xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isRejecting || !rejectionReason.trim()}
                className="flex-1 px-4 py-2.5 bg-rose-600 text-white hover:bg-rose-700 font-bold text-sm rounded-2xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-xs cursor-pointer"
              >
                {isRejecting ? (
                  <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
                ) : (
                  "Reject Application"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Modal Dialog */}
      {isDeactivateModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/45 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-md animate-scale-in">
            <h3 className="font-headline-sm text-headline-sm font-extrabold text-slate-800">
              Deactivate Restaurant
            </h3>
            <p className="text-sm text-slate-500">
              Deactivating <strong>&ldquo;{selectedItem.name}&rdquo;</strong> will make it immediately hidden from customers on Cravingza.
            </p>

            <div className="space-y-sm">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
                Deactivation Reason (Required)
              </label>
              <textarea
                value={deactivationReason}
                onChange={(e) => setDeactivationReason(e.target.value)}
                placeholder="e.g. Health safety compliance violation or temporary business closure."
                className="w-full h-28 border border-slate-200 rounded-2xl p-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none placeholder-slate-400"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer pt-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <input
                type="checkbox"
                checked={suspendOwner}
                onChange={(e) => setSuspendOwner(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
              />
              <span className="text-xs font-semibold text-slate-700">
                Also suspend the restaurant owner's account
              </span>
            </label>

            <div className="flex gap-md pt-sm">
              <button
                onClick={() => {
                  setIsDeactivateModalOpen(false);
                  setDeactivationReason("");
                  setSuspendOwner(false);
                }}
                disabled={isDeactivatingRestaurant}
                className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-2xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={isDeactivatingRestaurant || !deactivationReason.trim()}
                className="flex-1 px-4 py-2.5 bg-rose-600 text-white hover:bg-rose-700 font-bold text-sm rounded-2xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-xs cursor-pointer"
              >
                {isDeactivatingRestaurant ? (
                  <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
                ) : (
                  "Deactivate"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Confirmation Modal */}
      {isReactivateConfirmOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/45 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-md animate-scale-in">
            <h3 className="font-headline-sm text-headline-sm font-extrabold text-slate-800">
              Confirm Restaurant Reactivation
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Reactivate <strong>&ldquo;{selectedItem.name}&rdquo;</strong>? It will become visible to customers again on the platform.
            </p>
            <div className="flex gap-md pt-sm">
              <button
                onClick={() => setIsReactivateConfirmOpen(false)}
                disabled={isReactivatingRestaurant}
                className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-2xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReactivate}
                disabled={isReactivatingRestaurant}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-sm rounded-2xl transition-colors shadow-sm flex items-center justify-center gap-xs cursor-pointer"
              >
                {isReactivatingRestaurant ? (
                  <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
                ) : (
                  "Yes, Reactivate"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
