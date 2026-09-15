import { PageHeader } from '@/components/PageHeader';
import { MapPin, AlertTriangle, TrendingUp, Clock } from 'lucide-react';

// Mini map with hotspot indicators
function HotspotMap() {
  const hotspots = [
    { cx: 140, cy: 72, r: 22, risk: 'critical', label: 'Terminal A' },
    { cx: 260, cy: 95, r: 14, risk: 'high', label: 'Anchorage N' },
    { cx: 310, cy: 55, r: 10, risk: 'medium', label: 'Gate 3' },
    { cx: 80, cy: 110, r: 8, risk: 'medium', label: 'Pier B' },
  ];

  const riskColors: Record<string, string> = {
    critical: '#DC2626',
    high: '#D97706',
    medium: '#1677C8',
    low: '#16A34A',
  };

  return (
    <div className="hl-card rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#DCE3E8] flex items-center justify-between">
        <div>
          <p className="eyebrow mb-0.5">Live Risk Map</p>
          <h3 className="text-[13px] font-bold text-[#071A2B]">Find Where Pressure Is Building</h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#617080]">
          {[
            { color: '#DC2626', label: 'Critical' },
            { color: '#D97706', label: 'High' },
            { color: '#1677C8', label: 'Medium' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color, opacity: 0.7 }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#DCEEFF' }} className="relative">
        <svg viewBox="0 0 420 200" className="w-full">
          {/* Water */}
          <rect width="420" height="200" fill="#DCEEFF" />

          {/* Grid overlay */}
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 60} y1="0" x2={i * 60} y2="200"
              stroke="rgba(22,119,200,0.08)" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 4 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 50} x2="420" y2={i * 50}
              stroke="rgba(22,119,200,0.08)" strokeWidth="0.5" />
          ))}

          {/* Terminal blocks */}
          <rect x="80" y="50" width="130" height="80" fill="#EEF5FB" stroke="#C8D5DE" strokeWidth="1" rx="4" />
          <text x="145" y="93" textAnchor="middle" fontSize="9" fill="#617080" fontWeight="700">TERMINAL A</text>
          <rect x="230" y="40" width="150" height="100" fill="#EEF5FB" stroke="#C8D5DE" strokeWidth="1" rx="4" />
          <text x="305" y="92" textAnchor="middle" fontSize="9" fill="#617080" fontWeight="700">TERMINAL B</text>

          {/* Vessels at berth */}
          <rect x="87" y="58" width="30" height="12" fill="#1677C8" rx="2" opacity="0.75" />
          <rect x="122" y="58" width="30" height="12" fill="#1677C8" rx="2" opacity="0.75" />
          <rect x="157" y="58" width="25" height="12" fill="#1677C8" rx="2" opacity="0.75" />
          <rect x="237" y="48" width="28" height="12" fill="#1677C8" rx="2" opacity="0.6" />
          <rect x="270" y="48" width="28" height="12" fill="#DC2626" rx="2" opacity="0.8" />
          <rect x="305" y="48" width="25" height="12" fill="#1677C8" rx="2" opacity="0.6" />

          {/* Route lines */}
          <path d="M 0,140 Q 40,100 80,80" stroke="#1677C8" strokeWidth="0.8" strokeDasharray="4,3" fill="none" opacity="0.4" />
          <path d="M 0,160 Q 50,130 80,105" stroke="#1677C8" strokeWidth="0.8" strokeDasharray="4,3" fill="none" opacity="0.3" />
          <path d="M 420,150 Q 380,100 385,78" stroke="#1677C8" strokeWidth="0.8" strokeDasharray="4,3" fill="none" opacity="0.3" />

          {/* Coordinate markers */}
          <text x="10" y="15" fontSize="7" fill="#98A8B4" fontFamily="monospace">33°44'N</text>
          <text x="340" y="195" fontSize="7" fill="#98A8B4" fontFamily="monospace">118°16'W</text>

          {/* Hotspot overlays */}
          {hotspots.map((h) => (
            <g key={h.label}>
              <circle cx={h.cx} cy={h.cy} r={h.r * 1.8} fill={riskColors[h.risk]} opacity="0.08" />
              <circle cx={h.cx} cy={h.cy} r={h.r} fill={riskColors[h.risk]} opacity="0.15" />
              <circle cx={h.cx} cy={h.cy} r={h.r * 0.4} fill={riskColors[h.risk]} opacity="0.8" />
            </g>
          ))}

          {/* Hotspot labels */}
          {hotspots.map((h) => (
            <text key={`label-${h.label}`} x={h.cx} y={h.cy + h.r + 10}
              textAnchor="middle" fontSize="8" fill={riskColors[h.risk]} fontWeight="700">
              {h.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

export function HotspotsPage() {
  const hotspots = [
    {
      id: 'HS-001',
      location: 'Terminal A — Pier 400',
      risk: 'critical',
      window: '14:00–20:00',
      date: 'Today',
      drivers: ['+23% vessel arrivals', '+11% waiting time', 'Berth utilisation pressure'],
      action: 'Redirect 3 vessels to Terminal B. Stagger arrivals by +2h.',
    },
    {
      id: 'HS-002',
      location: 'Northern Anchorage',
      risk: 'high',
      window: '08:00–14:00',
      date: 'Tomorrow',
      drivers: ['+8% queue growth', 'Crane maintenance window', 'Tidal window conflict'],
      action: 'Pre-position pilot vessels. Notify inbound fleet.',
    },
    {
      id: 'HS-003',
      location: 'Gate Complex — East',
      risk: 'medium',
      window: '06:00–10:00',
      date: 'Tomorrow',
      drivers: ['Peak truck arrival pattern', 'Inspection backlog'],
      action: 'Deploy additional processing lanes.',
    },
  ];

  const riskCfg: Record<string, { bg: string; text: string; border: string }> = {
    critical: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
    high:     { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
    medium:   { bg: '#DCEEFF', text: '#1677C8', border: '#BAD7F8' },
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl fade-in-up">
      <PageHeader
        title="Hotspot Intelligence"
        subtitle="Spatial and temporal risk zones — where pressure is building and when it will peak"
      />

      {/* Map */}
      <HotspotMap />

      {/* Active hotspots */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <p className="eyebrow">Active Risk Windows</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FEE2E2] text-[#DC2626]">{hotspots.length} active</span>
        </div>
        <div className="space-y-4">
          {hotspots.map((hs) => {
            const cfg = riskCfg[hs.risk];
            return (
              <div
                key={hs.id}
                className="hl-card rounded-xl p-5"
                style={{ borderLeft: `3px solid ${cfg.text}` }}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Left: summary */}
                  <div className="md:col-span-4">
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: cfg.text }} />
                      <div>
                        <p className="text-[13px] font-bold text-[#071A2B]">{hs.location}</p>
                        <p className="text-[11px] text-[#617080] mt-0.5">{hs.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded"
                        style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
                      >
                        {hs.risk.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-[#617080]">
                        <Clock className="w-3 h-3" />
                        {hs.date} · {hs.window}
                      </div>
                    </div>
                  </div>

                  {/* Middle: drivers */}
                  <div className="md:col-span-4">
                    <p className="text-[10px] font-bold text-[#617080] uppercase tracking-wider mb-2">Primary Drivers</p>
                    <div className="space-y-1.5">
                      {hs.drivers.map((d) => (
                        <div key={d} className="flex items-center gap-2">
                          <TrendingUp className="w-3 h-3 shrink-0" style={{ color: cfg.text }} />
                          <span className="text-[12px] text-[#617080]">{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: response */}
                  <div className="md:col-span-4">
                    <p className="text-[10px] font-bold text-[#617080] uppercase tracking-wider mb-2">Recommended Response</p>
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#F3F8FC] border border-[#DCEEFF]">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#1677C8] shrink-0 mt-0.5" />
                      <p className="text-[12px] text-[#617080] leading-relaxed">{hs.action}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
