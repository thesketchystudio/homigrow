// features/broker/post-property/PropertySpecificationsSidebar.tsx
// Property Info Step's sticky right-column card (Figma "Specifications") —
// bedrooms/bathrooms, total area, and curated amenities. Only shown for
// residential property types (apartment/villa/independent_house); Plot,
// Land, and PG have their own type-specific fields instead.

import { useState } from "react";
import { type UseFormRegisterReturn } from "react-hook-form";
import { Plus } from "lucide-react";
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

  const addCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (trimmed && !amenities.includes(trimmed)) onAmenitiesChange([...amenities, trimmed]);
    setCustomAmenity("");
  };

  return (
    <div className="flex flex-col gap-6 rounded-md border border-border p-6 lg:sticky lg:top-6">
      <h2 className="font-heading text-[16px] font-bold text-foreground">Specifications</h2>

      <div className="flex flex-col gap-3">
        <span className="font-body font-bold text-[12px] uppercase tracking-[1px] text-muted-foreground">Space Distribution</span>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2 rounded-md border border-border p-3">
            <span className="font-body text-[11px] uppercase tracking-[1px] text-muted-foreground">Bedrooms</span>
            <input
              type="number"
              placeholder="—"
              aria-invalid={Boolean(bhkError)}
              className="w-full bg-transparent font-heading text-[18px] font-bold text-foreground outline-none"
              {...bhkRegister}
            />
          </div>
          <div className="flex flex-col gap-2 rounded-md border border-border p-3">
            <span className="font-body text-[11px] uppercase tracking-[1px] text-muted-foreground">Bathrooms</span>
            <input
              type="number"
              placeholder="—"
              aria-invalid={Boolean(bathroomsError)}
              className="w-full bg-transparent font-heading text-[18px] font-bold text-foreground outline-none"
              {...bathroomsRegister}
            />
          </div>
        </div>
        {(bhkError || bathroomsError) && <p className="text-[12px] text-destructive">{bhkError ?? bathroomsError}</p>}
      </div>

      <div className="flex flex-col gap-3">
        <span className="font-body font-bold text-[12px] uppercase tracking-[1px] text-muted-foreground">Total Area</span>
        <div className="flex items-center gap-2 rounded-md border border-border p-3">
          <input
            type="number"
            placeholder="e.g. 1200"
            aria-invalid={Boolean(areaSqftError)}
            className="w-full bg-transparent font-heading text-[18px] font-bold text-foreground outline-none"
            {...areaSqftRegister}
          />
          <span className="font-body text-[12px] text-muted-foreground">SQ FT</span>
        </div>
        {areaSqftError && <p className="text-[12px] text-destructive">{areaSqftError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-body font-bold text-[12px] uppercase tracking-[1px] text-muted-foreground">Curated Amenities</span>
        <ChecklistGroup options={amenityOptions} value={amenities} onChange={onAmenitiesChange} className="gap-0" />
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
