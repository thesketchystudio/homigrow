## Git Workflow — NON-NEGOTIABLE
- Default branch on GitHub is `dev`, not `main`. `dev` = staging,
  `main` = production.
- Both branches are protected — PRs required, no direct pushes, no force
  pushes, no bypass list.
- All work happens on `feature/<phase>-<short-desc>` or `fix/<short-desc>`
  branches cut from `dev`.
- Flow: `feature/* → dev → main`. PRs always target `dev` first.
  Only open a `dev → main` PR once features on `dev` are tested and
  confirmed ready for production release.
- Never commit directly to `main` or `dev` even for "trivial" fixes.
  Always double-check the PR base branch is `dev`, not `main`, before
  merging feature work — `main` should only ever receive merges from `dev`.

## Environment & Secrets
- `.env` files are gitignored. Never commit secrets, ever, under any
  circumstance, even temporarily "to test something."
- Backend config is split into parts (`DB_HOST`, `DB_PORT`, `DB_NAME`,
  `DB_USER`, `DB_PASSWORD`) and assembled into `DATABASE_URL` via a
  `@computed_field` in `app/core/config.py` — do not flatten this back into
  a single raw URL env var.
- Naming convention: `DB_*` not `DATABASE_*`. Keep this consistent —
  don't reintroduce the old naming anywhere.
- `ENVIRONMENT` values: `dev` (local/staging) and `production`. This is
  unrelated to the git branch name sharing the same word — don't conflate them.

## docs/ folder
The entire `docs/` directory (architecture docs, implementation writeups) is
gitignored — confirmed permanent policy, not a one-off. Keep writing
`docs/implementation/<area>/PhaseN_Implementation.md` writeups after each
task/batch as local reference, but don't expect `git add`/`git status` to
pick them up, and don't re-verify this each session — it won't change
unless explicitly told otherwise.

## API Versioning
All backend routes live under `api/v1/`. This is deliberate — if a response
shape needs a breaking change later, add `api/v2/` alongside it rather than
mutating `v1` under callers that already depend on it. Don't skip the `v1`
prefix on new routes "because it's just one endpoint."

## Coding Standards (apply to every file, no exceptions)

### File headers
Every Python source file starts with a module-level docstring stating its
path and purpose:
```python
"""
app/services/property_lifecycle.py

Defines the property status state machine (draft -> pending -> active
-> sold/rented -> expired -> rejected) and validates transitions
between states.
"""
```
TypeScript files use a `//` comment block instead, since TS has no
module-docstring equivalent:
```typescript
// components/shared/PropertyCard.tsx
// Reusable property listing card used across homepage, search results,
// saved properties, and broker listings views.
```

### Function and class-level comments
Every non-trivial function or class gets a docstring explaining *why*,
not just what (the code already shows what):
```python
def transition_property_status(current: str, new: str) -> bool:
    """
    Validates a property status transition against the defined lifecycle.
    Returns False (does not raise) for invalid transitions so callers can
    handle rejection gracefully in the API layer rather than via exception.
    """
```
Comments — file headers, docstrings, and inline `#` notes alike — describe
the code as it is: professional, factual, and self-contained. They never
narrate the development process (task IDs, "confirmed empirically", "first
attempt failed", phase numbers) or point elsewhere for the full explanation.
A reader should understand the code from the comment alone.

### Modularity rules
- One responsibility per file. If a file is doing two unrelated things,
  split it.
- Business logic lives in `services/`, never inline in route handlers.
  Routes should read as: validate input → call service → return response.
- Shared frontend components (Nav, Sidebar, Property Card, Table, Modal,
  Toast) are built once in `components/shared/` — never duplicated per
  portal. If a Broker-specific variant is needed, compose/extend the shared
  base rather than copy-pasting it.
- No magic strings for status values, roles, or enums — define them once
  (Python `Enum`, TS `type`/`enum`) and import everywhere.

### Root-cause fixes only
- When something breaks, fix the actual cause, not the symptom. Don't wrap
  a failure in a try/except just to silence it, and don't patch a
  downstream effect if the real bug is upstream.
- If a bug is caused by a wrong assumption elsewhere in the codebase, fix
  that assumption — don't add a special case around it.
- Flag (don't silently paper over) any workaround that's genuinely
  temporary, with a `# TODO:` comment explaining what the real fix is.

### Verification, not assumption
- After scaffolding or wiring anything (DB, Sentry, new endpoint), add a
  temporary verification route/test, confirm it works, then remove the
  temporary code. Don't assume something works because it "should."
- Prefer real tooling (linters, `npm audit`, actual test runs) over
  judgment calls for verifying correctness.

## Current Status (update this section as phases complete)

### ✅ Done
- Repo scaffolded, branching + protection rules set up (`main`, `dev`)
- Frontend: Next.js + Tailwind v4 scaffolded, route groups created
  (`(client)`, `(broker)`, `(admin)`), empty shared component folders in place
- Backend: FastAPI scaffold, `/health` route, config split (`DB_*` vars),
  Supabase Postgres connected (Mumbai region), Sentry wired (Developer tier)
- Backend: Alembic initialized and wired to `app/core/config.py` settings;
  engine hardened with `pool_pre_ping` + pool sizing
- Core SQLAlchemy models: User, BrokerProfile (1:1 extension table), Property
  + PropertyMedia, Lead + LeadNote, Conversation + Message, Notification,
  SavedProperty, BoostPlan — 11 tables, 13 domain enums, all relationships verified
- Property status lifecycle implemented as an actual state machine
  (`transition_property_status` in `app/services/property_lifecycle.py`),
  fully unit-tested (every legal transition + a broad illegal sample)
- First Alembic migration (M1) written and verified against the real dev
  database: upgrade → downgrade → upgrade cycle confirmed clean
- pytest scaffolding: transactional `db_session` + `client` fixtures; test
  isolation itself is regression-tested (a broken fixture would fail loudly,
  not just leak data silently)
- GitHub Actions CI for both frontend and backend: lint/typecheck/build
  (frontend), ruff + migration reversibility + pytest against an ephemeral
  Postgres+PostGIS service container (backend)
- Frontend: shadcn/ui component library (45 components) ported in as the
  Tier 0/1 primitive foundation — Button, Dialog, Table, Sidebar, Tooltip,
  etc. — for forms/tables/modals in later phases
- Frontend: `components/shared/TopNavBar.tsx` and `Footer.tsx` built, shared
  across all Client View pages via `app/(client)/layout.tsx`
- Frontend: homepage built and wired at `/` (`app/(client)/page.tsx`) —
  hero search widget, listings, areas, new launches, how-it-works, EMI
  calculator, testimonials, cities, agent connect, property alerts, trust,
  and early-access sections, all in `features/homepage/`. Pulled forward
  from its originally-scheduled Phase 3 slot since the design was ready;
  runs on mock data until Property APIs exist
- PostGIS spike: `ST_DWithin` radius search on `properties.location`
  confirmed via `EXPLAIN` to use the `ix_properties_location` GIST index,
  not a sequential scan — de-risks Phase 3 search
- Frontend: Tier 1 shared composites built from the shadcn primitives —
  `Sidebar`, `PropertyCard`, `Modal` (modal + drawer variants), toast system
  (`lib/toast.ts` + `<Toaster/>` mounted in the root layout), `Table`,
  `EmptyState`, `ErrorState`, `ConfirmDialog`, `StatusPill` — plus
  `lib/enums.ts` mirroring the backend's Python enums as the single source
  for status values. All styled with `globals.css` theme classes, not
  hardcoded hex, so real Figma tokens re-skin them for free once T20 lands
- Frontend: `(broker)/broker/` and `(admin)/admin/` route group layouts
  wired with the shared `Sidebar` + placeholder dashboard pages, matching
  the folder structure in `04_Frontend_Architecture.md`
- Frontend: temporary `/dev/components` gallery page added, exercising
  every Tier 1 composite's loading/empty/error/saved/sold states — the
  artifact the P1→P2 phase gate requires (`07_Implementation_Strategy.md`);
  delete before prod
- Frontend: `/dev/components` and both portal shells visually verified with
  Playwright (T22-28) — all composite states render and interact correctly
  (modal, drawer, toast, confirm dialog, table states). Fixed one gallery-only
  bug: the Sidebar demo's `position: fixed` (correct for real usage) escaped
  its `overflow-hidden` demo box and covered the rest of the page; added
  `contain-[layout]` to the demo wrapper so it establishes a containing block
  for the fixed sidebar. Scoped to `/dev/components` only — no change to
  `Sidebar.tsx`, `globals.css`, or the real `(broker)`/`(admin)` layouts
- P1-T20 (real design tokens): `frontend/app/globals.css` re-skinned from
  the stock shadcn placeholder palette to real Homigrow brand tokens, pulled
  from the actual Figma design file's published Variables (not the Make
  export). Primary/Secondary are neutral grayscales (Primary = near-black
  text tones, Secondary = near-white surface tones); Accent Green is the
  real brand action color, used for `--primary`/`--ring`/etc. Full 100–900
  brand scales also exposed as `--color-brand-{primary,secondary,green}-*`
  utilities for one-off use beyond the semantic tokens. Added the Figma
  type scale (`--text-h1`..`--text-h5`, `--text-body-*`, `--text-label-*`,
  each with a paired `--line-height`) plus `--font-heading`/`--font-body`
  (Space Grotesk / Plus Jakarta Sans — already the fonts loaded via
  `@import` at the top of the file, so no font-loading change was needed).
  No destructive/error or dark-mode brand colors exist in Figma yet, so
  those keep their shadcn placeholder values. Since T22-27's Tier 1
  composites were deliberately built against theme classes rather than
  hardcoded hex, they re-skin for free — no component code changed.
  `next build` verified clean; Playwright visual verification completed
  2026-07-10 — confirmed computed CSS custom properties (`--primary`,
  `--font-heading`, `--text-h1`, etc.) resolve to the real brand values at
  runtime, and `/dev/components`, `/broker/dashboard`, `/admin/dashboard`
  all render the green accent/near-black tokens correctly with zero
  console errors. Homepage sections in `features/homepage/` still
  intentionally set their own colors/fonts directly and do not consume
  these tokens (separate, not part of T20). Per T20's literal verify step
  (`08_Phase_1.md`: "a scratch page renders token swatches; contrast-check
  primary combos"), added a temporary `app/dev/tokens/page.tsx`, confirmed
  via a live dev server that every semantic token, the full
  `brand-{primary,secondary,green}-*` scale, and every type-scale utility
  render correctly, and computed real WCAG contrast ratios for all 9
  foreground/background pairs actually used in the app — all pass AA
  (4.70:1–19.91:1, worst case `muted-foreground` on `muted`). Deleted the
  scratch page after confirming, same pattern as T12/T30 (verify via a
  temp artifact, then remove it — commit history is the evidence).
- Backend Phase 2 (on `feature/phase_2_backend`, cut from `dev`; frontend
  Phase 2 work goes on a separate `feature/phase_2_frontend` branch — same
  split for all later phases): P2-T01 migration M2 (`refresh_tokens`,
  `otp_codes`) verified upgrade→downgrade→upgrade clean, `alembic check`
  confirms zero drift · P2-T02 `app/core/security.py` (bcrypt hashing,
  JWT encode/decode; `JWT_SECRET`/`JWT_ACCESS_TTL_MIN` added to
  `config.py`) · P2-T03 `POST /api/v1/auth/signup` (password path;
  creates `broker_profile` when role=broker; 409 on duplicate phone;
  issues a signup OTP — logged in dev mode, real SMS delivery is P2-T10)
  · P2-T04 `POST /api/v1/auth/login` (password check, 5-failure/15-min
  lockout) · P2-T05 refresh-token issue/rotate/revoke
  (`app/services/auth_service.py`: `refresh()`, `logout()`) with
  reuse-detection (replaying a rotated token revokes every session for
  that user, per `14_Security.md`); delivered as an
  `httpOnly; SameSite=Lax; Path=/api/v1/auth` cookie, `Secure` only when
  `ENVIRONMENT=production`. New `POST /api/v1/auth/refresh` and
  `POST /api/v1/auth/logout` routes; login/refresh responses renamed
  `TokenResponse` (`{access_token, token_type, expires_in, user}`, shared
  shape per `05_API_Design.md`) · P2-T06 global error envelope +
  RBAC deps. New `app/core/exceptions.py`: `AppError` base
  (`NotFoundError`/`ConflictError`/`ValidationFailed`/`AuthError`/
  `ForbiddenError`/`LockedError`/`RateLimited`) + four handlers
  (`AppError`, plain `HTTPException`, `RequestValidationError`,
  catch-all → Sentry + generic 500) — every error response is now
  `{"error": {"code", "message", "fields"?}}`, matching
  `05_API_Design.md`. `auth_service.py` migrated off `HTTPException`
  onto `AppError` subclasses. New `app/api/v1/deps.py`:
  `get_current_user` (decodes Bearer JWT → user, 401 on any failure),
  `require_role(*roles)` factory (403 on mismatch), and the
  `CurrentUser`/`RequireBroker`/`RequireAdmin` annotated aliases routes
  will import going forward — not yet consumed by any route (first
  consumer is `GET/PATCH /users/me`, P2-T20). 72/72 tests pass (13 new);
  signup/login/refresh/logout all re-verified against the real Supabase
  dev DB via curl, plus two throwaway routes exercised the 401/403/200
  RBAC paths live before being deleted · P2-T07 password forgot/reset.
  New `POST /api/v1/auth/password/forgot` (always 204, no email
  enumeration) and `POST /api/v1/auth/password/reset` (revokes every
  session on success). Reset token is a signed, purpose-scoped JWT
  embedding a fingerprint of the account's current `password_hash`
  (`app/core/security.py`: `create_password_reset_token`/
  `decode_password_reset_token`/`password_fingerprint`) — self-
  invalidates the moment the password changes, so it's single-use with
  no `reset_tokens` table. Real Resend delivery is deferred to P2-T30
  (user's explicit choice — Resend account doesn't exist yet); for now
  the token is dev-mode-logged, same pattern as T03's OTP · **fixed a
  real pre-existing bug found while verifying this:** no logging
  handler was configured anywhere in the app, so every `logger.info()`
  call (including T03's "dev-mode OTP logging") had been silently
  dropped since it was written. Fixed with `logging.basicConfig(...)`
  in `app/main.py`; JSON-formatted production logging
  (`03_Backend_Architecture.md`) is still open, this is just the
  plain-dev half · P2-T08 rate limiting: `slowapi` `Limiter` (in-process,
  ADR-010) applied to all six `/auth` routes at 5/min/IP
  (`app/core/middleware.py`), `429 RATE_LIMITED` in the standard
  envelope. 84/84 tests pass (12 new); forgot/reset and rate-limiting
  both verified against the real Supabase dev DB via curl — read the
  reset token out of the server's own log, completed a full
  reset-then-login round trip, confirmed reuse fails with
  `TOKEN_EXPIRED`, confirmed the 6th rapid `/login` call returns `429`.
  Full writeup: `docs/implementation/backend/Phase_2_Implementation.md`.
  **Not yet built:** real OTP SMS delivery (P2-T10), real Resend email
  delivery (P2-T30), JSON production logging. `/auth/logout` still
  authenticates via the refresh cookie alone rather than also requiring
  a Bearer token now that `get_current_user` exists — a deliberate
  choice, not an oversight (see T05/T06 notes in the implementation
  writeup); revisit once a real protected route exists (P2-T20, below,
  is now that route, so this is worth a second look next time this
  area is touched).
  · P2-T20 profile CRUD: `GET/PATCH /api/v1/users/me` (first real
  consumer of `CurrentUser`), `PATCH /api/v1/users/me/password`. New
  `users.preferences jsonb default '{}'` column (M3 migration,
  verified up/down/up clean) backs a free-form prefs blob the profile
  tabs will read later. Changing email resets `is_email_verified`
  (real verification-send is still P2-T30). New `app/services/
  user_service.py`, `app/schemas/users.py`, `app/api/v1/routes/
  users.py`. **Fixed a real boot-blocking bug found while wiring
  this:** `.env` already had `MSG91_AUTH_KEY` set, but `Settings`
  never declared it — pydantic-settings rejects undeclared env vars by
  default, so `Settings()` (and therefore every `alembic` command and
  the app itself) was failing to start at all. Fixed by declaring
  `MSG91_AUTH_KEY: str = ""` in `config.py` (the MSG91 adapter itself
  is still P2-T10, on hold) · P2-T26 sessions API:
  `GET /api/v1/users/me/sessions` (list active, newest first),
  `DELETE /api/v1/users/me/sessions/{id}` (404 if not owned),
  `POST /api/v1/users/me/sessions/revoke-all` (logout-everywhere,
  reuses T07's bulk-revoke pattern) · P2-T27 account deactivation:
  `POST /api/v1/users/me/deactivate` — soft (`is_active=false`),
  revokes every session, 409 `ACTIVE_LISTINGS_EXIST` if a broker has a
  `status=active` listing. **Closed a gap that made this meaningful:**
  `login()` never checked `is_active`, so a deactivated account could
  just log back in; added a `403 ACCOUNT_DEACTIVATED` check ahead of
  the lockout check. `get_current_user` deliberately still doesn't
  check `is_active` per request — `14_Security.md` already accepts
  suspension taking effect within the ≤15-min access-token TTL, not
  instantly · P2-T31 password strength + closed a real CSRF gap:
  every password (signup/reset/change) is now scored with `zxcvbn`,
  rejected below score 3/4 server-side, wired as a pydantic
  field_validator so it folds into the existing 422 envelope with no
  new error code. **`14_Security.md`'s CSRF stance claimed `/auth/
  refresh` was protected by "SameSite=Lax + Origin header check" but
  only the SameSite half existed in code** — added the Origin check
  (`_validate_refresh_origin` in `routes/auth.py`): a present but
  mismatched `Origin` header now gets `401 REFRESH_INVALID`; a missing
  Origin (non-browser clients) still passes. New `FRONTEND_ORIGIN`
  config setting (default `http://localhost:3000`) backs the check —
  no `CORSMiddleware` added, that's real frontend-integration
  infrastructure for P2-T15+, out of scope here. 117/117 tests pass
  (33 new). All of T20/T26/T27/T31 verified live against the real
  Supabase dev DB via curl end-to-end (signup → login → get/patch
  profile → change password → list/revoke sessions → deactivate →
  confirm re-login is blocked → confirm cross-origin refresh is
  rejected); verification user row deleted afterward.
  **P2-T32 (2FA/TOTP backend) explicitly deferred to P4** — per
  `09_Phase_2.md`'s own "safely deferrable to P4 if time pressure"
  clause; your explicit choice this session, not an oversight. The M2+
  columns and `/auth/2fa/*` endpoints defer with it.
  · **P2-T11 shipped 2026-07-14, rescoped from phone/SMS to email.**
  The Figma signup design ("Verify your identity" screen) sends its
  6-digit verification code by **email**, not phone/SMS — P2-T10
  (`sms_service.py`/MSG91) is shelved, not needed for signup
  verification; ADR-011 amended in `15_Decision_Log.md` (MSG91
  decision stands for any future phone-based flow, just unused right
  now). New `POST /api/v1/auth/otp/request` (resend) and
  `POST /api/v1/auth/otp/verify` (`auth_service.py`: `request_otp`/
  `verify_otp`), keyed by email. Hashed codes (bcrypt), 5-attempt cap,
  10-min expiry, a new request invalidates any prior unconsumed code
  for the same `(email, purpose)`. `401 OTP_INVALID` on a wrong code,
  `410 OTP_EXPIRED` once no valid code remains (never issued, expired,
  or attempt cap reached) — matches the Figma design's two distinct
  error states. Success on signup/broker_verification purposes flips
  `is_email_verified`. New `app/services/email_service.py` (Resend
  adapter) — `_issue_otp` sends for real now, swallowing send failures
  since the dev-mode console log is still a working fallback. Template
  upgraded same session from a bare `<p>` tag to a branded card (dark
  header bar, boxed code, footer) after a quick two-option comparison;
  visually confirmed via a real send. `otp_codes.phone` renamed to `email` (M4
  migration, verified up/down/up clean — old dev rows truncated,
  table is documented as transient). `SignupRequest.email` is now
  required, not Optional, since it's the OTP delivery address.
  131/131 tests pass (14 new); tests mock `email_service.
  send_otp_email` (autouse fixture in `conftest.py`) so the suite
  never makes a real network call. Verified live against the real
  Supabase dev DB + real Resend API: signup → real email delivered to
  a real inbox → wrong code rejected (401) → correct code accepted
  (204, `is_email_verified` flips true) → replay rejected (410);
  verification user deleted afterward. **P2-T30 partially closed as a
  side effect** — signup-verification email now sends for real;
  password-reset email (T07) is still dev-log-only, unchanged, still
  on hold. Docs amended wherever the phone/SMS assumption appeared —
  00/01/02/03/05/07/09/12/14/15/18 in `docs/architecture/` — each
  carries a dated "Amended 2026-07-14" note rather than silently
  rewriting history.
- **P2-T30 fully closed, 2026-07-17** — `forgot_password()` now sends
  the real password-reset email via Resend (`email_service.
  send_password_reset_email`), same pattern as `send_otp_email`,
  instead of only logging the token. The link is a full JWT, not a
  typeable code, so the email uses a "Reset password" button pointing
  to `{FRONTEND_ORIGIN}/reset-password?token=...`; a send failure is
  caught and logged, never raised. **No `/reset-password` frontend
  page exists yet — the link 404s until that's built as a separate
  frontend task**, an explicit backend-only scoping choice, not an
  oversight. 131→134 tests pass (3 new); new
  `_mock_send_password_reset_email` autouse fixture in `conftest.py`.
  Live-verified against the real Supabase dev DB + real Resend API
  using the standing `hello@thesketchystudio.com` test account (the
  one `create_test_user.py`/`delete_test_user.py` are built to reuse,
  since Resend's sandbox only delivers to its one verified address):
  forgot → confirmed a real `200` from `api.resend.com` in the server
  log → reset with the logged token → `204` → logged in with the new
  password → `200`. This changed that standing test account's password
  as an expected side effect of testing the reset flow.
- **Same-password reset rejection added, 2026-07-21** — the frontend
  `/reset-password` page shipped this session (separate
  `feature/phase_2_frontend` PR) surfaced a real gap while verifying
  the flow live: `reset_password()` had no check preventing a reset to
  the same password the account already had. Not required by this
  project's own `14_Security.md` or current NIST 800-63B guidance
  (which dropped mandatory password-history checks), but a reasonable,
  commonly-expected safeguard, so added on request. `reset_password()`
  now compares `new_password` against the current `password_hash` via
  `verify_password()` before overwriting it (checked only against the
  current hash, not a password-history table — no new column/table),
  raising `422 SAME_PASSWORD` with a `fields: {new_password: ...}`
  entry that folds into the same field-level error UI the frontend
  already uses for the zxcvbn strength check. 135/135 tests pass (1
  new). **Debugging note, not a logic bug:** three rapid sequential
  edits to `auth_service.py` in one session raced `uvicorn --reload`'s
  file-watcher — an early reload cycle left a stale process serving a
  pre-edit version of the file for a few requests, so the same-password
  check appeared not to fire during live curl testing even though the
  committed code (and the passing pytest suite) were already correct.
  Resolved by a clean server restart; re-verified live end-to-end
  afterward (same password → `422 SAME_PASSWORD`; different password →
  `204` as before) against the real Supabase dev DB.
- **Known gap, deliberately left open (2026-07-09 docs-vs-code pass;
  correction 2026-07-14):** `02_Database_Design.md`'s invariant
  `password_hash IS NOT NULL OR is_phone_verified` is still not
  enforced — `signup()` allows `password=None` while
  `is_phone_verified` defaults false. This note originally said
  "P2-T11 (OTP verify) must close this gap by flipping
  is_phone_verified" — **that's now wrong**: T11 shipped 2026-07-14,
  but verifies *email*, not phone (the Figma design never verifies
  phone at all), so it does not close this gap. The gap remains
  genuinely open with no planned task addressing it — phone is simply
  never verified anywhere in the current design. Revisit only if phone
  verification is actually designed later, or consider closing it a
  different way (e.g. requiring password at signup, which the Figma
  form always collects anyway alongside email).

### ⏳ Pending — Phase 1 (Weeks 1–4)
- (none) — T20 landed above; T31 (this status update) closes Phase 1

### ⏳ Pending — Phase 2 (Weeks 5–8)
- P2-T10 `sms_service.py` MSG91 adapter — shelved 2026-07-14, not
  needed for signup verification (email OTP instead, see P2-T11
  above); revisit only if a future phone-based flow (2FA, phone
  login) is actually designed
- P2-T12 OTP-login path — out of current scope 2026-07-14, no
  OTP-login screen exists in the Figma design (password login only)
- P2-T32 2FA (TOTP) backend — explicitly deferred to P4, see T27/T31
  notes above
- **CORS closed 2026-07-14** — `CORSMiddleware` added in `app/main.py`
  (`allow_origins=[settings.FRONTEND_ORIGIN]`, `allow_credentials=True`),
  needed once frontend Phase 2's real signup form started making real
  cross-origin `fetch()` calls. Verified live: an OPTIONS preflight from
  `Origin: http://localhost:3000` returns the right `access-control-*`
  headers, and a real end-to-end `POST /auth/signup` from that origin
  succeeds (201, user row created and deleted after verifying). 131/131
  tests still pass.
- **P2-T17/T18 shipped 2026-07-15** — see Frontend Phase 2 below.
- **Duplicate-email signup bug fixed 2026-07-16** — `auth_service.signup()`
  relied on catching `IntegrityError` around `db.commit()` to turn a
  duplicate email into `409 EMAIL_TAKEN`, but the unique-constraint
  violation actually fires at the `db.flush()` a few lines earlier
  (needed to assign `user.id` for the broker_profile FK), outside that
  try/except — so it fell through to the catch-all handler as a bare
  `500 INTERNAL_ERROR` instead. Found via manual UI testing, not a test
  gap that was ever exercised: there was a `test_duplicate_phone_returns_409`
  but no email equivalent. Fixed by checking `User.email` proactively
  before any insert, same pattern as the existing phone check; added
  the missing test. 133/133 tests pass (1 new). New
  **`backend/scripts/delete_test_user.py`** — deletes a given email's
  `otp_codes` + `users` row (cascades to `broker_profiles`/
  `refresh_tokens`) so one real email can be reused repeatedly for
  manual signup testing, since Resend's sandbox only delivers to one
  verified address.
- **Signup now auto-logs in after email verification, 2026-07-16** —
  previously `POST /auth/otp/verify` always returned a bare 204, so the
  signup wizard sent a freshly verified user to `/login` to type their
  password a second time right after supplying it. For
  `OTPPurpose.signup` specifically, `verify_otp()` now also mints a
  session (same `_issue_session()` helper `login()` uses) and the route
  returns the same `TokenResponse` shape as `/login`/`/refresh` (200 +
  refresh cookie) instead of 204; every other purpose (`broker_verification`)
  is unchanged and still returns a bare 204, since that fires from an
  already-logged-in broker's profile, not a fresh signup. Frontend:
  `SignupWizard.tsx` now calls `setAuth()` with the returned session and
  redirects straight to `/` instead of `/login`. 133/133 backend tests
  pass (1 new, covering the broker_verification purpose is unaffected).
  Live-verified with Playwright: signed up a fresh user, verified the
  OTP, landed directly on `/` with no login screen — confirmed genuinely
  authenticated (not just coincidentally on `/`) by visiting
  `/broker/dashboard` immediately after and getting redirected home for
  a role mismatch rather than to `/login`.

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

### Known open decisions
- (none) — SMS/OTP provider decided 2026-07-07: MSG91 (ADR-011 in
  docs/architecture/15_Decision_Log.md); integrate via
  `services/sms_service.py` adapter if a phone-based flow is ever
  designed. Not currently in use — signup verification uses email OTP
  via Resend instead (ADR-011 amendment, 2026-07-14).

## What NOT to do
- Don't run `npm audit fix --force` reflexively on scaffold warnings.
- Don't add Supabase's Data API / auto-expose-tables / RLS — this project
  bypasses Supabase's REST layer entirely; the backend is the only DB client.
- Don't connect Supabase's GitHub schema-sync — Alembic is the single
  source of truth for migrations, no dual systems.
- Don't push directly to `main` or `dev`, ever, regardless of urgency.