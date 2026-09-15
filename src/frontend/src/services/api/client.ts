/**
 * Shared API client for Harborline backend.
 *
 * Base URL resolution:
 *   - Development: empty string → Vite dev proxy forwards /api/* to 127.0.0.1:8001
 *   - Production (Vercel): VITE_API_URL=https://harborline-backend.onrender.com
 *     The full URL becomes https://harborline-backend.onrender.com/api/v1/...
 *
 * Set VITE_API_URL in your Vercel project environment variables.
 * Never set it to localhost in production.
 */

const _rawBase = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const BASE = `${_rawBase}/api/v1`;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body?.detail ?? detail;
    } catch {
      // ignore JSON parse failure
    }
    throw new ApiError(res.status, detail);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
};
