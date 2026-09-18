CHECKPOINT
SLICE: 2 - FreshClock live countdown.
COMPLETED: HH:MM:SS from stored freshness_expires_at, FRESH/USE SOON/URGENT/EXPIRED labels, one-second display tick, zero clamp. Existing freshness formulas and urgency thresholds preserved.
FILES: src/foodLogic.ts, src/FoodMetrics.tsx, tests/foodLogic.mjs, CHECKPOINT.md.
DB: NONE.
VERIFY: PASS - countdown/temperature/deadline/PlateCount tests, typecheck/lint/build, browser ticking and refresh persistence, existing expired records show 00:00:00 / EXPIRED.
PREVIOUS: Slice 1 SnapFill Gemini passed real deployed analysis, editable/review-gated donation creation and private image persistence. Commit 5d758b8.
NEXT: Slice 3 operational rescue lifecycle. STOP before required database migration per Builder prompt: add pickup_started_at, delivery_started_at, delivered_at and extend the existing atomic advance_rescue RPC. Preserve participant RLS, FCFS and completion rules; no GPS fields or unrelated slices in this migration.

CHECKPOINT
SLICE: 3 - Atomic operational lifecycle.
DB: Migration 010 applied; three timestamps added; advance_rescue extended; existing rows/RLS/FCFS preserved.
FILES: migration 010, rescueService.ts, rescueLogic.ts, RescuePanel.tsx, tests/rescues.mjs.
VERIFY: PASS typecheck/lint/build and real cross-role lifecycle/idempotence/persistence/impact tests.
NEXT: Browser GPS and private latest location.

CHECKPOINT
SLICE: Browser GPS/private location.
DB: Migration 011; private rescue coordinates/server timestamp, optional NGO destination. RPC participant/role checks, coordinate validation and 15-second write throttle.
FILES: locationService.ts, useRescueLocation.ts, RescueLocation.tsx, rescueService.ts, RescuePanel.tsx, migration 011, tests/location-live.mjs.
VERIFY: PASS typecheck/lint/build/FreshClock logic, live private location/RLS/persistence/throttle tests. Device browser verification included in final QA; no simulated GPS.
NEXT: OpenStreetMap and OSRM.

CHECKPOINT
SLICE: OpenStreetMap/OSRM and Realtime.
FILES: RescueMap.tsx, RescueNavigation.tsx, routeService.ts, databaseSync.ts, existing data hooks/RescuePanel, package files, tests/routes.mjs, tests/realtime-live.mjs.
DB: Migration 012 publishes donations/rescues/ngo_availability; existing RLS preserved.
VERIFY: PASS build/typecheck/lint, real OSRM route, route failure/cache tests, actual cross-role Realtime for all three tables; unrelated volunteer receives no private rescue event. Replication readiness explicitly awaited. Phase 1 and real 60-second expiry regressions PASS.
NEXT: Donor progress and operational views.

CHECKPOINT
SLICE: Donor timeline / Active Rescue / NGO incoming view.
FILES: RescueTimeline.tsx, donor dashboard/history, ActiveRescue.tsx, ProfileManagement.tsx, RescuePanel.tsx, GPS hook/control, GrabBoard.tsx, index.css.
DB: NONE.
VERIFY: PASS typecheck/lint/build; browser donor timeline actual persisted timestamps. Cross-role realtime tested; operational browser journey continues in final QA.
NEXT: Completed-only dashboard metrics.

CHECKPOINT
SLICE: Completed-only impact metrics / UI cleanup.
FILES: impactLogic.ts, ImpactStats.tsx, donor/volunteer dashboards, RescuePanel.tsx, UI.tsx, index.css, tests/impact.mjs, NGO description, lazy DonationForm, saved donation realtime refresh.
DB: NONE.
VERIFY: PASS typecheck/lint/build, completed-only/role/mixed-unit/zero metric tests. Deferred feature clutter removed; architecture interfaces retained. Leaflet and donation form lazy-loaded.
NEXT: Final real browser journey, GPS, responsive QA and security regression.
CHECKPOINT
SLICE: Final core integration / distance RPC / QA.
COMPLETED: Real Gemini/photo donation -> FCFS -> NGO assignment -> pickup -> delivery -> nine-plate NGO receipt -> COMPLETED; cross-role Realtime, timelines and completed-only impact persist after refresh.
FILES: BoardDistances.tsx, browserLocation.ts, locationService.ts, migrations 013-015, tests/final-live.mjs, tests/gps.mjs, README.md, CHECKPOINT.md; prior slice files retained.
DB: Migrations 010-015 applied. Participant RLS, coordinate integrity and existing atomic FCFS/expiry preserved; distance RPC parameter ambiguity fixed.
VERIFY: PASS typecheck/lint/production build; logic, SnapFill contracts, real Phase 1/2, 60-second expiry, 180-second hold/batching, lifecycle, private GPS RPC, Realtime, OSRM, impact, final persistence/security and mobile/tablet/desktop browser checks.
LIMIT: Actual device GPS request returned Current location unavailable. Error handling and location contracts/backend pass; positive device GPS capture requires working OS/browser location services and remains unverified.
NEXT: Commit/push verified build and verify production deployment; advanced continuous tracking, SmartReassign, HeroRank and SafeCall remain deferred.
