# Pip's Puzzles

A puzzle game for kids aged 3–7. **Pip's Big Picture**: Pip and Gappu ride the Jalebi Express round India to invite a
friend from every corner to the Friendship Mela at Diwali. **10 levels**, one stop each, 52 puzzles, 14 friends
(the story, cast and every level are in [STORY.md](STORY.md)):

| Level | Stop | New friend | Puzzles |
|---|---|---|---|
| 1 | Jalebi Junction | (home: Gappu, Mithu, Tillu, Chunnu, Gauri, Pip) | Jigsaws, shadows, snap, maze, the station jigsaw |
| 2 | Punjab: Golden Fields | Bholu the buffalo | Jigsaw, Baisakhi snap, shadows, first tracks, find the dhol maze |
| 3 | Rajasthan: Desert Fair | Kesar the camel | Jigsaw, **Mandana rangoli**, shadows with a decoy, snap, puppet maze |
| 4 | Gujarat: Kite Festival | Raja the lion | Jigsaw, tracks, farsan snap, shadows, kites slide puzzle |
| 5 | Mumbai: Monsoon City | Chikki the mouse | Jigsaw, modak maze (2 levers), rangoli, snap, tracks with decoys |
| 6 | Kerala: Backwaters | Appu the elephant | Jigsaw, shadows, **pookalam**, snake-boat slide, tracks |
| 7 | Tamil Nadu: Temple Town | Mayil the peacock | Jigsaw (20), **kolam**, tracks, shadows, tiffin snap |
| 8 | Kolkata: City of Joy | Bagha the tiger | Jigsaw, mishti snap, shadows, **alpana**, Howrah Express |
| 9 | The Hills | Momo the red panda | Jigsaw (24), toy-train slide, picnic snap (8 pairs), hill maze (switch), loops tracks |
| 10 | Home for Diwali | (everyone) | Diwali shop, Diwali Express, lamplight shadows, mithai snap, Lantern Walk, **The Big Picture** |

Seven kinds of game, and no two in a row in a level play the same way: jigsaw (spin jigsaws in level 10), Who's That
Shadow?, Snack Snap, Fix the Tracks, slide puzzle, maze, and **Rangoli** (colour a festival floor pattern to match
the picture, in five regional styles). Each level opens with a story card to read aloud and ends with its new friend
hopping on the train with a gift for the Mela.

```
pips-puzzles/
├── app/       React Native + Expo (the game, for Android and iPhone)
└── backend/   Django + Django REST Framework + PostgreSQL (accounts, puzzle packs, progress sync)
```

The game works fully **offline**: stars and settings are saved on the phone. The **puzzles come from the backend**: add one in Django admin and every phone picks it up the next time the game opens, with no app update. The last list the server sent is saved on the phone, and the 52 built-in puzzles are used until a server has been reached. The backend also has parent accounts and cloud save, ready for a sign-in screen.

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
python manage.py seed_puzzles   # loads the 52 puzzles of the 10 levels
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
- **how far players get**: played → finished one → reached level 2 → level 5 → level 10
- by level, by kind of phone, parent accounts, and the latest plays
- **Download CSV** of every play event in the time range

**Puzzles** lists every puzzle in play order with its players, finish rate, average stars and typical time. From here you can move a puzzle up or down, hide or publish it, and open it for its own stats, stars chart and a preview drawn the way the game shows it (Duplicate and Delete are there too).

**New puzzle** builds one without writing JSON, with a live preview and checks as you go:

| Kind | How you make it |
|---|---|
| Jigsaw | Pick a picture from the game or upload your own (about 3:2), choose columns × rows, tick *Spin* to start pieces turned round |
| Who's That Shadow? | Tick 2 to 6 friends |
| Snack Snap | Tick 2 to 8 snacks |
| Slide puzzle | Pick a picture, board size and difficulty, press **Shuffle**: the server mixes it so it can always be solved and works out the fewest moves (for the stars) |
| Fix the Tracks | Choose width, height and decoy pieces, press **Generate** until you like the map; *Show it solved* shows the line |
| Maze | Start from one of the game's mazes and edit the map; `goal` picks what Gappu finds (jalebis, any snack, or a gift like `dhol`); the check says if Gappu can't reach it or a laddoo |
| Rangoli | Start from one of the game's patterns and change the rings (shape, count, one or two colours) or the style; the preview draws it as the game will |

Save, and published puzzles reach phones the next time the game opens (or a grown-up opens **Grown-ups**). A puzzle's id (like `level-3-7`) never changes, so children keep their stars on it even if you move or rename it. The same checks run in the Django admin, so a puzzle that can't be finished can't be saved either way.

Choose the **level** (1 to 10) a puzzle belongs to; it goes at the end of that level unless you give it an order. New puzzles must use one of the seven kinds above, with the game's friends, snacks and pictures (listed in `backend/content/ids.py`). A new *kind* of game, or new friends and snacks, still needs an app update. If something in the server's list doesn't fit the app, the app leaves that puzzle out rather than crashing.

**Where the numbers come from.** The game sends a short note to `POST /api/events/` when a puzzle is started, finished (with its stars and time) or left unfinished. It's anonymous: the phone makes up a random id the first time, and no names or accounts are involved. Notes wait on the phone while it's offline and are sent later. Grown-ups can switch it off under **Grown-ups → Privacy → Share play stats**.

**Try it with made-up numbers** (clearly marked "demo" everywhere on the dashboard):

```bash
python manage.py demo_analytics          # 120 pretend phones over 60 days
python manage.py demo_analytics --clear  # remove them again (real plays are kept)
```

You can also add a puzzle in **Django admin** (`/admin/` → Puzzles → Add): pick its **Level**, **Order** and
**Kind**, then fill **Picture**/**Cols**/**Rows** (jigsaws), **Maze** (mazes) or **Config** (the other kinds, in the same
shape as the puzzles in `app/src/data/puzzles.ts`). Admin runs the same checks, so a broken puzzle can't be published.

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

### e) Updating a live server to the story levels (app 1.4)

Deploy the **backend first**. On start, migrations `0007` and `0008` turn Easy/Medium/Hard into levels and add the new
puzzles: the 15 older puzzles keep their ids (so children keep their stars) and move to their place in the story;
puzzles you made in the dashboard go to the end of a level (Easy ones to level 1, Medium to level 10, Hard to 9); and
older puzzles you renamed in the dashboard keep your changes. Then release the app.

Phones with an app from before 1.4 don't understand levels: they ignore the new list and keep playing the last one
they saved. The 1.4 app ignores a list from a server that hasn't been updated, and plays its own 52 puzzles.

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
| `app/index.tsx` | Home: two doors, **Puzzles** (Pip) and **Learn with Bit** (the robot) |
| `app/map.tsx` | The journey map: a card per level joined by a railway, the new friend's face, a Story button, the next stop's friend as a mystery shadow, and the train of friends who have joined |
| `app/story/[level].tsx` | A level's story card (picture and lines to read aloud), shown before its first puzzle and from the map |
| `app/puzzle/[id].tsx` | Drag-and-drop jigsaw (6 to 24 pieces; "spin" jigsaws: tap a piece to turn it) |
| `app/shadow/[id].tsx` | Who's That Shadow? (drag friends onto their shadows) |
| `app/memory/[id].tsx` | Snack Snap memory game |
| `app/tracks/[id].tsx` | Fix the Tracks (tap to turn track pieces, then the train drives) |
| `app/slide/[id].tsx` | Slide puzzle |
| `app/maze/[id].tsx` | Maze (arrow pad + swipe); each level hides its own goal (dhol, puppet, modaks, momos...) |
| `app/rangoli/[id].tsx` | Rangoli: pick a colour pot, tap the pattern; every matching shape fills at once |
| `app/complete/[id].tsx` | Celebration screen ("Choo choo!", "Found them all!"…) |
| `app/lab/index.tsx` | Learn with Bit: the robot lab, lesson path and badges |
| `app/lab/[id].tsx` | Teach the Robot: the child sorts pictures, then Bit sorts new ones by itself |
| `app/grown-ups/` | Parental gate + settings (incl. "What your child learned with Bit") |
| `data/levels.ts` | The 10 levels: place, friend, story card, finale, and each level's look (colours, decoration, maze houses, music); level 10 is Diwali night |
| `data/puzzles.ts` | The 52 built-in puzzles in level order (used until a server has been reached) |
| `data/catalog.ts` | Reads and checks the server's puzzle list; play order and unlock rules (no React, unit-tested) |
| `data/games.ts` | Friends, snacks and gifts; track maps, slide boards and rangoli patterns |
| `data/mazes.ts` | The maze maps (six of them) |
| `data/art.ts` | Pictures, friend cut-outs, snacks, gifts and the train set |
| `data/seed.ts` | A puzzle in the server's shape: `npm run seed` writes `backend/content/seed.json` from the built-in list |
| `game/jigsaw.ts` | Piece shapes, board guides, tray layout, spin turns, stars |
| `game/maze.ts` | Maze rules: levers, gates, the switch, monkeys, laddoos |
| `game/tracks.ts`, `memory.ts`, `slide.ts`, `shadow.ts`, `rangoli.ts` | Rules for the other games, including the random layouts (no React, unit-tested) |
| `game/teach.ts` | Teach the Robot: what Bit sees in each picture, how it guesses (nearest example), the 5 lessons |
| `audio/sound.ts` | Sound effects and music (made by `scripts/make-sounds.py`), obeying the Sound and Music switches |
| `navigation.ts` | Which screen plays each kind of puzzle; shows a level's story card first, the first time |
| `state/catalog.tsx` | Which puzzles are played: asks the server when the game opens, saves the list on the phone |
| `state/playStats.ts` | Anonymous play stats for the dashboard: queued on the phone, sent when online, off-switch in Grown-ups |
| `state/progress.tsx` | Stars + settings, saved on the phone |
| `api/client.ts` | Calls to the Django API |
| `components/` | Buttons, icons, stars, jigsaw pieces, maze tiles, Bit (`Bit.tsx`) and the lesson pictures (`ThingArt.tsx`), all drawn in code |
| `components/Festive.tsx` | Decorations drawn in code: diyas, lights, fireworks, and each level's backdrop (bunting, mirror-work, kites, rain, palms, toran, snow) |
| `components/LevelParty.tsx` | A level's finale: the new friend joins the train with their gift; level 10 ends the story with fireworks and The Big Picture |
| `components/PuzzleThumb.tsx` | Map tiles drawn from the puzzle itself (its friends, snacks, track map, maze or rangoli), so every puzzle gets a thumbnail |
| `components/RangoliArt.tsx` | Draws a rangoli from its rings |

**Unlocking:** a level opens once 4 puzzles of the level before have at least one star (all of them, if it has fewer than 4), so one tricky puzzle never blocks a child. Adding more puzzles to a level never locks one a child has already opened. Levels 1 and 2 are gentler: a peek at the Snack Snap cards, jigsaw pieces laid out in a grid, and no decoy shadow.
**Stars** (always at least 1 for finishing):

- Jigsaw: 3, minus 1 for using the picture hint, minus 1 for more than 5 missed drops.
- Shadows: 3 for at most 1 wrong try, 2 for at most 3.
- Snack Snap: 3 for at most one wrong guess per pair, 2 for at most two per pair.
- Tracks: 3 within 6 taps of the fewest possible, 2 within a generous margin.
- Slide: 3 within 10 moves of the fewest possible (10), 2 within a generous margin.
- Maze: 1 per laddoo collected.
- Rangoli: 3 for at most one wrong colour, 2 for at most three.
- Learn with Bit: 3 if Bit sorts everything right the first time, 2 after one re-teach, 1 after that. Lessons open one after another; the lab itself is always open.

**The story** ([STORY.md](STORY.md)): each level has a story card (shown before its first puzzle, and from the map's Story button), puzzles that each tell a small moment with a true Pip's fact about the place, and a one-time finale when it's done. Level 10, Home for Diwali, is the night level: Diwali Express lights a diya on every joined piece, Lantern Walk is a dark maze, and finishing The Big Picture plays the "Happy Diwali!" fireworks.

**The art kit** (`app/scripts/art/`): the friends, places, snacks and gifts are drawn in TypeScript from small reusable parts (`kit.ts`: faces, bodies, Indian motifs such as torans, bunting, diyas, kites, palms, gopurams, kolams), so a new friend or a new place is a few lines. `npm run art` renders everything to `app/assets/images/game/` with resvg (installed by `npm install`, no system tools); `npm run art -- bholu --preview` redraws just the matching pictures and writes a contact sheet. Hand-written SVGs in the same folder are rendered too, and can use existing pictures by file name (`<image href="shop.png">`).

**How Bit learns** (`game/teach.ts`): each picture has a few things you can see (colour, shape, wings, wheels, a stem…). For a new picture Bit finds the taught example that shares the most, colour counting less than shape, and copies its basket. So Bit really does copy the child's mistakes. Lesson 4 is set up so Bit first learns from red fruits only and wrongly calls a red ball a fruit; the logic tests check every lesson works out the way the story needs.

### Backend: `backend/`

| App | Models | Endpoints |
|---|---|---|
| `content` | `Puzzle` (level, order, kind, title, finish-screen cheer and blurb, picture or uploaded image, grid size, maze JSON, settings JSON for the other kinds); `ids.py` lists the levels, pictures, friends, snacks and gifts the app has | `GET /api/puzzles/`, `GET /api/health/` |
| `accounts` | `User` (parent, signs in with email), `ChildProfile` (nickname + avatar only) | `POST /api/auth/register/`, `POST /api/auth/token/`, `POST /api/auth/token/refresh/`, `/api/children/` |
| `progress` | `Progress` (best stars per child per puzzle) | `GET /api/progress/?child=<id>`, `POST /api/progress/sync/` |
| `analytics` | `PlayEvent` (anonymous: start / finish / left, stars, seconds, phone type); `stats.py` works out the dashboard's numbers | `POST /api/events/` |
| `dashboard` | Staff-only pages at `/dashboard/`: overview, puzzles, puzzle builder. `content/builders.py` holds the server's copies of the game rules (track generator, slide shuffler, maze, track and rangoli checks) | |

Sign-in returns JWT tokens; send `Authorization: Bearer <access>` on the other calls. Sync keeps the **best** result, so a worse score from another phone never overwrites a better one.

---

## Checks

```bash
# app
cd app
npm run typecheck
npx expo lint
npm run test:logic      # 168 checks: every maze and track map is solvable, random layouts never start a piece near its spot, slide scrambles get the true best solution, rangoli taps land on the right ring, every level gets harder and tells its story, the server's seed matches the built-in puzzles, and more

# backend (venv active, PostgreSQL running). The tests make a temporary database on whatever server
# DATABASE_URL points to, so point it at your local one first (not Supabase).
cd backend
python manage.py test   # 44 tests: API, play stats, dashboard pages and puzzle builder, game-rule checks, the move to levels
```

---

## Good next steps

- **More sound:** effects and the background tune are made by `app/scripts/make-sounds.py` (`python3 scripts/make-sounds.py` regenerates them into `app/assets/sounds/`); add a tune per chapter as new areas arrive.
- **Parent sign-in screen:** the API calls already exist in `api/client.ts`; add a screen under Grown-ups to use them.
- **Privacy policy:** live at `/privacy/` on the backend (`backend/content/templates/content/privacy.html`; the contact comes from `PRIVACY_OWNER` and `PRIVACY_EMAIL`). The app links to it from Grown-ups → About. Update the page and its date whenever the game starts collecting something new.
- **Real builds:** `npx eas-cli@latest build -p android` makes an installable app in the cloud (no Android Studio needed).
- **Once the backend is live (step 6):** a custom domain on Render, and a paid instance so the server doesn't sleep.
