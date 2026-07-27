"use client";

import React, { useState, useMemo } from "react";
import {
  useGetMyMenuQuery,
  useAddMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  MenuItem,
  MenuItemInput,
} from "@/lib/redux/apiSlice";
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Image as ImageIcon,
  Loader2,
  Check,
  Sparkles,
  UtensilsCrossed,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function RestaurantMenuPage() {
  const { data: menuItems = [], isLoading, error } = useGetMyMenuQuery();
  const [addMenuItem, { isLoading: isAdding }] = useAddMenuItemMutation();
  const [updateMenuItem, { isLoading: isUpdating }] = useUpdateMenuItemMutation();
  const [deleteMenuItem, { isLoading: isDeleting }] = useDeleteMenuItemMutation();

  // Pagination & Display Settings
  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageChanging, setIsPageChanging] = useState(false);

  const handlePageChange = (newPage: number) => {
    setIsPageChanging(true);
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      setIsPageChanging(false);
    }, 250);
  };

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form States
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("Main Course");
  const [formImage, setFormImage] = useState("");
  const [formIsVeg, setFormIsVeg] = useState(true);
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formIsBestSeller, setFormIsBestSeller] = useState(false);

  // Image Upload State
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Delete Confirm State
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Categories list derived dynamically from menu items, with some defaults
  const categories = useMemo(() => {
    const list = new Set(["All", "Starters", "Main Course", "Desserts", "Beverages"]);
    menuItems.forEach((item) => {
      if (item.category) {
        list.add(item.category);
      }
    });
    return Array.from(list);
  }, [menuItems]);

  // Filtered Menu Items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  // Reset pagination to page 1 whenever filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Total pages
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;

  // Items for current page (Max 6 per page)
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormCategory("Main Course");
    setFormImage("");
    setFormIsVeg(true);
    setFormIsAvailable(true);
    setFormIsBestSeller(false);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormDescription(item.description || "");
    setFormPrice(item.price.toString());
    setFormCategory(item.category);
    setFormImage(item.image || "");
    setFormIsVeg(item.isVeg);
    setFormIsAvailable(item.isAvailable);
    setFormIsBestSeller(item.isBestSeller || false);
    setIsModalOpen(true);
  };

  // Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      return toast.error("Please upload an image file (JPEG/PNG).");
    }

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "restaurant-menu");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const resData = await response.json();
      if (resData.success) {
        setFormImage(resData.url);
        toast.success("Dish image uploaded successfully!");
      } else {
        throw new Error(resData.message || "Failed to upload image.");
      }
    } catch (err) {
      const error = err as { message?: string };
      toast.error(error.message || "Image upload failed.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Quick toggle availability
  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const updatedData: MenuItemInput = {
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image,
        isVeg: item.isVeg,
        isBestSeller: item.isBestSeller,
        isAvailable: !item.isAvailable, // Toggle
      };
      await updateMenuItem({ id: item._id, data: updatedData }).unwrap();
      toast.success(
        `"${item.name}" is now ${!item.isAvailable ? "Available" : "Out of Stock"}`
      );
    } catch (err) {
      console.error("Failed to toggle availability:", err);
      toast.error("Failed to update status.");
    }
  };

  // Submit Modal Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) return toast.error("Dish name is required.");
    if (!formPrice || parseFloat(formPrice) < 0) return toast.error("Please enter a valid price.");
    if (!formCategory.trim()) return toast.error("Category is required.");

    const itemData: MenuItemInput = {
      name: formName.trim(),
      description: formDescription.trim(),
      price: parseFloat(formPrice),
      category: formCategory.trim(),
      image: formImage,
      isVeg: formIsVeg,
      isAvailable: formIsAvailable,
      isBestSeller: formIsBestSeller,
    };

    try {
      if (editingItem) {
        await updateMenuItem({ id: editingItem._id, data: itemData }).unwrap();
        toast.success("Menu item updated successfully!");
      } else {
        await addMenuItem(itemData).unwrap();
        toast.success("New dish added successfully!");
      }
      setIsModalOpen(false);
    } catch (err) {
      const error = err as { data?: { message?: string }; message?: string };
      toast.error(error.data?.message || error.message || "Failed to save menu item.");
    }
  };

  // Confirm delete handler
  const handleDeleteConfirm = async () => {
    if (!deletingItemId) return;
    try {
      await deleteMenuItem(deletingItemId).unwrap();
      toast.success("Menu item deleted successfully.");
      setDeletingItemId(null);
    } catch (err) {
      console.error("Failed to delete menu item:", err);
      toast.error("Failed to delete menu item.");
    }
  };

  return (
    <div className="space-y-lg max-w-6xl mx-auto p-4 md:p-6">
      {/* Top Banner/Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md bg-gradient-to-r from-primary/10 to-orange-500/10 p-lg rounded-3xl border border-outline-variant/30">
        <div className="space-y-xs">
          <div className="flex items-center gap-2 text-primary font-bold">
            <UtensilsCrossed className="w-5 h-5 animate-pulse" />
            <span>Active Restaurant Menu</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-background font-extrabold">
            Menu Management
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Create, edit, and publish food items. Total Dishes: <span className="font-bold text-primary">{menuItems.length}</span>
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-orange-500 text-white font-bold px-6 py-3 rounded-2xl active:scale-95 shadow-md shadow-primary/20 hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-3xl border border-outline-variant/20 shadow-sm space-y-4">
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60" />
          <input
            type="text"
            placeholder="Search by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-outline-variant bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md text-on-background transition-all"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-1 scrollbar-none whitespace-nowrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-body-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                selectedCategory === cat
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading & Error States */}
      {(isLoading || isPageChanging) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white border border-outline-variant/30 rounded-2xl overflow-hidden p-md space-y-md animate-pulse shadow-sm">
              <div className="w-full h-44 bg-slate-200/80 rounded-xl"></div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-slate-200/80 rounded w-2/3"></div>
                  <div className="h-5 bg-slate-200/80 rounded-lg w-1/4"></div>
                </div>
                <div className="h-4 bg-slate-200/80 rounded w-full"></div>
                <div className="h-4 bg-slate-200/80 rounded w-4/5"></div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="h-6 bg-slate-200/80 rounded w-16"></div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-slate-200/80 rounded-xl"></div>
                  <div className="w-8 h-8 bg-slate-200/80 rounded-xl"></div>
                  <div className="w-8 h-8 bg-slate-200/80 rounded-xl"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-md rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-body-md">Failed to load menu</h4>
            <p className="text-body-sm mt-1">Please try refreshing the page or login again.</p>
          </div>
        </div>
      )}

      {/* Grid of Menu Items */}
      {!isLoading && !isPageChanging && !error && filteredItems.length === 0 && (
        <div className="text-center py-20 bg-white border border-outline-variant/30 rounded-3xl p-lg space-y-md shadow-sm">
          <div className="w-16 h-16 bg-surface-container text-on-surface-variant/40 rounded-full flex items-center justify-center mx-auto">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-headline-sm text-on-background">No dishes found</h3>
          <p className="text-body-md text-on-surface-variant max-w-sm mx-auto">
            {searchQuery || selectedCategory !== "All"
              ? "Try adjusting your search query or filters to find what you are looking for."
              : "Start building your digital menu card. Add your signature dishes to get orders!"}
          </p>
          {!searchQuery && selectedCategory === "All" && (
            <button
              onClick={handleOpenAddModal}
              className="bg-primary text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer hover:bg-primary/95 transition-all shadow-sm"
            >
              Add First Dish
            </button>
          )}
        </div>
      )}

      {!isLoading && !isPageChanging && !error && filteredItems.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            {paginatedItems.map((item) => (
              <div
                key={item._id}
                className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col ${
                  item.isAvailable ? "border-outline-variant/30" : "border-outline-variant/60 bg-gray-50/50"
                }`}
              >
                {/* Dish Image */}
                <div className="relative w-full h-44 bg-surface-container">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className={`object-cover transition-all duration-300 ${!item.isAvailable ? "grayscale contrast-75 brightness-75" : ""}`}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant/30">
                      <ImageIcon className="w-10 h-10 stroke-[1.5]" />
                      <span className="text-caption mt-1 font-semibold">No Image Uploaded</span>
                    </div>
                  )}

                  {/* Badges overlay */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {/* Veg / Non-Veg Badge */}
                    <span
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-caption font-extrabold shadow-sm border ${
                        item.isVeg
                          ? "bg-green-50 text-green-700 border-green-200/50"
                          : "bg-red-50 text-red-700 border-red-200/50"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                      {item.isVeg ? "VEG" : "NON-VEG"}
                    </span>

                    {/* Best Seller Badge */}
                    {item.isBestSeller && (
                      <span className="flex items-center gap-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-1 rounded-full text-caption font-black shadow-sm">
                        <Sparkles className="w-3 h-3 fill-white" />
                        <span>BESTSELLER</span>
                      </span>
                    )}
                  </div>

                  {/* Availability Status Badge */}
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="bg-red-600 text-white font-black text-body-sm px-4 py-1.5 rounded-full shadow-md tracking-wider">
                        OUT OF STOCK
                      </span>
                    </div>
                  )}
                </div>

                {/* Dish Info */}
                <div className="p-md flex-1 flex flex-col justify-between space-y-md">
                  <div className="space-y-xs">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-body-lg text-on-background line-clamp-1">
                        {item.name}
                      </h3>
                      <span className="text-caption text-primary bg-primary/5 px-2.5 py-1 rounded-lg font-bold border border-primary/10">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant line-clamp-2 h-10 leading-snug">
                      {item.description || "No description provided."}
                    </p>
                  </div>

                  {/* Bottom Row: Price & Actions */}
                  <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between">
                    <div className="text-headline-xs font-black text-on-background">
                      ₹{item.price.toFixed(0)}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Toggle Availability Switch */}
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        title={item.isAvailable ? "Mark Out of Stock" : "Mark Available"}
                        className={`p-2 rounded-xl transition-all cursor-pointer border ${
                          item.isAvailable
                            ? "bg-green-50 text-green-600 border-green-200/50 hover:bg-green-100"
                            : "bg-red-50 text-red-500 border-red-200/50 hover:bg-red-100"
                        }`}
                      >
                        <Check className={`w-4 h-4 ${item.isAvailable ? "opacity-100" : "opacity-30"}`} />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer border border-slate-200/30 transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeletingItemId(item._id)}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl cursor-pointer border border-red-200/30 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-outline-variant/20 shadow-sm mt-6">
            <p className="text-body-sm text-on-surface-variant font-medium">
              Showing <span className="font-bold text-on-background">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredItems.length)}</span> to{" "}
              <span className="font-bold text-on-background">{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}</span> of{" "}
              <span className="font-bold text-primary">{filteredItems.length}</span> dishes
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-background font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-9 h-9 rounded-xl font-bold text-body-sm transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-background font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD/EDIT MODAL ────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative bg-white w-full max-w-lg rounded-3xl border border-outline-variant/30 shadow-2xl p-lg overflow-y-auto max-h-[90vh] z-10 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-md border-b border-outline-variant/30">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-background flex items-center gap-2">
                {editingItem ? <Edit3 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                <span>{editingItem ? "Edit Dish Details" : "Add New Dish"}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-surface-container rounded-full text-on-surface-variant transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-md pt-md">
              {/* Dish Name */}
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface-variant font-bold">
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Butter Paneer Masala"
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md transition-all"
                />
              </div>

              {/* Row: Category and Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {/* Category Selection */}
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant font-bold">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md transition-all"
                  >
                    <option value="Starters">Starters</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Breads">Breads & Rotis</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Rice & Biryani">Rice & Biryani</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>

                {/* Price */}
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant font-bold">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="e.g. 240"
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md transition-all"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface-variant font-bold">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the dish ingredients, taste profile, or portion size..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md transition-all resize-none"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface-variant font-bold">
                  Dish Image
                </label>
                <div className="flex items-center gap-md">
                  {/* Preview Container */}
                  <div className="relative w-20 h-20 bg-surface-container rounded-xl overflow-hidden border border-outline-variant/40 shrink-0">
                    {formImage ? (
                      <Image
                        src={formImage}
                        alt="Dish Preview"
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Upload Actions */}
                  <div className="space-y-xs">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-body-sm font-bold cursor-pointer transition-all">
                      <ImageIcon className="w-4 h-4 text-slate-500" />
                      <span>{formImage ? "Change Image" : "Upload Image"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploadingImage}
                      />
                    </label>
                    <p className="text-caption text-on-surface-variant/75">
                      Accepts JPEG, PNG (max 5MB).
                    </p>
                  </div>
                </div>
              </div>

              {/* Toggles Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-md pt-2">
                {/* Veg / Non Veg */}
                <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/30">
                  <span className="font-label-md text-label-md font-bold text-on-surface-variant">Veg</span>
                  <input
                    type="checkbox"
                    checked={formIsVeg}
                    onChange={(e) => setFormIsVeg(e.target.checked)}
                    className="w-4 h-4 text-primary focus:ring-primary border-outline-variant rounded"
                  />
                </div>

                {/* Best Seller */}
                <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/30">
                  <span className="font-label-md text-label-md font-bold text-on-surface-variant">Bestseller</span>
                  <input
                    type="checkbox"
                    checked={formIsBestSeller}
                    onChange={(e) => setFormIsBestSeller(e.target.checked)}
                    className="w-4 h-4 text-primary focus:ring-primary border-outline-variant rounded"
                  />
                </div>

                {/* Available */}
                <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/30">
                  <span className="font-label-md text-label-md font-bold text-on-surface-variant">Available</span>
                  <input
                    type="checkbox"
                    checked={formIsAvailable}
                    onChange={(e) => setFormIsAvailable(e.target.checked)}
                    className="w-4 h-4 text-primary focus:ring-primary border-outline-variant rounded"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-md border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-outline-variant text-on-surface-variant font-bold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding || isUpdating || isUploadingImage}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-orange-500 text-white font-bold px-6 py-2.5 rounded-xl active:scale-95 shadow-md shadow-primary/20 hover:shadow-lg transition-all duration-200 disabled:opacity-50 cursor-pointer"
                >
                  {(isAdding || isUpdating) && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingItem ? "Update Dish" : "Create Dish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ────────────────────────────── */}
      {deletingItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
            onClick={() => setDeletingItemId(null)}
          />
          <div className="relative bg-white w-full max-w-sm rounded-3xl border border-outline-variant/30 shadow-2xl p-lg space-y-md z-10 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-xs">
              <h3 className="font-bold text-headline-sm text-on-background">Delete menu item?</h3>
              <p className="text-body-md text-on-surface-variant">
                Are you sure you want to delete this item? This action is permanent and cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingItemId(null)}
                className="px-4 py-2 border border-outline-variant text-on-surface-variant font-bold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
