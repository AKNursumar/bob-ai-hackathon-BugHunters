/**
 * DEMO DATA — Not real operational data.
 * This is simulated data for development and demonstration purposes only.
 * It does not represent live Port of JNPA / Nhava Sheva data.
 *
 * Replace this file with a real API service when the backend is available.
 */

import type {
  DashboardSummary,
  CongestionTrendPoint,
  BerthUtilisation,
  CongestionRisk,
  AIRecommendation,
  OperationsSummary,
} from '@/types';

// ─── Simulated network latency ───────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Static mock dataset ────────────────────────────────────────────────────

const MOCK_CONGESTION_TREND: CongestionTrendPoint[] = [
  { timestamp: '2024-01-15T00:00:00Z', congestionIndex: 58, waitingVessels: 11, berthUtilisation: 71 },
  { timestamp: '2024-01-15T04:00:00Z', congestionIndex: 61, waitingVessels: 12, berthUtilisation: 73 },
  { timestamp: '2024-01-15T08:00:00Z', congestionIndex: 67, waitingVessels: 14, berthUtilisation: 76 },
  { timestamp: '2024-01-15T12:00:00Z', congestionIndex: 72, waitingVessels: 15, berthUtilisation: 80 },
  { timestamp: '2024-01-15T16:00:00Z', congestionIndex: 78, waitingVessels: 17, berthUtilisation: 84 },
  { timestamp: '2024-01-15T20:00:00Z', congestionIndex: 74, waitingVessels: 16, berthUtilisation: 82 },
  { timestamp: '2024-01-16T00:00:00Z', congestionIndex: 69, waitingVessels: 14, berthUtilisation: 78 },
  { timestamp: '2024-01-16T04:00:00Z', congestionIndex: 65, waitingVessels: 13, berthUtilisation: 75 },
  { timestamp: '2024-01-16T08:00:00Z', congestionIndex: 71, waitingVessels: 15, berthUtilisation: 79 },
  { timestamp: '2024-01-16T12:00:00Z', congestionIndex: 76, waitingVessels: 17, berthUtilisation: 83 },
  { timestamp: '2024-01-16T16:00:00Z', congestionIndex: 82, waitingVessels: 18, berthUtilisation: 88 },
  { timestamp: '2024-01-16T20:00:00Z', congestionIndex: 85, waitingVessels: 19, berthUtilisation: 91 },
  { timestamp: '2024-01-17T00:00:00Z', congestionIndex: 79, waitingVessels: 17, berthUtilisation: 87 },
];

const MOCK_BERTH_UTILISATIONS: BerthUtilisation[] = [
  { berthId: 'B1', name: 'Berth 1 — Container Terminal West', utilisationPct: 82, severity: 'high', currentVessels: 4, maxCapacity: 5 },
  { berthId: 'B2', name: 'Berth 2 — Container Terminal East', utilisationPct: 91, severity: 'critical', currentVessels: 5, maxCapacity: 5 },
  { berthId: 'B3', name: 'Berth 3 — Bulk Cargo North', utilisationPct: 74, severity: 'high', currentVessels: 3, maxCapacity: 4 },
  { berthId: 'B4', name: 'Berth 4 — Bulk Cargo South', utilisationPct: 58, severity: 'medium', currentVessels: 2, maxCapacity: 4 },
  { berthId: 'B5', name: 'Berth 5 — Liquid Terminal', utilisationPct: 81, severity: 'high', currentVessels: 4, maxCapacity: 5 },
  { berthId: 'B6', name: 'Berth 6 — Vehicle Processing', utilisationPct: 45, severity: 'low', currentVessels: 2, maxCapacity: 4 },
];

const MOCK_ACTIVE_RISKS: CongestionRisk[] = [
  {
    id: 'risk-001',
    location: 'Berth B2',
    severity: 'critical',
    description: 'Capacity exceeded — vessel queue forming',
    metricLabel: 'Utilisation',
    metricValue: '91%',
  },
  {
    id: 'risk-002',
    location: 'Berth B5',
    severity: 'high',
    description: 'Approaching capacity limit',
    metricLabel: 'Utilisation',
    metricValue: '81%',
  },
  {
    id: 'risk-003',
    location: 'Anchorage Area',
    severity: 'medium',
    description: 'Vessels waiting above normal threshold',
    metricLabel: 'Waiting vessels',
    metricValue: '12',
  },
];

const MOCK_AI_RECOMMENDATION: AIRecommendation = {
  id: 'rec-001',
  title: 'Congestion risk at Berth B2',
  detail:
    'Berth B2 is operating at 91% utilisation. Based on current vessel traffic patterns, congestion is expected to intensify over the next 6–8 hours. Consider rerouting incoming vessels to Berth B4 (58% utilisation) and activating overflow protocols.',
  severity: 'critical',
  generatedAt: '2024-01-17T09:30:00Z',
  actionLabel: 'Review optimisation',
  actionRoute: '/optimisation',
};

const MOCK_OPERATIONS_SUMMARY: OperationsSummary = {
  arrivalsNext24h: 23,
  departuresNext24h: 19,
  expectedWaitHours: 8.4,
  capacityPct: 87,
  forecastWindowStart: '2024-01-17T10:00:00Z',
};

const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  lastUpdated: new Date().toISOString(),
  portName: 'JNPA / Nhava Sheva',
  systemStatus: 'live',
  kpis: {
    activeVessels: {
      label: 'Active Vessels',
      value: 128,
      change: '+4.2%',
      changeDirection: 'up',
    },
    waitingVessels: {
      label: 'Waiting Vessels',
      value: 17,
      change: '+3',
      changeDirection: 'down',
    },
    berthUtilisation: {
      label: 'Berth Utilisation',
      value: '84%',
      change: '+6.1%',
      changeDirection: 'down',
      severity: 'high',
    },
    congestionRisk: {
      label: 'Congestion Risk',
      value: 'HIGH',
      change: '72% index',
      changeDirection: 'neutral',
      severity: 'high',
    },
  },
  congestionTrend: MOCK_CONGESTION_TREND,
  berthUtilisations: MOCK_BERTH_UTILISATIONS,
  activeRisks: MOCK_ACTIVE_RISKS,
  aiRecommendation: MOCK_AI_RECOMMENDATION,
  operationsSummary: MOCK_OPERATIONS_SUMMARY,
};

// ─── Service API ─────────────────────────────────────────────────────────────

/**
 * Fetches the full dashboard summary.
 * DEMO: Returns simulated data after an artificial delay.
 */
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  await delay(800);

  // Simulate occasional random errors for development testing
  // Uncomment to test error state:
  // if (Math.random() < 0.2) throw new Error('Simulated network error');

  return {
    ...MOCK_DASHBOARD_SUMMARY,
    lastUpdated: new Date().toISOString(),
  };
}
