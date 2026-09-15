import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({ className, lines = 1 }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-700/50 rounded animate-pulse"
          style={{ width: i === lines - 1 && lines > 1 ? '75%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-sm animate-pulse">
      <div className="h-3 w-24 bg-slate-700/50 rounded mb-3" />
      <div className="h-8 w-20 bg-slate-700/50 rounded mb-2" />
      <div className="h-3 w-16 bg-slate-700/50 rounded" />
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-slate-900 border border-slate-800 p-4 rounded-sm animate-pulse', className)}>
      <div className="h-4 w-40 bg-slate-700/50 rounded mb-4" />
      <div className="h-48 bg-slate-700/20 rounded" />
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="h-3 w-8 bg-slate-700/50 rounded" />
          <div className="flex-1 h-3 bg-slate-700/50 rounded" />
          <div className="h-3 w-12 bg-slate-700/50 rounded" />
        </div>
      ))}
    </div>
  );
}
