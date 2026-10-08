// features/broker/post-property/FreePlanUsageBar.tsx
// Static "Free Plan · listings remaining" bar shown on every Post Property
// wizard step (Figma). Presentational only — no subscription/quota system
// exists in the backend yet, so this doesn't read or enforce a real limit.
// Real quota enforcement is a separate future billing feature.

export function FreePlanUsageBar() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border px-4 py-3">
      <div className="flex flex-1 items-center gap-3">
        <span className="whitespace-nowrap font-heading text-[12px] font-bold uppercase tracking-[1px] text-foreground">
          Free Plan <span className="text-muted-foreground">0/3</span>
        </span>
        <div className="h-1 flex-1 rounded-full bg-muted">
          <div className="h-1 w-0 rounded-full bg-foreground" />
        </div>
      </div>
      <span className="whitespace-nowrap font-body text-[12px] text-muted-foreground">3 listings remaining</span>
    </div>
  );
}
