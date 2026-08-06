// features/search/SearchOverlay.tsx
// The nav search overlay (Figma node 28:510, "search history"), opened by
// focusing TopNavBar's search box. Bespoke fixed-position panel rather than
// the shared Modal/Dialog primitive — Modal's Radix focus trap would fight
// with the search input living outside it in TopNavBar. Portaled to
// document.body rather than rendered as a child of <nav> — a parent's own
// background always paints before its children regardless of z-index, so
// nesting it inside <nav> meant the backdrop dimmed <nav>'s white
// background too (only the nav's own content had an explicit z-index to
// paint back on top of it). Portaling out makes <nav> (z-index 100) a
// sibling stacking context that naturally paints entirely above the
// backdrop (z-index auto), matching the Figma mock where the nav bar stays
// clean while the page content behind it dims.
//
// "Curated Neighborhoods" ranks by real active-listing count
// (GET /properties/neighborhoods) — there's no separate curation step, so
// the footer avoids Figma's fabricated "12 premium micro-markets" claim.
// "Explore Map" toasts, matching the Listings page's own unbuilt map view.

"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, History, Home } from "lucide-react";

import { getNeighborhoods } from "@/lib/api/endpoints/properties";
import { PropertyType } from "@/lib/enums";
import { useSearchHistoryStore, type RecentSearch } from "@/lib/stores/searchHistory";
import { toast } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";

const QUICK_FILTERS: { label: string; icon: typeof Home; propertyType: PropertyType | null }[] = [
  { label: "Villas", icon: Home, propertyType: PropertyType.villa },
  { label: "Apartments", icon: Building2, propertyType: PropertyType.apartment },
  { label: "Penthouses", icon: Building2, propertyType: null },
];

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { searches, record } = useSearchHistoryStore();

  const { data: neighborhoods, isLoading } = useQuery({
    queryKey: ["curated-neighborhoods"],
    queryFn: () => getNeighborhoods(4),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Lock page scroll while open — otherwise the underlying page can still
  // scroll behind this fixed-position overlay, which visually desyncs the
  // backdrop from what's supposedly "behind" it and made clicks meant for
  // the backdrop land on the (now-scrolled-into-place) page content instead.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const goTo = (href: string, entry?: Omit<RecentSearch, "id">) => {
    if (entry) record(entry);
    router.push(href);
    onClose();
  };

  return createPortal(
    // overflow-y-auto here (not on the panel) so a short viewport can still
    // reach the whole panel — a fixed-position element doesn't respond to
    // page scroll, so without this the footer CTA is unreachable below
    // ~750px of viewport height. The backdrop is independently `fixed`
    // (not `absolute`) so it stays pinned to the full viewport regardless
    // of this container's scroll offset, instead of scrolling away with
    // the content and leaving the top of the page undimmed. z-90 is
    // required now that this is portaled to document.body instead of
    // nested in <nav> — it no longer inherits nav's elevated stacking
    // context, so without an explicit z-index page content with its own
    // z-index (e.g. the homepage Hero's floating search widget, z-index
    // up to 50) would render on top of this panel. Stays below <nav>'s
    // z-index 100 so the nav bar itself is unaffected.
    <div className="fixed inset-0 z-90 overflow-y-auto">
      <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm" onClick={onClose} />

      {/* pointer-events-none here (auto on the card below) — this row
          spans the full width to center the card, so without it the
          empty flex space beside/around the card would silently swallow
          clicks meant for the backdrop underneath, even though nothing
          is visible there. */}
      <div className="pointer-events-none relative flex justify-center px-4 pt-28 pb-10 sm:pt-32">
        <div className="pointer-events-auto w-full max-w-[896px] rounded-xl bg-[#fcf8f9] p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] sm:p-10">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-12 sm:gap-10">
            <div className="flex flex-col gap-6 sm:col-span-4">
              <div className="flex flex-col gap-6">
                <p className="font-heading text-[12px] font-bold uppercase tracking-[1.2px] text-[#7b7a7d]">Recent Searches</p>
                {searches.length === 0 ? (
                  <p className="font-body text-[14px] text-[#5f5f61]">No recent searches yet.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {searches.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => goTo(entry.href)}
                        className="flex items-center gap-4 text-left"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f6f3f4]">
                          <History className="size-4 text-[#5f5f61]" />
                        </span>
                        <span className="flex flex-col">
                          <span className="font-heading text-[14px] font-semibold text-[#323235]">{entry.label}</span>
                          <span className="font-body text-[12px] text-[#5f5f61]">{entry.subtitle}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-6">
                <p className="font-heading text-[12px] font-bold uppercase tracking-[1.2px] text-[#7b7a7d]">Property Types</p>
                <div className="flex flex-col gap-2">
                  {QUICK_FILTERS.map((filter) => {
                    const Icon = filter.icon;
                    const disabled = filter.propertyType === null;
                    return (
                      <button
                        key={filter.label}
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          filter.propertyType &&
                          goTo(`/properties?property_type=${filter.propertyType}`, {
                            label: filter.label,
                            subtitle: "Property type",
                            href: `/properties?property_type=${filter.propertyType}`,
                          })
                        }
                        className="flex items-center gap-2 rounded-lg bg-[#e4e2e5] px-4 py-2 font-heading text-[14px] font-bold text-[#323235] transition-colors enabled:hover:bg-[#565e74] enabled:hover:text-[#f7f7ff] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Icon className="size-3.5" />
                        {filter.label}
                        {disabled && <span className="font-body text-[11px] font-normal">(Coming soon)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 sm:col-span-8">
              <div className="flex items-end justify-between">
                <p className="font-heading text-[12px] font-bold uppercase tracking-[1.2px] text-[#7b7a7d]">Curated Neighborhoods</p>
                <button
                  type="button"
                  onClick={() => toast.info("Map view isn't available yet.")}
                  className="font-heading text-[12px] font-bold text-[#565e74]"
                >
                  Explore Map
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {isLoading &&
                  Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[181px] w-full rounded-lg" />)}

                {!isLoading && neighborhoods?.length === 0 && (
                  <p className="col-span-2 font-body text-[14px] text-[#5f5f61]">No neighborhoods to show yet.</p>
                )}

                {!isLoading &&
                  neighborhoods?.map((n) => (
                    <button
                      key={`${n.city}-${n.locality}`}
                      type="button"
                      onClick={() =>
                        goTo(`/properties?city=${encodeURIComponent(n.city)}&locality=${encodeURIComponent(n.locality)}`, {
                          label: n.locality,
                          subtitle: `${n.property_count} ${n.property_count === 1 ? "property" : "properties"}`,
                          href: `/properties?city=${encodeURIComponent(n.city)}&locality=${encodeURIComponent(n.locality)}`,
                        })
                      }
                      className="relative flex h-[181px] flex-col items-start justify-end overflow-hidden rounded-lg bg-[#f6f3f4] text-left"
                    >
                      {n.cover_image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={n.cover_image_url} alt="" className="absolute inset-0 size-full object-cover opacity-90" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 via-[#0f172a]/0 to-transparent" />
                      <div className="relative flex flex-col gap-0 p-4">
                        <span className="font-heading text-[18px] font-bold tracking-[-0.45px] text-white">{n.locality}</span>
                        <span className="font-body text-[12px] text-white/80">
                          {n.property_count} {n.property_count === 1 ? "Property" : "Properties"}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start gap-4 border-t border-[#eae7ea] pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-body text-[14px] text-[#5f5f61]">Explore verified, actively managed listings across every city we serve.</p>
            <button
              type="button"
              onClick={() => goTo("/properties")}
              className="flex shrink-0 items-center gap-2 font-heading text-[14px] font-bold text-[#0f172a]"
            >
              Search All Listings
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
