// lib/stores/searchHistory.ts
// Client-only "Recent Searches" list for the nav search overlay (Figma
// node 28:510, "search history"). There is no backend concept of search
// history — this is a pure UI convenience, persisted to localStorage the
// same way lib/stores/compare.ts persists the compare selection.

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type RecentSearch = {
  id: string;
  label: string;
  subtitle: string;
  href: string;
};

const MAX_RECENT_SEARCHES = 5;

type SearchHistoryState = {
  searches: RecentSearch[];
  record: (entry: Omit<RecentSearch, "id">) => void;
  clear: () => void;
};

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set, get) => ({
      searches: [],
      record: (entry) => {
        const deduped = get().searches.filter((existing) => existing.href !== entry.href);
        const next: RecentSearch = { id: `${Date.now()}-${entry.href}`, ...entry };
        set({ searches: [next, ...deduped].slice(0, MAX_RECENT_SEARCHES) });
      },
      clear: () => set({ searches: [] }),
    }),
    {
      name: "homigrow-search-history",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
