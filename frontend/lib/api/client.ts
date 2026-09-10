// lib/api/client.ts
// Single fetch wrapper for every backend call: attaches the in-memory access
// token, normalizes the {"error": {code, message, fields?}} envelope into a
// typed ApiError, and parses JSON/empty responses uniformly. On a 401 from
// a protected endpoint it silently retries once via /auth/refresh. Requests
// under /auth/ are never retried this way — they carry no access token, and
// a 401 there (e.g. bad login credentials) isn't a token-expiry signal.
//
// Every request carries a default timeout (DEFAULT_REQUEST_TIMEOUT_MS /
// UPLOAD_TIMEOUT_MS below) so a stalled socket (sleep/wake, dropped Wi-Fi)
// fails that one call with an ApiError-worthy rejection instead of hanging
// forever — this is a plain per-request bound, unrelated to login state: it
// only ever aborts *that* request. The one path where a timeout does end a
// session is /auth/refresh specifically, via REFRESH_TIMEOUT_MS below, since
// every other request awaits its shared refreshPromise (see performRefresh).
//
// `useAuthStore` is imported directly (not via endpoints/auth.ts, which
// would create a runtime import cycle back into this file); `TokenResponse`
// is a type-only import so it carries no runtime dependency.
//
// Cross-tab refresh coordination: refreshAccessToken()'s in-tab single-flight
// promise only dedupes concurrent calls within one page's JS memory. Two
// separate tabs of the same logged-in session (e.g. a property link opened
// in a new tab) each have their own independent copy of that promise, so
// both can end up calling /auth/refresh around the same moment — the
// refresh cookie is single-use and rotates on every call (P2-T05 reuse
// detection), so the second tab's call looks like a replay and the backend
// revokes the *entire* session, silently logging every tab out. This is a
// real, previously-unfixed instance of the "usual" full-reload/rate-limit
// login-bounce bug class, just triggered by concurrent tabs instead of a
// plain <a> full page reload. Fixed with the Web Locks API (serializes the
// refresh across tabs of the same origin) plus a BroadcastChannel relay so
// a tab that loses the lock race reuses the winning tab's fresh token
// instead of burning the now-already-rotated cookie a second time. Neither
// mechanism persists the access token to disk — BroadcastChannel messages
// and the in-memory cache variable are gone on reload, consistent with the
// existing memory-only-access-token security stance (authStore.ts).

import { useAuthStore } from "@/lib/stores/auth";
import type { TokenResponse } from "@/lib/api/endpoints/auth";

const REFRESH_LOCK_NAME = "homigrow-auth-refresh";
const RECENT_REFRESH_WINDOW_MS = 5000;
const REFRESH_TIMEOUT_MS = 10000;
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;
const UPLOAD_TIMEOUT_MS = 60000;

const authChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(REFRESH_LOCK_NAME) : null;

let recentRefresh: { accessToken: string; user: TokenResponse["user"]; at: number } | null = null;

authChannel?.addEventListener("message", (event: MessageEvent) => {
  if (event.data?.type === "refreshed") {
    recentRefresh = { accessToken: event.data.accessToken, user: event.data.user, at: Date.now() };
    useAuthStore.getState().setAuth(event.data.user, event.data.accessToken);
  }
});

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

// Combines a caller-supplied AbortSignal (if any) with a default timeout so
// no request can hang forever on a stalled socket, without dropping a
// caller's own cancellation (e.g. a component unmounting mid-request).
function boundedSignal(externalSignal: AbortSignal | undefined, timeoutMs: number): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  return externalSignal ? AbortSignal.any([externalSignal, timeoutSignal]) : timeoutSignal;
}

function rawFetch(path: string, options: RequestOptions, accessToken: string | null) {
  return fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    credentials: "include",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: boundedSignal(options.signal, DEFAULT_REQUEST_TIMEOUT_MS),
  });
}

// No Content-Type header here — the browser sets multipart/form-data with
// the correct boundary itself when the body is a FormData instance; setting
// it manually strips that boundary and the server can't parse the request.
// A longer timeout than rawFetch's default since these are file uploads.
function rawFetchMultipart(path: string, formData: FormData, accessToken: string | null) {
  return fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    credentials: "include",
    body: formData,
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  });
}

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  // Another tab may have refreshed (and rotated the shared cookie) while
  // this tab was waiting for the cross-tab lock below — reuse that result
  // instead of sending a second request the backend would see as a replay.
  if (recentRefresh && Date.now() - recentRefresh.at < RECENT_REFRESH_WINDOW_MS) {
    return recentRefresh.accessToken;
  }

  // A bounded timeout here is load-bearing, not just a nicety: refreshAccessToken()
  // below caches this call's promise in the module-level refreshPromise single-flight
  // lock, which only clears once this promise settles. A tab backgrounded for a long
  // stretch (sleep/wake, Wi-Fi handoff) can leave the underlying socket stalled with
  // no error and no data — an un-timed-out fetch here would then never resolve or
  // reject, permanently wedging refreshPromise and, via the Web Locks request in
  // refreshAccessToken(), the cross-tab refresh lock too. Every subsequent request
  // that hits a 401 (e.g. the leads table's query, or an upload button's submit
  // handler awaiting this same promise) would then hang forever instead of failing.
  const response = await rawFetch(
    REFRESH_PATH,
    { method: "POST", signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS) },
    null,
  );
  if (!response.ok) {
    useAuthStore.getState().clear();
    return null;
  }
  const data = (await response.json()) as TokenResponse;
  useAuthStore.getState().setAuth(data.user, data.access_token);
  recentRefresh = { accessToken: data.access_token, user: data.user, at: Date.now() };
  authChannel?.postMessage({ type: "refreshed", accessToken: data.access_token, user: data.user });
  return data.access_token;
}

// Dedupes concurrent 401s into a single /auth/refresh call; clears the
// authStore (logout everywhere) if the refresh cookie itself is invalid.
// Exported so lib/auth/session.ts's first-load session bootstrap shares
// this exact in-flight promise instead of firing its own separate
// /auth/refresh call — two concurrent calls each carrying the same
// one-time-use refresh-token cookie would otherwise trip the backend's
// reuse-detection (the second one looks like a replayed, already-rotated
// token) and revoke the whole session. The Web Locks request serializes
// this same race across browser tabs, not just within one; navigator.locks
// isn't in every browser's DOM lib typings, so it's accessed defensively.
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    const locks = typeof navigator !== "undefined" ? (navigator as Navigator & { locks?: LockManager }).locks : undefined;
    const run: () => Promise<string | null> = locks
      ? async () => await locks.request(REFRESH_LOCK_NAME, () => performRefresh())
      : performRefresh;
    refreshPromise = run()
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

async function processResponse<T>(response: Response): Promise<T> {
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

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken;
  let response = await rawFetch(path, options, accessToken);

  if (response.status === 401 && !path.startsWith("/auth/")) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await rawFetch(path, options, newToken);
    }
  }

  return processResponse<T>(response);
}

// For multipart/file-upload endpoints (currently just broker verification
// documents) — same auth-header/401-retry contract as apiRequest, just a
// FormData body instead of a JSON one.
export async function apiRequestMultipart<T>(path: string, formData: FormData): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken;
  let response = await rawFetchMultipart(path, formData, accessToken);

  if (response.status === 401 && !path.startsWith("/auth/")) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await rawFetchMultipart(path, formData, newToken);
    }
  }

  return processResponse<T>(response);
}
