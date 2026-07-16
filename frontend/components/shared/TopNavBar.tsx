// components/shared/TopNavBar.tsx
// Fixed top navigation bar used across all Client View screens. Becomes
// opaque with a blurred background once the page scrolls past 40px.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ensureAuthResolved } from "@/lib/auth/session";
import svgPaths from "@/lib/homepage-svg-paths";
import { useAuthStore } from "@/lib/stores/auth";

const sg = "'Space Grotesk', sans-serif";

export default function TopNavBar() {
  const router = useRouter();
  const { status, user } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    ensureAuthResolved();
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled ? "rgba(254,254,255,0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        boxShadow: scrolled ? "0 1px 0 rgba(198,198,205,0.3)" : "none",
        transition: "background 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "0 clamp(20px, 5vw, 150px)",
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "clamp(16px, 3vw, 40px)",
        }}
      >
        <a href="#" style={{ display: "flex", alignItems: "center", flexShrink: 0, textDecoration: "none" }}>
          <svg width="45" height="40" viewBox="0 0 45.4044 40.0834" fill="none" style={{ width: "clamp(35px, 8vw, 45px)", height: "auto" }}>
            <path d={svgPaths.p2b92b400} fill={scrolled ? "#090909" : "#fefeff"} />
            <path d={svgPaths.p29b4f280} fill={scrolled ? "#090909" : "#fefeff"} />
          </svg>
        </a>

        <div style={{ display: "flex", gap: 32, alignItems: "center" }} className="desktop-only">
          {["Discover", "AI Tools", "Compare", "Saved"].map((link) => (
            <a
              key={link}
              href="#"
              style={{
                fontFamily: sg,
                fontWeight: 500,
                fontSize: 15,
                color: scrolled ? "#64748b" : "rgba(254,254,255,0.85)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
            >
              {link}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", gap: "clamp(8px, 2vw, 16px)", alignItems: "center", flexShrink: 0 }}>
          <button
            style={{
              background: scrolled ? "#575e70" : "rgba(87,94,112,0.9)",
              color: "#f8f9fa",
              borderRadius: 13,
              padding: "10px clamp(14px, 3vw, 22px)",
              fontFamily: sg,
              fontWeight: 400,
              fontSize: "clamp(13px, 2vw, 15px)",
              border: "none",
              cursor: "pointer",
              transition: "background 0.2s",
              whiteSpace: "nowrap",
            }}
            className="desktop-only"
          >
            List Property
          </button>
          <button
            onClick={() => router.push(status === "authenticated" ? "/profile/account" : "/welcome")}
            style={{
              background: "none",
              border: "none",
              fontFamily: sg,
              fontWeight: 700,
              fontSize: "clamp(13px, 2vw, 15px)",
              color: scrolled ? "#575e70" : "rgba(254,254,255,0.85)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {status === "authenticated" ? (user?.full_name?.split(" ")[0] ?? "My Account") : "Sign In"}
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: "none",
              border: "none",
              padding: 8,
              cursor: "pointer",
              display: "none",
            }}
            className="mobile-only"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 12h18M3 6h18M3 18h18" stroke={scrolled ? "#090909" : "#fefeff"} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          style={{
            background: "#ffffff",
            borderTop: "1px solid #e0e0e0",
            padding: "20px clamp(20px, 5vw, 150px)",
          }}
          className="mobile-only"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {["Discover", "AI Tools", "Compare", "Saved"].map((link) => (
              <a
                key={link}
                href="#"
                style={{
                  fontFamily: sg,
                  fontWeight: 500,
                  fontSize: 15,
                  color: "#64748b",
                  textDecoration: "none",
                  padding: "8px 0",
                }}
              >
                {link}
              </a>
            ))}
            <button
              style={{
                background: "#575e70",
                color: "#f8f9fa",
                borderRadius: 13,
                padding: "12px 22px",
                fontFamily: sg,
                fontWeight: 400,
                fontSize: 15,
                border: "none",
                cursor: "pointer",
                marginTop: 8,
              }}
            >
              List Property
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
          .mobile-only {
            display: block !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-only {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}
