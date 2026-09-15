import { ArrowRight, BrainCircuit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { formatDateTime } from '@/lib/format';
import type { AIRecommendation } from '@/types';

interface AIRecommendationCardProps {
  recommendation: AIRecommendation | null;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function AIRecommendationCard({
  recommendation,
  isLoading,
  isError,
  onRetry,
}: AIRecommendationCardProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <LoadingSkeleton lines={1} className="w-32" />
        <LoadingSkeleton lines={3} />
      </div>
    );
  }

  if (isError) return <ErrorState onRetry={onRetry} />;

  if (!recommendation) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <BrainCircuit className="w-7 h-7 text-[#6b8899]" />
        <p className="text-sm text-[#6b8899]">No recommendations at this time.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-start gap-2 mb-2">
        <BrainCircuit
          className={cn(
            'w-4 h-4 shrink-0 mt-0.5',
            recommendation.severity === 'critical'
              ? 'text-[#c41a1a]'
              : recommendation.severity === 'high'
                ? 'text-[#e53e3e]'
                : recommendation.severity === 'medium'
                  ? 'text-[#f59e0b]'
                  : 'text-[#00b4a6]'
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[#0d1f2d]">{recommendation.title}</span>
            <StatusBadge severity={recommendation.severity} />
          </div>
          <p className="text-xs text-[#6b8899] mt-0.5">
            Prepared {formatDateTime(recommendation.generatedAt)}
          </p>
        </div>
      </div>

      {/* Detail text */}
      <p className="text-sm text-[#3a5468] leading-relaxed mb-3">{recommendation.detail}</p>

      {/* Action */}
      {recommendation.actionLabel && recommendation.actionRoute && (
        <Link
          to={recommendation.actionRoute}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#00b4a6] hover:text-[#009e91] transition-colors"
        >
          {recommendation.actionLabel}
          <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}
