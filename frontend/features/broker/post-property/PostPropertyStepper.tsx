// features/broker/post-property/PostPropertyStepper.tsx
// Numbered tab row for the Post Property wizard's 4 steps (Figma "Curate
// Your Listing" tab bar, adapted to real Homigrow tokens instead of the
// unskinned template's raw hex/font values). Purely a progress display —
// tabs aren't clickable, since a later step can depend on data collected
// in an earlier one (Media needs Info's data before it means anything).

import { cn } from "@/lib/utils";

const STEPS = [
  { key: "info", label: "Property Info" },
  { key: "media", label: "Media" },
  { key: "pricing", label: "Pricing" },
  { key: "verification", label: "Verification" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export function PostPropertyStepper({ current }: { current: StepKey }) {
  const currentIndex = STEPS.findIndex((step) => step.key === current);

  return (
    <div className="flex w-full gap-8 border-b border-border">
      {STEPS.map((step, index) => {
        const isActive = step.key === current;
        const isDone = index < currentIndex;
        return (
          <div
            key={step.key}
            className={cn(
              "flex items-center gap-2 border-b-2 pb-3 font-heading text-[14px] font-bold uppercase tracking-[1px]",
              isActive
                ? "border-foreground text-foreground"
                : isDone
                  ? "border-transparent text-brand-green-800"
                  : "border-transparent text-muted-foreground",
            )}
          >
            <span>{`0${index + 1}`}</span>
            <span>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
