import { useState } from 'react';
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
    // Generate synthetic data
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
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      {/* Horizontal gridlines */}
      {[25, 50, 75, 100].map(v => (
        <line key={v} x1={padL} y1={yScale(v)} x2={w - padR} y2={yScale(v)}
          stroke="#F0F4F8" strokeWidth="1" />
      ))}
      {/* Risk threshold at 70% */}
      <line x1={padL} y1={yScale(70)} x2={w - padR} y2={yScale(70)}
        stroke="#DC2626" strokeWidth="0.8" strokeDasharray="4,3" opacity="0.4" />

      {/* CI area fill */}
      <path d={ciArea} fill="rgba(22,119,200,0.06)" />
      {/* Berth utilisation line */}
      <path d={buPath} stroke="#C8D5DE" strokeWidth="1.5" fill="none" />
      {/* Congestion index line */}
      <path d={ciPath} stroke="#1677C8" strokeWidth="2" fill="none" />
    </svg>
  );
}

// ─── Berth utilisation list ────────────────────────────────────────────────────
function BerthList({ berths }: { berths: Array<{ id: string; name: string; utilisation: number; status: string; vesselName?: string }> }) {
  const mockBerths = berths.length ? berths : [
    { id: 'B01', name: 'Berth 01 — Pier 400', utilisation: 95, status: 'occupied', vesselName: 'Ever Given' },
    { id: 'B02', name: 'Berth 02 — Pier G', utilisation: 80, status: 'occupied', vesselName: 'Maersk Mc-Kinney' },
    { id: 'B03', name: 'Berth 03 — Pier J', utilisation: 0, status: 'available', vesselName: undefined },
    { id: 'B04', name: 'Berth 04 — Pier T', utilisation: 65, status: 'occupied', vesselName: 'MSC Oscar' },
    { id: 'B05', name: 'Berth 05 — Pier B', utilisation: 100, status: 'occupied', vesselName: 'OOCL HK' },
  ] as typeof berths;

  return (
    <div className="space-y-3">
      {mockBerths.slice(0, 5).map((b) => (
        <div key={b.id} className="flex items-center gap-3">
          <div className="w-8 text-[10px] font-bold text-[#617080] shrink-0">{b.id}</div>
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
function RiskListView({ risks }: { risks: Array<{ port?: string; location?: string; severity: string; description?: string; message?: string; probability?: number }> }) {
  const mockRisks = risks.length ? risks : [
    { port: 'Terminal A — Pier 400', severity: 'critical', description: 'Berth occupancy at 97% — capacity limit imminent', probability: 0.89 },
    { port: 'Anchorage Area', severity: 'high', description: 'Vessel queue growing — 12 vessels waiting', probability: 0.74 },
    { port: 'Gate Operations', severity: 'medium', description: 'Truck congestion at gate — processing delays', probability: 0.52 },
  ];

  const severityColors: Record<string, { bg: string; text: string; border: string }> = {
    critical: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
    high:     { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
    medium:   { bg: '#DCEEFF', text: '#1677C8', border: '#BAD7F8' },
    low:      { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0' },
  };

  return (
    <div className="space-y-2.5">
      {mockRisks.map((r, i) => {
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
function RecommendationView({ recommendation }: { recommendation: { title?: string; summary?: string; actions?: string[] } | null }) {
  const rec = recommendation ?? {
    title: 'Elevated risk — coordinated response recommended',
    summary: 'Vessel queue pressure is building at Terminal A. Based on current trajectory, berth capacity will be breached within 6 hours without intervention.',
    actions: [
      'Shift VSL-204 to Berth B05 — expected wait time reduction: −18 min',
      'Activate anchorage holding for VSL-307 pending B03 clearance',
      'Alert pilot dispatch: +2h stagger recommended for next 3 arrivals',
    ],
  };

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
function OperationsSummary({ summary: _summary }: { summary: Record<string, unknown> | null }) {
  const items = [
    { label: 'Expected arrivals', value: '14', unit: 'vessels', icon: Ship, color: '#1677C8' },
    { label: 'Scheduled departures', value: '11', unit: 'vessels', icon: Anchor, color: '#16A34A' },
    { label: 'Avg. wait forecast', value: '3.8', unit: 'hours', icon: Clock, color: '#D97706' },
    { label: 'Crane availability', value: '8/10', unit: 'cranes', icon: Activity, color: '#145B8C' },
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
              <span className="text-[11px] text-[#617080]">{item.unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main dashboard ────────────────────────────────────────────────────────────
export function Dashboard() {
  const { data, isLoading, isError, refetch, isFetching } = useDashboardSummary();
  const [showDemo, setShowDemo] = useState(true);

  const lastUpdated = data?.lastUpdated ?? new Date().toISOString();

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl fade-in-up">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow mb-1.5">Port Intelligence</div>
          <h1 className="text-2xl font-bold text-[#071A2B] tracking-tight">Command Center</h1>
          <p className="text-sm text-[#617080] mt-1">Los Angeles / Long Beach · Port operational overview</p>
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

      {/* Demo notice */}
      {showDemo && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg border" style={{ background: '#DCEEFF', borderColor: '#BAD7F8' }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1677C8]" />
            <span className="text-[12px] font-bold text-[#1677C8]">TRAINING VIEW</span>
            <span className="text-[12px] text-[#617080]">— Simulated demonstration data. Does not represent live port operations.</span>
          </div>
          <button onClick={() => setShowDemo(false)} className="text-[#617080] hover:text-[#071A2B] text-xs">✕</button>
        </div>
      )}

      {/* ── Risk status banner ── */}
      <div
        className="flex items-center justify-between px-5 py-4 rounded-xl"
        style={{ background: 'linear-gradient(135deg, #FEE2E2, #FFF5F5)', border: '1px solid #FECACA' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full grid place-items-center bg-[#DC2626]/10">
            <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[13px] font-bold text-[#DC2626]">ELEVATED CONGESTION RISK</span>
              <span className="risk-badge risk-badge-critical">HIGH</span>
            </div>
            <p className="text-sm text-[#617080]">
              Terminal A berth utilisation at 95% · 12 vessels waiting · +18% arrival activity projected
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-bold text-[#617080] uppercase tracking-wider mb-1">Congestion Probability</p>
          <p className="text-3xl font-bold text-[#DC2626] tabular-nums">72%</p>
        </div>
      </div>

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
          <div className="h-44">
            <CongestionMiniChart data={(data?.congestionTrend ?? []) as unknown as Array<{ time: string; congestionIndex: number; berthUtilisation: number }>} />
          </div>
        </DCard>

        <DCard title="Berth Status" label="Port Status" className="lg:col-span-2">
          <BerthList berths={[]} />
        </DCard>
      </div>

      {/* ── Risks ── */}
      <DCard title="Active Congestion Risks" label="Risk Intelligence">
        <RiskListView risks={data?.activeRisks ?? []} />
      </DCard>

      {/* ── Recommendation + Operations ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DCard title="IBM Bob Recommendation" label="AI Copilot">
          <RecommendationView recommendation={data?.aiRecommendation as unknown as Record<string, unknown> | null} />
        </DCard>
        <DCard title="Next 24 Hours" label="Operations Outlook">
          <OperationsSummary summary={data?.operationsSummary as unknown as Record<string, unknown> | null} />
        </DCard>
      </div>

      {/* ── Quick navigation ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Port Monitor', sublabel: 'Live vessel & berth view', to: '/monitoring', icon: BarChart3, color: '#1677C8' },
          { label: 'Predictions', sublabel: '72h congestion forecast', to: '/predictions', icon: TrendingUp, color: '#DC2626' },
          { label: 'Optimisation', sublabel: 'Berth & crane solver', to: '/optimisation', icon: Activity, color: '#16A34A' },
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
