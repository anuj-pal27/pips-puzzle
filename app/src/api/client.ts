// Talks to the Django + DRF backend (../backend). The game never needs the server to play: it loads
// the puzzle list from it when it can (src/state/catalog.tsx) and saves that on the phone. The other
// calls are for later features (parent accounts, cloud save).
//
// Set the address in app/.env (copy .env.example):
//   EXPO_PUBLIC_API_URL=http://192.168.1.5:8000      <- your laptop's Wi-Fi address, not 127.0.0.1

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');

// One puzzle as the server sends it. src/data/catalog.ts checks it and turns it into a game puzzle.
export type RemotePuzzle = {
  slug: string;
  level?: number; // 1 to 10 (STORY.md). Servers from before the levels sent a `tier` instead, and are ignored.
  order: number; // play order inside the level
  kind: 'jigsaw' | 'maze' | 'shadow' | 'memory' | 'tracks' | 'slide' | 'rangoli';
  title: string;
  cheer: string;
  blurb: string;
  fact?: string; // Pip's fact (servers before v1.1 don't send it)
  picture: string; // id of a picture bundled in the app
  image: string | null; // or the full address of a picture uploaded on the server
  image_width: number | null;
  image_height: number | null;
  cols: number | null;
  rows: number | null;
  maze: unknown;
  config: Record<string, unknown>; // settings for the other kinds, same shape as in src/data/puzzles.ts
  updated_at: string;
};

export type Tokens = { access: string; refresh: string };

async function request<T>(path: string, options: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} on ${path}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Published puzzles, in play order. Not checked yet: pass the result to readServerPuzzles(). */
export const fetchPuzzles = () => request<unknown>('/api/puzzles/');

/** Parent sign-in (email + password) -> JWT tokens. */
export const signIn = (email: string, password: string) =>
  request<Tokens>('/api/auth/token/', { method: 'POST', body: JSON.stringify({ username: email, password }) });

export const registerParent = (email: string, password: string) =>
  request<{ id: number; email: string }>('/api/auth/register/', { method: 'POST', body: JSON.stringify({ email, password }) });

export type Child = { id: number; nickname: string; avatar: string };
export const listChildren = (token: string) => request<Child[]>('/api/children/', { token });
export const addChild = (token: string, nickname: string, avatar = 'pip') =>
  request<Child>('/api/children/', { method: 'POST', token, body: JSON.stringify({ nickname, avatar }) });

/** Upload this phone's stars; the server keeps the best per puzzle and returns the merged result. */
export const syncProgress = (token: string, child: number, stars: Record<string, number>) =>
  request<{ child: number; stars: Record<string, number> }>('/api/progress/sync/', {
    method: 'POST',
    token,
    body: JSON.stringify({ child, items: Object.entries(stars).map(([puzzle, s]) => ({ puzzle, stars: s })) }),
  });

/** One thing that happened in a game, for the anonymous play stats (src/state/playStats.ts). */
export type PlayEvent = {
  id: string;
  type: 'start' | 'finish' | 'quit';
  puzzle: string;
  stars?: number;
  seconds?: number;
  at: string; // ISO time on the phone
};

export const sendPlayEvents = (body: { device: string; platform: string; app_version: string; events: PlayEvent[] }) =>
  request<{ saved: number }>('/api/events/', { method: 'POST', body: JSON.stringify(body) });
