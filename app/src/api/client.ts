// Talks to the Django + DRF backend (../backend). The game itself never needs the server:
// everything is saved on the phone. These calls are for later features (cloud save, new puzzle packs).
//
// Set the address in app/.env (copy .env.example):
//   EXPO_PUBLIC_API_URL=http://192.168.1.5:8000      <- your laptop's Wi-Fi address, not 127.0.0.1

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');

export type RemotePuzzle = {
  slug: string;
  tier: 'easy' | 'medium' | 'hard';
  order: number;
  kind: 'jigsaw' | 'maze' | 'shadow' | 'memory' | 'tracks' | 'slide';
  title: string;
  picture: string;
  image: string | null;
  cols: number | null;
  rows: number | null;
  maze: unknown;
  config: Record<string, unknown>; // settings for the other kinds, same shape as src/data/games.ts
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

/** Is the server reachable? Used by the grown-ups settings screen. */
export const checkServer = () => request<{ status: string }>('/api/health/');

/** Published puzzles, in tier order. */
export const fetchPuzzles = () => request<RemotePuzzle[]>('/api/puzzles/');

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
