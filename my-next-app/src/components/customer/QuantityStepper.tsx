import React from "react";

interface QuantityStepperProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  size?: "sm" | "md";
  disabled?: boolean;
}

export default function QuantityStepper({
  quantity,
  onIncrease,
  onDecrease,
  size = "md",
  disabled = false,
}: QuantityStepperProps) {
  const isSm = size === "sm";

  return (
    <div
      className={`flex items-center justify-between bg-surface-container-high rounded-xl border border-outline-variant p-1 select-none transition-all ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDecrease();
        }}
        disabled={disabled}
        className={`flex items-center justify-center rounded-lg hover:bg-surface-container-highest active:scale-95 transition-all text-on-surface-variant cursor-pointer ${
          isSm ? "w-8 h-8" : "w-10 h-10"
        } disabled:cursor-not-allowed`}
        aria-label="Decrease quantity"
      >
        <span className={`material-symbols-outlined ${isSm ? "text-base" : "text-lg"}`}>
          remove
        </span>
      </button>
      <span
        className={`font-label-lg text-center font-bold text-on-surface ${
          isSm ? "min-w-6 text-sm" : "min-w-8 text-base"
        }`}
      >
        {quantity}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onIncrease();
        }}
        disabled={disabled}
        className={`flex items-center justify-center rounded-lg hover:bg-surface-container-highest active:scale-95 transition-all text-on-surface-variant cursor-pointer ${
          isSm ? "w-8 h-8" : "w-10 h-10"
        } disabled:cursor-not-allowed`}
        aria-label="Increase quantity"
      >
        <span className={`material-symbols-outlined ${isSm ? "text-base" : "text-lg"}`}>
          add
        </span>
      </button>
    </div>
  );
}
