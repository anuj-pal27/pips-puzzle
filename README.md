# Pip's Puzzles

A puzzle game for kids aged 3–7, set in **Jalebi Junction**. Fifteen puzzles in three tiers, and no two in a row play the same way:

| | Easy | Medium | Hard |
|---|---|---|---|
| 1 | Jigsaw: Gappu (6 pieces) | Jigsaw: Jalebi Shop (12) | **Spin jigsaw**: Station (20), pieces start turned round, tap to spin |
| 2 | **Who's That Shadow?** Drag 3 friends onto their shadows | **Fix the Tracks** Turn track pieces to join the station to the jalebi stall | **Slide puzzle** Put Tillu back together |
| 3 | **Snack Snap** Memory cards, 3 pairs | **Who's That Shadow?** 5 friends, with look-alikes | **Fix the Tracks** Bigger, with decoy pieces |
| 4 | Jigsaw: Chunnu (6) | **Snack Snap** 4 pairs | **Snack Snap** 6 pairs |
| 5 | Jalebi Hunt maze | Jalebi Hunt maze (2 levers) | Jalebi Hunt maze (levers + switch) |

```
pips-puzzles/
├── app/       React Native + Expo (the game, for Android and iPhone)
└── backend/   Django + Django REST Framework + PostgreSQL (accounts, puzzle packs, progress sync)
```

The game works fully **offline**: stars and settings are saved on the phone. The **puzzles come from the backend**: add one in Django admin and every phone picks it up the next time the game opens, with no app update. The last list the server sent is saved on the phone, and the 15 built-in puzzles are used until a server has been reached. The backend also has parent accounts and cloud save, ready for a sign-in screen.

---

## 1. Install these once

| Tool | Get it from | Check it works |
|---|---|---|
| Node.js **LTS** | nodejs.org | `node -v` |
| Git | git-scm.com (Mac: `xcode-select --install`) | `git --version` |
| VS Code + **Expo Tools** extension | code.visualstudio.com | |
| Python **3.12, 3.13 or 3.14** (Windows: tick *Add Python to PATH*) | python.org | `python --version` (Mac: `python3 --version`) |
| PostgreSQL 16 or newer | postgresql.org/download | `psql --version` |
| **Expo Go** on your phone | Play Store / App Store | |

Phone and laptop must be on the **same Wi-Fi**.

---

## 2. Run the game on your phone

```bash
cd app
npm install
npx expo start
```

Scan the QR code: Expo Go on Android, the Camera app on iPhone.

- Windows error *"running scripts is disabled"* → run once in PowerShell: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
- Phone can't connect → `npx expo start --tunnel`

---

## 3. Run the backend (Django + PostgreSQL)

### a) Create the database (once)

Open **psql** as the `postgres` admin user (Windows: Start menu → *SQL Shell (psql)*; Mac: `psql postgres`) and run:

```sql
CREATE USER pips WITH PASSWORD 'pips' CREATEDB;
CREATE DATABASE pips_puzzles OWNER pips;
```

(`CREATEDB` lets Django create a temporary database when you run the tests.)

### b) Set up Django (once)

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment. Do this every time you open a new terminal for the backend:

- Windows (PowerShell): `.venv\Scripts\Activate.ps1`
- Mac: `source .venv/bin/activate`

Then:

```bash
pip install -r requirements.txt
copy .env.example .env          # Mac: cp .env.example .env
python manage.py migrate
python manage.py seed_puzzles   # loads the 15 puzzles
python manage.py createsuperuser
```

### c) Start it

```bash
python manage.py runserver 0.0.0.0:8000
```

- API check: http://127.0.0.1:8000/api/health/ → `{"status": "ok"}`
- **Dashboard** (play stats, puzzle builder): http://127.0.0.1:8000/dashboard/ (sign in with the superuser from step 3b)
- Django admin (raw data: puzzles, parents, children, progress, play events): http://127.0.0.1:8000/admin/

---

## 4. Connect the phone app to the backend

Your phone can't use `127.0.0.1` (on the phone, that means the phone itself). Use your laptop's Wi-Fi address instead:

1. Find it: `ipconfig` on Windows (*IPv4 Address*), `ipconfig getifaddr en0` on Mac. For example, `192.168.1.5`.
2. In `backend/.env`, add it to `DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.5`, then restart `runserver`.
3. Copy `app/.env.example` to `app/.env`, set `EXPO_PUBLIC_API_URL=http://192.168.1.5:8000`, then restart `npx expo start`.
4. In the app: **Grown-ups** button (top right on the home screen) → tap the three numbers → the *Game server* row should say **Connected**, and *Puzzles* should say **From the game server**.

Windows may ask to allow Python through the firewall the first time: allow it on private networks.

### The dashboard: play stats and making puzzles

Open http://127.0.0.1:8000/dashboard/ and sign in with the superuser from step 3b (only staff accounts get in).

**Overview** shows how the game is doing over the last 7, 30 or 90 days (or all time):

- players (phones), new players, puzzles started and finished, finish rate and average stars, each compared with the period before
- plays per day (point at a day for its numbers, or open it as a table)
- **where children get stuck**: puzzles with the lowest finish rate
- **how far players get**: played → finished one → reached Medium → reached Hard
- by tier, by kind of phone, parent accounts, and the latest plays
- **Download CSV** of every play event in the time range

**Puzzles** lists every puzzle in play order with its players, finish rate, average stars and typical time. From here you can move a puzzle up or down, hide or publish it, and open it for its own stats, stars chart and a preview drawn the way the game shows it (Duplicate and Delete are there too).

**New puzzle** builds one without writing JSON, with a live preview and checks as you go:

| Kind | How you make it |
|---|---|
| Jigsaw | Pick a picture from the game or upload your own (about 3:2), choose columns × rows, tick *Spin* to start pieces turned round |
| Who's That Shadow? | Tick 2 to 6 friends |
| Snack Snap | Tick 2 to 6 snacks |
| Slide puzzle | Pick a picture, board size and difficulty, press **Shuffle**: the server mixes it so it can always be solved and works out the fewest moves (for the stars) |
| Fix the Tracks | Choose width, height and decoy pieces, press **Generate** until you like the map; *Show it solved* shows the line |
| Jalebi Hunt maze | Start from the Easy, Medium or Hard maze and edit the map; the check says if Gappu can't reach the jalebis or a laddoo |

Save, and published puzzles reach phones the next time the game opens (or a grown-up opens **Grown-ups**). A puzzle's id (like `easy-6`) never changes, so children keep their stars on it even if you move or rename it. The same checks run in the Django admin, so a puzzle that can't be finished can't be saved either way.

New puzzles must use one of the six kinds above, with the game's friends, snacks and pictures. A new *kind* of game, or new friends and snacks, still needs an app update. If something in the server's list doesn't fit the app, the app leaves that puzzle out rather than crashing.

**Where the numbers come from.** The game sends a short note to `POST /api/events/` when a puzzle is started, finished (with its stars and time) or left unfinished. It's anonymous: the phone makes up a random id the first time, and no names or accounts are involved. Notes wait on the phone while it's offline and are sent later. Grown-ups can switch it off under **Grown-ups → Privacy → Share play stats**.

**Try it with made-up numbers** (clearly marked "demo" everywhere on the dashboard):

```bash
python manage.py demo_analytics          # 120 pretend phones over 60 days
python manage.py demo_analytics --clear  # remove them again (real plays are kept)
```

---|---|
   | Jigsaw | **Picture**: a built-in id (`gappu`, `mithu`, `tillu`, `chunnu`, `shop`, `station`) **or** upload an **Image** (about 3:2), plus **cols** (2–6) and **rows** (2–5). Settings `{"spin": true}` turns pieces round. |
   | Shadow | Settings `{"friends": ["gappu", "gauri", "pip"], "cols": 3}` (friends: `gappu mithu tillu chunnu gauri pip`) |
   | Snack Snap | Settings `{"snacks": ["jalebi", "chai", "mango"], "cols": 3}` (snacks: `jalebi laddoo samosa chai kulfi mango`) |
   | Tracks | Settings `{"map": [...], "taps": [...], "start": 0, "goal": 4}`: see the legend at the top of `app/src/game/tracks.ts` |
   | Slide | Picture or Image, and settings `{"size": 3, "start": [...], "par": 10}` |
   | Maze | **Maze** JSON, in the same shape as `app/src/data/mazes.ts` |

   **Cheer** and **Blurb** are the finish screen's headline and line of text.
3. Save. Admin checks the settings, so a broken puzzle can't be published. Untick **Is published** to hide a puzzle again.
4. On the phone, close and reopen the game (or just open **Grown-ups**): the new puzzle is on the map.

New puzzles must use one of the six kinds above, with the friends, snacks and pictures listed. A new *kind* of game, or new friends and snacks, still needs an app update. If something in the server's list doesn't fit the app, the app leaves that puzzle out rather than crashing.

---

## 5. Build the real app (installable APK)

Expo Go (step 2) is only a preview tool. To get **Pip's Puzzles** as its own app with its own icon, build it in the cloud with EAS. You don't need Android Studio.

1. Make a free account at **expo.dev**.
2. In the `app` folder:
   ```bash
   npm install
   npx eas-cli@latest login
   npm run build:apk
   ```
3. The first run asks a few questions. Answer **Yes** to creating the EAS project, and **Yes** to generating a new Android keystore (EAS stores it safely for you).
4. Wait about 10–20 minutes. You get a link and a QR code: open it **on your Android phone**, download the APK and install it. Allow *Install unknown apps* for your browser when Android asks.

The app id is `com.anujpal.pipspuzzles` (in `app/app.json`). Change it before your first Play Store upload if you want a different one; after that it can never change.

**For the Play Store:** run `npm run build:store`. It makes an `.aab` file instead of an APK, and the version number goes up automatically on every build.

### Build on your own computer instead (no EAS, nothing uploaded)

This needs the Android tools on your computer:

1. Install **Android Studio** (developer.android.com/studio). Open it once and let it download the Android SDK.
2. Install **Java 17** (for example Temurin 17 from adoptium.net).
3. Set `ANDROID_HOME` to the SDK folder:
   - Windows: `C:\Users\<you>\AppData\Local\Android\Sdk` (System settings → Environment variables), then open a new terminal
   - Mac: add `export ANDROID_HOME=$HOME/Library/Android/sdk` to `~/.zshrc`
   - Linux: add `export ANDROID_HOME=$HOME/Android/Sdk` to `~/.bashrc`

Then, in the `app` folder:

```bash
npm run build:apk:local
```

The first build takes a while (it downloads Gradle and the Android libraries). The APK ends up at `app/android/app/build/outputs/apk/release/app-release.apk`. Copy it to your phone and open it, or with the phone plugged in (USB debugging on): `adb install -r android/app/build/outputs/apk/release/app-release.apk`.

- This APK is signed with a test key, so it's for your own phones, not the Play Store.
- If the EAS-built app is already on the phone, uninstall it first: Android won't replace an app signed with a different key.
- The `android/` folder is generated each time and isn't committed.

---

## 6. Deploy the backend (Supabase + Render)

So far the server runs on your laptop, so only phones on your Wi-Fi reach it. To put it online:
**Supabase** keeps the database and uploaded pictures, **Render** runs Django (the part phones talk to).
Both have free plans. `render.yaml` in this repo describes the Render side.

### a) Supabase: database and picture storage

1. At supabase.com, **New project**. Region: closest to your players (Mumbai for India). Save the database password.
2. **Turn off Supabase's automatic API**: *Project Settings → Data API* → off (or remove `public` from the exposed schemas).
   Django is the only thing that talks to this database, and that API would otherwise publish Django's tables
   (including parents' accounts). *Advisors → Security Advisor* should then show no warnings about tables being exposed.
3. **Database address**: *Connect* (top of the project) → **Session pooler**. Copy it and add `?sslmode=require`:
   `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require`
   (a password with `@ : / #` in it needs URL-encoding; easiest is a letters-and-numbers password).
4. **Picture bucket**: *Storage → New bucket*, name `puzzles`, **Public** on.
5. **Storage keys**: *Project Settings → Storage → S3 access keys → New access key*. Note the **Endpoint**
   (`https://<ref>.storage.supabase.co/storage/v1/s3`) and **Region** shown on that page, the **Access key ID** and
   **Secret access key** (shown once). These keys can change any file, so they only ever go on the server.

### b) Fill the Supabase database (from your laptop)

Render's free plan has no shell, so set the database up from here. In `backend/.env`, temporarily replace
`DATABASE_URL` with the Supabase address from a3, then:

```bash
cd backend
python manage.py migrate
python manage.py seed_puzzles
python manage.py createsuperuser      # your dashboard login on the live server
```

Already made puzzles locally that you want to keep? Before switching `DATABASE_URL`, save them with
`python manage.py dumpdata --natural-foreign --exclude contenttypes --exclude auth.permission --exclude admin.logentry --exclude sessions -o local-data.json`,
and after `migrate` load them with `python manage.py loaddata local-data.json` (instead of `seed_puzzles`). Delete the
file afterwards: it holds account data. Pictures you uploaded locally (in `backend/media/puzzles/`) go into the
bucket's `puzzles/` folder with the same names (Supabase *Storage → puzzles → Upload*).

Then put `DATABASE_URL` back to your local one, so testing on your laptop never touches the live data.

### c) Render: run Django

1. Push this repository to GitHub, with the backend on the branch Render should deploy (normally `main`).
2. At render.com: **New + → Blueprint**, connect the repository. Render reads `render.yaml` and asks for the secret values:

   | Setting | Value |
   |---|---|
   | `DATABASE_URL` | the Supabase address from a3 (with `?sslmode=require`) |
   | `MEDIA_S3_ENDPOINT` | the Endpoint from a5 |
   | `MEDIA_S3_REGION` | the Region from a5, e.g. `ap-south-1` |
   | `MEDIA_S3_ACCESS_KEY_ID` / `MEDIA_S3_SECRET_ACCESS_KEY` | the keys from a5 |
   | `MEDIA_PUBLIC_HOST` | `<ref>.supabase.co/storage/v1/object/public/puzzles` (no `https://`) |

   `DJANGO_SECRET_KEY` is made up by Render; the server's own address is added to the allowed hosts automatically.
3. **Apply**. The first build takes a few minutes. Then check, with the address Render shows (e.g. `https://pips-puzzles-api.onrender.com`):
   - `…/api/health/` → `{"status": "ok"}`
   - `…/dashboard/` → sign in with the login from b
   - make a test puzzle with an uploaded picture, and check the picture shows up

Every push that changes `backend/` redeploys it; database changes (migrations) run by themselves on start.

### d) Point the app at it

- **Cloud builds (EAS)** don't see `app/.env`. Store the address in EAS instead, once per build profile:
  ```bash
  cd app
  npx eas-cli@latest env:set --name EXPO_PUBLIC_API_URL --value https://pips-puzzles-api.onrender.com --environment preview --visibility plaintext
  npx eas-cli@latest env:set --name EXPO_PUBLIC_API_URL --value https://pips-puzzles-api.onrender.com --environment production --visibility plaintext
  npm run build:apk
  ```
- **Local APK builds** and **Expo Go** use `app/.env`: set `EXPO_PUBLIC_API_URL` to the Render address there.

Install the new build, open **Grown-ups**: *Game server* should say **Connected** with the Render address.

### Good to know about the free plans

- **Render free servers sleep** after 15 minutes without visitors and take about a minute to wake. The game copes (it
  keeps the puzzles it already has and sends play stats later), but the first open after a quiet spell won't pick
  up new puzzles. A paid Render instance stays awake; worth it once real children play.
- **Supabase free projects pause** after about a week with no activity; un-pause from the Supabase dashboard.
- Back up the database: Supabase's free plan has limited backups, so occasionally run the `dumpdata` command above against it.

---

## What's where

### App: `app/src`

| Path | What it is |
|---|---|
| `app/` | Screens (Expo Router: every file is a screen) |
| `app/index.tsx` | Home |
| `app/map.tsx` | Puzzle map: Easy / Medium / Hard, 5 each, with unlocking |
| `app/puzzle/[id].tsx` | Drag-and-drop jigsaw (6 / 12 / 20 pieces; "spin" jigsaws: tap a piece to turn it) |
| `app/shadow/[id].tsx` | Who's That Shadow? (drag friends onto their shadows) |
| `app/memory/[id].tsx` | Snack Snap memory game |
| `app/tracks/[id].tsx` | Fix the Tracks (tap to turn track pieces, then the train drives) |
| `app/slide/[id].tsx` | Slide puzzle |
| `app/maze/[id].tsx` | Jalebi Hunt maze (arrow pad + swipe) |
| `app/complete/[id].tsx` | Celebration screen ("Choo choo!", "Found them all!"…) |
| `app/grown-ups/` | Parental gate + settings |
| `data/puzzles.ts` | The 15 built-in puzzles, pictures and tiers (used until a server has been reached) |
| `data/catalog.ts` | Reads and checks the server's puzzle list; play order and unlock rules (no React, unit-tested) |
| `data/games.ts` | Settings for shadows, Snack Snap, track maps and the slide puzzle |
| `data/mazes.ts` | The three maze maps (Easy, Medium, Hard) |
| `data/art.ts` | Friend cut-outs, snacks, train set and map thumbnails |
| `game/jigsaw.ts` | Piece shapes, board guides, tray layout, spin turns, stars |
| `game/maze.ts` | Maze rules: levers, gates, the switch, monkeys, laddoos |
| `game/tracks.ts`, `memory.ts`, `slide.ts`, `shadow.ts` | Rules for the other games (no React, unit-tested) |
| `navigation.ts` | Which screen plays each kind of puzzle |
| `state/catalog.tsx` | Which puzzles are played: asks the server when the game opens, saves the list on the phone |
| `state/playStats.ts` | Anonymous play stats for the dashboard: queued on the phone, sent when online, off-switch in Grown-ups |
| `state/progress.tsx` | Stars + settings, saved on the phone |
| `api/client.ts` | Calls to the Django API |
| `components/` | Buttons, icons, stars, jigsaw pieces, maze tiles |

**Unlocking:** Medium opens once 5 Easy puzzles have at least one star (all of them, if Easy has fewer than 5); Hard opens the same way after Medium. Adding more puzzles to a tier never locks a tier a child has already opened.
**Stars** (always at least 1 for finishing):

- Jigsaw: 3, minus 1 for using the picture hint, minus 1 for more than 5 missed drops.
- Shadows: 3 for at most 1 wrong try, 2 for at most 3.
- Snack Snap: 3 for at most one wrong guess per pair, 2 for at most two per pair.
- Tracks: 3 within 6 taps of the fewest possible, 2 within a generous margin.
- Slide: 3 within 10 moves of the fewest possible (10), 2 within a generous margin.
- Maze: 1 per laddoo collected.

### Backend: `backend/`

| App | Models | Endpoints |
|---|---|---|
| `content` | `Puzzle` (tier, order, kind, title, finish-screen cheer and blurb, picture or uploaded image, grid size, maze JSON, settings JSON for the other kinds) | `GET /api/puzzles/`, `GET /api/health/` |
| `accounts` | `User` (parent, signs in with email), `ChildProfile` (nickname + avatar only) | `POST /api/auth/register/`, `POST /api/auth/token/`, `POST /api/auth/token/refresh/`, `/api/children/` |
| `progress` | `Progress` (best stars per child per puzzle) | `GET /api/progress/?child=<id>`, `POST /api/progress/sync/` |
| `analytics` | `PlayEvent` (anonymous: start / finish / left, stars, seconds, phone type); `stats.py` works out the dashboard's numbers | `POST /api/events/` |
| `dashboard` | Staff-only pages at `/dashboard/`: overview, puzzles, puzzle builder. `content/builders.py` holds the server's copies of the game rules (track generator, slide shuffler, maze and track checks) | |

Sign-in returns JWT tokens; send `Authorization: Bearer <access>` on the other calls. Sync keeps the **best** result, so a worse score from another phone never overwrites a better one.

---

## Checks

```bash
# app
cd app
npm run typecheck
npx expo lint
npm run test:logic      # 49 checks: every maze and track map is solvable, the slide puzzle's best solution, card deals, the server's seed matches the built-in puzzles, and more

# backend (venv active, PostgreSQL running)
cd backend
python manage.py test   # 38 tests: API, play stats, dashboard pages and puzzle builder, game-rule checks
```

---

## Good next steps

- **Sound:** add `expo-audio` with snap, cheer and click sounds; the Sound and Music switches are already saved.
- **Parent sign-in screen:** the API calls already exist in `api/client.ts`; add a screen under Grown-ups to use them.
- **Privacy policy:** both stores require one for kids' apps; set `PRIVACY_POLICY_URL` in `app/grown-ups/settings.tsx`. It should mention the anonymous play stats (what's sent, and the off switch in Grown-ups).
- **Real builds:** `npx eas-cli@latest build -p android` makes an installable app in the cloud (no Android Studio needed).
- **Once the backend is live (step 6):** a custom domain on Render, and a paid instance so the server doesn't sleep.
