# ResQPlate

Phase 1 + Phase 2 website: Supabase Auth, permanent Donor/Volunteer/NGO profiles, protected role areas, donations, private food images, GrabBoard, atomic reservation and confirmation, database-enforced 60-second expiry, FreshClock, PlateCount and RouteBuddy.

Run locally:
1. `npm ci`
2. Copy `.env.example` to `.env.local` and set the project URL and publishable key.
3. `npm run dev` (127.0.0.1:5173); `npm run build` and `npm run preview` (4173).

For a new Supabase project, apply `supabase/migrations/*.sql` in order as the database owner. These migrations are already applied to the current project. Configure the Site URL and both local `/auth/callback` URLs in Supabase Auth. Hosted deployment requires an SPA fallback and its own callback URL.

Roles are selected once after login. NGO accounts can read shared food information and status; they cannot claim or edit donations. Food images are private, limited to JPEG/PNG/WebP and 5 MB, and served through short-lived signed URLs. Reservation RPCs lock the donation row and use database time; confirmed claims persist, and pg_cron releases abandoned reservations. UI timers only display time.

Checks: `npm run typecheck`, `npm run lint`, `npm run build`.
Live API checks: `npm run test:phase1`, `npm run test:expiry` (waits 62 real seconds), and `npm run test:fcfs -- <available-QA-donation-id>`. These create real, clearly labelled development donations. They require provisioned, confirmed QA Auth accounts named `resqplate-qa-{donor,volunteer-a,volunteer-b,ngo}@example.invalid`, with their shared test password supplied as `QA_PASSWORD` in ignored `.env.test.local`. Email signup/confirmation was verified separately with the user-controlled test account. `supabase/tests/profiles_rls.sql` runs as the database owner and rolls back its temporary fixtures.

FreshClock uses gravy = 1.5 hours and dry/rice = 4 hours, plus 1 hour strictly below 30°C. The unspecified 30–38°C range retains the same base window. Deadlines are calculated and stored by Postgres; the shared frontend utility renders remaining time. These prototype windows are estimates, not food-safety certification.

PlateCount assumes 300 g/ml per serving, or uses a directly entered portion count. Quantity is the total across all containers; optional per-container litre capacity validates liquid quantities. Estimated and manually corrected counts are stored separately. Only the owning donor can correct a count; blank restores the estimate.

RouteBuddy uses real pickup coordinates and server-created timestamps. Every new donation serves a 180-second hold enforced by a database trigger on reservation. A private cron function assigns UUID batches to fresh pending donations of the same food type, with every pair within 1.5 km according to the single `distance_km` database function. Pending neighbours can join the batch but remain hidden until their own full hold ends. Isolated, expired or legacy records without coordinates release individually. Batch members retain independent atomic reservations. Realtime updates donor/NGO/GrabBoard state, with database refresh during reconnects.

Additional checks: `npm run test:logic`, `npm run test:phase2` (180 real seconds). Phase 1 API and expiry tests now also wait for the real RouteBuddy hold before claiming their fixtures. A live release test exercises cron with actual timestamps, not shortened frontend timers.

Never put database passwords or service-role credentials in Vite environment variables. Production hosting needs `npm run build`, the `dist` output directory, an SPA fallback, and the hosted `/auth/callback` URL allowed in Supabase Auth.

Migrations 009–015 add NGO availability, participant-only rescue progress/location, atomic operational transitions, Realtime and RLS-scoped distances. After FCFS confirmation, the volunteer selects an accepting NGO, starts pickup, marks pickup, starts delivery and marks delivery. Only the assigned NGO can confirm receipt with an actual plate count. Expired food cannot advance, operations are row-locked/idempotent, and clients cannot directly write rescue records. Existing rows and participant RLS are preserved; missing legacy timestamps are shown as not recorded. Completed receipts populate community impact and role dashboards; quantities retain their units and pending claims never count as completed impact.

FreshClock shows HH:MM:SS from the stored deadline, with FRESH above 60 minutes, USE SOON at 60 minutes, URGENT at 15 minutes and EXPIRED at zero. Its local clock does not query the database. Test the real progress/RLS flow with `node --env-file=.env.local --env-file=.env.test.local tests/rescues.mjs` (includes the real 180-second hold).

Active Rescue lives at `/volunteer/rescue?rescue=<donation-id>`. Its device-location button requests browser geolocation; already-granted permission refreshes location when opened and after meaningful actions. Location is private to rescue participants, timestamps are server-generated, updates are throttled to 15 seconds, and completion prevents new writes. NGO accounts can enter their actual receiving coordinates in the dashboard. Leaflet/OpenStreetMap renders only available coordinates with attribution; OSRM provides cached driving routes/time estimates without live traffic. Missing/stale GPS never produces a fabricated ETA: a pickup-to-NGO planned route is labelled explicitly. GPS/route/map failures do not block rescue actions. GrabBoard distances reuse the database's `distance_km` calculation and donation RLS.

One shared Realtime channel watches useful INSERT/UPDATE events from donations, rescues and NGO availability, waits for replication readiness, debounces refreshes and cleans up when the last listener unmounts. Reconnects re-fetch current state; disconnected clients refresh every 15 seconds. Browser donor delivery and volunteer NGO-completion updates were verified without refresh. The final QA device returned `Current location unavailable`; actual device-position success remains to be checked with location services enabled. GPS failure contracts, private location persistence and permission/RLS checks passed; database test coordinates are explicitly labelled QA fixtures and do not simulate browser GPS.

Additional checks: `node tests/gps.mjs`, `node tests/impact.mjs`, `node tests/routes.mjs` and `node tests/routes.mjs --live`. The location/realtime/final live tests accept the corresponding claimed/completed QA donation ID and run with the two ignored environment files. SmartReassign, HeroRank, SafeCall and continuous tracking remain deferred; unused contracts in `src/integrations.ts` are retained without visible placeholders.

SnapFill uses `supabase/functions/snapfill`, with JWT verification enabled plus server-side user and donor-role checks. The selected image is sent once for analysis without storing a copy; after donation creation, the same file can use the existing private Storage uploader. Strict JSON visual estimates are applied only on request, remain editable, and require donor review confirmation. Unknown quantities are left untouched; temperature, preparation time and coordinates are never inferred. The local provider is Gemini: `GEMINI_API_KEY` is read only inside the function. Default model: `gemini-3.1-flash-lite`; optional server secret `SNAPFILL_GEMINI_MODEL` selects a compatible Gemini vision/structured-output model. Missing credentials, quota failures and unusable results preserve manual entry; there is no paid-provider fallback.

Deploy with an account that can access the existing project:
```
npx supabase login
npx supabase functions deploy snapfill --project-ref uwystgvvdfyqeqyifxgm --use-api
```
`GEMINI_API_KEY` is configured in the existing project's Edge Function Secrets and the Gemini function is deployed. Never put it in Vite or Git. Live authenticated food-photo analysis and browser apply/edit/review/create/upload/refresh verification passed. Run `node tests/snapfill.mjs` for controlled Gemini handler/error tests and `npx deno check supabase/functions/snapfill/index.ts` for server typechecking. Run `node --env-file=.env.local --env-file=.env.test.local tests/snapfill-live.mjs C:\path\food.jpg` with a real food photo for deployed verification. The QA photograph is Vegetable rice - 1 by Ashok Kumar P S, [CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Vegetable_rice_-_1.jpg), used unchanged and credited in the clearly labelled QA donation. No photograph is committed.
