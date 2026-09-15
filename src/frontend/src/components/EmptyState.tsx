import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  message?: string;
  className?: string;
}

export function EmptyState({
  message = 'No data available.',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-10 px-4 text-center',
        className
      )}
    >
      <Inbox className="w-8 h-8 text-slate-600 shrink-0" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
