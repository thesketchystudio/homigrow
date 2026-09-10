// features/broker/post-property/PGDetailsSection.tsx
// Property Info Step's PG/Co-living sub-form — branches by listing_type:
// Sell shows building-level details only; Rent first asks "What are you
// listing?" (Entire Building vs Unit/Room), then shows the matching field
// set. All three shapes write into the same pg_details blob (see PGDetails
// in postProperty.ts / the backend's PGDetails schema).

"use client";

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

// Figma's "TypeCard" icons (node 619:8072, PGRentSubFields) — traced from
// the exported assets rather than substituted with a lucide equivalent,
// since neither glyph matches an existing icon closely enough.
function EntireBuildingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M2.5 17.5H17.5M2.5 5.83333L10 2.5L17.5 5.83333M3.33333 17.5V5.83333M16.6667 17.5V5.83333M7.5 17.5V14.1667H12.5V17.5"
        stroke="#1A1A1A"
        strokeOpacity="0.5"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UnitRoomIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M15.8333 2.5H4.16667C3.24619 2.5 2.5 3.24619 2.5 4.16667V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V4.16667C17.5 3.24619 16.7538 2.5 15.8333 2.5Z"
        stroke="#1A1A1A"
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />
      <path d="M2.5 7.5H17.5M7.5 17.5V7.5" stroke="#1A1A1A" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Figma's "Selected" badge on the active TypeCard choice (node 619:8838).
function SelectedBadge() {
  return (
    <div className="flex items-center gap-1">
      <span className="flex size-3.5 items-center justify-center rounded-full bg-[#090909]">
        <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
          <path d="M1.3125 3.5L3.0625 5.25L5.6875 1.75" stroke="white" strokeWidth="1.3125" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="font-heading text-[9px] font-bold uppercase tracking-[0.5px] text-[#090909]">Selected</span>
    </div>
  );
}

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

  // Rent: choose Entire Building vs Unit/Room first, with the matching
  // field set rendering inside the same bordered card (Figma's "TypeCard",
  // nodes 619:8072 and 619:8838 — "PGRentSubFields"/"PGRentBuildingFields").
  return (
    <div className="flex flex-col gap-5 rounded border border-[rgba(198,198,205,0.35)] p-5">
      <span className={subLabelClassName}>What Are You Listing?</span>
      <div className="flex items-stretch gap-3">
        <button
          type="button"
          onClick={() => onChange({ listing_scope: "entire", meals_included: value.meals_included ?? true })}
          className={cn(
            "flex flex-1 flex-col items-start gap-2.5 rounded-md border-2 p-4 text-left",
            value.listing_scope === "entire" ? "border-[#090909] bg-[#f8f9fa]" : "border-[rgba(198,198,205,0.4)] bg-background",
          )}
        >
          <div className="flex w-full items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <EntireBuildingIcon />
              <span className="font-heading text-[14px] font-bold leading-5 text-[#1a1a1a]">Entire Building</span>
            </div>
            {value.listing_scope === "entire" && <SelectedBadge />}
          </div>
          <p className="font-body text-[12px] leading-[18px] text-[rgba(26,26,26,0.55)]">
            You own the whole PG / co-living property and are renting it out as a whole or managing tenants.
          </p>
        </button>
        <button
          type="button"
          onClick={() => onChange({ listing_scope: "unit", meals_included: value.meals_included ?? true })}
          className={cn(
            "flex flex-1 flex-col items-start gap-2.5 rounded-md border-2 p-4 text-left",
            value.listing_scope === "unit" ? "border-[#090909] bg-[#f8f9fa]" : "border-[rgba(198,198,205,0.4)] bg-background",
          )}
        >
          <div className="flex w-full items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <UnitRoomIcon />
              <span className="font-heading text-[14px] font-bold leading-5 text-[#1a1a1a]">Unit / Room</span>
            </div>
            {value.listing_scope === "unit" && <SelectedBadge />}
          </div>
          <p className="font-body text-[12px] leading-[18px] text-[rgba(26,26,26,0.55)]">
            You are listing a single room or bed in an existing PG or co-living space.
          </p>
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
            <MultiToggleGroup options={PG_AMENITY_OPTIONS} value={(value.amenities ?? []) as (typeof PG_AMENITY_OPTIONS)[number][]} onChange={(amenities) => onChange({ amenities })} />
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
            <MultiToggleGroup options={PG_AMENITY_OPTIONS} value={(value.amenities ?? []) as (typeof PG_AMENITY_OPTIONS)[number][]} onChange={(amenities) => onChange({ amenities })} />
          </LabeledField>
          <LabeledField label="Monthly Rent (₹)">
            <NumberInput value={value.monthly_rent} onChange={(monthly_rent) => onChange({ monthly_rent })} placeholder="e.g. 9,500" />
          </LabeledField>
        </>
      )}
    </div>
  );
}
