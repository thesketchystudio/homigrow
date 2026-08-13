// features/homepage/Areas.tsx
// "Top areas" cards for the featured city, with rating, price/sqft, and
// month-over-month trend. Redesigned 2026-08-13 to match the updated
// Figma "Areas" frame (node 388:122, file YvQ2kfODoSxUTwYo6JZ7Tv): the
// colored top strip is gone — the whole price block is now a colored
// box (mint `#f4fef1` on an up trend, light red `#fef1f1` otherwise),
// tags use a smaller 4px radius at full text opacity, and the CTA is an
// outlined "VIEW PROPERTIES" button rather than a filled gray
// "VIEW ALL PROPERTIES" one. The header button/arrow now correctly
// reads "More areas" (was "More tools" — a copy-paste leftover from an
// unrelated section, unrelated to this data).

"use client";

import svgPaths from "@/lib/homepage-svg-paths";
import { FONT_HEADING as sg, FONT_BODY as pj } from "@/lib/fonts";

const areas = [
  {
    name: "Indiranagar",
    rating: "4.98",
    reviews: 506,
    priceLabel: "starting from",
    pricePerSqft: "₹2,45,000",
    trend: "+4% this month",
    up: true,
    tags: ["Tree lines avenues", "Metro", "Social scene"],
  },
  {
    name: "Koramangala",
    rating: "4.75",
    reviews: 632,
    priceLabel: "average price",
    pricePerSqft: "₹2,10,000",
    trend: "+3.5% this month",
    up: false,
    tags: ["Bustling nightlife", "Metro", "Cafés and restaurants"],
  },
  {
    name: "Jayanagar",
    rating: "4.60",
    reviews: 450,
    priceLabel: "starting from",
    pricePerSqft: "₹1,95,000",
    trend: "+2% this month",
    up: true,
    tags: ["Green parks", "Metro", "Family-friendly"],
  },
  {
    name: "Whitefield",
    rating: "4.80",
    reviews: 520,
    priceLabel: "average price",
    pricePerSqft: "₹2,30,000",
    trend: "+5% this month",
    up: true,
    tags: ["Tech hubs", "Train", "Shopping malls"],
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
            <span style={{ fontFamily: sg, fontWeight: 700, fontSize: 16, color: "#575e70" }}>More areas</span>
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
              <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24, flex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <h3
                      style={{
                        fontFamily: sg,
                        fontWeight: 500,
                        fontSize: 20,
                        lineHeight: "28px",
                        color: "#232323",
                        margin: 0,
                      }}
                    >
                      {a.name}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <StarIcon />
                        <span style={{ fontFamily: sg, fontWeight: 700, fontSize: 15, color: "#232323" }}>{a.rating}</span>
                      </div>
                      <span style={{ color: "rgba(0,0,0,0.2)", fontSize: 12 }}>·</span>
                      <span style={{ fontFamily: sg, fontWeight: 400, fontSize: 14, color: "rgba(26,26,26,0.7)" }}>
                        {a.reviews} reviews
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      background: a.up ? "#f4fef1" : "#fef1f1",
                      borderRadius: 8,
                      padding: "16px 12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <span style={{ fontFamily: pj, fontWeight: 400, fontSize: 12, color: "rgba(26,26,26,0.8)" }}>{a.priceLabel}</span>
                    <span style={{ fontFamily: sg, fontWeight: 700, fontSize: 16, color: "#232323" }}>{a.pricePerSqft}/sq ft</span>
                    <span
                      style={{
                        fontFamily: sg,
                        fontWeight: 700,
                        fontSize: 10,
                        color: a.up ? "#30c91f" : "#c91f1f",
                      }}
                    >
                      {a.trend}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1, alignContent: "flex-start" }}>
                  {a.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        display: "inline-block",
                        background: "#f8f9fa",
                        borderRadius: 4,
                        padding: "3.5px 12px",
                        fontFamily: pj,
                        fontWeight: 400,
                        fontSize: 12,
                        color: "#232323",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <button
                  style={{
                    width: "100%",
                    padding: 17,
                    background: "#fefeff",
                    borderRadius: 4,
                    border: "1px solid #9c9c9c",
                    cursor: "pointer",
                    fontFamily: sg,
                    fontWeight: 700,
                    fontSize: 16,
                    color: "#232323",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fefeff")}
                >
                  VIEW PROPERTIES
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
