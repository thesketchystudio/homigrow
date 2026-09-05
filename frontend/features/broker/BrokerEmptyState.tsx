// features/broker/BrokerEmptyState.tsx
// Figma "Blank screen" (node 643:22) — shown across the Broker Portal's
// still-empty pages (Dashboard, Listings, Leads, Analytics) until each has
// real data to show. The illustration is the flattened PNG export of that
// Figma node (public/broker/empty-state.png) rather than hand-redrawn SVG
// layers, per the design-to-code guidance to render every asset faithfully
// rather than approximate it. "Add Listing" opens the wizard in a new tab,
// same as the sidebar's floating "+" button (see (broker)/broker/layout.tsx).

import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";

type BrokerEmptyStateProps = {
  name?: string;
  body?: string;
};

export function BrokerEmptyState({
  name,
  body = "There's nothing to show here yet. Add a property to get started.",
}: BrokerEmptyStateProps) {
  const firstName = name?.trim().split(" ")[0] || "there";

  return (
    <div className="flex flex-col items-center gap-8 py-20 text-center">
      <Image src="/broker/empty-state.png" alt="" width={455} height={243} priority className="h-auto w-70 sm:w-91" />
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-[28px] font-bold text-foreground">Welcome {firstName}!</h1>
        <p className="font-body text-[16px] text-muted-foreground">{body}</p>
      </div>
      <Link
        href="/broker/listings/new"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-lg bg-brand-green-500 px-6 py-3 font-heading text-[16px] font-bold text-brand-primary-700"
      >
        <Plus size={18} />
        Add Listing
      </Link>
    </div>
  );
}
