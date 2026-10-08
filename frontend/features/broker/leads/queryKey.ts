// features/broker/leads/queryKey.ts
// Shared react-query key for the broker's lead list, so the table and both
// action dialogs invalidate the exact same cache entry after a mutation.

export const LEADS_QUERY_KEY = ["broker-leads"] as const;
