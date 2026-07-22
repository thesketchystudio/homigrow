// features/auth/preferences/DevelopmentStageStep.tsx
// Step 8 of 9 — Development Stage + Must-Have Amenities (Figma node
// 457:1113).

import { AuthProgressBar } from "@/features/auth/AuthProgressBar";
import { PreferenceWizardFooter } from "@/features/auth/preferences/PreferenceWizardFooter";
import { ChecklistGroup, type ChecklistOption } from "@/features/auth/preferences/ChecklistGroup";
import { ChipMultiSelect, type ChipOption } from "@/features/auth/preferences/ChipMultiSelect";
import type { BuyerPreferences } from "@/features/auth/preferences/types";

const DEVELOPMENT_STAGE_OPTIONS: ChecklistOption[] = [
  { value: "ready_to_move", label: "Prioritize Ready-to-Move", sublabel: "High Maintenance Score" },
  { value: "under_construction", label: "Prioritize Under Construction", sublabel: "Growth Potential" },
  { value: "pre_launch", label: "Include Pre-Launch Opportunities", sublabel: "Early-Bird Pricing" },
];

const AMENITY_OPTIONS: ChipOption[] = [
  { value: "swimming_pool", label: "Swimming Pool" },
  { value: "24_7_security", label: "24/7 Security" },
  { value: "gymnasium", label: "Gymnasium" },
  { value: "clubhouse", label: "Clubhouse" },
  { value: "underground_parking", label: "Underground Parking" },
  { value: "ev_charging", label: "EV Charging" },
  { value: "concierge_service", label: "Concierge Service" },
  { value: "green_spaces_parks", label: "Green Spaces / Parks" },
  { value: "school_proximity", label: "School Proximity" },
  { value: "hospital_access", label: "Hospital Access" },
  { value: "metro_connectivity", label: "Metro Connectivity" },
  { value: "smart_home", label: "Smart Home" },
];

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
        <AuthProgressBar step={8} totalSteps={9} />

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
