// features/homepage/PropertyAlerts.tsx
// 4-step wizard (budget, type, locality, email) to set up a property
// alert subscription.

"use client";

import { useState } from "react";

import { toast } from "@/lib/toast";

type Step = 0 | 1 | 2 | 3;

const budgetOptions = [
  { label: "Under ₹50L", sub: "Affordable" },
  { label: "₹50L – 1Cr", sub: "Mid range" },
  { label: "₹1Cr – 3Cr", sub: "Premium" },
  { label: "₹3Cr – 5Cr", sub: "Luxury" },
  { label: "₹5Cr+", sub: "Ultra luxury" },
];

const typeOptions = [
  { label: "Apartment", icon: "⬛" },
  { label: "Villa", icon: "🏡" },
  { label: "Penthouse", icon: "🏢" },
  { label: "Plot", icon: "◻️" },
  { label: "Commercial", icon: "🏬" },
];

const localityOptions = ["Indiranagar", "Koramangala", "Whitefield", "HSR Layout", "Hebbal", "Sadashivanagar", "Jayanagar", "Electronic City"];

function ProgressBar({ step }: { step: Step }) {
  const labels = ["Budget", "Type", "Where", "Confirm"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 40 }}>
      {labels.map((label, i) => (
        <div key={label} style={{ display: "flex", alignItems: "center", flex: i < labels.length - 1 ? 1 : "none" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: i <= step ? "#1a1a1a" : "#f8f9fa",
                border: `1.5px solid ${i <= step ? "#1a1a1a" : "rgba(198,198,205,0.5)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              {i < step ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7L6 11L12 4" stroke="#fefeff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12, color: i === step ? "#fefeff" : "rgba(26,26,26,0.35)" }}>{i + 1}</span>
              )}
            </div>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: i <= step ? "#1a1a1a" : "rgba(26,26,26,0.35)", fontWeight: i === step ? 600 : 400 }}>
              {label}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 1.5,
                background: i < step ? "#1a1a1a" : "rgba(198,198,205,0.35)",
                margin: "0 8px",
                marginTop: -18,
                transition: "background 0.3s",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function PropertyAlertsSection() {
  const [step, setStep] = useState<Step>(0);
  const [budget, setBudget] = useState<string | null>(null);
  const [types, setTypes] = useState<string[]>([]);
  const [localities, setLocalities] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const toggleType = (t: string) => setTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  const toggleLocality = (l: string) => setLocalities((p) => (p.includes(l) ? p.filter((x) => x !== l) : [...p, l]));

  const canAdvance =
    (step === 0 && budget !== null) || (step === 1 && types.length > 0) || (step === 2 && localities.length > 0) || (step === 3 && email.includes("@"));

  const summaryTags = [...(budget ? [budget] : []), ...types, ...localities];

  return (
    <section style={{ background: "#f8f9fa", fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="section-inner">
        <div className="grid-2-wide" style={{ alignItems: "start" }}>
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
              Stay Ahead
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
              The best homes don&apos;t wait. Neither should you.
            </h2>
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 400,
                fontSize: 16,
                lineHeight: "26px",
                color: "rgba(26,26,26,0.6)",
                margin: "0 0 48px 0",
              }}
            >
              Premium properties in Bengaluru list and sell within 4–7 days. Set your preferences and receive an alert the moment a matching home goes live.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { stat: "4–7 days", note: "Average time on market for premium listings" },
                { stat: "Instant", note: "WhatsApp + email alert on new matches" },
                { stat: "Zero spam", note: "Only properties that match every filter you set" },
                { stat: "Free", note: "No subscription, no hidden charges, ever" },
              ].map((item, i) => (
                <div
                  key={item.stat}
                  style={{
                    display: "flex",
                    gap: 20,
                    paddingTop: 20,
                    paddingBottom: 20,
                    borderBottom: i < 3 ? "1px solid rgba(198,198,205,0.3)" : "none",
                    alignItems: "baseline",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 18,
                      color: "#1a1a1a",
                      width: 80,
                      flexShrink: 0,
                    }}
                  >
                    {item.stat}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 400,
                      fontSize: 15,
                      color: "rgba(26,26,26,0.6)",
                      lineHeight: "22px",
                    }}
                  >
                    {item.note}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "#fefeff",
              borderRadius: 20,
              padding: "40px",
              boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
              border: "1px solid rgba(198,198,205,0.2)",
            }}
          >
            {done ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "#92f574",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M5 14L11 20L23 8" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: "#1a1a1a", margin: "0 0 8px 0" }}>Alert created</h3>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 15, color: "rgba(26,26,26,0.55)", lineHeight: "24px", margin: "0 0 24px 0" }}>
                  We&apos;ll notify <strong>{email}</strong> the moment a matching property goes live.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 28 }}>
                  {summaryTags.map((t) => (
                    <span
                      key={t}
                      style={{
                        display: "inline-block",
                        background: "#f8f9fa",
                        borderRadius: 8,
                        padding: "5px 12px",
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#1a1a1a",
                        border: "1px solid rgba(198,198,205,0.4)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setDone(false);
                    setStep(0);
                    setBudget(null);
                    setTypes([]);
                    setLocalities([]);
                    setEmail("");
                  }}
                  style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, color: "#575e70", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                >
                  Set another alert
                </button>
              </div>
            ) : (
              <>
                <ProgressBar step={step} />

                <div style={{ minHeight: 280 }}>
                  {step === 0 && (
                    <div>
                      <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#1a1a1a", margin: "0 0 20px 0" }}>
                        What&apos;s your budget?
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {budgetOptions.map((b) => (
                          <button
                            key={b.label}
                            onClick={() => setBudget(b.label)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "14px 20px",
                              borderRadius: 10,
                              background: budget === b.label ? "#090909" : "#f8f9fa",
                              border: `1.5px solid ${budget === b.label ? "#090909" : "rgba(198,198,205,0.3)"}`,
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                          >
                            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: budget === b.label ? "#fefeff" : "#1a1a1a" }}>{b.label}</span>
                            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 12, color: budget === b.label ? "rgba(255,255,255,0.5)" : "rgba(26,26,26,0.4)" }}>
                              {b.sub}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div>
                      <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#1a1a1a", margin: "0 0 20px 0" }}>
                        Property type?{" "}
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 13, color: "rgba(26,26,26,0.45)" }}>(select all that apply)</span>
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {typeOptions.map((t) => {
                          const on = types.includes(t.label);
                          return (
                            <button
                              key={t.label}
                              onClick={() => toggleType(t.label)}
                              style={{
                                padding: "18px 20px",
                                borderRadius: 10,
                                background: on ? "#090909" : "#f8f9fa",
                                border: `1.5px solid ${on ? "#090909" : "rgba(198,198,205,0.3)"}`,
                                cursor: "pointer",
                                transition: "all 0.15s",
                                textAlign: "left",
                              }}
                            >
                              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: on ? "#fefeff" : "#1a1a1a", margin: 0 }}>{t.label}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div>
                      <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#1a1a1a", margin: "0 0 20px 0" }}>Preferred localities?</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {localityOptions.map((l) => {
                          const on = localities.includes(l);
                          return (
                            <button
                              key={l}
                              onClick={() => toggleLocality(l)}
                              style={{
                                padding: "10px 18px",
                                borderRadius: 9999,
                                background: on ? "#090909" : "#f8f9fa",
                                border: `1.5px solid ${on ? "#090909" : "rgba(198,198,205,0.4)"}`,
                                fontFamily: "'Space Grotesk', sans-serif",
                                fontWeight: 600,
                                fontSize: 14,
                                color: on ? "#fefeff" : "#1a1a1a",
                                cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                            >
                              {l}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div>
                      <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#1a1a1a", margin: "0 0 8px 0" }}>Where should we send alerts?</p>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 14, color: "rgba(26,26,26,0.5)", margin: "0 0 24px 0" }}>
                        Your preferences: {summaryTags.slice(0, 4).join(" · ")}
                        {summaryTags.length > 4 ? ` +${summaryTags.length - 4} more` : ""}
                      </p>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                        style={{
                          width: "100%",
                          padding: "15px 18px",
                          borderRadius: 10,
                          background: "#f8f9fa",
                          border: "1.5px solid rgba(198,198,205,0.5)",
                          color: "#1a1a1a",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: 15,
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 12, color: "rgba(26,26,26,0.38)", margin: "10px 0 0 0" }}>
                        We also send alerts via WhatsApp if you opt in. No cold calls, ever.
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
                  {step > 0 && (
                    <button
                      onClick={() => setStep((s) => (s - 1) as Step)}
                      style={{
                        flex: "0 0 auto",
                        padding: "14px 24px",
                        borderRadius: 8,
                        background: "#f8f9fa",
                        border: "1px solid rgba(198,198,205,0.4)",
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 600,
                        fontSize: 14,
                        color: "rgba(26,26,26,0.6)",
                        cursor: "pointer",
                      }}
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (!canAdvance) return;
                      if (step < 3) {
                        setStep((s) => (s + 1) as Step);
                      } else {
                        // TODO: wire to a real property-alert-subscription endpoint once one exists.
                        setDone(true);
                        toast.info("Property alerts aren't available yet — check back soon.");
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "14px",
                      borderRadius: 8,
                      background: canAdvance ? "#090909" : "#dfe0e1",
                      color: canAdvance ? "#fefeff" : "rgba(26,26,26,0.35)",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      border: "none",
                      cursor: canAdvance ? "pointer" : "not-allowed",
                      transition: "all 0.18s",
                    }}
                  >
                    {step < 3 ? "Continue" : "Create Alert"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
