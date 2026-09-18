CHECKPOINT
SLICE: 2 - FreshClock live countdown.
COMPLETED: HH:MM:SS from stored freshness_expires_at, FRESH/USE SOON/URGENT/EXPIRED labels, one-second display tick, zero clamp. Existing freshness formulas and urgency thresholds preserved.
FILES: src/foodLogic.ts, src/FoodMetrics.tsx, tests/foodLogic.mjs, CHECKPOINT.md.
DB: NONE.
VERIFY: PASS - countdown/temperature/deadline/PlateCount tests, typecheck/lint/build, browser ticking and refresh persistence, existing expired records show 00:00:00 / EXPIRED.
PREVIOUS: Slice 1 SnapFill Gemini passed real deployed analysis, editable/review-gated donation creation and private image persistence. Commit 5d758b8.
NEXT: Slice 3 operational rescue lifecycle. STOP before required database migration per Builder prompt: add pickup_started_at, delivery_started_at, delivered_at and extend the existing atomic advance_rescue RPC. Preserve participant RLS, FCFS and completion rules; no GPS fields or unrelated slices in this migration.
