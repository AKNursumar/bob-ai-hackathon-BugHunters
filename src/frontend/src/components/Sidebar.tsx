import {
  NavLink,
  useLocation,
} from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  TrendingUp,
  MapPin,
  BarChart2,
  Layers,
  FlaskConical,
  Bell,
  FileText,
  Anchor,
  ChevronLeft,
  ChevronRight,
  Menu,
  Bot,
  CircleDot,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    heading: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { label: 'Port Monitor', icon: Radio, to: '/monitoring' },
      { label: '72h Planner', icon: Calendar, to: '/planner' },
    ],
  },
  {
    heading: 'Intelligence',
    items: [
      { label: 'Predictions', icon: TrendingUp, to: '/predictions' },
      { label: 'Hotspots', icon: MapPin, to: '/hotspots' },
      { label: 'Analytics', icon: BarChart2, to: '/analytics' },
    ],
  },
  {
    heading: 'Planning',
    items: [
      { label: 'Optimisation', icon: Layers, to: '/optimization' },
      { label: 'Simulation', icon: FlaskConical, to: '/simulation' },
    ],
  },
  {
    heading: 'System',
    items: [
      { label: 'IBM Bob', icon: Bot, to: '/bob' },
      { label: 'Alerts', icon: Bell, to: '/alerts' },
      { label: 'Reports', icon: FileText, to: '/reports' },
    ],
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ isCollapsed, onToggle, isMobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-30 flex flex-col transition-all duration-200',
          'bg-[#071A2B] border-r border-white/[0.07]',
          isCollapsed ? 'w-14' : 'w-56',
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center h-14 border-b border-white/[0.07] shrink-0',
          isCollapsed ? 'px-3 justify-center' : 'px-4 gap-2.5'
        )}>
          <div className="w-7 h-7 shrink-0 grid place-items-center rounded-md"
            style={{ background: 'linear-gradient(135deg, #1677C8, #145B8C)' }}>
            <Anchor className="w-3.5 h-3.5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-[15px] font-bold text-white tracking-tight">
              Harbor<span className="text-[#4CA3E3]">line</span>
            </span>
          )}
        </div>

        {/* Live status bar */}
        {!isCollapsed && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center gap-2">
            <CircleDot className="w-3 h-3 text-[#16A34A] shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wider">System Live</p>
              <p className="text-[10px] text-white/40 truncate">JNPA / Nhava Sheva</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-1.5 space-y-5 mt-1">
          {NAV_SECTIONS.map((section) => (
            <div key={section.heading}>
              {!isCollapsed && (
                <p className="px-2.5 pb-1 text-[9px] font-bold text-white/25 uppercase tracking-[0.15em]">
                  {section.heading}
                </p>
              )}
              {isCollapsed && <div className="border-t border-white/[0.06] my-2 mx-2" />}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.to === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.to);

                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        title={isCollapsed ? item.label : undefined}
                        className={cn(
                          'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-all nav-link',
                          isActive
                            ? 'bg-[#1677C8]/20 text-white border border-[#1677C8]/30'
                            : 'text-white/50 hover:bg-white/[0.06] hover:text-white/90 border border-transparent',
                        )}
                      >
                        <Icon className={cn('w-[15px] h-[15px] shrink-0', isActive ? 'text-[#4CA3E3]' : '')} />
                        {!isCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                        {!isCollapsed && isActive && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#4CA3E3] shrink-0" />
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom system status */}
        {!isCollapsed && (
          <div className="mx-3 mb-3 px-3 py-2.5 rounded-md bg-white/[0.03] border border-white/[0.05]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Data Feed</span>
              <span className="text-[9px] text-white/30">IMF PortWatch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="status-dot status-dot-live pulse w-1.5 h-1.5" />
              <span className="text-[10px] text-white/50">Live · Updated {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
            </div>
          </div>
        )}

        {/* Collapse toggle — desktop only */}
        <div className="hidden lg:flex border-t border-white/[0.07] p-2 shrink-0">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-1.5 text-white/30 hover:text-white/70 hover:bg-white/[0.06] rounded-md transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-1.5 text-white/50 hover:text-white hover:bg-white/[0.08] rounded-md transition-colors"
      aria-label="Open navigation"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
