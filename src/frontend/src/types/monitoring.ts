import type { Vessel } from './vessel';
import type { Berth } from './berth';

// ─── Monitoring Summary ──────────────────────────────────────────────────────

export interface MonitoringSummary {
  activeVessels: number;
  arrivals: number;
  departures: number;
  waitingVessels: number;
  /** Berth utilisation percentage 0–100 */
  berthUtilisation: number;
  /** ISO timestamp of last data synchronisation */
  lastUpdated: string;
}

// ─── Activity History Point ──────────────────────────────────────────────────

/** A single time-series data point for the arrivals/departures chart */
export interface ActivityDataPoint {
  /** Hour label, e.g. "08:00" */
  hour: string;
  arrivals: number;
  departures: number;
}

// ─── Monitoring Data ─────────────────────────────────────────────────────────

export interface MonitoringData {
  summary: MonitoringSummary;
  vessels: Vessel[];
  berths: Berth[];
  /** Hourly activity history for the past 24 hours */
  activityHistory: ActivityDataPoint[];
}
