// features/admin/queryKeys.ts
// React Query keys for admin data. Moderation and suspension both change
// listing counts, so mutations invalidate the whole ADMIN_ROOT_KEY tree
// rather than guessing which individual views are affected.

export const ADMIN_ROOT_KEY = ["admin"] as const;
export const ADMIN_SUMMARY_KEY = [...ADMIN_ROOT_KEY, "summary"] as const;
export const ADMIN_PROPERTIES_KEY = [...ADMIN_ROOT_KEY, "properties"] as const;
export const ADMIN_MODERATION_STATS_KEY = [...ADMIN_ROOT_KEY, "moderation-stats"] as const;
export const ADMIN_USERS_KEY = [...ADMIN_ROOT_KEY, "users"] as const;
