CHECKPOINT
SLICE: 1 - SnapFill Gemini.
COMPLETED: Deployed Gemini 3.1 Flash-Lite; real food-photo analysis, editable suggestions, review gate, donor correction, donation creation, private image upload and refresh persistence verified.
FILES: src/{DonationForm,ImageUpload,SnapFill}.tsx, src/{integrations,snapFillService,useSnapFill}.ts, supabase/config.toml, supabase/functions/snapfill/{index,handler,contract}.ts, tests/snapfill{,-live}.mjs, .gitignore, README.md, CHECKPOINT.md.
DB: NONE. JWT verification, donor checks, RLS and private Storage preserved. GEMINI_API_KEY stays server-only.
VERIFY: PASS - typecheck/lint/build/Deno, controlled handler tests, real deployed Gemini API, browser flow. Older model returned 404; compatible stable 3.1 model passed.
NEXT: Slice 2 - FreshClock HH:MM:SS countdown.
