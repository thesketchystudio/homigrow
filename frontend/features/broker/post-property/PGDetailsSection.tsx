// features/broker/post-property/PGDetailsSection.tsx
// Property Info Step's PG/Co-living sub-form — branches by listing_type:
// Sell shows building-level details only; Rent first asks "What are you
// listing?" (Entire Building vs Unit/Room), then shows the matching field
// set. All three shapes write into the same pg_details blob (see PGDetails
// in postProperty.ts / the backend's PGDetails schema).

"use client";

import { Building2, DoorOpen } from "lucide-react";
import { ChecklistGroup } from "@/features/auth/preferences/ChecklistGroup";
import { cn } from "@/lib/utils";
import { ListingType } from "@/lib/enums";
import {
  PG_AC_OPTIONS,
  PG_AMENITY_OPTIONS,
  PG_BATHROOM_TYPE_OPTIONS,
  PG_GENDER_OPTIONS,
  PG_GENDER_PREFERENCE_OPTIONS,
  PG_OCCUPANCY_TYPE_OPTIONS,
  type PGDetailsValues,
} from "@/lib/validation/postProperty";

type PGDetailsSectionProps = {
  listingType: ListingType;
  value: PGDetailsValues;
  onChange: (patch: Partial<PGDetailsValues>) => void;
};

const fieldLabelClassName = "font-heading text-[10px] font-bold uppercase tracking-[1px] text-brand-primary-600/80";
const subLabelClassName = "font-heading text-[9px] font-bold uppercase tracking-[1.5px] text-brand-primary-600/50";
const textInputClassName =
  "w-full border-b border-foreground bg-transparent pb-[5px] pt-2 font-heading text-[16px] leading-[24px] text-foreground outline-none placeholder:text-brand-secondary-700 focus:border-brand-green-600";

// Figma's "ChipToggle" style (Post Property wizard's PG frame, node
// 619:4296) — a bordered white chip, filled dark when selected. Shared by
// both the single-select and multi-select variants below since Figma
// draws them identically; only which options can be active differs.
function chipButtonClassName(selected: boolean) {
  return cn(
    "self-stretch rounded px-[13px] py-1.5 font-heading text-[13px] font-medium",
    selected ? "border border-foreground bg-foreground text-background" : "border border-[rgba(198,198,205,0.5)] bg-background text-brand-primary-600",
  );
}

function ToggleGroup<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T | undefined; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button key={option} type="button" onClick={() => onChange(option)} className={chipButtonClassName(value === option)}>
          {option}
        </button>
      ))}
    </div>
  );
}

// "Occupancy Types Available" (plural) means a PG can offer several at
// once, so this toggles membership in the array rather than replacing it —
// unlike the single-select ToggleGroup above (Gender, AC, Bathroom, etc.).
function MultiToggleGroup<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T[]; onChange: (v: T[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(selected ? value.filter((v) => v !== option) : [...value, option])}
            className={chipButtonClassName(selected)}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

// Figma's "PillToggle" style — a segmented two-option track (Yes/No),
// visually distinct from the ChipToggle group above. Used for every plain
// boolean question in this section (Currently Operational, Meals Included).
function PillToggle({ options, value, onChange }: { options: readonly ["Yes", "No"]; value: "Yes" | "No" | undefined; onChange: (v: "Yes" | "No") => void }) {
  return (
    <div className="flex w-fit items-start rounded p-1 bg-border">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded px-4 py-1.5 font-heading text-[13px] font-bold",
            value === option ? "bg-background text-foreground shadow-[0px_1px_1px_rgba(0,0,0,0.05)]" : "text-brand-primary-600/70",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function LabeledField({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <span className={fieldLabelClassName}>{label}</span>
        {optional && <span className="font-heading text-[9px] font-normal uppercase tracking-[0.8px] text-brand-primary-600/40">— optional</span>}
      </div>
      {children}
    </div>
  );
}

function NumberInput({ value, onChange, placeholder }: { value: number | undefined; onChange: (v: number | undefined) => void; placeholder?: string }) {
  return (
    <input
      type="number"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
      placeholder={placeholder}
      className={textInputClassName}
    />
  );
}

const AMENITY_CHECKLIST = PG_AMENITY_OPTIONS.map((value) => ({ value, label: value }));

export function PGDetailsSection({ listingType, value, onChange }: PGDetailsSectionProps) {
  if (listingType === ListingType.sale) {
    return (
      <div className="flex flex-col gap-5 rounded border border-[rgba(198,198,205,0.35)] p-5">
        <span className={subLabelClassName}>PG / Co-living Building Details</span>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <LabeledField label="Total Floors">
            <NumberInput value={value.total_floors} onChange={(total_floors) => onChange({ total_floors })} placeholder="e.g. 4" />
          </LabeledField>
          <LabeledField label="Total Rooms">
            <NumberInput value={value.total_rooms} onChange={(total_rooms) => onChange({ total_rooms })} placeholder="e.g. 24" />
          </LabeledField>
        </div>
        <LabeledField label="Currently Operational">
          <PillToggle
            options={["Yes", "No"] as const}
            value={value.currently_operational === undefined ? undefined : value.currently_operational ? "Yes" : "No"}
            onChange={(option) => onChange({ currently_operational: option === "Yes" })}
          />
        </LabeledField>
        <LabeledField label="Occupancy Types Available">
          <MultiToggleGroup options={PG_OCCUPANCY_TYPE_OPTIONS} value={(value.occupancy_types ?? []) as (typeof PG_OCCUPANCY_TYPE_OPTIONS)[number][]} onChange={(occupancy_types) => onChange({ occupancy_types })} />
        </LabeledField>
        <LabeledField label="Gender">
          <ToggleGroup options={PG_GENDER_OPTIONS} value={value.gender as (typeof PG_GENDER_OPTIONS)[number] | undefined} onChange={(gender) => onChange({ gender })} />
        </LabeledField>
        <LabeledField label="Estimated Monthly Revenue (₹)" optional>
          <NumberInput value={value.estimated_monthly_revenue} onChange={(estimated_monthly_revenue) => onChange({ estimated_monthly_revenue })} placeholder="e.g. 2,40,000" />
        </LabeledField>
      </div>
    );
  }

  // Rent: choose Entire Building vs Unit/Room first.
  return (
    <div className="flex flex-col gap-8 border-t border-border pt-8">
      <h2 className="font-heading text-[16px] font-bold text-foreground">What are you listing?</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChange({ listing_scope: "entire", meals_included: value.meals_included ?? true })}
          className={cn(
            "flex flex-col items-start gap-2 rounded-md border p-4 text-left",
            value.listing_scope === "entire" ? "border-foreground" : "border-border",
          )}
        >
          <Building2 size={20} />
          <span className="font-heading text-[14px] font-bold text-foreground">Entire Building</span>
          <span className="font-body text-[12px] text-muted-foreground">You own the whole PG / co-living property and are renting it out as a whole or managing tenants.</span>
        </button>
        <button
          type="button"
          onClick={() => onChange({ listing_scope: "unit", meals_included: value.meals_included ?? true })}
          className={cn(
            "flex flex-col items-start gap-2 rounded-md border p-4 text-left",
            value.listing_scope === "unit" ? "border-foreground" : "border-border",
          )}
        >
          <DoorOpen size={20} />
          <span className="font-heading text-[14px] font-bold text-foreground">Unit / Room</span>
          <span className="font-body text-[12px] text-muted-foreground">You are listing a single room or bed in an existing PG or co-living space.</span>
        </button>
      </div>

      {value.listing_scope === "entire" && (
        <>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <LabeledField label="Total Rooms">
              <NumberInput value={value.total_rooms} onChange={(total_rooms) => onChange({ total_rooms })} placeholder="e.g. 20" />
            </LabeledField>
            <LabeledField label="Monthly Rent per Bed (₹)">
              <NumberInput value={value.monthly_rent_per_bed} onChange={(monthly_rent_per_bed) => onChange({ monthly_rent_per_bed })} placeholder="e.g. 9,500" />
            </LabeledField>
          </div>
          <LabeledField label="Occupancy Types Available">
            <ToggleGroup options={PG_OCCUPANCY_TYPE_OPTIONS} value={value.occupancy_types?.[0] as (typeof PG_OCCUPANCY_TYPE_OPTIONS)[number] | undefined} onChange={(option) => onChange({ occupancy_types: [...(value.occupancy_types ?? []).filter((v) => v !== option), option] })} />
          </LabeledField>
          <LabeledField label="Gender">
            <ToggleGroup options={PG_GENDER_OPTIONS} value={value.gender as (typeof PG_GENDER_OPTIONS)[number] | undefined} onChange={(gender) => onChange({ gender })} />
          </LabeledField>
          <LabeledField label="Meals Included">
            <PillToggle options={["Yes", "No"] as const} value={value.meals_included === undefined ? undefined : value.meals_included ? "Yes" : "No"} onChange={(option) => onChange({ meals_included: option === "Yes" })} />
          </LabeledField>
          <LabeledField label="Amenities">
            <ChecklistGroup options={AMENITY_CHECKLIST} value={value.amenities ?? []} onChange={(amenities) => onChange({ amenities })} className="gap-0" />
          </LabeledField>
        </>
      )}

      {value.listing_scope === "unit" && (
        <>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <LabeledField label="Room Type">
              <input
                value={value.room_type ?? ""}
                onChange={(event) => onChange({ room_type: event.target.value })}
                placeholder="e.g. Single Sharing"
                className={textInputClassName}
              />
            </LabeledField>
            <LabeledField label="Floor">
              <NumberInput value={value.floor} onChange={(floor) => onChange({ floor })} placeholder="e.g. 2" />
            </LabeledField>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <LabeledField label="Bathroom">
              <ToggleGroup options={PG_BATHROOM_TYPE_OPTIONS} value={value.bathroom_type as (typeof PG_BATHROOM_TYPE_OPTIONS)[number] | undefined} onChange={(bathroom_type) => onChange({ bathroom_type })} />
            </LabeledField>
            <LabeledField label="AC">
              <ToggleGroup options={PG_AC_OPTIONS} value={value.ac as (typeof PG_AC_OPTIONS)[number] | undefined} onChange={(ac) => onChange({ ac })} />
            </LabeledField>
          </div>
          <LabeledField label="Gender Preference">
            <ToggleGroup options={PG_GENDER_PREFERENCE_OPTIONS} value={value.gender_preference as (typeof PG_GENDER_PREFERENCE_OPTIONS)[number] | undefined} onChange={(gender_preference) => onChange({ gender_preference })} />
          </LabeledField>
          <LabeledField label="Meals Included">
            <PillToggle options={["Yes", "No"] as const} value={value.meals_included === undefined ? undefined : value.meals_included ? "Yes" : "No"} onChange={(option) => onChange({ meals_included: option === "Yes" })} />
          </LabeledField>
          <LabeledField label="Amenities">
            <ChecklistGroup options={AMENITY_CHECKLIST} value={value.amenities ?? []} onChange={(amenities) => onChange({ amenities })} className="gap-0" />
          </LabeledField>
          <LabeledField label="Monthly Rent (₹)">
            <NumberInput value={value.monthly_rent} onChange={(monthly_rent) => onChange({ monthly_rent })} placeholder="e.g. 9,500" />
          </LabeledField>
        </>
      )}
    </div>
  );
}
