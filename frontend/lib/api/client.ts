// lib/api/client.ts
// Single fetch wrapper for every backend call: attaches the in-memory access
// token, normalizes the {"error": {code, message, fields?}} envelope into a
// typed ApiError, and parses JSON/empty responses uniformly. On a 401 from
// a protected endpoint it silently retries once via /auth/refresh. Requests
// under /auth/ are never retried this way — they carry no access token, and
// a 401 there (e.g. bad login credentials) isn't a token-expiry signal.
//
// `useAuthStore` is imported directly (not via endpoints/auth.ts, which
// would create a runtime import cycle back into this file); `TokenResponse`
// is a type-only import so it carries no runtime dependency.

import { useAuthStore } from "@/lib/stores/auth";
import type { TokenResponse } from "@/lib/api/endpoints/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
const REFRESH_PATH = "/auth/refresh";

export class ApiError extends Error {
  code: string;
  status: number;
  fields?: Record<string, string>;

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

function rawFetch(path: string, options: RequestOptions, accessToken: string | null) {
  return fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    credentials: "include",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });
}

let refreshPromise: Promise<string | null> | null = null;

// Dedupes concurrent 401s into a single /auth/refresh call; clears the
// authStore (logout everywhere) if the refresh cookie itself is invalid.
// Exported so lib/auth/session.ts's first-load session bootstrap shares
// this exact in-flight promise instead of firing its own separate
// /auth/refresh call — two concurrent calls each carrying the same
// one-time-use refresh-token cookie would otherwise trip the backend's
// reuse-detection (the second one looks like a replayed, already-rotated
// token) and revoke the whole session.
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = rawFetch(REFRESH_PATH, { method: "POST" }, null)
      .then(async (response) => {
        if (!response.ok) {
          useAuthStore.getState().clear();
          return null;
        }
        const data = (await response.json()) as TokenResponse;
        useAuthStore.getState().setAuth(data.user, data.access_token);
        return data.access_token;
      })
      .catch(() => {
        useAuthStore.getState().clear();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken;
  let response = await rawFetch(path, options, accessToken);

  if (response.status === 401 && !path.startsWith("/auth/")) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await rawFetch(path, options, newToken);
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = data?.error;
    throw new ApiError(
      response.status,
      error?.code ?? "UNKNOWN_ERROR",
      error?.message ?? "Something went wrong. Please try again.",
      error?.fields,
    );
  }

  return data as T;
}
