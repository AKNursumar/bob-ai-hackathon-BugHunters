import { cn } from '@/lib/utils';
import type { Berth, BerthStatus } from '@/types/berth';
import { ListSkeleton } from '@/components/LoadingSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';

const STATUS_BAR_COLOR: Record<BerthStatus, string> = {
  AVAILABLE: 'bg-[#00b4a6]',
  OCCUPIED: 'bg-[#0d1f2d]',
  WARNING: 'bg-[#f59e0b]',
  CRITICAL: 'bg-[#e53e3e]',
};

const STATUS_TEXT_COLOR: Record<BerthStatus, string> = {
  AVAILABLE: 'text-[#00b4a6]',
  OCCUPIED: 'text-[#0d1f2d]',
  WARNING: 'text-[#f59e0b]',
  CRITICAL: 'text-[#e53e3e]',
};

const STATUS_BADGE_CLASSES: Record<BerthStatus, string> = {
  AVAILABLE: 'bg-[#e6faf9] text-[#00b4a6] border-[#00b4a6]/40',
  OCCUPIED: 'bg-[#e8f0f5] text-[#0d1f2d] border-[#b8cdd8]',
  WARNING: 'bg-[#fef9ec] text-[#d97706] border-[#f59e0b]/50',
  CRITICAL: 'bg-[#fef2f2] text-[#e53e3e] border-[#e53e3e]/40',
};

function BerthRow({ berth, onSelectVessel }: { berth: Berth; onSelectVessel?: (vesselId: string) => void }) {
  return (
    <div className="flex items-center gap-3 py-2">
      {/* Berth ID */}
      <span className="text-xs font-mono font-semibold text-[#6b8899] w-8 shrink-0">{berth.id}</span>

      {/* Progress bar */}
      <div
        className="flex-1 h-2 bg-[#d1e0ea] rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={berth.utilisation}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${berth.name} utilisation`}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-700', STATUS_BAR_COLOR[berth.status])}
          style={{ width: berth.status === 'AVAILABLE' ? '0%' : `${berth.utilisation}%` }}
        />
      </div>

      {/* Percentage */}
      <span
        className={cn(
          'text-xs font-semibold tabular-nums w-9 text-right shrink-0',
          STATUS_TEXT_COLOR[berth.status]
        )}
      >
        {berth.status === 'AVAILABLE' ? '—' : `${berth.utilisation}%`}
      </span>

      {/* Status badge */}
      <span
        className={cn(
          'text-xs font-semibold uppercase tracking-wider border rounded-sm px-1.5 py-0.5 shrink-0 hidden sm:block',
          STATUS_BADGE_CLASSES[berth.status]
        )}
      >
        {berth.status === 'OCCUPIED' ? 'Occupied' : berth.status.charAt(0) + berth.status.slice(1).toLowerCase()}
      </span>

      {/* View vessel button */}
      {berth.currentVesselId && onSelectVessel && (
        <button
          onClick={() => onSelectVessel(berth.currentVesselId!)}
          className="text-xs text-[#6b8899] hover:text-[#00b4a6] hover:underline shrink-0 hidden lg:block"
          aria-label={`View vessel at ${berth.name}`}
        >
          View
        </button>
      )}
    </div>
  );
}

interface BerthStatusPanelProps {
  berths: Berth[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelectVessel?: (vesselId: string) => void;
}

export function BerthStatusPanel({
  berths,
  isLoading,
  isError,
  onRetry,
  onSelectVessel,
}: BerthStatusPanelProps) {
  if (isLoading) return <ListSkeleton rows={6} />;
  if (isError) return <ErrorState onRetry={onRetry} message="Berth data is currently unavailable." />;
  if (berths.length === 0) return <EmptyState message="No berth data is available." />;

  return (
    <div className="space-y-0.5 divide-y divide-[#d1e0ea]">
      {berths.map((berth) => (
        <BerthRow key={berth.id} berth={berth} onSelectVessel={onSelectVessel} />
      ))}
    </div>
  );
}
