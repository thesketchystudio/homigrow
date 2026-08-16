// features/auth/preferences/CurrentSituationStep.tsx
// Step 9 of 9 — "Your current situation" (Figma node 457:1317). Last
// Phase B screen — its Continue triggers the save-and-finish mutation
// instead of just advancing to another step.

import { AuthProgressBar } from "@/features/auth/AuthProgressBar";
import { PreferenceWizardFooter } from "@/features/auth/preferences/PreferenceWizardFooter";
import { ChecklistGroup } from "@/features/auth/preferences/ChecklistGroup";
import { CURRENT_SITUATION_OPTIONS as SITUATION_OPTIONS } from "@/features/auth/preferences/options";
import type { BuyerPreferences } from "@/features/auth/preferences/types";

type CurrentSituationStepProps = {
  preferences: BuyerPreferences;
  onChange: (patch: Partial<BuyerPreferences>) => void;
  onBack: () => void;
  onSkip: () => void;
  onFinish: () => void;
  isSaving: boolean;
};

export function CurrentSituationStep({ preferences, onChange, onBack, onSkip, onFinish, isSaving }: CurrentSituationStepProps) {
  return (
    <div className="flex w-full flex-col gap-16">
      <div className="flex flex-col gap-6">
        <AuthProgressBar step={6} totalSteps={6} />

        <h2 className="font-heading text-[20px] text-brand-primary-800">Your current situation</h2>
        <div className="rounded-lg bg-brand-secondary-500 p-6">
          <ChecklistGroup
            options={SITUATION_OPTIONS}
            value={preferences.current_situation ?? []}
            onChange={(current_situation) => onChange({ current_situation })}
          />
        </div>
      </div>

      <PreferenceWizardFooter onBack={onBack} onSkip={onSkip} onContinue={onFinish} continueLabel="Continue" isSaving={isSaving} />
    </div>
  );
}
