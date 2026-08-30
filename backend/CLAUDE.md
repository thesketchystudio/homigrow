## Backend Status

Backend-specific ongoing status and decisions — loads automatically
when working under `backend/`. See the root `CLAUDE.md` for
project-wide rules (git workflow, secrets, coding standards) and
shared Phase 1 history; see `frontend/CLAUDE.md` for frontend status.

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

### Backend Phase 2 — Broker signup (on `feature/phase_2_backend_broker`, cut
from `dev` 2026-08-14 — this branch existed as an empty pointer since the
2026-07-21 portal split but had no commits until now; fast-forwarded 96
commits to `dev` before starting)
- **Broker verification-details signup + document upload shipped
  2026-08-14** — pulled forward from its originally-scheduled P4 slot
  (`11_Phase_4.md` P4-T11), same pattern as the homepage in Phase 1, per
  your explicit call after reviewing the real Figma "Broker - Sign up"
  section (node `431:279`, Onboarding page) and finding it fully
  designed already: a 3-step wizard sharing the client signup shell,
  Step 2 form with a broker-only "Verification Details" block (Agency/
  Firm Name, License/RERA No., City of Operation) appended below the
  usual fields, Step 3 a two-file document upload ("Broker
  verification"), then two post-submit status screens
  (`BrokerPendingScreen`/`BrokerStatusScreen`) with no client
  equivalent. **Schema needed zero migration** — `broker_profiles`
  already had `rera_number`, `company_name`, `verification_status`
  (`unverified/pending/verified/rejected`), `verification_documents`
  jsonb (`[{type, url, uploaded_at}]`), and `service_areas` jsonb since
  M1; the architecture doc had already designed this exact shape, just
  scheduled later. No dedicated "City of Operation" column exists —
  seeds `service_areas` as a one-item list instead, since Figma's
  single field is just that list's first entry (P4-T10's later profile
  edit screen is where it'd grow to multiple areas).
  `SignupRequest` gained 3 optional broker-only fields
  (`company_name`/`rera_number`/`service_area`), written onto the
  `broker_profile` row `signup()` already creates — same pattern as
  the existing `city`/`state` fields, submitted in the same call as
  the rest of the form (unlike the client Phase B buyer-preference
  wizard, which is genuinely post-login; Figma bundles broker's
  verification fields into the Step 2 form itself). **RERA numbers
  have no fixed format** — confirmed each state RERA authority issues
  its own scheme (Maharashtra, Karnataka, etc. all differ) — so
  `rera_number` only gets a basic 5–50 character sanity check, not a
  format/regex validation.
  New `POST /api/v1/brokers/me/verification-documents`
  (`app/api/v1/routes/brokers.py`, `app/services/broker_service.py`) —
  authenticated, broker-only, accepts the two files as multipart,
  uploads both, replaces `verification_documents` outright (not
  append — same call handles first submit and resubmit-after-rejection),
  and flips `verification_status` to `pending`. **No admin review or
  content verification exists** — explicitly out of scope per your
  instruction ("accept any documents uploaded to get to the next
  part"); that's P4-T12, a separate later task.
  New **`app/services/storage_service.py`** — uploads via the S3
  protocol (boto3) against **Supabase Storage's S3-compatible
  endpoint**, not Cloudflare R2 (the originally planned provider,
  `00_Project_Overview.md`) — R2 requires a card on file to activate
  even its free $0 tier, which wasn't available this session; flagged
  in ClickUp (`need clarification` status, see below) rather than
  silently substituted. Since the code talks to storage purely via the
  S3 protocol, swapping to R2 later is a config/endpoint change, not a
  rewrite. Bucket is private (`broker-documents`); the module returns
  internal object keys, not fetchable URLs — presigned-GET generation
  is a P4 concern (nothing reads these back yet). Validates content
  type (PDF/JPG/PNG only) and a 5MB max, matching Figma's own upload
  copy — this is input hygiene, not the "verification" that's out of
  scope; new `BrokerDocumentType` enum (`app/models/enums.py`, not a
  Postgres type — it only ever lives inside the JSONB, never a column).
  New config: `SUPABASE_ACCESS_KEY_ID`/`SUPABASE_SECRET_ACCESS_KEY`/
  `SUPABASE_S3_ENDPOINT`/`SUPABASE_S3_REGION`/`SUPABASE_S3_BUCKET`, all
  default `""` (feature-gated, same pattern as `GOOGLE_CLIENT_ID`/
  `MSG91_AUTH_KEY`, not fail-fast-required). New deps: `boto3==1.43.70`,
  `python-multipart==0.0.20` (the latter needed for FastAPI's
  `UploadFile`/`File(...)` params — first multipart route in the
  codebase). 195→211 tests pass (16 new across
  `tests/services/test_auth_service_signup.py`,
  `tests/api/v1/routes/test_auth.py`,
  `tests/services/test_storage_service.py`,
  `tests/services/test_broker_service.py`,
  `tests/api/v1/routes/test_brokers.py`); new autouse
  `_mock_s3_client` fixture in `conftest.py` stubs only the boto3
  client itself (not the whole `upload_broker_document` function), so
  the real validation logic (content type/size) stays genuinely
  exercised in tests, mirroring the existing `email_service` mocking
  precedent. `ruff` clean.
  **Two real bugs found only by live-verifying against the real
  Supabase project, not by the passing test suite (which mocks the S3
  client entirely):** (1) boto3 defaults to virtual-hosted-style S3
  addressing (`bucket.endpoint/key`), but Supabase's S3-compatible
  endpoint only supports path-style (`endpoint/bucket/key`) — every
  real upload 500'd inside botocore with an empty error message until
  `Config(s3={"addressing_style": "path"})` was added to the client;
  (2) the bucket you'd created in the Supabase dashboard was actually
  named `broker-dcouments` (typo — missing "u") while `.env` and the
  code both expected `broker-documents` — `put_object` failed because
  the target bucket genuinely didn't exist under that name;
  `list_buckets()` surfaced the actual name directly. Fixed by you
  creating a correctly-named bucket (your choice over renaming/config
  workaround). Live-verified end-to-end against the real Supabase dev
  DB + real Supabase Storage bucket via curl, using a throwaway
  worktree server (`python -m uvicorn`, not the bare `uvicorn` shim —
  same past gotcha): broker signup with verification-details fields →
  201 → OTP verify → auto-login (existing P2-T11 behavior) → real
  multipart upload of a PDF + JPG → `200 {"verification_status":
  "pending"}` → confirmed via direct SQL that `company_name`/
  `rera_number`/`service_areas`/`verification_documents` all landed
  correctly → confirmed via `list_objects_v2` that both files
  genuinely exist in the bucket → confirmed a client-role token gets
  `403` and an unsupported file type (`.zip`) gets `422
  UNSUPPORTED_FILE_TYPE`. Test user, throwaway client user, and both
  uploaded objects deleted afterward.
- **Frontend (Step 2 broker fields, Step 3 upload screen, pending/
  rejected status screens) not started** — separate task, backend-first
  per your explicit ordering.

### Backend Phase 3 (on `feature/phase_3_backend_client`, cut from `dev`)
- **Property Details read API shipped 2026-07-29** — `GET /api/v1/properties/{id}`,
  the first Property CRUD/read work (P3-T04), built backend-first per this
  session's explicit ordering (backend → frontend → homepage-linking, each a
  separate task). Public, no auth — serves the Property Details screen.
  New `app/schemas/properties.py` (`PropertyRead`/`PropertyMediaRead`/
  `PropertyBrokerRead`, `metro_distance_km` as a `@computed_field` from
  `metro_distance_m`, same convention `config.py` uses for `DATABASE_URL`),
  `app/services/property_service.py` (`get_property_detail`: 404s via the
  existing `NotFoundError` if missing or `status != active` — no
  owner-preview-while-pending path, nothing needs it yet), and
  `app/api/v1/routes/properties.py`, registered in `router.py`.
  **Migration M6** closes two real gaps found by checking the Figma
  "property details" screen's Quick Stats against the model: added
  `parking_slots` (no column existed for parking count at all), and
  replaced `age_years` with `built_year` — the design shows a fixed
  "Year Built: 2022", not a relative age, and storing age as an offset
  would silently go stale every year; `age_years` was referenced only in
  the M1 migration and the model itself (confirmed via grep), so the
  swap is a clean replacement, not a breaking change. Upgrade → downgrade
  → upgrade verified clean against the real dev DB. New
  **`scripts/create_test_property.py`** / **`delete_test_property.py`**
  (paired like the existing test-user scripts) seed one real, active
  demo property ("The Obsidian Estate", matching the Figma content
  exactly — price, bhk/bathrooms/area, amenities, description, 4 media
  rows on stable placeholder image URLs since no R2/Stream pipeline
  exists yet) plus a broker fixture user — broker-side property
  creation isn't built yet (deferred to a future broker page), so this
  is the standing way to get real data to develop the frontend screen
  against. 155/155 tests pass (5 new, `tests/api/v1/routes/
  test_properties.py`); `ruff` clean. Live-verified end-to-end against
  the real Supabase dev DB: ran the seed script, confirmed the full
  response shape via curl (including `parking_slots`/`built_year`/
  `metro_distance_km` and the nested `broker.broker_profile.
  verification_status`), confirmed a missing id and a non-active status
  both return `404 PROPERTY_NOT_FOUND`. **The seeded property is left in
  the DB on purpose** (not cleaned up like other verification scripts)
  since the very next task is building the frontend screen against this
  exact real record.
  **Deferred, not part of this task:** the Vaastu Compliance checker,
  "Redesign with AI" button, and Market Context/"Download Market
  Report" card from the Figma design (node IDs recorded in project
  memory); `POST /properties/{id}/enquire` (contact-form submission);
  linking the page in from the homepage/`PropertyCard` — all separate,
  later tasks (tracked in ClickUp).
- **Compare properties endpoint shipped 2026-08-04** (P3-T42, backend
  half) — `GET /api/v1/properties/compare?ids=a,b,c`, public, reusing
  `PropertyRead` as the normalized spec table (`PropertyCompareResponse`
  in `app/schemas/properties.py`). New `compare_properties()` in
  `app/services/property_service.py` (same eager-load pattern as
  `get_property_detail`, filters to active only, silently drops
  missing/non-active ids, reorders results back into the caller's
  requested id order since SQL `IN` doesn't preserve it). Route parses
  the comma-separated `ids` query string itself, raising
  `422 INVALID_COMPARE_IDS`/`422 TOO_MANY_COMPARE_IDS`; registered ahead
  of `GET /{property_id}` in the router file as defensive ordering.
  **Max compare count resolved as 3, not the 4 originally drafted in
  `05_API_Design.md`** — the real Figma "Comparison" screen's own hint
  copy says "up to 3", found only once the design was actually pulled
  this session (no Figma access was available when this task was first
  scoped); both `05_API_Design.md` and this file's own P3-T42 backlog
  line in `10_Phase_3.md` were corrected from 4 to 3 to match, your
  explicit call over the alternative of changing the Figma copy. 185/185
  tests pass (5 new); `ruff` clean. Live-verified against the real
  Supabase dev DB + seeded demo properties via curl: order preservation,
  a missing id and a non-active id both silently dropped, a malformed id
  and a 4th id both correctly 422.
- **Property Listings search endpoint shipped 2026-07-30** —
  `GET /api/v1/properties`, the search/grid endpoint backing the
  Listings page (10_Phase_3.md P3-T10), built after pulling the real
  Figma "Curated Listings" screen (`search` frame, node `28:646`,
  `Client view` page) so frontend work lands on the same real design.
  That screen's filter sidebar has more filters than real schema
  supports today (a named metro-station picker, commercial
  sub-categories like Cafe/Restaurant, a "founder's property" toggle,
  a map view) — scoped down to what real columns/enums back, same
  pattern as Property Details' Vaastu/AI/Market-Report deferrals;
  confirmed with you before building. Filters: `city` (case-
  insensitive exact match), `listing_type`, `property_type`
  (repeatable), `price_min`/`price_max`, `bhk_min`, `amenities`
  (repeatable, matches ANY via Postgres JSONB `?|` — mirrors the
  sidebar's multi-select checkboxes). Sort: `newest` (default,
  `published_at desc nullslast`) / `price_asc` / `price_desc` — an
  invalid `sort` value 422s automatically via a `Literal` type, no
  custom validation code needed. Pagination: `page`/`page_size`
  (default 20, max 50, doc's existing convention), response envelope
  is `{items, page, page_size, total, total_pages}`. New
  `PropertyListItem`/`PropertyListResponse` in `schemas/properties.py`
  (lighter than `PropertyRead` — no media gallery/broker detail, just
  one cover image via a correlated subquery on `PropertyMedia.
  is_cover`) and `property_service.list_properties()`. **Found and
  fixed a real gap while building this:** `published_at` was declared
  on the `Property` model and even has a dedicated partial index
  (`ix_properties_active_published_at`) but was never actually *set*
  anywhere — not by the seed script, not by anything else — so
  "newest first" sorting had nothing real to sort by. Fixed
  `create_test_property.py` to set it, backfilled the one existing
  Obsidian Estate row (which predated this fix) directly against the
  dev DB, and set staggered values in the new seed data below so
  "newest" sort has a real, distinct order to verify against. New
  **`scripts/seed_demo_properties.py`**/**`delete_demo_properties.py`**
  (same create/delete pair convention as `create_test_property.py`) —
  10 more active demo listings spanning 5 cities (Bengaluru, Mumbai,
  Delhi, Gurugram, Pune, Hyderabad, Chennai), all 3 `ListingType`
  values, 6 of the 7 `PropertyType` values, and a price range from
  ₹18k/mo rent to ₹6.5 Cr sale — enough real variation to exercise
  every filter combination once the frontend grid exists. 167/167
  tests pass (12 new, `TestListProperties` in the existing
  `test_properties.py`); `ruff` clean. **Test isolation note:** these
  tests run against the real dev DB (`tests/conftest.py`'s
  transactional rollback only undoes what a test itself inserts, not
  pre-existing committed rows like the intentionally-left-seeded
  Obsidian Estate) — every list test scopes its query to a per-test
  throwaway city name to stay exact regardless of what else is
  sitting in the shared dev DB. Live-verified end-to-end against the
  real Supabase dev DB: ran both seed scripts, then curled every
  filter/sort/pagination combination and confirmed exact matching
  result sets, plus confirmed `sort=bogus` and `page_size=999` both
  422. Checked the query plan (`EXPLAIN ANALYZE`) for a representative
  filtered query — the composite indexes (`ix_properties_status_
  listing_type`, `ix_properties_city_locality`, `ix_properties_price`)
  are correctly shaped for this access pattern; at the current ~11-row
  seed volume Postgres reasonably picks a sequential scan over them
  (expected at this scale, not a bug) — P3-T10's literal ask for an
  EXPLAIN ANALYZE against ~1k seeded rows was descoped along with the
  rest of the "handful of varied properties" plan agreed with you,
  not silently skipped.
- **Backend cleanup review completed 2026-07-31, no changes needed** —
  once the frontend Listings/Details pages were brought fully in line
  with Figma, checked the backend for real cleanup work before touching
  anything: `ruff check` clean, 167/167 tests pass, no stray TODO/FIXME
  markers, and the one `alembic check` finding (`spatial_ref_sys`) is
  the known-harmless PostGIS extension artifact, not real drift. Read
  through `property_service.py`/`routes/properties.py` in full — nothing
  actionable found. **One real gap surfaced and deliberately left
  open:** `10_Phase_3.md` P3-T04 scopes `GET /properties/{id}/similar`
  alongside the detail endpoint, but it was never built, and no
  "Similar Properties" section exists in the Figma Property Details
  frame either — building it now would be an endpoint with zero
  consumers, so it stays un-built and just noted here rather than
  silently dropped from the record.
- **Saved Properties backend shipped 2026-08-03** (P3-T40, backend
  half only) — `GET /api/v1/saved-properties` (paginated, newest-saved
  first, embeds the same `PropertyListItem`/PropertyCard shape the
  Listings endpoint uses, plus a `saved_at` timestamp),
  `PUT /api/v1/saved-properties/{property_id}` (idempotent save, 204;
  404 `PROPERTY_NOT_FOUND` if the property doesn't exist at all), and
  `DELETE /api/v1/saved-properties/{property_id}` (idempotent unsave,
  204 whether or not it was ever saved). New
  `app/schemas/saved_properties.py` (`SavedPropertyItem` extends
  `PropertyListItem` with `saved_at`, same `PropertyListResponse`
  pagination-envelope convention), `app/services/
  saved_property_service.py`, `app/api/v1/routes/
  saved_properties.py`, registered in `router.py`. No migration
  needed — `saved_properties` (composite PK, cascade deletes) has
  existed unused since the original Phase 1 M1 migration. A saved
  property deliberately stays in the list even if the listing later
  goes off-market — it's the user's own save history, not a live
  search result, so nothing gets filtered out post-save. This
  worktree (`homigrow-backend-wt`) had gone stale (unregistered,
  emptied) since the last backend session — recreated via
  `git worktree add` on `feature/phase_3_backend_client` before
  starting; its `.env` doesn't survive a fresh worktree checkout
  (gitignored, untracked) and had to be copied over from the main
  `homigrow/backend` checkout before tests/server would boot. 167→178
  tests pass (11 new, `tests/api/v1/routes/test_saved_properties.py`);
  `ruff` clean. Live-verified end-to-end against the real Supabase dev
  DB from a freshly started `python -m uvicorn` (not the bare
  `uvicorn` shim — same past gotcha) using the standing test account
  and a real seeded property: save → appears correctly in the list →
  save again (still one row, still 204) → unsave → list empty again →
  unsave again (still 204) → save a made-up id (404) → list with no
  auth token (401). **Not part of this task, separate follow-ups
  next:** wiring `PropertyCard`'s existing (currently cosmetic)
  `isSaved`/`onToggleSave` props to these endpoints, and building real
  content for the `/profile/my-properties` tab.
- **Saved Properties category filter + sort shipped 2026-08-03** (P3-T41
  backend follow-up) — `GET /api/v1/saved-properties` gained two more
  optional query params: `property_type` (list, filters to the given
  `PropertyType` categories — `saved_property_service.
  list_saved_properties` now joins `Property` in the count query too,
  not just the row query, so `total`/`total_pages` stay correct under
  the filter) and `sort` (new `SavedSortOption = Literal["recent",
  "price_asc", "price_desc"]`, mirroring `property_service.SortOption`;
  `"recent"` is the pre-existing default `SavedProperty.created_at.desc()`
  order, unchanged). Driven by the frontend's real Figma pull for this
  screen — the "Villas"/"Commercial" category pills map to
  `[villa]`/`[office, shop]` respectively; "Penthouses" has no matching
  `PropertyType` at all, left to the frontend to render disabled.
  178→182 tests pass (2 new: property-type filter, price sort); `ruff`
  clean. **Live-verification caught a real stale-server repeat of the
  documented class of bug** (see prior worktree-server notes above): the
  process listening on port 8000 was traced via
  `Get-CimInstance Win32_Process` to a `python -m uvicorn` launched from
  the *original* `homigrow/backend` directory, not this worktree — so it
  silently served the pre-P3-T41 route with zero errors, only caught by
  diffing `GET /openapi.json`'s params against what was just added. Fixed
  by killing that process and its orphaned `--reload` multiprocessing
  child, then restarting `python -m uvicorn app.main:app --reload --port
  8000` with cwd actually set to this worktree. Re-verified live
  end-to-end afterward against the real Supabase dev DB: villa filter,
  commercial filter, and both price sorts all returned exactly the
  expected subset/order.
- **Nav search now parses "type in area" queries, 2026-08-30** — the
  existing `search` param on `GET /properties` previously did one
  whole-string substring match, so a real nav-search query like "villas
  in indiranagar" matched nothing — no single column contains that
  literal phrase. New `property_service._parse_search_query()`:
  tokenizes the query, pulls a known `PropertyType` out of it via a
  name/plural alias map (`villa`/`villas`, `apartment`/`apartments`/
  `flat`/`flats`, `house`/`houses`, `plot`/`plots`/`land`, `office`,
  `shop`/`store`, `pg`/`coliving`, plus multi-word `independent house`/
  `co-living` checked first since `PropertyType`'s own two-word values
  don't tokenize), drops connective stopwords ("in", "at", "near",
  "for", ...), and returns the remaining words as an area phrase.
  `list_properties` then filters by the structured `property_type`
  column (not text) plus a substring match on the area words against
  city/locality/landmark — or falls back to the original plain
  substring match when no type token is found, so a bare keyword search
  (title word, amenity, ...) is unaffected. A bare type word with no
  area (`search=villa`) also now correctly matches every villa by its
  actual `property_type`, not just ones with "Villa" literally in the
  title — stricter than the old accidental-substring behavior. No
  frontend changes needed — the nav search box already sends whatever's
  typed straight through the same `search` param. 198/198 tests pass (3
  new: `test_search_combines_property_type_and_area`,
  `test_search_property_type_alone_matches_by_type_not_title_text`,
  `test_search_falls_back_to_substring_when_no_type_token`); `ruff`
  clean. Live-verified against the real backend + Supabase dev DB + real
  seeded demo properties: `search=villas in indiranagar` → exactly "The
  Obsidian Estate"; `search=apartment in whitefield` → exactly
  "Whitefield Tech Loft"; `search=villa` alone → all 3 real villas;
  `search=indiranagar` alone (no type) → unchanged old substring
  behavior. Hit the same stale-orphaned-`--reload`-worker class of bug
  documented above while restarting the worktree server to verify (a
  `multiprocessing` child from an earlier session had outlived its
  parent and was still holding port 8000); killed it and started fresh
  from this worktree before testing.
- **Plot + Land property types shipped 2026-08-30** — first of a
  planned one-at-a-time rollout closing the gap between the wizard
  (residential-only: apartment/villa/independent_house) and the real
  Figma "Broker view > post property" design, which lets a broker pick
  Plot, Land, PG/Co-living, or Commercial Building too (PG/Commercial
  and JV Property are separate follow-up passes, backend-first per
  your explicit ordering). New `PropertyType.land` enum value; two new
  nullable `plot_details`/`land_details` JSONB columns on `Property`
  (migration M7, `aa1defd89f8c`), following the same reserved-JSONB-
  bucket pattern `pg_details` already established rather than adding
  5+ narrow typed columns — `{dimension, is_corner_plot}` and
  `{land_use, approvals}` respectively. Plot's Facing field and Land's
  Total Area reuse the existing (previously wizard-unused) `facing`/
  `area_sqft` columns, no new column needed for either. New
  `PlotDetails`/`LandDetails` schemas in `app/schemas/properties.py`,
  wired into `PropertyRead` and `PropertyCreateRequest`;
  `broker_property_service.create_property()` persists both. M7's
  `ALTER TYPE ... ADD VALUE` can't be reversed directly (Postgres has
  no `DROP VALUE`), so its downgrade rebuilds `property_type` via
  rename → recreate → cast → drop-old, same as the standard pattern
  for this class of migration — verified upgrade → downgrade → upgrade
  clean against the real dev DB. 224→226 tests pass (2 new in
  `test_broker_properties.py`, covering plot and land creation +
  round-trip, plus an added assertion that residential creates still
  get `null` for both new fields). Live-verified end-to-end against
  the real Supabase dev DB via curl using the standing test broker
  (`broker.login.test@homigrow.local`): created one real plot listing
  and one real land listing, confirmed both `plot_details`/
  `land_details` round-tripped exactly through the response, confirmed
  each other's detail field stayed `null`; both verification rows
  deleted afterward via `delete_test_property.py`. **Frontend wizard
  changes (Property Type dropdown, conditional Plot/Land sub-forms)
  not started — separate task, backend-first per your explicit
  ordering.**

### Known open decisions
- (none) — SMS/OTP provider decided 2026-07-07: MSG91 (ADR-011 in
  docs/architecture/15_Decision_Log.md); integrate via
  `services/sms_service.py` adapter if a phone-based flow is ever
  designed. Not currently in use — signup verification uses email OTP
  via Resend instead (ADR-011 amendment, 2026-07-14).

