# AOAI x ChatAndBuild Hackathon Submission Portal

Submission portal with a featured carousel, “all submissions” gallery, and an admin view.

## Run locally

```bash
npm install
npm run dev
```

## Supabase database (shared submissions)

This app can run **without** Supabase (local-only), but to share submissions across users you should connect it to Supabase.

### 1) Create tables + policies

- Create a Supabase project
- In the Supabase SQL editor, run:
  - `supabase/schema.sql`
  - `supabase/auth_profiles.sql`
  - `supabase/voting.sql`

`supabase/voting.sql` adds the `increment_submission_votes(...)` RPC and `submission_votes` table so votes are atomic, shared across users, and limited to one vote per user per project.

### 2) Add environment variables

Copy `.env.example` to `.env` and set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Then restart the dev server.

## Build

```bash
npm run build
npm run preview
```

