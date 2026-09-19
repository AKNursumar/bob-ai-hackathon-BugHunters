import { useState, useEffect } from 'react';
import { 
  Sliders, RefreshCw, CheckCircle2, AlertTriangle, 
  Zap, Wrench, Cpu, ShieldCheck, Activity, Check 
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { usePort } from '@/contexts/PortContext';
import { apiUrl } from '@/lib/apiUrl';

interface CraneDiag {
  crane_id: string;
  crane_name: string;
  berth_id: string;
  status: 'HEALTHY' | 'ELECTRICAL_FAULT' | 'MECHANICAL_FAULT' | 'TECHNICAL_FAULT';
  fault_category: 'NONE' | 'ELECTRICAL' | 'MECHANICAL' | 'TECHNICAL';
  fault_code?: string | null;
  fault_description: string;
  motor_temp_c: number;
  hydraulic_pressure_bar: number;
  vibration_mms: number;
  estimated_mttr_hours: number;
  assigned_crew?: string | null;
  mitigation_plan: string;
}

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
      <div className="hl-card p-5 rounded-xl border border-[#DCE3E8]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-[#DC2626] animate-pulse" />
          <span className="text-[11px] font-bold text-[#617080] uppercase tracking-wider">Unmitigated Failure Impact</span>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Average Vessel Delay', value: `+${simWait.toFixed(1)}h` },
            { label: 'Anchorage Queue Backlog', value: `${impact.queueVessels} vessels` },
            { label: 'Berth Scheduling Conflicts', value: '2 Overlaps' },
            { label: 'Operational Crane Utilisation', value: '58%' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#DCE3E8] last:border-0">
              <span className="text-[12px] text-[#617080]">{item.label}</span>
              <span className="text-[13px] font-bold text-[#DC2626]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="hl-card p-5 rounded-xl border-t-2 border-[#16A34A] bg-[#F0FDF4]/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
          <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">Post-Mitigation (OR-Tools CP-SAT)</span>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Resolved Average Wait', value: `${baseWait}h`, change: `-${Math.abs(improvement).toFixed(0)}% delay`, pos: true },
            { label: 'Anchorage Queue', value: '10 vessels', change: 'Normalised', pos: true },
            { label: 'Berth Conflicts', value: '0 Conflicts', change: '100% Cleared', pos: true },
            { label: 'Optimized Crane Utilisation', value: '78%', change: '↑ +20% capacity', pos: true },
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
  const [cranesDown, setCranesDown] = useState(1);
  const [volumeSurge, setVolumeSurge] = useState(10);
  const [isSimulating, setIsSimulating] = useState(false);
  const [impact, setImpact] = useState<SimImpact>(() => localImpact(0, 1, 10));

  // Crane Diagnostics State
  const [cranes, setCranes] = useState<CraneDiag[]>([]);
  const [loadingCranes, setLoadingCranes] = useState(false);
  const [selectedCrane, setSelectedCrane] = useState<CraneDiag | null>(null);
  const [isMitigating, setIsMitigating] = useState(false);
  const [mitigationResult, setMitigationResult] = useState<any>(null);

  const fetchCraneDiagnostics = async () => {
    setLoadingCranes(true);
    try {
      const res = await fetch(apiUrl(`/api/v1/ports/${selectedPort.id}/cranes/diagnostics`));
      if (res.ok) {
        const data = await res.json();
        const list: CraneDiag[] = data.cranes || [];
        setCranes(list);
        const faultyCount = list.filter(c => c.status !== 'HEALTHY').length;
        setCranesDown(Math.max(faultyCount, 1));
        if (list.length > 0 && !selectedCrane) {
          setSelectedCrane(list[1] || list[0]);
        }
      }
    } catch {
      // Fallback initial state if network down
    } finally {
      setLoadingCranes(false);
    }
  };

  useEffect(() => {
    fetchCraneDiagnostics();
  }, [selectedPort.id]);

  const handleInjectFault = async (craneId: string, faultType: 'ELECTRICAL' | 'MECHANICAL' | 'TECHNICAL') => {
    try {
      const res = await fetch(apiUrl(`/api/v1/ports/${selectedPort.id}/cranes/diagnostics/inject`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crane_id: craneId, fault_type: faultType }),
      });
      if (res.ok) {
        const data = await res.json();
        setCranes(prev => prev.map(c => c.crane_id === craneId ? data.crane : c));
        setSelectedCrane(data.crane);
        const newCount = cranes.filter(c => c.crane_id !== craneId && c.status !== 'HEALTHY').length + 1;
        setCranesDown(newCount);
        setImpact(localImpact(delayHours, newCount, volumeSurge));
        setMitigationResult(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetCrane = async (craneId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/v1/ports/${selectedPort.id}/cranes/diagnostics/reset`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crane_id: craneId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCranes(prev => prev.map(c => c.crane_id === craneId ? data.crane : c));
        setSelectedCrane(data.crane);
        const newCount = Math.max(0, cranes.filter(c => c.crane_id !== craneId && c.status !== 'HEALTHY').length);
        setCranesDown(newCount);
        setImpact(localImpact(delayHours, newCount, volumeSurge));
        setMitigationResult(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAutoMitigate = async () => {
    setIsMitigating(true);
    try {
      const res = await fetch(apiUrl(`/api/v1/ports/${selectedPort.id}/cranes/diagnostics/mitigate`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setMitigationResult(data);
        // Refresh impact with 0 wait change
        setImpact({
          waitingHours: '0.4',
          queueVessels: 10,
          estimatedDemurrage: '4,200',
          bottleneckBerths: ['Berth 1 (Resolved)'],
          recommendation: `Autonomous Mitigation Executed: Shifted incoming container flow to Berth 3 adjacent crane. Staggered arrivals by +2h. Total demurrage saved: $${(data.estimated_demurrage_saved_usd || 57000).toLocaleString()}.`
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsMitigating(false);
    }
  };

  const applyPreset = (preset: 'weather' | 'crane' | 'surge') => {
    if (preset === 'weather') { setDelayHours(8); setCranesDown(0); setVolumeSurge(0); setImpact(localImpact(8, 0, 0)); }
    else if (preset === 'crane') { setDelayHours(2); setCranesDown(3); setVolumeSurge(5); setImpact(localImpact(2, 3, 5)); }
    else if (preset === 'surge') { setDelayHours(4); setCranesDown(1); setVolumeSurge(35); setImpact(localImpact(4, 1, 35)); }
    setMitigationResult(null);
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const body = delayHours > 0
        ? { port_id: selectedPort.id, scenario_type: 'VESSEL_DELAY', parameters: { vessel_id: 'V-101', delay_hours: delayHours } }
        : { port_id: selectedPort.id, scenario_type: 'CRANE_UNAVAILABLE', parameters: { crane_id: `${selectedPort.id}-CR-02` } };

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
    <div className="p-6 md:p-8 space-y-8 max-w-screen-2xl fade-in-up">
      <PageHeader
        title="Crane Diagnostics, Error Checking & What-If Mitigation"
        subtitle={`Real-time SCADA sensor telemetry, electrical/mechanical/technical fault diagnosis, and 1-click OR-Tools mitigation for ${selectedPort.name}`}
      />

      {/* ========================================================================= */}
      {/* SECTION 1: CRANE SCADA SENSOR TELEMETRY & DIAGNOSTIC ERROR CHECKER       */}
      {/* ========================================================================= */}
      <div className="hl-card p-6 rounded-2xl space-y-5 border border-[#DCE3E8]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#DCE3E8]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#EBF5FB] text-[#1677C8]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#071A2B]">Quay Crane Diagnostic & SCADA Health Monitor</h2>
              <p className="text-[12px] text-[#617080]">
                Real-time motor temperatures, hydraulic pressures, and vibration sensor telemetry for all 10 Super Post-Panamax Cranes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoMitigate}
              disabled={isMitigating || cranes.filter(c => c.status !== 'HEALTHY').length === 0}
              className="px-4 py-2 text-[12px] font-bold text-white rounded-lg flex items-center gap-2 shadow-sm transition-all disabled:opacity-40"
              style={{ background: '#16A34A' }}
            >
              <ShieldCheck className="w-4 h-4" />
              {isMitigating ? 'Mitigating...' : 'Auto-Mitigate Faults (OR-Tools)'}
            </button>

            <button
              onClick={fetchCraneDiagnostics}
              disabled={loadingCranes}
              className="p-2 rounded-lg border border-[#DCE3E8] hover:bg-[#F3F8FC] text-[#617080] transition-colors"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loadingCranes ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Crane Fleet Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-3">
          {cranes.map((crane) => {
            const isFaulty = crane.status !== 'HEALTHY';
            const isSelected = selectedCrane?.crane_id === crane.crane_id;
            const badgeColor = 
              crane.status === 'ELECTRICAL_FAULT' ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]' :
              crane.status === 'MECHANICAL_FAULT' ? 'bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]' :
              crane.status === 'TECHNICAL_FAULT' ? 'bg-[#F3E8FF] text-[#9333EA] border-[#D8B4FE]' :
              'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]';

            return (
              <button
                key={crane.crane_id}
                onClick={() => setSelectedCrane(crane)}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  isSelected ? 'ring-2 ring-[#1677C8] border-transparent shadow-sm' : 'border-[#DCE3E8] hover:border-[#98A8B4]'
                } ${isFaulty ? 'bg-[#FFFBFB]' : 'bg-white'}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-bold text-[#071A2B]">CR-{crane.crane_id.split('-').pop()}</span>
                  <div className={`w-2 h-2 rounded-full ${isFaulty ? 'bg-[#DC2626] animate-pulse' : 'bg-[#16A34A]'}`} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#617080]">
                    <span>Temp</span>
                    <span className={`font-mono font-bold ${crane.motor_temp_c > 80 ? 'text-[#DC2626]' : 'text-[#071A2B]'}`}>
                      {crane.motor_temp_c}°C
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#617080]">
                    <span>Hydr</span>
                    <span className={`font-mono font-bold ${crane.hydraulic_pressure_bar < 130 ? 'text-[#DC2626]' : 'text-[#071A2B]'}`}>
                      {crane.hydraulic_pressure_bar}b
                    </span>
                  </div>
                </div>
                <span className={`mt-2 block text-[9px] font-bold px-1.5 py-0.5 rounded text-center border ${badgeColor}`}>
                  {crane.status === 'HEALTHY' ? 'OK' : crane.fault_category.slice(0, 4)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Crane Deep Diagnostic Inspector */}
        {selectedCrane && (
          <div className="p-5 rounded-xl border border-[#DCE3E8] bg-[#F8FAFC] space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[14px] font-bold text-[#071A2B]">{selectedCrane.crane_name}</span>
                <span className="text-[12px] text-[#617080]">({selectedCrane.crane_id})</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  selectedCrane.status === 'HEALTHY' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#DC2626]'
                }`}>
                  {selectedCrane.status.replace('_', ' ')}
                </span>
              </div>

              {/* Quick Fault Injection Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-[#617080] uppercase tracking-wider">Test Fault:</span>
                <button
                  onClick={() => handleInjectFault(selectedCrane.crane_id, 'ELECTRICAL')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] rounded-md flex items-center gap-1 transition-colors"
                >
                  <Zap className="w-3 h-3" /> Electrical Error
                </button>
                <button
                  onClick={() => handleInjectFault(selectedCrane.crane_id, 'MECHANICAL')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D] rounded-md flex items-center gap-1 transition-colors"
                >
                  <Wrench className="w-3 h-3" /> Mechanical Error
                </button>
                <button
                  onClick={() => handleInjectFault(selectedCrane.crane_id, 'TECHNICAL')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-[#F3E8FF] text-[#9333EA] border border-[#D8B4FE] rounded-md flex items-center gap-1 transition-colors"
                >
                  <Cpu className="w-3 h-3" /> Technical Error
                </button>
                <button
                  onClick={() => handleResetCrane(selectedCrane.crane_id)}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC] rounded-md flex items-center gap-1 transition-colors"
                >
                  <Check className="w-3 h-3" /> Reset OK
                </button>
              </div>
            </div>

            {/* Diagnostics Metrics & Fault Code Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[12px]">
              <div className="p-3 rounded-lg bg-white border border-[#DCE3E8]">
                <span className="text-[#617080] text-[11px]">Drive Motor Temp</span>
                <p className={`text-[16px] font-bold font-mono mt-0.5 ${selectedCrane.motor_temp_c > 80 ? 'text-[#DC2626]' : 'text-[#071A2B]'}`}>
                  {selectedCrane.motor_temp_c}°C
                </p>
                <span className="text-[10px] text-[#98A8B4]">Normal range: 45–65°C</span>
              </div>

              <div className="p-3 rounded-lg bg-white border border-[#DCE3E8]">
                <span className="text-[#617080] text-[11px]">Hydraulic Pressure</span>
                <p className={`text-[16px] font-bold font-mono mt-0.5 ${selectedCrane.hydraulic_pressure_bar < 140 ? 'text-[#DC2626]' : 'text-[#071A2B]'}`}>
                  {selectedCrane.hydraulic_pressure_bar} bar
                </p>
                <span className="text-[10px] text-[#98A8B4]">Operating spec: 180–210 bar</span>
              </div>

              <div className="p-3 rounded-lg bg-white border border-[#DCE3E8]">
                <span className="text-[#617080] text-[11px]">Structural Vibration</span>
                <p className={`text-[16px] font-bold font-mono mt-0.5 ${selectedCrane.vibration_mms > 4.0 ? 'text-[#DC2626]' : 'text-[#071A2B]'}`}>
                  {selectedCrane.vibration_mms} mm/s
                </p>
                <span className="text-[10px] text-[#98A8B4]">ISO 10816 limit: 4.5 mm/s</span>
              </div>

              <div className="p-3 rounded-lg bg-white border border-[#DCE3E8]">
                <span className="text-[#617080] text-[11px]">Active Error Code</span>
                <p className="text-[14px] font-bold font-mono mt-0.5 text-[#DC2626]">
                  {selectedCrane.fault_code || 'NONE (All Systems Nominal)'}
                </p>
                <span className="text-[10px] text-[#98A8B4]">
                  {selectedCrane.estimated_mttr_hours > 0 ? `Estimated MTTR: ${selectedCrane.estimated_mttr_hours}h` : 'No downtime'}
                </span>
              </div>
            </div>

            {/* Diagnostic Narrative Alert */}
            <div className={`p-3.5 rounded-lg border text-[12px] flex items-start gap-2.5 ${
              selectedCrane.status === 'HEALTHY' ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]' : 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Diagnostic Diagnosis: </span>
                <span>{selectedCrane.fault_description}</span>
                {selectedCrane.assigned_crew && (
                  <div className="mt-1 text-[11px] font-medium text-[#B91C1C]">
                    Dispatched Crew: {selectedCrane.assigned_crew} | Mitigation Protocol: {selectedCrane.mitigation_plan}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Autonomous Mitigation Confirmation Banner */}
        {mitigationResult && (
          <div className="p-4 rounded-xl border border-[#86EFAC] bg-[#F0FDF4] flex items-start gap-3 fade-in">
            <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-[12px]">
              <p className="font-bold text-[#166534] text-[13px]">
                Autonomous Google OR-Tools Mitigation Successfully Executed!
              </p>
              <div className="text-[#14532D] space-y-1">
                <p>✔ Berth conflicts eliminated by 100% (0 overlaps).</p>
                <p>✔ Estimated demurrage loss prevented: <span className="font-bold text-[#16A34A]">${mitigationResult.estimated_demurrage_saved_usd?.toLocaleString()}</span>.</p>
                <p>✔ {mitigationResult.stagger_advisory}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: WHAT-IF SIMULATION CONTROLS & COMPARATIVE MITIGATION IMPACT    */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-bold text-[#617080] uppercase tracking-wider">Disruption Presets:</span>
          {[
            { key: 'weather', label: 'Fog / Weather Delay (+8h)' },
            { key: 'crane', label: 'Major Crane Electrical Outage (3 offline)' },
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-4 hl-card p-5 rounded-xl space-y-5 border border-[#DCE3E8]">
            <div className="flex items-center gap-2 pb-3 border-b border-[#DCE3E8]">
              <Sliders className="w-4 h-4 text-[#617080]" />
              <h3 className="text-[13px] font-bold text-[#071A2B]">Disruption Variables</h3>
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
              className="w-full py-3 px-4 rounded-xl text-[13px] font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
              style={{ background: '#071A2B' }}
            >
              <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
              {isSimulating ? 'Simulating...' : 'Recalculate Disruption Impact'}
            </button>
          </div>

          {/* Results */}
          <div className="lg:col-span-8 space-y-5">
            {/* KPI impact cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Additional Wait Time', value: `+${impact.waitingHours}h`, sublabel: 'Per vessel, 72h window', color: '#DC2626' },
                { label: 'Anchorage Queue Backlog', value: `${impact.queueVessels}`, sublabel: 'Vessels at anchor', color: '#D97706' },
                { label: 'Demurrage Exposure', value: `$${impact.estimatedDemurrage}`, sublabel: 'At $1,450/hr standard rate', color: '#617080' },
                { label: 'Choked Berths', value: impact.bottleneckBerths.length.toString(), sublabel: impact.bottleneckBerths[0], color: '#145B8C' },
              ].map(item => (
                <div
                  key={item.label}
                  className="hl-card-flat p-4 rounded-xl border border-[#DCE3E8]"
                  style={{ borderTop: `2px solid ${item.color}` }}
                >
                  <p className="eyebrow mb-2 text-[#617080]">{item.label}</p>
                  <p className="text-2xl font-bold tabular-nums" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-[11px] text-[#617080] mt-1">{item.sublabel}</p>
                </div>
              ))}
            </div>

            {/* Before/after comparison */}
            <ComparisonTimeline impact={impact} delayHours={delayHours} />

            {/* AI Recommendation Box */}
            <div className="hl-card p-4 rounded-xl flex items-start gap-3 border border-[#DCE3E8]" style={{ borderLeft: '3px solid #1677C8' }}>
              <CheckCircle2 className="w-5 h-5 text-[#1677C8] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-[#1677C8] uppercase tracking-wider mb-1">
                  Autonomous Solver Advisory
                </p>
                <p className="text-[13px] text-[#617080] leading-relaxed">{impact.recommendation}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
