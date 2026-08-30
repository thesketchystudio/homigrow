// features/profile/preferences/PreferencesTab.tsx
// Preferences tab (Figma node 569:671): view mode first — every
// BuyerPreferences field the signup wizard collected, rendered as
// read-only OverflowChipsSection groups — with an "Edit preferences"
// button (Figma node 569:679, bg #1a1a1a/brand-primary-600) that swaps
// in PreferencesEditForm. Figma's own mock only shows 3 categories
// (Cities/Type of Home/Bedrooms) and a separate flat "Buyer Profile"
// summary grid (Budget/Location/Property Type/Buyer Intent) — the
// summary grid is dropped entirely (redundant with the fuller view
// below) and every other wizard-collected field is shown, per explicit
// product decision: this tab is now the sole view+edit surface for
// buyer_preferences, replacing the subset AccountTab used to edit.
//
// The back-arrow + "Settings" title row itself lives in the shared
// app/(client)/profile/layout.tsx, not here — per the Figma XML (node
// 569:673/569:681 are full-width siblings of the sidebar+content
// container, not nested inside it). This tab only registers its own
// right-aligned action button(s) — "Edit preferences" in view mode,
// "Discard Changes"/"Save Changes" in edit mode — into that shared header
// via useProfileHeaderActions (node 569:679 / 569:649).

"use client";

import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { useProfileHeaderActions } from "@/features/profile/ProfileHeaderActions";
import { OverflowChipsSection, SingleChipSection } from "@/features/profile/preferences/OverflowChipsSection";
import { PreferencesEditForm } from "@/features/profile/preferences/PreferencesEditForm";
import { labelFor, labelsFor } from "@/features/profile/preferences/labels";
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
  PROPERTY_TYPE_OPTIONS,
} from "@/features/auth/preferences/options";
import type { BuyerPreferences } from "@/features/auth/preferences/types";
import { cn, formatINR } from "@/lib/utils";
import { getMe, updateMe, type UserRead } from "@/lib/api/endpoints/users";
import { toast } from "@/lib/toast";

function extractBuyerPreferences(user: UserRead): BuyerPreferences {
  const raw = user.preferences?.buyer_preferences;
  return typeof raw === "object" && raw !== null ? (raw as BuyerPreferences) : {};
}

function hasAnyPreference(preferences: BuyerPreferences): boolean {
  return Object.values(preferences).some((value) => (Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null));
}

// Groups the flat BuyerPreferences fields into the same 6 categories the
// signup wizard collects them in (BudgetLocationStep..CurrentSituationStep),
// so the read-only view mirrors how the user actually entered the data
// instead of one long undifferentiated list. Figma's own mock for this tab
// only shows 3 example categories with no group chrome specified, so the
// group heading + 2-column field grid below is a layout decision built on
// top of that mock, not a literal pull.
function PreferenceGroup({ title, columns = 2, children }: { title: string; columns?: 1 | 2; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="font-heading text-[16px] font-bold text-[#1a1a1a]">{title}</h3>
      <div className={cn("grid gap-x-6 gap-y-6", columns === 2 && "sm:grid-cols-2")}>{children}</div>
    </section>
  );
}

export function PreferencesTab() {
  const { data: user, isLoading } = useQuery({ queryKey: ["me"], queryFn: getMe });

  if (isLoading || !user) {
    return <PreferencesTabSkeleton />;
  }

  return <PreferencesForm key={user.id} user={user} />;
}

function PreferencesForm({ user }: { user: UserRead }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const preferences = extractBuyerPreferences(user);
  const [draft, setDraft] = useState<BuyerPreferences>(preferences);

  const mutation = useMutation({
    mutationFn: (next: BuyerPreferences) =>
      updateMe({
        preferences: {
          ...user.preferences,
          buyer_preferences: next,
        },
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
      toast.success("Preferences updated.");
      setMode("view");
    },
    onError: () => {
      toast.error("Couldn't save your preferences. Please try again.");
    },
  });

  const enterEdit = () => {
    setDraft(preferences);
    setMode("edit");
  };

  useProfileHeaderActions(
    mode === "edit" ? (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMode("view")}
          disabled={mutation.isPending}
          className="font-heading rounded border border-[rgba(38,38,38,0.3)] px-6 py-2.5 text-[16px] font-bold text-slate-500 disabled:opacity-50"
        >
          Discard Changes
        </button>
        <button
          type="button"
          onClick={() => mutation.mutate(draft)}
          disabled={mutation.isPending}
          className="bg-brand-primary-600 text-background font-heading rounded px-6 py-2.5 text-[16px] font-bold disabled:opacity-50"
        >
          {mutation.isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={enterEdit}
        className="bg-brand-primary-600 text-background font-heading shrink-0 rounded px-4 py-2 text-[16px] font-bold whitespace-nowrap"
      >
        Edit preferences
      </button>
    ),
  );

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      {mode === "edit" ? (
        <PreferencesEditForm value={draft} onChange={setDraft} />
      ) : hasAnyPreference(preferences) ? (
        <div className="flex flex-col gap-10">
          {(preferences.budget_min !== undefined ||
            preferences.budget_max !== undefined ||
            (preferences.preferred_cities?.length ?? 0) > 0) && (
            <PreferenceGroup title="Budget & Location">
              {(preferences.budget_min !== undefined || preferences.budget_max !== undefined) && (
                <SingleChipSection
                  label="Budget Range"
                  value={`${formatINR(preferences.budget_min ?? 0)} – ${formatINR(preferences.budget_max ?? 0)}`}
                />
              )}
              <OverflowChipsSection label="Preferred Cities/Towns" items={preferences.preferred_cities ?? []} />
            </PreferenceGroup>
          )}

          {((preferences.property_types?.length ?? 0) > 0 || (preferences.bedroom_preference?.length ?? 0) > 0) && (
            <PreferenceGroup title="Property Type">
              <OverflowChipsSection label="Preferred Type of Home" items={labelsFor(PROPERTY_TYPE_OPTIONS, preferences.property_types)} />
              <OverflowChipsSection label="Number of Bedrooms" items={labelsFor(BEDROOM_OPTIONS, preferences.bedroom_preference)} />
            </PreferenceGroup>
          )}

          {((preferences.investment_goals?.length ?? 0) > 0 || labelFor(BUY_TIMELINE_OPTIONS, preferences.buy_timeline)) && (
            <PreferenceGroup title="Investment Goal">
              <OverflowChipsSection label="Investment Goals" items={labelsFor(INVESTMENT_GOAL_OPTIONS, preferences.investment_goals)} />
              {labelFor(BUY_TIMELINE_OPTIONS, preferences.buy_timeline) && (
                <SingleChipSection label="Buy Timeline" value={labelFor(BUY_TIMELINE_OPTIONS, preferences.buy_timeline)!} />
              )}
            </PreferenceGroup>
          )}

          {((preferences.exit_strategies?.length ?? 0) > 0 ||
            labelFor(HOLD_PERIOD_OPTIONS, preferences.target_hold_period) ||
            labelFor(ROI_OPTIONS, preferences.target_roi) ||
            labelFor(RISK_TOLERANCE_OPTIONS, preferences.risk_tolerance) ||
            typeof preferences.notify_market_timing === "boolean") && (
            <PreferenceGroup title="Exit Strategy">
              <OverflowChipsSection label="Exit Strategy" items={labelsFor(EXIT_STRATEGY_OPTIONS, preferences.exit_strategies)} />
              {labelFor(HOLD_PERIOD_OPTIONS, preferences.target_hold_period) && (
                <SingleChipSection label="Target Hold Period" value={labelFor(HOLD_PERIOD_OPTIONS, preferences.target_hold_period)!} />
              )}
              {labelFor(ROI_OPTIONS, preferences.target_roi) && (
                <SingleChipSection label="Target Return on Investment" value={labelFor(ROI_OPTIONS, preferences.target_roi)!} />
              )}
              {labelFor(RISK_TOLERANCE_OPTIONS, preferences.risk_tolerance) && (
                <SingleChipSection label="Risk Tolerance" value={labelFor(RISK_TOLERANCE_OPTIONS, preferences.risk_tolerance)!} />
              )}
              {typeof preferences.notify_market_timing === "boolean" && (
                <SingleChipSection label="Market Timing Alerts" value={preferences.notify_market_timing ? "On" : "Off"} />
              )}
            </PreferenceGroup>
          )}

          {((preferences.development_stage?.length ?? 0) > 0 || (preferences.amenities?.length ?? 0) > 0) && (
            <PreferenceGroup title="Development Stage">
              <OverflowChipsSection label="Development Stage" items={labelsFor(DEVELOPMENT_STAGE_OPTIONS, preferences.development_stage)} />
              <OverflowChipsSection label="Must-Have Amenities" items={labelsFor(AMENITY_OPTIONS, preferences.amenities)} />
            </PreferenceGroup>
          )}

          {(preferences.current_situation?.length ?? 0) > 0 && (
            <PreferenceGroup title="Current Situation" columns={1}>
              <OverflowChipsSection label="Current Situation" items={labelsFor(CURRENT_SITUATION_OPTIONS, preferences.current_situation)} />
            </PreferenceGroup>
          )}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="No preferences set yet"
          body="Tell us what you're looking for so we can personalise property recommendations for you."
          action={
            <button
              type="button"
              onClick={enterEdit}
              className="bg-brand-primary-600 text-background font-heading rounded px-6 py-2.5 text-[16px] font-bold"
            >
              Set preferences
            </button>
          }
        />
      )}
    </div>
  );
}

export function PreferencesTabSkeleton() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-4">
            <Skeleton className="h-3 w-40" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((__, chipIndex) => (
                <Skeleton key={chipIndex} className="h-9 w-24 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
