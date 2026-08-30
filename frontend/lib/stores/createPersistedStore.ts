// lib/stores/createPersistedStore.ts
// Wraps zustand's create + persist + createJSONStorage(localStorage)
// wiring, shared by every client-only store that persists its state across
// reloads (lib/stores/compare.ts, lib/stores/searchHistory.ts).

import { create, type StateCreator } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export function createPersistedStore<T>(name: string, initializer: StateCreator<T>) {
  return create<T>()(
    persist(initializer, {
      name,
      storage: createJSONStorage(() => localStorage),
    }),
  );
}
