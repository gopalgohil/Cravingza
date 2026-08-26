"use client";

import React from "react";
import Link from "next/link";

export interface CategoryCardProps {
  title: string;
  image: string;
  href: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ title, image, href }) => {
  return (
    <Link
      href={href}
      className="bg-surface-container-lowest p-lg rounded-xl flex flex-col items-center gap-md app-shadow hover:app-shadow-hover transition-all border border-transparent hover:border-primary-container group"
    >
      <div className="w-20 h-20 rounded-full overflow-hidden">
        <img
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          alt={title}
          src={image}
        />
      </div>
      <span className="font-label-md text-label-md font-bold text-slate-800 group-hover:text-primary transition-colors">
        {title}
      </span>
    </Link>
  );
};

export default CategoryCard;
