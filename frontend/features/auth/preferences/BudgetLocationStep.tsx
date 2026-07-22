// features/auth/preferences/BudgetLocationStep.tsx
// Step 4 of 9 — "Tell us about your next legacy." (Figma node 418:994).
// Price range slider + preferred cities/areas multi-select. First Phase B
// screen, so no Back — matches RoleSelectStep's no-back-on-step-1 precedent.

import { AuthProgressBar } from "@/features/auth/AuthProgressBar";
import { PreferenceWizardFooter } from "@/features/auth/preferences/PreferenceWizardFooter";
import { BudgetRangeSlider, BUDGET_MIN, BUDGET_MAX } from "@/features/auth/preferences/BudgetRangeSlider";
import { CityMultiSelectChips } from "@/features/auth/preferences/CityMultiSelectChips";
import type { BuyerPreferences } from "@/features/auth/preferences/types";

type BudgetLocationStepProps = {
  preferences: BuyerPreferences;
  onChange: (patch: Partial<BuyerPreferences>) => void;
  onSkip: () => void;
  onContinue: () => void;
};

export function BudgetLocationStep({ preferences, onChange, onSkip, onContinue }: BudgetLocationStepProps) {
  return (
    <div className="flex w-full flex-col gap-16">
      <div className="flex flex-col gap-8">
        <AuthProgressBar step={4} totalSteps={9} />

        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[36px] font-medium leading-[44px] text-brand-primary-700">Tell us about your next legacy.</h1>
          <p className="font-body text-[16px] leading-[26px] text-brand-secondary-800">
            Establish your digital identity in the Homigrow ecosystem.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="font-heading text-[20px] text-brand-primary-700">Price Range</h2>
          <BudgetRangeSlider
            min={preferences.budget_min ?? BUDGET_MIN}
            max={preferences.budget_max ?? BUDGET_MAX}
            onChange={(min, max) => onChange({ budget_min: min, budget_max: max })}
          />
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="font-heading text-[20px] text-brand-primary-700">Where would you like to build your future?</h2>
          <CityMultiSelectChips
            value={preferences.preferred_cities ?? []}
            onChange={(preferred_cities) => onChange({ preferred_cities })}
          />
        </div>
      </div>

      <PreferenceWizardFooter onSkip={onSkip} onContinue={onContinue} />
    </div>
  );
}
