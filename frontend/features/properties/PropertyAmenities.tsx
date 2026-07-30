// features/properties/PropertyAmenities.tsx
// Curated amenities grid (Figma node 31:1926). Figma's demo listing uses a
// bespoke icon per amenity; since amenities are free-form strings from the
// backend (Property.amenities is a plain string list, no per-amenity icon
// mapping exists), every tile uses the same check-circle glyph instead of
// guessing an icon per label.

import { CheckCircle2 } from "lucide-react";

export function PropertyAmenities({ amenities }: { amenities: string[] }) {
  if (amenities.length === 0) return null;

  return (
    <div className="flex flex-col gap-10">
      <p className="font-heading text-[12px] font-bold uppercase tracking-[1.2px] text-brand-green-700">Curated Amenities</p>
      <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4">
        {amenities.map((amenity) => (
          <div key={amenity} className="flex flex-col gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-brand-secondary-400">
              <CheckCircle2 className="size-5 text-brand-primary-600" />
            </div>
            <p className="font-heading text-[12px] font-bold uppercase tracking-[1.2px] text-brand-primary-600">{amenity}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
