// features/admin/AdminControls.tsx
// Small controls shared by the admin list screens: the search box, the
// grey segmented filter (All / Active / Pending …), and Prev/Next paging.

"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { cn } from "@/lib/utils";

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex h-[41px] w-full items-center gap-2 rounded-[4px] border border-[rgba(198,198,205,0.5)] bg-white px-4 sm:w-[256px]">
      <Search size={14} className="shrink-0 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={100}
        aria-label={placeholder}
        className="w-full bg-transparent font-body text-[13px] text-brand-primary-600 outline-none placeholder:text-slate-400"
      />
    </label>
  );
}

export function AdminSegmentedFilter<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex flex-wrap gap-1 rounded-[4px] bg-slate-200/70 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-[3px] px-4 py-1.5 font-heading text-[12px] font-bold",
            option.value === value ? "bg-white text-brand-primary-600 shadow-sm" : "text-slate-500 hover:text-brand-primary-600",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function AdminPager({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4 pt-2 font-body text-[13px] text-slate-500">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="flex items-center gap-1 disabled:opacity-40"
      >
        <ChevronLeft size={14} /> Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="flex items-center gap-1 disabled:opacity-40"
      >
        Next <ChevronRight size={14} />
      </button>
    </div>
  );
}
