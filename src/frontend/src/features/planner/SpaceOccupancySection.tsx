import { Clock3, Layers3, Play, ShieldAlert } from 'lucide-react';
import { BerthOccupancyBar } from './BerthOccupancyBar';

export type SpaceOpportunity = {
  berth_id: string;
  existing_vessel_ids: string[];
  candidate_vessel_ids: string[];
  usable_length_m: number;
  occupied_length_m: number;
  available_length_m: number;
  required_length_m: number;
  remaining_length_m: number;
  time_window_start?: string;
  time_window_end?: string;
  required_cranes: number;
  available_cranes: number;
  resource_feasible: boolean;
  status: 'FEASIBLE' | 'CONDITIONALLY_FEASIBLE' | 'NOT_FEASIBLE';
  explanation: string;
  estimated_waiting_time_saved_hours?: number;
};

type Props = {
  berths: Array<{
    berth_id: string;
    berth_name: string;
    supports_parallel_berthing: boolean;
    usable_length_m?: number;
    occupied_length_m?: number;
    available_length_m?: number;
    opportunities: SpaceOpportunity[];
    analysis_status: string;
  }>;
  isLoading: boolean;
  onApply: (opportunity: SpaceOpportunity) => void;
  isApplying: boolean;
};

export function SpaceOccupancySection({ berths, isLoading, onApply, isApplying }: Props) {
  const opportunities = berths.flatMap((berth) => berth.opportunities.map((opportunity) => ({ berth, opportunity })));
  const totalRecoverable = opportunities.reduce((sum, item) => sum + item.opportunity.required_length_m, 0);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow mb-1">Space intelligence</p>
          <h2 className="text-[16px] font-bold text-[#071A2B]">Parallel berthing opportunities</h2>
          <p className="mt-1 text-[12px] text-[#617080]">Unused spatial capacity identified from scheduled assignments and waiting vessels.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#16A34A]">{opportunities.length}</p>
          <p className="text-[10px] text-[#617080]">opportunities · {Math.round(totalRecoverable)}m recoverable</p>
        </div>
      </div>

      {isLoading && <div className="hl-card p-5 text-[12px] text-[#617080]">Analyzing berth dimensions, time windows, and crane availability...</div>}
      {!isLoading && opportunities.length === 0 && (
        <div className="hl-card flex items-center gap-3 p-5 text-[12px] text-[#617080]">
          <ShieldAlert className="h-4 w-4" /> No feasible parallel berthing opportunities found in the current 72-hour window.
        </div>
      )}
      {opportunities.map(({ berth, opportunity }) => (
        <article key={`${opportunity.berth_id}-${opportunity.candidate_vessel_ids.join('-')}`} className="hl-card border-l-4 border-l-[#16A34A] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow mb-1">Space recovery opportunity</p>
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-[#071A2B]"><Layers3 className="h-4 w-4 text-[#1677C8]" />{berth.berth_id} · {berth.berth_name}</h3>
              <p className="mt-1 text-[11px] text-[#617080]">Existing: {opportunity.existing_vessel_ids.join(', ') || 'No active assignment'}</p>
            </div>
            <span className={`rounded px-2 py-1 text-[10px] font-bold ${opportunity.status === 'FEASIBLE' ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
              {opportunity.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="mt-4"><BerthOccupancyBar usableLength={opportunity.usable_length_m} occupiedLength={opportunity.occupied_length_m} proposedLength={opportunity.required_length_m} remainingLength={opportunity.remaining_length_m} /></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div><p className="eyebrow mb-2">Candidate vessels</p>{opportunity.candidate_vessel_ids.map((id) => <p key={id} className="text-[12px] font-semibold text-[#071A2B]">✓ {id}</p>)}</div>
            <div className="text-[11px] text-[#617080]">
              <p className="flex items-center gap-1"><Clock3 className="h-3 w-3" />{opportunity.time_window_start ? new Date(opportunity.time_window_start).toLocaleString() : 'Window available'} → {opportunity.time_window_end ? new Date(opportunity.time_window_end).toLocaleString() : '72h horizon'}</p>
              <p className="mt-1">Crane capacity: {opportunity.available_cranes} available / {opportunity.required_cranes} required</p>
              {opportunity.estimated_waiting_time_saved_hours !== undefined && <p className="mt-1 font-semibold text-[#16A34A]">Calculated waiting reduction: {opportunity.estimated_waiting_time_saved_hours}h</p>}
            </div>
          </div>
          <p className="mt-4 border-t border-[#DCE3E8] pt-3 text-[11px] leading-5 text-[#3A5468]">{opportunity.explanation}</p>
          <button onClick={() => onApply(opportunity)} disabled={isApplying || opportunity.status !== 'FEASIBLE'} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#071A2B] px-4 py-2 text-[11px] font-bold text-white disabled:opacity-50"><Play className="h-3.5 w-3.5" />{isApplying ? 'Re-optimising...' : 'Apply to 72h Plan'}</button>
        </article>
      ))}
    </section>
  );
}
