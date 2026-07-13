// features/auth/AuthProgressBar.tsx
// "Onboarding" eyebrow + "Step X of 3" + progress track, shared by every
// step of the signup wizard (Figma: ProgressBar, node 416:625/416:914).

const STEP_FILL_PERCENT: Record<number, number> = {
  1: 27.5,
  2: 72.8,
  3: 100,
};

export function AuthProgressBar({ step, totalSteps = 3 }: { step: number; totalSteps?: number }) {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-heading text-[14px] font-medium uppercase tracking-[1.4px] text-brand-primary-100">
          Onboarding
        </span>
        <span className="font-heading text-[16px] text-brand-primary-400">
          {`Step ${step} `}
          <span className="text-black/25">{`of ${totalSteps}`}</span>
        </span>
      </div>
      <div className="h-[2px] w-full bg-black/[0.08]">
        <div
          className="h-[2px] bg-foreground transition-[width]"
          style={{ width: `${STEP_FILL_PERCENT[step] ?? (step / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
}
