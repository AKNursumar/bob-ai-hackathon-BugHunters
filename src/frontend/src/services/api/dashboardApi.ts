/**
 * API service boundary for the dashboard module.
 *
 * Connects to the live FastAPI backend with automatic fallback to mock data.
 * Backend severity levels use 'moderate'; frontend type uses 'medium' — we
 * normalise here so the rest of the UI never sees the discrepancy.
 */
import { fetchDashboardSummary as fetchMockSummary } from '@/services/mock/dashboardService';
import type { DashboardSummary, SeverityLevel, BerthUtilisation } from '@/types';

// ─── Severity normalisation ───────────────────────────────────────────────────

/** Map backend risk strings to the frontend SeverityLevel union. */
function normaliseSeverity(raw: string | undefined): SeverityLevel {
  const lower = (raw ?? '').toLowerCase();
  if (lower === 'critical') return 'critical';
  if (lower === 'high') return 'high';
  // backend uses 'moderate', frontend type uses 'medium'
  if (lower === 'moderate' || lower === 'medium') return 'medium';
  return 'low';
}

// ─── Berth utilisation helper ─────────────────────────────────────────────────

interface BackendBerthUtil {
  berthId: string;
  berthName: string;
  utilisationPercent: number;
  status: string;
  capacity?: number | null;
}

function mapBerthUtilisation(b: BackendBerthUtil): BerthUtilisation {
  let severity: SeverityLevel = 'low';
  if (b.utilisationPercent >= 85) severity = 'critical';
  else if (b.utilisationPercent >= 70) severity = 'high';
  else if (b.utilisationPercent >= 50) severity = 'medium';
  const occupied = b.status !== 'AVAILABLE';
  return {
    berthId: b.berthId,
    name: b.berthName,
    utilisationPct: Math.round(b.utilisationPercent),
    severity,
    currentVessels: occupied ? 1 : 0,
    maxCapacity: 1,
  };
}

// ─── Main fetch ───────────────────────────────────────────────────────────────

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  try {
    const res = await fetch('/api/v1/dashboard/summary');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    // Normalise backend severity strings throughout the response
    const berthSeverity = normaliseSeverity(data.kpis?.berthUtilisation?.severity);
    const congestionSeverity = normaliseSeverity(data.kpis?.congestionRisk?.severity);

    const normalised: DashboardSummary = {
      lastUpdated: data.lastUpdated ?? new Date().toISOString(),
      portName: data.portName ?? 'Los Angeles-Long Beach',
      systemStatus: data.systemStatus ?? 'live',
      kpis: {
        activeVessels: {
          label: data.kpis?.activeVessels?.label ?? 'Monthly Vessel Arrivals',
          value: data.kpis?.activeVessels?.value ?? 0,
        },
        waitingVessels: {
          label: data.kpis?.waitingVessels?.label ?? 'Vessels at Anchor',
          value: data.kpis?.waitingVessels?.value ?? 0,
        },
        berthUtilisation: {
          label: data.kpis?.berthUtilisation?.label ?? 'Berth Utilisation',
          value: data.kpis?.berthUtilisation?.value ?? '—',
          unit: '%',
          severity: berthSeverity,
        },
        congestionRisk: {
          label: data.kpis?.congestionRisk?.label ?? 'Congestion Risk',
          value: (data.kpis?.congestionRisk?.value ?? 'UNKNOWN').toUpperCase(),
          change: data.kpis?.congestionRisk?.change,
          severity: congestionSeverity,
        },
      },
      congestionTrend: Array.isArray(data.congestionTrend) ? data.congestionTrend : [],
      // Map backend berthUtilisations rows (populated from list_berths in dashboard.py)
      berthUtilisations: Array.isArray(data.berthUtilisations) && data.berthUtilisations.length > 0
        ? (data.berthUtilisations as BackendBerthUtil[]).map(mapBerthUtilisation)
        : [],
      activeRisks: (data.activeRisks ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        location: r.location as string,
        severity: normaliseSeverity(r.severity as string),
        description: r.description as string,
        metricLabel: r.metricLabel as string,
        metricValue: r.metricValue as string,
      })),
      aiRecommendation: {
        id: data.aiRecommendation?.id ?? 'ai-rec',
        title: data.aiRecommendation?.title ?? 'Review operations',
        detail: data.aiRecommendation?.detail ?? '',
        severity: normaliseSeverity(data.aiRecommendation?.severity),
        generatedAt: data.aiRecommendation?.generatedAt ?? new Date().toISOString(),
      },
      operationsSummary: {
        arrivalsNext24h: data.operationsSummary?.arrivalsNext24h ?? 0,
        departuresNext24h: data.operationsSummary?.departuresNext24h ?? 0,
        expectedWaitHours: data.operationsSummary?.expectedWaitHours ?? 0,
        capacityPct: data.operationsSummary?.capacityPct ?? 0,
        forecastWindowStart:
          data.operationsSummary?.forecastWindowStart ?? new Date().toISOString(),
      },
    };

    // Fall back to mock berth utilisation rows if backend didn't populate them
    if (normalised.berthUtilisations.length === 0) {
      const mockData = await fetchMockSummary();
      normalised.berthUtilisations = mockData.berthUtilisations;
    }

    return normalised;
  } catch (error) {
    console.warn('Backend API unavailable, using fallback data:', error);
    return fetchMockSummary();
  }
}
