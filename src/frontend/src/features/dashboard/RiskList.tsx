import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { ErrorState } from '@/components/ErrorState';
import { ListSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import type { CongestionRisk, SeverityLevel } from '@/types';

const SEVERITY_ROW_CLASSES: Record<SeverityLevel, string> = {
  low: 'border-l-[#00b4a6]',
  medium: 'border-l-[#f59e0b]',
  high: 'border-l-[#e53e3e]',
  critical: 'border-l-[#c41a1a]',
};

interface RiskItemProps {
  risk: CongestionRisk;
}

function RiskItem({ risk }: RiskItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 bg-white border border-[#d1e0ea] border-l-[3px] rounded-sm',
        SEVERITY_ROW_CLASSES[risk.severity]
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-[#0d1f2d] truncate">{risk.location}</span>
          <StatusBadge severity={risk.severity} />
        </div>
        <p className="text-xs text-[#3a5468] truncate">{risk.description}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-[#6b8899]">{risk.metricLabel}</p>
        <p className="text-sm font-bold text-[#0d1f2d] tabular-nums">{risk.metricValue}</p>
      </div>
    </div>
  );
}

interface RiskListProps {
  risks: CongestionRisk[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function RiskList({ risks, isLoading, isError, onRetry }: RiskListProps) {
  if (isLoading) return <ListSkeleton rows={3} />;
  if (isError) return <ErrorState onRetry={onRetry} />;
  if (risks.length === 0) return <EmptyState message="No active congestion risks." />;

  return (
    <div>
      <div className="space-y-2 mb-3">
        {risks.map((risk) => (
          <RiskItem key={risk.id} risk={risk} />
        ))}
      </div>
      <div className="flex justify-end">
        <Link
          to="/hotspots"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#00b4a6] hover:text-[#009e91] transition-colors"
        >
          View Hotspots
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
