import type { SeverityLevel } from '@/types';

/**
 * Map a utilisation percentage to a severity level.
 */
export function utilisationToSeverity(pct: number): SeverityLevel {
  if (pct >= 90) return 'critical';
  if (pct >= 75) return 'high';
  if (pct >= 55) return 'medium';
  return 'low';
}

/**
 * Format a number with thousands separators.
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * Format an ISO timestamp to a human-readable time string.
 */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Format an ISO timestamp to a short date+time string.
 */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Capitalise the first letter of a string.
 */
export function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
