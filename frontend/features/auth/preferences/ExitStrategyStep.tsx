// features/auth/preferences/ExitStrategyStep.tsx
// Step 7 of 9 — "How do you plan to exit this investment?" (Figma node
// 457:913). Exit-approach cards + target hold period / target ROI /
// risk tolerance pills + a market-timing notification checkbox.

import { Checkbox } from "@/components/ui/checkbox";
import { AuthProgressBar } from "@/features/auth/AuthProgressBar";
import { PreferenceWizardFooter } from "@/features/auth/preferences/PreferenceWizardFooter";
import { SelectableCardGroup, type SelectableCardOption } from "@/features/auth/preferences/SelectableCardGroup";
import { PillGroup, type PillOption } from "@/features/auth/preferences/PillGroup";
import type { BuyerPreferences } from "@/features/auth/preferences/types";

const EXIT_OPTIONS: SelectableCardOption[] = [
  { value: "hold_and_appreciate", label: "Hold & Appreciate", sublabel: "Ride capital growth long-term" },
  { value: "rental_yield_exit", label: "Rental Yield Exit", sublabel: "Optimise recurring income, then sell" },
  { value: "quick_flip", label: "Quick Flip", sublabel: "Buy → renovate → resell within 2 yrs" },
  { value: "portfolio_rebalancing", label: "Portfolio Rebalancing", sublabel: "Exit one asset to fund the next" },
  { value: "nri_repatriation", label: "NRI Repatriation", sublabel: "Repatriate funds to home currency" },
  { value: "inheritance_estate", label: "Inheritance / Estate", sublabel: "Transfer wealth to next generation" },
];

const HOLD_PERIOD_OPTIONS: PillOption[] = [
  { value: "under_2_years", label: "< 2 Years", sublabel: "Short-term flip" },
  { value: "2_to_5_years", label: "2 – 5 Years", sublabel: "Medium hold" },
  { value: "5_to_10_years", label: "5 – 10 Years", sublabel: "Growth horizon" },
  { value: "10_plus_years", label: "10+ Years", sublabel: "Generational hold" },
];

const ROI_OPTIONS: PillOption[] = [
  { value: "under_10", label: "< 10% p.a." },
  { value: "10_to_20", label: "10 – 20% p.a." },
  { value: "20_to_30", label: "20 – 30% p.a." },
  { value: "30_plus", label: "30%+ p.a." },
];

const RISK_OPTIONS: PillOption[] = [
  { value: "conservative", label: "Conservative", sublabel: "Ready-to-move, tier-1 only" },
  { value: "moderate", label: "Moderate", sublabel: "Mix of ready & under-construction" },
  { value: "aggressive", label: "Aggressive", sublabel: "Pre-launch & emerging micro-markets" },
];

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
