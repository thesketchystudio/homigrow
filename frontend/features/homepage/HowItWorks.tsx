// features/homepage/HowItWorks.tsx
// Interactive Buy/Rent/Sell process explainer with an auto-advancing
// vertical stepper and a detail panel for the active step.

"use client";

import { useEffect, useState } from "react";

const modes = ["Buy", "Rent", "Sell"] as const;
type Mode = (typeof modes)[number];

const steps: Record<Mode, { number: string; title: string; summary: string; detail: string; tag: string }[]> = {
  Buy: [
    {
      number: "01",
      title: "Search & Shortlist",
      summary: "Curated filters built for discerning buyers.",
      detail:
        "Set your parameters — location, BHK, built-up area, possession timeline, and lifestyle preferences. Our AI cross-references 2,400+ verified listings to surface only what genuinely fits. No noise.",
      tag: "AI-powered matching",
    },
    {
      number: "02",
      title: "Guided Site Visits",
      summary: "Every visit is advisor-led and pre-briefed.",
      detail:
        "Your assigned advisor prepares a dossier before the visit: floor plan, society rules, price history, and comparable sales. Virtual 3D walkthroughs available for outstation buyers.",
      tag: "Expert-accompanied",
    },
    {
      number: "03",
      title: "Legal & Due Diligence",
      summary: "40-point verification before you sign anything.",
      detail:
        "Our in-house legal team reviews title deeds, encumbrance certificates, RERA status, building approvals, and loan eligibility. You receive a due diligence report within 48 hours.",
      tag: "In-house legal team",
    },
    {
      number: "04",
      title: "Close & Register",
      summary: "Paperwork handled. Keys handed over.",
      detail:
        "From sale agreement to stamp duty payment and sub-registrar appointment — we coordinate every step. Post-registration, we assist with utility transfers and society onboarding.",
      tag: "End-to-end support",
    },
  ],
  Rent: [
    {
      number: "01",
      title: "Discover Verified Rentals",
      summary: "Only owner-confirmed, move-in-ready homes.",
      detail:
        "Every rental listing is physically visited and owner-verified by our team before it appears on our platform. No ghost listings, no brokers doubling up. What you see is exactly what you get.",
      tag: "Zero ghost listings",
    },
    {
      number: "02",
      title: "Schedule & Inspect",
      summary: "Walkthrough with a condition checklist.",
      detail:
        "Our advisor walks you through the property with a 25-point condition checklist — noting fixtures, appliances, water pressure, and society amenities. You leave with a full written report.",
      tag: "Condition certified",
    },
    {
      number: "03",
      title: "Negotiate & Draft",
      summary: "Fair negotiation. Watertight agreements.",
      detail:
        "We facilitate transparent rent negotiations between you and the owner. Our legal team drafts a rental agreement that protects your deposit, notice period, and maintenance obligations.",
      tag: "Legally sound",
    },
    {
      number: "04",
      title: "Move In",
      summary: "Smooth handover. 30-day post-move support.",
      detail:
        "Inventory is documented, keys are handed over, and your advisor stays available for 30 days post move-in to resolve any disputes or maintenance issues with the owner.",
      tag: "30-day support",
    },
  ],
  Sell: [
    {
      number: "01",
      title: "Free Valuation",
      summary: "Market-accurate pricing within 24 hours.",
      detail:
        "Our pricing engine analyses 3 years of transaction data for your micro-market, adjusted for floor, view, renovation, and current demand signals. You receive a detailed pricing report — not a range.",
      tag: "Data-driven valuation",
    },
    {
      number: "02",
      title: "Premium Listing",
      summary: "Professional photography + 3D walkthrough.",
      detail:
        "We send a professional photographer and a drone operator to your property. The listing goes live with a Matterport 3D walkthrough, floor plan overlay, and featured placement across 6 platforms.",
      tag: "Multi-platform reach",
    },
    {
      number: "03",
      title: "Qualify Buyers",
      summary: "Only serious, financially vetted prospects.",
      detail:
        "We pre-screen every interested buyer for financial readiness before scheduling a visit. You only meet buyers with genuine intent — no tire-kickers, no time wasted.",
      tag: "Pre-screened buyers",
    },
    {
      number: "04",
      title: "Close & Collect",
      summary: "Token to registration, fully managed.",
      detail:
        "From negotiation and token agreement to stamp duty coordination and sub-registrar appointment — our team handles everything. Funds are transferred to your account within 48 hours of registration.",
      tag: "Zero-hassle close",
    },
  ],
};

export function HowItWorksSection() {
  const [mode, setMode] = useState<Mode>("Buy");
  const [active, setActive] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((p) => (p + 1) % steps[mode].length);
    }, 3800);
    return () => clearInterval(timer);
  }, [mode]);

  const handleModeChange = (m: Mode) => {
    setTransitioning(true);
    setTimeout(() => {
      setMode(m);
      setActive(0);
      setTransitioning(false);
    }, 180);
  };

  const current = steps[mode][active];

  return (
    <section style={{ background: "#fefeff", fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="section-inner">
        <div className="section-header" style={{ marginBottom: "clamp(32px, 5vw, 64px)" }}>
          <div>
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                color: "#575e70",
                marginBottom: 10,
              }}
            >
              Simple Process
            </p>
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 500,
                fontSize: 36,
                lineHeight: "44px",
                color: "#232323",
                margin: 0,
              }}
            >
              How It Works
            </h2>
          </div>

          <div
            style={{
              display: "flex",
              background: "#f8f9fa",
              borderRadius: 12,
              padding: 5,
              gap: 2,
              border: "1px solid rgba(198,198,205,0.3)",
            }}
          >
            {modes.map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                style={{
                  padding: "10px 28px",
                  borderRadius: 8,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: mode === m ? 700 : 500,
                  fontSize: 15,
                  background: mode === m ? "#090909" : "transparent",
                  color: mode === m ? "#fefeff" : "rgba(26,26,26,0.55)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="grid-stepper">
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {steps[mode].map((step, i) => {
              const isActive = active === i;
              return (
                <button
                  key={step.number + mode}
                  onClick={() => setActive(i)}
                  style={{
                    display: "flex",
                    gap: 24,
                    alignItems: "flex-start",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0 0 0 0",
                    textAlign: "left",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 48, flexShrink: 0 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isActive ? "#090909" : "#f8f9fa",
                        border: `1.5px solid ${isActive ? "#090909" : "rgba(198,198,205,0.5)"}`,
                        transition: "all 0.22s ease",
                        flexShrink: 0,
                        zIndex: 1,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 700,
                          fontSize: 14,
                          color: isActive ? "#fefeff" : "rgba(26,26,26,0.45)",
                        }}
                      >
                        {step.number}
                      </span>
                    </div>
                    {i < steps[mode].length - 1 && (
                      <div
                        style={{
                          width: 1.5,
                          flex: 1,
                          minHeight: 40,
                          background: isActive
                            ? "linear-gradient(to bottom, #090909, rgba(198,198,205,0.3))"
                            : "rgba(198,198,205,0.35)",
                          marginTop: 0,
                          marginBottom: 0,
                        }}
                      />
                    )}
                  </div>

                  <div style={{ paddingTop: 10, paddingBottom: i < steps[mode].length - 1 ? 32 : 0 }}>
                    <p
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: isActive ? 700 : 500,
                        fontSize: 18,
                        color: isActive ? "#1a1a1a" : "rgba(26,26,26,0.5)",
                        margin: "0 0 4px 0",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {step.title}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 400,
                        fontSize: 14,
                        color: isActive ? "rgba(26,26,26,0.65)" : "rgba(26,26,26,0.35)",
                        margin: 0,
                        transition: "all 0.2s ease",
                      }}
                    >
                      {step.summary}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div
            style={{
              background: "#f8f9fa",
              borderRadius: 20,
              padding: 48,
              minHeight: 360,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              opacity: transitioning ? 0 : 1,
              transform: transitioning ? "translateY(6px)" : "translateY(0)",
              transition: "opacity 0.18s ease, transform 0.18s ease",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "#92f574",
                  borderRadius: 6,
                  padding: "4px 12px",
                  marginBottom: 28,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 12,
                    color: "#1a1a1a",
                  }}
                >
                  {current.tag}
                </span>
              </div>

              <div style={{ position: "relative" }}>
                <p
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: 96,
                    lineHeight: 1,
                    color: "rgba(198,198,205,0.25)",
                    margin: "0 0 -32px 0",
                    userSelect: "none",
                  }}
                >
                  {current.number}
                </p>
                <h3
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: 26,
                    lineHeight: "34px",
                    color: "#1a1a1a",
                    margin: "0 0 16px 0",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {current.title}
                </h3>
              </div>

              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: 16,
                  lineHeight: "26px",
                  color: "rgba(26,26,26,0.68)",
                  margin: 0,
                }}
              >
                {current.detail}
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 40 }}>
              {steps[mode].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  style={{
                    width: active === i ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    background: active === i ? "#090909" : "rgba(198,198,205,0.5)",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "all 0.22s ease",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
