// features/auth/AuthProgressBar.tsx
// Eyebrow + "Step X of N" + progress track, shared by every step of the
// signup wizard (Figma: ProgressBar, node 416:625/416:914). Three
// independent phases share this component: Phase A (role -> form -> OTP
// verify, totalSteps=3 for a client) keeps Figma's original "Onboarding
// Sequence" eyebrow; Phase B (the 6-screen buyer-preference wizard,
// totalSteps=6) uses "Personifying Your Experience" instead. A broker's
// Phase A has a 4th step (document upload) Figma's own step-count labels
// don't account for — same class of authoring gap already documented for
// Phase B, so real incrementing numbers ship instead of Figma's static
// text. Relying on totalSteps alone to infer the phase breaks once a
// phase's own step count can vary (broker's 4 vs client's 3), so `phase`
// is an explicit override; omitting it preserves the original
// totalSteps===3 inference for every existing call site.
const PHASE_A_TOTAL_STEPS = 3;
const PHASE_A_FILL_PERCENT: Record<number, number> = {
  1: 27.5,
  2: 72.8,
  3: 100,
};

type Phase = "onboarding" | "preferences";

type AuthProgressBarProps = {
  step: number;
  totalSteps?: number;
  phase?: Phase;
};

export function AuthProgressBar({ step, totalSteps = PHASE_A_TOTAL_STEPS, phase }: AuthProgressBarProps) {
  const resolvedPhase: Phase = phase ?? (totalSteps === PHASE_A_TOTAL_STEPS ? "onboarding" : "preferences");
  const isOnboarding = resolvedPhase === "onboarding";
  const fillPercent =
    isOnboarding && totalSteps === PHASE_A_TOTAL_STEPS
      ? (PHASE_A_FILL_PERCENT[step] ?? (step / totalSteps) * 100)
      : (step / totalSteps) * 100;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-heading text-[14px] font-medium uppercase tracking-[1.4px] text-brand-primary-100">
          {isOnboarding ? "Onboarding Sequence" : "Personifying Your Experience"}
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
