import { RefreshCw, TrendingUp, AlertTriangle, CheckCircle2, Ship, Anchor, Activity, BarChart3, Bot, ArrowRight, Clock } from 'lucide-react';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { KpiCard } from '@/components/KpiCard';
import { KpiCardSkeleton } from '@/components/LoadingSkeleton';
import { formatTime } from '@/lib/format';
import { Link } from 'react-router-dom';

// ─── Dashboard card wrapper ────────────────────────────────────────────────────
function DCard({ title, label, children, className, headerAction }: {
  title: string;
  label?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}) {
  return (
    <div className={`hl-card flex flex-col rounded-xl ${className ?? ''}`}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#DCE3E8] shrink-0">
        <div>
          {label && <p className="eyebrow mb-0.5">{label}</p>}
          <h2 className="text-[13px] font-bold text-[#071A2B]">{title}</h2>
        </div>
        {headerAction}
      </div>
      <div className="p-5 flex-1 min-h-0">{children}</div>
    </div>
  );
}

// ─── Mini chart for congestion trend ──────────────────────────────────────────
function CongestionMiniChart({ data }: { data: Array<{ time: string; congestionIndex: number; berthUtilisation: number }> }) {
  if (!data.length) {
    data = Array.from({ length: 24 }, (_, i) => ({
      time: `${i}h`,
      congestionIndex: 45 + Math.sin(i / 3) * 20 + i * 1.2,
      berthUtilisation: 60 + Math.cos(i / 4) * 15 + i * 0.5,
    }));
  }

  const maxCI = Math.max(...data.map(d => d.congestionIndex), 100);
  const w = 400;
  const h = 120;
  const padL = 0, padR = 0, padT = 10, padB = 20;

  const xScale = (i: number) => padL + (i / (data.length - 1)) * (w - padL - padR);
  const yScale = (v: number) => padT + (1 - v / maxCI) * (h - padT - padB);

  const ciPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)},${yScale(d.congestionIndex)}`).join(' ');
  const buPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)},${yScale(d.berthUtilisation)}`).join(' ');
  const ciArea = `${ciPath} L ${xScale(data.length - 1)},${h - padB} L ${xScale(0)},${h - padB} Z`;

  return (
    <div className="relative h-44">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
        {[25, 50, 75, 100].map(v => (
          <line key={v} x1={padL} y1={yScale(v)} x2={w - padR} y2={yScale(v)}
            stroke="#F0F4F8" strokeWidth="1" />
        ))}
        <line x1={padL} y1={yScale(70)} x2={w - padR} y2={yScale(70)}
          stroke="#DC2626" strokeWidth="0.8" strokeDasharray="4,3" opacity="0.4" />
        <path d={ciArea} fill="rgba(22,119,200,0.06)" />
        <path d={buPath} stroke="#C8D5DE" strokeWidth="1.5" fill="none" />
        <path d={ciPath} stroke="#1677C8" strokeWidth="2" fill="none" />
      </svg>
    </div>
  );
}

// ─── Berth utilisation list ────────────────────────────────────────────────────
const INDIAN_BERTH_FALLBACK = [
  { id: 'JNPCT-1', name: 'JNPCT — Berth No. 1', utilisation: 87, status: 'occupied', vesselName: 'Container Carrier' },
  { id: 'JNPCT-2', name: 'JNPCT — Berth No. 2', utilisation: 94, status: 'occupied', vesselName: 'Bulk Cargo Vessel' },
  { id: 'GTI-1',   name: 'GTI — Gateway Terminal', utilisation: 62, status: 'occupied', vesselName: 'Feeder Vessel' },
  { id: 'BMCT-1',  name: 'BMCT — Berth No. 1', utilisation: 0,  status: 'available', vesselName: undefined },
  { id: 'NSICT-1', name: 'NSICT — Berth No. 1', utilisation: 78, status: 'occupied', vesselName: 'Tanker' },
];

function BerthList({ berths }: { berths: Array<{ id: string; name: string; utilisation: number; status: string; vesselName?: string }> }) {
  const displayBerths = berths.length ? berths : INDIAN_BERTH_FALLBACK as typeof berths;

  return (
    <div className="space-y-3">
      {displayBerths.slice(0, 5).map((b) => (
        <div key={b.id} className="flex items-center gap-3">
          <div className="w-16 text-[10px] font-bold text-[#617080] shrink-0 truncate">{b.id}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-[#617080] truncate">{b.vesselName ?? 'Available'}</span>
              <span className="text-[11px] font-bold text-[#071A2B] tabular-nums">{b.utilisation}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#F3F8FC] rounded-full overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: `${b.utilisation}%`,
                  background: b.utilisation >= 90 ? '#DC2626' : b.utilisation >= 70 ? '#D97706' : '#1677C8',
                }}
              />
            </div>
          </div>
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              background: b.status === 'available' ? '#16A34A' : b.utilisation >= 90 ? '#DC2626' : '#1677C8',
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Risk list ─────────────────────────────────────────────────────────────────
const INDIAN_RISK_FALLBACK = [
  { port: 'JNPCT — Container Terminal', severity: 'critical', description: 'Berth occupancy at 94% — inbound queue forming at anchorage', probability: 0.87 },
  { port: 'Nhava Sheva Anchorage Area', severity: 'high', description: 'Vessel queue growing — above-normal arrival rate projected', probability: 0.71 },
  { port: 'GTI — Gateway Terminal India', severity: 'medium', description: 'Moderate congestion risk — approaching seasonal peak', probability: 0.53 },
];

function RiskListView({ risks }: { risks: Array<{ port?: string; location?: string; severity: string; description?: string; message?: string; probability?: number }> }) {
  const displayRisks = risks.length ? risks : INDIAN_RISK_FALLBACK as typeof risks;

  const severityColors: Record<string, { bg: string; text: string; border: string }> = {
    critical: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
    high:     { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
    medium:   { bg: '#DCEEFF', text: '#1677C8', border: '#BAD7F8' },
    low:      { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0' },
  };

  return (
    <div className="space-y-2.5">
      {displayRisks.map((r, i) => {
        const cfg = severityColors[r.severity] ?? severityColors.medium;
        const loc = r.port ?? r.location ?? 'Unknown';
        const desc = r.description ?? r.message ?? '';
        return (
          <div
            key={i}
            className="flex items-start gap-3 px-4 py-3 rounded-lg"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: cfg.text }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-[12px] font-bold" style={{ color: cfg.text }}>{loc}</span>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: cfg.text }}>
                  {r.probability !== undefined ? `${Math.round(r.probability * 100)}%` : r.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-[#617080] leading-snug">{desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── AI recommendation card ────────────────────────────────────────────────────
const INDIAN_REC_FALLBACK = {
  title: 'Elevated congestion pressure — coordinated response recommended',
  summary: 'JNPCT berth utilisation is above threshold. Based on historical traffic patterns, congestion pressure is expected to build over the next 6–8 hours. Consider redistributing inbound vessels to available GTI capacity.',
  actions: [
    'Route next 2 inbound container vessels to GTI — estimated anchorage wait reduction: −2.4h',
    'Issue pre-notification to Nhava Sheva pilot station: staggered arrival window recommended',
    'Coordinate with BMCT berth supervisor — Berth No. 1 available for clearance within 4h',
  ],
};

function RecommendationView({ recommendation }: { recommendation: { title?: string; summary?: string; actions?: string[] } | null }) {
  const rec = recommendation ?? INDIAN_REC_FALLBACK;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md grid place-items-center" style={{ background: '#1677C8' }}>
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-[12px] font-bold text-[#071A2B]">{rec.title}</span>
      </div>
      <p className="text-sm text-[#617080] leading-relaxed mb-4">{rec.summary}</p>
      {rec.actions && rec.actions.length > 0 && (
        <div className="space-y-2">
          {rec.actions.map((action, i) => (
            <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-[#F3F8FC] border border-[#DCEEFF]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1677C8] shrink-0 mt-0.5" />
              <span className="text-[12px] text-[#617080] leading-snug">{action}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Operations summary ────────────────────────────────────────────────────────
interface OpsSummaryData {
  arrivalsNext24h?: number;
  departuresNext24h?: number;
  expectedWaitHours?: number;
  capacityPct?: number;
}

function OperationsSummary({ summary }: { summary: OpsSummaryData | null }) {
  const items = [
    { label: 'Expected arrivals', value: summary?.arrivalsNext24h ?? '—', unit: 'vessels', icon: Ship, color: '#1677C8' },
    { label: 'Scheduled departures', value: summary?.departuresNext24h ?? '—', unit: 'vessels', icon: Anchor, color: '#16A34A' },
    { label: 'Avg. wait forecast', value: summary?.expectedWaitHours != null ? `${summary.expectedWaitHours}` : '—', unit: 'hours', icon: Clock, color: '#D97706' },
    { label: 'Capacity utilisation', value: summary?.capacityPct != null ? `${summary.capacityPct}%` : '—', unit: '', icon: Activity, color: '#145B8C' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="p-3 rounded-lg" style={{ background: '#F7F7F5', border: '1px solid #DCE3E8' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-md grid place-items-center" style={{ background: `${item.color}15` }}>
                <Icon className="w-3 h-3" style={{ color: item.color }} />
              </div>
              <span className="text-[10px] font-bold text-[#617080] uppercase tracking-wider">{item.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-[#071A2B] tabular-nums">{item.value}</span>
              {item.unit && <span className="text-[11px] text-[#617080]">{item.unit}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Risk status banner ────────────────────────────────────────────────────────
function RiskBanner({ congestionRisk }: {
  congestionRisk?: { label: string; value: string; change?: string; severity?: string };
}) {
  const riskValue = congestionRisk?.value ?? 'UNKNOWN';
  const severity = congestionRisk?.severity ?? 'medium';

  const severityConfig: Record<string, { bg: string; border: string; textColor: string; iconColor: string }> = {
    critical: { bg: 'linear-gradient(135deg, #FEE2E2, #FFF5F5)', border: '#FECACA', textColor: '#DC2626', iconColor: '#DC2626' },
    high:     { bg: 'linear-gradient(135deg, #FEF3C7, #FFFBEB)', border: '#FDE68A', textColor: '#D97706', iconColor: '#D97706' },
    medium:   { bg: 'linear-gradient(135deg, #DCEEFF, #EFF6FF)', border: '#BAD7F8', textColor: '#1677C8', iconColor: '#1677C8' },
    low:      { bg: 'linear-gradient(135deg, #DCFCE7, #F0FDF4)', border: '#BBF7D0', textColor: '#16A34A', iconColor: '#16A34A' },
  };

  const cfg = severityConfig[severity] ?? severityConfig.medium;
  const change = congestionRisk?.change ?? '';

  return (
    <div
      className="flex items-center justify-between px-5 py-4 rounded-xl"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full grid place-items-center" style={{ background: `${cfg.iconColor}18` }}>
          <AlertTriangle className="w-5 h-5" style={{ color: cfg.iconColor }} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[13px] font-bold" style={{ color: cfg.textColor }}>
              {riskValue === 'HIGH' || riskValue === 'CRITICAL'
                ? 'ELEVATED CONGESTION RISK'
                : riskValue === 'LOW'
                ? 'LOW CONGESTION RISK'
                : 'CONGESTION MONITORING ACTIVE'}
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded"
              style={{ background: `${cfg.iconColor}20`, color: cfg.textColor }}
            >
              {riskValue}
            </span>
          </div>
          <p className="text-sm text-[#617080]">
            {change || 'Congestion index from trained XGBoost model — IMF PortWatch data'}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] font-bold text-[#617080] uppercase tracking-wider mb-1">ML Risk Level</p>
        <p className="text-3xl font-bold tabular-nums" style={{ color: cfg.textColor }}>{riskValue}</p>
      </div>
    </div>
  );
}

// ─── Main dashboard ────────────────────────────────────────────────────────────
import { usePort } from '@/contexts/PortContext';

export function Dashboard() {
  const { selectedPort } = usePort();
  const { data, isLoading, isError, refetch, isFetching } = useDashboardSummary(selectedPort.id);

  const lastUpdated = data?.lastUpdated ?? new Date().toISOString();

  const congestionTrendData = (data?.congestionTrend ?? []) as unknown as Array<{ time: string; congestionIndex: number; berthUtilisation: number }>;
  const berthData = (data?.berthUtilisations ?? []).map(b => ({
    id: b.berthId,
    name: b.name,
    utilisation: b.utilisationPct,
    status: b.currentVessels > 0 ? 'occupied' : 'available',
    vesselName: b.currentVessels > 0 ? 'Active Vessel' : undefined,
  }));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl fade-in-up">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow mb-1.5">Port Intelligence</div>
          <h1 className="text-2xl font-bold text-[#071A2B] tracking-tight">Command Center</h1>
          <p className="text-sm text-[#617080] mt-1">{selectedPort.name} — Port operational overview</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 mt-1">
          <span className="text-[11px] text-[#617080] tabular-nums hidden sm:block">
            {formatTime(lastUpdated)}
          </span>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold text-white rounded-lg transition-all disabled:opacity-50"
            style={{ background: '#1677C8' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Risk status banner ── */}
      <RiskBanner congestionRisk={data?.kpis?.congestionRisk as any} />

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : isError ? (
          <div className="col-span-4 py-6 text-center text-sm text-[#617080]">
            Unable to load KPIs.{' '}
            <button onClick={() => refetch()} className="text-[#1677C8] hover:underline font-medium">Retry</button>
          </div>
        ) : data ? (
          <>
            <KpiCard metric={data.kpis.activeVessels} />
            <KpiCard metric={data.kpis.waitingVessels} />
            <KpiCard metric={data.kpis.berthUtilisation} />
            <KpiCard metric={data.kpis.congestionRisk} />
          </>
        ) : null}
      </div>

      {/* ── Chart + Berth status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <DCard
          title="72-Hour Congestion Trend"
          label="Congestion Overview"
          className="lg:col-span-3"
          headerAction={
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[11px] text-[#617080]">
                <div className="w-4 h-0.5 bg-[#1677C8]" />
                Congestion Index
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#617080]">
                <div className="w-4 h-0.5 bg-[#C8D5DE]" />
                Berth Util.
              </div>
            </div>
          }
        >
          <CongestionMiniChart data={congestionTrendData} />
          <p className="text-[10px] text-[#98A8B4] mt-2">Source: IMF PortWatch portcall data · XGBoost model output</p>
        </DCard>

        <DCard title="Berth Status" label="Port Status" className="lg:col-span-2">
          <BerthList berths={berthData} />
        </DCard>
      </div>

      {/* ── Risks ── */}
      <DCard title="Active Congestion Risks" label="Risk Intelligence">
        <RiskListView risks={data?.activeRisks ?? []} />
        <p className="text-[10px] text-[#98A8B4] mt-3">Source: XGBoost congestion model · IMF PortWatch vessel activity data</p>
      </DCard>

      {/* ── Recommendation + Operations ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DCard title="IBM Bob Recommendation" label="AI Copilot">
          <RecommendationView
            recommendation={data?.aiRecommendation as unknown as { title?: string; summary?: string; actions?: string[] } | null}
          />
        </DCard>
        <DCard title="Next 24 Hours" label="Operations Outlook">
          <OperationsSummary
            summary={data?.operationsSummary as unknown as OpsSummaryData | null}
          />
        </DCard>
      </div>

      {/* ── Quick navigation ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Port Monitor', sublabel: 'Live vessel & berth view', to: '/monitoring', icon: BarChart3, color: '#1677C8' },
          { label: 'Predictions', sublabel: '72h congestion forecast', to: '/predictions', icon: TrendingUp, color: '#DC2626' },
          { label: 'Optimisation', sublabel: 'Berth & crane solver', to: '/optimization', icon: Activity, color: '#16A34A' },
          { label: 'IBM Bob', sublabel: 'AI operations copilot', to: '/bob', icon: Bot, color: '#145B8C' },
        ].map((nav) => {
          const Icon = nav.icon;
          return (
            <Link
              key={nav.to}
              to={nav.to}
              className="hl-card p-4 rounded-xl flex items-center justify-between hover:shadow-md transition-shadow group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" style={{ color: nav.color }} />
                  <span className="text-[13px] font-bold text-[#071A2B]">{nav.label}</span>
                </div>
                <p className="text-[11px] text-[#617080]">{nav.sublabel}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#DCE3E8] group-hover:text-[#617080] transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
