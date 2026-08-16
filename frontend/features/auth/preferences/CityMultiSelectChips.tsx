// features/auth/preferences/CityMultiSelectChips.tsx
// "Where would you like to build your future?" — a dropdown (same
// CITY_NAMES list and underline-select styling as the signup form's City
// field) that adds a city to the selection on pick. Selected cities render
// below as black-fill tags with a remove "X", matching PillGroup's
// "compact" variant (bedroom-count pills in PropertyTypeStep). Nothing
// renders below the dropdown until at least one city is selected.

import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CITY_NAMES } from "@/lib/data/indian-cities";

type CityMultiSelectChipsProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

export function CityMultiSelectChips({ value, onChange }: CityMultiSelectChipsProps) {
  const remaining = CITY_NAMES.filter((city) => !value.includes(city));

  const addCity = (city: string) => {
    if (!value.includes(city)) onChange([...value, city]);
  };

  const removeCity = (city: string) => {
    onChange(value.filter((v) => v !== city));
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <Select value="" onValueChange={addCity}>
        <SelectTrigger
          className="h-auto w-full rounded-none border-0 border-b border-foreground bg-transparent px-0 pb-[5px] pt-1 font-heading text-[20px] leading-[28px] text-foreground shadow-none focus-visible:ring-0 focus:border-brand-primary-600"
        >
          <SelectValue placeholder="Select a city to add" />
        </SelectTrigger>
        <SelectContent>
          {remaining.map((city) => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value.length > 0 && (
        <div className="flex w-full flex-wrap items-stretch gap-2">
          {value.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => removeCity(city)}
              className="flex items-center gap-1.5 rounded bg-brand-primary-600 px-6 py-2 font-heading text-[16px] font-medium text-brand-secondary-400"
            >
              {city}
              <X size={12} strokeWidth={3} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
