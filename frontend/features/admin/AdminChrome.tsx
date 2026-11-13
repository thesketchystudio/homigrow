// features/admin/AdminChrome.tsx
// Page-level building blocks shared by every admin screen: the page
// header (eyebrow, title, subtitle, actions), the white stat card, and the
// footer. The Figma footer's "Architectural Curator" brand and its legal
// links are placeholder copy with no pages behind them, so the footer
// shows the real brand and year only.

import type { ReactNode } from "react";

import ErrorState from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminLoadError({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <ErrorState
      title={title}
      body="Check your connection and try again."
      action={
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      }
    />
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        <span className="font-heading text-[11px] font-bold uppercase tracking-[1.4px] text-slate-500">{eyebrow}</span>
        <h1 className="font-heading text-[32px] font-bold leading-[1.2] text-brand-primary-600 sm:text-[36px]">{title}</h1>
        {subtitle && <p className="font-body text-[16px] text-slate-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function AdminCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-[6px] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]", className)}>{children}</div>
  );
}

export function AdminStatCard({
  label,
  value,
  icon,
  footer,
  accentClassName,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
  accentClassName?: string;
  valueClassName?: string;
}) {
  return (
    <AdminCard className={cn("flex flex-col gap-4 p-6", accentClassName)}>
      <div className="flex items-start justify-between gap-2">
        <span className="font-heading text-[10px] font-bold uppercase tracking-[1.4px] text-slate-500">{label}</span>
        {icon && <span className="flex size-8 items-center justify-center rounded-[4px] bg-slate-100 text-slate-500">{icon}</span>}
      </div>
      <span className={cn("font-heading text-[30px] font-bold leading-none text-brand-primary-600", valueClassName)}>{value}</span>
      {footer}
    </AdminCard>
  );
}

export function AdminFooter() {
  return (
    <footer className="mt-16 border-t border-[rgba(198,198,205,0.25)] bg-brand-secondary-400">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-1 px-4 py-10 sm:px-8">
        <span className="font-heading text-[16px] font-bold text-brand-primary-600">Homigrow</span>
        <span className="font-body text-[14px] text-slate-500">© {new Date().getFullYear()} Homigrow. All rights reserved.</span>
      </div>
    </footer>
  );
}

export function AdminSectionLabel({ children }: { children: ReactNode }) {
  return <span className="font-heading text-[10px] font-bold uppercase tracking-[1.4px] text-slate-500">{children}</span>;
}
