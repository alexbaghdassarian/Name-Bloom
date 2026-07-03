# NameBloom 🌸

A "swipe to find a baby name, together" app for couples. Each partner swipes through
names from cultures around the world; when you both land on the same name it becomes a
**match**, with confetti. Narrow matches down to **finalists**, and celebrate when you
hit your goal.

Built with **React + Vite**, deploys to **Netlify**. Real accounts and two-device sync
run on **Supabase** (free tier) — but the app also runs in **Demo Mode** with no backend
at all, so you can try the entire flow immediately.

---

## Run it locally (Demo Mode, zero setup)

```bash
npm install
npm run dev
```

Open the local URL. With no Supabase keys set, you're in **Demo Mode**:
data is saved in your browser, and a floating **⇄ switch partner** button (bottom-right)
lets one person play both partners on a single device. Create two accounts, link them,
build a project, and swipe as each person to see matches fire.

---

## Deploy to Netlify

### Option A — instant demo (no backend)

1. Push this folder to a GitHub repo.
2. In Netlify: **Add new site → Import from Git**, pick the repo.
3. Netlify reads `netlify.toml` automatically (build `npm run build`, publish `dist`). Deploy.

That's a fully working single-device app. To get real accounts syncing across two phones,
do Option B.

### Option B — real accounts + two-device sync (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In Supabase → **SQL Editor**, paste all of `supabase/schema.sql` and **Run**.
3. In Supabase → **Project Settings → API**, copy the **Project URL** and the **anon public** key.
4. In Netlify → **Site settings → Environment variables**, add:
   - `VITE_SUPABASE_URL` = your project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon public key
5. **Redeploy** (env vars are read at build time). The app now uses Supabase automatically —
   the "switch partner" button disappears and each partner signs in on their own device.

By default Supabase requires email confirmation. For testing, you can turn it off under
**Authentication → Providers → Email → Confirm email**.

---

## How it works

- **Accounts & partners** — each person makes an account and links their partner by email.
  Linking is mutual and lives in `profiles.partner_id`.
- **Projects** — e.g. "My first baby." A project stores the included cultures, favorited
  (prioritized) cultures, a gender filter, and an optional surname for full-name previews.
  When you create a project, your partner is added automatically and sees the same setup.
- **The deck** (`src/lib/names.js → buildDeck`) filters names to your included cultures and
  gender, removes anything you've already swiped, then front-loads favorited cultures roughly
  2:1 while interleaving others so every session spans several cultures.
- **Matches** (`src/lib/api.js → computeMatches`) = a name every project member liked.
  A **super match** is one at least one of you gave a ★ (swipe up / star button).
- **Realtime** — with Supabase, each swipe is pushed to the other partner live, so a match
  can pop with confetti on both phones at once.
- **Finalists & vetoes** — from the Matches screen, either partner can star a name; when you
  both star the same one it becomes a **Finalist**. Either partner can veto a match to retire it.
  Share/export your shortlist from the Share button.

---

## The names dataset

`public/names.json` is generated from curated per-culture lists in
`scripts/generate_names.mjs` — currently **~1,405 names across 27 cultures** (roughly
45–85 per culture), each with a gender, origin, meaning, phonetic pronunciation, and common spelling alternatives.

**To grow it toward thousands:** add entries to the arrays in `generate_names.mjs`
(format `["Name", "meaning"]`) and run:

```bash
npm run gen:names
```

You can also drop in a public baby-names CSV. `name_id` is just a stable string, so as long
as each name has a unique `id`, `name`, `gender`, `culture`, `origin`, and optional `meaning`,
the app will use it. The database never needs the names — swipes only store the `name_id`.

---

## Project structure

```
public/names.json          generated names dataset
scripts/generate_names.mjs  edit + regenerate the dataset
src/lib/
  api.js                   picks backend, match logic
  names.js                 dataset loading + deck builder
  demoStore.js             no-backend demo backend (localStorage)
  supabaseStore.js         real backend (auth + db + realtime)
src/components/            SwipeCard, SwipeDeck, Confetti, DemoSwitcher
src/screens/               Auth, Partner, Projects, ProjectSetup, Swiping, Matches
supabase/schema.sql        run once in Supabase SQL editor
netlify.toml               build + SPA redirect config
```

## Ideas to build next

- Push notification when your partner finishes a batch or you hit a match milestone.
- Sibling-name harmony check (flag names that clash or rhyme with an existing child).
- Popularity / trend data per name and year.
- Pronunciation audio.
- A shared "final vote" ceremony to pick THE name from your finalists.
