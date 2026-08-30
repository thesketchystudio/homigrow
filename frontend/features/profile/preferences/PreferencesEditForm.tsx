// features/profile/preferences/PreferencesEditForm.tsx
// Edit mode for the Preferences tab: every BuyerPreferences field, using
// the exact same controls as the signup wizard's 6 Phase B steps
// (features/auth/preferences/*) — BudgetRangeSlider, CityMultiSelectChips
// (the real city search/dropdown), PropertyTypeCardGrid, PillGroup,
// SelectableCardGroup, ChecklistGroup, ChipMultiSelect — just without
// each step's own progress bar/Skip/Continue chrome, since this is one
// flat form rather than a multi-step wizard. Controlled (`value`/`onChange`)
// rather than owning its own state — the Figma "Enhance filter sidebar
// features" edit-mode header (node 569:633) puts Discard/Save above the
// form next to a back arrow, so PreferencesTab owns the draft state and
// renders those controls itself.

"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { BudgetRangeSlider, BUDGET_MIN, BUDGET_MAX } from "@/features/auth/preferences/BudgetRangeSlider";
import { CityMultiSelectChips } from "@/features/auth/preferences/CityMultiSelectChips";
import { PropertyTypeCardGrid } from "@/features/auth/preferences/PropertyTypeCardGrid";
import { PillGroup } from "@/features/auth/preferences/PillGroup";
import { SelectableCardGroup } from "@/features/auth/preferences/SelectableCardGroup";
import { ChecklistGroup } from "@/features/auth/preferences/ChecklistGroup";
import { ChipMultiSelect } from "@/features/auth/preferences/ChipMultiSelect";
import {
  BEDROOM_OPTIONS,
  BUY_TIMELINE_OPTIONS,
  INVESTMENT_GOAL_OPTIONS,
  EXIT_STRATEGY_OPTIONS,
  HOLD_PERIOD_OPTIONS,
  ROI_OPTIONS,
  RISK_TOLERANCE_OPTIONS,
  DEVELOPMENT_STAGE_OPTIONS,
  AMENITY_OPTIONS,
  CURRENT_SITUATION_OPTIONS,
} from "@/features/auth/preferences/options";
import type { BuyerPreferences } from "@/features/auth/preferences/types";

function SectionHeading({ children }: { children: string }) {
  return <h2 className="font-heading text-brand-primary-400 text-[20px] leading-[28px] font-bold">{children}</h2>;
}

export function PreferencesEditForm({
  value: preferences,
  onChange,
}: {
  value: BuyerPreferences;
  onChange: (value: BuyerPreferences) => void;
}) {
  const patch = (next: Partial<BuyerPreferences>) => onChange({ ...preferences, ...next });

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <section className="flex flex-col gap-6">
        <SectionHeading>Budget Range</SectionHeading>
        <BudgetRangeSlider
          min={preferences.budget_min ?? BUDGET_MIN}
          max={preferences.budget_max ?? BUDGET_MAX}
          onChange={(budget_min, budget_max) => patch({ budget_min, budget_max })}
        />
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading>Preferred Cities/Towns</SectionHeading>
        <CityMultiSelectChips value={preferences.preferred_cities ?? []} onChange={(preferred_cities) => patch({ preferred_cities })} />
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading>Preferred Type of Home</SectionHeading>
        <PropertyTypeCardGrid value={preferences.property_types ?? []} onChange={(property_types) => patch({ property_types })} />
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading>Number of Bedrooms</SectionHeading>
        <PillGroup
          multiple
          variant="compact"
          options={BEDROOM_OPTIONS}
          value={preferences.bedroom_preference ?? []}
          onChange={(bedroom_preference) => patch({ bedroom_preference })}
        />
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading>Investment Goals</SectionHeading>
        <SelectableCardGroup
          showCheckIcon
          options={INVESTMENT_GOAL_OPTIONS}
          value={preferences.investment_goals ?? []}
          onChange={(investment_goals) => patch({ investment_goals })}
        />
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading>Buy Timeline</SectionHeading>
        <PillGroup
          variant="labeled"
          options={BUY_TIMELINE_OPTIONS}
          value={preferences.buy_timeline ?? null}
          onChange={(buy_timeline) => patch({ buy_timeline })}
        />
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading>Exit Strategy</SectionHeading>
        <SelectableCardGroup
          showCheckIcon
          cardPadding="p-[23px]"
          cardMinHeight="min-h-[89px]"
          cardGap="gap-[4px]"
          labelClassName="text-[14px] leading-[20px]"
          options={EXIT_STRATEGY_OPTIONS}
          value={preferences.exit_strategies ?? []}
          onChange={(exit_strategies) => patch({ exit_strategies })}
        />
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading>Target Hold Period</SectionHeading>
        <PillGroup
          variant="labeled"
          options={HOLD_PERIOD_OPTIONS}
          value={preferences.target_hold_period ?? null}
          onChange={(target_hold_period) => patch({ target_hold_period })}
        />
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading>Target Return on Investment</SectionHeading>
        <PillGroup
          variant="centered"
          options={ROI_OPTIONS}
          value={preferences.target_roi ?? null}
          onChange={(target_roi) => patch({ target_roi })}
        />
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading>Risk Tolerance</SectionHeading>
        <PillGroup
          variant="labeled"
          options={RISK_TOLERANCE_OPTIONS}
          value={preferences.risk_tolerance ?? null}
          onChange={(risk_tolerance) => patch({ risk_tolerance })}
        />
      </section>

      <label className="flex cursor-pointer items-start gap-5 rounded-lg bg-slate-50 px-4 py-[14px]">
        <Checkbox
          checked={preferences.notify_market_timing === true}
          onCheckedChange={(checked) => patch({ notify_market_timing: checked === true })}
          className="border-brand-primary-700 data-[state=checked]:border-brand-primary-700 data-[state=checked]:bg-brand-primary-700 data-[state=checked]:text-background mt-1"
        />
        <div className="flex flex-col">
          <p className="font-heading text-brand-primary-500 text-[14px]">Notify me of Market Timing & Exit Strategies</p>
          <p className="font-body text-[12px] text-slate-500">AI alerts for reinvestment opportunities</p>
        </div>
      </label>

      <section className="flex flex-col gap-6">
        <SectionHeading>Development Stage</SectionHeading>
        <ChecklistGroup
          options={DEVELOPMENT_STAGE_OPTIONS}
          value={preferences.development_stage ?? []}
          onChange={(development_stage) => patch({ development_stage })}
        />
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading>Must-Have Amenities</SectionHeading>
        <ChipMultiSelect options={AMENITY_OPTIONS} value={preferences.amenities ?? []} onChange={(amenities) => patch({ amenities })} />
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading>Current Situation</SectionHeading>
        <ChecklistGroup
          options={CURRENT_SITUATION_OPTIONS}
          value={preferences.current_situation ?? []}
          onChange={(current_situation) => patch({ current_situation })}
        />
      </section>
    </div>
  );
}
