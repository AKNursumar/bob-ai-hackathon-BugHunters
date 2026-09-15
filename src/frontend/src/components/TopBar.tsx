import { Bell, User, ChevronDown, Ship, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MobileMenuButton } from './Sidebar';
import { usePort, INDIAN_PORTS } from '@/contexts/PortContext';
import type { SystemStatus } from '@/types';

interface TopBarProps {
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
  systemStatus,
  lastUpdated,
  onMobileMenuOpen,
  className,
}: TopBarProps) {
  const cfg = STATUS_CONFIG[systemStatus];
  const { selectedPort, setSelectedPort } = usePort();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
          >
            <Ship className="w-3.5 h-3.5 text-[#4CA3E3] shrink-0" />
            <span className="text-[13px] font-semibold text-white truncate">{selectedPort.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-white/40 shrink-0" />
          </button>
          
          {isOpen && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-[#0B2942] border border-white/[0.1] rounded-lg shadow-xl overflow-hidden z-50">
              <div className="py-1">
                {INDIAN_PORTS.map(port => (
                  <button
                    key={port.id}
                    onClick={() => {
                      setSelectedPort(port);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] text-left text-white/80 hover:bg-white/[0.05] transition-colors"
                  >
                    <span>{port.name}</span>
                    {selectedPort.id === port.id && (
                      <Check className="w-3.5 h-3.5 text-[#4CA3E3]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
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

        <div className="flex items-center border-l border-white/10 pl-4 ml-2">
          <button
            className="flex items-center gap-2 p-2 text-white/40 hover:text-white/80 hover:bg-white/[0.06] rounded-md transition-colors"
            aria-label="User"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:block text-[12px] font-medium text-white/50">Officer</span>
          </button>
          
          <button
            onClick={() => {
              // Get logout from context dynamically to avoid top-level import cycles or prop drilling if not needed
              sessionStorage.removeItem('auth_token');
              window.location.href = '/login';
            }}
            className="ml-2 px-3 py-1.5 text-[11px] font-bold text-white/40 hover:text-white/80 hover:bg-white/5 rounded transition-colors uppercase tracking-wider"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
