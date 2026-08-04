// lib/stores/compare.ts
// Client-only "properties queued for comparison" selection (10_Phase_3.md
// P3-T42). Unlike Saved, GET /properties/compare is stateless — the backend
// takes ids as a query param with no server-side "compare list" — so the
// selection itself lives here, persisted to localStorage (unlike
// lib/stores/auth.ts's memory-only token: this is a UI selection, not a
// credential, so persisting it across reloads is safe and desirable).

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { MAX_COMPARE_IDS } from "@/lib/api/endpoints/properties";
import { toast } from "@/lib/toast";

export { MAX_COMPARE_IDS };

type CompareState = {
  ids: string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const { ids } = get();
        if (ids.includes(id)) {
          set({ ids: ids.filter((existing) => existing !== id) });
          return;
        }
        if (ids.length >= MAX_COMPARE_IDS) {
          toast.error(`You can compare up to ${MAX_COMPARE_IDS} properties at a time.`);
          return;
        }
        set({ ids: [...ids, id] });
      },
      remove: (id) => set({ ids: get().ids.filter((existing) => existing !== id) }),
      clear: () => set({ ids: [] }),
    }),
    {
      name: "homigrow-compare",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
