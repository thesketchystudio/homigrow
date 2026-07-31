// features/homepage/Hero.tsx
// Homepage hero: full-bleed background image, headline, and the
// Buy/Rent/Commercial search widget with property type, price range,
// and location filters. "Explore" pushes the selections onto the real
// /properties search (lib/api/endpoints/properties.ts's buildQueryString
// — same param names GET /properties and the Listings page both use),
// so this is a real search, not a decorative widget. Property Type
// options are the real PropertyType enum values, relabeled per tab
// (Figma's own copy — e.g. "Villas & Estates", "Fully Furnished" — has
// no backing field; furnishing in particular isn't a filter GET
// /properties supports today), matching the precedent already set by
// the Listings page's own FilterSidebar.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import svgPaths from "@/lib/homepage-svg-paths";
import { buildQueryString, type PropertyListParams } from "@/lib/api/endpoints/properties";
import { ListingType, PropertyType } from "@/lib/enums";

const imgLuxuryVilla = "/homepage/luxury-villa.png";

const sg = "'Space Grotesk', sans-serif";

type Tab = "Buy" | "Rent" | "Commercial";

const TAB_LISTING_TYPE: Record<Tab, ListingType | null> = {
  Buy: ListingType.sale,
  Rent: ListingType.rent,
  // Commercial spans both sale and rent listings on the real data model —
  // there's no single ListingType for it, so it's left unfiltered here.
  Commercial: null,
};

const propertyTypes: Record<Tab, { value: PropertyType; label: string }[]> = {
  Buy: [
    { value: PropertyType.apartment, label: "Apartment" },
    { value: PropertyType.villa, label: "Villa" },
    { value: PropertyType.independent_house, label: "Independent House" },
    { value: PropertyType.plot, label: "Plot" },
  ],
  Rent: [
    { value: PropertyType.apartment, label: "Apartment" },
    { value: PropertyType.villa, label: "Villa" },
    { value: PropertyType.independent_house, label: "Independent House" },
    { value: PropertyType.pg_colive, label: "PG / Co-living" },
  ],
  Commercial: [
    { value: PropertyType.office, label: "Office Space" },
    { value: PropertyType.shop, label: "Retail Shop" },
  ],
};

const ANY_TYPE = "Any Type";

type PriceRange = { min?: number; max?: number };

const priceRanges: Record<Tab, { label: string; range: PriceRange }[]> = {
  Buy: [
    { label: "Under ₹50L", range: { max: 50_00_000 } },
    { label: "₹50L – 1Cr", range: { min: 50_00_000, max: 1_00_00_000 } },
    { label: "₹1Cr – 3Cr", range: { min: 1_00_00_000, max: 3_00_00_000 } },
    { label: "₹3Cr – 5Cr", range: { min: 3_00_00_000, max: 5_00_00_000 } },
    { label: "₹5Cr+", range: { min: 5_00_00_000 } },
  ],
  Rent: [
    { label: "Under ₹20K/mo", range: { max: 20_000 } },
    { label: "₹20K – 50K", range: { min: 20_000, max: 50_000 } },
    { label: "₹50K – 1L", range: { min: 50_000, max: 1_00_000 } },
    { label: "₹1L – 3L", range: { min: 1_00_000, max: 3_00_000 } },
    { label: "₹3L+", range: { min: 3_00_000 } },
  ],
  Commercial: [
    { label: "Under ₹1L/mo", range: { max: 1_00_000 } },
    { label: "₹1L – 5L", range: { min: 1_00_000, max: 5_00_000 } },
    { label: "₹5L – 20L", range: { min: 5_00_000, max: 20_00_000 } },
    { label: "₹20L+", range: { min: 20_00_000 } },
  ],
};

const ANY_BUDGET = "Any Budget";

export default function Hero() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Buy");
  const [propType, setPropType] = useState(ANY_TYPE);
  const [price, setPrice] = useState(ANY_BUDGET);
  const [location, setLocation] = useState("");
  const [propOpen, setPropOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);

  const handleTab = (t: Tab) => {
    setTab(t);
    setPropType(ANY_TYPE);
    setPrice(ANY_BUDGET);
    setPropOpen(false);
    setPriceOpen(false);
  };

  const handleExplore = () => {
    const selectedType = propertyTypes[tab].find((opt) => opt.label === propType);
    const selectedRange = priceRanges[tab].find((opt) => opt.label === price)?.range;

    const params: PropertyListParams = {
      city: location.trim() || undefined,
      listing_type: TAB_LISTING_TYPE[tab] ?? undefined,
      property_type: selectedType ? [selectedType.value] : undefined,
      price_min: selectedRange?.min,
      price_max: selectedRange?.max,
    };

    router.push(`/properties${buildQueryString(params)}`);
  };

  return (
    <section
      style={{
        position: "relative",
        minHeight: "clamp(600px, 100vh, 870px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <img
        src={imgLuxuryVilla}
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(9,9,9,0.28)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 1400,
          margin: "0 auto",
          padding: "0 clamp(20px, 5vw, 150px)",
          paddingTop: 72,
          display: "flex",
          flexDirection: "column",
          gap: "clamp(24px, 5vw, 40px)",
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "clamp(12px, 2vw, 16px)" }}>
          <h1
            style={{
              fontFamily: sg,
              fontWeight: 700,
              fontSize: "clamp(32px, 8vw, 64px)",
              lineHeight: "1.15",
              color: "#fefeff",
              margin: 0,
              textShadow: "0px 2px 1px rgba(0,0,0,0.06), 0px 4px 1.5px rgba(0,0,0,0.07)",
            }}
          >
            Find Your Perfect Home.
          </h1>
          <p
            style={{
              fontFamily: sg,
              fontWeight: 400,
              fontSize: "clamp(16px, 3vw, 20px)",
              lineHeight: "1.4",
              color: "rgba(254,254,255,0.9)",
              margin: 0,
            }}
          >
            Search, compare, and connect with verified brokers across India.
          </p>
        </div>

        <div
          style={{
            width: "100%",
            borderRadius: 16,
            background: "rgba(254,254,255,0.95)",
            backdropFilter: "blur(12px)",
            boxShadow: "0px 25px 50px -12px rgba(0,0,0,0.25)",
            overflow: "visible",
          }}
        >
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid rgba(198,198,205,0.2)",
              padding: "8px 8px 0",
            }}
          >
            {(["Buy", "Rent", "Commercial"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => handleTab(t)}
                style={{
                  position: "relative",
                  padding: "clamp(12px, 2vw, 16px) clamp(16px, 3vw, 24px) clamp(14px, 2vw, 18px)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: sg,
                  fontWeight: 500,
                  fontSize: "clamp(14px, 2vw, 16px)",
                  color: tab === t ? "#1a1a1a" : "rgba(26,26,26,0.8)",
                }}
              >
                {t}
                {tab === t && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: "#1a1a1a",
                      borderRadius: "2px 2px 0 0",
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 16,
              padding: "clamp(16px, 3vw, 24px)",
              alignItems: "end",
            }}
            className="hero-filters"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
              <span
                style={{
                  fontFamily: sg,
                  fontWeight: 400,
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "rgba(26,26,26,0.8)",
                }}
              >
                Property Type
              </span>
              <button
                onClick={() => {
                  setPropOpen(!propOpen);
                  setPriceOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: sg,
                  fontWeight: 400,
                  fontSize: "clamp(14px, 2vw, 16px)",
                  color: "#1a1a1a",
                  height: 28,
                }}
              >
                <span>{propType}</span>
                <svg width="18" height="18" viewBox="0 0 27 27" fill="none">
                  <path d={svgPaths.p2fccf000} stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.025" />
                </svg>
              </button>
              {propOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    background: "#fefeff",
                    borderRadius: 10,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    zIndex: 50,
                    overflow: "hidden",
                  }}
                >
                  {[ANY_TYPE, ...propertyTypes[tab].map((opt) => opt.label)].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setPropType(opt);
                        setPropOpen(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "12px 16px",
                        textAlign: "left",
                        background: propType === opt ? "#f8f9fa" : "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: sg,
                        fontWeight: propType === opt ? 600 : 400,
                        fontSize: 15,
                        color: "#1a1a1a",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
              <span
                style={{
                  fontFamily: sg,
                  fontWeight: 400,
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "rgba(26,26,26,0.8)",
                }}
              >
                Price Range
              </span>
              <button
                onClick={() => {
                  setPriceOpen(!priceOpen);
                  setPropOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: sg,
                  fontWeight: 400,
                  fontSize: "clamp(14px, 2vw, 16px)",
                  color: "#1a1a1a",
                  height: 28,
                }}
              >
                <span>{price}</span>
                <svg width="18" height="18" viewBox="0 0 27 27" fill="none">
                  <path d={svgPaths.p2fccf000} stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.025" />
                </svg>
              </button>
              {priceOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    background: "#fefeff",
                    borderRadius: 10,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    zIndex: 50,
                    overflow: "hidden",
                  }}
                >
                  {[ANY_BUDGET, ...priceRanges[tab].map((opt) => opt.label)].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setPrice(opt);
                        setPriceOpen(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "12px 16px",
                        textAlign: "left",
                        background: price === opt ? "#f8f9fa" : "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: sg,
                        fontWeight: price === opt ? 600 : 400,
                        fontSize: 15,
                        color: "#1a1a1a",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontFamily: sg,
                  fontWeight: 400,
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "rgba(26,26,26,0.8)",
                }}
              >
                Location
              </span>
              <input
                type="text"
                placeholder="Search City..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  fontFamily: sg,
                  fontWeight: 400,
                  fontSize: "clamp(14px, 2vw, 16px)",
                  color: "#1a1a1a",
                  height: 28,
                  padding: 0,
                  width: "100%",
                }}
              />
            </div>

            <button
              onClick={handleExplore}
              style={{
                background: "#090909",
                borderRadius: 8,
                padding: "16px clamp(24px, 5vw, 52px)",
                display: "flex",
                gap: 8,
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                cursor: "pointer",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d={svgPaths.p8a35e00} fill="#FEFEFF" />
              </svg>
              <span
                style={{
                  fontFamily: sg,
                  fontWeight: 700,
                  fontSize: "clamp(14px, 2vw, 16px)",
                  color: "#fefeff",
                }}
              >
                Explore
              </span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 769px) {
          .hero-filters {
            grid-template-columns: 1fr 1fr 1.5fr auto !important;
          }
        }
      `}</style>
    </section>
  );
}
