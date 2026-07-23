// components/ui/skeleton.tsx
// shadcn/ui skeleton component (Radix UI primitive + Tailwind styling).
// Uses a neutral gray rather than the stock shadcn `bg-accent` default —
// `--accent` resolves to the brand's light green token here (T20), which
// reads as a stray green flash on every loading state rather than a
// placeholder, and doesn't match the neutral gray (#e4e4e4) Figma's own
// skeleton frames use for the Profile & Settings section.

import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-[#e4e4e4]", className)}
      {...props}
    />
  );
}

export { Skeleton };
