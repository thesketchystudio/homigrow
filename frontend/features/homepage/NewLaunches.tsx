// features/homepage/NewLaunches.tsx
// "New Launches" section: one featured project with full detail card,
// plus a list of other upcoming/under-construction projects.

"use client";

import { useState } from "react";

const imgModernMansion = "/homepage/modern-mansion.png";
const imgModernLivingRoom = "/homepage/modern-living-room.png";
const imgProp3 = "/homepage/new-launch-3.png";

const sg = "'Space Grotesk', sans-serif";
const pj = "'Plus Jakarta Sans', sans-serif";

const featured = {
  name: "Skyline One",
  developer: "Prestige Group",
  location: "Hebbal, North Bengaluru",
  price: "Starting ₹2.4 Cr",
  possession: "Dec 2026",
  bhk: "3 & 4 BHK",
  units: "240 units",
  rera: "PRM/KA/RERA/1251/446/PR/240210",
  img: imgModernMansion,
  features: ["Sky deck & infinity pool", "5-tier security", "IGBC Green certified"],
};

const others = [
  {
    id: 2,
    name: "The Meridian Residences",
    location: "Whitefield",
    price: "₹1.8 Cr onwards",
    bhk: "2 & 3 BHK",
    status: "Under Construction",
    img: imgModernLivingRoom,
  },
  {
    id: 3,
    name: "Parkview Heights",
    location: "Sarjapur Road",
    price: "₹3.2 Cr onwards",
    bhk: "4 BHK",
    status: "Pre-Launch",
    img: imgProp3,
  },
  {
    id: 4,
    name: "The Jasmine Tower",
    location: "Electronic City",
    price: "₹95L onwards",
    bhk: "2 BHK",
    status: "Ready to Move",
    img: imgModernMansion,
  },
];

const statusColors: Record<string, { bg: string; color: string }> = {
  "Under Construction": { bg: "rgba(250,204,21,0.15)", color: "#92680f" },
  "Pre-Launch": { bg: "rgba(146,245,116,0.2)", color: "#1a6b08" },
  "Ready to Move": { bg: "rgba(19,194,0,0.12)", color: "#13c200" },
};

export default function NewLaunches() {
  const [interested, setInterested] = useState(false);

  return (
    <section style={{ background: "#f8f9fa" }}>
      <div className="section-inner">
        <div style={{ marginBottom: "clamp(28px, 4vw, 48px)" }}>
          <span
            style={{
              fontFamily: sg,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              color: "#575e70",
              display: "block",
              marginBottom: 10,
            }}
          >
            New This Month
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
            New Launches
          </h2>
        </div>

        <div className="grid-split" style={{ alignItems: "start" }}>
          <div
            style={{
              background: "#fefeff",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ position: "relative", height: 340, overflow: "hidden" }}>
              <img
                src={featured.img}
                alt={featured.name}
                style={{
                  width: "100%",
                  height: "133%",
                  objectFit: "cover",
                  marginTop: "-16.67%",
                  display: "block",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(9,9,9,0.5) 0%, transparent 50%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 20,
                  left: 20,
                  background: "#92f574",
                  borderRadius: 6,
                  padding: "4px 12px",
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <span style={{ fontFamily: pj, fontWeight: 700, fontSize: 12, color: "#1a1a1a" }}>RERA Certified</span>
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  background: "rgba(254,254,255,0.15)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 8,
                  padding: "6px 14px",
                }}
              >
                <span style={{ fontFamily: sg, fontWeight: 600, fontSize: 12, color: "#fefeff" }}>
                  Possession {featured.possession}
                </span>
              </div>
              <div style={{ position: "absolute", bottom: 20, left: 24 }}>
                <h3
                  style={{
                    fontFamily: sg,
                    fontWeight: 700,
                    fontSize: 26,
                    color: "#fefeff",
                    margin: "0 0 4px 0",
                    textShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  {featured.name}
                </h3>
                <span style={{ fontFamily: pj, fontWeight: 400, fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
                  by {featured.developer} · {featured.location}
                </span>
              </div>
            </div>

            <div style={{ padding: "28px 32px 32px", borderTop: "4px solid #f8f9fa" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 16,
                  paddingBottom: 20,
                  borderBottom: "1px solid rgba(198,198,205,0.2)",
                  marginBottom: 20,
                }}
              >
                {[
                  { label: "Configuration", value: featured.bhk },
                  { label: "Total Units", value: featured.units },
                  { label: "Starting Price", value: featured.price },
                ].map((s) => (
                  <div key={s.label}>
                    <span
                      style={{
                        fontFamily: pj,
                        fontWeight: 500,
                        fontSize: 11,
                        color: "#888",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                        display: "block",
                        marginBottom: 5,
                      }}
                    >
                      {s.label}
                    </span>
                    <span style={{ fontFamily: sg, fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{s.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {featured.features.map((f) => (
                  <div key={f} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#92f574",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4.5 7.5L9 2.5" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span style={{ fontFamily: pj, fontWeight: 400, fontSize: 14, color: "rgba(26,26,26,0.7)" }}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setInterested(true)}
                style={{
                  width: "100%",
                  padding: 16,
                  background: interested ? "#13c200" : "#090909",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: sg,
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#fefeff",
                  transition: "background 0.2s",
                }}
              >
                {interested ? "✓ Site Visit Requested" : "Book a Site Visit"}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {others.map((p) => {
              const sc = statusColors[p.status] || { bg: "#f8f9fa", color: "#575e70" };
              return (
                <div
                  key={p.id}
                  style={{
                    background: "#fefeff",
                    borderRadius: 14,
                    overflow: "hidden",
                    display: "flex",
                    gap: 0,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                    cursor: "pointer",
                    transition: "box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)")}
                >
                  <div style={{ width: 110, height: 110, flexShrink: 0, overflow: "hidden" }}>
                    <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div
                    style={{
                      padding: "16px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      justifyContent: "center",
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignSelf: "flex-start",
                        background: sc.bg,
                        borderRadius: 6,
                        padding: "2px 8px",
                      }}
                    >
                      <span style={{ fontFamily: pj, fontWeight: 700, fontSize: 11, color: sc.color }}>{p.status}</span>
                    </div>
                    <span style={{ fontFamily: sg, fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{p.name}</span>
                    <span style={{ fontFamily: pj, fontWeight: 400, fontSize: 13, color: "rgba(26,26,26,0.55)" }}>
                      {p.bhk} · {p.location}
                    </span>
                    <span style={{ fontFamily: sg, fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{p.price}</span>
                  </div>
                </div>
              );
            })}

            <button
              style={{
                padding: "18px",
                background: "#f8f9fa",
                border: "1.5px dashed rgba(198,198,205,0.6)",
                borderRadius: 14,
                cursor: "pointer",
                fontFamily: sg,
                fontWeight: 600,
                fontSize: 15,
                color: "#575e70",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#eff0f1")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#f8f9fa")}
            >
              View all 48 new launches →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
