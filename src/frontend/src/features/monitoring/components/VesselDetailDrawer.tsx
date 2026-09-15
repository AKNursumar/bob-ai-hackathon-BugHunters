import { X, MapPin, Clock, Anchor as AnchorIcon } from 'lucide-react';
import type { Vessel } from '@/types/vessel';
import type { Berth } from '@/types/berth';
import { VesselStatusBadge } from './VesselStatusBadge';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const VESSEL_TYPE_LABELS: Record<string, string> = {
  CONTAINER: 'Container',
  TANKER: 'Tanker',
  BULK: 'Bulk Carrier',
  RO_RO: 'Ro-Ro',
  OTHER: 'Other',
};

function DetailRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[#d1e0ea] last:border-0">
      <span className="text-xs text-[#6b8899] shrink-0 w-32">{label}</span>
      <span
        className={cn(
          'text-xs text-right',
          mono ? 'font-mono text-[#0d1f2d]' : 'text-[#0d1f2d]'
        )}
      >
        {value}
      </span>
    </div>
  );
}

interface VesselDetailDrawerProps {
  vessel: Vessel | null;
  berths: Berth[];
  onClose: () => void;
  onViewOnMap: (vessel: Vessel) => void;
}

export function VesselDetailDrawer({
  vessel,
  berths,
  onClose,
  onViewOnMap,
}: VesselDetailDrawerProps) {
  if (!vessel) return null;

  const assignedBerth = vessel.berthId
    ? berths.find((b) => b.id === vessel.berthId)
    : undefined;

  const hasCoordinates =
    vessel.latitude !== undefined && vessel.longitude !== undefined;

  function formatWaiting(minutes: number | undefined): string {
    if (minutes === undefined) return '—';
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className="fixed top-0 right-0 h-full w-80 max-w-full bg-white border-l border-[#d1e0ea] z-50 flex flex-col shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={`Vessel details: ${vessel.name}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-4 py-4 border-b border-[#d1e0ea] bg-[#f4f8fb]">
          <div>
            <p className="eyebrow text-[#6b8899] mb-1">Vessel Details</p>
            <h2 className="text-sm font-semibold text-[#0d1f2d] leading-tight">{vessel.name}</h2>
            <div className="mt-1.5">
              <VesselStatusBadge status={vessel.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6b8899] hover:text-[#0d1f2d] hover:bg-[#d1e0ea] rounded-sm transition-colors"
            aria-label="Close vessel details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* Identification */}
          <p className="eyebrow text-[#6b8899] mb-2">Identification</p>
          <DetailRow label="Type" value={VESSEL_TYPE_LABELS[vessel.type] ?? vessel.type} />
          <DetailRow label="IMO" value={vessel.imo ?? '—'} mono />
          <DetailRow label="MMSI" value={vessel.mmsi ?? '—'} mono />

          {/* Timing */}
          <p className="eyebrow text-[#6b8899] mt-4 mb-2">Timing</p>
          <DetailRow
            label="ETA"
            value={vessel.eta ? formatDateTime(vessel.eta) : '—'}
          />
          <DetailRow
            label="Actual Arrival"
            value={vessel.ata ? formatDateTime(vessel.ata) : '—'}
          />
          <DetailRow
            label="ETD"
            value={vessel.etd ? formatDateTime(vessel.etd) : '—'}
          />

          {/* Berth & waiting */}
          <p className="eyebrow text-[#6b8899] mt-4 mb-2">Berth & Operations</p>
          <DetailRow
            label="Assigned Berth"
            value={
              assignedBerth
                ? `${assignedBerth.id} — ${assignedBerth.name}`
                : vessel.berthId
                  ? vessel.berthId
                  : '—'
            }
          />
          <DetailRow
            label="Waiting Time"
            value={
              <span className="flex items-center gap-1">
                {vessel.status === 'WAITING' && vessel.waitingMinutes !== undefined && (
                  <Clock className="w-3 h-3 text-[#6b8899]" />
                )}
                {formatWaiting(vessel.waitingMinutes)}
              </span>
            }
          />

          {/* Location */}
          <p className="eyebrow text-[#6b8899] mt-4 mb-2">Position</p>
          <DetailRow
            label="Coordinates"
            value={
              hasCoordinates ? (
                <span className="font-mono text-[#0d1f2d]">
                  {vessel.latitude!.toFixed(4)}°, {vessel.longitude!.toFixed(4)}°
                </span>
              ) : (
                <span className="text-[#6b8899] flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Location unavailable
                </span>
              )
            }
          />

          {/* Last updated */}
          <p className="eyebrow text-[#6b8899] mt-4 mb-2">Data</p>
          <DetailRow label="Last Updated" value={formatDateTime(vessel.lastUpdated)} />
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t border-[#d1e0ea] flex items-center gap-2">
          <button
            onClick={() => onViewOnMap(vessel)}
            disabled={!hasCoordinates}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold',
              'border rounded-sm transition-colors',
              hasCoordinates
                ? 'text-white bg-[#00b4a6] hover:bg-[#009e91] border-[#009e91]'
                : 'text-[#9eb5c1] bg-[#f4f8fb] border-[#d1e0ea] cursor-not-allowed'
            )}
            title={!hasCoordinates ? 'No position data available for this vessel' : undefined}
            aria-label="View vessel on map"
          >
            <AnchorIcon className="w-3.5 h-3.5 shrink-0" />
            View on Map
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 text-xs font-semibold text-[#3a5468] bg-white hover:bg-[#f4f8fb] border border-[#d1e0ea] rounded-sm transition-colors"
            aria-label="Close drawer"
          >
            Close
          </button>
        </div>
      </aside>
    </>
  );
}
