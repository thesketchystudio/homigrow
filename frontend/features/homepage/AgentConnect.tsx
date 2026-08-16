// features/homepage/AgentConnect.tsx
// Advisor selector + "request a call" connect form.

"use client";

import { useState } from "react";

import { toast } from "@/lib/toast";

const specialties = [
  { label: "Luxury Homes", count: "₹2Cr+" },
  { label: "New Launches", count: "RERA verified" },
  { label: "Commercial", count: "Office · Retail" },
  { label: "Investment", count: "Yield analysis" },
  { label: "Rental", count: "Premium only" },
];

const advisors = [
  {
    initials: "RM",
    name: "Rajan Mehta",
    specialty: "Luxury Residential",
    markets: ["Indiranagar", "Koramangala", "Sadashivanagar"],
    deals: 143,
    rating: "4.97",
    years: 11,
    tone: "Known for his encyclopaedic knowledge of Indiranagar's by-lanes and a no-pressure style that buyers trust.",
  },
  {
    initials: "PN",
    name: "Priya Nair",
    specialty: "Commercial & Investment",
    markets: ["MG Road", "Whitefield", "ITPL"],
    deals: 98,
    rating: "4.92",
    years: 8,
    tone: "Preferred by CXOs and NRI investors for her data-backed approach to yield and capital appreciation.",
  },
  {
    initials: "AS",
    name: "Arjun Sethi",
    specialty: "New Launches & RERA",
    markets: ["Hebbal", "Yelahanka", "Devanahalli"],
    deals: 211,
    rating: "4.95",
    years: 14,
    tone: "Arjun tracks every new launch in North Bengaluru six months before possession. First mover advantage, always.",
  },
];

export function AgentConnectSection() {
  const [selected, setSelected] = useState(0);
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);

  const advisor = advisors[selected];

  return (
    <section style={{ background: "#fefeff", fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="section-inner">
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "clamp(24px, 4vw, 48px)",
            marginBottom: "clamp(40px, 6vw, 64px)",
          }}
        >
          <div style={{ maxWidth: 580 }}>
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
              Expert Guidance
            </p>
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 500,
                fontSize: 36,
                lineHeight: "44px",
                color: "#232323",
                margin: "0 0 16px 0",
              }}
            >
              The right advisor changes everything.
            </h2>
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 400,
                fontSize: 16,
                lineHeight: "26px",
                color: "rgba(26,26,26,0.6)",
                margin: 0,
              }}
            >
              Not an algorithm. Not a call centre. A certified advisor who knows your target micro-market in depth and has your interests — not a commission — as the priority.
            </p>
          </div>

          <div style={{ display: "flex", gap: 40, flexShrink: 0 }}>
            {[
              { value: "180+", label: "Certified Advisors" },
              { value: "₹2,400 Cr", label: "Deals Closed" },
              { value: "98%", label: "Client Satisfaction" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "right" }}>
                <p
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: 28,
                    color: "#1a1a1a",
                    margin: "0 0 2px 0",
                  }}
                >
                  {s.value}
                </p>
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 400,
                    fontSize: 13,
                    color: "rgba(26,26,26,0.5)",
                    margin: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 56 }}>
          {specialties.map((s) => (
            <div
              key={s.label}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#f8f9fa",
                borderRadius: 9999,
                padding: "8px 16px",
                border: "1px solid rgba(198,198,205,0.35)",
              }}
            >
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{s.label}</span>
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: 12,
                  color: "rgba(26,26,26,0.45)",
                }}
              >
                {s.count}
              </span>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ gap: "clamp(24px, 4vw, 32px)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {advisors.map((a, i) => {
              const active = selected === i;
              return (
                <button
                  key={a.name}
                  onClick={() => setSelected(i)}
                  style={{
                    background: active ? "#090909" : "#f8f9fa",
                    border: `1.5px solid ${active ? "#090909" : "rgba(198,198,205,0.3)"}`,
                    borderRadius: 16,
                    padding: "24px 28px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    gap: 20,
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 12,
                      background: active ? "rgba(255,255,255,0.12)" : "#232323",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 700,
                        fontSize: 16,
                        color: "#fefeff",
                      }}
                    >
                      {a.initials}
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 700,
                          fontSize: 16,
                          color: active ? "#fefeff" : "#1a1a1a",
                        }}
                      >
                        {a.name}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 600,
                          fontSize: 12,
                          color: active ? "#92f574" : "#1a1a1a",
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        ★ {a.rating}
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 400,
                        fontSize: 13,
                        color: active ? "rgba(255,255,255,0.6)" : "rgba(26,26,26,0.55)",
                        margin: "0 0 6px 0",
                      }}
                    >
                      {a.specialty} · {a.deals} deals · {a.years} yrs
                    </p>
                    {active && (
                      <p
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontWeight: 400,
                          fontSize: 13,
                          color: "rgba(255,255,255,0.5)",
                          lineHeight: "20px",
                          margin: 0,
                        }}
                      >
                        {a.tone}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                background: "#f8f9fa",
                borderRadius: 16,
                padding: "28px 32px",
                border: "1px solid rgba(198,198,205,0.25)",
              }}
            >
              <p
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: "#575e70",
                  margin: "0 0 16px 0",
                }}
              >
                Active Markets
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {advisor.markets.map((m) => (
                  <span
                    key={m}
                    style={{
                      display: "inline-block",
                      background: "#fefeff",
                      border: "1px solid rgba(198,198,205,0.4)",
                      borderRadius: 8,
                      padding: "6px 14px",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 600,
                      fontSize: 13,
                      color: "#1a1a1a",
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div
              style={{
                background: "#090909",
                borderRadius: 16,
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                flex: 1,
              }}
            >
              {sent ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", padding: "24px 0" }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "#92f574",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 20,
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M4 12L9 17L20 7" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#fefeff", margin: "0 0 8px 0" }}>
                    {advisor.name} will call you shortly.
                  </p>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0 }}>
                    Typically responds within 15 minutes during business hours.
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    style={{
                      marginTop: 20,
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 600,
                      fontSize: 13,
                      color: "rgba(255,255,255,0.4)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Change advisor
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <p
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 700,
                        fontSize: 20,
                        color: "#fefeff",
                        margin: "0 0 6px 0",
                      }}
                    >
                      Connect with {advisor.name}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 400,
                        fontSize: 14,
                        color: "rgba(255,255,255,0.45)",
                        margin: 0,
                      }}
                    >
                      Free consultation. No obligations.
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <input
                      type="text"
                      placeholder="Your name"
                      style={{
                        padding: "13px 16px",
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#fefeff",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 14,
                        outline: "none",
                      }}
                    />
                    <input
                      type="tel"
                      placeholder="Mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{
                        padding: "13px 16px",
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#fefeff",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 14,
                        outline: "none",
                      }}
                    />
                    <select
                      style={{
                        padding: "13px 16px",
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: phone ? "#fefeff" : "rgba(255,255,255,0.35)",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 14,
                        outline: "none",
                        cursor: "pointer",
                        appearance: "none",
                      }}
                    >
                      <option value="">I&apos;m looking to…</option>
                      <option>Buy a property</option>
                      <option>Rent a property</option>
                      <option>Sell my property</option>
                      <option>Invest in real estate</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      if (!phone) return;
                      // TODO: wire to a real advisor-call-request endpoint once one exists.
                      setSent(true);
                      toast.info("Call requests aren't available yet — check back soon.");
                    }}
                    style={{
                      padding: "15px",
                      borderRadius: 8,
                      background: phone ? "#92f574" : "rgba(255,255,255,0.08)",
                      color: phone ? "#1a1a1a" : "rgba(255,255,255,0.25)",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      border: "none",
                      cursor: phone ? "pointer" : "not-allowed",
                      transition: "all 0.2s ease",
                    }}
                  >
                    Request a Call
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
