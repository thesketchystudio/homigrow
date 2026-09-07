// features/broker/leads/LeadStatusTabs.tsx
// Status filter pill-tabs for the broker Leads table (Figma node 176:1443):
// "All Leads" plus one tab per LeadStatus, each with a live count badge.
// Figma's mock only shows 5 status tabs (New/Contacted/Site Visit/Closed/
// Lost, collapsing Closed Won+negotiation into fewer buckets); this renders
// one tab per real LeadStatus value instead so "Negotiation" and the
// Won/Lost split are never silently unreachable as filters.

import { cn } from "@/lib/utils";
import { leadStatusPillMap } from "@/components/shared/StatusPill";
import { LeadStatus } from "@/lib/enums";

export type LeadStatusFilter = "all" | LeadStatus;

const TAB_ORDER: LeadStatusFilter[] = [
  "all",
  LeadStatus.new,
  LeadStatus.contacted,
  LeadStatus.site_visit,
  LeadStatus.negotiation,
  LeadStatus.closed_won,
  LeadStatus.closed_lost,
];

type LeadStatusTabsProps = {
  value: LeadStatusFilter;
  onChange: (value: LeadStatusFilter) => void;
  counts: Record<LeadStatusFilter, number>;
};

export function LeadStatusTabs({ value, onChange, counts }: LeadStatusTabsProps) {
  return (
    <div className="flex flex-wrap items-start gap-1 rounded-lg bg-[rgba(249,250,251,0.5)] p-1">
      {TAB_ORDER.map((tab) => {
        const isActive = tab === value;
        const label = tab === "all" ? "All Leads" : leadStatusPillMap[tab].label;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={cn(
              "flex items-center gap-1.5 rounded-[6px] px-4 py-[7px] font-body text-[13px] font-medium whitespace-nowrap",
              isActive ? "bg-white text-[#262626] shadow-sm" : "text-[#6b7280] hover:text-[#262626]",
            )}
          >
            {label}
            <span
              className={cn(
                "rounded-[4px] px-1.5 py-px text-[11px] font-medium",
                isActive ? "bg-[#f9fafb] text-[#262626]" : "text-[#6b7280]",
              )}
            >
              {counts[tab] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
