// features/properties/compare/ComparisonTable.tsx
// Builds the Overview/Amenities/Location/Investment accordion rows from
// real PropertyRead data. Figma's Comparison screen
// (node 150:15348) also shows Possession, Airport distance, and Nearby
// Schools rows, plus a fixed 8-item amenity checklist (Pool/Gym/Concierge/
// etc.) and an Investment section (Rental Yield/Appreciation/RERA
// Status) — none of those have any backing field on the Property model.
// Per the decision made with the user: Possession/Airport/Nearby Schools
// are omitted outright, Amenities uses the real per-property amenity
// lists (the sorted union across the compared properties, not Figma's
// fixed checklist), and Investment renders as an honest "Coming soon"
// placeholder rather than fabricated numbers — same pattern as the
// Details page's Vaastu/Market Context sections.

import { Bath, BedDouble, Building2, Car, Check, Compass, IndianRupee, Layers, MapPin, Ruler } from "lucide-react";

import { ComparisonAccordionSection, type ComparisonRow } from "./ComparisonAccordionSection";
import type { PropertyRead } from "@/lib/api/endpoints/properties";
import { PROPERTY_TYPE_LABELS } from "@/lib/enums";
import { formatINR } from "@/lib/utils";

function pricePerSqft(property: PropertyRead): string {
  if (!property.area_sqft || property.area_sqft === 0) return "—";
  return `₹${Math.round(property.price / property.area_sqft).toLocaleString("en-IN")}`;
}

export function ComparisonTable({ properties }: { properties: PropertyRead[] }) {
  const overviewRows: ComparisonRow[] = [
    {
      key: "price",
      label: "Listed Price",
      icon: <IndianRupee className="size-3" />,
      values: properties.map((p) => formatINR(p.price)),
      emphasize: true,
    },
    { key: "price_per_sqft", label: "Price / Sq.ft", icon: <IndianRupee className="size-3" />, values: properties.map(pricePerSqft) },
    {
      key: "property_type",
      label: "Property Type",
      icon: <Building2 className="size-3" />,
      values: properties.map((p) => PROPERTY_TYPE_LABELS[p.property_type] ?? p.property_type),
    },
    {
      key: "area",
      label: "Area (sq.ft)",
      icon: <Ruler className="size-3" />,
      values: properties.map((p) => (p.area_sqft ? `${p.area_sqft.toLocaleString("en-IN")} sqft` : "—")),
    },
    { key: "bedrooms", label: "Bedrooms", icon: <BedDouble className="size-3" />, values: properties.map((p) => (p.bhk ? `${p.bhk} BHK` : "—")) },
    { key: "bathrooms", label: "Bathrooms", icon: <Bath className="size-3" />, values: properties.map((p) => p.bathrooms ?? "—") },
    {
      key: "floor",
      label: "Floor",
      icon: <Layers className="size-3" />,
      values: properties.map((p) => (p.floor != null ? (p.total_floors ? `${p.floor} of ${p.total_floors}` : `${p.floor}`) : "—")),
    },
    { key: "facing", label: "Facing", icon: <Compass className="size-3" />, values: properties.map((p) => p.facing ?? "—") },
    {
      key: "parking",
      label: "Parking",
      icon: <Car className="size-3" />,
      values: properties.map((p) => (p.parking_slots != null ? `${p.parking_slots} slots` : "—")),
    },
  ];

  const allAmenities = Array.from(new Set(properties.flatMap((p) => p.amenities))).sort();
  const amenityRows: ComparisonRow[] = allAmenities.map((amenity) => ({
    key: amenity,
    label: amenity,
    values: properties.map((p, i) => (p.amenities.includes(amenity) ? <Check key={i} className="text-brand-primary-400 size-4" /> : "—")),
  }));

  const locationRows: ComparisonRow[] = [
    {
      key: "metro_distance",
      label: "Metro Distance",
      icon: <MapPin className="size-3" />,
      values: properties.map((p) => (p.metro_distance_km != null ? `${p.metro_distance_km} km` : "—")),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <ComparisonAccordionSection title="Overview" rows={overviewRows} />
      <ComparisonAccordionSection title="Amenities" rows={amenityRows} />
      <ComparisonAccordionSection title="Location" rows={locationRows} />
      <ComparisonAccordionSection title="Investment" rows={[]} comingSoon />
    </div>
  );
}
