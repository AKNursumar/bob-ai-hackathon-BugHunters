import { cn } from '@/lib/utils';
import type { VesselStatus } from '@/types/vessel';

interface VesselStatusConfig {
  label: string;
  classes: string;
  dotClass: string;
}

const STATUS_CONFIG: Record<VesselStatus, VesselStatusConfig> = {
  ARRIVING: {
    label: 'Arriving',
    classes: 'bg-[#e6faf9] text-[#00b4a6] border-[#00b4a6]/40',
    dotClass: 'bg-[#00b4a6]',
  },
  AT_BERTH: {
    label: 'At Berth',
    classes: 'bg-[#e8f0f5] text-[#0d1f2d] border-[#b8cdd8]',
    dotClass: 'bg-[#0d1f2d]',
  },
  WAITING: {
    label: 'Waiting',
    classes: 'bg-[#fef9ec] text-[#d97706] border-[#f59e0b]/50',
    dotClass: 'bg-[#f59e0b]',
  },
  DEPARTING: {
    label: 'Departing',
    classes: 'bg-[#f4f8fb] text-[#3a5468] border-[#b8cdd8]',
    dotClass: 'bg-[#3a5468]',
  },
};

interface VesselStatusBadgeProps {
  status: VesselStatus;
  className?: string;
}

export function VesselStatusBadge({ status, className }: VesselStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider border rounded-sm',
        config.classes,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dotClass)} />
      {config.label}
    </span>
  );
}
