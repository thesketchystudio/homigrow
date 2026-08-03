// components/shared/Footer.tsx
// Site footer used across all Client View screens: brand + newsletter
// signup, nav link columns, and the bottom legal bar.

"use client";

import { useState } from "react";

import svgPaths from "@/lib/homepage-svg-paths";

const sg = "'Space Grotesk', sans-serif";
const pj = "'Plus Jakarta Sans', sans-serif";

const navColumns = [
  {
    heading: "Property Categories",
    links: ["Buy", "Rent", "Commercial", "Penthouses", "Villas"],
  },
  {
    heading: "Concierge Services",
    links: ["Home Loans", "Legal", "Interior Design", "Vastu"],
  },
  {
    heading: "Platform",
    links: ["About", "Careers", "Press", "Sustainability"],
  },
  {
    heading: "Support",
    links: ["Help Center", "Contact", "Terms", "Privacy"],
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer style={{ background: "#232323" }}>
      <div style={{ borderBottom: "1px solid rgba(198,198,205,0.1)" }}>
        <div className="footer-newsletter" style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
            <svg width="45" height="40" viewBox="0 0 45.4044 40.0834" fill="none">
              <path d={svgPaths.p2b92b400} fill="#fefeff" />
              <path d={svgPaths.p29b4f280} fill="#fefeff" />
            </svg>
            <p
              style={{
                fontFamily: sg,
                fontWeight: 500,
                fontSize: 15,
                lineHeight: "24px",
                color: "#888",
                margin: 0,
                maxWidth: 340,
              }}
            >
              India&apos;s curated marketplace for verified premium real estate. Search, compare, and connect with brokers directly.
            </p>
            <div style={{ display: "flex", gap: 16 }}>
              {["Instagram", "LinkedIn", "Twitter"].map((s) => (
                <a
                  key={s}
                  href="#"
                  style={{
                    fontFamily: pj,
                    fontWeight: 400,
                    fontSize: 13,
                    color: "#888",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#fefeff")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#888")}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          <div style={{ width: 508, flexShrink: 0, display: "flex", flexDirection: "column", gap: 32 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <span
                style={{
                  fontFamily: sg,
                  fontWeight: 500,
                  fontSize: 12,
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  color: "#888",
                }}
              >
                Join the Circle
              </span>
              {subscribed ? (
                <p style={{ fontFamily: pj, fontWeight: 400, fontSize: 14, color: "#92f574", margin: 0 }}>
                  ✓ You&apos;re on the list. Expect curated drops, not newsletters.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    border: "1px solid rgba(198,198,205,0.3)",
                    borderBottom: "2px solid rgba(198,198,205,0.3)",
                  }}
                >
                  <div style={{ flex: 1, padding: "13px 5px" }}>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: "100%",
                        background: "none",
                        border: "none",
                        outline: "none",
                        fontFamily: pj,
                        fontWeight: 400,
                        fontSize: 14,
                        color: "rgba(136,136,136,0.5)",
                      }}
                    />
                  </div>
                  <button
                    onClick={() => email && setSubscribed(true)}
                    style={{
                      background: "#fefeff",
                      border: "none",
                      padding: "13.5px 32px",
                      cursor: email ? "pointer" : "not-allowed",
                      fontFamily: sg,
                      fontWeight: 700,
                      fontSize: 15,
                      color: "#090909",
                      flexShrink: 0,
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => email && (e.currentTarget.style.background = "#f0f0f0")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#fefeff")}
                  >
                    SUBSCRIBE
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="footer-nav">
        {navColumns.map((col) => (
          <div key={col.heading} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <span
              style={{
                fontFamily: sg,
                fontWeight: 700,
                fontSize: 15,
                color: "#fefeff",
                lineHeight: "24px",
              }}
            >
              {col.heading}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {col.links.map((link) => (
                <a
                  key={link}
                  href="#"
                  style={{
                    fontFamily: pj,
                    fontWeight: 400,
                    fontSize: 14,
                    color: "#888",
                    textDecoration: "none",
                    lineHeight: "22px",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#fefeff")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#888")}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <span
          style={{
            fontFamily: sg,
            fontWeight: 500,
            fontSize: 10,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: "#888",
          }}
        >
          © 2026 Homigrow. All rights reserved.
        </span>
        <div style={{ display: "flex", gap: 32 }}>
          {["Global Presence", "Sitemap", "Cookies"].map((link) => (
            <a
              key={link}
              href="#"
              style={{
                fontFamily: sg,
                fontWeight: 500,
                fontSize: 10,
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "#888",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#fefeff")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#888")}
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
