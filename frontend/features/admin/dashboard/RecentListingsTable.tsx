// features/admin/dashboard/RecentListingsTable.tsx
// The dashboard's "Recent Listings" card body: the five newest non-draft
// listings with reference, property, price, status and submission date.
// Scrolls horizontally on narrow screens instead of squashing columns.

import StatusPill from "@/components/shared/StatusPill";
import type { AdminSummary } from "@/lib/api/endpoints/admin";
import { PROPERTY_TYPE_LABELS } from "@/lib/enums";
import { ADMIN_PILL_CLASS, adminPropertyStatusMap } from "@/features/admin/adminStatus";
import { formatAdminDate, formatAdminPrice, listingRef } from "@/features/admin/format";

const headClassName = "px-6 py-3 text-left font-heading text-[10px] font-bold uppercase tracking-[1.4px] text-slate-500";

export function RecentListingsTable({ listings }: { listings: AdminSummary["recent_listings"] }) {
  if (listings.length === 0) {
    return <p className="border-t border-slate-100 px-6 py-10 font-body text-[13px] text-slate-500">No listings submitted yet.</p>;
  }

  return (
    <div className="overflow-x-auto border-t border-slate-100">
      <table className="w-full min-w-[640px]">
        <thead className="border-b border-slate-100">
          <tr>
            <th className={headClassName}>ID</th>
            <th className={headClassName}>Property</th>
            <th className={headClassName}>Price</th>
            <th className={headClassName}>Status</th>
            <th className={headClassName}>Submitted</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => (
            <tr key={listing.id} className="border-b border-slate-100 last:border-0">
              <td className="px-6 py-4 font-heading text-[12px] font-bold text-slate-500">{listingRef(listing.id)}</td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-0.5">
                  <span className="font-heading text-[14px] font-bold text-brand-primary-600">{listing.title}</span>
                  <span className="font-body text-[12px] text-slate-500">
                    {PROPERTY_TYPE_LABELS[listing.property_type]} · {listing.locality}, {listing.city}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 font-heading text-[14px] font-bold text-brand-primary-600">{formatAdminPrice(listing.price, listing.listing_type)}</td>
              <td className="px-6 py-4">
                <StatusPill value={listing.status} map={adminPropertyStatusMap} className={ADMIN_PILL_CLASS} />
              </td>
              <td className="px-6 py-4 font-body text-[13px] text-slate-500">{formatAdminDate(listing.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
