// features/properties/PropertyAmenities.tsx
// Curated amenities list (Figma node 31:1926): an icon tile beside each
// uppercase label, laid out in two columns. Amenities are free-form strings
// from the backend, so the icon is chosen by keyword (lib/amenity-icons.ts)
// with a generic check mark as the fallback.

import { amenityIcon } from "@/lib/amenity-icons";

export function PropertyAmenities({ amenities }: { amenities: string[] }) {
  if (amenities.length === 0) return null;

  return (
    <div className="flex flex-col gap-10">
      <p className="font-heading text-[12px] font-bold uppercase tracking-[1.2px] text-brand-green-700">Curated Amenities</p>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
        {amenities.map((amenity) => {
          const Icon = amenityIcon(amenity);
          return (
            <div key={amenity} className="flex items-center gap-2">
              <div className="flex shrink-0 items-center justify-center rounded-xl bg-brand-secondary-400 p-2">
                <Icon className="size-5 text-brand-primary-600" strokeWidth={1.75} />
              </div>
              <p className="font-heading text-[12px] font-bold uppercase tracking-[1.2px] text-brand-primary-600">{amenity}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
