// features/auth/AuthProgressBar.tsx
// Eyebrow + "Step X of N" + progress track, shared by every step of the
// signup wizard (Figma: ProgressBar, node 416:625/416:914). Two
// independent phases share this component: Phase A (role -> form -> OTP
// verify, totalSteps=3) keeps Figma's original "Onboarding Sequence"
// eyebrow; Phase B (the 6-screen buyer-preference wizard, totalSteps=6)
// uses "Personifying Your Experience" instead, per explicit request —
// the eyebrow text is keyed off totalSteps the same way the fill-percent
// logic already is. Phase B restarts its own "Step 1 of 6" count rather
// than continuing Phase A's numbering, so its fill percentage must
// always come from the step/totalSteps formula, never from Phase A's
// hardcoded map (which would otherwise collide on steps 1-3).

const PHASE_A_TOTAL_STEPS = 3;
const PHASE_A_FILL_PERCENT: Record<number, number> = {
  1: 27.5,
  2: 72.8,
  3: 100,
};

export function AuthProgressBar({ step, totalSteps = PHASE_A_TOTAL_STEPS }: { step: number; totalSteps?: number }) {
  const isPhaseA = totalSteps === PHASE_A_TOTAL_STEPS;
  const fillPercent = isPhaseA ? (PHASE_A_FILL_PERCENT[step] ?? (step / totalSteps) * 100) : (step / totalSteps) * 100;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-heading text-[14px] font-medium uppercase tracking-[1.4px] text-brand-primary-100">
          {isPhaseA ? "Onboarding Sequence" : "Personifying Your Experience"}
        </span>
        <span className="font-heading text-[16px] text-brand-primary-400">
          {`Step ${step} `}
          <span className="text-black/25">{`of ${totalSteps}`}</span>
        </span>
      </div>
      <div className="h-[2px] w-full bg-black/[0.08]">
        <div className="h-[2px] bg-foreground transition-[width]" style={{ width: `${fillPercent}%` }} />
      </div>
    </div>
  );
}
