// features/admin/review-queue/ReviewQueue.tsx
// Listing Review Queue (Figma node 328:1589): today's moderation counters
// and every listing awaiting review, each row expandable to broker
// details, submission date, what the broker uploaded and a notes box.
// Approve asks for confirmation; Reject always needs a note for the
// broker (prefilled from the row's notes box when one was typed).
// The design's "Missing documents" / "Price dispute" flags have no data
// behind them; the only honest flag available is a listing with no
// photos, shown the same way.

"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Bath, BedDouble, ChevronDown, CircleCheck, CircleX, Clock, MapPin, Square } from "lucide-react";

import EmptyState from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getModerationStats, listAdminProperties, type AdminProperty } from "@/lib/api/endpoints/admin";
import { PROPERTY_TYPE_LABELS, PropertyStatus, VerificationStatus } from "@/lib/enums";
import { cn } from "@/lib/utils";
import { REJECTION_NOTE_MAX } from "@/lib/validation/admin";
import { AdminLoadError, AdminPageHeader, AdminSectionLabel, AdminStatCard } from "@/features/admin/AdminChrome";
import { AdminPager } from "@/features/admin/AdminControls";
import { daysSince, formatAdminDate, formatAdminPrice, listingRef, pluralDays } from "@/features/admin/format";
import { ApproveListingDialog, RejectListingDialog, type ModerationTarget } from "@/features/admin/ModerationDialogs";
import { ADMIN_MODERATION_STATS_KEY, ADMIN_PROPERTIES_KEY } from "@/features/admin/queryKeys";

const PAGE_SIZE = 20;

const VERIFICATION_COPY: Record<string, string> = {
  [VerificationStatus.verified]: "Licence verified",
  [VerificationStatus.pending]: "Verification pending",
  [VerificationStatus.rejected]: "Verification rejected",
  [VerificationStatus.unverified]: "Not verified",
};

export function ReviewQueue() {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [approveTarget, setApproveTarget] = useState<ModerationTarget | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ModerationTarget | null>(null);

  const stats = useQuery({ queryKey: ADMIN_MODERATION_STATS_KEY, queryFn: getModerationStats });
  const query = { status: PropertyStatus.pending, page, page_size: PAGE_SIZE };
  const queue = useQuery({
    queryKey: [...ADMIN_PROPERTIES_KEY, query],
    queryFn: () => listAdminProperties(query),
    placeholderData: keepPreviousData,
  });

  const awaiting = stats.data?.awaiting_review;

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        eyebrow="Moderation"
        title="Listing Review Queue"
        subtitle="Review and approve new property submissions"
        actions={
          awaiting !== undefined && (
            <span className="flex items-center gap-2 rounded-[4px] border border-[rgba(198,198,205,0.5)] bg-white px-4 py-2.5 font-heading text-[14px] font-medium text-brand-primary-600">
              {awaiting} Pending
              {awaiting > 0 && <span className="size-1.5 rounded-full bg-amber-500" />}
            </span>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStatCard
          label="Awaiting Review"
          value={stats.data?.awaiting_review ?? "—"}
          accentClassName="border-l-[3px] border-amber-300"
          valueClassName="text-amber-700"
        />
        <AdminStatCard
          label="Approved Today"
          value={stats.data?.approved_today ?? "—"}
          accentClassName="border-l-[3px] border-emerald-300"
          valueClassName="text-emerald-700"
        />
        <AdminStatCard
          label="Rejected Today"
          value={stats.data?.rejected_today ?? "—"}
          accentClassName="border-l-[3px] border-red-300"
          valueClassName="text-red-700"
        />
      </div>

      {queue.isError && <AdminLoadError title="Couldn't load the review queue" onRetry={() => queue.refetch()} />}
      {queue.isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-[80px] rounded-[6px]" />
          ))}
        </div>
      )}
      {queue.data && queue.data.items.length === 0 && (
        <EmptyState icon={CircleCheck} title="All caught up" body="No listings are waiting for review." />
      )}

      {queue.data && queue.data.items.length > 0 && (
        <div className="flex flex-col gap-3">
          {queue.data.items.map((listing) => (
            <QueueItem
              key={listing.id}
              listing={listing}
              expanded={expandedId === listing.id}
              onToggle={() => setExpandedId((current) => (current === listing.id ? null : listing.id))}
              note={notes[listing.id] ?? ""}
              onNoteChange={(value) => setNotes((current) => ({ ...current, [listing.id]: value }))}
              onApprove={() => setApproveTarget({ id: listing.id, title: listing.title })}
              onReject={() => setRejectTarget({ id: listing.id, title: listing.title })}
            />
          ))}
        </div>
      )}

      {queue.data && <AdminPager page={page} totalPages={queue.data.total_pages} onPageChange={setPage} />}

      <ApproveListingDialog target={approveTarget} onClose={() => setApproveTarget(null)} />
      <RejectListingDialog
        key={rejectTarget?.id ?? "none"}
        target={rejectTarget}
        initialNote={rejectTarget ? (notes[rejectTarget.id] ?? "") : ""}
        onClose={() => setRejectTarget(null)}
      />
    </div>
  );
}

function QueueItem({
  listing,
  expanded,
  onToggle,
  note,
  onNoteChange,
  onApprove,
  onReject,
}: {
  listing: AdminProperty;
  expanded: boolean;
  onToggle: () => void;
  note: string;
  onNoteChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  // updated_at moves when the listing enters review; created_at covers rows never edited since.
  const inQueueDays = daysSince(listing.updated_at ?? listing.created_at);
  const brokerName = listing.broker.full_name || listing.broker.email || "Unknown broker";
  const panelId = `review-panel-${listing.id}`;

  return (
    <article className="overflow-hidden rounded-[6px] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-6 py-5">
        <div className="flex w-[88px] flex-col gap-1">
          <span className="font-heading text-[11px] font-bold text-slate-500">{listingRef(listing.id)}</span>
          <span className="flex items-center gap-1 font-body text-[11px] text-slate-400">
            <Clock size={10} /> {pluralDays(inQueueDays)}
          </span>
        </div>

        <div className="flex min-w-[220px] flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-[15px] font-bold text-brand-primary-600">{listing.title}</h3>
            {listing.photo_count === 0 && (
              <span className="rounded-[3px] border border-amber-300 bg-amber-50 px-2 py-0.5 font-heading text-[9px] font-bold uppercase tracking-[1px] text-amber-700">
                No photos
              </span>
            )}
          </div>
          <span className="flex flex-wrap items-center gap-2 font-body text-[12px] text-slate-500">
            {PROPERTY_TYPE_LABELS[listing.property_type]}
            <span aria-hidden>·</span>
            <MapPin size={11} /> {listing.locality}, {listing.city}
          </span>
        </div>

        <div className="flex items-center gap-4 font-body text-[12px] text-slate-400">
          {listing.bhk != null && (
            <span className="flex items-center gap-1">
              <BedDouble size={12} /> {listing.bhk}
            </span>
          )}
          {listing.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath size={12} /> {listing.bathrooms}
            </span>
          )}
          {listing.area_sqft != null && (
            <span className="flex items-center gap-1">
              <Square size={12} /> {Number(listing.area_sqft).toLocaleString("en-IN")}
            </span>
          )}
        </div>

        <span className="min-w-[110px] font-heading text-[17px] font-bold text-brand-primary-600">
          {formatAdminPrice(listing.price, listing.listing_type)}
        </span>

        <span className="min-w-[110px] text-right font-heading text-[13px] font-bold text-brand-primary-600">{brokerName}</span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onApprove}
            className="flex items-center gap-2 rounded-[4px] bg-emerald-600 px-4 py-2.5 font-heading text-[11px] font-bold uppercase tracking-[1px] text-white hover:bg-emerald-700"
          >
            <CircleCheck size={12} /> Approve
          </button>
          <button
            type="button"
            onClick={onReject}
            className="flex items-center gap-2 rounded-[4px] border border-slate-300 bg-white px-4 py-2.5 font-heading text-[11px] font-bold uppercase tracking-[1px] text-brand-primary-600 hover:bg-slate-50"
          >
            <CircleX size={12} /> Reject
          </button>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={panelId}
            aria-label={expanded ? "Hide details" : "Show details"}
            className="p-1.5 text-slate-400 hover:text-brand-primary-600"
          >
            <ChevronDown size={16} className={cn("transition-transform", expanded && "rotate-180")} />
          </button>
        </div>
      </div>

      {expanded && (
        <div id={panelId} className="grid gap-6 border-t border-slate-100 bg-slate-50/60 px-6 py-6 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col gap-2">
            <AdminSectionLabel>Broker Details</AdminSectionLabel>
            <span className="font-heading text-[14px] font-bold text-brand-primary-600">{brokerName}</span>
            <span className="font-body text-[12px] text-slate-500">
              {VERIFICATION_COPY[listing.broker.verification_status ?? VerificationStatus.unverified]}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <AdminSectionLabel>Submission Date</AdminSectionLabel>
            <span className="font-heading text-[14px] font-bold text-brand-primary-600">{formatAdminDate(listing.created_at)}</span>
            <span className="font-body text-[12px] text-slate-500">In queue for {pluralDays(inQueueDays)}</span>
          </div>
          <div className="flex flex-col gap-2">
            <AdminSectionLabel>Documents</AdminSectionLabel>
            <DocumentLine present={listing.photo_count > 0} label={`Photos (${listing.photo_count})`} />
            <DocumentLine present={listing.has_video} label="Video tour" />
            {listing.has_jv_agreement && <DocumentLine present label="JV agreement" />}
          </div>
          <div className="flex flex-col gap-2">
            <AdminSectionLabel>Admin Notes</AdminSectionLabel>
            <Textarea
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              maxLength={REJECTION_NOTE_MAX}
              rows={3}
              placeholder="Add review notes…"
              aria-label={`Review notes for ${listing.title}`}
              className="bg-white"
            />
            <span className="font-body text-[11px] text-slate-400">Used as the note to the broker if you reject.</span>
          </div>
        </div>
      )}
    </article>
  );
}

function DocumentLine({ present, label }: { present: boolean; label: string }) {
  return (
    <span className={cn("flex items-center gap-1.5 font-body text-[12px]", present ? "text-emerald-700" : "text-slate-400")}>
      {present ? <CircleCheck size={12} /> : <CircleX size={12} />} {label}
    </span>
  );
}
