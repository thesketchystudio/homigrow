// features/properties/listings/ListingsPagination.tsx
// "Pagination"/"Page slider" (Figma node 28:907): prev/numbered
// pages/next. Shows up to 3 page numbers around the current page plus
// first/last with an ellipsis, collapsing to whatever fits when there
// are fewer pages than that.

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type ListingsPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function pageNumbers(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1] > 1) result.push("ellipsis");
    result.push(p);
  });
  return result;
}

export function ListingsPagination({ page, totalPages, onPageChange }: ListingsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-6">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
        className="flex size-10 items-center justify-center rounded-lg bg-brand-secondary-400 disabled:opacity-40"
      >
        <ChevronLeft className="size-3" />
      </button>

      {pageNumbers(page, totalPages).map((entry, index) =>
        entry === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-2 font-body text-[16px] text-brand-primary-800/65">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onPageChange(entry)}
            aria-current={entry === page ? "page" : undefined}
            className={cn(
              "flex size-10 items-center justify-center rounded-lg font-heading text-[16px] font-bold",
              entry === page ? "bg-brand-secondary-800 text-brand-secondary-400" : "bg-brand-secondary-400 text-brand-primary-400",
            )}
          >
            {entry}
          </button>
        ),
      )}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
        className="flex size-10 items-center justify-center rounded-lg bg-brand-secondary-400 disabled:opacity-40"
      >
        <ChevronRight className="size-3" />
      </button>
    </div>
  );
}
