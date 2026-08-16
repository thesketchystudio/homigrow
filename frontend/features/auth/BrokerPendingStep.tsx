// features/auth/BrokerPendingStep.tsx
// Terminal screen after successful document submission (Figma:
// BrokerPendingScreen, node 431:1623). Figma's frame has no visible
// CTA button, but this route sits inside the auth layout shell (no
// TopNavBar), so a "Go to homepage" link is added — a deliberate small
// addition, not a literal Figma pull, since leaving a genuine dead end
// is worse than one small deviation.

import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type ChecklistState = "done" | "in_progress" | "pending";

const CHECKLIST: { label: string; state: ChecklistState }[] = [
  { label: "Documents received", state: "done" },
  { label: "Identity verification", state: "in_progress" },
  { label: "License validation", state: "pending" },
  { label: "Account activation", state: "pending" },
];

export function BrokerPendingStep() {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-4">
        <span className="rounded bg-brand-green-400 px-[13px] py-1 font-heading text-[10px] tracking-[1px] text-brand-green-900">
          UNDER REVIEW
        </span>
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-center font-heading text-[36px] font-medium leading-[44px] text-foreground">
            Verification in progress
          </h1>
          <p className="max-w-[448px] text-center font-body text-[16px] leading-[26px] text-brand-secondary-900">
            Our team is reviewing your documents. You&apos;ll be notified within 24–48 hours.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 rounded-lg border border-brand-green-300 bg-brand-green-100 px-5 py-2">
        {CHECKLIST.map(({ label, state }) => (
          <div key={label} className="flex items-center justify-center gap-3 py-2">
            <div
              className={cn(
                "flex size-5 items-center justify-center rounded-full",
                state === "done" ? "bg-brand-green-600" : state === "in_progress" ? "bg-brand-green-600/35" : "bg-brand-secondary-700",
              )}
            >
              {state === "done" && <Check size={14} className="text-background" />}
            </div>
            <span
              className={cn(
                "font-heading text-[16px]",
                state === "pending" ? "text-brand-secondary-700" : "text-foreground",
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <Link href="/" className="font-heading text-[14px] font-semibold text-foreground underline">
        Go to homepage
      </Link>
    </div>
  );
}
