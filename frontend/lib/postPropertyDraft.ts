// lib/postPropertyDraft.ts
// Client-side-only "Save as Draft" for the Post Property wizard's Property
// Info step. A real backend draft (PATCH-able property row, resumable from
// the broker's Listings list) is blocked on price being required at create
// time — see PostPropertyWizard.tsx's comment — so this is a deliberately
// lighter stand-in: it survives a refresh/close of this browser only, not a
// different device, and isn't visible anywhere in the broker's dashboard.

import type { PropertyInfoValues } from "@/lib/validation/postProperty";

const DRAFT_STORAGE_KEY = "homigrow:post-property:info-draft";

export function saveInfoDraft(values: Partial<PropertyInfoValues>): void {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(values));
  } catch {
    // localStorage can throw (private browsing, storage disabled, quota) —
    // a failed draft save shouldn't block the broker from continuing.
  }
}

export function loadInfoDraft(): Partial<PropertyInfoValues> | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<PropertyInfoValues>) : null;
  } catch {
    return null;
  }
}

export function clearInfoDraft(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Nothing to do if this fails — worst case a stale draft lingers.
  }
}
