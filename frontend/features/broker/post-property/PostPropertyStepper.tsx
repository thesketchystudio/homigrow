// features/broker/post-property/PostPropertyStepper.tsx
// Numbered tab row for the Post Property wizard's 4 steps (Figma "Post
// your listing" header, node 612:811 — 16px number+label pairs, the
// current step at full opacity with a black underline, upcoming steps
// dimmed to 40% opacity, no underline). Purely a progress display — tabs
// aren't clickable, since a later step can depend on data collected in an
// earlier one (Media needs Info's data before it means anything). A
// completed step has no Figma reference (only the first-step screen was
// designed), so it's inferred to render at full opacity without the
// active underline.

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
    <div className="flex w-full border-b border-brand-primary-100">
      {STEPS.map((step, index) => {
        const isActive = step.key === current;
        const isDone = index < currentIndex;
        return (
          <div
            key={step.key}
            className={cn(
              "flex items-center gap-3 border-b-2 pb-4.5",
              index > 0 && "pl-12",
              isActive ? "border-foreground" : "border-transparent",
              !isActive && !isDone && "opacity-40",
            )}
          >
            <span className="font-heading text-[16px] font-bold text-foreground">{`0${index + 1}`}</span>
            <span className="font-heading text-[16px] font-medium uppercase text-foreground">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
