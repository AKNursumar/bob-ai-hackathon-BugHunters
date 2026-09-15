// ─── Berth Status ───────────────────────────────────────────────────────────

export type BerthStatus =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'WARNING'
  | 'CRITICAL';

// ─── Berth ──────────────────────────────────────────────────────────────────

/**
 * Represents a berth or mooring position in the port.
 * Coordinates are optional — some berths may not have precise lat/lon.
 */
export interface Berth {
  id: string;
  name: string;
  /** WGS-84 latitude — absent if not georeferenced */
  latitude?: number;
  /** WGS-84 longitude — absent if not georeferenced */
  longitude?: number;
  status: BerthStatus;
  /** Utilisation percentage 0–100 */
  utilisation: number;
  /** ID of the vessel currently occupying the berth */
  currentVesselId?: string;
  /** ISO timestamp of last status update */
  lastUpdated: string;
}
