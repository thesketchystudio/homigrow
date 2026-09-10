// features/broker/leads/BrokerLeadsTable.tsx
// Real Leads table for the Broker Portal (Figma "Real Estate Broker Portal
// > LeadsManagement", node 176:1436): status filter tabs with live counts,
// a search box, and a Name/Phone/Property Interest/Budget/Source/Last
// Contacted/Status/Actions table. Filtering, search, and pagination are all
// client-side against GET /leads' unpaginated result, same convention
// BrokerListingsTable.tsx uses for /properties/mine.
//
// Figma's row shows the phone number redacted ("+91 98765•••••") and a
// static "Portal" source pill — both read as demo-data blurring rather than
// a real product requirement: the full number is shown here since the Call
// action needs it and the broker already receives it in cleartext via the
// lead_received notification, and Source shows the lead's real
// tour-request/number-request origin instead of a fabricated constant.
//
// Three Figma row actions map to real data this backend already has: the
// phone icon is a tel: link, the chat icon opens AddLeadNoteDialog (POST
// /leads/{id}/notes), and the calendar icon opens SetFollowUpDialog (PATCH
// .../follow_up_at) — Lead.follow_up_at existed on the model with no UI
// reading or writing it until now. The Status pill is a real Select
// (PATCH .../status) rather than a static badge, since Figma's table shows
// no separate detail screen this frame's status field could otherwise live
// on.

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, MessageSquare, Phone } from "lucide-react";

import SharedTable, { type TableColumn } from "@/components/shared/Table";
import StatusPill, { leadStatusPillMap } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { BrokerEmptyState } from "@/features/broker/BrokerEmptyState";
import { LeadStatusTabs, type LeadStatusFilter } from "@/features/broker/leads/LeadStatusTabs";
import { AddLeadNoteDialog, SetFollowUpDialog } from "@/features/broker/leads/LeadActionDialogs";
import { LEADS_QUERY_KEY } from "@/features/broker/leads/queryKey";
import { listLeads, updateLead, type LeadListItem } from "@/lib/api/endpoints/leads";
import { listMyProperties } from "@/lib/api/endpoints/properties";
import { useAuthStore } from "@/lib/stores/auth";
import { LeadStatus } from "@/lib/enums";
import { formatListingPrice, formatRelativeTime } from "@/lib/utils";
import { toast } from "@/lib/toast";

const PAGE_SIZE = 10;

const SOURCE_LABELS: Record<string, string> = {
  tour_request: "Tour Request",
  number_request: "Number Request",
};

function sourceLabel(source: string) {
  return SOURCE_LABELS[source] ?? source;
}

export function BrokerLeadsTable() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { data: properties } = useQuery({ queryKey: ["broker-my-properties"], queryFn: listMyProperties });
  const { data, isLoading, isError } = useQuery({ queryKey: LEADS_QUERY_KEY, queryFn: listLeads });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [noteLeadId, setNoteLeadId] = useState<string | null>(null);
  const [followUpLeadId, setFollowUpLeadId] = useState<string | null>(null);

  const leads = useMemo(() => data ?? [], [data]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) => updateLead(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY }),
    onError: () => toast.error("Couldn't update the lead's status. Please try again."),
  });

  const counts = useMemo(() => {
    const base: Record<LeadStatusFilter, number> = {
      all: leads.length,
      [LeadStatus.new]: 0,
      [LeadStatus.contacted]: 0,
      [LeadStatus.site_visit]: 0,
      [LeadStatus.negotiation]: 0,
      [LeadStatus.closed_won]: 0,
      [LeadStatus.closed_lost]: 0,
    };
    for (const lead of leads) base[lead.status] += 1;
    return base;
  }, [leads]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (query) {
        const haystack = `${lead.contact_name ?? ""} ${lead.contact_phone ?? ""} ${lead.property_title}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [leads, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }
  function updateStatusFilter(value: LeadStatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  function initial(name: string | null) {
    return name?.trim().charAt(0).toUpperCase() || "?";
  }

  const columns: TableColumn<LeadListItem>[] = [
    {
      key: "name",
      header: "Name",
      render: (lead) => (
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6]">
            <span className="font-heading text-[13px] font-medium text-[#262626]">{initial(lead.contact_name)}</span>
          </div>
          <span className="font-body text-[14px] font-medium text-foreground">{lead.contact_name ?? "Unknown"}</span>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (lead) => <span className="font-body text-[14px] text-muted-foreground">{lead.contact_phone ?? "—"}</span>,
    },
    {
      key: "property",
      header: "Property Interest",
      render: (lead) => (
        <Link
          href={`/properties/${lead.property_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-[14px] font-medium text-foreground hover:underline"
        >
          {lead.property_title}
        </Link>
      ),
    },
    {
      key: "budget",
      header: "Budget",
      render: (lead) => (
        <span className="font-heading text-[14px] font-medium text-foreground">
          {formatListingPrice({ listing_type: lead.property_listing_type, price: lead.property_price })}
        </span>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (lead) => (
        <span className="rounded-[6px] bg-[#eff6ff] px-3 py-1 font-heading text-[12px] font-medium text-[#1447e6]">
          {sourceLabel(lead.source)}
        </span>
      ),
    },
    {
      key: "last_contacted",
      header: "Last Contacted",
      render: (lead) => (
        <span className="font-body text-[13px] text-muted-foreground">
          {lead.last_contacted_at ? formatRelativeTime(lead.last_contacted_at) : "Not yet contacted"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (lead) => (
        <Select
          value={lead.status}
          onValueChange={(value) => statusMutation.mutate({ id: lead.id, status: value as LeadStatus })}
        >
          <SelectTrigger className="h-auto w-auto gap-1 border-0 bg-transparent p-0 shadow-none">
            <StatusPill value={lead.status} map={leadStatusPillMap} />
          </SelectTrigger>
          <SelectContent>
            {Object.values(LeadStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {leadStatusPillMap[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (lead) => (
        <div className="flex items-center justify-end gap-2">
          {lead.contact_phone ? (
            <Button variant="outline" size="icon" className="size-8" aria-label="Call lead" asChild>
              <a href={`tel:${lead.contact_phone}`}>
                <Phone className="size-4" />
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="icon" className="size-8" aria-label="Call lead" disabled>
              <Phone className="size-4" />
            </Button>
          )}
          <Button variant="outline" size="icon" className="size-8" aria-label="Add note" onClick={() => setNoteLeadId(lead.id)}>
            <MessageSquare className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-8" aria-label="Schedule follow-up" onClick={() => setFollowUpLeadId(lead.id)}>
            <Calendar className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  const hasListings = (properties?.length ?? 0) > 0;
  if (!isLoading && !isError && leads.length === 0 && !hasListings) {
    return <BrokerEmptyState name={user?.full_name} body="No leads yet. Add a property to start receiving enquiries." />;
  }

  return (
    <div className="flex flex-col gap-[27px]">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-[28px] font-medium text-foreground">Leads</h1>
        <p className="font-body text-[15px] text-muted-foreground">Track and manage all your property leads</p>
      </div>

      <SharedTable
        columns={columns}
        data={pageItems}
        rowKey={(lead) => lead.id}
        isLoading={isLoading}
        error={isError ? "Couldn't load your leads. Please try again." : undefined}
        emptyTitle={leads.length === 0 ? "No leads yet" : "No leads match your filters"}
        emptyBody={
          leads.length === 0
            ? "Leads will appear here once visitors enquire about your properties."
            : "Try adjusting your search or status filter."
        }
        searchValue={search}
        onSearchChange={updateSearch}
        filtersSlot={<LeadStatusTabs value={statusFilter} onChange={updateStatusFilter} counts={counts} />}
        pagination={{ page: currentPage, pageCount, onPageChange: setPage }}
      />

      <AddLeadNoteDialog leadId={noteLeadId} onClose={() => setNoteLeadId(null)} />
      <SetFollowUpDialog leadId={followUpLeadId} onClose={() => setFollowUpLeadId(null)} />
    </div>
  );
}
