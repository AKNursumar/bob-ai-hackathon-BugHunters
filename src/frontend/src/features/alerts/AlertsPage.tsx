import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { AlertTriangle, Bell, CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'normal';
  title: string;
  location: string;
  what: string;
  why: string;
  when: string;
  action: string;
  timestamp: string;
  acknowledged: boolean;
}

const MOCK_ALERTS: Alert[] = [
  {
    id: 'ALT-001',
    severity: 'critical',
    title: 'Berth capacity limit approaching',
    location: 'Terminal A — Pier 400',
    what: 'Berth occupancy reached 97% — capacity limit will be breached within 2 hours without action.',
    why: 'Three unexpected vessel arrivals combined with delayed departure of MSC Oscar at B01.',
    when: 'Immediate — within 2 hours',
    action: 'Redirect next 2 arrivals to Terminal B. Notify MSC Oscar to prepare for early departure.',
    timestamp: '09:42',
    acknowledged: false,
  },
  {
    id: 'ALT-002',
    severity: 'critical',
    title: 'Congestion risk surge detected',
    location: 'JNPA / Nhava Sheva',
    what: 'Congestion probability jumped from 58% to 72% in the last 4 hours.',
    why: 'Vessel arrivals increased +18% vs forecast. Anchorage queue now at 12 vessels, +40% above baseline.',
    when: 'Next 24 hours · Peak: 14:00–20:00',
    action: 'Activate contingency berth plan. Alert duty pilots. Trigger IBM Bob recommendation engine.',
    timestamp: '08:15',
    acknowledged: false,
  },
  {
    id: 'ALT-003',
    severity: 'warning',
    title: 'Schedule conflict detected',
    location: 'Berth B03 — Pier J',
    what: 'VSL-204 and VSL-307 have overlapping berth window. Conflict starts at 16:30.',
    why: 'VSL-204 ETA slipped by +1.5 hours due to weather delay. B03 was not reallocated.',
    when: 'Today at 16:30',
    action: 'Move VSL-307 to B05 or delay VSL-204 check-in by 2 hours.',
    timestamp: '07:58',
    acknowledged: false,
  },
  {
    id: 'ALT-004',
    severity: 'warning',
    title: 'Vessel delay affecting downstream plan',
    location: 'Inbound — ETA 14:30',
    what: 'CMA CGM Marco Polo now estimated +3h late. Downstream berth window affected.',
    why: 'Weather event in Pacific corridor. Vessel transmitted updated ETA at 06:00.',
    when: 'Today — cascading from 17:30 onward',
    action: 'Resequence berth allocation for B03 window. Notify crane team of revised schedule.',
    timestamp: '06:30',
    acknowledged: true,
  },
  {
    id: 'ALT-005',
    severity: 'normal',
    title: 'System data refresh complete',
    location: 'IMF PortWatch Data Feed',
    what: 'Daily AIS data refresh completed successfully. Forecast models updated.',
    why: 'Scheduled 06:00 data pipeline run.',
    when: 'Completed at 06:12',
    action: 'No action required.',
    timestamp: '06:12',
    acknowledged: true,
  },
];

const SEVERITY_CFG = {
  critical: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA', icon: XCircle, label: 'CRITICAL' },
  warning:  { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A', icon: AlertTriangle, label: 'WARNING' },
  normal:   { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0', icon: CheckCircle2, label: 'NORMAL' },
};

export function AlertsPage() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'normal'>('all');

  const handleAcknowledge = (id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);
  const counts = {
    critical: alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length,
    warning: alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length,
    normal: alerts.filter(a => a.severity === 'normal').length,
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl fade-in-up">
      <PageHeader
        title="Alerts"
        subtitle="Operational alerts with structured evidence — what, why, when, and recommended action"
      />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Bell className="w-4 h-4 text-[#617080]" />
        {[
          { key: 'all', label: 'All Alerts', count: alerts.filter(a => !a.acknowledged).length },
          { key: 'critical', label: 'Critical', count: counts.critical },
          { key: 'warning', label: 'Warning', count: counts.warning },
          { key: 'normal', label: 'Normal', count: counts.normal },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={`flex items-center gap-2 px-4 py-2 text-[12px] font-medium rounded-lg border transition-colors ${
              filter === f.key
                ? 'bg-[#071A2B] text-white border-[#071A2B]'
                : 'bg-white text-[#617080] border-[#DCE3E8] hover:bg-[#F3F8FC]'
            }`}
          >
            {f.label}
            {f.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                filter === f.key ? 'bg-white/20 text-white' : 'bg-[#FEE2E2] text-[#DC2626]'
              }`}>{f.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-4">
        {filtered.map((alert) => {
          const cfg = SEVERITY_CFG[alert.severity];
          const Icon = cfg.icon;
          return (
            <div
              key={alert.id}
              className={`hl-card rounded-xl overflow-hidden transition-opacity ${alert.acknowledged ? 'opacity-60' : ''}`}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-3 border-b border-[#DCE3E8]"
                style={{ background: cfg.bg, borderColor: cfg.border }}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" style={{ color: cfg.text }} />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider mr-2" style={{ color: cfg.text }}>{cfg.label}</span>
                    <span className="text-[13px] font-bold text-[#071A2B]">{alert.title}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-[#617080] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {alert.timestamp}
                  </span>
                  <span className="text-[11px] text-[#617080]">{alert.location}</span>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors text-[#617080] bg-white border border-[#DCE3E8] hover:bg-[#F3F8FC]"
                    >
                      Acknowledge
                    </button>
                  )}
                  {alert.acknowledged && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#16A34A]">
                      <CheckCircle2 className="w-3 h-3" />
                      Acknowledged
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#DCE3E8] p-0">
                {[
                  { label: 'WHAT', content: alert.what },
                  { label: 'WHY', content: alert.why },
                  { label: 'WHEN', content: alert.when },
                  { label: 'ACTION', content: alert.action, action: true },
                ].map(({ label, content, action }) => (
                  <div key={label} className="px-5 py-4">
                    <p className="text-[9px] font-bold text-[#617080] uppercase tracking-wider mb-2">{label}</p>
                    <p className={`text-[12px] leading-relaxed ${action ? 'text-[#071A2B] font-medium' : 'text-[#617080]'}`}>
                      {action && <ArrowRight className="w-3 h-3 inline mr-1 text-[#1677C8]" />}
                      {content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
