// features/homepage/Listings.tsx
// Featured/trending property listings grid on the homepage.

"use client";

import { useState } from "react";
import Link from "next/link";

import svgPaths from "@/lib/homepage-svg-paths";

const imgModernMansion = "/homepage/modern-mansion.png";
const imgModernLivingRoom = "/homepage/modern-living-room.png";
const imgProp3 = "/homepage/listing-3.png";

const sg = "'Space Grotesk', sans-serif";
const pj = "'Plus Jakarta Sans', sans-serif";

const properties = [
  {
    id: 1,
    name: "The Meridian Estate",
    location: "Indiranagar",
    price: "₹2,45,000/mo",
    tag: "rent",
    bhk: 4,
    sqft: "4,500",
    badge: "Premium Curation",
    badgeBg: "#92f574",
    badgeRadius: 4,
    img: imgModernMansion,
  },
  {
    id: 2,
    name: "Aravali Sky Residences",
    location: "Sadashivanagar",
    price: "₹4.8 Cr",
    tag: "buy",
    bhk: 3,
    sqft: "3,200",
    badge: "New Launch",
    badgeBg: "#13c200",
    badgeRadius: 12,
    img: imgModernLivingRoom,
  },
  {
    id: 3,
    name: "The Glass Penthouse",
    location: "MG Road",
    price: "₹12.5 Cr",
    tag: "buy",
    bhk: 5,
    sqft: "6,800",
    badge: "Exclusive",
    badgeBg: "#090909",
    badgeRadius: 4,
    img: imgProp3,
  },
];

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

function PropertyCard({ p }: { p: (typeof properties)[number] }) {
  const [liked, setLiked] = useState(false);
  const [hovered, setHovered] = useState(false);

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
          src={p.img}
          alt={p.name}
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
          onClick={() => setLiked(!liked)}
          aria-label={liked ? "Remove from saved" : "Save property"}
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
          <HeartIcon filled={liked} />
        </button>
        <div
          style={{
            position: "absolute",
            bottom: 13,
            left: 16,
            background: p.badgeBg,
            borderRadius: p.badgeRadius,
            padding: "3.5px 12px",
          }}
        >
          <span
            style={{
              fontFamily: pj,
              fontWeight: 700,
              fontSize: 12,
              color: p.badgeBg === "#92f574" ? "#232323" : "#fefeff",
            }}
          >
            {p.badge}
          </span>
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
              {p.name}
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
                {p.location}
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
            {p.price}
          </span>
        </div>

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
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <BedIcon />
            <span style={{ fontFamily: pj, fontWeight: 500, fontSize: 14, color: "#1a1a1a" }}>{p.bhk} BHK</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <AreaIcon />
            <span style={{ fontFamily: pj, fontWeight: 500, fontSize: 14, color: "#1a1a1a" }}>{p.sqft} sqft</span>
          </div>
        </div>

        <button
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
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#c8c9ca")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#dfe0e1")}
        >
          VIEW DETAILS
        </button>
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

export default function Listings() {
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
              Trending in Bengaluru
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
          {properties.map((p) => (
            <PropertyCard key={p.id} p={p} />
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
