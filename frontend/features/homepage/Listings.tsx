// features/homepage/Listings.tsx
// Featured/trending property listings grid on the homepage. Pulls the 3
// newest active Bengaluru listings from the real GET /properties endpoint
// (same one the /properties Listings page uses) instead of hardcoded
// mock data. The badge is now the real listing type (For Sale/For Rent/
// PG), matching the LISTING_TAG convention PropertyHeader.tsx already
// uses on the Details page — not fabricated marketing copy like "Premium
// Curation"/"Exclusive", which had no data behind it.

"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import svgPaths from "@/lib/homepage-svg-paths";
import { listProperties, type PropertyListItem } from "@/lib/api/endpoints/properties";
import { useSavedPropertyToggle } from "@/lib/hooks/useSavedPropertyToggle";
import { ListingType } from "@/lib/enums";
import { formatINR } from "@/lib/utils";

const FALLBACK_IMAGE = "/homepage/modern-mansion.png";
const TRENDING_CITY = "Bengaluru";

const sg = "'Space Grotesk', sans-serif";
const pj = "'Plus Jakarta Sans', sans-serif";

const LISTING_TAG: Record<ListingType, { label: string; bg: string; text: string }> = {
  [ListingType.sale]: { label: "For Sale", bg: "#13c200", text: "#fefeff" },
  [ListingType.rent]: { label: "For Rent", bg: "#92f574", text: "#232323" },
  [ListingType.pg]: { label: "PG / Co-living", bg: "#090909", text: "#fefeff" },
};

function formatPrice(item: PropertyListItem): string {
  if (item.listing_type === ListingType.sale) return formatINR(item.price);
  return `₹${Math.round(item.price).toLocaleString("en-IN")}/mo`;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="18" viewBox="0 0 20 18.35" fill={filled ? "#ef4444" : "none"}>
      <path d={svgPaths.p279a9400} fill={filled ? "#ef4444" : "#FEFEFF"} />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg width="15" height="10" viewBox="0 0 15 10.5" fill="none">
      <path d={svgPaths.p1b3c1c80} fill="rgba(26,26,26,0.8)" />
    </svg>
  );
}

function AreaIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 12.7631 12.7631" fill="none">
      <path d={svgPaths.p27694840} fill="rgba(26,26,26,0.8)" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="9" height="20" viewBox="0 0 9.33333 19.6667" fill="none">
      <path d={svgPaths.p3ad3adc0} fill="rgba(26,26,26,0.8)" />
    </svg>
  );
}

function PropertyCard({
  item,
  isSaved,
  onToggleSave,
}: {
  item: PropertyListItem;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const tag = LISTING_TAG[item.listing_type];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fefeff",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: hovered ? "0 16px 48px rgba(0,0,0,0.12)" : "0 1px 4px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "box-shadow 0.25s ease, transform 0.25s ease",
      }}
    >
      <div style={{ position: "relative", height: 280, overflow: "hidden", flexShrink: 0 }}>
        <img
          src={item.cover_image_url ?? FALLBACK_IMAGE}
          alt={item.title}
          style={{
            width: "100%",
            height: "133%",
            objectFit: "cover",
            objectPosition: "center",
            marginTop: "-16.67%",
            display: "block",
            transform: hovered ? "scale(1.03)" : "scale(1)",
            transition: "transform 0.4s ease",
          }}
        />
        <button
          onClick={() => onToggleSave(item.id)}
          aria-label={isSaved ? "Remove from saved" : "Save property"}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "rgba(254,254,255,0.2)",
            backdropFilter: "blur(6px)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
        >
          <HeartIcon filled={isSaved} />
        </button>
        <div
          style={{
            position: "absolute",
            bottom: 13,
            left: 16,
            background: tag.bg,
            borderRadius: 4,
            padding: "3.5px 12px",
          }}
        >
          <span style={{ fontFamily: pj, fontWeight: 700, fontSize: 12, color: tag.text }}>{tag.label}</span>
        </div>
      </div>

      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontFamily: sg,
                fontWeight: 700,
                fontSize: 16,
                lineHeight: "24px",
                color: "#1a1a1a",
              }}
            >
              {item.title}
            </span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <PinIcon />
              <span
                style={{
                  fontFamily: pj,
                  fontWeight: 400,
                  fontSize: 12,
                  color: "rgba(26,26,26,0.8)",
                }}
              >
                {item.locality}, {item.city}
              </span>
            </div>
          </div>
          <span
            style={{
              fontFamily: sg,
              fontWeight: 700,
              fontSize: 16,
              color: "#1a1a1a",
            }}
          >
            {formatPrice(item)}
          </span>
        </div>

        {(item.bhk !== null || item.area_sqft !== null) && (
          <div
            style={{
              display: "flex",
              gap: 24,
              alignItems: "center",
              padding: "5px 0",
              borderTop: "1px solid rgba(198,198,205,0.1)",
              borderBottom: "1px solid rgba(198,198,205,0.1)",
            }}
          >
            {item.bhk !== null && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <BedIcon />
                <span style={{ fontFamily: pj, fontWeight: 500, fontSize: 14, color: "#1a1a1a" }}>{item.bhk} BHK</span>
              </div>
            )}
            {item.area_sqft !== null && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <AreaIcon />
                <span style={{ fontFamily: pj, fontWeight: 500, fontSize: 14, color: "#1a1a1a" }}>
                  {item.area_sqft.toLocaleString("en-IN")} sqft
                </span>
              </div>
            )}
          </div>
        )}

        <Link
          href={`/properties/${item.id}`}
          style={{
            width: "100%",
            padding: "16px",
            background: "#dfe0e1",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontFamily: sg,
            fontWeight: 700,
            fontSize: 16,
            color: "#1a1a1a",
            transition: "background 0.2s",
            textAlign: "center",
            textDecoration: "none",
            display: "block",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#c8c9ca")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#dfe0e1")}
        >
          VIEW DETAILS
        </Link>
      </div>
    </div>
  );
}

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
      <div style={{ height: 280, background: "#e5e7eb" }} />
      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 12 }}>
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
            : items.map((item) => (
                <PropertyCard key={item.id} item={item} isSaved={savedIds.has(item.id)} onToggleSave={onToggleSave} />
              ))}
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
