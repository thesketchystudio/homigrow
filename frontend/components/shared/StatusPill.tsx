// components/shared/StatusPill.tsx
// Maps a shared enum value (PropertyStatus, LeadStatus, ...) to a
// color/label via a status→color map. Unknown values fall back to
// rendering the raw value untinted rather than throwing or hiding it.

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LeadStatus, PropertyStatus } from "@/lib/enums";

export type StatusPillTone = "neutral" | "success" | "warning" | "danger" | "info";

export type StatusPillEntry = { label: string; tone: StatusPillTone };
export type StatusPillMap = Record<string, StatusPillEntry>;

const TONE_CLASS: Record<StatusPillTone, string> = {
  neutral: "",
  success: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  warning: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  danger: "border-transparent bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400",
  info: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400",
};

export const propertyStatusPillMap: Record<PropertyStatus, StatusPillEntry> = {
  [PropertyStatus.draft]: { label: "Draft", tone: "neutral" },
  [PropertyStatus.pending]: { label: "Pending Review", tone: "warning" },
  [PropertyStatus.active]: { label: "Active", tone: "success" },
  [PropertyStatus.sold]: { label: "Sold", tone: "info" },
  [PropertyStatus.rented]: { label: "Rented", tone: "info" },
  [PropertyStatus.expired]: { label: "Expired", tone: "neutral" },
  [PropertyStatus.rejected]: { label: "Rejected", tone: "danger" },
};

export const leadStatusPillMap: Record<LeadStatus, StatusPillEntry> = {
  [LeadStatus.new]: { label: "New", tone: "info" },
  [LeadStatus.contacted]: { label: "Contacted", tone: "warning" },
  [LeadStatus.site_visit]: { label: "Site Visit", tone: "warning" },
  [LeadStatus.negotiation]: { label: "Negotiation", tone: "warning" },
  [LeadStatus.closed_won]: { label: "Closed Won", tone: "success" },
  [LeadStatus.closed_lost]: { label: "Closed Lost", tone: "danger" },
};

export type StatusPillProps = {
  value: string;
  map: StatusPillMap;
};

export default function StatusPill({ value, map }: StatusPillProps) {
  const entry = map[value];

  return (
    <Badge variant="outline" className={cn("capitalize", TONE_CLASS[entry?.tone ?? "neutral"])}>
      {entry?.label ?? value}
    </Badge>
  );
}
