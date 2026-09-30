// features/broker/BrokerEmptyState.tsx
// Figma "Blank screen" (node 643:22) — shown across the Broker Portal's
// still-empty pages (Dashboard, Listings, Leads, Analytics) until each has
// real data to show. The illustration is the SVG export of that
// Figma node's artwork group (public/broker/empty-state.svg), rendered as
// exported rather than hand-redrawn. "Add Listing" opens the wizard in a new tab,
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
    <div className="flex flex-col items-center gap-6 py-20 text-center">
      <Image src="/broker/empty-state.svg" alt="" width={255} height={240} priority className="h-auto w-56 sm:w-64" />
      <div className="flex flex-col items-center gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[28px] font-bold leading-9 text-brand-primary-400">Welcome {firstName}!</h1>
          <p className="font-body text-[16px] leading-6.5 text-brand-primary-300">{body}</p>
        </div>
        <Link
          href="/broker/listings/new"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg bg-brand-green-600 px-4 py-2.5 font-body text-[14px] font-medium leading-[21px] text-brand-primary-400"
        >
          <Plus size={16} />
          Add Listing
        </Link>
      </div>
    </div>
  );
}
