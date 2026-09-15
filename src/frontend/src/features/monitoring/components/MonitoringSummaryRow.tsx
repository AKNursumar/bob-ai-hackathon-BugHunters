import { KpiCard } from '@/components/KpiCard';
import { KpiCardSkeleton } from '@/components/LoadingSkeleton';
import type { MonitoringSummary } from '@/types/monitoring';

interface MonitoringSummaryProps {
  summary: MonitoringSummary | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function MonitoringSummaryRow({
  summary,
  isLoading,
  isError,
  onRetry,
}: MonitoringSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        <div className="col-span-full py-4 text-center text-sm text-[#3a5468]">
          Unable to load KPIs.{' '}
          <button onClick={onRetry} className="text-[#00b4a6] hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
      <KpiCard
        metric={{
          label: 'Active Vessels',
          value: summary.activeVessels,
        }}
      />
      <KpiCard
        metric={{
          label: 'Arrivals',
          value: summary.arrivals,
          severity: summary.arrivals > 5 ? 'high' : 'low',
        }}
      />
      <KpiCard
        metric={{
          label: 'Departures',
          value: summary.departures,
        }}
      />
      <KpiCard
        metric={{
          label: 'Waiting Vessels',
          value: summary.waitingVessels,
          severity:
            summary.waitingVessels >= 5
              ? 'critical'
              : summary.waitingVessels >= 3
                ? 'high'
                : summary.waitingVessels >= 1
                  ? 'medium'
                  : 'low',
        }}
      />
      <KpiCard
        metric={{
          label: 'Berth Utilisation',
          value: `${summary.berthUtilisation}%`,
          severity:
            summary.berthUtilisation >= 90
              ? 'critical'
              : summary.berthUtilisation >= 75
                ? 'high'
                : summary.berthUtilisation >= 55
                  ? 'medium'
                  : 'low',
        }}
      />
    </div>
  );
}
