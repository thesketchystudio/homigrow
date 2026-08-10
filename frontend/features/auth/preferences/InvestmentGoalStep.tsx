// features/auth/preferences/InvestmentGoalStep.tsx
// Step 6 of 9 — "What is your primary goal?" (Figma node 457:593).
// Investment-goal cards + buy-timeline pills.

import { AuthProgressBar } from "@/features/auth/AuthProgressBar";
import { PreferenceWizardFooter } from "@/features/auth/preferences/PreferenceWizardFooter";
import { SelectableCardGroup } from "@/features/auth/preferences/SelectableCardGroup";
import { PillGroup, type PillOption } from "@/features/auth/preferences/PillGroup";
import type { BuyerPreferences } from "@/features/auth/preferences/types";
import { INVESTMENT_GOAL_OPTIONS as GOAL_OPTIONS } from "@/features/auth/preferences/options";

const TIMELINE_OPTIONS: PillOption[] = [
  { value: "immediately", label: "Immediately", sublabel: "Within 3 months" },
  { value: "6_months", label: "6 Months", sublabel: "Mid-term search" },
  { value: "1_year", label: "~1 Year", sublabel: "Planned acquisition" },
  { value: "3_plus_years", label: "3+ Years", sublabel: "Long-horizon planning" },
];

type InvestmentGoalStepProps = {
  preferences: BuyerPreferences;
  onChange: (patch: Partial<BuyerPreferences>) => void;
  onBack: () => void;
  onSkip: () => void;
  onContinue: () => void;
};

export function InvestmentGoalStep({ preferences, onChange, onBack, onSkip, onContinue }: InvestmentGoalStepProps) {
  return (
    <div className="flex w-full flex-col gap-16">
      <div className="flex flex-col gap-12">
        <AuthProgressBar step={3} totalSteps={6} />

        <div className="flex flex-col gap-6">
          <h2 className="font-heading text-[20px] text-brand-primary-700">What is your primary goal?</h2>
          <SelectableCardGroup
            showCheckIcon
            options={GOAL_OPTIONS}
            value={preferences.investment_goals ?? []}
            onChange={(investment_goals) => onChange({ investment_goals })}
          />
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="font-heading text-[20px] text-brand-primary-700">When are you looking to buy?</h2>
          <PillGroup
            variant="labeled"
            options={TIMELINE_OPTIONS}
            value={preferences.buy_timeline ?? null}
            onChange={(buy_timeline) => onChange({ buy_timeline })}
          />
        </div>
      </div>

      <PreferenceWizardFooter onBack={onBack} onSkip={onSkip} onContinue={onContinue} />
    </div>
  );
}
