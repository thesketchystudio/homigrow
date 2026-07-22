// features/auth/preferences/PropertyTypeStep.tsx
// Step 5 of 9 — "Preferred Type of Home" (Figma node 457:398). Property
// type image cards + bedroom-count pills.

import { AuthProgressBar } from "@/features/auth/AuthProgressBar";
import { PreferenceWizardFooter } from "@/features/auth/preferences/PreferenceWizardFooter";
import { PropertyTypeCardGrid } from "@/features/auth/preferences/PropertyTypeCardGrid";
import { PillGroup, type PillOption } from "@/features/auth/preferences/PillGroup";
import type { BuyerPreferences } from "@/features/auth/preferences/types";

const BEDROOM_OPTIONS: PillOption[] = [
  { value: "studio", label: "Studio" },
  { value: "1_bhk", label: "1 BHK" },
  { value: "1_rk", label: "1 RK" },
  { value: "2_bhk", label: "2 BHK" },
  { value: "3_bhk", label: "3 BHK" },
  { value: "4_bhk", label: "4 BHK" },
  { value: "5_plus_bhk", label: "5+ BHK" },
  { value: "villa_entire_floor", label: "Villa / Entire Floor" },
];

type PropertyTypeStepProps = {
  preferences: BuyerPreferences;
  onChange: (patch: Partial<BuyerPreferences>) => void;
  onBack: () => void;
  onSkip: () => void;
  onContinue: () => void;
};

export function PropertyTypeStep({ preferences, onChange, onBack, onSkip, onContinue }: PropertyTypeStepProps) {
  return (
    <div className="flex w-full flex-col gap-16">
      <div className="flex flex-col gap-8">
        <AuthProgressBar step={5} totalSteps={9} />

        <div className="flex flex-col gap-6">
          <h2 className="font-heading text-[20px] text-brand-primary-700">Preferred Type of Home</h2>
          <p className="font-body text-[18px] leading-[28px] text-brand-primary-300">
            {"Select all that apply · "}
            <span className="font-bold">{(preferences.property_types?.length ?? 0)} selected</span>
          </p>
          <PropertyTypeCardGrid
            value={preferences.property_types ?? []}
            onChange={(property_types) => onChange({ property_types })}
          />
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="font-heading text-[20px] text-brand-primary-700">How many bedrooms?</h2>
          <PillGroup
            variant="compact"
            options={BEDROOM_OPTIONS}
            value={preferences.bedroom_preference ?? null}
            onChange={(bedroom_preference) => onChange({ bedroom_preference })}
          />
        </div>
      </div>

      <PreferenceWizardFooter onBack={onBack} onSkip={onSkip} onContinue={onContinue} />
    </div>
  );
}
