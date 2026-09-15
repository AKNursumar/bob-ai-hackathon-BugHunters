import { useState } from 'react';
import { Sliders, RefreshCw, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { usePort } from '@/contexts/PortContext';
import { apiUrl } from '@/lib/apiUrl';

interface SimImpact {
  waitingHours: string;
  queueVessels: number;
  estimatedDemurrage: string;
  bottleneckBerths: string[];
  recommendation: string;
}

function localImpact(delayHours: number, cranesDown: number, volumeSurge: number): SimImpact {
  const waitingHours = ((delayHours * 0.45) + (cranesDown * 2.8) + (volumeSurge * 0.15)).toFixed(1);
  return {
    waitingHours,
    queueVessels: Math.round(12 + (delayHours * 0.5) + (cranesDown * 1.5) + (volumeSurge * 0.2)),
    estimatedDemurrage: (Number(waitingHours) * 8 * 1450).toLocaleString(),
    bottleneckBerths: cranesDown >= 2 ? ['Berth 1 (Pier 400)', 'Berth 2 (Pier G)'] : ['Berth 1 (Pier 400)'],
    recommendation: `Reschedule V-103 to Berth 3 to clear 4 hours of Pier 400 crane bottleneck. Notify pilot dispatch of +${delayHours}h arrival stagger to prevent anchorage overcrowding.`,
  };
}

// Before/after comparison timeline
function ComparisonTimeline({ impact, delayHours: _delayHours }: { impact: SimImpact; delayHours: number }) {
  const baseWait = 3.8;
  const simWait = parseFloat(impact.waitingHours) * 0.3 + baseWait;
  const improvement = ((simWait - baseWait) / baseWait * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="hl-card p-5 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-[#DC2626]" />
          <span className="text-[11px] font-bold text-[#617080] uppercase tracking-wider">Current Plan</span>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Average Wait Time', value: `${baseWait}h` },
            { label: 'Queue Vessels', value: '10' },
            { label: 'Berth Conflicts', value: '2' },
            { label: 'Crane Utilisation', value: '62%' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#DCE3E8] last:border-0">
              <span className="text-[12px] text-[#617080]">{item.label}</span>
              <span className="text-[13px] font-bold text-[#071A2B]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="hl-card p-5 rounded-xl" style={{ borderTop: '2px solid #16A34A' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
          <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">Simulated Plan</span>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Average Wait Time', value: `${simWait.toFixed(1)}h`, change: `+${improvement.toFixed(0)}%`, crit: true },
            { label: 'Queue Vessels', value: impact.queueVessels.toString(), change: `+${impact.queueVessels - 10}` },
            { label: 'Berth Conflicts', value: '0', change: '↓ 100%', pos: true },
            { label: 'Crane Utilisation', value: '76%', change: '↑ +14%', pos: true },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#DCE3E8] last:border-0">
              <span className="text-[12px] text-[#617080]">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-[#071A2B]">{item.value}</span>
                {item.change && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    item.pos ? 'text-[#16A34A] bg-[#DCFCE7]' : 'text-[#DC2626] bg-[#FEE2E2]'
                  }`}>{item.change}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SimulationPage() {
  const { selectedPort } = usePort();
  const [delayHours, setDelayHours] = useState(0);
  const [cranesDown, setCranesDown] = useState(2);
  const [volumeSurge, setVolumeSurge] = useState(20);
  const [isSimulating, setIsSimulating] = useState(false);
  const [impact, setImpact] = useState<SimImpact>(() => localImpact(6, 2, 20));

  const applyPreset = (preset: 'weather' | 'crane' | 'surge') => {
    if (preset === 'weather') { setDelayHours(8); setCranesDown(0); setVolumeSurge(0); setImpact(localImpact(8, 0, 0)); }
    else if (preset === 'crane') { setDelayHours(2); setCranesDown(3); setVolumeSurge(5); setImpact(localImpact(2, 3, 5)); }
    else if (preset === 'surge') { setDelayHours(4); setCranesDown(1); setVolumeSurge(35); setImpact(localImpact(4, 1, 35)); }
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const body = delayHours > 0
        ? { port_id: selectedPort.id, scenario_type: 'VESSEL_DELAY', parameters: { vessel_id: 'VS-001', delay_hours: delayHours } }
        : { port_id: selectedPort.id, scenario_type: 'CRANE_UNAVAILABLE', parameters: { crane_id: `CR-00${cranesDown}` } };

      const res = await fetch(apiUrl('/api/v1/scenarios/what-if'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const waitChange = data.differences?.waiting_time_change_hours ?? 0;
        const totalWait = data.scenario_metrics?.total_waiting_time_hours ?? 0;
        const vessels = data.scenario_metrics?.num_assignments ?? 0;
        setImpact({
          waitingHours: Math.max(0, waitChange).toFixed(1),
          queueVessels: vessels > 0 ? vessels : Math.round(12 + (delayHours * 0.5) + (cranesDown * 1.5) + (volumeSurge * 0.2)),
          estimatedDemurrage: (totalWait * 8 * 1450).toLocaleString(),
          bottleneckBerths: (data.affected_berths ?? []).slice(0, 2).length > 0
            ? data.affected_berths.slice(0, 2)
            : cranesDown >= 2 ? ['Berth 1 (Pier 400)', 'Berth 2 (Pier G)'] : ['Berth 1 (Pier 400)'],
          recommendation: (data.recommendations ?? []).join(' ') ||
            `Stagger arrivals by +${delayHours}h and redistribute crane allocation.`,
        });
      } else {
        setImpact(localImpact(delayHours, cranesDown, volumeSurge));
      }
    } catch {
      setImpact(localImpact(delayHours, cranesDown, volumeSurge));
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl fade-in-up">
      <PageHeader
        title="What-If Simulation"
        subtitle="Non-destructive scenario modelling to stress-test port resilience before committing to a plan"
      />

      {/* Preset buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-bold text-[#617080] uppercase tracking-wider">Preset Scenarios:</span>
        {[
          { key: 'weather', label: 'Fog / Weather Delay (+8h)' },
          { key: 'crane', label: 'Major Crane Outage (3 offline)' },
          { key: 'surge', label: 'Holiday Arrival Surge (+35%)' },
        ].map((p) => (
          <button
            key={p.key}
            onClick={() => applyPreset(p.key as 'weather' | 'crane' | 'surge')}
            className="px-3 py-1.5 text-[12px] font-medium bg-white hover:bg-[#F3F8FC] border border-[#DCE3E8] rounded-lg text-[#617080] transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>




      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-4 hl-card p-5 rounded-xl space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#DCE3E8]">
            <Sliders className="w-4 h-4 text-[#617080]" />
            <h3 className="text-[13px] font-bold text-[#071A2B]">Scenario Parameters</h3>
          </div>

          <div className="space-y-5">
            {[
              { label: 'Vessel Arrival Delay', value: delayHours, unit: 'hours', max: 24, step: 1, onChange: setDelayHours, format: (v: number) => `+${v}h`, warn: delayHours > 12 },
              { label: 'Cranes Unavailable', value: cranesDown, unit: 'of 10', max: 4, step: 1, onChange: setCranesDown, format: (v: number) => `${v}`, warn: cranesDown > 2 },
              { label: 'Arrival Volume Surge', value: volumeSurge, unit: '%', max: 50, step: 5, onChange: setVolumeSurge, format: (v: number) => `+${v}%`, warn: volumeSurge > 30 },
            ].map((param) => (
              <div key={param.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-medium text-[#617080]">{param.label}</span>
                  <span className={`text-[13px] font-bold ${param.warn ? 'text-[#DC2626]' : 'text-[#071A2B]'}`}>
                    {param.format(param.value)} <span className="text-[11px] font-normal text-[#617080]">{param.unit}</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={param.max}
                  step={param.step}
                  value={param.value}
                  onChange={(e) => param.onChange(Number(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: param.warn ? '#DC2626' : '#1677C8' }}
                />
                <div className="flex justify-between text-[10px] text-[#98A8B4] mt-1">
                  <span>0</span>
                  <span>{param.max / 2}</span>
                  <span>{param.max}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="w-full py-3 px-4 rounded-xl text-[13px] font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: '#071A2B' }}
          >
            <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            {isSimulating ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>

        {/* Results */}
        <div className="lg:col-span-8 space-y-5">
          {/* KPI impact */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Additional Wait Time', value: `+${impact.waitingHours}h`, sublabel: 'Per vessel, 72h window', color: '#DC2626', bg: '#FEE2E2' },
              { label: 'Anchorage Queue', value: `${impact.queueVessels}`, sublabel: 'Vessels waiting', color: '#D97706', bg: '#FEF3C7' },
              { label: 'Demurrage Exposure', value: `$${impact.estimatedDemurrage}`, sublabel: 'At $1,450/hr standard', color: '#617080', bg: '#F7F7F5' },
              { label: 'Bottleneck Berths', value: impact.bottleneckBerths.length.toString(), sublabel: impact.bottleneckBerths[0], color: '#145B8C', bg: '#DCEEFF' },
            ].map(item => (
              <div
                key={item.label}
                className="hl-card-flat p-4 rounded-xl"
                style={{ borderTop: `2px solid ${item.color}` }}
              >
                <p className="eyebrow mb-2">{item.label}</p>
                <p className="text-2xl font-bold tabular-nums" style={{ color: item.color }}>{item.value}</p>
                <p className="text-[11px] text-[#617080] mt-1">{item.sublabel}</p>
              </div>
            ))}
          </div>

          {/* Before/after comparison */}
          <ComparisonTimeline impact={impact} delayHours={delayHours} />

          {/* Recommendation */}
          <div className="hl-card p-4 rounded-xl flex items-start gap-3" style={{ borderLeft: '3px solid #1677C8' }}>
            <CheckCircle2 className="w-5 h-5 text-[#1677C8] shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-[#1677C8] uppercase tracking-wider mb-1.5">AI Recommendation</p>
              <p className="text-[13px] text-[#617080] leading-relaxed">{impact.recommendation}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
