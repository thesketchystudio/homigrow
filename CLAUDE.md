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

### ⏳ Pending — Phase 1 (Weeks 1–4)
- Design tokens from Figma into `globals.css` `@theme` block
- Shared components: TopNavBar, Sidebar, Property Card, Modal, Toast, Table
- Upload pipeline (R2 + Stream) architecture design, before endpoints exist

### Known open decisions
- SMS/OTP provider: MSG91 vs Fast2SMS — not yet chosen

## What NOT to do
- Don't run `npm audit fix --force` reflexively on scaffold warnings.
- Don't add Supabase's Data API / auto-expose-tables / RLS — this project
  bypasses Supabase's REST layer entirely; the backend is the only DB client.
- Don't connect Supabase's GitHub schema-sync — Alembic is the single
  source of truth for migrations, no dual systems.
- Don't push directly to `main` or `dev`, ever, regardless of urgency.