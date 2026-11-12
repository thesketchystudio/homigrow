// features/admin/adminStatus.ts
// Status chip styling for the admin portal: the shared StatusPill with the
// admin design's small uppercase chip look, plus label/tone maps for the
// account and broker-verification states only admins see.

import type { StatusPillMap } from "@/components/shared/StatusPill";
import { AdminAccountStatus, PropertyStatus } from "@/lib/enums";

export const ADMIN_PILL_CLASS =
  "rounded-[4px] px-2 py-0.5 font-heading text-[10px] font-bold uppercase tracking-[1px] border";

export const adminPropertyStatusMap: StatusPillMap = {
  [PropertyStatus.draft]: { label: "Draft", tone: "neutral" },
  [PropertyStatus.pending]: { label: "Pending", tone: "warning" },
  [PropertyStatus.active]: { label: "Active", tone: "success" },
  [PropertyStatus.sold]: { label: "Sold", tone: "info" },
  [PropertyStatus.rented]: { label: "Rented", tone: "info" },
  [PropertyStatus.expired]: { label: "Expired", tone: "neutral" },
  [PropertyStatus.rejected]: { label: "Rejected", tone: "danger" },
};

export const adminAccountStatusMap: StatusPillMap = {
  [AdminAccountStatus.active]: { label: "Active", tone: "success" },
  [AdminAccountStatus.pending]: { label: "Pending", tone: "warning" },
  [AdminAccountStatus.suspended]: { label: "Suspended", tone: "danger" },
  [AdminAccountStatus.deactivated]: { label: "Deactivated", tone: "neutral" },
};
