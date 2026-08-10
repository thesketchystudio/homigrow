// components/shared/TopNavBar.tsx
// Fixed top navigation bar used across all Client View screens. Becomes
// opaque with a blurred background once the page scrolls past 40px — but
// that transparent-until-scroll start state only makes sense over the
// homepage's dark hero image. Every other (client) page has a light
// background from the very top, so the nav renders opaque immediately
// there instead of starting nearly invisible.
//
// Matches the canonical Figma "TopNavBar" component (Components page,
// Section 3, node 470:1297 — 4 variants: logged-out/logged-in x
// without/with search). The search box is a visual-only placeholder for
// now — no Discover/search feature exists yet to wire it to. The logged-in
// state shows a bell + initials avatar instead of the user's name, per
// that component; it has no "List Property" button in any variant, so
// that's been dropped here too (it wasn't part of the reusable nav design).

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search } from "lucide-react";

import { ensureAuthResolved } from "@/lib/auth/session";
import svgPaths from "@/lib/homepage-svg-paths";
import { useAuthStore } from "@/lib/stores/auth";
import { useSearchHistoryStore } from "@/lib/stores/searchHistory";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SearchOverlay } from "@/features/search/SearchOverlay";

const sg = "'Space Grotesk', sans-serif";

// "Saved" (P3-T41), "Compare" (P3-T42), and "Discover" (the Listings/search
// page) have real destinations — AI Tools stays a dead "#" link until that
// feature exists.
const NAV_LINK_HREFS: Record<string, string> = { Discover: "/properties", Saved: "/saved", Compare: "/compare" };

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function TopNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useAuthStore();
  const { record } = useSearchHistoryStore();
  const [scrolledPast, setScrolledPast] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // TopNavBar is mounted once in the (client) layout and persists across
  // route changes — searchOpen must reset on every navigation, not just the
  // ones initiated from inside SearchOverlay itself (nav links, browser
  // back/forward, etc. would otherwise leave the overlay floating over
  // whatever page is landed on next). Adjusting state during render (React's
  // documented escape hatch for "reset state when a prop changes") rather
  // than an effect, since a plain useEffect here trips
  // react-hooks/set-state-in-effect.
  const [pathnameForSearchReset, setPathnameForSearchReset] = useState(pathname);
  if (pathname !== pathnameForSearchReset) {
    setPathnameForSearchReset(pathname);
    setSearchOpen(false);
  }

  const runSearch = () => {
    const query = searchValue.trim();
    if (!query) return;
    // `search` (free-text, matches title/description/city/locality/
    // landmark/amenities) rather than `city` (exact match) — a typed
    // "Whitefield" is a locality and "pool" is an amenity, neither of
    // which an exact city match would ever catch.
    const href = `/properties?search=${encodeURIComponent(query)}`;
    record({ label: query, subtitle: "Search", href });
    setSearchOpen(false);
    router.push(href);
  };

  const isHeroPage = pathname === "/";
  const scrolled = !isHeroPage || scrolledPast;

  useEffect(() => {
    if (!isHeroPage) return;
    const onScroll = () => setScrolledPast(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHeroPage]);

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
            <Link
              key={link}
              href={NAV_LINK_HREFS[link] ?? "#"}
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
            </Link>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#f8f9fa",
            border: "1px solid rgba(171,179,183,0.15)",
            borderRadius: 8,
            padding: "9px 14px",
            width: "clamp(180px, 20vw, 260px)",
          }}
          className="desktop-only"
        >
          <Search size={16} color="#707070" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search properties, locations..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onFocus={() => setSearchOpen(true)}
            // Escape (below) closes the overlay without blurring the input,
            // so a plain re-focus never fires on the next click — onClick
            // reopens it explicitly regardless of prior focus state.
            onClick={() => setSearchOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter") runSearch();
              if (event.key === "Escape") setSearchOpen(false);
            }}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: sg,
              fontSize: 14,
              color: "#232323",
              width: "100%",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "clamp(8px, 2vw, 16px)", alignItems: "center", flexShrink: 0 }}>
          {status === "authenticated" ? (
            <button
              onClick={() => router.push("/profile/account")}
              style={{ display: "flex", alignItems: "center", gap: 16, background: "none", border: "none", cursor: "pointer" }}
            >
              <Bell size={24} color={scrolled ? "#090909" : "#fefeff"} />
              <Avatar className="size-8">
                <AvatarFallback className="bg-[#dfe0e1] text-[11px] font-bold text-[#575e70]">
                  {initials(user?.full_name)}
                </AvatarFallback>
              </Avatar>
            </button>
          ) : (
            <button
              onClick={() => router.push("/welcome")}
              style={{
                background: "none",
                border: "none",
                fontFamily: sg,
                fontWeight: 700,
                fontSize: "clamp(13px, 2vw, 20px)",
                color: scrolled ? "#232323" : "rgba(254,254,255,0.85)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Sign In
            </button>
          )}

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
              <Link
                key={link}
                href={NAV_LINK_HREFS[link] ?? "#"}
                onClick={() => setMobileOpen(false)}
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
              </Link>
            ))}
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

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
}
