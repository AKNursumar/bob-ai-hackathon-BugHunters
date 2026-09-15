import { cn } from '@/lib/utils';
import type { BerthUtilisation, SeverityLevel } from '@/types';
import { ErrorState } from '@/components/ErrorState';
import { ListSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';

const BAR_COLOR: Record<SeverityLevel, string> = {
  low: 'bg-[#00b4a6]',
  medium: 'bg-[#f59e0b]',
  high: 'bg-[#e53e3e]',
  critical: 'bg-[#c41a1a]',
};

const TEXT_COLOR: Record<SeverityLevel, string> = {
  low: 'text-[#00b4a6]',
  medium: 'text-[#f59e0b]',
  high: 'text-[#e53e3e]',
  critical: 'text-[#c41a1a]',
};

interface BerthRowProps {
  berth: BerthUtilisation;
}

function BerthRow({ berth }: BerthRowProps) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      {/* Berth ID */}
      <span className="text-xs font-mono font-semibold text-[#6b8899] w-7 shrink-0">
        {berth.berthId}
      </span>

      {/* Bar */}
      <div className="flex-1 h-2 bg-[#d1e0ea] rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', BAR_COLOR[berth.severity])}
          style={{ width: `${berth.utilisationPct}%` }}
          role="progressbar"
          aria-valuenow={berth.utilisationPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${berth.berthId} utilisation`}
        />
      </div>

      {/* Percentage */}
      <span
        className={cn('text-xs font-semibold tabular-nums w-9 text-right shrink-0', TEXT_COLOR[berth.severity])}
      >
        {berth.utilisationPct}%
      </span>
    </div>
  );
}

interface BerthUtilisationListProps {
  berths: BerthUtilisation[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function BerthUtilisationList({
  berths,
  isLoading,
  isError,
  onRetry,
}: BerthUtilisationListProps) {
  if (isLoading) return <ListSkeleton rows={6} />;
  if (isError) return <ErrorState onRetry={onRetry} />;
  if (berths.length === 0) return <EmptyState message="No berth data available." />;

  return (
    <div className="space-y-0.5">
      {berths.map((berth) => (
        <BerthRow key={berth.berthId} berth={berth} />
      ))}
    </div>
  );
}
