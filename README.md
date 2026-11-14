# Gym Log

A personal workout tracker you install on your phone like an app. It logs sets, reps and weights per exercise, tracks body weight weekly and monthly, stores progress photos, and charts your progress week by week.

- **Your storage:** data and photos live in your own [Supabase](https://supabase.com) project (Postgres + Storage). Row Level Security means only your account can read or write them.
- **Works offline:** the app opens and saves without a connection (bad gym Wi-Fi is fine). Changes upload when you're back online.
- **No build step:** plain HTML/CSS/JS modules, hosted free on GitHub Pages.

## Features

- Routines (e.g. Chest Day, Back Day) with sections (Main / Low-weight finishers / Optional) and "Or" alternatives
- Target **sets × reps** per exercise; starting a workout pre-fills last session's weights and shows what you did last time
- **Body-weight exercises** (pull-ups, dips): load = body weight + added kg, or minus the support (e.g. −20 kg on the assisted machine)
- Progress per exercise: top load, volume, total reps, estimated 1-rep max; weekly volume with % change
- Body weight log with weekly and monthly averages
- Progress photos (weekly / monthly / workout), side-by-side compare
- Copy any workout as text in the old WhatsApp format; JSON backup and restore

## Setup (one time, ~10 minutes)

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com) (free plan is enough; region **Frankfurt** is closest to Egypt).
2. **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. This creates the tables, the privacy rules and the private `photos` bucket. It's safe to run again.
3. **Authentication → Sign In / Providers → Email**: for a single-user app, you can turn **Confirm email** off so you can sign in straight after creating your account.
4. **Project Settings → API**: copy the **Project URL** and the **anon public** key.

### 2. GitHub
1. Repo **Settings → Secrets and variables → Actions → New repository secret**, add:
   - `SUPABASE_URL`: the Project URL
   - `SUPABASE_ANON_KEY`: the anon public key
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main` (or **Actions → Deploy to GitHub Pages → Run workflow**). The site goes live at `https://<username>.github.io/<repo>/`.

### 3. First sign-in
1. Open the site, tap **Create your account**, and use your email and a password.
2. **Lock it down:** in Supabase, **Authentication → Sign In / Providers**, turn off **Allow new users to sign up**. Your account keeps working; nobody else can register.
3. To bring in existing data, go to **Routines → Restore from backup** and choose the backup `.json` file.

### 4. Install on your phone
- **iPhone (Safari):** Share → **Add to Home Screen**
- **Android (Chrome):** ⋮ → **Install app** / **Add to Home screen**

## Local development
```bash
cp js/config.example.js js/config.js   # then paste your URL + anon key
python3 -m http.server 8000            # or any static server
# open http://localhost:8000
```
`js/config.js` is git-ignored. The anon key is meant to be public (it's shipped to every browser); Row Level Security is what protects the data.

## How it fits together
```
index.html            app shell
css/app.css           styles
js/app.js             UI: log, workout editor, progress, body, routines
js/store.js           offline-first sync: local cache + upload queue ⇄ Supabase
js/config.js          Supabase URL + anon key (generated on deploy)
sw.js                 service worker: app works offline, updates on each deploy
supabase/schema.sql   tables, Row Level Security, photo bucket
.github/workflows/    GitHub Pages deploy
```

Each record is stored as JSON in a `data` column, so the app can grow (new fields, new exercise types) without database migrations. Example query in the Supabase SQL editor:
```sql
select data->>'date' as date, (data->>'kg')::numeric as kg from bodyweight order by 1;
```

## Backups
**Routines → Download backup** saves everything except the photo files as JSON. Photos stay in the Supabase `photos` bucket, where you can also download them from the dashboard.
