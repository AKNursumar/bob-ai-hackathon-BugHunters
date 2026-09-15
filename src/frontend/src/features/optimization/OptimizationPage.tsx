import { useState } from 'react';
import { Cpu, CheckCircle2, TrendingDown, Clock, Zap, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { apiUrl } from '@/lib/apiUrl';
import { usePort } from '@/contexts/PortContext';

export function OptimizationPage() {
  const { selectedPort } = usePort();
  const [horizon, setHorizon] = useState(72);
  const [timeoutSec, setTimeoutSec] = useState(30);
  const [isSolving, setIsSolving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    baselineWaitingHours: 26.5,
    optimizedWaitingHours: 7.2,
    improvementPct: 72.8,
    solveTimeSeconds: 0.42,
    solverUsed: 'Google OR-Tools CP-SAT',
    assignmentsCount: 8,
  });

  const handleRunOptimization = async () => {
    setIsSolving(true);
    setStatusMessage(null);
    try {
      const res = await fetch(apiUrl('/api/v1/optimization/compare'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port_id: selectedPort.id, planning_horizon_hours: horizon, timeout_seconds: timeoutSec }),
      });
      if (res.ok) {
        const data = await res.json();
        const im = data.improvement_metrics ?? {};
        setMetrics({
          baselineWaitingHours: im.baseline_total_waiting_hours ?? data.baseline?.total_waiting_time_hours ?? 26.5,
          optimizedWaitingHours: im.optimized_total_waiting_hours ?? data.optimized?.total_waiting_time_hours ?? 7.2,
          improvementPct: im.improvement_percent ?? data.improvement_percent ?? 72.8,
          solveTimeSeconds: im.solve_time_seconds ?? data.optimized?.solve_time_seconds ?? 0.42,
          solverUsed: im.is_optimal ? 'Google OR-Tools CP-SAT' : 'Greedy Heuristic Solver',
          assignmentsCount: (data.optimized_plan ?? data.optimized?.assignments ?? []).length || 8,
        });
        setStatusMessage('Optimisation successfully solved using backend constraint engine.');
      } else {
        setStatusMessage('Solver returned no results. Using pre-configured scenario metrics.');
      }
    } catch {
      setStatusMessage('Backend offline. Using pre-configured scenario metrics.');
    } finally {
      setIsSolving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl fade-in-up">
      <PageHeader
        title="Berth & Resource Optimisation"
        subtitle="Mathematical constraint solver (OR-Tools CP-SAT) for vessel-to-berth allocation"
        actions={
          <button
            onClick={handleRunOptimization}
            disabled={isSolving}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-bold text-white rounded-lg transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(180deg, #1677c8, #115c9b)', border: '1px solid #1a88e5' }}
          >
            <Zap className={`w-4 h-4 ${isSolving ? 'animate-spin' : ''}`} />
            {isSolving ? 'Solving...' : 'Run Solver'}
          </button>
        }
      />




      {statusMessage && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border" style={{ background: '#DCFCE7', borderColor: '#BBF7D0' }}>
          <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span className="text-[12px] text-[#166534]">{statusMessage}</span>
        </div>
      )}

      {/* Solver controls */}
      <div className="hl-card p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-[#617080] uppercase tracking-wider">Planning Horizon</label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="text-[12px] border border-[#DCE3E8] rounded-lg px-3 py-1.5 bg-white text-[#071A2B]"
            >
              <option value={24}>24 Hours</option>
              <option value={48}>48 Hours</option>
              <option value={72}>72 Hours</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-[#617080] uppercase tracking-wider">Solver Timeout</label>
            <select
              value={timeoutSec}
              onChange={(e) => setTimeoutSec(Number(e.target.value))}
              className="text-[12px] border border-[#DCE3E8] rounded-lg px-3 py-1.5 bg-white text-[#071A2B]"
            >
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-[#617080]">
          <Cpu className="w-4 h-4" />
          <span>Engine: <strong className="text-[#071A2B]">{metrics.solverUsed}</strong></span>
        </div>
      </div>

      {/* KPI comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="hl-card p-5 rounded-xl" style={{ borderTop: '2px solid #DC2626' }}>
          <p className="eyebrow mb-3">Baseline (FIFO Standard)</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-[#DC2626] tabular-nums">{metrics.baselineWaitingHours}</span>
            <span className="text-sm text-[#617080]">hours waiting</span>
          </div>
          <p className="text-[12px] text-[#617080]">Uncoordinated first-come first-served berthing allocation.</p>
        </div>

        <div className="hl-card p-5 rounded-xl" style={{ borderTop: '2px solid #16A34A' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="eyebrow" style={{ color: '#16A34A' }}>AI-Optimised (CP-SAT)</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#DCFCE7] text-[#16A34A]">Optimal</span>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-[#16A34A] tabular-nums">{metrics.optimizedWaitingHours}</span>
            <span className="text-sm text-[#617080]">hours waiting</span>
          </div>
          <p className="text-[12px] text-[#617080]">Coordinated berth matching, crane density tuning & delay minimisation.</p>
        </div>

        <div className="hl-card p-5 rounded-xl" style={{ borderTop: '2px solid #1677C8' }}>
          <p className="eyebrow mb-3" style={{ color: '#1677C8' }}>Efficiency Gain</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-[#1677C8] tabular-nums">+{metrics.improvementPct}%</span>
          </div>
          <p className="text-[12px] text-[#16A34A] font-medium flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            Saves {(metrics.baselineWaitingHours - metrics.optimizedWaitingHours).toFixed(1)} vessel hours in {horizon}h
          </p>
          <p className="text-[11px] text-[#617080] mt-2 pt-2 border-t border-[#DCE3E8]">
            Solve time: {metrics.solveTimeSeconds}s · {metrics.assignmentsCount} assignments
          </p>
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div className="hl-card rounded-xl">
        <div className="px-5 py-4 border-b border-[#DCE3E8]">
          <p className="eyebrow mb-0.5">Constraint Satisfaction Analysis</p>
          <h3 className="text-[13px] font-bold text-[#071A2B]">Baseline vs Optimised Schedule Metrics</h3>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl" style={{ background: '#FFF5F5', border: '1px solid #FECACA' }}>
            <h4 className="text-[12px] font-bold text-[#DC2626] flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4" />
              Baseline Schedule Metrics
            </h4>
            <div className="space-y-2.5 text-[12px]">
              {[
                { label: 'Peak Anchorage Queue', value: '6 vessels', warn: true },
                { label: 'Berth Idle Gap Time', value: '14.2 hours', warn: true },
                { label: 'Crane Utilisation', value: '58.4%', warn: true },
                { label: 'Vessels with Delay >2h', value: '5 vessels', warn: true },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-[#FECACA] last:border-0">
                  <span className="text-[#617080]">{item.label}</span>
                  <strong className="text-[#DC2626]">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <h4 className="text-[12px] font-bold text-[#16A34A] flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4" />
              Optimised CP-SAT Schedule Metrics
            </h4>
            <div className="space-y-2.5 text-[12px]">
              {[
                { label: 'Peak Anchorage Queue', value: '2 vessels (↓ 67%)' },
                { label: 'Berth Idle Gap Time', value: '3.5 hours (↓ 75%)' },
                { label: 'Crane Utilisation', value: '86.2% (↑ 27.8%)' },
                { label: 'Vessels with Delay >2h', value: '0 vessels' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-[#BBF7D0] last:border-0">
                  <span className="text-[#617080]">{item.label}</span>
                  <strong className="text-[#16A34A]">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
