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

export async function fetchDashboardSummary(portId: string = 'port776'): Promise<DashboardSummary> {
  try {
    const res = await fetch(`/api/v1/dashboard/summary?port_id=${portId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    // Normalise backend severity strings throughout the response
    const berthSeverity = normaliseSeverity(data.kpis?.berthUtilisation?.severity);
    const congestionSeverity = normaliseSeverity(data.kpis?.congestionRisk?.severity);

    const normalised: DashboardSummary = {
      lastUpdated: data.lastUpdated ?? new Date().toISOString(),
      portName: data.portName ?? 'JNPA / Nhava Sheva',
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

    // Whenever the API returns zero data, use the fake one and show it
    const mockData = await fetchMockSummary();
    
    if (normalised.berthUtilisations.length === 0) {
      normalised.berthUtilisations = mockData.berthUtilisations;
    }
    
    if (normalised.congestionTrend.length === 0) {
      normalised.congestionTrend = mockData.congestionTrend;
    }
    
    if (normalised.activeRisks.length === 0) {
      normalised.activeRisks = mockData.activeRisks;
    }
    
    if (normalised.kpis.activeVessels.value === 0) {
      normalised.kpis.activeVessels.value = mockData.kpis.activeVessels.value;
    }
    
    if (normalised.kpis.waitingVessels.value === 0) {
      normalised.kpis.waitingVessels.value = mockData.kpis.waitingVessels.value;
    }
    
    if (normalised.kpis.berthUtilisation.value === '0%' || normalised.kpis.berthUtilisation.value === '0') {
      normalised.kpis.berthUtilisation.value = mockData.kpis.berthUtilisation.value;
      normalised.kpis.berthUtilisation.severity = mockData.kpis.berthUtilisation.severity;
    }
    
    if (normalised.operationsSummary.arrivalsNext24h === 0) {
      normalised.operationsSummary.arrivalsNext24h = mockData.operationsSummary.arrivalsNext24h;
      normalised.operationsSummary.departuresNext24h = mockData.operationsSummary.departuresNext24h;
      normalised.operationsSummary.expectedWaitHours = mockData.operationsSummary.expectedWaitHours;
      normalised.operationsSummary.capacityPct = mockData.operationsSummary.capacityPct;
    }

    return normalised;
  } catch (error) {
    console.warn('Backend API unavailable, using fallback data:', error);
    return fetchMockSummary();
  }
}
