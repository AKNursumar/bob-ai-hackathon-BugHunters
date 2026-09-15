import { Bell, User, ChevronDown, Ship } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileMenuButton } from './Sidebar';
import type { SystemStatus } from '@/types';

interface TopBarProps {
  portName: string;
  systemStatus: SystemStatus;
  lastUpdated: string;
  onMobileMenuOpen: () => void;
  className?: string;
}

const STATUS_CONFIG: Record<SystemStatus, { dot: string; label: string; text: string }> = {
  live:    { dot: 'bg-[#16A34A] pulse', label: 'LIVE',    text: 'text-[#16A34A]' },
  delayed: { dot: 'bg-[#D97706]',       label: 'DELAYED', text: 'text-[#D97706]' },
  offline: { dot: 'bg-[#DC2626]',       label: 'OFFLINE', text: 'text-[#DC2626]' },
};

export function TopBar({
  portName,
  systemStatus,
  lastUpdated,
  onMobileMenuOpen,
  className,
}: TopBarProps) {
  const cfg = STATUS_CONFIG[systemStatus];

  const formattedTime = new Date(lastUpdated).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <header
      className={cn(
        'flex items-center justify-between h-14 px-5 shrink-0 gap-4',
        'bg-[#071A2B] border-b border-white/[0.07]',
        className
      )}
    >
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <MobileMenuButton onClick={onMobileMenuOpen} />

        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
          <Ship className="w-3.5 h-3.5 text-[#4CA3E3] shrink-0" />
          <span className="text-[13px] font-semibold text-white truncate">{portName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-white/40 shrink-0" />
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4 shrink-0">
        <span className="hidden sm:block text-[11px] text-white/35 tabular-nums font-mono">
          {formattedTime}
        </span>

        <div className={cn('flex items-center gap-1.5 text-[11px] font-bold tracking-wider', cfg.text)}>
          <span className={cn('status-dot shrink-0', cfg.dot)} />
          {cfg.label}
        </div>

        <button
          className="relative p-2 text-white/40 hover:text-white/80 hover:bg-white/[0.06] rounded-md transition-colors"
          aria-label="Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#DC2626] rounded-full" />
        </button>

        <button
          className="flex items-center gap-2 p-2 text-white/40 hover:text-white/80 hover:bg-white/[0.06] rounded-md transition-colors"
          aria-label="User"
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:block text-[12px] font-medium text-white/50">Officer</span>
        </button>
      </div>
    </header>
  );
}
