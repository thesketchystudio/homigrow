// features/broker/post-property/PropertyLocationMapPreview.tsx
// Location Details' map (Figma "JV Property" node 619:614 / "Landing
// Screen - 01" node 612:924) — a search bar + interactive map with a
// dropped pin, replacing address entry entirely. Building that needs a
// geocoding/places provider (Google Maps, Mapbox, ...) and a backend change
// to populate Property.location (a PostGIS column that already exists but
// nothing writes to yet) — a real scope decision, not made here. Rendered
// as an honest coming-soon card instead, matching the same pattern
// PropertyVaastuChecker uses for its own not-yet-built Figma section; the
// structured Address/Locality/City/State/Pincode fields above stay the
// real, functional way this data is captured until a map ships.

import { MapPin } from "lucide-react";

export function PropertyLocationMapPreview() {
  return (
    <div className="flex h-[320px] w-full flex-col items-center justify-center gap-3 rounded bg-brand-secondary-400 text-center">
      <MapPin className="size-6 text-brand-primary-300" />
      <p className="font-heading text-[14px] font-bold text-brand-primary-600">Map view coming soon</p>
      <p className="max-w-sm font-body text-[12px] text-brand-primary-300">
        Search-and-pin location picking isn&apos;t built yet — use the address fields above for now.
      </p>
    </div>
  );
}
