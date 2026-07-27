import React from "react";

interface CategoryTabProps {
  id: string;
  label: string;
  image: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function CategoryTab({
  id,
  label,
  image,
  isSelected,
  onClick,
}: CategoryTabProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 p-3 pr-6 rounded-xl flex items-center gap-md app-shadow border transition-all cursor-pointer select-none active:scale-95 ${
        isSelected
          ? "bg-primary text-white border-primary"
          : "bg-surface-container-lowest border-transparent hover:border-outline-variant text-on-surface"
      }`}
    >
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-outline-variant bg-surface-container">
        <img src={image} alt={label} className="w-full h-full object-cover" />
      </div>
      <span className="font-label-md text-label-md font-bold">{label}</span>
    </button>
  );
}
