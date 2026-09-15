import { cn } from '@/lib/utils';
import type { SeverityLevel } from '@/types';

const SEVERITY_CLASSES: Record<SeverityLevel, string> = {
  low:      'bg-[#DCFCE7] text-[#16A34A] border-[#16A34A]/30',
  medium:   'bg-[#FEF3C7] text-[#D97706] border-[#D97706]/40',
  high:     'bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]/30',
  critical: 'bg-[#DC2626] text-white border-[#B91C1C]',
};

const SEVERITY_DOT_CLASSES: Record<SeverityLevel, string> = {
  low:      'bg-[#16A34A]',
  medium:   'bg-[#D97706]',
  high:     'bg-[#DC2626]',
  critical: 'bg-white',
};

interface StatusBadgeProps {
  severity: SeverityLevel;
  label?: string;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({
  severity,
  label,
  showDot = true,
  className,
}: StatusBadgeProps) {
  const displayLabel = label ?? severity.toUpperCase();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded',
        SEVERITY_CLASSES[severity],
        className
      )}
    >
      {showDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', SEVERITY_DOT_CLASSES[severity])} />
      )}
      {displayLabel}
    </span>
  );
}
