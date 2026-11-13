// app/(admin)/admin/login/page.tsx
// Admin Sign In (Figma node 328:2050): a dark brand panel with a faint
// grid on the left and the sign-in form on the right. The design's live
// "247 Active Listings / 23 Pending Reviews" pills are left out — this
// page is public, and the pending-review count is internal moderation
// data that shouldn't be shown to anyone before they sign in. The dark
// panel is hidden on small screens so the form gets the full width.

import { Suspense } from "react";
import type { Metadata } from "next";
import { Lightbulb, Shield } from "lucide-react";

import { AdminLoginForm } from "@/features/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Sign In · Homigrow",
  robots: { index: false, follow: false },
};

const GRID_BACKGROUND = {
  backgroundImage:
    "linear-gradient(to right, rgba(254,254,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(254,254,255,0.04) 1px, transparent 1px)",
  backgroundSize: "63.7px 117.4px",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-svh bg-brand-secondary-400">
      <section
        className="relative hidden flex-[765_0_0] flex-col justify-between bg-brand-primary-800 p-16 lg:flex"
        style={GRID_BACKGROUND}
      >
        <span className="font-heading text-[20px] font-bold leading-[30px] text-background">Homigrow</span>
        <div className="flex max-w-[637px] flex-col">
          <Lightbulb size={20} className="fill-amber-400 text-amber-400" aria-hidden />
          <span className="pt-6 font-heading text-[11px] font-bold uppercase tracking-[1.4px] text-background/40">
            Admin Portal
          </span>
          <h2 className="pt-3 font-heading text-[40px] font-bold leading-[50px] text-background">
            Curate the
            <br />
            finest properties.
          </h2>
          <p className="max-w-[384px] pt-4 font-body text-[16px] leading-[26px] text-background/60">
            Manage listings, verify brokers, and oversee the full property marketplace from one place.
          </p>
        </div>
        <span aria-hidden />
      </section>

      <section className="flex w-full items-center justify-center px-4 py-16 sm:p-16 lg:w-[520px] lg:shrink-0">
        <div className="flex w-full max-w-[384px] flex-col">
          <span className="flex size-12 items-center justify-center rounded-[8px] bg-brand-primary-800 text-background">
            <Shield size={20} />
          </span>
          <h1 className="pt-8 font-heading text-[28px] font-bold leading-[42px] text-brand-primary-600">Admin Sign In</h1>
          <p className="pt-1 font-body text-[14px] leading-[21px] text-slate-500">Access the Homigrow administration panel</p>
          <Suspense>
            <AdminLoginForm />
          </Suspense>
          <p className="pt-8 text-center font-body text-[11px] leading-[16.5px] text-brand-primary-600/35">
            Restricted access — authorised personnel only.
            <br />© {new Date().getFullYear()} Homigrow. All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
}
