"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useGetAdminUsersQuery,
  useGetAdminUserByIdQuery,
  useUpdateAdminUserStatusMutation,
} from "@/lib/redux/apiSlice";
import { toast } from "sonner";

function UserManagementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL State parameters
  const roleParam = searchParams.get("role") || "customer";
  const statusParam = searchParams.get("status") || "all";
  const searchParam = searchParams.get("search") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const selectedIdParam = searchParams.get("id") || "";

  // Local Search state (with debounce)
  const [searchInput, setSearchInput] = useState(searchParam);
  const [debouncedSearch, setDebouncedSearch] = useState(searchParam);

  // Synchronize search input with URL when browser navigates back/forward
  useEffect(() => {
    setSearchInput(searchParam);
    setDebouncedSearch(searchParam);
  }, [searchParam]);

  // Debouncing search input ~350ms
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== searchParam) {
        const params = new URLSearchParams(searchParams.toString());
        if (searchInput) {
          params.set("search", searchInput);
        } else {
          params.delete("search");
        }
        params.set("page", "1"); // Reset pagination on search
        router.push(`/admin/users?${params.toString()}`);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchInput, searchParams, router, searchParam]);

  // RTK Query fetches
  const {
    data: usersData,
    isLoading: usersLoading,
    isFetching: usersFetching,
    refetch: refetchUsers,
  } = useGetAdminUsersQuery({
    role: roleParam,
    search: debouncedSearch,
    status: statusParam,
    page: pageParam,
    limit: 20,
  });

  const {
    data: detailData,
    isLoading: detailLoading,
    isFetching: detailFetching,
    refetch: refetchDetail,
  } = useGetAdminUserByIdQuery(selectedIdParam, {
    skip: !selectedIdParam,
  });

  // Mutations
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateAdminUserStatusMutation();

  // Extraction of values
  const users = usersData?.data?.users || [];
  const totalCount = usersData?.data?.totalCount || 0;
  const counts = usersData?.data?.counts || { customer: 0, owner: 0, delivery: 0 };
  const totalPages = Math.ceil(totalCount / 20) || 1;

  const selectedUser = detailData?.data?.user || null;
  const selectedUserStats = detailData?.data?.stats || null;

  // Confirmation Modals State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "suspend" | "reinstate";
    userId: string;
    userName: string;
  }>({
    isOpen: false,
    type: "suspend",
    userId: "",
    userName: "",
  });

  // Tab & Filters Change Helpers
  const handleTabChange = (role: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("role", role);
    params.set("page", "1"); // Reset pagination
    params.delete("id"); // Close details on tab change
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", status);
    params.set("page", "1");
    router.push(`/admin/users?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleSelectUser = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleClosePanel = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    router.push(`/admin/users?${params.toString()}`);
  };

  // Action Mutators
  const triggerUpdateStatus = async () => {
    if (!confirmModal.userId) return;
    const nextStatus = confirmModal.type === "suspend" ? "suspended" : "active";
    try {
      const res = await updateStatus({ id: confirmModal.userId, status: nextStatus }).unwrap();
      if (res.success) {
        toast.success(`User has been successfully ${confirmModal.type === "suspend" ? "suspended" : "reinstated"}.`);
        setConfirmModal({ isOpen: false, type: "suspend", userId: "", userName: "" });
        refetchUsers();
        refetchDetail();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.data?.message || "Failed to update user status.");
    }
  };


  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-lg animate-fade-in pb-12 px-4 sm:px-0">
      {/* Top Header */}
      <div>
        <h1 className="font-headline-md text-headline-md font-extrabold text-slate-900 tracking-tight">
          User Management Dashboard
        </h1>
        <p className="font-body-md text-body-md text-slate-500 mt-1">
          Monitor customers, restaurant owners, and delivery partners. Manage accounts, suspend access, and handle account soft deletions.
        </p>
      </div>

      {/* Role Tabs */}
      <div className="flex gap-sm border-b border-slate-200 pb-px overflow-x-auto no-scrollbar">
        {[
          { key: "customer", label: "Customers", count: counts.customer, icon: "person" },
          { key: "owner", label: "Owners", count: counts.owner, icon: "storefront" },
          { key: "delivery", label: "Delivery Partners", count: counts.delivery, icon: "sports_motorsports" },
        ].map((tab) => {
          const isActive = roleParam === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 font-label-md text-label-md transition-all border-b-2 font-bold cursor-pointer whitespace-nowrap -mb-0.5 ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"
              }`}
            >
              <span className="material-symbols-outlined text-lg leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold transition-colors ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-slate-500 bg-slate-100"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Controls: Search & Dropdown Filter */}
      <div className="flex flex-col sm:flex-row gap-md items-center justify-between bg-white border border-slate-100 rounded-3xl p-md shadow-sm">
        <div className="relative w-full sm:max-w-md flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-md py-2.5 gap-sm transition-all focus-within:bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
          <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full bg-transparent border-none text-body-md font-body-md text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-sm w-full sm:w-auto shrink-0 justify-end">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
          <select
            value={statusParam}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-2xl px-md py-2.5 text-body-md font-body-md text-slate-700 focus:outline-none focus:border-primary focus:bg-white cursor-pointer min-w-[140px]"
          >
            <option value="all">All Accounts</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Main Grid Layout for List vs Side Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-start">
        {/* Left Side: Users List */}
        <div className={`${selectedIdParam ? "lg:col-span-2" : "lg:col-span-3"} space-y-md`}>
          {usersLoading || usersFetching ? (
            <div className="space-y-md">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white border border-slate-100 rounded-3xl p-md animate-pulse flex items-center gap-md">
                  <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
                    <div className="h-3 w-1/3 bg-slate-200 rounded"></div>
                  </div>
                  <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
              <span className="material-symbols-outlined text-5xl text-slate-300">group_off</span>
              <h3 className="font-bold text-slate-700 text-lg mt-3">No users found</h3>
              <p className="text-sm text-slate-400 mt-1">
                We couldn't find any match for search "{debouncedSearch}" and status "{statusParam}".
              </p>
            </div>
          ) : (
            <div className="space-y-md">
              {/* RESPONSIVE: Desktop Table (lg screen) */}
              <div className="hidden lg:block overflow-hidden bg-white border border-slate-200/50 rounded-3xl shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-md text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                      <th className="p-md text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Info</th>
                      <th className="p-md text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="p-md text-xs font-bold text-slate-400 uppercase tracking-wider">Joined Date</th>
                      <th className="p-md text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((item: any) => {
                      const isSelected = selectedIdParam === item._id;
                      return (
                        <tr
                          key={item._id}
                          onClick={() => handleSelectUser(item._id)}
                          className={`border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-all ${
                            isSelected ? "bg-primary/5 hover:bg-primary/5" : ""
                          }`}
                        >
                          <td className="p-md">
                            <div className="flex items-center gap-sm">
                              {item.avatar ? (
                                <img
                                  src={item.avatar}
                                  alt={item.name}
                                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-sm">
                                  {getInitials(item.name)}
                                </div>
                              )}
                              <div>
                                <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                                <span className="text-[10px] text-slate-400 capitalize">{item.role}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-md text-slate-600 text-sm">
                            <div>{item.email}</div>
                            <div className="text-xs text-slate-400">{item.phone || "No phone number"}</div>
                          </td>
                          <td className="p-md">
                            <span
                              className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                                item.status === "active"
                                  ? "text-emerald-700 bg-emerald-50"
                                  : "text-amber-700 bg-amber-50"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="p-md text-slate-500 text-xs">
                            {new Date(item.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="p-md text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectUser(item._id);
                              }}
                              className="px-4 py-2 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-all cursor-pointer"
                            >
                              View details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* RESPONSIVE: Tablet Grid (md to lg screen) */}
              <div className="hidden md:grid lg:hidden grid-cols-2 gap-md">
                {users.map((item: any) => {
                  const isSelected = selectedIdParam === item._id;
                  return (
                    <div
                      key={item._id}
                      onClick={() => handleSelectUser(item._id)}
                      className={`bg-white border rounded-3xl p-md shadow-sm hover:shadow-md transition-all cursor-pointer space-y-md ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/10 bg-primary/5"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-sm">
                        {item.avatar ? (
                          <img
                            src={item.avatar}
                            alt={item.name}
                            className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-sm">
                            {getInitials(item.name)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-800 text-sm truncate">{item.name}</h4>
                          <span className="text-[10px] text-slate-400 capitalize">{item.role}</span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            item.status === "active"
                              ? "text-emerald-700 bg-emerald-50"
                              : "text-amber-700 bg-amber-50"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 space-y-1 border-t border-slate-50 pt-2">
                        <div className="flex items-center gap-xs">
                          <span className="material-symbols-outlined text-sm text-slate-400">mail</span>
                          <span className="truncate">{item.email}</span>
                        </div>
                        <div className="flex items-center gap-xs">
                          <span className="material-symbols-outlined text-sm text-slate-400">phone</span>
                          <span>{item.phone || "No phone"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* RESPONSIVE: Mobile List (below md screen) */}
              <div className="md:hidden space-y-md">
                {users.map((item: any) => {
                  const isSelected = selectedIdParam === item._id;
                  return (
                    <div
                      key={item._id}
                      onClick={() => handleSelectUser(item._id)}
                      className={`bg-white border rounded-3xl p-md shadow-sm transition-all cursor-pointer flex justify-between items-center gap-sm ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-sm min-w-0">
                        {item.avatar ? (
                          <img
                            src={item.avatar}
                            alt={item.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                            {getInitials(item.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm truncate">{item.name}</h4>
                          <div className="text-xs text-slate-400 truncate">{item.email}</div>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                          item.status === "active"
                            ? "text-emerald-700 bg-emerald-50"
                            : "text-amber-700 bg-amber-50"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center bg-white border border-slate-100 rounded-3xl p-md shadow-sm mt-md">
                  <button
                    disabled={pageParam <= 1}
                    onClick={() => handlePageChange(pageParam - 1)}
                    className="flex items-center gap-xs px-4 py-2 font-label-md text-label-md text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    <span className="material-symbols-outlined text-lg leading-none">arrow_back</span>
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-xs">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-9 h-9 rounded-xl font-label-md text-label-md transition-all cursor-pointer flex items-center justify-center ${
                          pageParam === p
                            ? "bg-primary text-white font-extrabold shadow-sm"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={pageParam >= totalPages}
                    onClick={() => handlePageChange(pageParam + 1)}
                    className="flex items-center gap-xs px-4 py-2 font-label-md text-label-md text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    <span>Next</span>
                    <span className="material-symbols-outlined text-lg leading-none">arrow_forward</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side Panel / Side Sheet (Dynamic details view) */}
        {selectedIdParam && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 lg:relative lg:inset-auto lg:bg-transparent lg:backdrop-blur-none lg:z-0 lg:block">
            <div
              className={`fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white border-l border-slate-100 shadow-2xl p-6 flex flex-col justify-between z-50 animate-fade-in
                lg:sticky lg:top-6 lg:bottom-auto lg:w-auto lg:max-w-none lg:border lg:rounded-3xl lg:shadow-md lg:h-auto lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto no-scrollbar`}
            >
              {/* Detail Loader */}
              {detailLoading ? (
                <div className="space-y-xl p-4 animate-pulse flex-1">
                  <div className="flex items-center gap-md">
                    <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-5 w-1/2 bg-slate-200 rounded"></div>
                      <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-md">
                    <div className="h-4 w-full bg-slate-200 rounded"></div>
                    <div className="h-4 w-5/6 bg-slate-200 rounded"></div>
                    <div className="h-24 bg-slate-200 rounded-2xl"></div>
                  </div>
                </div>
              ) : !selectedUser ? (
                <div className="text-center p-md flex-1 flex flex-col justify-center items-center">
                  <span className="material-symbols-outlined text-4xl text-error mb-sm">error</span>
                  <p className="font-bold text-slate-800 text-sm">Details could not be fetched.</p>
                  <button
                    onClick={handleClosePanel}
                    className="mt-md text-primary font-bold text-xs hover:underline cursor-pointer"
                  >
                    Close panel
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between h-full">
                  <div className="space-y-lg">
                    {/* Header: Title and Close */}
                    <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                      <div>
                        <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                          Account Profile
                        </span>
                        <h2 className="font-headline-sm text-headline-sm font-extrabold text-slate-900 mt-1">
                          {selectedUser.name}
                        </h2>
                      </div>
                      <button
                        onClick={handleClosePanel}
                        className="w-8 h-8 rounded-full border border-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-all hover:bg-slate-50"
                      >
                        <span className="material-symbols-outlined text-lg leading-none">close</span>
                      </button>
                    </div>

                    {/* Basic Info */}
                    <div className="flex items-center gap-md bg-slate-50/50 border border-slate-100 rounded-3xl p-md">
                      {selectedUser.avatar ? (
                        <img
                          src={selectedUser.avatar}
                          alt={selectedUser.name}
                          className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary font-extrabold flex items-center justify-center text-lg shrink-0">
                          {getInitials(selectedUser.name)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-xs">
                          <span
                            className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              selectedUser.status === "active"
                                ? "text-emerald-700 bg-emerald-50 border border-emerald-100"
                                : "text-amber-700 bg-amber-50 border border-amber-100"
                            }`}
                          >
                            {selectedUser.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                            {selectedUser.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 font-medium">
                          Member since:{" "}
                          {new Date(selectedUser.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Detail Grid */}
                    <div className="space-y-sm text-sm">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact details</h4>
                      <div className="bg-white border border-slate-100 rounded-2xl p-md space-y-sm">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-400 font-medium">Email Address</span>
                          <span className="text-slate-800 font-semibold truncate max-w-[200px]">{selectedUser.email}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-slate-50">
                          <span className="text-slate-400 font-medium">Phone Number</span>
                          <span className="text-slate-800 font-semibold">{selectedUser.phone || "Not provided"}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-slate-50">
                          <span className="text-slate-400 font-medium">OTP Verified</span>
                          <span className="flex items-center gap-xs text-slate-800 font-semibold">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                selectedUser.isVerified ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                            ></span>
                            {selectedUser.isVerified ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Role Specific Stats */}
                    {selectedUserStats && (
                      <div className="space-y-sm">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {selectedUser.role === "customer"
                            ? "Customer Spend & Stats"
                            : selectedUser.role === "owner"
                            ? "Restaurant & Revenue Stats"
                            : "Delivery Partner Summary"}
                        </h4>

                        {selectedUser.role === "customer" && (
                          <div className="space-y-md">
                            <div className="grid grid-cols-2 gap-sm">
                              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-md text-center">
                                <span className="text-xs font-bold text-slate-400 block uppercase">Total orders</span>
                                <span className="text-2xl font-extrabold text-slate-900 block mt-1">
                                  {selectedUserStats.totalOrdersCount}
                                </span>
                              </div>
                              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-md text-center">
                                <span className="text-xs font-bold text-slate-400 block uppercase">Total spent</span>
                                <span className="text-2xl font-extrabold text-slate-900 block mt-1">
                                  ₹{selectedUserStats.totalSpent.toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>

                            {/* Last 5 Orders List */}
                            <div className="space-y-xs">
                              <span className="text-xs font-bold text-slate-500">Recent Orders</span>
                              {selectedUserStats.lastOrders?.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No orders placed yet.</p>
                              ) : (
                                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                                  {selectedUserStats.lastOrders?.map((o: any) => (
                                    <div
                                      key={o.id}
                                      className="flex justify-between items-center p-sm border-b border-slate-50 last:border-b-0 text-xs"
                                    >
                                      <div className="min-w-0 pr-2">
                                        <div className="font-bold text-slate-700 truncate">{o.restaurantName}</div>
                                        <div className="text-[10px] text-slate-400">
                                          {new Date(o.date).toLocaleDateString("en-IN", {
                                            day: "2-digit",
                                            month: "short",
                                          })}
                                        </div>
                                      </div>
                                      <div className="font-extrabold text-slate-800 shrink-0">
                                        ₹{o.amount.toLocaleString("en-IN")}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {selectedUser.role === "owner" && (
                          <div className="space-y-md">
                            {selectedUserStats.restaurant ? (
                              <div className="bg-white border border-slate-100 rounded-2xl p-md space-y-xs">
                                <div className="text-[10px] text-slate-400 font-extrabold uppercase">Restaurant</div>
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-slate-800">{selectedUserStats.restaurant.name}</span>
                                  <span
                                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                      selectedUserStats.restaurant.approvalStatus === "approved"
                                        ? "text-emerald-700 bg-emerald-50 border border-emerald-100"
                                        : selectedUserStats.restaurant.approvalStatus === "pending"
                                        ? "text-amber-700 bg-amber-50 border border-amber-100"
                                        : "text-rose-700 bg-rose-50 border border-rose-100"
                                    }`}
                                  >
                                    {selectedUserStats.restaurant.approvalStatus}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic bg-white border border-slate-100 rounded-2xl p-md text-center">
                                No registered restaurant found.
                              </p>
                            )}

                            <div className="grid grid-cols-2 gap-sm">
                              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-md text-center">
                                <span className="text-xs font-bold text-slate-400 block uppercase">Orders received</span>
                                <span className="text-2xl font-extrabold text-slate-900 block mt-1">
                                  {selectedUserStats.totalOrdersReceived}
                                </span>
                              </div>
                              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-md text-center">
                                <span className="text-xs font-bold text-slate-400 block uppercase">Total revenue</span>
                                <span className="text-2xl font-extrabold text-slate-900 block mt-1 text-emerald-600">
                                  ₹{selectedUserStats.totalRevenueGenerated.toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedUser.role === "delivery" && (
                          <div className="grid grid-cols-2 gap-sm">
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-md text-center">
                              <span className="text-xs font-bold text-slate-400 block uppercase">Deliveries</span>
                              <span className="text-2xl font-extrabold text-slate-900 block mt-1">
                                {selectedUserStats.totalDeliveriesCompleted}
                              </span>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-md text-center">
                              <span className="text-xs font-bold text-slate-400 block uppercase">Rating</span>
                              <span className="text-2xl font-extrabold text-slate-900 block mt-1 flex items-center justify-center gap-xs">
                                <span className="material-symbols-outlined text-amber-500 fill-amber-500 text-lg leading-none">star</span>
                                {selectedUserStats.averageRating || "0.0"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="border-t border-slate-100 pt-md mt-lg flex flex-col gap-sm shrink-0">
                    <div className="flex gap-sm">
                      <button
                        onClick={() =>
                          setConfirmModal({
                            isOpen: true,
                            type: selectedUser.status === "active" ? "suspend" : "reinstate",
                            userId: selectedUser._id,
                            userName: selectedUser.name,
                          })
                        }
                        className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all cursor-pointer border text-center ${
                          selectedUser.status === "active"
                            ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/50"
                            : "bg-primary text-white border-transparent hover:bg-primary-container shadow-sm"
                        }`}
                      >
                        {selectedUser.status === "active" ? "Suspend Account" : "Reinstate Account"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-md z-50 animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-md">
            <div className="flex items-center gap-md">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  confirmModal.type === "suspend"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                <span className="material-symbols-outlined text-2xl">
                  {confirmModal.type === "suspend"
                    ? "block"
                    : "check_circle"}
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm font-extrabold text-slate-900">
                {confirmModal.type === "suspend"
                  ? "Suspend Account"
                  : "Reinstate Account"}
              </h3>
            </div>

            <p className="text-body-md text-slate-600">
              {confirmModal.type === "suspend" ? (
                <>
                  Are you sure you want to suspend{" "}
                  <strong className="text-slate-900">{confirmModal.userName}</strong>? Suspending this user will
                  immediately prevent them from logging in.
                </>
              ) : (
                <>
                  Are you sure you want to reinstate{" "}
                  <strong className="text-slate-900">{confirmModal.userName}</strong>? Reinstating will grant them
                  access back to the platform.
                </>
              )}
            </p>

            <div className="flex gap-sm justify-end pt-2">
              <button
                onClick={() => setConfirmModal({ isOpen: false, type: "suspend", userId: "", userName: "" })}
                className="px-5 py-2.5 font-label-md text-label-md border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={triggerUpdateStatus}
                disabled={isUpdatingStatus}
                className={`px-5 py-2.5 font-label-md text-label-md text-white rounded-2xl transition-all cursor-pointer shadow-sm disabled:opacity-50 ${
                  confirmModal.type === "suspend"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-primary hover:bg-primary-container"
                }`}
              >
                {confirmModal.type === "suspend" ? "Suspend" : "Reinstate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserManagementPage() {
  return (
    <Suspense fallback={
      <div className="space-y-lg animate-pulse pb-12">
        <div className="h-8 w-48 bg-slate-200 rounded"></div>
        <div className="h-4 w-72 bg-slate-200 rounded"></div>
        <div className="h-12 bg-slate-200 rounded-3xl"></div>
        <div className="h-64 bg-slate-200 rounded-3xl"></div>
      </div>
    }>
      <UserManagementContent />
    </Suspense>
  );
}
