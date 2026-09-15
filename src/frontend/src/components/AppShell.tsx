import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { cn } from '@/lib/utils';

interface AppShellProps {
  portName?: string;
  systemStatus?: 'live' | 'delayed' | 'offline';
  lastUpdated?: string;
}

export function AppShell({
  portName = 'Los Angeles / Long Beach',
  systemStatus = 'live',
  lastUpdated = new Date().toISOString(),
}: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const sidebarWidth = isCollapsed ? 'lg:pl-14' : 'lg:pl-56';

  return (
    <div className="h-full flex" style={{ background: '#071A2B' }}>
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed((v) => !v)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      <div className={cn('flex flex-col flex-1 min-w-0 transition-all duration-200', sidebarWidth)}>
        <TopBar
          portName={portName}
          systemStatus={systemStatus}
          lastUpdated={lastUpdated}
          onMobileMenuOpen={() => setIsMobileOpen(true)}
        />

        <main className="flex-1 overflow-y-auto app-canvas">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
