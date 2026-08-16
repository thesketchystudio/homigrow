// features/homepage/Trust.tsx
// Trust/verification stats, a testimonial highlight, and press logos.

import svgPaths from "@/lib/homepage-svg-paths";
import { FONT_HEADING as sg, FONT_BODY as pj } from "@/lib/fonts";

const imgTestimonial2 = "/homepage/testimonial-2.png";

const stats = [
  { value: "40-point", label: "Verification checklist per listing" },
  { value: "100%", label: "RERA compliant projects only" },
  { value: "48 hrs", label: "Legal due diligence turnaround" },
  { value: "₹2,400 Cr", label: "In closed transactions, 2024" },
];

const press = ["FINANCIAL TIMES", "Architectural Digest", "VOGUE LIVING", "Forbes Estates"];

export default function Trust() {
  return (
    <section style={{ background: "#fefeff" }}>
      <div className="section-inner">
        <div className="grid-2-wide" style={{ alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                background: "#f8f9fa",
                borderRadius: 9999,
                padding: "9px 17px",
                border: "1px solid #f1f5f9",
                alignSelf: "flex-start",
              }}
            >
              <svg width="22" height="21" viewBox="0 0 22 21" fill="none">
                <path d={svgPaths.p3801d860} fill="#575E70" />
              </svg>
              <span
                style={{
                  fontFamily: sg,
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#334155",
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                }}
              >
                100% Verified Listings
              </span>
            </div>

            <div>
              <h2
                style={{
                  fontFamily: sg,
                  fontWeight: 700,
                  fontSize: 36,
                  lineHeight: "44px",
                  color: "#1a1a1a",
                  margin: "0 0 16px 0",
                }}
              >
                Trust Built on Transparency.
              </h2>
              <p
                style={{
                  fontFamily: pj,
                  fontWeight: 400,
                  fontSize: 16,
                  lineHeight: "26px",
                  color: "#64748b",
                  margin: 0,
                }}
              >
                Every listing on Homigrow undergoes a rigorous 40-point verification process. From legal title checks to physical site visits, we ensure your peace of mind.
              </p>
            </div>

            <div
              style={{
                background: "#effeea",
                borderRadius: 8,
                padding: 24,
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 9999,
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <img src={imgTestimonial2} alt="Sarah Mitchell" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p
                  style={{
                    fontFamily: sg,
                    fontWeight: 500,
                    fontSize: 15,
                    color: "#232323",
                    margin: 0,
                    lineHeight: "24px",
                  }}
                >
                  &ldquo;The curated approach made my home search so efficient. Every property I visited was exactly as described.&rdquo;
                </p>
                <span style={{ fontFamily: pj, fontWeight: 500, fontSize: 12, color: "#94a3b8" }}>— Sarah Mitchell, Architect</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "rgba(198,198,205,0.2)", borderRadius: 16, overflow: "hidden" }}>
              {stats.map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: "#fefeff",
                    padding: "28px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <span style={{ fontFamily: sg, fontWeight: 700, fontSize: 28, color: "#1a1a1a" }}>{s.value}</span>
                  <span style={{ fontFamily: pj, fontWeight: 400, fontSize: 13, color: "rgba(26,26,26,0.55)", lineHeight: "20px" }}>{s.label}</span>
                </div>
              ))}
            </div>

            <div>
              <span
                style={{
                  fontFamily: sg,
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  color: "#94a3b8",
                  display: "block",
                  marginBottom: 20,
                }}
              >
                As Seen In
              </span>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px 32px",
                  opacity: 0.5,
                }}
              >
                {press.map((p) => (
                  <span
                    key={p}
                    style={{
                      fontFamily: pj,
                      fontWeight: 700,
                      fontSize: 16,
                      color: "#232323",
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
