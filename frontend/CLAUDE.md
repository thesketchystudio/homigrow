## Frontend Status

Frontend-specific ongoing status — loads automatically when working
under `frontend/`. See the root `CLAUDE.md` for project-wide rules
(git workflow, secrets, coding standards) and shared Phase 1 history;
see `backend/CLAUDE.md` for backend status.

### Frontend Phase 2 (on `feature/phase_2_frontend`, cut from `dev`)
- **P2-T15/T16 shipped 2026-07-14** — signup + email-OTP verification
  flow, from Figma node `416:155` ("Client - Sign up"): 3-step wizard
  (`features/auth/SignupWizard.tsx` — role select → form → OTP verify,
  implemented as local component state, not separate routes, since the
  design shares one continuous progress bar across all 3 and no step
  after the first needs to be independently linkable). New
  `app/(auth)/layout.tsx` shell (distinct from the `(client)` portal's
  TopNavBar/Footer). New `components/forms/` underline-style field
  primitives (`AuthTextField`/`AuthPhoneField`/`AuthPasswordField`/
  `AuthCheckboxField` + a lazy-`zxcvbn`-loaded `PasswordStrengthMeter`)
  — a different visual language from the boxed `components/ui/input.tsx`
  shadcn primitive, documented in `04_Frontend_Architecture.md` as
  shared across auth/post-property/profile forms, so these live in
  `components/forms/` not `features/auth/`. New `lib/api/client.ts`
  (minimal fetch wrapper, no auth header/refresh yet — public endpoints
  only) + `lib/api/endpoints/auth.ts` (typed functions for all `/auth`
  routes) + `lib/validation/auth.ts` (zod, mirrors
  `app/schemas/auth.py`) + `app/providers.tsx` (`QueryClientProvider`,
  first real TanStack Query use, ADR-007). Added `UserRole`/`OTPPurpose`
  to `lib/enums.ts` (was missing `UserRole` entirely). New deps: zod,
  @hookform/resolvers, zustand (unused so far, added ahead of T17),
  @tanstack/react-query, zxcvbn. `tsc`/`eslint` clean (one real issue
  fixed: a `react-hooks/set-state-in-effect` violation in
  `PasswordStrengthMeter`). Full writeup:
  `docs/implementation/frontend/Phase_2_Implementation.md`.
  **Playwright-verified live 2026-07-14** (once CORS above closed the
  gap that blocked it): ran `feature/phase_2_backend` and this branch
  simultaneously (a throwaway `git worktree` for one of them) and drove
  the actual role-select → form → OTP-verify flow against the real
  backend and the Supabase dev DB. Screenshots diffed against Figma
  nodes 416:197, 416:1185, 418:874/878 — close match, including the
  wrong-OTP error state matching pixel-for-pixel. Real network calls
  confirmed: `POST /auth/signup` → 201, `POST /auth/otp/verify` → 401
  (wrong code) then 204 (correct code, read from the backend's dev-mode
  OTP log), `is_email_verified` flipped true in the DB (row deleted
  after verifying). Found and fixed two minor text gaps this
  verification surfaced: `app/layout.tsx`'s metadata title was still
  the `create-next-app` scaffold default ("Create Next App"), and
  `AuthProgressBar.tsx`'s eyebrow label read "Onboarding" instead of
  the Figma copy's "Onboarding Sequence" — both now match.
  **`/login` shipped 2026-07-15** — see the entry directly below; the
  earlier `/login` 404 gap and its blocking of P2-T17/T18 no longer
  applies.
- **Login screen + welcome/chooser screen shipped 2026-07-15** — from
  Figma nodes `423:3651` ("Client - Log in") and `423:3792` (the
  pre-signup/login "landing" chooser frame, found via the `use_figma`
  Plugin API route documented in memory `figma-metadata-canvas-truncation`).
  New **`features/auth/AuthSplitShell.tsx`** — the dark-hero split-screen
  shell Figma actually uses for these two screens (distinct from the
  `(auth)` route group's plain layout, which correctly matches signup's
  own, hero-less Figma frames and is unchanged). Hero image downloaded
  locally to `public/auth/brand-panel.png` since Figma asset URLs expire
  after 7 days. New **`app/login/page.tsx`** (moved out of the `(auth)`
  group — the split shell replaces that group's header/footer chrome
  rather than nesting inside it) and **`app/welcome/page.tsx`**, both
  thin wrappers around `AuthSplitShell`. New
  **`features/auth/LoginForm.tsx`** (email/password via
  `react-hook-form`/zod, calls the already-typed `login()` from T15/T16
  — its first real caller; role toggle and remember-me are display-only,
  no backend support for either; "Forgot password?" shows a
  `toast.info(...)`, no reset-password screen exists yet) and
  **`features/auth/WelcomeScreen.tsx`** ("Get started" → `/signup`,
  "Log in" → `/login`). `components/shared/TopNavBar.tsx`'s "Sign In"
  button (previously a dead `<button>`, pre-dating any auth wiring) now
  routes to `/welcome`. Google sign-in remains deliberately deferred on
  both screens, per explicit choice. Full writeup:
  `docs/implementation/frontend/Phase_2_Implementation.md`.
  **Two real bugs found and fixed only because this was verified with an
  actual browser (Playwright), not `curl`:** (1) the CORS gap above was
  independently, byte-identically fixed on `dev` around the same time —
  merged in rather than duplicated; (2) `globals.css` had a leftover
  `create-next-app` dark-mode media query silently flipping the login/
  signup screens to unreadable black-on-black for any user with OS dark
  mode on — already fixed and merged to `dev` via PR #10
  (`fix/remove-stray-dark-mode-media-query`), pulled in via merge rather
  than duplicated. Playwright MCP itself only became available this
  session via a new project-root `.mcp.json` — the CLI's own
  `~/.claude.json` project-scoped MCP config isn't read by this IDE
  surface, `.mcp.json` is (mirrors `playwright`/`context7`/`supabase`/
  `sentry`, all already configured for this project via the CLI).
  Live-verified: screenshot match against both Figma frames, full
  welcome→signup/login and homepage→welcome navigation loop, and a real
  signup→OTP-verify→login round trip against the real backend (wrong
  password shows the correct inline error, correct password redirects
  to `/`) — test user and screenshots cleaned up afterward.
- **P2-T17/T18 shipped 2026-07-15** — silent-refresh interceptor,
  authStore, and AuthGuard, closing the last piece before Profile UI
  work (T21+) can assume reliable "logged in" state. New
  **`lib/stores/auth.ts`** (zustand, ADR-007): `user`/`accessToken`/
  `status` (`idle`/`loading`/`authenticated`/`unauthenticated`) — the
  access token is memory-only, never persisted (14_Security.md), so a
  full page reload always resets to `idle`. New **`lib/auth/
  session.ts`**: `ensureAuthResolved()` restores the session from the
  httpOnly refresh cookie on first load (calls `/auth/refresh`),
  deduped across concurrent `AuthGuard` mounts via a module-level
  promise. **`lib/api/client.ts`** now attaches `Authorization: Bearer`
  from the store to every request and, on a 401 from a non-`/auth/*`
  endpoint, silently retries once via the same refresh dance, clearing
  the store (logout-everywhere) if the cookie itself is invalid; `/auth/*`
  requests are deliberately excluded from the retry (they carry no
  token, and a bad-login 401 isn't a token-expiry signal) — this also
  avoids a real import cycle (`client.ts` reads the store directly
  rather than importing `endpoints/auth.ts`'s `refresh()`, and only
  takes a type-only import from it for `TokenResponse`). New
  **`components/shared/AuthGuard.tsx`** (Tier 2, `06_Component_Library.md`):
  renders a skeleton while `ensureAuthResolved` resolves, redirects an
  unauthenticated visitor to `/login?returnTo=<path>`, and redirects an
  authenticated visitor whose role isn't allowed for the portal home.
  Wired into `app/(broker)/broker/layout.tsx` (`allowedRoles: [broker]`)
  and `app/(admin)/admin/layout.tsx` (`allowedRoles: [admin]`) — both
  layouts previously had a literal "Auth guard added in Phase 2"
  placeholder comment, now resolved. **`LoginForm.tsx`** updated to
  actually call `setAuth()` on success (it previously redirected to `/`
  without ever populating the store — a real gap this closed) and to
  honor `?returnTo=` via `useSearchParams` (wrapped in `<Suspense>` in
  `app/login/page.tsx` per Next.js's static-render requirement for that
  hook). `tsc`/`eslint`/`next build` all clean. **Live-verified with
  Playwright against the real backend + Supabase dev DB** (two
  throwaway users, one broker one client, created via real signup +
  dev-logged email OTP, deleted afterward): logged-out visit to
  `/broker/dashboard` → redirected to `/login?returnTo=%2Fbroker%2Fdashboard`
  → login → landed back on `/broker/dashboard` exactly; a full hard
  page reload while authenticated correctly rehydrated the session from
  the cookie with no bounce to login (confirming `ensureAuthResolved`
  actually works, not just compiles); a client-role login visiting
  `/broker/dashboard` was correctly redirected to `/`.
- **P2-T21 shipped 2026-07-16** — Profile & Settings layout shell, from
  Figma "Client view" page, "profile and settings" section (node
  `145:4686`): a 220px sidebar (user card, "Profile" nav group —
  Account/My Properties/Purchase History/Loan Applications/Documents —
  and "Settings" nav group — Notifications/Security/Billing — plus a
  promo card) next to a content area, still inside the normal
  TopNavBar/Footer chrome (unlike Broker/Admin, which replace that
  chrome with their own portal shell). Just the shell — all 8 tabs are
  `EmptyState` placeholders for now, filled in one at a time next. New
  **`lib/api/endpoints/users.ts`** (`getMe()` against `GET /users/me`,
  needed for the sidebar's `avatar_url`/`is_email_verified` — richer
  than the auth endpoints' slim `UserOut`). New
  **`features/profile/ProfileSidebar.tsx`** — a plain flex column, not
  a reuse of the shadcn app-shell `Sidebar` primitives Broker/Admin use
  (those are fixed-position/off-canvas, meant to replace a portal's
  entire chrome; Client Profile keeps the marketing site's own).
  Figma's "Premium Member"/star-rating/"Premium Support" card content
  has no backing field on the `User` model — used the real
  `is_email_verified` flag instead of fabricating an account tier, and
  simplified the promo card to a plain "Contact Support" mailto link.
  **Flag if a real premium-tier concept gets designed later — this is a
  deliberate simplification, not yet reconciled with Figma.** New
  **`app/(client)/profile/layout.tsx`** (`AuthGuard` allowing every
  role, since client/broker/admin all have their own account) +
  8 placeholder route pages + a bare `/profile` redirect to
  `/profile/account`. **`TopNavBar.tsx`** is now auth-aware (shows the
  user's first name → `/profile/account` when logged in), which needed
  `ensureAuthResolved()` called from `TopNavBar` itself, not just
  `AuthGuard` — it renders on every page, including ones with no guard.
  **A real concurrency bug this surfaced, fixed along the way:**
  `lib/api/client.ts`'s `refreshAccessToken()` and
  `lib/auth/session.ts`'s `ensureAuthResolved()` were two independent
  single-flight guards, each calling `POST /auth/refresh` directly with
  no coordination — calling `ensureAuthResolved()` from `TopNavBar`
  alongside a real protected query (`getMe()`) on the same page load
  meant both could fire at once, sending the same one-time-use
  refresh-token cookie twice; the backend correctly treated the second
  arrival as a replay (P2-T05's reuse-detection) and revoked the whole
  session — logging the user out mid-navigation with no attacker
  involved. Confirmed live (a hard reload of `/profile/security`
  produced a second `POST /auth/refresh → 401` and a genuinely dead
  session), fixed by making `ensureAuthResolved()` delegate to the
  now-exported `refreshAccessToken()` instead of calling `/auth/refresh`
  itself, so every caller shares one in-flight promise. Re-verified the
  identical scenario clean afterward. `tsc`/`eslint`/`next build` all
  clean (all 8 routes + `/profile` in the build's route table).
  Live-verified with Playwright against the real backend + Supabase dev
  DB (`hello@thesketchystudio.com`, cleared via
  `scripts/delete_test_user.py` before and after): full signup → OTP →
  auto-login → `TopNavBar` showing "Test" → `/profile/account` with real
  name/initials/verified badge → tab navigation → the concurrency bug →
  fix → re-login → clean hard reload. **Known gap, not fixed here:**
  `TopNavBar` is transparent until 40px of scroll (designed for the
  homepage's dark hero); on a light-background page like Profile the
  nav is barely legible for that first scroll distance — pre-existing,
  not introduced here, but this is the first non-hero page to expose
  it. **Fixed same day as the T22 visual-accuracy pass below.**
- **P2-T22 shipped 2026-07-16** — Account tab real content (Figma node
  `145:4686`'s "Account Information" + "Buyer Profile" sections),
  replacing T21's placeholder. Full Name/Email edit via the existing
  `PATCH /users/me`; Phone Number renders disabled/read-only since
  `UserUpdateRequest` has no `phone` field at all (`User.phone` is
  immutable post-signup by design — checked the schema directly rather
  than assuming); Preferred Language + the whole Buyer Profile section
  (Budget Range, Preferred Location, Property Type, Buyer Intent) have no
  dedicated columns and live in the `preferences` JSONB blob T20 built
  for exactly this. Since `user_service.update_me` fully replaces
  `preferences` rather than merging, every save spreads the
  currently-loaded preferences first so a future tab can't silently wipe
  this one's keys. Dropped Figma's "Last changed 4 months ago" under
  Password — nothing tracks a password-specific timestamp, and the
  generic `updated_at` column would be misleading. New
  **`lib/api/endpoints/users.ts`** additions (`updateMe`,
  `changePassword`), new **`lib/validation/profile.ts`**, new
  **`features/profile/AccountTab.tsx`** and
  **`features/profile/ChangePasswordDialog.tsx`** (reuses the shared
  `Modal` + existing `PasswordStrengthMeter`). **Two real bugs found and
  fixed live:** (1) the Preferred Language dropdown showed its
  placeholder instead of the real saved value after every reload, even
  though the value was confirmed correct in the database — caused by
  building the form with react-hook-form's `values` option on a
  component that conditionally hid the `<form>` (and its
  `Controller`-bound Select) behind a loading skeleton, racing the
  Select's field registration against the values-sync effect on first
  paint; plain `register()`-bound inputs didn't hit this since RHF sets
  their DOM value imperatively regardless of registration timing. Fixed
  by splitting into an outer loading-gate and an inner form that only
  mounts once real data exists, using `defaultValues` (set once) instead
  of `values` (synced repeatedly) — no race left to have. (2) Confirmed
  the T21 refresh-concurrency fix generalizes: rapid overlapping
  password-change submissions produced a `401 → refresh → 401 → 204` log
  sequence that looked alarming at first, but only one actual
  `POST /auth/refresh` fired (the shared single-flight guard worked),
  and a direct login with the new password confirmed the change fully
  succeeded. `tsc`/`eslint`/`next build` all clean. Live-verified with
  Playwright + the real Supabase dev DB end-to-end (signup → save
  profile fields → hard-reload persistence check → wrong/correct
  password change → real login with the new password); test user
  deleted afterward. **Tooling note:** `.claude/settings.local.json` was
  updated this session to pre-approve every Playwright MCP tool (plus a
  `mcp__playwright__*` wildcard) since only ~10 of ~23 tool names were
  previously listed — but permission grants load once at session start,
  so this takes effect next session, not immediately; verification for
  T22 used `browser_navigate`/`browser_evaluate` instead of
  `browser_snapshot` to work around that mid-session gap.
- **P2-T22 visual-accuracy follow-up, same day** — you compared a
  screenshot of the built Account page directly against the Figma
  mockup and flagged real mismatches: wrong colors, boxed inputs instead
  of underlines, no button-color match. Root cause: the first T22 pass
  used generic shadcn primitives (`Input`/`Button`/`Select` defaults)
  instead of this screen's actual Figma fills/fonts. Re-pulled
  `get_design_context` per-node (sidebar, buttons, fields, headings) —
  the earlier whole-page XML dump only had layout, not colors/fonts.
  **Key finding: this screen's primary-action color is near-black
  `#1a1a1a` (`--brand-primary-600`, already in `globals.css` from T20),
  not the app's green `--primary` token** — matches the signup/login
  pages' own black CTA buttons; the shadcn scaffold's green default was
  never this screen's real color. Every field is underline-style
  (`border-b` only), not boxed. Rebuilt `ProfileSidebar.tsx` and
  `AccountTab.tsx` with exact colors/fonts/spacing (new `UnderlineField`
  helper, `Select`'s trigger restyled to match). One color had no brand
  token yet — Figma's "Accent Green/100" (`#f4fef1`) — added as
  `--brand-green-100` in `globals.css`, extending T20's existing 100–900
  scale rather than hardcoding it. Slate grays (`#64748b`/`#94a3b8`/
  `#f1f5f9`) confirmed as plain Tailwind defaults with no brand
  equivalent (already used directly elsewhere, e.g. `TopNavBar.tsx`), so
  used the matching Tailwind slate utilities rather than inventing new
  tokens. `tsc`/`eslint`/`next build` all clean; live-verified with a
  fresh Playwright screenshot compared directly against the Figma
  reference (used the same name, "Arjun Mehta", as the reference
  screenshot for an apples-to-apples check) — active nav/avatar badge/
  Save button all correctly near-black, fields underlined, Preferred
  Language + Save Changes still functioning post-restyle. **Known gap,
  not addressed:** Figma's logged-in-state top nav is a different design
  entirely (search icon, notification bell, avatar photo, no "List
  Property"/name button) — none of which exists yet; `TopNavBar.tsx`
  still shows the same nav for both logged-in and logged-out visitors.
  Flagged as a separate, larger task (implies building search/
  notifications features that don't exist yet), not folded into this
  color-accuracy pass.
- **TopNavBar opaque-on-non-hero-pages fix, same day** — the flagged
  gap above (nav text invisible at the top of the Profile page) fixed
  on your explicit instruction: frontend-only, no backend changes.
  `TopNavBar.tsx` now checks `usePathname() === "/"` — only the
  homepage gets the transparent-until-40px-scroll treatment (it has a
  dark hero image behind it); every other `(client)` page renders the
  nav in its opaque/dark-text state from the very first frame, no
  scroll dependency. One conditional, no new props, no other files
  touched. `tsc`/`eslint`/`next build` clean; live-verified with
  Playwright — homepage confirmed still transparent-over-hero at the
  top (unchanged), `/profile/account` confirmed fully legible with zero
  scroll (logo, nav links, and the user's name all clearly dark-on-light
  from the first render).
- **P2-T23 shipped 2026-07-20** — Notifications tab, the first of the
  7 remaining Profile & Settings tabs to get real content (Account/T22
  was previously the only one). Picked over Security/Billing after
  actually checking each tab's Figma design against the real backend:
  Security's design needs 2FA (deferred to P4) and a privacy/data-export
  section with no backend at all; Billing's design is a full realized
  payments/subscription screen (saved cards, invoices), nowhere close
  to the architecture doc's "placeholder" description and with no
  payments backend planned. Notifications was the only tab that's just
  channel toggles with no missing dependency. New
  `features/profile/NotificationsTab.tsx`: 5 channels (Property Match
  Alerts / Market Volatility / Private Viewings / Offer Status / EMI
  Reminders) × Email/Push checkboxes, stored under
  `preferences.notification_channels` — same free-form JSONB blob T20/T22
  already use, no backend changes needed. Colors/spacing pulled directly
  from Figma's `get_design_context` this time, avoiding T22's
  generic-shadcn-then-fix detour. Playwright's MCP server was
  disconnected earlier in the session; once it reconnected, verified
  both the API contract (backend worktree + real Supabase dev DB via
  curl: exact `PATCH /users/me` payload → clean unchanged `GET`) and,
  live in a real browser, the full UI flow — logged in through
  `/login`, loaded `/profile/notifications`, confirmed rendered
  checkbox state matched what was just saved, toggled a checkbox,
  saved (`PATCH → 200`, button correctly re-disabled), and screenshot-
  compared against the Figma reference (close match). `tsc`/`eslint`/
  `next build` all clean.
- **Checkbox checkmark contrast bugfix, same day** — you compared a
  screenshot against Figma and flagged the checked boxes looked like
  plain filled squares. Confirmed via `browser_evaluate` on the live
  page rather than assuming: the checkmark icon's color resolved to
  `rgb(9,9,9)` against a `rgb(26,26,26)` box — a near-invisible near-
  black-on-near-black. Fixed by adding `data-[state=checked]:
  text-background` to both checkboxes in `NotificationsTab.tsx`
  (`--background` is `#fefeff`; matches `AccountTab.tsx`'s existing
  `text-background`-on-dark-bg convention). Re-verified: icon color now
  `rgb(254,254,255)`, confirmed visibly correct in a zoomed screenshot.
  `tsc`/`eslint` clean.
- **Forgot/reset-password flow shipped 2026-07-21** — from Figma's
  "password reset" group (Onboarding page, node `470:500`), found via
  a direct link you supplied (the earlier `143:4685` "reset" node
  turned out to be an older/alternate design, not this one). Three
  Figma frames: reused Login, "Check your inbox!" (node `470:603`),
  and "Reset your password." (node `470:713`) — no "enter your email"
  frame exists, so `EmailForm` in the new
  `features/auth/ForgotPasswordFlow.tsx` is a minimal addition matching
  the same split-shell visual language rather than a literal Figma
  pull. New `app/forgot-password/page.tsx`,
  `features/auth/ResetPasswordForm.tsx` (reads `?token=` from the
  emailed link via `useSearchParams`), `app/reset-password/page.tsx`.
  New `forgotPassword`/`resetPassword` functions in
  `lib/api/endpoints/auth.ts` and matching zod schemas in
  `lib/validation/auth.ts`. `LoginForm.tsx`'s "Forgot password?" link
  (previously a dead toast) now routes to `/forgot-password`. Backend
  needed no changes — `POST /auth/password/forgot` /
  `POST /auth/password/reset` and real Resend delivery for the reset
  email already existed on `feature/phase_2_backend`
  (`efb5f9a`, 2026-07-17, a prior session not reflected in memory at
  the time this task started) by the time this shipped.
  **Real bug found and fixed during live verification, not a design or
  delivery problem:** repeatedly switching this local checkout between
  `feature/phase_2_backend` and `feature/phase_2_frontend` mid-session
  (to keep backend-only edits off the frontend branch) left the
  already-running `uvicorn --reload` backend process serving whichever
  branch happened to be checked out on disk at reload time —
  `feature/phase_2_frontend`, which still carries the pre-P2-T30
  `forgot_password()` that only logs the token and never calls Resend.
  Every "real" reset request during testing returned a correct `204`
  and logged a token with no exception, so nothing looked wrong until
  the emails simply never arrived while direct-to-Resend diagnostic
  curls did. Fixed by adding a permanent
  **`../homigrow-backend-wt` git worktree** checked out to
  `feature/phase_2_backend` and running the backend from there instead
  — confirmed fixed by seeing the previously-invisible
  `httpx: HTTP Request: POST https://api.resend.com/emails "HTTP/1.1
  200 OK"` log line appear for the first time, and a real email
  arriving. **Use this worktree for all future backend-server runs
  during frontend sessions** rather than switching this checkout's
  branch, to prevent this recurring. Live-verified end-to-end against
  the real backend + Supabase dev DB + real Resend inbox (not just
  dev-log token reads): requested reset → real email received →
  followed the real link → set new password → redirected to `/login` →
  old password rejected, new password logs in → replaying the
  consumed token correctly shows "invalid or expired" (fingerprint
  single-use mechanism confirmed). `tsc`/`eslint`/`next build` clean.
- **Branch split by portal, 2026-07-21** — `feature/phase_2_frontend`/
  `feature/phase_2_backend` split further into `_client`/`_broker`
  variants (`feature/phase_2_frontend_client`,
  `feature/phase_2_backend_client`, and matching `_broker` pointers cut
  from the same base commit, no broker-specific commits yet). Client
  work (this session's Google Sign-In) landed on the `_client`
  branches; the original `_frontend`/`_backend` branches still exist,
  untouched, not deleted. See [[phase-branch-strategy]] in memory —
  not yet confirmed whether this split applies beyond Phase 2. The
  backend worktree also had a stale merge gap closed the same session:
  it was missing `8d31c4d` (duplicate-email 500 fix + auto-login after
  signup OTP verify), made on `feature/phase_2_frontend` and merged to
  `dev` but never merged back to `feature/phase_2_backend` — fixed via
  `git merge origin/dev` before any new work landed, so
  `_issue_session()` etc. could be reused rather than re-implemented
  and conflicted later.
- **Google Sign-In shipped 2026-07-21** — "Continue with Google" on
  both the login page and signup Step 2, from a design decided with
  the user (not pulled from Figma — no Google element exists in either
  frame). One backend endpoint, `POST /auth/google`
  (`auth_service.google_auth()`), backs both: verifies a Google
  Identity Services ID token (`google-auth` + `requests` deps, no
  client secret needed — this is the ID-token flow, not a redirect/
  code-exchange). Matching email → logs in, ignoring any `role` sent
  (an existing account's role never changes via Google). No match +
  `role` supplied (signup Step 2 only, where it's already known from
  Step 1) → creates the account on the spot (`is_email_verified=true`,
  no `password_hash`) and logs in, skipping the manual form and OTP
  step entirely. No match + no `role` (login page) → `404
  GOOGLE_ACCOUNT_NOT_FOUND` rather than silently creating an account.
  New `GoogleAuthRequest` schema (same admin-blocking `role` validator
  as `SignupRequest`); new `GOOGLE_TOKEN_INVALID` (401) and
  `GOOGLE_ACCOUNT_NOT_FOUND` (404) error codes. **Real schema blocker
  found and fixed, not worked around:** `users.phone` was `NOT NULL
  UNIQUE`, but Google supplies no phone number. Rather than fake a
  placeholder value, migration M5 (`5081b0dee6c7`) made `phone`
  nullable with a partial unique index (`ix_users_phone_unique`,
  "unique when present" — same pattern `email` already used), decided
  with the user as the root-cause fix over adding a phone-entry step
  back into the Google flow; verified upgrade→downgrade→upgrade clean
  against the real dev DB. `UserOut`/`UserRead` schemas both had
  `phone: str` (required) and would have crashed serializing a
  Google-only account — fixed alongside (`Optional[str]`, matching
  `email`'s existing pattern), caught by the new tests before it ever
  hit a real user. New frontend: `features/auth/
  GoogleSignInButton.tsx` (loads Google's own rendered button via
  Identity Services' JS script, exchanges the credential for a session
  through the new endpoint), `types/google-identity.d.ts` (minimal
  ambient types — no official Google types package in use), wired into
  both `LoginForm.tsx` (no role; a 404 shows a toast rather than
  auto-redirecting to signup) and `SignupFormStep.tsx` (role = the
  form's currently-selected role, placed above the manual fields per
  the user's explicit placement choice, not Step 1). New
  `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `frontend/.env.local` (public value,
  safe to ship in the bundle — this is why no secret is needed
  frontend-side either). **Real stale-server bug hit twice during
  verification, same class as the forgot-password one above:** a
  worktree's `uvicorn --reload` process had been running since earlier
  in the session and silently stopped picking up file changes after a
  large `git merge` landed 45 files at once — `/auth/google` 404'd
  against a server that had the route mid-development. Fixed by killing
  and restarting the process fresh; **if a worktree server has been
  running across a branch checkout or merge, restart it — don't trust
  `--reload` to have caught everything.** 150/150 backend tests pass
  (11 new: token/claim validation, existing-account login ignoring
  role, new-account creation incl. broker_profile, deactivated-account
  403, route-level status codes); `ruff` clean; `tsc`/`eslint`/
  `next build` all clean. Live-verified structurally with Playwright
  against the real backend (fresh server): both screens render the
  correct divider text and button placement, and `POST /auth/google`
  with a garbage token correctly returns `401 GOOGLE_TOKEN_INVALID`
  from a live server. Also hit a real external gap, not a code bug:
  Google Cloud Console's Authorized JavaScript origins change hadn't
  propagated yet at first verification (`GSI_LOGGER: The given origin
  is not allowed for the given client ID` — Google documents this can
  take several minutes after editing a client). **Since resolved and
  verified end-to-end by the user**: a real signup via the Google
  popup completed successfully (account created, session issued,
  landed logged in) — the only remaining oddity is a one-time ~15-20s
  delay after picking the Google account, isolated to Google's own
  client-side FedCM negotiation (measured our own token-verification
  path directly at 0.14s, so not a backend bottleneck); expected to be
  faster on repeat sign-ins as FedCM's per-origin registration is a
  one-time cost, not yet independently reconfirmed.
- **Signup City/State fields shipped 2026-07-21** — closes one of two
  gaps found while inventorying the full 14-frame Figma "Client - Sign
  up" section this session (previously only 3 frames were on record).
  The signup form (`416:846`) has City/State dropdowns between the
  Phone/role row and Password row; built with real design-context colors
  from that frame, not generic shadcn defaults. New
  `frontend/lib/data/indian-cities.ts` (93 cities, curated "major
  cities" list covering every one of India's 28 states + 8 union
  territories, your explicit call over either the homepage's narrower
  6-city list or a full town-level dataset) and new
  `frontend/components/forms/AuthSelectField.tsx` (the `AuthTextField`
  underline styling adapted for a shadcn `Select`, reusable by future
  auth/profile dropdowns). Selecting a city auto-fills State as a
  disabled/derived field. Backend: `SignupRequest` gained optional
  `city`/`state`; `auth_service.signup()` stores them in
  `user.preferences` (same free-form JSONB the Account tab already
  uses, P2-T22) only when supplied, otherwise leaving the column's own
  `'{}'::jsonb` default untouched. 150→152 backend tests pass.
  **The 6-screen buyer-preference wizard (budget, property type,
  investment goal, exit strategy, development stage/amenities, current
  situation) remains deliberately unbuilt** — you chose to ship
  City/State now and tackle that wizard screen-by-screen later, not as
  part of this task.
  **Real bug found and fixed during live verification, unrelated to the
  new fields:** the `uvicorn` command on `PATH` resolves to the
  *original* `homigrow/backend` repo's venv, not the
  `homigrow-backend-wt` worktree — as a console-script shim it doesn't
  add the worktree's directory to `sys.path` the way `python -m
  uvicorn` does, so it was silently serving the wrong (non-worktree)
  `app` package the entire time, unrelated to any reload staleness.
  Restarting didn't help at first because `uvicorn --reload`'s
  `multiprocessing` worker survives its parent's death as an orphan
  still holding the listening socket. Fixed by killing every orphaned
  worker on port 8000 and always starting this worktree's server with
  `python -m uvicorn app.main:app --reload --port 8000` — never the
  bare `uvicorn` command — going forward. Confirmed via
  `GET /openapi.json` showing the new fields, then a full Playwright
  browser signup writing `{"city": "Bengaluru", "state": "Karnataka"}`
  to the real Supabase dev DB; all test users deleted afterward via
  `scripts/delete_test_user.py`.
- **Buyer-preference wizard (Phase B of signup) shipped 2026-07-22** —
  the 6-screen buyer-preference wizard flagged as unbuilt above (budget,
  property type, investment goal, exit strategy, development
  stage/amenities, current situation) now runs as steps 4-9 of the
  signup wizard, immediately after email OTP verify and before landing
  on `/`. Pulled live from Figma (nodes `418:994`, `457:398`, `457:593`,
  `457:913`, `457:1113`, `457:1317`). **Backend needed zero changes** —
  `User.preferences` is an untyped JSONB dict and `PATCH /users/me`
  already accepts arbitrary nested objects. Answers are namespaced under
  `preferences.buyer_preferences` (not flat top-level keys) to avoid
  near-miss collisions with the Account tab's existing `budget_range`/
  `property_type`/`preferred_location`/`buyer_intent` keys in the same
  blob, mirroring the `notification_channels` nesting precedent. New
  `frontend/features/auth/preferences/` subfolder: 6 step components +
  shared primitives (`PreferenceWizardFooter`, `PillGroup`,
  `SelectableCardGroup`, `ChecklistGroup`, `ChipMultiSelect`,
  `CityMultiSelectChips`, `PropertyTypeCardGrid`, `BudgetRangeSlider` —
  the last wraps the existing shadcn `Slider`, already dual-thumb
  capable via `value={[min,max]}`, no new dependency). New `formatINR()`
  helper in `lib/utils.ts`. `SignupWizard.tsx`'s `WizardStep` union grew
  from 3 to 9 steps; `AuthProgressBar`'s existing `totalSteps` prop +
  fallback formula handled the new steps with no component change
  (Figma itself statically labels every Phase B screen "Step 3 of 3" —
  a design-file gap already noted in memory, not replicated; real
  incrementing numbers ship instead). **Skip** (on every Phase B screen)
  abandons the rest of the wizard with no save at all; **Continue on the
  last screen** does `getMe()` → spread `{...me.preferences,
  buyer_preferences}` → `updateMe()` → redirect home, `toast.error`-ing
  but still completing signup on a failed save rather than stranding the
  user. `tsc`/`eslint`/`next build` all clean. Live-verified with
  Playwright against the real backend worktree + Supabase dev DB: full
  signup → OTP verify → selections made on all 6 new screens → Continue
  → confirmed via a direct DB query that `buyer_preferences` was written
  correctly **and** the existing `city`/`state` from signup survived
  untouched (full-replace-not-merge semantics handled correctly);
  separately verified the Skip path (zero `/users/me` calls, no
  `buyer_preferences` key written) from a second throwaway account.
  Screenshot-compared 5 of 6 screens directly against the Figma
  reference images — close visual match throughout. Both test users
  deleted afterward via `scripts/delete_test_user.py`. Full writeup:
  `docs/implementation/frontend/Phase_2_Implementation.md`.
- **Account tab's Buyer Profile section unified with the wizard's
  buyer_preferences, 2026-07-22** — after the wizard shipped (above), a
  live DB check surfaced a real design gap: the Account tab
  (`AccountTab.tsx`, P2-T22) still had its own 4 flat keys
  (`budget_range`, `preferred_location`, `property_type`,
  `buyer_intent`), completely disconnected from the wizard's structured
  `preferences.buyer_preferences` object — a user who did the wizard
  then opened their Account tab saw blank fields, and saving there wrote
  a second, conflicting copy of the same concept (e.g.
  `property_type: "Residential"` next to `buyer_preferences.
  property_types: ["modernist_villas"]`), confirmed by inspecting a real
  test user's row. Your explicit call: replace the flat keys entirely so
  the Account tab reads from and writes to `buyer_preferences` — one
  shared dataset, not two. `lib/validation/profile.ts`'s
  `accountFormSchema` now has a nested `buyer_preferences` object
  (`budget_min`/`budget_max`/`preferred_cities`/`property_types`/
  `investment_goals` — the subset editable here) instead of the 4 flat
  string fields. `AccountTab.tsx` reuses the wizard's own input
  components for consistency (`BudgetRangeSlider`, `CityMultiSelectChips`,
  `ChipMultiSelect` with locally-mirrored option lists, since each wizard
  step file already defines its own options locally rather than a shared
  export — same convention followed here). Only the 5 fields above are
  editable on this tab; the rest of `BuyerPreferences` (`bedroom_preference`,
  `buy_timeline`, `exit_strategies`, `target_hold_period`, `target_roi`,
  `risk_tolerance`, `development_stage`, `amenities`, `current_situation`)
  is preserved on save by spreading the existing `buyer_preferences`
  object before applying the form's edits — a full-object replace would
  have silently dropped whatever the wizard set for those fields. No
  backend changes (same JSONB column). `tsc`/`eslint`/`next build` all
  clean. Live-verified end-to-end with a fresh signup through the actual
  wizard: DB confirmed `buyer_preferences` written with no old flat keys
  at all; `/profile/account` then rendered the wizard's own answers
  pre-filled (budget slider, selected city/property type/investment
  goal chips all matched); you then manually added a second preferred
  city on the page and saved — a follow-up DB query confirmed the new
  city merged into `preferred_cities` while every wizard-only field
  (`amenities`, `target_roi`, `buy_timeline`, `risk_tolerance`,
  `exit_strategies`, `current_situation`, `development_stage`,
  `bedroom_preference`, `target_hold_period`) was untouched, and no
  stray flat keys reappeared. Test user deleted afterward.
- **Null-phone React console error fixed, 2026-07-22** — signing in with
  Google surfaced a real console error on `/profile/account`: `value`
  prop on `input` should not be null (`AccountTab.tsx:204`, the Phone
  Number field). Root cause: `User.phone` became nullable on the backend
  in migration M5 (Google Sign-In accounts have no phone number), but
  two frontend spots never caught up — `lib/api/endpoints/users.ts`'s
  `UserRead.phone` type still declared `phone: string` (required), and
  `AccountTab.tsx` passed `value={user.phone}` straight into a
  controlled input with no null guard. Fixed: `UserRead.phone` is now
  `string | null`; the input uses `value={user.phone ?? ""}` with a
  `placeholder="Not provided"` and switches its helper text to "No phone
  number on file (signed in with Google)." when null. `tsc`/`eslint`
  clean. Confirmed live against a real Google-signed-in test account
  (`phone: null`, `full_name` pulled from the Google profile) — console
  error gone after the fix.
- **`create_test_user.py`/`delete_test_user.py` given zero-argument
  defaults, 2026-07-22** — both scripts previously required typing the
  full email (and, for create, phone/name/password) every time. Since
  `hello@thesketchystudio.com` is the only address actually used for
  manual testing (Resend sandbox constraint), both scripts now default
  to it with no arguments: `delete_test_user.py` alone deletes
  `DEFAULT_TEST_EMAIL`; `create_test_user.py` alone creates it with a
  fixed phone/name/password (`Preetham-test`) and prints the login
  credentials. Explicit-argument usage is unchanged for anything else.
  Not a signup+OTP shortcut for the Google-account null-phone scenario
  specifically — `create_test_user.py` still makes a password-based
  account; the Google path is only reachable via real Google Sign-In
  matching the same email once the account exists.
- **Profile sidebar logout-on-click bug fixed, 2026-07-24** — reported
  live: clicking almost any Profile sidebar tab bounced straight to
  `/login`. Root cause: `ProfileSidebar.tsx`'s nav items were plain `<a
  href>` tags, so every tab switch did a full page reload instead of
  client-side routing; each reload wiped the in-memory `authStore` and
  re-ran `ensureAuthResolved()` from scratch, firing a fresh `POST
  /auth/refresh`. That route is rate-limited to 5/min/IP (P2-T08) — an
  ordinary sequence of 6+ tab clicks in under a minute burned the
  budget, and `refreshAccessToken()` treats any non-2xx response
  (including a transient `429`) as an invalid session and clears the
  auth store, forcing a real logout. Reproduced with Playwright against
  the real backend worktree + Supabase dev DB (network log: 5×`200`
  then `429` on the 6th `/auth/refresh`, immediately followed by the
  redirect). Fixed at the root cause: nav items now use `next/link`'s
  `Link` instead of `<a>` (the `mailto:` support link stays a plain
  `<a>`) — `ensureAuthResolved()` now short-circuits on every
  subsequent tab switch, so no repeat refresh calls happen at all.
  `tsc`/`eslint` clean. Re-verified live: clicked through all 8 sidebar
  tabs in immediate succession — exactly one `/auth/refresh` call for
  the whole session, no 429, no logout. `TopNavBar.tsx`'s placeholder
  `<a href="#">` links and `PropertyCard.tsx`'s `<a href={property.href}>`
  (public, un-gated homepage) use the same plain-`<a>` pattern but don't
  reproduce this today — flagged as a risk to recheck if either gains a
  real route behind `AuthGuard`.
- **Profile tab skeletons verified + completed, 2026-07-24** — pulled
  exact Figma `get_design_context` for the Account/Notifications
  skeleton frames and found a precise gap: section-heading and
  Account-tab field-label skeleton bars should be full-width (Figma
  draws them spanning the full 736px content column / grid cell), not
  the short fixed-width bars they were coded as. Fixed in both files.
  Then built loading-skeleton components for the 6 still-unbuilt tabs
  (My Properties, Purchase History, Loan Applications, Documents,
  Security, Billing) — new `features/profile/*TabSkeleton.tsx` files —
  matching each tab's real Figma shape, and wired all 6 into
  `ProfileLayout`'s `tabSkeletonFor` so every Profile & Settings route
  now shows an accurate skeleton during the session-resolution window
  instead of a blank fallback. **Real content for the 6 tabs is
  explicitly out of scope this session** — each needs backend that
  doesn't exist yet (Property ownership data, offers/transactions,
  loan applications, file storage, 2FA + data export, and a full
  payments/subscription system respectively); your explicit call to
  ship skeletons now and build the backend later. `tsc`/`eslint`/
  `next build` all clean. Live-verified with Playwright: since the
  loading window is normally too brief to see, delayed
  `POST /auth/refresh` by 3s via route interception and screenshotted
  all 8 profile routes mid-flight — every skeleton renders correctly,
  including the Billing plan card's white-tinted bars over its dark
  background.

### Frontend Phase 2 — Broker signup (on `feature/phase_2_frontend_broker`,
cut from `dev` 2026-08-14 — same empty-pointer-since-2026-07-21 situation
as the backend broker branch, fast-forwarded to `dev`'s tip before
starting)
- **Broker verification-details form + document upload wizard shipped
  2026-08-14** — frontend half of the backend work above, built against
  the real `feature/phase_2_backend_broker` API. Two real,
  pre-existing bugs in the shared `SignupWizard.tsx` fixed along the
  way, found only by reading the actual wizard logic before extending
  it, not by assuming it already branched on role: (1) after OTP
  verify, **every** signed-up user — broker included — was routed
  into the 6-screen buyer-preference wizard (budget/property/goal/
  exit/development/situation), which has no meaning for a broker;
  `handleAuthenticated` now branches on `role`, sending a broker to a
  new `"documents"` step instead and a client down the unchanged
  buyer-preference path; (2) `AuthProgressBar.tsx`'s eyebrow-label
  logic was a binary `totalSteps === 3` heuristic (3 → "Onboarding
  Sequence", anything else → "Personifying Your Experience") — a
  broker's real Phase A is 4 steps (role/form/OTP/documents), which
  would have silently fallen into the wrong branch and shown buyer-
  preference copy on an onboarding screen. Fixed by adding an explicit
  optional `phase` prop that overrides the heuristic; every existing
  call site is unchanged (still infers from `totalSteps`), only the
  new broker steps pass `phase="onboarding"` explicitly.
  **Verification Details fields**: `SignupFormStep.tsx` now renders
  Agency/Firm Name, License/RERA No., and City of Operation — matching
  Figma's Step 2 form exactly — only when `role === "broker"`, appended
  after the password fields with the same divider style Figma uses.
  `signupFormSchema` (`lib/validation/auth.ts`) requires all three via
  `.superRefine` when `role === "broker"` (RERA number 5–50 chars,
  matching the backend's own sanity check) — the backend schema treats
  these as fully optional, but the frontend enforces them since Figma
  presents them as normal required inputs, not optional ones.
  **Document upload** (`BrokerDocumentUploadStep.tsx`, new
  `BrokerDocumentDropzone.tsx` — no file-upload form primitive existed
  before this): two drop zones (License/RERA Certificate,
  Government ID Proof), client-side 5MB check mirroring the backend's,
  calls the new `POST /brokers/me/verification-documents` via a new
  `apiRequestMultipart` in `lib/api/client.ts` (the client only
  supported JSON bodies before — multipart needs no explicit
  `Content-Type` header, since the browser sets the boundary itself;
  setting one manually breaks the upload). Renders **"Step 3 of 4"**,
  not Figma's static "Step 3 of 3" — Figma's own step-count label
  doesn't account for the shared OTP-verify screen sitting between
  form submission and this step, the same class of authoring gap
  already documented for the client's Phase B buyer-preference wizard,
  handled the same way (real numbers, not the literal Figma text).
  **Pending screen** (`BrokerPendingStep.tsx`, Figma's
  `BrokerPendingScreen`): badge + heading + a 3-state checklist (done/
  in-progress/pending, matching Figma's exact color distinction, not
  a simplified 2-state version). Figma's frame has no visible button
  at all — a **deliberate small addition**, not a literal pull: added
  a "Go to homepage" link, since this screen sits inside the `(auth)`
  layout shell with no `TopNavBar`, and leaving a genuine dead end
  read as worse than one small deviation from the source frame.
  `--brand-green-300: #ddfcd4` added to `globals.css` (Figma's "Accent
  Green/300", scale previously jumped 200→400) — same extend-as-needed
  precedent as `brand-green-100`/`brand-green-700` in earlier sessions.
  **Known gap, not addressed:** a broker who signs up via Google
  Sign-In skips the manual form entirely (Google auth creates +
  logs in directly), so they never see the Verification Details
  fields — their `broker_profile` ends up with no `company_name`/
  `rera_number`/`service_areas` until edited later via the P4-T10
  profile-edit screen. Flagged, not silently worked around; fixing it
  would mean either blocking Google sign-up for brokers or inserting a
  follow-up details screen after Google auth, both real scope
  decisions this session didn't make unilaterally.
  **Rejected status screen (Figma's `BrokerStatusScreen`) deliberately
  not built** — nothing can set `verification_status` to `rejected`
  yet (no admin review exists, P4-T12), so it would be dead code with
  no reachable path; building it now would be speculative, not real
  coverage.
  `tsc`/`eslint`/`next build` all clean (18 pre-existing warnings,
  zero new). Live-verified end-to-end with Playwright against the real
  backend worktree + Supabase dev DB + real Supabase Storage bucket:
  full broker signup (role → form with verification details → real
  city-dropdown selection → password strength "Strong" → OTP verify,
  read from the backend's dev-mode log → real multipart upload of a
  PDF + JPG → pending screen) confirmed via direct SQL that
  `company_name`/`rera_number`/`service_areas`/`verification_documents`
  all landed correctly, and via the real bucket that both files
  genuinely exist; screenshot-compared the pending screen against the
  Figma reference — close match. Separately re-verified the **client**
  signup path end-to-end (role → form) to confirm the shared
  `AuthProgressBar`/`SignupFormStep` changes caused no regression —
  still shows "Step 2 of 3" with no Verification Details section, as
  before. Test user, uploaded storage objects, and local test files
  all deleted afterward.

### Frontend Phase 3 (on `feature/phase_3_frontend_client`, cut from `dev`)
- **Property Details page shipped 2026-07-29** — new `/properties/[id]`
  route (`app/(client)/properties/[id]/page.tsx`), built against the
  real `GET /api/v1/properties/{id}` endpoint from the backend task
  above. Pulled the actual Figma frame (node `31:1845`, "property
  details" on the `Client view` page) rather than guessing layout. New
  `features/properties/`: `PropertyHeroGallery` (asymmetric bento photo
  grid), `PropertyHeader` (title/location/listing-type tag/price/quick
  stats — each quick stat only renders if the property actually has that
  optional field), `PropertyDescription`, `PropertyAmenities` (generic
  check-icon per amenity, since amenities are free-form strings with no
  icon mapping), `PropertyContactCard` (broker card + inquiry form + map
  placeholder — form buttons show a "not available yet" toast since
  `POST /properties/{id}/enquire` doesn't exist), `PropertyLoanCalculator`
  (EMI calculator seeded with the property's own price, reusing the
  homepage EMI calculator's amortization math). New
  `lib/api/endpoints/properties.ts`; added `ListingType`/`PropertyType`/
  `Furnishing`/`MediaType` to `lib/enums.ts` (mirroring the backend
  enums, previously missing); added `--brand-green-700: #6eb857` to
  `globals.css` (Figma's "Accent Green/700", not previously in the
  scale — same extend-as-needed pattern T22 used). Not built, matching
  the backend task's own deferred list: the Vaastu compliance checker,
  "Redesign with AI" button, and Market Context/"Download Market Report"
  card; not yet linked from the homepage or `PropertyCard` (separate,
  later task).
  **Two real bugs found by loading the live page, not just reading the
  code:** (1) the loan calculator was seeded with the raw `price` field
  regardless of listing type — meaningless for the seeded property,
  which is a rental (`price` is monthly rent there, not a purchase
  price), producing a technically-correct but nonsensical mortgage
  calculation. Fixed by only rendering the loan calculator when
  `listing_type === "sale"`. (2) The hero gallery's grid used inconsistent
  column-span math (two tiles each claimed half of a row that only had a
  third of the width left), so two photos stacked full-width instead of
  forming the intended bento grid — rebuilt as a simpler nested
  left/right flex split instead of one flat grid. `tsc`/`eslint`/
  `next build` all clean. Live-verified with Playwright against the real
  backend (run from a throwaway git worktree so this checkout didn't
  need to leave its own branch) + the real seeded property: full page
  renders with no console errors beyond the expected logged-out
  `/auth/refresh` 401; temporarily flipped the seeded property to
  `listing_type=sale` in the real dev DB (and back again after) purely
  to see the loan calculator render, since the standing demo property is
  a rental; confirmed the 404 path renders `ErrorState` correctly for a
  made-up id.
- **Property Listings page shipped 2026-07-30** — new `/properties`
  route (`app/(client)/properties/page.tsx`), built against the
  backend's new `GET /api/v1/properties` (10_Phase_3.md P3-T10) and the
  real Figma "Curated Listings" screen (node `28:646`), same scope cut
  agreed with the user as the backend task — see that entry above and
  memory `figma-listings-search-screen-2026-07-30` for the full filter
  inventory and what was deliberately left out (metro-station named
  search, commercial sub-categories, "founder's property", map view).
  New `features/properties/listings/`: `FilterSidebar` (price range,
  bedrooms, listing type — Figma's ambiguous "Residential/Commercial"
  pills repurposed to Buy/Rent/PG since that's what `listing_type`
  actually models — property type using real `PropertyType` category
  names instead of Figma's marketing copy, and amenities),
  `ListingsToolbar` (heading/count, Grid/"Show on map" toggle — map view
  shows a "not available yet" toast, same pattern as the Details page's
  un-built enquiry form — and a sort dropdown limited to the 3 sorts the
  backend actually supports, relabeled "Newest" instead of Figma's
  "Featured" since there's no boost/curation system to back that claim),
  `ListingsGrid` (first real use of the shared `PropertyCard`, previously
  only exercised in `/dev/components`), `ListingsPagination`. `PillGroup`
  (features/auth/preferences) gained a new `"filter"` variant matching
  Figma's exact pill styling, reused for Listing Type/Amenities rather
  than duplicating a near-identical component. Filter state lives in
  local component state only, not synced to the URL — a deliberate,
  smaller first-pass scope, noted as follow-up. **Two real bugs found
  by actually loading the page, not just reading the code:** (1) the
  price-range filter defaulted to ₹50L–₹15Cr and was always applied,
  even before touching the slider — harmless for sale prices but a
  monthly rent/PG price (e.g. ₹18,000) is nowhere near that range, so
  the very first page load silently hid most rental/PG listings with no
  visible filter active; fixed by only sending `price_min`/`price_max`
  once the slider actually moves off its resting ends. (2) The same
  null-vs-undefined class of bug fixed on the Account tab months ago:
  backend `Optional[int]` fields always serialize as an explicit JSON
  `null`, never an absent key, but the new `PropertyListItem` type
  declared them as optional (`field?: T`) rather than nullable
  (`field: T | null`) — so a property with no bedroom count (an office,
  a plot) rendered a stray, number-less "BHK" label instead of omitting
  it, since `null !== undefined` in `PropertyCard`'s optional-field
  check. Fixed by typing those fields to match what the backend
  actually sends. `tsc`/`eslint`/`next build` all clean. Live-verified
  with Playwright against the real backend + the 11 seeded demo
  properties from the backend task: full 11-property grid loads by
  default; every filter (listing type, property type, amenities)
  narrows to exactly the right cards, confirmed via both the real
  network requests and the resulting grid; both price sorts order
  correctly; Reset All clears everything; a zero-match filter
  combination renders a real empty state, not a blank page; clicked a
  listing card through to its real Property Details page and confirmed
  no console errors, including for a property with no bedroom count —
  exactly the case bug (2) was hiding. **Not yet done, on purpose:**
  linking this page in from the homepage/nav (separate task, same
  pattern as Property Details), a mobile-specific filter drawer (the
  sidebar is a static column today, not yet responsive), and URL-synced
  filter state.
- **Homepage "Explore all properties" linked, 2026-07-30** — the
  homepage `Listings.tsx` section's CTA (previously a dead `<button>`
  with no `onClick` at all) now routes to `/properties` via `next/link`.
  Verified live: click navigates correctly, no console errors.
  Everything else on the homepage (hero search bar, the 3 mock
  `PropertyCard` tiles) is still unwired — a separate, later task.
- **Remaining Figma gaps filled on both pages, 2026-07-31** — closes
  every "deferred, not built" item from the Property Details and
  Listings tasks above except what genuinely needs new backend work
  (tracked separately, not started yet). **Property Details:**
  "Redesign with AI" (hero gallery overlay button, node `127:1499`) now
  renders for real — toasts "not available yet" like the contact
  form's actions, no image-gen service exists. **Vaastu Compliance**
  (node `166:3505`) renders as an honest "Coming soon" card instead of
  Figma's scored checklist — confirmed with you rather than fabricating
  a score, since no per-room facing/plot-shape data exists on
  `Property` to compute one from. **Market Context card** (node
  `31:2041`) keeps its visual shape but swaps Figma's fabricated
  per-property commentary ("14% YOY appreciation...") for honest
  "coming soon" copy; "Download Market Report" toasts, per your
  explicit choice on that button specifically. **Listings page:**
  Metro Station/Property Use/"Founder's property" sections (previously
  omitted entirely) now render matching Figma but disabled + labeled
  "(Coming soon)" — checkboxes that silently no-op on click would read
  as broken, worse than the toast pattern used for one-off buttons.
  New **mobile filter drawer**: sidebar hidden below `lg`, a "Filters"
  button in the toolbar opens the same filter set in the existing
  shared `Modal` (drawer variant, bottom sheet) with a sticky "Show N
  results" footer that updates live. New **URL-synced filter/sort/page
  state**: every filter + sort + page now lives in the URL query string
  (same param names the API takes), written via `router.replace` (no
  history spam), read back on load — filtered views are now bookmarkable/
  shareable; required wrapping the page in `<Suspense>` for
  `useSearchParams` (confirmed via `next build` that `/properties`
  still statically builds, not forced dynamic). `lib/api/endpoints/
  properties.ts`'s `buildQueryString` exported so the page reuses the
  exact same param-serialization the API client uses, rather than
  duplicating it. **Two real bugs found live-testing, not just reading
  the code:** (1) the mobile toolbar row (Filters + Grid/Map toggle +
  Sort) overflowed horizontally on a real phone-width viewport, cutting
  off the sort control — fixed by hiding the non-functional Grid/Map
  toggle below `sm`. (2) The new mobile drawer failed a real
  accessibility check on open — Radix flagged the dialog for a missing
  `DialogTitle`/description, since neither was passed to avoid visually
  duplicating `FilterSidebar`'s own "Filters" heading; fixed with a
  screen-reader-only title/description rather than skipping them.
  `tsc`/`eslint`/`next build` all clean. Live-verified with Playwright:
  both new Details-page toasts fire correctly; every new Listings
  section renders disabled/"(Coming soon)"; filter changes update the
  URL live and a cold-loaded URL with filters/sort/page pre-set
  restores the exact same UI state with no interaction; resized to a
  real phone viewport, confirmed the toolbar no longer overflows,
  opened/used the mobile drawer (live result count + sticky footer
  button both updated together), zero console errors/warnings
  throughout. **Still not started, on purpose:** backend cleanup for
  whichever of these should get real support (enquiry form, metro
  station dataset, property-use/founder's-property data model, Vaastu
  data, market data) — scoping that with you before writing any of it.
- **Homepage hero search + trending listings connected to real backend,
  2026-07-31** — the two remaining frontend-only homepage pieces (hero
  search widget, "Trending" property grid) now hit the real
  `GET /properties` endpoint. `features/homepage/Hero.tsx`'s "Explore"
  button pushes real filters onto `/properties` via the same
  `buildQueryString` the Listings page uses (`lib/api/endpoints/
  properties.ts`); Property Type dropdown options are relabeled per tab
  to the real `PropertyType` enum (furnishing labels like "Fully
  Furnished" aren't a real filter, so kept out rather than shipped as a
  dead control) and Price Range labels map to real numeric min/max
  pairs. `features/homepage/Listings.tsx`'s "Trending in Bengaluru"
  section now fetches the 3 newest active Bengaluru listings for real,
  with a real listing-type badge (For Sale/For Rent/PG) replacing the
  fabricated "Premium Curation"/"Exclusive" marketing labels, and links
  through to the real `/properties/{id}` page. Added `city` as a real,
  URL-synced filter on the Listings page itself (`features/properties/
  listings/types.ts`, `app/(client)/properties/page.tsx`,
  `ListingsToolbar.tsx`) — the backend already supported it, nothing on
  the frontend used it — so a hero search lands on the correctly scoped
  result set (toolbar heading switches to "Properties in {city}" as
  visible confirmation). `tsc`/`eslint`/`next build` all clean.
  Live-verified with Playwright against the real backend + seeded data:
  a full Buy → Villa → ₹1Cr–3Cr → "Bengaluru" → Explore search produced
  the exact right URL and landed on the Listings page with the right
  heading and a correct (real) empty-result state; a broader
  `city=Bengaluru&listing_type=sale` search correctly returned "Showing
  2 properties"; the homepage Trending grid rendered 3 real properties
  with correct badges/prices, and clicking through a real card's "VIEW
  DETAILS" loaded its real Property Details page cleanly.
- **Saved Properties frontend shipped 2026-08-03** (P3-T40, frontend
  half) — wired the previously-cosmetic heart/save button on
  `PropertyCard` to the real backend from the same task's other half.
  New `lib/api/endpoints/savedProperties.ts` and `lib/hooks/
  useSavedPropertyToggle.ts` (the shared piece: fetches up to 50 saved
  ids for card display — not the real paginated Saved list, that's
  still a separate un-built screen, P3-T41 — and exposes an optimistic
  `onToggleSave(id)` with rollback-on-error; shows a "Log in to save
  properties." toast instead of firing a request if the visitor isn't
  authenticated). Both `ListingsGrid.tsx` (the `/properties` page,
  shared `PropertyCard`) and the homepage `Listings.tsx` Trending
  section (its own bespoke inline card) now source real `savedIds`/
  `onToggleSave` from this one hook instead of each having its own
  local, non-persisted `liked` state. `tsc`/`eslint`/`next build` all
  clean. Live-verified with Playwright, already authenticated as the
  standing test account, against the real backend + seeded data: saved
  a homepage Trending card (`PUT` → `204`, heart turned red
  immediately), hard-reloaded, and confirmed the same property still
  showed saved — read straight off the real DOM
  (`aria-label="Remove from saved"`, SVG `fill="#ef4444"`) since a
  screenshot at that scroll position didn't render the small heart
  clearly enough to eyeball — then unsaved it (`DELETE` → `204`).
  Repeated the identical save/unsave round trip on the `/properties`
  Listings grid. No console errors from the app itself. **Confirmed
  while investigating this: `/profile/my-properties` is NOT the same
  concept as this Saved feature** — its own skeleton file documents it
  as properties the user *owns* (needs backend ownership data that
  doesn't exist yet), not a saved/watchlist screen; the real "Saved"
  destination is most likely the nav bar's existing "Saved" link
  (currently a dead `#` href) — P3-T41, needs its own Figma pull before
  building, not yet started.
- **Saved Properties screen shipped 2026-08-03** (P3-T41) — new
  `app/(client)/saved/page.tsx`, wiring the nav bar's "Saved" link
  (`components/shared/TopNavBar.tsx`: only that one link now routes
  somewhere real — Discover/AI Tools/Compare stay `#`). Pulled the real
  Figma design (`Client view` page, section "saved", node `133:3060`,
  "Your Curated Collection") — a far richer screen than scoped (private
  notes per card, a multi-select "Compare" tool, "Book a Private Tour"/
  "Contact Curator" actions), none backed by real data or a service, so
  built the scoped-down version: the real saved list as shared
  `PropertyCard`s + a real empty state. `AuthGuard`-gated (all roles).
  Reuses `ListingsGrid`/`ListingsPagination` (gained an optional
  `emptyState` prop rather than forking the grid) and the existing
  `SAVED_IDS_QUERY_KEY` (now exported from `useSavedPropertyToggle.ts`)
  so unsaving here invalidates the same cache the Listings page/homepage
  Trending section read from — hearts stay in sync across all three
  without a reload. New backend support (see backend CLAUDE.md,
  2026-08-03): `property_type` filter + `sort` param on
  `GET /saved-properties`. `tsc`/`eslint`/`next build` all clean.
  Live-verified against the real backend + Supabase dev DB: saved/
  unsaved down to the empty state (count text pluralizes correctly at 0/
  1/N), confirmed cross-page cache sync, confirmed session rehydrates
  cleanly on a hard reload of `/saved` with no bounce to login.
  **Visual-accuracy follow-up, same day** — you compared a screenshot
  against Figma and flagged three gaps: (1) the subtitle copy didn't
  match Figma's literal text — now reads "N exceptional properties
  meticulously selected for your portfolio" with a real dynamic count;
  (2) the category pills (All/Villas/Penthouses/Commercial) and
  "Recently Saved" sort were cosmetic-only — both now real, backed by
  the new backend params above; "Penthouses" stays visible per Figma but
  disabled (no matching `PropertyType` exists); (3) the sort control was
  misplaced (inline with the pills, full-width) and the bottom
  "Schedule a Portfolio Review" banner was missing its background photo
  — Figma actually places the sort control in the Header row next to the
  title (node `133:3062`), not the Filters row, so it moved into a new
  `SavedSortControl.tsx` (compact pill button, `ArrowUpDown` icon) split
  out from the pill-only `SavedCategoryPills.tsx`; the CTA
  (`PortfolioReviewCta.tsx`) now blends the real Figma conference-room
  photo under its gradient via `mix-blend-overlay`, matching Figma's
  layer order exactly — downloaded locally to `public/saved/
  portfolio-review-bg.png` since Figma asset URLs expire after 7 days
  (same precedent as the Login screen's `brand-panel.png`). Button still
  toasts "not available yet" — no curator service exists. Re-verified
  live: all three fixes screenshot-matched against the Figma reference,
  zero console errors. **Compare (the multi-select tool + "Selected: N
  Properties" counter from the same Figma frame) remains explicitly out
  of scope**, per your instruction. **Superseded 2026-08-04 — see below,
  Compare shipped.**
- **Compare properties shipped 2026-08-04** (P3-T42, frontend half) —
  reverses the "out of scope" note directly above. Pulled the real Figma
  design this session (file `YvQ2kfODoSxUTwYo6JZ7Tv`, "Client view"
  page): a checkbox overlay on the property card image (bottom-left,
  "Selected for Comparison" label when checked — not a separate icon
  button, which a first pass without Figma access would have guessed),
  a "Selected: N Properties"/"Compare" control in the Saved page's own
  Filters row (node `133:3060`/`133:3084`-`133:3090`, exact colors/fonts
  pulled — this is the exact control the Saved task above dropped),
  reused on the Listings page toolbar too per `06_Component_Library.md`'s
  explicit "floating drawer over saved/search" scope (not the homepage,
  which isn't in that scope and has no Figma frame showing it either), a
  persistent floating `CompareDrawer` (node `133:3227`, exact styling),
  and a full `/compare` "Comparison" screen (node `150:15348`) with 4
  accordion sections. New `lib/stores/compare.ts` (Zustand + `persist` —
  the project's first use of that middleware; unlike the memory-only
  `authStore`, this is a plain UI selection with no security constraint
  against localStorage), `lib/hooks/useCompareProperties.ts` (shared
  react-query fetch), `features/properties/CompareSelectionBar.tsx`,
  `components/shared/CompareDrawer.tsx`, `app/(client)/compare/page.tsx`
  + `features/properties/compare/` (`ComparisonHeader`,
  `ComparisonPropertyCard`, `ComparisonAccordionSection`,
  `ComparisonTable`). `PropertyCard.tsx` gained `isComparing`/
  `onToggleCompare` alongside the existing save-toggle props.
  **Two real conflicts found only once the actual Figma file was pulled,
  both resolved with you before writing code:** (1) Figma's own hint
  copy says "up to 3", conflicting with `05_API_Design.md`'s drafted
  max 4 — resolved as 3, doc corrected (see backend entry above); (2)
  the Comparison screen's Possession/Airport-distance/Nearby-Schools
  rows and its entire Investment section (Rental Yield, Appreciation %,
  RERA Status) have zero backing data on `Property`, and the per-card
  "✦ Best Value" etc. badges have no scoring algorithm — resolved as
  honest omission (Investment renders "Coming soon"), same pattern as
  the Details page's Vaastu/Market Context sections, over the
  alternative of shipping static placeholder numbers. Amenities uses the
  real sorted union of amenities across the compared properties (not
  Figma's fixed 8-item checklist) — genuinely data-driven, not a
  simplification. `tsc`/`eslint`/`next build` all clean. Live-verified
  with Playwright against the real backend + Supabase dev DB: toggled
  compare from both the Listings grid and the Saved page; confirmed the
  Filters-row counter, the floating drawer, and localStorage persistence
  across a hard reload all stayed in sync; hit the 3-item cap and got
  the correct toast with no state change; "Compare Now" produced a real
  Comparison screen with correct Amenities checks and an honest
  "Coming soon" Investment section; loaded a `/compare?ids=...` URL
  directly with an empty local store (simulating a shared link) and
  confirmed it still rendered correctly with no floating drawer (store
  genuinely empty, as intended); removed properties down to 1 and
  confirmed the insufficient-selection empty state; confirmed the nav
  bar's "Compare" link now routes correctly. Zero console errors
  throughout.
- **PropertyCard plain-`<a>` logout bug fixed, 2026-08-04** — reported
  live: clicking a property card on `/saved` navigated to the Property
  Details page, then bounced to `/login?returnTo=%2Fsaved`. Same root
  cause and fix as the earlier Profile sidebar logout bug: `PropertyCard.tsx`
  rendered its whole-card link as a plain `<a href>`, not `next/link`'s
  `Link` — already flagged as a risk in project memory ("recheck if
  [PropertyCard] gains a real route behind AuthGuard") back when only the
  public homepage used it. The Saved page (AuthGuard-protected) started
  rendering `PropertyCard` via `ListingsGrid` for P3-T41, so the risk
  materialized: each card click did a full page reload, wiping the
  memory-only `authStore`; enough reloads in quick succession tripped the
  `/auth/refresh` 5/min rate limit, and `refreshAccessToken()` treats any
  non-2xx (including `429`) as an invalid session and clears the store —
  AuthGuard then bounced whatever protected page was mounted to `/login`.
  Fixed by swapping the plain `<a>` for `next/link`'s `Link` in
  `PropertyCard.tsx` — no other change needed since the nested heart/
  compare buttons already call `stopPropagation()`, which prevents
  `Link`'s client-side navigation exactly like it prevented the native
  anchor's default navigation. `tsc`/`eslint` clean. Live-verified against
  the real backend + Supabase dev DB (`hello@thesketchystudio.com`):
  logged in, clicked a saved property card through to Details, navigated
  back to `/saved` via the nav bar link — network log confirmed **zero**
  `/auth/refresh` calls fired during that whole client-side sequence
  (versus one per reload before the fix), and the session stayed
  authenticated throughout.
- **`/compare` landing screen now shows saved properties to pick from,
  2026-08-04** — you flagged that visiting `/compare` with nothing
  selected just showed a bare "browse properties" empty state instead of
  letting you pick right there. New
  `features/properties/compare/ComparePicker.tsx`: shown whenever the
  URL has fewer than 2 ids, reusing the exact `ListingsGrid`/
  `CompareSelectionBar`/`useCompareStore` wiring the Saved and Listings
  pages already use, fetching the visitor's own saved properties via the
  same `listSavedProperties` call the Saved page uses. Three states:
  unauthenticated → a "Log in to see your saved properties" prompt
  (`/login?returnTo=%2Fcompare`, since `/compare` itself stays public/
  ungated — only this section needs auth); authenticated with nothing
  saved → the existing "browse properties" empty state; authenticated
  with saved properties → the real grid with working save/compare
  toggles, so picking 2-3 and clicking "Compare" flows straight into the
  real comparison table. `tsc`/`eslint`/`next build` clean. Live-verified
  with Playwright against the real backend + Supabase dev DB: cleared
  local compare selection, loaded `/compare` while logged in, confirmed
  the 3 real saved properties rendered with working checkboxes, selected
  2, clicked "Compare", landed on the real `/compare?ids=...` comparison
  table with correct data. Zero console errors.
- **Full codebase standards cleanup, 2026-08-10** — a full audit of
  everything built through Phase 3 (both `homigrow-backend-wt` and this
  checkout) against this file's own coding standards, done in 5 phases
  each independently verified (backend: full 195-test suite + `ruff`
  clean before/after every step; frontend: `tsc`/`eslint`/`next build`
  clean throughout, plus a live Playwright screenshot comparison for
  the one visually-sensitive change). Pure cleanup — no API contract,
  response shape, or visual/functional behavior changed anywhere.
  Backend: stripped task-ID/doc-pointer/dated narration from comments
  across `app/`; extracted the duplicated `_pg_enum` model helper, the
  duplicated property list-item query logic, and the duplicated
  pagination field into shared modules (`app/models/_helpers.py`,
  `app/services/_property_query_helpers.py`,
  `app/schemas/_pagination.py`); wired up the previously-unused
  `RateLimited` exception class; moved the CSRF origin-check and the
  compare-id count rule out of route files into their services, per
  this file's own routes-call-services rule. Frontend: same comment
  cleanup across 44 files; extracted 7 different pieces of duplicated
  logic/constants into shared sources (`lib/utils.ts`,
  `lib/property-media.ts`, `lib/enums.ts`, `lib/fonts.ts`,
  `lib/stores/createPersistedStore.ts`,
  `features/auth/preferences/options.ts`); replaced the homepage's
  hand-copied `PropertyCard` with the real shared
  `components/shared/PropertyCard.tsx` (the one direct "shared
  components are built once" violation found — needed one small
  additive `style` prop on `PropertyCardBadge`, not a fork); brought 4
  homepage widgets that silently faked a successful submission in line
  with the project's existing toast+`# TODO:` stub convention for
  unbuilt-backend actions. Full findings + what was fixed documented in
  `docs/implementation/backend/Phase_3_Implementation.md` and
  `docs/implementation/frontend/Phase_3_Implementation.md`. Left
  untouched, on purpose: an unrelated, already-in-progress nav-search
  feature (`q` → `search`) sitting uncommitted in the backend worktree
  from an earlier session — real feature work, not part of this pass.
  Changes not yet committed — pending your review.
- **Preferences tab + logout + homepage Areas redesign shipped
  2026-08-13** — three items pulled from Figma this session.
  **Logout**: new `LogoutButton` in `features/profile/ProfileSidebar.tsx`
  (Figma node 570:1972, red `#e24747`, below a divider under the Settings
  nav group) — calls `POST /auth/logout` then clears `authStore`. Uses a
  **hard navigation** (`window.location.href = "/"`), not `router.push` —
  the page it's clicked from sits behind `AuthGuard`, so a client-side
  push raced `AuthGuard`'s own redirect (it re-evaluates the now-cleared
  store while still mounted and won, landing on `/login?returnTo=...`
  instead of home); found and fixed via live Playwright testing, not
  spotted by inspection. **Preferences tab** (Figma node 569:671,
  "Preferences" nav item added between Account/My Properties): per your
  explicit instruction, `AccountTab.tsx`'s entire "Buyer Profile" section
  is now **removed** — the Preferences tab is the sole view+edit surface
  for `preferences.buyer_preferences` (all 15 `BuyerPreferences` fields,
  not just the 4 Account tab used to expose). New
  `features/profile/preferences/`: `PreferencesTab.tsx` (view mode —
  every field as a labeled `OverflowChipsSection`, Figma's own
  dark-chip/"+N more"/"Show less" pattern generalized from Figma's 3
  demo categories to all 15; an empty state if the user skipped the
  wizard entirely), `OverflowChipsSection.tsx`, `PreferencesEditForm.tsx`
  (edit mode — reuses the signup wizard's own input components verbatim:
  `BudgetRangeSlider`, `CityMultiSelectChips` — the real city
  search/dropdown — `PropertyTypeCardGrid`, `PillGroup`,
  `SelectableCardGroup`, `ChecklistGroup`, `ChipMultiSelect` — rather than
  building a second set of controls), `labels.ts` (value→label lookups
  for the view). **Centralized `features/auth/preferences/options.ts`**
  as part of this: 9 option lists that were previously locally-scoped
  consts inside individual wizard step files (`ExitStrategyStep.tsx`,
  `DevelopmentStageStep.tsx`, etc.) are now exported from `options.ts`
  and imported by both the wizard steps and the new Preferences tab —
  removes the duplication a second full copy would otherwise have
  required. `lib/validation/profile.ts`'s `accountFormSchema` dropped its
  `buyer_preferences` field entirely. **Homepage Areas section**
  (`features/homepage/Areas.tsx`) redesigned to match the current Figma
  frame (node 388:122): the colored top strip is gone — the price block
  itself is now a colored box (`#f4fef1` mint / `#fef1f1` red) with the
  trend text inside it; tags dropped to `4px` radius at full text
  opacity; the CTA changed from a filled gray "VIEW ALL PROPERTIES"
  button to an outlined "VIEW PROPERTIES" one; and the header button now
  correctly reads **"More areas"** (was "More tools" — an unrelated
  copy-paste leftover, unrelated to this section's own data). `tsc`/
  `eslint`/`next build` all clean (`/profile/preferences` present in the
  build's route table). Live-verified with Playwright against the real
  backend + Supabase dev DB, logged in as the standing test account
  (which already had real wizard-collected `buyer_preferences`): view
  mode rendered all 15 fields with correct labels; edit mode's city
  dropdown/search worked, added a city and toggled a bedroom option,
  saved, and confirmed the change persisted via a fresh page load;
  Account tab confirmed to no longer show any Buyer Profile content;
  logout tested both before and after the hard-navigation fix (before:
  bounced to `/login?returnTo=...`; after: clean landing on `/` showing
  "Sign In"); homepage Areas section screenshot-compared against Figma at
  normal desktop width, matches. Changes not yet committed — pending your
  review.
- **TopNavBar logo linked to homepage, 2026-08-13** — the "H" logomark in
  `components/shared/TopNavBar.tsx` was a dead `<a href="#">`; now a real
  `next/link` `Link` to `/`. Live-verified: clicking it from `/properties`
  lands cleanly on the homepage.
- **Homepage "Coming Soon" section matched to Figma, 2026-08-13** —
  `features/homepage/EarlyAccess.tsx`'s 3-item feature list used raw emoji
  (✨🎯💰) instead of real icons; pulled the actual Figma node (`388:924`)
  and swapped in lucide-react's `Sparkles`/`Target`/`IndianRupee` (Figma's
  `Sparkle`/`Target`/`CurrencyInr`, matched to the codebase's existing
  icon library rather than adding a new one). Also corrected against the
  same Figma pull: icon circles are white with dark icons, not
  green-tinted with green icons; the "Coming Soon" badge is a rounded-8px
  box, not a full pill; the background gradient angle was `135deg` vs
  Figma's `146deg`; form field padding was `14px 16px` vs Figma's
  `15px 17px`; and a decorative radial-gradient glow blob in the code had
  no basis in the actual Figma design, so it was removed. Live-verified
  with a fresh screenshot compared directly against Figma's own render —
  matches. `tsc`/`eslint` clean, zero console errors.

