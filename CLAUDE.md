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
  adapter, minimal HTML template) — `_issue_otp` sends for real now,
  swallowing send failures since the dev-mode console log is still a
  working fallback. `otp_codes.phone` renamed to `email` (M4
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
- P2-T15+ frontend auth screens (separate `feature/phase_2_frontend` branch)
- P2-T30 real Resend delivery — signup-verification half now done
  (2026-07-14, shipped with P2-T11); password-reset email template
  still dev-log-only, on hold by explicit choice
- P2-T32 2FA (TOTP) backend — explicitly deferred to P4, see T27/T31
  notes above
- No `CORSMiddleware` configured yet — needed once a browser frontend
  actually calls this API cross-origin with credentials (P2-T15+
  territory, not closed by T31's Origin-header CSRF check alone)

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