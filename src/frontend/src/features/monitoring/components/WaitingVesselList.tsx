import { Clock } from 'lucide-react';
import type { Vessel } from '@/types/vessel';
import { EmptyState } from '@/components/EmptyState';
import { ListSkeleton } from '@/components/LoadingSkeleton';

function formatWaiting(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function waitingToClass(minutes: number): string {
  if (minutes >= 300) return 'text-[#e53e3e] font-semibold';
  if (minutes >= 180) return 'text-[#f59e0b]';
  return 'text-[#6b8899]';
}

interface WaitingVesselListProps {
  vessels: Vessel[];
  isLoading: boolean;
  onSelectVessel: (vessel: Vessel) => void;
}

export function WaitingVesselList({ vessels, isLoading, onSelectVessel }: WaitingVesselListProps) {
  if (isLoading) return <ListSkeleton rows={5} />;

  const waiting = vessels
    .filter((v) => v.status === 'WAITING')
    .sort((a, b) => (b.waitingMinutes ?? 0) - (a.waitingMinutes ?? 0));

  if (waiting.length === 0) {
    return <EmptyState message="No vessels currently waiting." />;
  }

  return (
    <div className="space-y-0.5 divide-y divide-[#d1e0ea]">
      {waiting.map((vessel, idx) => (
        <button
          key={vessel.id}
          onClick={() => onSelectVessel(vessel)}
          className="w-full flex items-center gap-3 py-2.5 px-1 hover:bg-[#f4f8fb] rounded-sm transition-colors text-left"
          aria-label={`${vessel.name}, waiting ${vessel.waitingMinutes ? formatWaiting(vessel.waitingMinutes) : 'unknown time'}`}
        >
          {/* Rank */}
          <span className="text-xs font-mono text-[#9eb5c1] w-4 shrink-0 text-right">
            {idx + 1}
          </span>

          {/* Vessel name */}
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-[#0d1f2d] truncate block">
              {vessel.name}
            </span>
            <span className="text-[10px] text-[#9eb5c1] uppercase tracking-wider">
              {vessel.type === 'RO_RO' ? 'Ro-Ro' : vessel.type.charAt(0) + vessel.type.slice(1).toLowerCase()}
            </span>
          </div>

          {/* Waiting time */}
          <div
            className={`flex items-center gap-1 tabular-nums shrink-0 ${
              vessel.waitingMinutes !== undefined ? waitingToClass(vessel.waitingMinutes) : 'text-[#6b8899]'
            }`}
          >
            <Clock className="w-3 h-3 shrink-0" />
            <span className="text-xs">
              {vessel.waitingMinutes !== undefined ? formatWaiting(vessel.waitingMinutes) : '—'}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
