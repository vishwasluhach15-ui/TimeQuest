# TimeQuest — Phase 0

Data layer skeleton for TimeQuest. Abhi koi game nahi hai — sirf yeh confirm
karne ke liye ki Next.js ↔ Supabase connection sahi se kaam kar raha hai,
aur schema future phases ke liye ready hai.

## What's here

- `app/page.tsx` — landing page
- `app/cards/page.tsx` — fetches `knowledge_cards` + `topics` from Supabase
  and renders them grouped by topic (Server Component, no client JS needed)
- `lib/supabase/` — client (browser) and server-side Supabase clients
- `lib/types.ts` — shared TypeScript types matching the schema
- `supabase/schema.sql` — full table definitions + seed data

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is fine).

3. **Run the schema** — Supabase Dashboard → SQL Editor → paste the contents
   of `supabase/schema.sql` → Run. This creates all tables and seeds a
   handful of real Harappan facts to get you started.

4. **Set environment variables** — copy `.env.example` to `.env.local` and
   fill in your project's URL + anon key (Dashboard → Settings → API):
   ```bash
   cp .env.example .env.local
   ```

5. **Run it**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) → click through to
   `/cards`. Agar tumhe seeded Harappan facts dikh rahe hain, Phase 0 done.

## Phase 1 — now included

- `/play` — an explorable Phaser scene. Arrow keys to move, SPACE to talk
  to the Elder, walk over markers to collect knowledge cards (writes to
  `player_cards` in Supabase as you go).
- `game/scenes/HarappaScene.ts` — all Phaser code lives here, isolated
  from the rest of the app. It never touches Supabase directly; it just
  fires callbacks (`onDiscover`, `onAllFound`, `onTalkNpc`) that the React
  page listens to.
- `game/PhaserGame.tsx` — the bridge between React and Phaser. Phaser
  needs `window`/canvas, so it's dynamically imported with `ssr: false`
  in `app/play/page.tsx` — don't remove that or the build will break.
- `lib/player.ts` — creates an anonymous player id on first visit,
  stored in `localStorage`. No login yet.

Run `npm install` again after pulling this update (adds the `phaser`
package), then `npm run dev` → `/play`.

## Known limitations (fine for a hackathon demo, fix before anything real)

- No Row Level Security policies on the Supabase tables — anyone with
  your anon key can read/write every table. Acceptable for a 2-3 day demo,
  not for a public launch.
- No real auth — player identity is just a localStorage id, easy to fake
  or lose (clearing browser data = new player).
- Art is placeholder shapes, not sprites/tilesets.

## Next (Phase 2)

- Adaptive quiz page pulling from `quiz_questions`, writing to
  `quiz_attempts`.
- Dashboard page aggregating `quiz_attempts` + `player_cards` by topic —
  strong/weak areas, unexplored topics, what to play next.

## Phase 2 — now included

- **Run `supabase/phase2-seed.sql` once** in the SQL Editor (in addition
  to `schema.sql` — don't re-run that one, it'll duplicate rows). This
  adds quiz coverage for the "Script & writing" topic.
- `/quiz` — adaptive quiz. The logic lives in `lib/quiz.ts`, separate from
  the page: it covers every topic once (easiest question first), then
  keeps pulling from whichever topic you're currently weakest in. Every
  answer writes a row to `quiz_attempts`.
- `/dashboard` — pulls together `player_cards` + `quiz_attempts`, grouped
  by topic, and shows: cards discovered, quiz accuracy, and a "what to do
  next" recommendation. "Daily life & crafts" is deliberately left with
  no cards or questions seeded — that's what proves the "topics you
  haven't explored yet" logic is real, not hardcoded.
- Full loop now works end to end: `/play` → collect cards → `/quiz` →
  answer questions → `/dashboard` → see the results.

## Phase 3 — content + mobile polish

- **Run `supabase/phase3-content-seed.sql` once** (after schema.sql and
  phase2-seed.sql). Fills in "Daily life & crafts" — now all 4 topics
  have real cards and quiz questions.
- `/play` now has 6 collectible cards (was 4) — `game/scenes/HarappaScene.ts`
  has 2 new spawn positions.
- Responsive canvas: the Phaser game now scales to fit narrow screens
  (`Phaser.Scale.FIT`) instead of overflowing on mobile.
- On-screen d-pad + Talk button appear on small screens (`sm:hidden` —
  desktop still just uses the keyboard). Wired through
  `HarappaScene.setTouchDirection()` / `.attemptTalk()`.

No new npm packages.

## Deployment fix (if your build failed before)

Two real bugs were caught and fixed here by actually running `npm run
build` locally (worth doing before every deploy, not just trusting that
`npm run dev` working means the production build will too):

1. **Fragile Supabase generic types** — `createClient<Database>(...)` was
   causing query results to silently type as `never`, which failed the
   TypeScript build. Fixed by dropping the `<Database>` generic entirely;
   we type our own data with `lib/types.ts` instead.
2. **Eager Supabase client at module load** — `export const supabase =
   createClient(...)` ran the moment the file was imported, including
   during Next.js's build-time page generation. If env vars weren't
   available at that exact moment (classic Vercel gotcha: adding env vars
   only for "Development" and not "Production"), the build crashed with
   `supabaseUrl is required`. Fixed with a lazy singleton —
   `getSupabaseClient()` in `lib/supabase/client.ts` only creates the
   client the first time something actually calls it.

If you ever see a Vercel build fail again: run `npm run build` locally
first — it reproduces almost every deploy failure without needing to
push and wait.
