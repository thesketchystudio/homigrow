// features/admin/dashboard/RecentActivity.tsx
// The dashboard's "Recent Activity" feed: the latest admin actions from
// the audit log, each with an icon for its kind and a relative time.

import { CircleCheck, CircleX, ShieldAlert, ShieldCheck } from "lucide-react";
import type { ComponentType } from "react";

import type { AdminSummary } from "@/lib/api/endpoints/admin";
import { formatRelativeTime } from "@/lib/utils";
import { AdminCard, AdminSectionLabel } from "@/features/admin/AdminChrome";

// Keyed by the backend's AdminAction values (app/models/enums.py).
const ACTION_ICONS: Record<string, { icon: ComponentType<{ size?: number; className?: string }>; className: string }> = {
  property_approved: { icon: CircleCheck, className: "text-emerald-600" },
  property_rejected: { icon: CircleX, className: "text-red-600" },
  user_suspended: { icon: ShieldAlert, className: "text-red-600" },
  user_reinstated: { icon: ShieldCheck, className: "text-emerald-600" },
};

export function RecentActivity({ items }: { items: AdminSummary["recent_activity"] }) {
  return (
    <AdminCard className="flex flex-col gap-5 p-6">
      <AdminSectionLabel>Recent Activity</AdminSectionLabel>
      {items.length === 0 ? (
        <p className="font-body text-[13px] text-slate-500">Moderation decisions and account actions will appear here.</p>
      ) : (
        <ul className="flex flex-col gap-5">
          {items.map((item) => {
            const entry = ACTION_ICONS[item.action] ?? { icon: CircleCheck, className: "text-slate-400" };
            const Icon = entry.icon;
            return (
              <li key={item.id} className="flex gap-3">
                <Icon size={14} className={`mt-0.5 shrink-0 ${entry.className}`} />
                <div className="flex flex-col gap-0.5">
                  <span className="font-heading text-[13px] font-medium text-brand-primary-600">{item.summary}</span>
                  <span className="font-body text-[11px] text-slate-400">{formatRelativeTime(item.created_at)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AdminCard>
  );
}
