// ─── Status / Severity ──────────────────────────────────────────────────────

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type SystemStatus = 'live' | 'delayed' | 'offline';

// ─── KPI Metrics ────────────────────────────────────────────────────────────

export interface KpiMetric {
  /** Display label */
  label: string;
  /** Primary value (number or formatted string) */
  value: string | number;
  /** Change descriptor shown below value, e.g. "+4.2%" */
  change?: string;
  /** Whether the change is positive, negative, or neutral for display */
  changeDirection?: 'up' | 'down' | 'neutral';
  /** Optional unit label, e.g. "%" */
  unit?: string;
  /** Severity colour to apply to the card accent */
  severity?: SeverityLevel;
}

// ─── Congestion Trend ───────────────────────────────────────────────────────

export interface CongestionTrendPoint {
  /** ISO timestamp or label, e.g. "2024-01-15T08:00:00Z" */
  timestamp: string;
  /** Congestion index 0–100 */
  congestionIndex: number;
  /** Number of vessels waiting at anchor */
  waitingVessels: number;
  /** Average berth utilisation 0–100 */
  berthUtilisation: number;
}

// ─── Berth Utilisation ──────────────────────────────────────────────────────

export interface BerthUtilisation {
  /** Berth identifier, e.g. "B1" */
  berthId: string;
  /** Full name, e.g. "Berth 1 – Container Terminal" */
  name: string;
  /** Utilisation percentage 0–100 */
  utilisationPct: number;
  /** Capacity severity based on utilisation */
  severity: SeverityLevel;
  /** Number of vessels currently at berth */
  currentVessels: number;
  /** Maximum vessel capacity */
  maxCapacity: number;
}

// ─── Congestion Risk ────────────────────────────────────────────────────────

export interface CongestionRisk {
  id: string;
  /** Location name, e.g. "Berth B2" */
  location: string;
  severity: SeverityLevel;
  /** Short description of the risk */
  description: string;
  /** Primary metric label */
  metricLabel: string;
  /** Primary metric value as string */
  metricValue: string;
}

// ─── AI Recommendation ──────────────────────────────────────────────────────

export interface AIRecommendation {
  id: string;
  /** Short headline */
  title: string;
  /** Detailed recommendation text */
  detail: string;
  severity: SeverityLevel;
  /** ISO timestamp of when the recommendation was generated */
  generatedAt: string;
  /** Optional action link label */
  actionLabel?: string;
  /** Optional route to navigate on action */
  actionRoute?: string;
}

// ─── Operations Summary ─────────────────────────────────────────────────────

export interface OperationsSummary {
  /** Predicted arrivals in the next 24 hours */
  arrivalsNext24h: number;
  /** Predicted departures in the next 24 hours */
  departuresNext24h: number;
  /** Expected average wait time in hours */
  expectedWaitHours: number;
  /** Predicted port capacity utilisation percentage */
  capacityPct: number;
  /** ISO timestamp for the forecast window start */
  forecastWindowStart: string;
}

// ─── Dashboard Summary ──────────────────────────────────────────────────────

export interface DashboardSummary {
  /** When the data was last refreshed – ISO timestamp */
  lastUpdated: string;
  /** Port display name */
  portName: string;
  systemStatus: SystemStatus;
  kpis: {
    activeVessels: KpiMetric;
    waitingVessels: KpiMetric;
    berthUtilisation: KpiMetric;
    congestionRisk: KpiMetric;
  };
  congestionTrend: CongestionTrendPoint[];
  berthUtilisations: BerthUtilisation[];
  activeRisks: CongestionRisk[];
  aiRecommendation: AIRecommendation;
  operationsSummary: OperationsSummary;
}
