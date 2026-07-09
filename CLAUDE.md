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
  shape per `05_API_Design.md`). 59/59 tests pass (15 new); signup,
  login, refresh-rotation, replay-detection, and logout all verified
  against the real Supabase dev DB via curl, then the verification rows
  deleted. Full writeup: `docs/implementation/backend/Phase_2_Implementation.md`.
  **Not yet built:** the global error-envelope handler (P2-T06 — auth
  errors currently return `{"detail": {"code", "message"}}`,
  forward-compatible with T06 wrapping it into `{"error": {...}}`) and
  `get_current_user`/`require_role` (also T06 — `/auth/logout` currently
  authenticates via the refresh cookie itself rather than a Bearer token,
  since no `get_current_user` dependency exists yet; see T05 note in the
  implementation writeup), real OTP SMS delivery (P2-T10).
- **Known gap, deliberately left open (2026-07-09 docs-vs-code pass):**
  `02_Database_Design.md`'s invariant `password_hash IS NOT NULL OR
  is_phone_verified` ("deferred to P2 service-level") is not yet enforced.
  `signup()` allows `password=None` (the OTP-only path the `User` model
  supports) while `is_phone_verified` defaults false, so a password-less
  signup currently satisfies neither side — and permanently reserves the
  phone number (409 on retry) with no verify/expiry path, since OTP-verify
  (P2-T11) doesn't exist yet. User explicitly chose to leave this open
  rather than require password now — **P2-T11 (OTP verify) must close this
  gap** by flipping `is_phone_verified` true on verify; don't mark T11 done
  without checking this invariant actually holds afterward.

### ⏳ Pending — Phase 1 (Weeks 1–4)
- Design tokens: still the stock shadcn placeholder palette — needs real
  brand colors/type scale from the actual Figma design file (not the Make
  export used for the homepage)
- Upload pipeline (R2 + Stream) architecture design, before endpoints exist
- T31 (Phase 1 close-out) blocked on the above

### ⏳ Pending — Phase 2 (Weeks 5–8)
- P2-T06 `deps.py` (`get_current_user`, `require_role`) + `core/exceptions.py`
  global error envelope
- P2-T07/T08 password reset, auth rate limiting
- P2-T10–T12 OTP request/verify + MSG91 `sms_service.py` adapter
- P2-T15+ frontend auth screens (separate `feature/phase_2_frontend` branch)

### Known open decisions
- (none) — SMS/OTP provider decided 2026-07-07: MSG91 (ADR-011 in
  docs/architecture/15_Decision_Log.md); integrate via `services/sms_service.py` adapter

## What NOT to do
- Don't run `npm audit fix --force` reflexively on scaffold warnings.
- Don't add Supabase's Data API / auto-expose-tables / RLS — this project
  bypasses Supabase's REST layer entirely; the backend is the only DB client.
- Don't connect Supabase's GitHub schema-sync — Alembic is the single
  source of truth for migrations, no dual systems.
- Don't push directly to `main` or `dev`, ever, regardless of urgency.