/**
 * DEMO DATA — Not real operational data.
 *
 * This is simulated data for development and demonstration purposes only.
 * It does not represent live vessel positions, berth assignments, or port
 * operational data from any real port.
 *
 * All coordinates, vessel names, IMO numbers, and timestamps are fabricated
 * for UI development purposes.
 *
 * Replace this file with a real API service when the backend is available.
 */

import type { Vessel } from '@/types/vessel';
import type { Berth } from '@/types/berth';
import type { MonitoringData, ActivityDataPoint } from '@/types/monitoring';

// ─── Simulated network latency ───────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Stale-data threshold ────────────────────────────────────────────────────

/**
 * Number of milliseconds after which monitoring data is considered stale.
 * Configure this constant to match the expected update cadence of the
 * real backend.
 */
export const MONITORING_STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// ─── Mock vessels ────────────────────────────────────────────────────────────
//
// Coordinates are fictional and placed in a generic harbour region.
// They do not correspond to any real port geography.

const MOCK_VESSELS: Vessel[] = [
  {
    id: 'v-001',
    name: 'MSC Marianna',
    imo: '9734567',
    mmsi: '215678900',
    type: 'CONTAINER',
    status: 'AT_BERTH',
    latitude: 33.745,
    longitude: -118.265,
    ata: '2024-01-17T06:15:00Z',
    etd: '2024-01-17T22:00:00Z',
    berthId: 'B1',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'v-002',
    name: 'Ever Grand',
    imo: '9812345',
    mmsi: '477123456',
    type: 'CONTAINER',
    status: 'AT_BERTH',
    latitude: 33.743,
    longitude: -118.270,
    ata: '2024-01-17T04:30:00Z',
    etd: '2024-01-17T20:00:00Z',
    berthId: 'B2',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'v-003',
    name: 'Nordic Bulk Carrier',
    imo: '9601234',
    mmsi: '257901234',
    type: 'BULK',
    status: 'AT_BERTH',
    latitude: 33.741,
    longitude: -118.275,
    ata: '2024-01-17T02:00:00Z',
    etd: '2024-01-18T08:00:00Z',
    berthId: 'B3',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'v-004',
    name: 'Pacific Voyager',
    imo: '9745678',
    mmsi: '338456789',
    type: 'TANKER',
    status: 'AT_BERTH',
    latitude: 33.740,
    longitude: -118.278,
    ata: '2024-01-16T18:00:00Z',
    etd: '2024-01-17T16:00:00Z',
    berthId: 'B5',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'v-005',
    name: 'Horizon Ace',
    imo: '9823456',
    mmsi: '431567890',
    type: 'RO_RO',
    status: 'AT_BERTH',
    latitude: 33.738,
    longitude: -118.272,
    ata: '2024-01-17T07:45:00Z',
    etd: '2024-01-17T18:00:00Z',
    berthId: 'B6',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'v-006',
    name: 'Atlantic Express',
    imo: '9756789',
    mmsi: '235678901',
    type: 'CONTAINER',
    status: 'ARRIVING',
    latitude: 33.720,
    longitude: -118.310,
    eta: '2024-01-17T12:30:00Z',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'v-007',
    name: 'Orient Star',
    imo: '9867890',
    mmsi: '477234567',
    type: 'CONTAINER',
    status: 'ARRIVING',
    latitude: 33.715,
    longitude: -118.325,
    eta: '2024-01-17T14:00:00Z',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'v-008',
    name: 'Crest Bulker',
    imo: '9678901',
    mmsi: '311789012',
    type: 'BULK',
    status: 'WAITING',
    latitude: 33.728,
    longitude: -118.295,
    eta: '2024-01-17T11:00:00Z',
    waitingMinutes: 142,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'v-009',
    name: 'Marina Bay Tanker',
    imo: '9789012',
    mmsi: '566890123',
    type: 'TANKER',
    status: 'WAITING',
    latitude: 33.725,
    longitude: -118.300,
    eta: '2024-01-17T10:00:00Z',
    waitingMinutes: 218,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'v-010',
    name: 'Southern Cross',
    imo: '9890123',
    mmsi: '503901234',
    type: 'CONTAINER',
    status: 'WAITING',
    latitude: 33.722,
    longitude: -118.305,
    eta: '2024-01-17T09:30:00Z',
    waitingMinutes: 267,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'v-011',
    name: 'Gulf Pioneer',
    imo: '9901234',
    mmsi: '447012345',
    type: 'TANKER',
    status: 'DEPARTING',
    latitude: 33.742,
    longitude: -118.263,
    ata: '2024-01-16T14:00:00Z',
    etd: '2024-01-17T10:15:00Z',
    berthId: 'B4',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'v-012',
    name: 'Vega Bulk',
    // No IMO — some vessels may have incomplete records
    mmsi: '338123456',
    type: 'BULK',
    status: 'DEPARTING',
    latitude: 33.744,
    longitude: -118.268,
    ata: '2024-01-16T20:00:00Z',
    etd: '2024-01-17T11:00:00Z',
    berthId: 'B3',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'v-013',
    name: 'Sea Merchant',
    imo: '9712345',
    // No MMSI — may be unavailable
    type: 'OTHER',
    status: 'ARRIVING',
    // No coordinates — vessel position fix unavailable
    eta: '2024-01-17T15:30:00Z',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'v-014',
    name: 'Condor Arrow',
    imo: '9823789',
    mmsi: '441234567',
    type: 'RO_RO',
    status: 'WAITING',
    latitude: 33.726,
    longitude: -118.298,
    eta: '2024-01-17T08:00:00Z',
    waitingMinutes: 310,
    lastUpdated: new Date().toISOString(),
  },
];

// ─── Mock berths ─────────────────────────────────────────────────────────────

const MOCK_BERTHS: Berth[] = [
  {
    id: 'B1',
    name: 'Berth 1 — Container Terminal West',
    latitude: 33.745,
    longitude: -118.265,
    status: 'OCCUPIED',
    utilisation: 82,
    currentVesselId: 'v-001',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'B2',
    name: 'Berth 2 — Container Terminal East',
    latitude: 33.743,
    longitude: -118.270,
    status: 'CRITICAL',
    utilisation: 91,
    currentVesselId: 'v-002',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'B3',
    name: 'Berth 3 — Bulk Cargo North',
    latitude: 33.741,
    longitude: -118.275,
    status: 'OCCUPIED',
    utilisation: 74,
    currentVesselId: 'v-003',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'B4',
    name: 'Berth 4 — Bulk Cargo South',
    latitude: 33.739,
    longitude: -118.280,
    status: 'AVAILABLE',
    utilisation: 0,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'B5',
    name: 'Berth 5 — Liquid Terminal',
    latitude: 33.740,
    longitude: -118.278,
    status: 'CRITICAL',
    utilisation: 88,
    currentVesselId: 'v-004',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'B6',
    name: 'Berth 6 — Vehicle Processing',
    latitude: 33.738,
    longitude: -118.272,
    status: 'WARNING',
    utilisation: 77,
    currentVesselId: 'v-005',
    lastUpdated: new Date().toISOString(),
  },
];

// ─── Mock activity history ────────────────────────────────────────────────────

const MOCK_ACTIVITY_HISTORY: ActivityDataPoint[] = [
  { hour: '00:00', arrivals: 2, departures: 1 },
  { hour: '01:00', arrivals: 1, departures: 0 },
  { hour: '02:00', arrivals: 1, departures: 2 },
  { hour: '03:00', arrivals: 0, departures: 1 },
  { hour: '04:00', arrivals: 2, departures: 1 },
  { hour: '05:00', arrivals: 1, departures: 0 },
  { hour: '06:00', arrivals: 3, departures: 2 },
  { hour: '07:00', arrivals: 2, departures: 3 },
  { hour: '08:00', arrivals: 4, departures: 2 },
  { hour: '09:00', arrivals: 3, departures: 4 },
  { hour: '10:00', arrivals: 2, departures: 3 },
  { hour: '11:00', arrivals: 5, departures: 2 },
  { hour: '12:00', arrivals: 4, departures: 3 },
  { hour: '13:00', arrivals: 3, departures: 5 },
  { hour: '14:00', arrivals: 6, departures: 3 },
  { hour: '15:00', arrivals: 4, departures: 4 },
  { hour: '16:00', arrivals: 3, departures: 4 },
  { hour: '17:00', arrivals: 2, departures: 3 },
  { hour: '18:00', arrivals: 4, departures: 2 },
  { hour: '19:00', arrivals: 3, departures: 3 },
  { hour: '20:00', arrivals: 2, departures: 2 },
  { hour: '21:00', arrivals: 1, departures: 2 },
  { hour: '22:00', arrivals: 2, departures: 1 },
  { hour: '23:00', arrivals: 1, departures: 1 },
];

// ─── Derive summary from data ─────────────────────────────────────────────────

function computeSummary(vessels: Vessel[], berths: Berth[]): import('@/types/monitoring').MonitoringSummary {
  const activeVessels = vessels.filter(
    (v) => v.status === 'AT_BERTH' || v.status === 'ARRIVING' || v.status === 'DEPARTING'
  ).length;
  const arrivals = vessels.filter((v) => v.status === 'ARRIVING').length;
  const departures = vessels.filter((v) => v.status === 'DEPARTING').length;
  const waitingVessels = vessels.filter((v) => v.status === 'WAITING').length;

  const occupiedBerths = berths.filter((b) => b.status !== 'AVAILABLE');
  const berthUtilisation =
    berths.length > 0
      ? Math.round(occupiedBerths.reduce((sum, b) => sum + b.utilisation, 0) / berths.length)
      : 0;

  return {
    activeVessels,
    arrivals,
    departures,
    waitingVessels,
    berthUtilisation,
    lastUpdated: new Date().toISOString(),
  };
}

// ─── Service API ──────────────────────────────────────────────────────────────

/**
 * Fetches full monitoring data.
 * DEMO: Returns simulated data after an artificial delay.
 * Replace with a real HTTP client call when the backend is available.
 */
export async function fetchMonitoringData(): Promise<MonitoringData> {
  await delay(900);

  // Simulate occasional errors for development testing — uncomment to test:
  // if (Math.random() < 0.15) throw new Error('Simulated monitoring data fetch error');

  const vessels = MOCK_VESSELS.map((v) => ({
    ...v,
    lastUpdated: new Date().toISOString(),
  }));

  const berths = MOCK_BERTHS.map((b) => ({
    ...b,
    lastUpdated: new Date().toISOString(),
  }));

  return {
    summary: computeSummary(vessels, berths),
    vessels,
    berths,
    activityHistory: MOCK_ACTIVITY_HISTORY,
  };
}
