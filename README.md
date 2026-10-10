# Pip's Puzzles

A puzzle game for kids aged 3–7, set in **Jalebi Junction**: build the characters with drag-and-drop jigsaws, then guide Gappu through the town in the **Jalebi Hunt** maze.

```
pips-puzzles/
├── app/       React Native + Expo (the game, for Android and iPhone)
└── backend/   Django + Django REST Framework + PostgreSQL (accounts, puzzle packs, progress sync)
```

The game works fully **offline**: stars and settings are saved on the phone. The backend is for later features (parent accounts, cloud save, new puzzle packs) and is already wired up and tested.

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
- Admin (puzzles, parents, children, progress): http://127.0.0.1:8000/admin/

---

## 4. Connect the phone app to the backend

Your phone can't use `127.0.0.1` (on the phone, that means the phone itself). Use your laptop's Wi-Fi address instead:

1. Find it: `ipconfig` on Windows (*IPv4 Address*), `ipconfig getifaddr en0` on Mac. For example, `192.168.1.5`.
2. In `backend/.env`, add it to `DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.5`, then restart `runserver`.
3. Copy `app/.env.example` to `app/.env`, set `EXPO_PUBLIC_API_URL=http://192.168.1.5:8000`, then restart `npx expo start`.
4. In the app: **Grown-ups** button (top right on the home screen) → tap the three numbers → the *Game server* row should say **Connected**.

Windows may ask to allow Python through the firewall the first time: allow it on private networks.

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

---

## What's where

### App: `app/src`

| Path | What it is |
|---|---|
| `app/` | Screens (Expo Router: every file is a screen) |
| `app/index.tsx` | Home |
| `app/map.tsx` | Puzzle map: Easy / Medium / Hard, 5 each, with unlocking |
| `app/puzzle/[id].tsx` | Drag-and-drop character jigsaw (6 / 12 / 20 pieces) |
| `app/maze/[id].tsx` | Jalebi Hunt maze (arrow pad + swipe) |
| `app/complete/[id].tsx` | "You made Tillu!" celebration |
| `app/grown-ups/` | Parental gate + settings |
| `data/puzzles.ts` | Every puzzle and picture, tiers and unlock rules |
| `data/mazes.ts` | The three maze maps (Easy, Medium, Hard) |
| `game/jigsaw.ts` | Piece shapes, board guides, tray layout, stars |
| `game/maze.ts` | Maze rules: levers, gates, the switch, monkeys, laddoos |
| `state/progress.tsx` | Stars + settings, saved on the phone |
| `api/client.ts` | Calls to the Django API |
| `components/` | Buttons, icons, stars, jigsaw pieces, maze tiles |

**Unlocking:** Medium opens when every Easy puzzle has at least one star; Hard opens after Medium.
**Stars:** jigsaw = 3, minus 1 for using the picture hint, minus 1 for more than 5 missed drops. Maze = 1 per laddoo collected (at least 1).

### Backend: `backend/`

| App | Models | Endpoints |
|---|---|---|
| `content` | `Puzzle` (tier, order, kind, picture or uploaded image, grid size, maze JSON) | `GET /api/puzzles/`, `GET /api/health/` |
| `accounts` | `User` (parent, signs in with email), `ChildProfile` (nickname + avatar only) | `POST /api/auth/register/`, `POST /api/auth/token/`, `POST /api/auth/token/refresh/`, `/api/children/` |
| `progress` | `Progress` (best stars per child per puzzle) | `GET /api/progress/?child=<id>`, `POST /api/progress/sync/` |

Sign-in returns JWT tokens; send `Authorization: Bearer <access>` on the other calls. Sync keeps the **best** result, so a worse score from another phone never overwrites a better one.

---

## Checks

```bash
# app
cd app
npm run typecheck
npx expo lint
npm run test:logic      # 22 checks: piece shapes; every maze is solvable, needs its levers/switch, has no traps

# backend (venv active, PostgreSQL running)
cd backend
python manage.py test   # 11 API tests
```

---

## Good next steps

- **Sound:** add `expo-audio` with snap, cheer and click sounds; the Sound and Music switches are already saved.
- **New art:** Medium 2–4 and Hard 2–4 reuse Easy pictures for now (see `TODO(art)` in `data/puzzles.ts`).
- **Parent sign-in screen:** the API calls already exist in `api/client.ts`; add a screen under Grown-ups to use them.
- **Privacy policy:** both stores require one for kids' apps; set `PRIVACY_POLICY_URL` in `app/grown-ups/settings.tsx`.
- **Real builds:** `npx eas-cli@latest build -p android` makes an installable app in the cloud (no Android Studio needed).
- **Deploying the backend:** set `DJANGO_DEBUG=0`, a real `DJANGO_SECRET_KEY` and `DATABASE_URL`, and run with `gunicorn config.wsgi` on Render, Railway or Fly.io.
