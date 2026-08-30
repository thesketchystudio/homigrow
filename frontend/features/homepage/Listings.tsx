// features/homepage/Listings.tsx
// Featured/trending property listings grid on the homepage. Pulls the 3
// newest active Bengaluru listings from the real GET /properties endpoint
// (same one the /properties Listings page uses) instead of hardcoded
// mock data. Cards reuse the shared components/shared/PropertyCard —
// previously this section had its own bespoke, near-duplicate card
// implementation, against the project's rule that shared components are
// built once and never forked per page. The badge is the real listing
// type (For Sale/For Rent/PG), matching the LISTING_TAG convention
// PropertyHeader.tsx already uses on the Details page — not fabricated
// marketing copy like "Premium Curation"/"Exclusive", which had no data
// behind it. Its exact per-type tag colors aren't expressible via the
// shared card's badge `variant` (a fixed default/secondary/outline/
// destructive palette), so this passes an inline `style` override — a
// prop PropertyCard already exposes for exactly this case.

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import svgPaths from "@/lib/homepage-svg-paths";
import PropertyCard from "@/components/shared/PropertyCard";
import { listProperties } from "@/lib/api/endpoints/properties";
import { useSavedPropertyToggle } from "@/lib/hooks/useSavedPropertyToggle";
import { ListingType, LISTING_TYPE_LABELS } from "@/lib/enums";
import { formatListingPrice } from "@/lib/utils";
import { FONT_HEADING as sg } from "@/lib/fonts";

const FALLBACK_IMAGE = "/homepage/modern-mansion.png";
const TRENDING_CITY = "Bengaluru";

const LISTING_TAG: Record<ListingType, { label: string; bg: string; text: string }> = {
  [ListingType.sale]: { label: LISTING_TYPE_LABELS[ListingType.sale], bg: "#13c200", text: "#fefeff" },
  [ListingType.rent]: { label: LISTING_TYPE_LABELS[ListingType.rent], bg: "#92f574", text: "#232323" },
  [ListingType.pg]: { label: LISTING_TYPE_LABELS[ListingType.pg], bg: "#090909", text: "#fefeff" },
};

function ArrowIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17.5 17.5" fill="none">
      <path d={svgPaths.p1a406200} fill="#575E70" />
    </svg>
  );
}

function CardSkeleton() {
  return (
    <div style={{ background: "#fefeff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ height: 224, background: "#e5e7eb" }} />
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ height: 16, width: "70%", background: "#e5e7eb", borderRadius: 4 }} />
        <div style={{ height: 12, width: "50%", background: "#e5e7eb", borderRadius: 4 }} />
        <div style={{ height: 16, width: "40%", background: "#e5e7eb", borderRadius: 4 }} />
      </div>
    </div>
  );
}

export default function Listings() {
  const { data, isLoading } = useQuery({
    queryKey: ["homepage-trending", TRENDING_CITY],
    queryFn: () => listProperties({ city: TRENDING_CITY, sort: "newest", page_size: 3 }),
  });
  const { savedIds, onToggleSave } = useSavedPropertyToggle();

  const items = data?.items ?? [];
  if (!isLoading && items.length === 0) return null;

  return (
    <section style={{ background: "#f8f9fa" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "clamp(60px, 10vw, 100px) clamp(20px, 5vw, 150px)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "clamp(24px, 4vw, 32px)",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <span
              style={{
                fontFamily: sg,
                fontWeight: 700,
                fontSize: "clamp(11px, 2vw, 12px)",
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                color: "#575e70",
              }}
            >
              Featured Collection
            </span>
            <h2
              style={{
                fontFamily: sg,
                fontWeight: 500,
                fontSize: "clamp(24px, 5vw, 36px)",
                lineHeight: "1.2",
                color: "#232323",
                margin: 0,
              }}
            >
              Trending in {TRENDING_CITY}
            </h2>
          </div>
          <Link
            href="/properties"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              textDecoration: "none",
            }}
          >
            <span
              style={{
                fontFamily: sg,
                fontWeight: 700,
                fontSize: 16,
                color: "#575e70",
              }}
            >
              Explore all properties
            </span>
            <ArrowIcon />
          </Link>
        </div>

        <div className="listings-grid">
          {isLoading
            ? Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)
            : items.map((item) => {
                const tag = LISTING_TAG[item.listing_type];
                return (
                  <PropertyCard
                    key={item.id}
                    property={{
                      id: item.id,
                      title: item.title,
                      imageUrl: item.cover_image_url ?? FALLBACK_IMAGE,
                      price: formatListingPrice(item),
                      location: `${item.locality}, ${item.city}`,
                      bhk: item.bhk ?? undefined,
                      areaSqft: item.area_sqft ?? undefined,
                      href: `/properties/${item.id}`,
                    }}
                    isSaved={savedIds.has(item.id)}
                    onToggleSave={onToggleSave}
                    badge={{ label: tag.label, style: { background: tag.bg, color: tag.text } }}
                  />
                );
              })}
        </div>
      </div>

      <style>{`
        .listings-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 640px) {
          .listings-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
        }

        @media (min-width: 1024px) {
          .listings-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }
        }
      `}</style>
    </section>
  );
}
