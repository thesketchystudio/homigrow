// features/homepage/EmiCalculator.tsx
// Interactive home loan EMI calculator: loan amount/rate/tenure sliders,
// a principal-vs-interest donut chart, and a year-wise amortization table.

"use client";

import { useMemo, useState } from "react";

function crore(v: number) {
  return v >= 10000000
    ? `₹${(v / 10000000).toFixed(2)} Cr`
    : v >= 100000
      ? `₹${(v / 100000).toFixed(1)} L`
      : `₹${v.toLocaleString("en-IN")}`;
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (n: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 400,
            fontSize: 13,
            color: "rgba(254,254,255,0.55)",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "#fefeff",
          }}
        >
          {display}
        </span>
      </div>
      <div style={{ position: "relative", height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            borderRadius: 2,
            background: "#92f574",
            width: `${pct}%`,
            pointerEvents: "none",
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            opacity: 0,
            cursor: "pointer",
            height: "100%",
            margin: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${pct}%`,
            transform: "translate(-50%, -50%)",
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#fefeff",
            border: "2px solid #92f574",
            pointerEvents: "none",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
        }}
      >
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
          {typeof min === "number" && min >= 100000 ? crore(min) : min}
        </span>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
          {typeof max === "number" && max >= 100000 ? crore(max) : max}
        </span>
      </div>
    </div>
  );
}

function Donut({ principal, totalInterest }: { principal: number; totalInterest: number }) {
  const total = principal + totalInterest;
  const pPct = principal / total;
  const r = 70;
  const cx = 90;
  const cy = 90;
  const circ = 2 * Math.PI * r;
  const pDash = pPct * circ;
  const iDash = (1 - pPct) * circ;

  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="22" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#92f574"
        strokeWidth="22"
        strokeDasharray={`${pDash} ${iDash}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.4s ease" }}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="22"
        strokeDasharray={`${iDash} ${pDash}`}
        strokeDashoffset={circ / 4 - pDash}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.4s ease" }}
      />
    </svg>
  );
}

export function EmiCalculatorSection() {
  const [principal, setPrincipal] = useState(5000000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);
  const [view, setView] = useState<"summary" | "schedule">("summary");

  const calc = useMemo(() => {
    const r = rate / 12 / 100;
    const n = tenure * 12;
    const emi = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = emi * n;
    const interest = total - principal;
    const schedule: { year: number; principal: number; interest: number; balance: number }[] = [];
    let balance = principal;
    for (let y = 1; y <= Math.min(tenure, 5); y++) {
      let yPrincipal = 0;
      let yInterest = 0;
      for (let m = 0; m < 12; m++) {
        const iP = balance * r;
        const pP = emi - iP;
        yInterest += iP;
        yPrincipal += pP;
        balance -= pP;
      }
      schedule.push({ year: y, principal: yPrincipal, interest: yInterest, balance: Math.max(0, balance) });
    }
    return { emi: Math.round(emi), total: Math.round(total), interest: Math.round(interest), schedule };
  }, [principal, rate, tenure]);

  const principalPct = Math.round((principal / calc.total) * 100);

  return (
    <section style={{ background: "#1a1a1a", fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="section-inner">
        <div className="section-header" style={{ marginBottom: "clamp(32px, 5vw, 56px)" }}>
          <div>
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                color: "rgba(254,254,255,0.4)",
                marginBottom: 10,
              }}
            >
              Financial Planning
            </p>
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 500,
                fontSize: 36,
                lineHeight: "44px",
                color: "#fefeff",
                margin: 0,
              }}
            >
              EMI Calculator
            </h2>
          </div>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 400,
              fontSize: 15,
              lineHeight: "24px",
              color: "rgba(254,254,255,0.45)",
              maxWidth: 400,
              textAlign: "right",
              margin: 0,
            }}
          >
            Plan your home purchase with clarity before you commit.
          </p>
        </div>

        <div className="grid-2" style={{ gap: "clamp(24px, 4vw, 48px)" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 20,
              padding: "clamp(20px, 4vw, 40px)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              flexDirection: "column",
              gap: 36,
            }}
          >
            <SliderField
              label="Loan Amount"
              value={principal}
              min={500000}
              max={50000000}
              step={100000}
              display={crore(principal)}
              onChange={setPrincipal}
            />
            <SliderField
              label="Interest Rate (% p.a.)"
              value={rate}
              min={6}
              max={15}
              step={0.1}
              display={`${rate.toFixed(1)}%`}
              onChange={setRate}
            />
            <SliderField
              label="Loan Tenure"
              value={tenure}
              min={1}
              max={30}
              step={1}
              display={`${tenure} yr${tenure > 1 ? "s" : ""}`}
              onChange={setTenure}
            />

            <div
              style={{
                background: "rgba(146,245,116,0.08)",
                borderRadius: 12,
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid rgba(146,245,116,0.2)",
                marginTop: 4,
              }}
            >
              <div>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: "#92f574", margin: "0 0 2px 0" }}>
                  Compare home loan rates
                </p>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                  12+ lenders · instant eligibility check
                </p>
              </div>
              <button
                style={{
                  background: "#92f574",
                  color: "#1a1a1a",
                  borderRadius: 8,
                  padding: "9px 18px",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Check Now
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 20,
                padding: "clamp(20px, 3vw, 32px) clamp(20px, 4vw, 40px)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "clamp(16px, 3vw, 40px)",
              }}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Donut principal={principal} totalInterest={calc.interest} />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 400,
                      fontSize: 10,
                      color: "rgba(255,255,255,0.4)",
                      textTransform: "uppercase",
                      letterSpacing: "0.8px",
                    }}
                  >
                    Monthly
                  </span>
                  <span
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 20,
                      color: "#fefeff",
                      lineHeight: 1.2,
                      marginTop: 2,
                    }}
                  >
                    {crore(calc.emi)}
                  </span>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#92f574", flexShrink: 0 }} />
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                      Principal ({principalPct}%)
                    </span>
                  </div>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#fefeff", margin: 0, paddingLeft: 16 }}>
                    {crore(principal)}
                  </p>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                      Interest ({100 - principalPct}%)
                    </span>
                  </div>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#fefeff", margin: 0, paddingLeft: 16 }}>
                    {crore(calc.interest)}
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.05)",
                borderRadius: 10,
                padding: 4,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {(["summary", "schedule"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    borderRadius: 7,
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    fontSize: 13,
                    background: view === v ? "#fefeff" : "transparent",
                    color: view === v ? "#1a1a1a" : "rgba(255,255,255,0.45)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    textTransform: "capitalize",
                  }}
                >
                  {v === "summary" ? "Summary" : "Year-wise Schedule"}
                </button>
              ))}
            </div>

            {view === "summary" ? (
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 16,
                  padding: "28px 32px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                {[
                  { label: "Loan Amount", value: crore(principal) },
                  { label: "Total Interest", value: crore(calc.interest) },
                  { label: "Total Payable", value: crore(calc.total), accent: true },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: row.accent ? 0 : 18,
                      borderBottom: row.accent ? "none" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
                      {row.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 700,
                        fontSize: row.accent ? 22 : 16,
                        color: row.accent ? "#92f574" : "#fefeff",
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 16,
                  overflowX: "auto",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 340 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      {["Year", "Principal", "Interest", "Balance"].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "14px 16px",
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontWeight: 600,
                            fontSize: 11,
                            color: "rgba(255,255,255,0.35)",
                            textTransform: "uppercase",
                            letterSpacing: "0.8px",
                            textAlign: h === "Year" ? "left" : "right",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calc.schedule.map((row) => (
                      <tr key={row.year} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "12px 16px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: "#fefeff" }}>
                          Yr {row.year}
                        </td>
                        {[crore(row.principal), crore(row.interest), crore(row.balance)].map((v, i) => (
                          <td
                            key={i}
                            style={{
                              padding: "12px 16px",
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              fontWeight: 400,
                              fontSize: 13,
                              color: i === 2 ? "rgba(255,255,255,0.5)" : "#fefeff",
                              textAlign: "right",
                            }}
                          >
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          padding: "10px 16px",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: 12,
                          color: "rgba(255,255,255,0.3)",
                          textAlign: "center",
                        }}
                      >
                        Showing first {calc.schedule.length} of {tenure} years
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
