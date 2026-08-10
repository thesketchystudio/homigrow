// features/homepage/Areas.tsx
// "Top areas" cards for the featured city, with rating, price/sqft, and
// month-over-month trend.

"use client";

import svgPaths from "@/lib/homepage-svg-paths";
import { FONT_HEADING as sg, FONT_BODY as pj } from "@/lib/fonts";

const areas = [
  {
    name: "Indiranagar",
    rating: "4.98",
    reviews: 506,
    pricePerSqft: "₹2,45,000",
    trend: "+4%",
    up: true,
    tags: ["Tree-lined avenues", "Café culture", "Metro access"],
  },
  {
    name: "Koramangala",
    rating: "4.75",
    reviews: 430,
    pricePerSqft: "₹2,30,000",
    trend: "-2%",
    up: false,
    tags: ["Startup hub", "Social scene", "7 blocks"],
  },
  {
    name: "MG Road",
    rating: "5.00",
    reviews: 620,
    pricePerSqft: "₹3,10,000",
    trend: "+7%",
    up: true,
    tags: ["CBD location", "Premium retail", "MNC offices"],
  },
  {
    name: "Whitefield",
    rating: "4.82",
    reviews: 388,
    pricePerSqft: "₹1,85,000",
    trend: "+3%",
    up: true,
    tags: ["IT corridor", "Gated communities", "New supply"],
  },
];

function StarIcon() {
  return (
    <svg width="12" height="13" viewBox="0 0 11.7044 12.6797" fill="none">
      <path d={svgPaths.pee52d80} fill="#FACC15" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17.5 17.5" fill="none">
      <path d={svgPaths.p1a406200} fill="#575E70" />
    </svg>
  );
}

export default function Areas() {
  return (
    <section style={{ background: "#fefeff" }}>
      <div className="section-inner">
        <div className="section-header">
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <span
              style={{
                fontFamily: sg,
                fontWeight: 700,
                fontSize: 12,
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
                fontSize: 36,
                lineHeight: "44px",
                color: "#232323",
                margin: 0,
              }}
            >
              {"Explore Bengaluru's top areas"}
            </h2>
          </div>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span style={{ fontFamily: sg, fontWeight: 700, fontSize: 16, color: "#575e70" }}>More tools</span>
            <ArrowIcon />
          </button>
        </div>

        <div className="grid-4">
          {areas.map((a) => (
            <div
              key={a.name}
              style={{
                background: "#fefeff",
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid rgba(198,198,205,0.2)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  height: 3,
                  background: a.up ? "#13c200" : "#fa5a0b",
                  flexShrink: 0,
                }}
              />

              <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24, flex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <h3
                    style={{
                      fontFamily: sg,
                      fontWeight: 500,
                      fontSize: 20,
                      lineHeight: "28px",
                      color: "#1a1a1a",
                      margin: 0,
                    }}
                  >
                    {a.name}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <StarIcon />
                      <span style={{ fontFamily: sg, fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{a.rating}</span>
                    </div>
                    <span style={{ color: "rgba(0,0,0,0.2)", fontSize: 12 }}>·</span>
                    <span style={{ fontFamily: sg, fontWeight: 400, fontSize: 14, color: "rgba(26,26,26,0.7)" }}>
                      {a.reviews} reviews
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span
                    style={{
                      fontFamily: pj,
                      fontWeight: 400,
                      fontSize: 14,
                      color: "rgba(26,26,26,0.8)",
                    }}
                  >
                    starting from
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: sg, fontWeight: 700, fontSize: 16, color: "#1a1a1a" }}>
                      {a.pricePerSqft}/sq ft
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: a.up ? "#30c91f" : "#fa5a0b",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: sg,
                          fontWeight: 500,
                          fontSize: 13,
                          color: a.up ? "#30c91f" : "#fa5a0b",
                        }}
                      >
                        {a.trend} this month
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1, alignContent: "flex-start" }}>
                  {a.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        display: "inline-block",
                        background: "#f8f9fa",
                        borderRadius: 6,
                        padding: "3px 10px",
                        fontFamily: pj,
                        fontWeight: 400,
                        fontSize: 11,
                        color: "rgba(26,26,26,0.6)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <button
                  style={{
                    width: "100%",
                    padding: "14px 12px",
                    background: "#dfe0e1",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: sg,
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#1a1a1a",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#c8c9ca")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#dfe0e1")}
                >
                  VIEW ALL PROPERTIES
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
