// features/auth/preferences/CityMultiSelectChips.tsx
// "Where would you like to build your future?" — a search bar over
// ChipMultiSelect, reusing the same INDIAN_CITIES list the signup
// form's City dropdown already uses. Always shows selected cities first;
// the rest of the list is filtered down to a manageable count by search
// text rather than rendering all 93 cities as chips at once.

import { useState } from "react";
import { Search } from "lucide-react";
import { CITY_NAMES } from "@/lib/data/indian-cities";
import { ChipMultiSelect } from "@/features/auth/preferences/ChipMultiSelect";

const UNFILTERED_VISIBLE_COUNT = 14;

type CityMultiSelectChipsProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

export function CityMultiSelectChips({ value, onChange }: CityMultiSelectChipsProps) {
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const remaining = CITY_NAMES.filter((city) => !value.includes(city) && (query === "" || city.toLowerCase().includes(query)));
  const visibleRemaining = query === "" ? remaining.slice(0, UNFILTERED_VISIBLE_COUNT) : remaining;
  const options = [...value, ...visibleRemaining].map((city) => ({ value: city, label: city }));

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center gap-3 rounded-lg bg-brand-secondary-400 px-4 py-2">
        <Search size={18} className="text-brand-primary-300" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search cities or areas…"
          className="w-full bg-transparent font-body text-[14px] text-brand-primary-500 placeholder:text-brand-primary-300 focus:outline-none"
        />
      </div>
      <ChipMultiSelect options={options} value={value} onChange={onChange} />
    </div>
  );
}
