"use client";

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { setConflictModal } from "@/lib/redux/cartSlice";
import { useReplaceCartMutation } from "@/lib/redux/apiSlice";
import { toast } from "sonner";

const DEFAULT_CONFLICT_MODAL = {
  open: false,
  pendingItem: null,
  currentRestaurantName: "",
};

export default function ConflictModal() {
  const dispatch = useDispatch();
  const conflictModal = useSelector((state: RootState) => state.cart?.conflictModal || DEFAULT_CONFLICT_MODAL);
  const [replaceCart, { isLoading }] = useReplaceCartMutation();

  if (!conflictModal?.open || !conflictModal?.pendingItem) return null;

  const handleClose = () => {
    dispatch(
      setConflictModal({
        open: false,
        pendingItem: null,
        currentRestaurantName: "",
      })
    );
  };

  const handleConfirm = async () => {
    try {
      const result = await replaceCart({
        menuItemId: conflictModal.pendingItem!.menuItemId,
        quantity: conflictModal.pendingItem!.quantity,
      }).unwrap();

      if (result.success) {
        toast.success("Cart cleared and new items added!");
      }
      handleClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.data?.message || "Failed to replace cart. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-surface max-w-md w-full rounded-2xl border border-outline-variant p-lg shadow-xl space-y-lg animate-scale-up">
        {/* Header */}
        <div className="flex items-start gap-md">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
          <div className="space-y-xs">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Replace Cart?
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Your cart contains items from{" "}
              <span className="font-bold text-on-surface">
                {conflictModal.currentRestaurantName || "another restaurant"}
              </span>
              . Would you like to clear your cart and start a new order?
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-md justify-end pt-2">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-lg py-2 border border-outline-variant rounded-xl font-label-md text-label-md hover:bg-surface-container active:scale-95 transition-all text-on-surface cursor-pointer select-none"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-lg py-2 bg-primary text-white rounded-xl font-label-md text-label-md hover:bg-primary/95 active:scale-95 transition-all flex items-center justify-center gap-xs cursor-pointer select-none shadow-sm"
          >
            {isLoading ? (
              <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              "Clear & Add"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
