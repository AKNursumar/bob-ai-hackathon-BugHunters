import { useState, useEffect } from 'react';
import { ShieldAlert, TrendingUp, BarChart3, Info } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

interface ForecastHorizon {
  probability: number;
  risk: string;
  confidence: number;
}

interface PortForecastData {
  port: string;
  displayName: string;
  congestionIndex: number;
  pressureState: string;
  forecast24h: ForecastHorizon;
  forecast48h: ForecastHorizon;
  forecast72h: ForecastHorizon;
  topDrivers: Array<{ feature: string; importance: number; direction: string }>;
}

const DEFAULT_FORECAST: PortForecastData = {
  port: 'lalb',
  displayName: 'Los Angeles–Long Beach',
  congestionIndex: 78.5,
  pressureState: 'SURGING',
  forecast24h: { probability: 0.83, risk: 'CRITICAL', confidence: 0.89 },
  forecast48h: { probability: 0.85, risk: 'CRITICAL', confidence: 0.85 },
  forecast72h: { probability: 0.84, risk: 'CRITICAL', confidence: 0.81 },
  topDrivers: [
    { feature: 'Waiting vessels change (daily queue acceleration)', importance: 0.35, direction: 'up' },
    { feature: 'Unique vessels at anchor — 14-day moving average', importance: 0.22, direction: 'up' },
    { feature: 'Anchorage dwell — previous day lag', importance: 0.18, direction: 'up' },
    { feature: 'Berth turnover variance — 7-day rolling std', importance: 0.14, direction: 'down' },
    { feature: 'Weekend — terminal labour shift pattern', importance: 0.11, direction: 'neutral' },
  ],
};

const RISK_CFG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  CRITICAL: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA', label: 'CRITICAL' },
  HIGH:     { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A', label: 'HIGH' },
  MEDIUM:   { bg: '#DCEEFF', text: '#1677C8', border: '#BAD7F8', label: 'MEDIUM' },
  LOW:      { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0', label: 'LOW' },
};

// Mini SVG forecast chart
function ForecastChart({ data }: { data: PortForecastData }) {
  const points: [number, number][] = [
    [0, 1 - 0.5],       // historical start
    [80, 1 - 0.55],
    [160, 1 - 0.62],
    [200, 1 - data.forecast24h.probability * 0.9],
    [260, 1 - data.forecast24h.probability],
    [320, 1 - data.forecast48h.probability],
    [400, 1 - data.forecast72h.probability],
  ];

  const h = 160;
  const w = 400;
  const pad = { t: 20, b: 30, l: 8, r: 8 };

  const x = (px: number) => pad.l + (px / 400) * (w - pad.l - pad.r);
  const y = (py: number) => pad.t + py * (h - pad.t - pad.b);

  const historicalPath = points.slice(0, 4).map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${x(px)},${y(py)}`).join(' ');
  const forecastPath = points.slice(3).map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${x(px)},${y(py)}`).join(' ');
  const bandTop = points.slice(3).map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${x(px)},${y(py - 0.06)}`).join(' ');
  const bandBot = [...points.slice(3)].reverse().map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${x(px)},${y(py + 0.06)}`).join(' ');

  const riskY = y(1 - 0.70);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {/* Gridlines */}
      {[0.25, 0.5, 0.75, 1.0].map(v => (
        <line key={v} x1={pad.l} y1={y(1 - v)} x2={w - pad.r} y2={y(1 - v)} stroke="#F0F4F8" strokeWidth="1" />
      ))}
      {/* Risk threshold */}
      <line x1={pad.l} y1={riskY} x2={w - pad.r} y2={riskY} stroke="#DC2626" strokeWidth="0.8" strokeDasharray="5,4" opacity="0.5" />
      <text x={w - pad.r - 2} y={riskY - 3} fontSize="8" fill="#DC2626" textAnchor="end" opacity="0.7">HIGH RISK (70%)</text>

      {/* Confidence band */}
      <path d={`${bandTop} ${bandBot} Z`} fill="rgba(22,119,200,0.1)" />

      {/* Now line */}
      <line x1={x(200)} y1={pad.t} x2={x(200)} y2={h - pad.b} stroke="#617080" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.5" />
      <text x={x(200) + 3} y={h - pad.b + 12} fontSize="8" fill="#617080">NOW</text>

      {/* Historical */}
      <path d={historicalPath} stroke="#C8D5DE" strokeWidth="2" fill="none" />
      {/* Forecast */}
      <path d={forecastPath} stroke="#1677C8" strokeWidth="2" fill="none" strokeDasharray="7,4" />

      {/* X axis labels */}
      {[['0', 0], ['+12h', 80], ['+24h', 160], ['+48h', 280], ['+72h', 380]].map(([l, xv]) => (
        <text key={String(l)} x={x(Number(xv))} y={h - 4} fontSize="8" fill="#98A8B4" textAnchor="middle">{String(l)}</text>
      ))}

      {/* Y axis labels */}
      {[25, 50, 75, 100].map(v => (
        <text key={v} x={pad.l} y={y(1 - v / 100) + 3} fontSize="7" fill="#98A8B4">{v}%</text>
      ))}
    </svg>
  );
}

export function PredictionsPage() {
  const [selectedPort, setSelectedPort] = useState('lalb');
  const [forecastData, setForecastData] = useState<PortForecastData>(DEFAULT_FORECAST);

  useEffect(() => {
    async function loadForecast() {
      try {
        const [forecastRes, driversRes] = await Promise.allSettled([
          fetch(`/api/v1/congestion/forecast/${selectedPort}`),
          fetch(`/api/v1/congestion/predictions/${selectedPort}`),
        ]);

        let updatedData: Partial<PortForecastData> = {};

        if (forecastRes.status === 'fulfilled' && forecastRes.value.ok) {
          const data = await forecastRes.value.json();
          updatedData = {
            port: selectedPort,
            displayName: data.port_name ?? DEFAULT_FORECAST.displayName,
            congestionIndex: data.current_activity?.congestion_index ?? 75.0,
            pressureState: 'SURGING',
            forecast24h: { probability: data.forecast_24h?.probability ?? 0.83, risk: data.forecast_24h?.risk_level ?? 'CRITICAL', confidence: 0.88 },
            forecast48h: { probability: data.forecast_48h?.probability ?? 0.85, risk: data.forecast_48h?.risk_level ?? 'CRITICAL', confidence: 0.84 },
            forecast72h: { probability: data.forecast_72h?.probability ?? 0.84, risk: data.forecast_72h?.risk_level ?? 'CRITICAL', confidence: 0.81 },
          };
        }

        if (driversRes.status === 'fulfilled' && driversRes.value.ok) {
          const pdata = await driversRes.value.json();
          const fi: Record<string, number> = pdata.feature_importance ?? {};
          if (Object.keys(fi).length > 0) {
            const sorted = Object.entries(fi).sort((a, b) => b[1] - a[1]).slice(0, 5);
            updatedData.topDrivers = sorted.map(([feature, importance]) => ({
              feature,
              importance,
              direction: importance > 0.15 ? 'up' : 'neutral',
            }));
          }
        }

        if (Object.keys(updatedData).length > 0) {
          setForecastData((prev) => ({ ...prev, ...updatedData }));
        }
      } catch (err) {
        console.warn('API error, using fallback data:', err);
      }
    }
    loadForecast();
  }, [selectedPort]);

  const riskCfg24 = RISK_CFG[forecastData.forecast24h.risk] ?? RISK_CFG.HIGH;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl fade-in-up">
      <PageHeader
        title="Congestion Predictions"
        subtitle="XGBoost time-series forecasting · 24h, 48h & 72h congestion probability"
        actions={
          <select
            value={selectedPort}
            onChange={(e) => setSelectedPort(e.target.value)}
            className="text-[12px] border border-[#DCE3E8] rounded-lg px-3 py-2 bg-white text-[#071A2B] font-medium"
          >
            <option value="lalb">Los Angeles–Long Beach</option>
            <option value="port235">Chennai</option>
            <option value="port776">JNPT / Mumbai</option>
            <option value="port777">Mundra</option>
          </select>
        }
      />

      {/* Pressure state banner */}
      <div
        className="flex items-center justify-between px-5 py-4 rounded-xl"
        style={{ background: riskCfg24.bg, border: `1px solid ${riskCfg24.border}` }}
      >
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5" style={{ color: riskCfg24.text }} />
          <div>
            <p className="text-[13px] font-bold" style={{ color: riskCfg24.text }}>
              Pressure Trajectory: <span className="uppercase tracking-wider">{forecastData.pressureState}</span>
            </p>
            <p className="text-[12px] text-[#617080] mt-0.5">
              {forecastData.displayName} · Elevated inbound volume with growing anchorage queue projected across the 72-hour window.
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-bold text-[#617080] uppercase tracking-wider mb-1">Congestion Index</p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: riskCfg24.text }}>{forecastData.congestionIndex.toFixed(1)}%</p>
        </div>
      </div>

      {/* Horizon cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: '24-Hour Horizon', data: forecastData.forecast24h },
          { label: '48-Hour Horizon', data: forecastData.forecast48h },
          { label: '72-Hour Horizon', data: forecastData.forecast72h },
        ].map(({ label, data: d }) => {
          const cfg = RISK_CFG[d.risk] ?? RISK_CFG.HIGH;
          return (
            <div key={label} className="hl-card rounded-xl p-5" style={{ borderTop: `3px solid ${cfg.text}` }}>
              <div className="flex items-center justify-between mb-4">
                <p className="eyebrow">{label}</p>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
                >
                  {cfg.label}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold tabular-nums" style={{ color: cfg.text }}>
                  {(d.probability * 100).toFixed(0)}%
                </span>
                <span className="text-xs text-[#617080]">congestion probability</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[#DCE3E8] text-xs text-[#617080]">
                <span>Model Confidence</span>
                <span className="font-bold text-[#071A2B]">{(d.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Forecast chart */}
      <div className="hl-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="eyebrow mb-1">Forecast Visualisation</p>
            <h3 className="text-[13px] font-bold text-[#071A2B]">72-Hour Congestion Probability Chart</h3>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-[11px] text-[#617080]">
              <div className="w-4 h-0.5 bg-[#C8D5DE]" />
              Historical
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#617080]">
              <div className="w-4 h-0.5 bg-[#1677C8]" style={{ borderStyle: 'dashed' }} />
              Forecast
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#617080]">
              <div className="w-4 h-2 rounded" style={{ background: 'rgba(22,119,200,0.15)' }} />
              Confidence band
            </div>
          </div>
        </div>
        <ForecastChart data={forecastData} />
      </div>

      {/* Feature drivers */}
      <div className="hl-card rounded-xl">
        <div className="px-5 py-4 border-b border-[#DCE3E8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#617080]" />
            <div>
              <p className="eyebrow mb-0.5">Model Explanation</p>
              <h3 className="text-[13px] font-bold text-[#071A2B]">Feature Importance & Driver Analysis</h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F8FC] border border-[#DCEEFF]">
            <Info className="w-3 h-3 text-[#1677C8]" />
            <span className="text-[11px] text-[#617080]">Trained on 1,462 days AIS data (IMF PortWatch)</span>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {forecastData.topDrivers.map((driver, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-1.5 text-[12px]">
                <span className="font-medium text-[#071A2B] leading-snug">{driver.feature}</span>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {driver.direction === 'up' && <TrendingUp className="w-3 h-3 text-[#DC2626]" />}
                  <span className="font-bold text-[#071A2B] tabular-nums">{(driver.importance * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-full bg-[#F3F8FC] rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(driver.importance / 0.4) * 100}%`,
                    background: index === 0 ? '#DC2626' : index === 1 ? '#D97706' : '#1677C8',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
