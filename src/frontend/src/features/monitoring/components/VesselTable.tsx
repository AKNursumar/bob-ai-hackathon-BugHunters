import { cn } from '@/lib/utils';
import type { Vessel } from '@/types/vessel';
import type { Berth } from '@/types/berth';
import type { VesselFilterState } from './VesselFilters';
import { VesselStatusBadge } from './VesselStatusBadge';
import { VesselFilters } from './VesselFilters';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { formatDateTime } from '@/lib/format';

const VESSEL_TYPE_LABELS: Record<string, string> = {
  CONTAINER: 'Container',
  TANKER: 'Tanker',
  BULK: 'Bulk',
  RO_RO: 'Ro-Ro',
  OTHER: 'Other',
};

function formatWaiting(minutes: number | undefined): string {
  if (minutes === undefined) return '—';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Apply filters to a vessel list */
export function filterVessels(vessels: Vessel[], filters: VesselFilterState): Vessel[] {
  const query = filters.search.trim().toLowerCase();

  return vessels.filter((v) => {
    if (filters.status !== 'ALL' && v.status !== filters.status) return false;
    if (filters.type !== 'ALL' && v.type !== filters.type) return false;
    if (filters.berthId !== 'ALL' && v.berthId !== filters.berthId) return false;
    if (query) {
      const searchTarget = [v.name, v.imo, v.mmsi]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!searchTarget.includes(query)) return false;
    }
    return true;
  });
}

interface VesselTableProps {
  vessels: Vessel[];
  berths: Berth[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  filters: VesselFilterState;
  onFiltersChange: (f: VesselFilterState) => void;
  onSelectVessel: (vessel: Vessel) => void;
  selectedVesselId?: string;
}

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="h-4 bg-[#d1e0ea] rounded flex-[3]" />
          <div className="h-4 bg-[#d1e0ea] rounded flex-[1]" />
          <div className="h-4 bg-[#d1e0ea] rounded flex-[1.5]" />
          <div className="h-4 bg-[#d1e0ea] rounded flex-[2]" />
          <div className="h-4 bg-[#d1e0ea] rounded flex-[1.5]" />
          <div className="h-4 bg-[#d1e0ea] rounded flex-[1]" />
          <div className="h-4 bg-[#d1e0ea] rounded flex-[2]" />
        </div>
      ))}
    </div>
  );
}

export function VesselTable({
  vessels,
  berths,
  isLoading,
  isError,
  onRetry,
  filters,
  onFiltersChange,
  onSelectVessel,
  selectedVesselId,
}: VesselTableProps) {
  const availableBerths = berths.map((b) => ({ id: b.id, name: b.name }));
  const filtered = isLoading || isError ? [] : filterVessels(vessels, filters);

  return (
    <div>
      {/* Filter bar */}
      <div className="px-4 py-3 border-b border-[#d1e0ea] bg-[#f4f8fb]">
        <VesselFilters
          filters={filters}
          onChange={onFiltersChange}
          availableBerths={availableBerths}
        />
      </div>

      {/* Table area */}
      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <ErrorState
          message="Vessel activity data is currently unavailable."
          onRetry={onRetry}
        />
      ) : filtered.length === 0 ? (
        <EmptyState message="No vessel activity is available." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs" aria-label="Vessel activity table">
            <thead>
              <tr className="border-b border-[#d1e0ea] bg-[#f4f8fb]">
                <th className="text-left px-4 py-2.5 font-semibold text-[#6b8899] uppercase tracking-wider">
                  Vessel
                </th>
                <th className="text-left px-3 py-2.5 font-semibold text-[#6b8899] uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-3 py-2.5 font-semibold text-[#6b8899] uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-3 py-2.5 font-semibold text-[#6b8899] uppercase tracking-wider">
                  ETA
                </th>
                <th className="text-left px-3 py-2.5 font-semibold text-[#6b8899] uppercase tracking-wider">
                  Berth
                </th>
                <th className="text-left px-3 py-2.5 font-semibold text-[#6b8899] uppercase tracking-wider">
                  Waiting
                </th>
                <th className="text-left px-3 py-2.5 font-semibold text-[#6b8899] uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((vessel) => {
                const isSelected = vessel.id === selectedVesselId;
                return (
                  <tr
                    key={vessel.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectVessel(vessel)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') onSelectVessel(vessel);
                    }}
                    className={cn(
                      'border-b border-[#d1e0ea] transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-[#e6faf9]'
                        : 'hover:bg-[#f4f8fb]'
                    )}
                    aria-selected={isSelected}
                  >
                    {/* Vessel name + identifiers */}
                    <td className="px-4 py-2.5">
                      <span className="font-semibold text-[#0d1f2d]">{vessel.name}</span>
                      {vessel.imo && (
                        <span className="block text-[10px] font-mono text-[#9eb5c1]">
                          IMO {vessel.imo}
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-[#3a5468]">
                      {VESSEL_TYPE_LABELS[vessel.type] ?? vessel.type}
                    </td>

                    <td className="px-3 py-2.5">
                      <VesselStatusBadge status={vessel.status} />
                    </td>

                    <td className="px-3 py-2.5 font-mono text-[#6b8899]">
                      {vessel.eta ? formatDateTime(vessel.eta) : '—'}
                    </td>

                    <td className="px-3 py-2.5 font-mono text-[#6b8899]">
                      {vessel.berthId ?? '—'}
                    </td>

                    <td className="px-3 py-2.5 tabular-nums text-[#6b8899]">
                      {vessel.status === 'WAITING'
                        ? formatWaiting(vessel.waitingMinutes)
                        : '—'}
                    </td>

                    <td className="px-3 py-2.5 font-mono text-[#9eb5c1]">
                      {formatDateTime(vessel.lastUpdated)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Result count */}
          <div className="px-4 py-2 bg-[#f4f8fb] border-t border-[#d1e0ea] text-xs text-[#6b8899]">
            {filtered.length} of {vessels.length} vessel{vessels.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
