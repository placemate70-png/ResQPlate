# ResQPlate

Phase 1 website: Supabase Auth, permanent Donor/Volunteer/NGO profiles, protected role areas, donations, private food images, GrabBoard, atomic reservation and confirmation, and database-enforced 60-second expiry.

Run locally:
1. `npm ci`
2. Copy `.env.example` to `.env.local` and set the project URL and publishable key.
3. `npm run dev` (127.0.0.1:5173); `npm run build` and `npm run preview` (4173).

For a new Supabase project, apply `supabase/migrations/*.sql` in order as the database owner. These migrations are already applied to the current project. Configure the Site URL and both local `/auth/callback` URLs in Supabase Auth. Hosted deployment requires an SPA fallback and its own callback URL.

Roles are selected once after login. NGO accounts can read shared food information and status; they cannot claim or edit donations. Food images are private, limited to JPEG/PNG/WebP and 5 MB, and served through short-lived signed URLs. Reservation RPCs lock the donation row and use database time; confirmed claims persist, and pg_cron releases abandoned reservations. UI timers only display time.

Checks: `npm run typecheck`, `npm run lint`, `npm run build`.
Live API checks: `npm run test:phase1`, `npm run test:expiry` (waits 62 real seconds), and `npm run test:fcfs -- <available-QA-donation-id>`. These create real, clearly labelled development donations. They require provisioned, confirmed QA Auth accounts named `resqplate-qa-{donor,volunteer-a,volunteer-b,ngo}@example.invalid`, with their shared test password supplied as `QA_PASSWORD` in ignored `.env.test.local`. Email signup/confirmation was verified separately with the user-controlled test account. `supabase/tests/profiles_rls.sql` runs as the database owner and rolls back its temporary fixtures.

Never put database passwords or service-role credentials in Vite environment variables. Phase 2 is not implemented.
