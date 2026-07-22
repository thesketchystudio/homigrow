// features/auth/preferences/PropertyTypeCardGrid.tsx
// "Preferred Type of Home" — 8 image cards, multi-select (Figma
// "PropCard" nodes, node 457:398). Figma itself reuses one placeholder
// photo across all 8 cards rather than 8 distinct images, so the built
// version does the same: public/onboarding/property-placeholder.png,
// downloaded once since Figma asset URLs expire after 7 days.

import Image from "next/image";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const PROPERTY_TYPES = [
  { value: "modernist_villas", label: "Modernist Villas" },
  { value: "luxury_penthouses", label: "Luxury Penthouses" },
  { value: "estates_mansions", label: "Estates & Mansions" },
  { value: "studio_lofts", label: "Studio Lofts" },
  { value: "serviced_apartments", label: "Serviced Apartments" },
  { value: "plots_land", label: "Plots & Land" },
  { value: "commercial_spaces", label: "Commercial Spaces" },
  { value: "farmhouses", label: "Farmhouses" },
] as const;

type PropertyTypeCardGridProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

export function PropertyTypeCardGrid({ value, onChange }: PropertyTypeCardGridProps) {
  const toggle = (optionValue: string) => {
    onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]);
  };

  return (
    <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
      {PROPERTY_TYPES.map((type) => {
        const selected = value.includes(type.value);
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => toggle(type.value)}
            className="relative aspect-[241/261] overflow-hidden rounded-lg"
          >
            <Image src="/onboarding/property-placeholder.png" alt="" fill className="object-cover" sizes="240px" />
            <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/85 to-transparent p-4">
              <div className="flex justify-end">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded",
                    selected ? "bg-brand-green-400" : "border border-white/30 bg-white/[0.12]",
                  )}
                >
                  {selected ? <Check size={14} className="text-brand-primary-800" /> : <Plus size={12} className="text-background" />}
                </div>
              </div>
              <p className="font-heading text-[24px] leading-[30px] tracking-[-0.5px] text-background">{type.label}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
