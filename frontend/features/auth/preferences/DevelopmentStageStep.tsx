// features/auth/preferences/DevelopmentStageStep.tsx
// Step 8 of 9 — Development Stage + Must-Have Amenities (Figma node
// 457:1113).

import { AuthProgressBar } from "@/features/auth/AuthProgressBar";
import { PreferenceWizardFooter } from "@/features/auth/preferences/PreferenceWizardFooter";
import { ChecklistGroup } from "@/features/auth/preferences/ChecklistGroup";
import { ChipMultiSelect } from "@/features/auth/preferences/ChipMultiSelect";
import { DEVELOPMENT_STAGE_OPTIONS, AMENITY_OPTIONS } from "@/features/auth/preferences/options";
import type { BuyerPreferences } from "@/features/auth/preferences/types";

type DevelopmentStageStepProps = {
  preferences: BuyerPreferences;
  onChange: (patch: Partial<BuyerPreferences>) => void;
  onBack: () => void;
  onSkip: () => void;
  onContinue: () => void;
};

export function DevelopmentStageStep({ preferences, onChange, onBack, onSkip, onContinue }: DevelopmentStageStepProps) {
  return (
    <div className="flex w-full flex-col gap-16">
      <div className="flex flex-col gap-8">
        <AuthProgressBar step={5} totalSteps={6} />

        <div className="flex flex-col gap-6">
          <h2 className="font-heading text-[20px] text-brand-primary-400">Development Stage</h2>
          <ChecklistGroup
            options={DEVELOPMENT_STAGE_OPTIONS}
            value={preferences.development_stage ?? []}
            onChange={(development_stage) => onChange({ development_stage })}
          />
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="font-heading text-[20px] text-brand-primary-400">Must-Have Amenities</h2>
          <ChipMultiSelect
            options={AMENITY_OPTIONS}
            value={preferences.amenities ?? []}
            onChange={(amenities) => onChange({ amenities })}
          />
        </div>
      </div>

      <PreferenceWizardFooter onBack={onBack} onSkip={onSkip} onContinue={onContinue} />
    </div>
  );
}
