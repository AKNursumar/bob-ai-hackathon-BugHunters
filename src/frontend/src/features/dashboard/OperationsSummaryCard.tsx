import { Ship, Clock, Activity, BarChart3 } from 'lucide-react';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import type { OperationsSummary } from '@/types';

interface StatRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function StatRow({ icon: Icon, label, value }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#d1e0ea] last:border-0">
      <div className="flex items-center gap-2 text-[#6b8899]">
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-sm font-semibold tabular-nums text-[#0d1f2d]">{value}</span>
    </div>
  );
}

interface OperationsSummaryCardProps {
  summary: OperationsSummary | null;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function OperationsSummaryCard({
  summary,
  isLoading,
  isError,
  onRetry,
}: OperationsSummaryCardProps) {
  if (isLoading) return <LoadingSkeleton lines={4} />;
  if (isError) return <ErrorState onRetry={onRetry} />;
  if (!summary) return null;

  return (
    <div>
      <StatRow icon={Ship} label="Arrivals" value={String(summary.arrivalsNext24h)} />
      <StatRow icon={Ship} label="Departures" value={String(summary.departuresNext24h)} />
      <StatRow icon={Clock} label="Expected wait" value={`${summary.expectedWaitHours}h`} />
      <StatRow icon={Activity} label="Capacity" value={`${summary.capacityPct}%`} />
      <StatRow icon={BarChart3} label="Vessels in / out delta" value={`+${summary.arrivalsNext24h - summary.departuresNext24h}`} />
    </div>
  );
}
