import { Link } from 'react-router-dom';
import {
  Anchor,
  ArrowRight,
  TrendingUp,
  Layers,
  Calendar,
  ChevronRight,
  Bot,
  BarChart3,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Ship,
  Radio,
  FlaskConical,
} from 'lucide-react';

// ─── Harborline brand nav ──────────────────────────────────────────────────────

function HeroNav() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-5">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 grid place-items-center rounded-lg"
          style={{ background: 'linear-gradient(135deg, #1677C8, #145B8C)' }}>
          <Anchor className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">
          Harbor<span className="text-[#4CA3E3]">line</span>
        </span>
      </div>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-6">
        {['Overview', 'Monitor', 'Predictions', 'Planning', 'Analytics'].map((item) => (
          <a key={item} href="#" className="text-[13px] text-white/70 hover:text-white transition-colors font-medium">
            {item}
          </a>
        ))}
      </div>

      {/* CTA */}
      <Link
        to="/"
        className="hidden md:flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white rounded-lg transition-all"
        style={{ background: 'rgba(22, 119, 200, 0.85)', border: '1px solid rgba(22, 119, 200, 0.5)' }}
      >
        Launch Platform
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </nav>
  );
}

// ─── Floating cards ────────────────────────────────────────────────────────────

function FloatingCongestionCard() {
  return (
    <div className="hl-card-glass w-52 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[9px] font-bold text-[#617080] uppercase tracking-wider">Congestion Risk</p>
          <p className="text-[11px] font-bold text-[#071A2B] mt-0.5">Mundra Port</p>
        </div>
        <span className="risk-badge risk-badge-high">HIGH</span>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-bold text-[#DC2626] tabular-nums">72%</span>
        <span className="text-xs text-[#617080]">probability</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-[#617080]">
        <TrendingUp className="w-3 h-3 text-[#DC2626]" />
        <span>+18% expected vessel activity / 24h</span>
      </div>
    </div>
  );
}

function FloatingActivityCard() {
  return (
    <div className="hl-card-glass w-44 p-3.5">
      <p className="text-[9px] font-bold text-[#617080] uppercase tracking-wider mb-2">Port Activity · Today</p>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-bold text-[#071A2B] tabular-nums">1,284</span>
      </div>
      <p className="text-[11px] text-[#617080]">vessel movements</p>
      <div className="mt-3 flex gap-1">
        {[40, 60, 45, 75, 55, 80, 65, 90, 70, 85].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${h * 0.28}px`,
              background: i >= 7 ? '#1677C8' : '#DCE3E8',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function FloatingMapCard() {
  return (
    <div className="hl-card-glass w-48 overflow-hidden">
      <div className="px-3 py-2.5 border-b border-[#DCE3E8]/50">
        <p className="text-[9px] font-bold text-[#617080] uppercase tracking-wider">Live Port Map</p>
      </div>
      {/* SVG mini-map */}
      <div className="p-2" style={{ background: '#EEF5FB' }}>
        <svg viewBox="0 0 190 90" className="w-full">
          {/* Water */}
          <rect width="190" height="90" fill="#DCEEFF" rx="4" />
          {/* Berth outline */}
          <rect x="10" y="30" width="80" height="40" fill="#F3F8FC" stroke="#C8D5DE" strokeWidth="1" rx="2" />
          <rect x="100" y="20" width="80" height="55" fill="#F3F8FC" stroke="#C8D5DE" strokeWidth="1" rx="2" />
          {/* Berth labels */}
          <text x="50" y="53" textAnchor="middle" fontSize="7" fill="#617080" fontWeight="600">TERMINAL A</text>
          <text x="140" y="50" textAnchor="middle" fontSize="7" fill="#617080" fontWeight="600">TERMINAL B</text>
          {/* Vessels */}
          <rect x="15" y="34" width="24" height="10" fill="#1677C8" rx="2" opacity="0.8" />
          <rect x="44" y="34" width="24" height="10" fill="#1677C8" rx="2" opacity="0.8" />
          <rect x="105" y="24" width="22" height="10" fill="#1677C8" rx="2" opacity="0.6" />
          <rect x="132" y="24" width="22" height="10" fill="#DC2626" rx="2" opacity="0.8" />
          <rect x="105" y="52" width="22" height="10" fill="#1677C8" rx="2" opacity="0.8" />
          {/* Route lines */}
          <line x1="0" y1="45" x2="15" y2="39" stroke="#1677C8" strokeWidth="0.8" strokeDasharray="3,2" opacity="0.5" />
          <line x1="0" y1="55" x2="15" y2="57" stroke="#1677C8" strokeWidth="0.8" strokeDasharray="3,2" opacity="0.3" />
          {/* Risk dot */}
          <circle cx="143" cy="29" r="4" fill="#DC2626" opacity="0.9" />
          <circle cx="143" cy="29" r="7" fill="none" stroke="#DC2626" strokeWidth="0.5" opacity="0.4" />
        </svg>
      </div>
    </div>
  );
}

// ─── Problem section stats ─────────────────────────────────────────────────────

function StatCard({ value, label, source }: { value: string; label: string; source: string }) {
  return (
    <div className="p-6 border-b border-[#DCE3E8] last:border-0 md:border-b-0 md:border-r md:last:border-0">
      <div className="text-4xl font-bold text-[#071A2B] tracking-tight mb-2">{value}</div>
      <p className="text-sm text-[#617080] leading-relaxed mb-3">{label}</p>
      <p className="text-[10px] font-semibold text-[#98A8B4] uppercase tracking-wider">{source}</p>
    </div>
  );
}

// ─── Feature cards ─────────────────────────────────────────────────────────────

function FeatureCard({
  number,
  title,
  tagline,
  description,
  icon: Icon,
  visual,
  accent,
}: {
  number: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  visual: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="hl-card rounded-xl overflow-hidden flex flex-col">
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-lg grid place-items-center" style={{ background: `${accent}15` }}>
            <Icon className="w-5 h-5" style={{ color: accent }} />
          </div>
          <span className="text-[11px] font-bold text-[#98A8B4] tracking-widest">{number}</span>
        </div>
        <h3 className="text-xl font-bold text-[#071A2B] tracking-tight mb-1">{title}</h3>
        <p className="text-[13px] font-semibold mb-3" style={{ color: accent }}>{tagline}</p>
        <p className="text-sm text-[#617080] leading-relaxed">{description}</p>
      </div>
      <div className="border-t border-[#DCE3E8] bg-[#F7F7F5] p-4">
        {visual}
      </div>
    </div>
  );
}

// ─── Mini chart for Monitor feature ───────────────────────────────────────────

function MonitorVisual() {
  const vessels = [
    { id: 'VSL-101', status: 'AT BERTH', risk: 'low', eta: 'Departed 08:20' },
    { id: 'VSL-204', status: 'WAITING', risk: 'high', eta: 'ETA 14:30' },
    { id: 'VSL-307', status: 'INBOUND', risk: 'medium', eta: 'ETA 16:45' },
    { id: 'VSL-412', status: 'AT BERTH', risk: 'low', eta: 'B04 · Crane 3' },
  ];
  return (
    <div className="space-y-1.5">
      {vessels.map((v) => (
        <div key={v.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white border border-[#DCE3E8]">
          <Ship className="w-3 h-3 text-[#617080] shrink-0" />
          <span className="text-[11px] font-bold text-[#071A2B] w-14">{v.id}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-1 ${
            v.risk === 'high' ? 'text-[#DC2626] bg-[#FEE2E2]' :
            v.risk === 'medium' ? 'text-[#D97706] bg-[#FEF3C7]' :
            'text-[#16A34A] bg-[#DCFCE7]'
          }`}>{v.status}</span>
          <span className="text-[10px] text-[#617080] whitespace-nowrap">{v.eta}</span>
        </div>
      ))}
    </div>
  );
}

function PredictVisual() {
  const bars = [
    { h: 48, label: 'Now', color: '#617080' },
    { h: 58, label: '+12h', color: '#617080' },
    { h: 72, label: '+24h', color: '#D97706' },
    { h: 82, label: '+48h', color: '#DC2626' },
    { h: 75, label: '+72h', color: '#DC2626' },
  ];
  return (
    <div>
      <div className="flex items-end gap-2 h-20 mb-2">
        {bars.map((b, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t-sm" style={{ height: `${b.h}%`, background: b.color, opacity: 0.8 }} />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {bars.map((b, i) => (
          <div key={i} className="flex-1 text-center text-[9px] font-bold text-[#617080]">{b.label}</div>
        ))}
      </div>
    </div>
  );
}

function OptimiseVisual() {
  return (
    <div className="space-y-2">
      {[
        { berth: 'B01', vessel: 'VSL-101', pct: 100, color: '#1677C8' },
        { berth: 'B02', vessel: 'VSL-204', pct: 75, color: '#1677C8' },
        { berth: 'B03', vessel: '—', pct: 0, color: '#DCE3E8' },
        { berth: 'B04', vessel: 'VSL-412', pct: 60, color: '#16A34A' },
      ].map((row) => (
        <div key={row.berth} className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-[#617080] w-6">{row.berth}</span>
          <div className="flex-1 bg-[#DCE3E8] rounded-full h-2">
            <div className="h-2 rounded-full transition-all" style={{ width: `${row.pct}%`, background: row.color }} />
          </div>
          <span className="text-[10px] text-[#617080] w-12 text-right">{row.vessel}</span>
        </div>
      ))}
    </div>
  );
}

function PlanVisual() {
  const hours = ['NOW', '+12H', '+24H', '+48H', '+72H'];
  return (
    <div>
      <div className="flex gap-0 mb-1">
        {hours.map((h) => (
          <div key={h} className="flex-1 text-[9px] font-bold text-[#98A8B4] text-center">{h}</div>
        ))}
      </div>
      {['Vessels', 'Berths', 'Cranes'].map((row) => (
        <div key={row} className="flex items-center gap-1 mb-1.5">
          <span className="text-[10px] text-[#617080] w-10 shrink-0">{row}</span>
          <div className="flex-1 flex gap-0.5 h-5">
            {[0.6, 0.8, 0.4, 0.9, 0.7].map((w, i) => (
              <div
                key={i}
                className="rounded-sm"
                style={{
                  flex: w,
                  background: row === 'Vessels' ? '#1677C8' : row === 'Berths' ? '#145B8C' : '#DCEEFF',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Architecture diagram ──────────────────────────────────────────────────────

function ArchLayer({
  label,
  sublabel,
  items,
  color,
}: {
  label: string;
  sublabel: string;
  items: string[];
  color: string;
}) {
  return (
    <div className="flex-1">
      <div className="text-center mb-4">
        <div
          className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-1"
          style={{ background: `${color}15`, color }}
        >
          {label}
        </div>
        <p className="text-xs text-[#617080]">{sublabel}</p>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item}
            className="px-3 py-2 rounded-lg text-[11px] font-medium text-center"
            style={{
              background: `${color}08`,
              border: `1px solid ${color}20`,
              color: '#617080',
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Product dashboard mockup ──────────────────────────────────────────────────

function DashboardMockup() {
  return (
    <div className="hl-card rounded-xl overflow-hidden shadow-2xl" style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* Topbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#DCE3E8]" style={{ background: '#071A2B' }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded grid place-items-center" style={{ background: '#1677C8' }}>
            <Anchor className="w-3 h-3 text-white" />
          </div>
          <span className="text-[12px] font-bold text-white">Harborline</span>
          <span className="mx-2 text-white/20">/</span>
          <span className="text-[12px] text-white/60">Mundra Port</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-[#16A34A]">● LIVE</span>
          <span className="text-[10px] text-white/40">09:42:18</span>
        </div>
      </div>

      <div className="p-5" style={{ background: '#F7F7F5' }}>
        {/* Risk banner */}
        <div className="flex items-center justify-between p-4 rounded-lg mb-4" style={{ background: '#FEE2E2', border: '1px solid #FECACA' }}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
            <div>
              <p className="text-sm font-bold text-[#DC2626]">HIGH CONGESTION RISK · MUNDRA PORT</p>
              <p className="text-xs text-[#B91C1C] mt-0.5">72% probability over next 24 hours · +18% vessel arrivals projected</p>
            </div>
          </div>
          <span className="risk-badge risk-badge-critical">72%</span>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Active Vessels', value: '47', change: '+8', up: true },
            { label: 'Waiting', value: '12', change: '+4', up: true, warn: true },
            { label: 'Berth Util.', value: '84%', change: '+12%', up: true },
            { label: 'Avg. Wait', value: '3.2h', change: '+1.1h', up: true, warn: true },
          ].map((kpi) => (
            <div key={kpi.label} className="hl-card-flat px-4 py-3">
              <p className="text-[9px] font-bold text-[#617080] uppercase tracking-wider mb-1">{kpi.label}</p>
              <p className="text-xl font-bold text-[#071A2B] tabular-nums">{kpi.value}</p>
              <p className={`text-[10px] font-semibold ${kpi.warn ? 'text-[#D97706]' : 'text-[#16A34A]'}`}>
                {kpi.up ? '↑' : '↓'} {kpi.change}
              </p>
            </div>
          ))}
        </div>

        {/* Chart + map row */}
        <div className="grid grid-cols-5 gap-3">
          {/* Forecast chart */}
          <div className="col-span-3 hl-card-flat p-4">
            <p className="text-[10px] font-bold text-[#617080] uppercase tracking-wider mb-3">72-Hour Forecast</p>
            <svg viewBox="0 0 340 80" className="w-full">
              {/* Confidence band */}
              <path d="M 0,60 L 57,55 L 114,44 L 171,30 L 228,26 L 285,28 L 340,22 L 340,40 L 285,46 L 228,46 L 171,55 L 114,64 L 57,72 L 0,76 Z" fill="rgba(22,119,200,0.08)" />
              {/* Historical line */}
              <path d="M 0,65 L 57,60 L 114,52 L 171,42" stroke="#C8D5DE" strokeWidth="1.5" fill="none" />
              {/* Forecast line */}
              <path d="M 171,42 L 228,36 L 285,37 L 340,31" stroke="#1677C8" strokeWidth="2" fill="none" strokeDasharray="5,3" />
              {/* Risk threshold */}
              <line x1="0" y1="30" x2="340" y2="30" stroke="#DC2626" strokeWidth="0.8" strokeDasharray="4,3" opacity="0.5" />
              <text x="345" y="32" fontSize="7" fill="#DC2626" opacity="0.7">HIGH</text>
              {/* X axis labels */}
              {['Now', '+12h', '+24h', '+48h', '+72h'].map((l, i) => (
                <text key={l} x={i * 85} y="92" fontSize="7" fill="#98A8B4" textAnchor={i === 0 ? 'start' : 'middle'}>{l}</text>
              ))}
            </svg>
          </div>
          {/* Berth status */}
          <div className="col-span-2 hl-card-flat p-4">
            <p className="text-[10px] font-bold text-[#617080] uppercase tracking-wider mb-3">Berth Status</p>
            <div className="space-y-2">
              {[
                { id: 'B01', pct: 100, vessel: 'VSL-101', status: 'occupied' },
                { id: 'B02', pct: 100, vessel: 'VSL-204', status: 'occupied' },
                { id: 'B03', pct: 0, vessel: '—', status: 'available' },
                { id: 'B04', pct: 75, vessel: 'VSL-412', status: 'occupied' },
                { id: 'B05', pct: 100, vessel: 'VSL-318', status: 'occupied' },
              ].map((berth) => (
                <div key={berth.id} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#071A2B] w-7">{berth.id}</span>
                  <div className="flex-1 bg-[#F3F8FC] rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${berth.pct}%`,
                        background: berth.status === 'available' ? '#DCE3E8' : '#1677C8',
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-[#617080] w-12 text-right font-medium">{berth.vessel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Simulation preview ────────────────────────────────────────────────────────

function SimulationPreview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
      {/* Controls */}
      <div className="hl-card p-5 rounded-xl">
        <p className="eyebrow mb-4">Scenario Parameters</p>
        <div className="space-y-4">
          {[
            { label: 'VSL-204 ETA', value: '+2h', color: '#D97706' },
            { label: 'Crane Availability', value: '−1', color: '#DC2626' },
            { label: 'Berth', value: 'B04 → B06', color: '#1677C8' },
            { label: 'Schedule', value: 'Delayed', color: '#D97706' },
          ].map((param) => (
            <div key={param.label} className="flex items-center justify-between">
              <span className="text-sm text-[#617080]">{param.label}</span>
              <span className="text-sm font-bold px-2.5 py-1 rounded-md" style={{ color: param.color, background: `${param.color}12` }}>
                {param.value}
              </span>
            </div>
          ))}
        </div>
        <button className="mt-5 w-full py-2.5 rounded-lg text-[13px] font-bold text-white transition-colors" style={{ background: '#071A2B' }}>
          Run Simulation
        </button>
      </div>

      {/* Results */}
      <div className="space-y-3">
        <div className="hl-card p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#DC2626]" />
            <span className="text-[11px] font-bold text-[#617080] uppercase tracking-wider">Current Plan</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div><p className="text-xl font-bold text-[#071A2B]">3.8h</p><p className="text-[10px] text-[#617080]">Avg Wait</p></div>
            <div><p className="text-xl font-bold text-[#071A2B]">78%</p><p className="text-[10px] text-[#617080]">Utilisation</p></div>
          </div>
        </div>
        <div className="hl-card p-4 rounded-xl" style={{ borderTop: '2px solid #16A34A' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">Simulated Plan</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div><p className="text-xl font-bold text-[#16A34A]">2.4h</p><p className="text-[10px] text-[#617080]">Avg Wait ↓37%</p></div>
            <div><p className="text-xl font-bold text-[#16A34A]">91%</p><p className="text-[10px] text-[#617080]">Utilisation ↑</p></div>
          </div>
        </div>
        <div className="hl-card-flat p-3 rounded-lg flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
          <p className="text-xs text-[#617080]">Moving VSL-204 to B06 reduces expected wait by <strong className="text-[#071A2B]">−18 min</strong></p>
        </div>
      </div>
    </div>
  );
}

// ─── Planner timeline ──────────────────────────────────────────────────────────

function PlannerTimeline() {
  const timeLabels = ['NOW', '+12H', '+24H', '+36H', '+48H', '+60H', '+72H'];
  const vessels = [
    { id: 'VSL-101', color: '#1677C8', blocks: [{ start: 0, width: 25 }] },
    { id: 'VSL-204', color: '#D97706', blocks: [{ start: 15, width: 20 }], highlight: true },
    { id: 'VSL-307', color: '#1677C8', blocks: [{ start: 30, width: 22 }] },
    { id: 'VSL-412', color: '#16A34A', blocks: [{ start: 48, width: 18 }] },
  ];
  const berths = [
    { id: 'B03', color: '#145B8C', blocks: [{ start: 0, width: 35 }, { start: 45, width: 20 }] },
    { id: 'B04', color: '#DC2626', blocks: [{ start: 12, width: 28 }], warn: true },
    { id: 'B05', color: '#1677C8', blocks: [{ start: 5, width: 25 }, { start: 38, width: 22 }] },
    { id: 'B06', color: '#16A34A', blocks: [{ start: 22, width: 30 }] },
  ];

  return (
    <div className="hl-card rounded-xl overflow-hidden" style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* Time header */}
      <div className="flex border-b border-[#DCE3E8] px-4 py-2">
        <div className="w-16 shrink-0" />
        <div className="flex-1 flex">
          {timeLabels.map((l) => (
            <div key={l} className="flex-1 text-[9px] font-bold text-[#98A8B4] text-center">{l}</div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 space-y-2" style={{ background: '#F7F7F5' }}>
        {/* Vessel rows */}
        <p className="text-[9px] font-bold text-[#617080] uppercase tracking-wider mb-1">Vessels</p>
        {vessels.map((v) => (
          <div key={v.id} className="flex items-center gap-2">
            <span className="w-14 text-[10px] font-bold text-[#617080] shrink-0">{v.id}</span>
            <div className="flex-1 relative h-6 bg-white rounded-md border border-[#DCE3E8]">
              {v.blocks.map((b, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 rounded-md flex items-center px-2"
                  style={{
                    left: `${b.start}%`,
                    width: `${b.width}%`,
                    background: v.highlight ? '#D97706' : v.color,
                    opacity: 0.85,
                  }}
                >
                  <span className="text-[9px] font-bold text-white">{v.id}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Berth rows */}
        <p className="text-[9px] font-bold text-[#617080] uppercase tracking-wider mt-3 mb-1">Berths</p>
        {berths.map((b) => (
          <div key={b.id} className="flex items-center gap-2">
            <span className="w-14 text-[10px] font-bold text-[#617080] shrink-0">{b.id}</span>
            <div className="flex-1 relative h-6 bg-white rounded-md border border-[#DCE3E8]">
              {b.blocks.map((block, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 rounded-md"
                  style={{
                    left: `${block.start}%`,
                    width: `${block.width}%`,
                    background: b.color,
                    opacity: 0.7,
                  }}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Recommendation */}
        <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: '#DCFCE7', border: '1px solid #BBF7D0' }}>
          <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold text-[#16A34A]">Recommendation: </span>
            <span className="text-[11px] text-[#166534]">Move VSL-204 from Berth B03 → B05 · Expected waiting time: −18 min</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── IBM Bob section ───────────────────────────────────────────────────────────

function BobPreview() {
  return (
    <div className="hl-card rounded-xl overflow-hidden" style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#DCE3E8]" style={{ background: '#071A2B' }}>
        <div className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: '#1677C8' }}>
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-white">IBM Bob</p>
          <p className="text-[10px] text-white/50">Port Operations Copilot · MCP Connected</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
          <span className="text-[10px] text-[#16A34A] font-bold">10 tools ready</span>
        </div>
      </div>

      <div className="p-5 space-y-4" style={{ background: '#F7F7F5' }}>
        {/* User query */}
        <div className="flex justify-end">
          <div className="px-4 py-3 rounded-xl text-[13px] text-white max-w-sm" style={{ background: '#071A2B' }}>
            Why is Mundra risk increasing?
          </div>
        </div>

        {/* Bob response */}
        <div className="hl-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md grid place-items-center" style={{ background: '#1677C8' }}>
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[11px] font-bold text-[#071A2B]">IBM Bob</span>
          </div>

          <p className="text-sm text-[#071A2B] mb-4 leading-relaxed">
            Mundra's congestion probability is elevated over the next 24 hours based on current operational signals.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
              <p className="text-[9px] font-bold text-[#D97706] uppercase tracking-wider mb-1.5">Why</p>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-[#071A2B]">↑ Vessel arrivals +18%</p>
                <p className="text-[11px] font-semibold text-[#071A2B]">↑ Waiting vessels +12%</p>
                <p className="text-[11px] font-semibold text-[#071A2B]">Berth pressure elevated</p>
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: '#DCEEFF', border: '1px solid #BAD7F8' }}>
              <p className="text-[9px] font-bold text-[#1677C8] uppercase tracking-wider mb-1.5">Recommendation</p>
              <p className="text-[11px] font-semibold text-[#071A2B]">Shift VSL-204 to Berth B05</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: '#DCFCE7', border: '1px solid #BBF7D0' }}>
              <p className="text-[9px] font-bold text-[#16A34A] uppercase tracking-wider mb-1.5">Impact</p>
              <p className="text-[11px] font-semibold text-[#071A2B]">Wait time −18 min</p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="hl-card-flat flex items-center gap-2 px-4 py-3 rounded-xl">
          <input
            readOnly
            placeholder="Ask about the port operations..."
            className="flex-1 text-[13px] text-[#617080] bg-transparent outline-none cursor-default"
          />
          <button className="p-2 rounded-lg text-white" style={{ background: '#1677C8' }}>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Homepage ─────────────────────────────────────────────────────────────

export function Homepage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ───────────────────────────────────────── */}
      {/* HERO SECTION */}
      {/* ───────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: '88vh', background: '#071A2B' }}
      >
        {/* Background grid overlay */}
        <div
          className="absolute inset-0 grid-overlay opacity-40"
          style={{ backgroundSize: '60px 60px' }}
        />

        {/* SVG coordinate / route overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="dots" width="80" height="80" patternUnits="userSpaceOnUse">
              <circle cx="40" cy="40" r="1" fill="#1677C8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
          <line x1="0" y1="35%" x2="100%" y2="50%" stroke="#1677C8" strokeWidth="0.5" strokeDasharray="8,6" />
          <line x1="0" y1="60%" x2="100%" y2="45%" stroke="#1677C8" strokeWidth="0.5" strokeDasharray="6,8" />
          <line x1="20%" y1="0" x2="45%" y2="100%" stroke="#1677C8" strokeWidth="0.5" strokeDasharray="5,7" />
          <line x1="75%" y1="0" x2="55%" y2="100%" stroke="#1677C8" strokeWidth="0.3" strokeDasharray="4,8" />
          {/* Coordinate labels */}
          <text x="8%" y="20%" fontSize="8" fill="#4CA3E3" fontFamily="monospace">22°28'N</text>
          <text x="75%" y="15%" fontSize="8" fill="#4CA3E3" fontFamily="monospace">70°01'E</text>
          <text x="85%" y="75%" fontSize="8" fill="#4CA3E3" fontFamily="monospace">33°43'N</text>
          <text x="5%" y="80%" fontSize="8" fill="#4CA3E3" fontFamily="monospace">118°17'W</text>
          {/* Vessel markers */}
          <circle cx="32%" cy="55%" r="3" fill="#1677C8" opacity="0.7" />
          <circle cx="32%" cy="55%" r="7" fill="none" stroke="#1677C8" strokeWidth="0.5" opacity="0.4" />
          <circle cx="68%" cy="38%" r="3" fill="#DC2626" opacity="0.7" />
          <circle cx="68%" cy="38%" r="7" fill="none" stroke="#DC2626" strokeWidth="0.5" opacity="0.4" />
          <circle cx="55%" cy="65%" r="2.5" fill="#1677C8" opacity="0.5" />
        </svg>

        <HeroNav />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col justify-center min-h-[88vh] px-8 md:px-16 max-w-7xl mx-auto pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: copy */}
            <div className="lg:col-span-6 fade-in-up">
              <div className="eyebrow-blue mb-6" style={{ color: '#4CA3E3' }}>
                Port Intelligence Platform
              </div>

              <h1
                className="editorial-heading text-white mb-6"
                style={{ fontSize: 'clamp(40px, 5vw, 68px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
              >
                PREDICT THE PORT.
                <br />
                <span style={{ color: '#4CA3E3' }}>PLAN WHAT HAPPENS</span>
                <br />
                NEXT.
              </h1>

              <p className="text-[16px] text-white/60 max-w-lg leading-relaxed mb-8">
                Harborline turns live port signals into congestion forecasts, operational insight and 72-hour plans.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-[14px] font-bold text-white transition-all"
                  style={{ background: '#1677C8', boxShadow: '0 4px 20px rgba(22,119,200,0.35)' }}
                >
                  Explore Harborline
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/monitoring"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-[14px] font-bold text-white/80 transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }}
                >
                  <Radio className="w-4 h-4" />
                  View Live Operations
                </Link>
              </div>
            </div>

            {/* Right: floating cards */}
            <div className="lg:col-span-6 relative flex flex-col items-end gap-4 fade-in-up fade-in-up-delay-2">
              <div className="flex gap-4 items-start">
                <div className="mt-8">
                  <FloatingActivityCard />
                </div>
                <FloatingCongestionCard />
              </div>
              <FloatingMapCard />
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24"
          style={{ background: 'linear-gradient(to bottom, transparent, #071A2B)' }}
        />
      </section>

      {/* ───────────────────────────────────────── */}
      {/* PROBLEM SECTION */}
      {/* ───────────────────────────────────────── */}
      <section className="section-white">
        {/* Transition band */}
        <div style={{ height: 80, background: 'linear-gradient(to bottom, #071A2B, #FFFFFF)' }} />

        <div className="max-w-6xl mx-auto px-8 py-16">
          <div className="eyebrow mb-4 text-center">The Problem</div>
          <h2
            className="editorial-heading text-center mx-auto mb-6"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)', maxWidth: 760 }}
          >
            PORT CONGESTION DOESN'T START
            <br />
            WHEN THE QUEUE APPEARS.
          </h2>
          <p className="text-center text-[#617080] text-base leading-relaxed max-w-xl mx-auto mb-16">
            Operational pressure builds through vessel activity, delays, capacity constraints and
            changing schedules before it becomes visible as a major disruption.
          </p>

          {/* Stats grid */}
          <div className="hl-card rounded-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#DCE3E8]">
              <StatCard
                value="80%+"
                label="of global merchandise trade by volume moves by sea"
                source="UNCTAD · World Seaborne Trade"
              />
              <StatCard
                value="13.7%"
                label="longer time spent in port by container ships in 2021 vs 2020"
                source="UNCTAD · Review of Maritime Transport 2022"
              />
              <StatCard
                value="109"
                label="vessels at anchor or in holding areas at peak congestion in San Pedro Bay, January 2022"
                source="Port of Los Angeles · Operations Report"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────── */}
      {/* COST OF UNCERTAINTY — DARK SECTION */}
      {/* ───────────────────────────────────────── */}
      <section className="section-navy py-20">
        <div className="max-w-6xl mx-auto px-8">
          <h2
            className="editorial-heading text-white text-center mb-4"
            style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', maxWidth: 640, margin: '0 auto 16px' }}
          >
            "When congestion arrives,<br />
            <span style={{ color: '#4CA3E3' }}>the decision window</span><br />
            has already narrowed."
          </h2>
          <p className="text-center text-white/40 text-sm mb-16">
            Early signals are available — they're just not being read.
          </p>

          {/* Flow diagram */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-0 mb-16">
            {[
              { label: 'VESSEL ACTIVITY', icon: Ship, sublabel: 'Rising arrival counts' },
              { label: 'WAITING TIME', icon: Clock, sublabel: 'Queue growing' },
              { label: 'CAPACITY PRESSURE', icon: BarChart3, sublabel: 'Berths at limit' },
              { label: 'CONGESTION', icon: AlertTriangle, sublabel: 'Visible disruption', warn: true },
              { label: 'DISRUPTION', icon: Activity, sublabel: 'Cascading impact', crit: true },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex items-center">
                  <div className="flex flex-col items-center text-center w-36">
                    <div
                      className="w-14 h-14 rounded-full grid place-items-center mb-3"
                      style={{
                        background: step.crit ? 'rgba(220,38,38,0.15)' : step.warn ? 'rgba(217,119,6,0.15)' : 'rgba(22,119,200,0.15)',
                        border: `1px solid ${step.crit ? 'rgba(220,38,38,0.4)' : step.warn ? 'rgba(217,119,6,0.4)' : 'rgba(22,119,200,0.3)'}`,
                      }}
                    >
                      <Icon className="w-6 h-6" style={{ color: step.crit ? '#DC2626' : step.warn ? '#D97706' : '#4CA3E3' }} />
                    </div>
                    <p className="text-[11px] font-bold text-white uppercase tracking-wider mb-1">{step.label}</p>
                    <p className="text-[11px] text-white/40">{step.sublabel}</p>
                  </div>
                  {i < 4 && (
                    <div className="hidden md:flex items-center px-2">
                      <ChevronRight className="w-5 h-5 text-white/20" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Timeline hint */}
          <div className="hl-card-navy rounded-xl p-6 max-w-xl mx-auto">
            <p className="eyebrow mb-3" style={{ color: '#4CA3E3' }}>Signal timeline before a congestion event</p>
            <div className="space-y-2">
              {[
                { label: 'Vessel arrivals increase', time: '−72h', color: '#4CA3E3' },
                { label: 'Waiting vessels start growing', time: '−48h', color: '#D97706' },
                { label: 'Berth utilisation peaks', time: '−24h', color: '#D97706' },
                { label: 'Congestion becomes visible', time: 'NOW', color: '#DC2626' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold font-mono w-10 text-right" style={{ color: item.color }}>{item.time}</span>
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-[12px] text-white/60">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────── */}
      {/* WHAT HARBORLINE DOES */}
      {/* ───────────────────────────────────────── */}
      <section className="section-white py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="eyebrow mb-4">One Operating Picture</div>
          <h2
            className="editorial-heading mb-4"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}
          >
            FROM SIGNALS
            <br />
            TO DECISIONS.
          </h2>
          <p className="text-[#617080] text-base max-w-lg leading-relaxed mb-14">
            Four integrated modules that move your team from reactive to operational control.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <FeatureCard
              number="01"
              title="Monitor"
              tagline="Know what is happening."
              description="Live vessel positions, berth status, arrivals, departures and waiting queue — all in one operational view."
              icon={Radio}
              visual={<MonitorVisual />}
              accent="#1677C8"
            />
            <FeatureCard
              number="02"
              title="Predict"
              tagline="See the next 72 hours."
              description="XGBoost-powered congestion probability forecasts at 24h, 48h and 72h horizons with driver explanation."
              icon={TrendingUp}
              visual={<PredictVisual />}
              accent="#DC2626"
            />
            <FeatureCard
              number="03"
              title="Optimise"
              tagline="Test the operational response."
              description="OR-Tools constraint solver calculates the optimal berth-vessel-crane allocation to minimise waiting time."
              icon={Layers}
              visual={<OptimiseVisual />}
              accent="#16A34A"
            />
            <FeatureCard
              number="04"
              title="Plan"
              tagline="Turn insight into action."
              description="A coordinated 72-hour operating plan combining forecast signals with optimised berth and crane schedules."
              icon={Calendar}
              visual={<PlanVisual />}
              accent="#145B8C"
            />
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────── */}
      {/* HOW IT WORKS — ARCHITECTURE */}
      {/* ───────────────────────────────────────── */}
      <section className="section-warm py-24">
        <div className="max-w-6xl mx-auto px-8">
          <div className="eyebrow mb-4">Architecture</div>
          <h2
            className="editorial-heading mb-4"
            style={{ fontSize: 'clamp(26px, 3.5vw, 44px)' }}
          >
            ONE SIGNAL LAYER.
            <br />
            THREE DECISION LAYERS.
          </h2>
          <p className="text-[#617080] text-sm max-w-lg leading-relaxed mb-14">
            From raw maritime data to operational recommendations — a single coherent pipeline.
          </p>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <ArchLayer
              label="Data"
              sublabel="Port signals & history"
              items={['IMF PortWatch AIS', 'Historical port indicators', 'Vessel schedules', 'World Bank data']}
              color="#617080"
            />
            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center w-10 mt-16">
              <div className="flex flex-col items-center gap-1">
                <div className="w-px h-8 bg-[#DCE3E8]" />
                <ChevronRight className="w-4 h-4 text-[#C8D5DE]" style={{ transform: 'rotate(90deg)' }} />
              </div>
            </div>
            <ArchLayer
              label="Intelligence"
              sublabel="ML forecasting engine"
              items={['Normalisation', 'Feature engineering', 'XGBoost forecasting', 'Risk classification', 'Driver explanation']}
              color="#1677C8"
            />
            <div className="hidden md:flex items-center justify-center w-10 mt-16">
              <div className="flex flex-col items-center gap-1">
                <div className="w-px h-8 bg-[#DCE3E8]" />
                <ChevronRight className="w-4 h-4 text-[#C8D5DE]" style={{ transform: 'rotate(90deg)' }} />
              </div>
            </div>
            <ArchLayer
              label="Action"
              sublabel="Operations layer"
              items={['Recommendations', 'OR-Tools optimisation', 'What-if simulation', '72-hour planning', 'IBM Bob copilot']}
              color="#071A2B"
            />
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────── */}
      {/* PRODUCT SHOWCASE */}
      {/* ───────────────────────────────────────── */}
      <section className="section-white py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-14">
            <div className="eyebrow mb-4">Product</div>
            <h2
              className="editorial-heading mx-auto"
              style={{ fontSize: 'clamp(28px, 4vw, 48px)', maxWidth: 520 }}
            >
              THE PORT, AT A GLANCE.
            </h2>
          </div>
          <DashboardMockup />
        </div>
      </section>

      {/* ───────────────────────────────────────── */}
      {/* AI PREDICTION SECTION */}
      {/* ───────────────────────────────────────── */}
      <section className="section-pale-blue py-24">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="eyebrow mb-4">Forecasting</div>
              <h2
                className="editorial-heading mb-6"
                style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}
              >
                LOOK AHEAD.
                <br />
                NOT JUST BACK.
              </h2>
              <p className="text-[#617080] text-base leading-relaxed mb-6">
                Harborline estimates congestion probability from observed port activity and
                historical signals — giving you the 72-hour picture before pressure becomes disruption.
              </p>
              <p className="text-[12px] text-[#98A8B4] leading-relaxed">
                Models trained on 1,462 days of AIS data (IMF PortWatch). Predictions carry
                explicit confidence intervals. Harborline does not claim perfect prediction.
              </p>
            </div>

            {/* Chart */}
            <div className="hl-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold text-[#617080] uppercase tracking-wider">72-Hour Congestion Forecast · Mundra Port</p>
                <span className="risk-badge risk-badge-high">HIGH</span>
              </div>
              <svg viewBox="0 0 400 140" className="w-full">
                {/* Background */}
                <rect width="400" height="120" fill="#F7F7F5" rx="4" />
                {/* Risk zone */}
                <rect x="0" y="0" width="400" height="40" fill="rgba(220,38,38,0.04)" />
                <line x1="0" y1="40" x2="400" y2="40" stroke="#DC2626" strokeWidth="0.8" strokeDasharray="5,4" opacity="0.4" />
                <text x="380" y="37" fontSize="8" fill="#DC2626" textAnchor="end" opacity="0.6">HIGH RISK</text>
                {/* Confidence band */}
                <path d="M 0,85 L 80,80 L 160,65 L 200,58 L 260,42 L 320,38 L 400,32 L 400,52 L 320,58 L 260,62 L 200,78 L 160,85 L 80,98 L 0,102 Z"
                  fill="rgba(22,119,200,0.1)" />
                {/* Historical */}
                <path d="M 0,88 L 80,82 L 160,70 L 200,62" stroke="#C8D5DE" strokeWidth="1.5" fill="none" />
                {/* Forecast */}
                <path d="M 200,62 L 260,52 L 320,48 L 400,42" stroke="#1677C8" strokeWidth="2" fill="none" strokeDasharray="6,4" />
                {/* Now line */}
                <line x1="200" y1="0" x2="200" y2="120" stroke="#617080" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.5" />
                <text x="204" y="115" fontSize="8" fill="#617080">NOW</text>
                {/* Labels */}
                {[['0', 0], ['+12h', 80], ['+24h', 160], ['+48h', 280], ['+72h', 380]].map(([l, x]) => (
                  <text key={String(l)} x={Number(x)} y="132" fontSize="8" fill="#98A8B4" textAnchor="middle">{String(l)}</text>
                ))}
              </svg>
              <div className="flex gap-4 mt-3 pt-3 border-t border-[#DCE3E8]">
                <div className="flex items-center gap-1.5 text-[11px] text-[#617080]">
                  <div className="w-5 h-0.5 bg-[#C8D5DE]" />
                  Historical
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#617080]">
                  <div className="w-5 h-0.5 bg-[#1677C8]" style={{ borderStyle: 'dashed' }} />
                  Forecast
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#617080]">
                  <div className="w-5 h-2 rounded-sm" style={{ background: 'rgba(22,119,200,0.15)' }} />
                  Confidence band
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────── */}
      {/* SIMULATION SECTION */}
      {/* ───────────────────────────────────────── */}
      <section className="section-white py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-14">
            <div className="eyebrow mb-4">What-If Simulation</div>
            <h2
              className="editorial-heading mx-auto"
              style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', maxWidth: 540 }}
            >
              CHANGE THE PLAN
              <br />
              BEFORE CHANGING THE PORT.
            </h2>
            <p className="text-[#617080] text-sm mt-4 max-w-md mx-auto leading-relaxed">
              Evaluate operational changes non-destructively before committing them to the schedule.
            </p>
          </div>
          <SimulationPreview />
        </div>
      </section>

      {/* ───────────────────────────────────────── */}
      {/* 72-HOUR PLANNER */}
      {/* ───────────────────────────────────────── */}
      <section className="section-warm py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-14">
            <div className="eyebrow mb-4">72-Hour Planner</div>
            <h2
              className="editorial-heading"
              style={{ fontSize: 'clamp(26px, 3.5vw, 44px)' }}
            >
              TURN A FORECAST
              <br />
              INTO A 72-HOUR PLAN.
            </h2>
          </div>
          <PlannerTimeline />
        </div>
      </section>

      {/* ───────────────────────────────────────── */}
      {/* IBM BOB SECTION */}
      {/* ───────────────────────────────────────── */}
      <section className="section-white py-24">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="eyebrow mb-4">IBM Bob</div>
              <h2
                className="editorial-heading mb-6"
                style={{ fontSize: 'clamp(26px, 3.5vw, 44px)' }}
              >
                ASK THE PORT.
              </h2>
              <p className="text-[#617080] text-base leading-relaxed mb-8">
                IBM Bob is an AI operations copilot that queries live port data, runs forecasts,
                triggers the optimisation solver and generates 72-hour plans — responding with structured operational evidence.
              </p>
              <div className="space-y-2">
                {[
                  '"Why is Mundra risk increasing?"',
                  '"What happens if VSL-204 arrives two hours late?"',
                  '"Which berth should I assign next?"',
                  '"Generate the next 72-hour operating plan."',
                ].map((q) => (
                  <div key={q} className="flex items-start gap-2 px-4 py-2.5 rounded-lg bg-[#F3F8FC] border border-[#DCEEFF]">
                    <Bot className="w-3.5 h-3.5 text-[#1677C8] shrink-0 mt-0.5" />
                    <span className="text-[13px] text-[#617080]">{q}</span>
                  </div>
                ))}
              </div>
            </div>
            <BobPreview />
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────── */}
      {/* BENEFITS SECTION */}
      {/* ───────────────────────────────────────── */}
      <section className="section-warm py-24">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-14">
            <div className="eyebrow mb-4">Benefits</div>
            <h2
              className="editorial-heading mx-auto"
              style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', maxWidth: 480 }}
            >
              LESS REACTION.
              <br />
              MORE CONTROL.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[
              {
                number: '01',
                heading: 'See Earlier',
                body: 'Identify pressure before congestion becomes operational disruption.',
                icon: TrendingUp,
                color: '#1677C8',
              },
              {
                number: '02',
                heading: 'Decide Faster',
                body: 'Understand the drivers behind changing risk with clear, structured explanations.',
                icon: Activity,
                color: '#D97706',
              },
              {
                number: '03',
                heading: 'Test Before Acting',
                body: 'Evaluate operational changes before committing them to the schedule.',
                icon: FlaskConical,
                color: '#16A34A',
              },
              {
                number: '04',
                heading: 'Plan Ahead',
                body: 'Turn forecasts into a coordinated 72-hour operating picture.',
                icon: Calendar,
                color: '#145B8C',
              },
            ].map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.number} className="hl-card p-6 rounded-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-lg grid place-items-center"
                      style={{ background: `${b.color}12` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: b.color }} />
                    </div>
                    <span className="text-[11px] font-bold text-[#98A8B4]">{b.number}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#071A2B] mb-2">{b.heading}</h3>
                  <p className="text-sm text-[#617080] leading-relaxed">{b.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────── */}
      {/* FINAL CTA */}
      {/* ───────────────────────────────────────── */}
      <section
        className="relative py-32 overflow-hidden"
        style={{ background: '#071A2B' }}
      >
        {/* BG grid */}
        <div className="absolute inset-0 grid-overlay opacity-30" style={{ backgroundSize: '60px 60px' }} />

        {/* SVG coordinate decorations */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" preserveAspectRatio="xMidYMid slice">
          <line x1="0" y1="30%" x2="100%" y2="55%" stroke="#4CA3E3" strokeWidth="0.5" strokeDasharray="8,6" />
          <line x1="0" y1="70%" x2="100%" y2="45%" stroke="#4CA3E3" strokeWidth="0.5" strokeDasharray="5,8" />
          <circle cx="25%" cy="60%" r="40" fill="none" stroke="#4CA3E3" strokeWidth="0.5" />
          <circle cx="75%" cy="40%" r="55" fill="none" stroke="#4CA3E3" strokeWidth="0.5" />
          <text x="5%" y="25%" fontSize="9" fill="#4CA3E3" fontFamily="monospace">33°44'N 118°16'W</text>
          <text x="70%" y="80%" fontSize="9" fill="#4CA3E3" fontFamily="monospace">22°28'N 70°02'E</text>
        </svg>

        <div className="relative z-10 max-w-4xl mx-auto px-8 text-center">
          <div className="eyebrow mb-6" style={{ color: '#4CA3E3' }}>Harborline Platform</div>
          <h2
            className="editorial-heading text-white mb-8 mx-auto"
            style={{ fontSize: 'clamp(32px, 5vw, 64px)', maxWidth: 640 }}
          >
            THE NEXT 72 HOURS
            <br />
            START WITH WHAT YOU
            <br />
            <span style={{ color: '#4CA3E3' }}>CAN SEE TODAY.</span>
          </h2>
          <p className="text-white/50 text-base mb-10 max-w-md mx-auto leading-relaxed">
            Give your operations team the intelligence layer they need to stay ahead of congestion.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-bold text-white transition-all"
              style={{ background: '#1677C8', boxShadow: '0 4px 24px rgba(22,119,200,0.35)' }}
            >
              Explore Harborline
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/monitoring"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-bold text-white/70 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }}
            >
              <Radio className="w-5 h-5" />
              View Operations
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0B2942', borderTop: '1px solid rgba(255,255,255,0.06)' }} className="py-8">
        <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 grid place-items-center rounded-md" style={{ background: '#1677C8' }}>
              <Anchor className="w-3 h-3 text-white" />
            </div>
            <span className="text-[13px] font-bold text-white/80">Harborline</span>
          </div>
          <p className="text-[11px] text-white/30">
            Port intelligence, congestion prediction and operations planning platform.
          </p>
          <p className="text-[11px] text-white/25">
            Data: IMF PortWatch · World Bank · UNCTAD
          </p>
        </div>
      </footer>
    </div>
  );
}
