// features/broker/post-property/PostPropertyStepper.tsx
// Numbered tab row for the Post Property wizard's 4 steps (Figma "Post
// your listing" header, node 612:811 — 16px number+label pairs, the
// current step at full opacity with a black underline, upcoming steps
// dimmed to 40% opacity, no underline). A completed step is clickable —
// jumps back to review/edit it — since its data already exists; an
// upcoming step stays inert, since e.g. Pricing reads Info's data with a
// non-null assertion and would crash if opened before Info is filled in.
// A completed step has no Figma reference (only the first-step screen was
// designed), so it's inferred to render at full opacity without the
// active underline.

import { cn } from "@/lib/utils";

const STEPS = [
  { key: "info", label: "Property Info" },
  { key: "media", label: "Media" },
  { key: "pricing", label: "Pricing" },
  { key: "verification", label: "Verification" },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];

type PostPropertyStepperProps = {
  current: StepKey;
  onStepSelect?: (step: StepKey) => void;
};

export function PostPropertyStepper({ current, onStepSelect }: PostPropertyStepperProps) {
  const currentIndex = STEPS.findIndex((step) => step.key === current);

  return (
    <div className="flex w-full gap-12 border-b border-brand-primary-100">
      {STEPS.map((step, index) => {
        const isActive = step.key === current;
        const isDone = index < currentIndex;
        const content = (
          <>
            <span className="font-heading text-[16px] font-bold text-foreground">{`0${index + 1}`}</span>
            <span className="font-heading text-[16px] font-medium uppercase text-foreground">{step.label}</span>
          </>
        );
        // Inter-step spacing lives on the parent's `gap-12` above, not as
        // padding on each item — padding would sit inside this element's own
        // border box and shift the underline left of its number/label.
        const className = cn(
          "flex items-center gap-3 border-b-2 pb-4.5",
          isActive ? "border-foreground" : "border-transparent",
          !isActive && !isDone && "opacity-40",
        );

        return isDone ? (
          <button key={step.key} type="button" onClick={() => onStepSelect?.(step.key)} className={cn(className, "hover:opacity-70")}>
            {content}
          </button>
        ) : (
          <div key={step.key} className={className}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
