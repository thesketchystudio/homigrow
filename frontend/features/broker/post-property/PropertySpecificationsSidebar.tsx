// features/broker/post-property/PropertySpecificationsSidebar.tsx
// Property Info Step's sticky right-column card (Figma "Specifications") —
// bedrooms/bathrooms, total area, and curated amenities. Only shown for
// residential property types (apartment/villa/independent_house); Plot,
// Land, and PG have their own type-specific fields instead.

import { useState } from "react";
import { type UseFormRegisterReturn } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { ChecklistGroup, type ChecklistOption } from "@/features/auth/preferences/ChecklistGroup";

type PropertySpecificationsSidebarProps = {
  bhkRegister: UseFormRegisterReturn;
  bhkError?: string;
  bathroomsRegister: UseFormRegisterReturn;
  bathroomsError?: string;
  areaSqftRegister: UseFormRegisterReturn;
  areaSqftError?: string;
  amenityOptions: ChecklistOption[];
  amenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
};

export function PropertySpecificationsSidebar({
  bhkRegister,
  bhkError,
  bathroomsRegister,
  bathroomsError,
  areaSqftRegister,
  areaSqftError,
  amenityOptions,
  amenities,
  onAmenitiesChange,
}: PropertySpecificationsSidebarProps) {
  const [customAmenity, setCustomAmenity] = useState("");
  const knownValues = new Set(amenityOptions.map((option) => option.value));
  const customAmenities = amenities.filter((amenity) => !knownValues.has(amenity));

  const addCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (trimmed && !amenities.includes(trimmed)) onAmenitiesChange([...amenities, trimmed]);
    setCustomAmenity("");
  };

  const removeCustomAmenity = (amenity: string) => {
    onAmenitiesChange(amenities.filter((value) => value !== amenity));
  };

  return (
    <div className="flex flex-col gap-6 rounded-lg bg-brand-secondary-100 p-10 drop-shadow-[0px_4px_2px_rgba(0,0,0,0.1)] lg:sticky lg:top-6">
      <h2 className="font-heading text-[16px] font-bold text-brand-primary-600">Specifications</h2>

      <div className="flex flex-col gap-3.5">
        <span className="font-heading text-[10px] font-bold uppercase tracking-[1px] text-brand-primary-600/80">Space Distribution</span>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 rounded bg-brand-secondary-400 p-3.5">
            <span className="font-body text-[13px] text-brand-primary-600/80">Bedrooms</span>
            <input
              type="number"
              placeholder="—"
              aria-invalid={Boolean(bhkError)}
              className="w-full bg-transparent font-heading text-[20px] font-bold text-brand-primary-600 outline-none"
              {...bhkRegister}
            />
          </div>
          <div className="flex flex-col gap-1 rounded bg-brand-secondary-400 p-3.5">
            <span className="font-body text-[13px] text-brand-primary-600/80">Bathrooms</span>
            <input
              type="number"
              placeholder="—"
              aria-invalid={Boolean(bathroomsError)}
              className="w-full bg-transparent font-heading text-[20px] font-bold text-brand-primary-600 outline-none"
              {...bathroomsRegister}
            />
          </div>
        </div>
        {(bhkError || bathroomsError) && <p className="text-[12px] text-destructive">{bhkError ?? bathroomsError}</p>}
      </div>

      <div className="flex flex-col gap-3.5">
        <span className="font-heading text-[10px] font-bold uppercase tracking-[1px] text-brand-primary-600/80">Total Area</span>
        <div className="flex items-center gap-2 rounded bg-brand-secondary-400 p-3.5">
          <input
            type="number"
            placeholder="e.g. 1200"
            aria-invalid={Boolean(areaSqftError)}
            className="w-full bg-transparent font-heading text-[20px] font-bold text-brand-secondary-900 outline-none"
            {...areaSqftRegister}
          />
          <span className="font-heading text-[14px] font-bold text-brand-primary-600/80">SQ FT</span>
        </div>
        {areaSqftError && <p className="text-[12px] text-destructive">{areaSqftError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-heading text-[10px] font-bold uppercase tracking-[1px] text-brand-primary-600/80">Curated Amenities</span>
        <ChecklistGroup
          options={amenityOptions}
          value={amenities}
          onChange={onAmenitiesChange}
          className="gap-2.5"
          rowClassName="gap-2.5 py-0"
          checkboxClassName="size-[18px] rounded-sm border-[#c6c6cd] data-[state=checked]:border-brand-primary-700 data-[state=checked]:bg-brand-primary-700 data-[state=checked]:text-background"
          labelClassName="font-heading text-[15px] font-medium text-brand-primary-600"
        />
        {customAmenities.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            {customAmenities.map((amenity) => (
              <button
                key={amenity}
                type="button"
                onClick={() => removeCustomAmenity(amenity)}
                className="flex items-center gap-1.5 rounded bg-brand-primary-600 px-3 py-1.5 font-body text-[12px] font-medium text-brand-secondary-400"
              >
                {amenity}
                <X size={12} strokeWidth={3} />
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <input
            value={customAmenity}
            onChange={(event) => setCustomAmenity(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustomAmenity();
              }
            }}
            placeholder="Add your own"
            className="w-full bg-transparent font-body text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button type="button" onClick={addCustomAmenity} aria-label="Add amenity" className="text-muted-foreground">
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
