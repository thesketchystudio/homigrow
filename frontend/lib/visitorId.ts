// lib/visitorId.ts
// Anonymous per-browser id used only to dedupe property-view counts on the
// server (one view per visitor per property per hour). It is a random value
// with no link to any account; the server stores a keyed hash of it.

const STORAGE_KEY = "homigrow-visitor-id";

export function getVisitorId(): string | undefined {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, created);
    return created;
  } catch {
    // Storage blocked (private mode, disabled cookies) — the server falls
    // back to identifying the visitor by IP + user-agent.
    return undefined;
  }
}
