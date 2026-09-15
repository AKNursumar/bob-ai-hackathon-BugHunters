import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KpiMetric, SeverityLevel } from '@/types';

const SEVERITY_ACCENT: Record<SeverityLevel, string> = {
  low:      'border-t-[#16A34A]',
  medium:   'border-t-[#D97706]',
  high:     'border-t-[#DC2626]',
  critical: 'border-t-[#DC2626]',
};

const SEVERITY_VALUE_COLOR: Record<SeverityLevel, string> = {
  low:      'text-[#071A2B]',
  medium:   'text-[#D97706]',
  high:     'text-[#DC2626]',
  critical: 'text-[#DC2626]',
};

interface KpiCardProps {
  metric: KpiMetric;
  className?: string;
}

export function KpiCard({ metric, className }: KpiCardProps) {
  const accentClass = metric.severity ? SEVERITY_ACCENT[metric.severity] : 'border-t-[#1677C8]';
  const valueColorClass = metric.severity ? SEVERITY_VALUE_COLOR[metric.severity] : 'text-[#071A2B]';

  const ChangeIcon =
    metric.changeDirection === 'up'
      ? TrendingUp
      : metric.changeDirection === 'down'
        ? TrendingDown
        : Minus;

  const changeColorClass =
    metric.changeDirection === 'up'
      ? 'text-[#D97706]'
      : metric.changeDirection === 'down'
        ? 'text-[#16A34A]'
        : 'text-[#617080]';

  return (
    <div
      className={cn(
        'hl-card border-t-2 p-5 rounded-lg',
        accentClass,
        className
      )}
    >
      <p className="eyebrow mb-3">{metric.label}</p>
      <div className="flex items-end gap-1.5 mb-2">
        <span className={cn('text-3xl font-bold tabular-nums leading-none', valueColorClass)}>
          {metric.value}
        </span>
        {metric.unit && (
          <span className="text-sm text-[#617080] mb-0.5 font-medium">{metric.unit}</span>
        )}
      </div>
      {metric.change && (
        <div className={cn('flex items-center gap-1 text-xs font-medium', changeColorClass)}>
          <ChangeIcon className="w-3 h-3 shrink-0" />
          <span>{metric.change}</span>
        </div>
      )}
    </div>
  );
}
