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

"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
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
import { formatINR } from "@/lib/utils";
import { getMe, updateMe, type UserRead } from "@/lib/api/endpoints/users";
import { toast } from "@/lib/toast";

function extractBuyerPreferences(user: UserRead): BuyerPreferences {
  const raw = user.preferences?.buyer_preferences;
  return typeof raw === "object" && raw !== null ? (raw as BuyerPreferences) : {};
}

function hasAnyPreference(preferences: BuyerPreferences): boolean {
  return Object.values(preferences).some((value) => (Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null));
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

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-brand-primary-400 text-[36px] leading-[44px] font-bold">Settings</h1>
          <p className="font-body text-brand-primary-600/70 text-[16px] leading-[26px]">
            Manage your architectural preferences and account security.
          </p>
        </div>
        {mode === "view" && (
          <button
            type="button"
            onClick={() => setMode("edit")}
            className="bg-brand-primary-600 text-background font-heading shrink-0 rounded px-4 py-2 text-[16px] font-bold whitespace-nowrap"
          >
            Edit preferences
          </button>
        )}
      </div>

      {mode === "edit" ? (
        <PreferencesEditForm
          initialValue={preferences}
          isSaving={mutation.isPending}
          onSave={(next) => mutation.mutate(next)}
          onDiscard={() => setMode("view")}
        />
      ) : hasAnyPreference(preferences) ? (
        <div className="flex flex-col gap-8">
          {(preferences.budget_min !== undefined || preferences.budget_max !== undefined) && (
            <SingleChipSection
              label="Budget Range"
              value={`${formatINR(preferences.budget_min ?? 0)} – ${formatINR(preferences.budget_max ?? 0)}`}
            />
          )}
          <OverflowChipsSection label="Preferred Cities/Towns" items={preferences.preferred_cities ?? []} />
          <OverflowChipsSection label="Preferred Type of Home" items={labelsFor(PROPERTY_TYPE_OPTIONS, preferences.property_types)} />
          <OverflowChipsSection label="Number of Bedrooms" items={labelsFor(BEDROOM_OPTIONS, preferences.bedroom_preference)} />
          <OverflowChipsSection label="Investment Goals" items={labelsFor(INVESTMENT_GOAL_OPTIONS, preferences.investment_goals)} />
          {labelFor(BUY_TIMELINE_OPTIONS, preferences.buy_timeline) && (
            <SingleChipSection label="Buy Timeline" value={labelFor(BUY_TIMELINE_OPTIONS, preferences.buy_timeline)!} />
          )}
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
          <OverflowChipsSection label="Development Stage" items={labelsFor(DEVELOPMENT_STAGE_OPTIONS, preferences.development_stage)} />
          <OverflowChipsSection label="Must-Have Amenities" items={labelsFor(AMENITY_OPTIONS, preferences.amenities)} />
          <OverflowChipsSection label="Current Situation" items={labelsFor(CURRENT_SITUATION_OPTIONS, preferences.current_situation)} />
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="No preferences set yet"
          body="Tell us what you're looking for so we can personalise property recommendations for you."
          action={
            <button
              type="button"
              onClick={() => setMode("edit")}
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-10 w-40 rounded" />
      </div>
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
