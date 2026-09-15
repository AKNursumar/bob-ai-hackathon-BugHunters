// ─── Vessel Status ──────────────────────────────────────────────────────────

export type VesselStatus =
  | 'ARRIVING'
  | 'AT_BERTH'
  | 'WAITING'
  | 'DEPARTING';

// ─── Vessel Type ────────────────────────────────────────────────────────────

export type VesselType =
  | 'CONTAINER'
  | 'TANKER'
  | 'BULK'
  | 'RO_RO'
  | 'OTHER';

// ─── Vessel ─────────────────────────────────────────────────────────────────

/**
 * Represents a vessel operating in or approaching the port.
 * Optional fields reflect real operational data availability constraints —
 * missing fields must not crash the UI.
 */
export interface Vessel {
  id: string;
  name: string;
  /** IMO number — may be unavailable for some vessel types */
  imo?: string;
  /** MMSI number — may be unavailable */
  mmsi?: string;
  type: VesselType;
  status: VesselStatus;
  /** WGS-84 latitude — absent if position fix unavailable */
  latitude?: number;
  /** WGS-84 longitude — absent if position fix unavailable */
  longitude?: number;
  /** Estimated time of arrival — ISO timestamp */
  eta?: string;
  /** Actual time of arrival — ISO timestamp */
  ata?: string;
  /** Estimated time of departure — ISO timestamp */
  etd?: string;
  /** Berth identifier the vessel is assigned to or occupying */
  berthId?: string;
  /** Minutes vessel has been waiting at anchor or in queue */
  waitingMinutes?: number;
  /** ISO timestamp of the last AIS or port system update */
  lastUpdated: string;
}
