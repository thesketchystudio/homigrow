// features/admin/listings/AdminListingCard.tsx
// One listing in the All Listings grid (Figma node 328:429): cover image
// (or a dark gradient when the listing has no photo), Featured badge for a
// listing with a live paid boost, status chip, reference, an actions menu,
// and the title/type/location/specs/price/date block. AdminListingActions
// is reused by the list view's rows.

"use client";

import Link from "next/link";
import { Bath, BedDouble, MapPin, MoreHorizontal, Square } from "lucide-react";

import StatusPill from "@/components/shared/StatusPill";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminProperty } from "@/lib/api/endpoints/admin";
import { PROPERTY_TYPE_LABELS, PropertyStatus } from "@/lib/enums";
import { ADMIN_PILL_CLASS, adminPropertyStatusMap } from "@/features/admin/adminStatus";
import { formatAdminDate, formatAdminPrice, listingRef } from "@/features/admin/format";
import type { ModerationTarget } from "@/features/admin/ModerationDialogs";

export type ListingActionHandlers = {
  onApprove: (target: ModerationTarget) => void;
  onReject: (target: ModerationTarget) => void;
  onFilterBroker: (brokerId: string, brokerName: string) => void;
};

export function AdminListingActions({ listing, handlers }: { listing: AdminProperty; handlers: ListingActionHandlers }) {
  const target = { id: listing.id, title: listing.title };
  const brokerName = listing.broker.full_name || listing.broker.email || "this broker";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded p-1 text-slate-400 outline-none hover:text-brand-primary-600" aria-label={`Actions for ${listing.title}`}>
        <MoreHorizontal size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {listing.status === PropertyStatus.active && (
          <DropdownMenuItem asChild>
            <Link href={`/properties/${listing.id}`} target="_blank" rel="noopener noreferrer">
              View on site
            </Link>
          </DropdownMenuItem>
        )}
        {listing.status === PropertyStatus.pending && (
          <>
            <DropdownMenuItem onSelect={() => handlers.onApprove(target)}>Approve</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handlers.onReject(target)} className="text-destructive focus:text-destructive">
              Reject
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => handlers.onFilterBroker(listing.broker.id, brokerName)}>
          All listings by {brokerName}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ListingSpecs({ listing }: { listing: AdminProperty }) {
  return (
    <div className="flex flex-wrap items-center gap-4 font-body text-[12px] text-slate-500">
      {listing.bhk != null && (
        <span className="flex items-center gap-1.5">
          <BedDouble size={12} /> {listing.bhk}
        </span>
      )}
      {listing.bathrooms != null && (
        <span className="flex items-center gap-1.5">
          <Bath size={12} /> {listing.bathrooms}
        </span>
      )}
      {listing.area_sqft != null && (
        <span className="flex items-center gap-1.5">
          <Square size={12} /> {Number(listing.area_sqft).toLocaleString("en-IN")} sqft
        </span>
      )}
    </div>
  );
}

export function AdminListingCard({ listing, handlers }: { listing: AdminProperty; handlers: ListingActionHandlers }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[6px] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="relative h-[192px] bg-gradient-to-br from-slate-700 to-slate-900">
        {listing.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element -- remote storage URLs, same convention as PropertyCard
          <img src={listing.cover_image_url} alt="" className="absolute inset-0 size-full object-cover" />
        )}
        {listing.is_featured && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-2 py-0.5 font-heading text-[9px] font-bold uppercase tracking-[1px] text-brand-primary-800">
            Featured
          </span>
        )}
        <span className="absolute bottom-3 left-4">
          <StatusPill value={listing.status} map={adminPropertyStatusMap} className={`${ADMIN_PILL_CLASS} bg-white`} />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className="font-heading text-[10px] font-bold tracking-[1px] text-slate-500">{listingRef(listing.id)}</span>
          <AdminListingActions listing={listing} handlers={handlers} />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="truncate font-heading text-[15px] font-bold text-brand-primary-600" title={listing.title}>
            {listing.title}
          </h3>
          <span className="font-body text-[12px] text-slate-500">{PROPERTY_TYPE_LABELS[listing.property_type]}</span>
        </div>
        <span className="flex items-center gap-1.5 font-body text-[12px] text-slate-500">
          <MapPin size={12} /> {listing.locality}, {listing.city}
        </span>
        <ListingSpecs listing={listing} />
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="font-heading text-[17px] font-bold text-brand-primary-600">
            {formatAdminPrice(listing.price, listing.listing_type)}
          </span>
          <span className="font-body text-[11px] text-slate-500">{formatAdminDate(listing.created_at)}</span>
        </div>
      </div>
    </article>
  );
}
