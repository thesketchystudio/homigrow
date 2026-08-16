// features/auth/preferences/ExitStrategyStep.tsx
// Step 7 of 9 — "How do you plan to exit this investment?" (Figma node
// 457:913). Exit-approach cards + target hold period / target ROI /
// risk tolerance pills + a market-timing notification checkbox.

import { Checkbox } from "@/components/ui/checkbox";
import { AuthProgressBar } from "@/features/auth/AuthProgressBar";
import { PreferenceWizardFooter } from "@/features/auth/preferences/PreferenceWizardFooter";
import { SelectableCardGroup } from "@/features/auth/preferences/SelectableCardGroup";
import { PillGroup } from "@/features/auth/preferences/PillGroup";
import type { BuyerPreferences } from "@/features/auth/preferences/types";
import {
  EXIT_STRATEGY_OPTIONS as EXIT_OPTIONS,
  HOLD_PERIOD_OPTIONS,
  ROI_OPTIONS,
  RISK_TOLERANCE_OPTIONS as RISK_OPTIONS,
} from "@/features/auth/preferences/options";

type ExitStrategyStepProps = {
  preferences: BuyerPreferences;
  onChange: (patch: Partial<BuyerPreferences>) => void;
  onBack: () => void;
  onSkip: () => void;
  onContinue: () => void;
};

export function ExitStrategyStep({ preferences, onChange, onBack, onSkip, onContinue }: ExitStrategyStepProps) {
  return (
    <div className="flex w-full flex-col gap-16">
      <div className="flex flex-col gap-10">
        <AuthProgressBar step={4} totalSteps={6} />

        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[20px] text-brand-primary-700">How do you plan to exit this investment?</h1>
          <p className="font-body text-[16px] leading-[26px] text-brand-secondary-800">
            Our AI maps your exit route from day one — so every purchase decision aligns with your endgame.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <p className="font-body text-[16px] font-medium text-brand-primary-400">Exit Approach — select all that apply</p>
          <SelectableCardGroup
            showCheckIcon
            cardPadding="p-[23px]"
            cardMinHeight="min-h-[89px]"
            cardGap="gap-[4px]"
            labelClassName="text-[14px] leading-[20px]"
            options={EXIT_OPTIONS}
            value={preferences.exit_strategies ?? []}
            onChange={(exit_strategies) => onChange({ exit_strategies })}
          />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-body text-[18px] font-medium text-brand-primary-400">Target Hold Period</h2>
          <PillGroup
            variant="labeled"
            options={HOLD_PERIOD_OPTIONS}
            value={preferences.target_hold_period ?? null}
            onChange={(target_hold_period) => onChange({ target_hold_period })}
          />
        </div>

        <div className="flex flex-col gap-4">
          <p className="font-body text-[16px] font-medium text-brand-primary-400">Target Return on Investment</p>
          <PillGroup
            variant="centered"
            options={ROI_OPTIONS}
            value={preferences.target_roi ?? null}
            onChange={(target_roi) => onChange({ target_roi })}
          />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-body text-[18px] font-medium text-brand-primary-400">Risk Tolerance</h2>
          <PillGroup
            variant="labeled"
            options={RISK_OPTIONS}
            value={preferences.risk_tolerance ?? null}
            onChange={(risk_tolerance) => onChange({ risk_tolerance })}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-5 rounded-lg bg-brand-secondary-500 px-4 py-[14px]">
          <Checkbox
            checked={preferences.notify_market_timing === true}
            onCheckedChange={(checked) => onChange({ notify_market_timing: checked === true })}
            className="mt-1 border-brand-primary-700 data-[state=checked]:border-brand-primary-700 data-[state=checked]:bg-brand-primary-700 data-[state=checked]:text-background"
          />
          <div className="flex flex-col">
            <p className="font-heading text-[14px] text-brand-primary-500">Notify me of Market Timing & Exit Strategies</p>
            <p className="font-body text-[12px] text-brand-secondary-800">AI alerts for reinvestment opportunities</p>
          </div>
        </label>
      </div>

      <PreferenceWizardFooter onBack={onBack} onSkip={onSkip} onContinue={onContinue} />
    </div>
  );
}
