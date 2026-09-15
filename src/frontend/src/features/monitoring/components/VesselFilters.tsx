import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VesselStatus, VesselType } from '@/types/vessel';

export interface VesselFilterState {
  search: string;
  status: VesselStatus | 'ALL';
  type: VesselType | 'ALL';
  berthId: string | 'ALL';
}

const VESSEL_STATUS_OPTIONS: Array<{ value: VesselStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ARRIVING', label: 'Arriving' },
  { value: 'AT_BERTH', label: 'At Berth' },
  { value: 'WAITING', label: 'Waiting' },
  { value: 'DEPARTING', label: 'Departing' },
];

const VESSEL_TYPE_OPTIONS: Array<{ value: VesselType | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Types' },
  { value: 'CONTAINER', label: 'Container' },
  { value: 'TANKER', label: 'Tanker' },
  { value: 'BULK', label: 'Bulk' },
  { value: 'RO_RO', label: 'Ro-Ro' },
  { value: 'OTHER', label: 'Other' },
];

interface VesselFiltersProps {
  filters: VesselFilterState;
  onChange: (filters: VesselFilterState) => void;
  availableBerths: Array<{ id: string; name: string }>;
}

const selectClass =
  'px-2 py-1.5 text-xs border border-[#d1e0ea] bg-white text-[#0d1f2d] rounded-sm focus:outline-none focus:border-[#00b4a6] hover:border-[#b8cdd8] transition-colors';

export function VesselFilters({ filters, onChange, availableBerths }: VesselFiltersProps) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'ALL' ||
    filters.type !== 'ALL' ||
    filters.berthId !== 'ALL';

  function clearFilters() {
    onChange({ search: '', status: 'ALL', type: 'ALL', berthId: 'ALL' });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9eb5c1] pointer-events-none" />
        <input
          type="text"
          placeholder="Search name, IMO, MMSI…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-7 pr-3 py-1.5 text-xs border border-[#d1e0ea] bg-white text-[#0d1f2d] rounded-sm focus:outline-none focus:border-[#00b4a6] transition-colors w-52"
          aria-label="Search vessels"
        />
        {filters.search && (
          <button
            onClick={() => onChange({ ...filters, search: '' })}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9eb5c1] hover:text-[#0d1f2d]"
            aria-label="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value as VesselStatus | 'ALL' })}
        className={selectClass}
        aria-label="Filter by status"
      >
        {VESSEL_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Type filter */}
      <select
        value={filters.type}
        onChange={(e) => onChange({ ...filters, type: e.target.value as VesselType | 'ALL' })}
        className={selectClass}
        aria-label="Filter by vessel type"
      >
        {VESSEL_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Berth filter */}
      <select
        value={filters.berthId}
        onChange={(e) => onChange({ ...filters, berthId: e.target.value })}
        className={selectClass}
        aria-label="Filter by berth"
      >
        <option value="ALL">All Berths</option>
        {availableBerths.map((b) => (
          <option key={b.id} value={b.id}>
            {b.id}
          </option>
        ))}
      </select>

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-1.5 text-xs text-[#6b8899] hover:text-[#0d1f2d]',
            'border border-[#d1e0ea] hover:border-[#b8cdd8] rounded-sm transition-colors'
          )}
          aria-label="Clear all filters"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}
