/**
 * Returns the resolved backend API base URL.
 *
 * Development:  '' (empty) → Vite proxy handles /api/* → 127.0.0.1:8001
 * Production:   https://harborline-backend.onrender.com
 *               Set VITE_API_URL in Vercel project environment variables.
 */
export function apiBase(): string {
  return (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
}

/**
 * Build a full API URL path.
 * Usage: apiUrl('/api/v1/optimization/compare')
 */
export function apiUrl(path: string): string {
  return `${apiBase()}${path}`;
}
