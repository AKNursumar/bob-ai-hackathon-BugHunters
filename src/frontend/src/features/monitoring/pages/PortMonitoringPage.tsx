import { useState, useCallback } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useMonitoringData } from '@/hooks/useMonitoringData';
import { MONITORING_STALE_THRESHOLD_MS } from '@/services/api/monitoringService';
import { PageHeader } from '@/components/PageHeader';
import { ErrorState } from '@/components/ErrorState';
import { MonitoringSummaryRow } from '../components/MonitoringSummaryRow';
import { PortMap } from '../components/PortMap';
import { BerthStatusPanel } from '../components/BerthStatusPanel';
import { VesselTable } from '../components/VesselTable';
import { ActivityChart } from '../components/ActivityChart';
import { WaitingVesselList } from '../components/WaitingVesselList';
import { VesselDetailDrawer } from '../components/VesselDetailDrawer';
import type { VesselFilterState } from '../components/VesselFilters';
import type { Vessel } from '@/types/vessel';
import { formatDateTime } from '@/lib/format';

// ─── Thin card wrapper shared within this page ────────────────────────────────

function MonitoringCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`operational-card bg-white border border-[#d1e0ea] rounded-sm flex flex-col ${className ?? ''}`}
    >
      <div className="px-4 py-3 border-b border-[#d1e0ea] shrink-0 bg-[#f4f8fb]">
        <h2 className="eyebrow text-[#6b8899]">{title}</h2>
      </div>
      <div className="p-4 flex-1 min-h-0">{children}</div>
    </div>
  );
}

// ─── Sync status indicator ────────────────────────────────────────────────────

function SyncStatus({ lastUpdated }: { lastUpdated: string | undefined }) {
  if (!lastUpdated) return null;

  const ageMs = Date.now() - new Date(lastUpdated).getTime();
  const isStale = ageMs > MONITORING_STALE_THRESHOLD_MS;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {isStale ? (
        <>
          <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
          <span className="text-[#f59e0b] font-semibold">DATA DELAYED</span>
          <span className="text-[#6b8899]">Last successful update: {formatDateTime(lastUpdated)}</span>
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-[#00b4a6] shrink-0" />
          <span className="text-[#00b4a6] font-semibold tracking-wider">LIVE</span>
          <span className="text-[#6b8899]">Last updated {formatDateTime(lastUpdated)}</span>
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PortMonitoringPage() {
  const { data, isLoading, isError, refetch, isFetching } = useMonitoringData();

  // UI state — local only
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [centreVesselId, setCentreVesselId] = useState<string | undefined>();
  const [filters, setFilters] = useState<VesselFilterState>({
    search: '',
    status: 'ALL',
    type: 'ALL',
    berthId: 'ALL',
  });

  const handleSelectVessel = useCallback((vessel: Vessel) => {
    setSelectedVessel(vessel);
  }, []);

  const handleSelectVesselById = useCallback(
    (vesselId: string) => {
      const vessel = data?.vessels.find((v) => v.id === vesselId);
      if (vessel) setSelectedVessel(vessel);
    },
    [data?.vessels]
  );

  const handleCloseDrawer = useCallback(() => {
    setSelectedVessel(null);
  }, []);

  const handleViewOnMap = useCallback((vessel: Vessel) => {
    setCentreVesselId(vessel.id);
    setSelectedVessel(null);
  }, []);

  const vessels = data?.vessels ?? [];
  const berths = data?.berths ?? [];
  const activityHistory = data?.activityHistory ?? [];

  // Full-page error (data failed entirely and we have no cached data)
  if (isError && !data) {
    return (
      <div className="p-4 md:p-7 max-w-screen-2xl">
        <PageHeader
          title="Port Monitoring"
          subtitle="Live operational view of vessel and berth activity."
        />
        <ErrorState
          message="Unable to load port monitoring data."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-7 space-y-5 max-w-screen-2xl">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <PageHeader
        title="Port Monitoring"
        subtitle="Live operational view of vessel and berth activity."
        actions={
          <div className="flex items-center gap-3">
            <SyncStatus lastUpdated={data?.summary.lastUpdated} />
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#00b4a6] hover:bg-[#009e91] border border-[#009e91] rounded-sm transition-colors disabled:opacity-50"
              aria-label="Refresh monitoring data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        }
      />

      {/* ── Demo data notice ──────────────────────────────────────────── */}
      <div className="px-3 py-2.5 bg-[#e6faf9] border-l-2 border-[#00b4a6] text-xs text-[#3a5468]">
        <span className="font-bold tracking-wide">TRAINING VIEW</span> — This page displays simulated
        demonstration data. It does not represent live vessel positions or real port operational data.
      </div>

      {/* ── Stale-data banner (data loaded but now stale) ─────────────── */}
      {isError && data && (
        <div className="px-3 py-2.5 bg-[#fef9ec] border-l-2 border-[#f59e0b] text-xs text-[#3a5468] flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
          <span>
            <span className="font-bold">DATA DELAYED</span> — Unable to refresh. Displaying last
            known data.{' '}
            <button onClick={() => refetch()} className="underline hover:text-[#0d1f2d]">
              Retry
            </button>
          </span>
        </div>
      )}

      {/* ── KPI row ───────────────────────────────────────────────────── */}
      <MonitoringSummaryRow
        summary={data?.summary}
        isLoading={isLoading}
        isError={isError && !data}
        onRetry={() => refetch()}
      />

      {/* ── Map + Berth status ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Port map — spans 3 cols on desktop */}
        <MonitoringCard title="Port Map" className="lg:col-span-3">
          <div className="h-80 lg:h-96">
            <PortMap
              vessels={vessels}
              berths={berths}
              isLoading={isLoading}
              isError={isError && !data}
              onRetry={() => refetch()}
              selectedVesselId={selectedVessel?.id}
              onSelectVessel={handleSelectVessel}
              centreVesselId={centreVesselId}
            />
          </div>
        </MonitoringCard>

        {/* Berth status panel — spans 2 cols on desktop */}
        <MonitoringCard title="Port Status — Berth Utilisation" className="lg:col-span-2">
          <BerthStatusPanel
            berths={berths}
            isLoading={isLoading}
            isError={isError && !data}
            onRetry={() => refetch()}
            onSelectVessel={handleSelectVesselById}
          />
        </MonitoringCard>
      </div>

      {/* ── Vessel activity table ─────────────────────────────────────── */}
      <MonitoringCard title="Vessel Activity">
        <div className="-mx-4 -mb-4">
          <VesselTable
            vessels={vessels}
            berths={berths}
            isLoading={isLoading}
            isError={isError && !data}
            onRetry={() => refetch()}
            filters={filters}
            onFiltersChange={setFilters}
            onSelectVessel={handleSelectVessel}
            selectedVesselId={selectedVessel?.id}
          />
        </div>
      </MonitoringCard>

      {/* ── Activity chart + Waiting vessels ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <MonitoringCard title="Arrivals vs Departures — Last 24h" className="lg:col-span-3">
          <div className="flex items-center gap-4 mb-3">
            <span className="flex items-center gap-1.5 text-xs text-[#6b8899]">
              <span className="w-3 h-2.5 rounded-sm bg-[#0d1f2d] inline-block" />
              Arrivals
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[#6b8899]">
              <span className="w-3 h-2.5 rounded-sm bg-[#00b4a6] inline-block" />
              Departures
            </span>
          </div>
          <div className="h-52">
            <ActivityChart
              data={activityHistory}
              isLoading={isLoading}
              isError={isError && !data}
              onRetry={() => refetch()}
            />
          </div>
        </MonitoringCard>

        <MonitoringCard title="Waiting Vessels" className="lg:col-span-2">
          <WaitingVesselList
            vessels={vessels}
            isLoading={isLoading}
            onSelectVessel={handleSelectVessel}
          />
        </MonitoringCard>
      </div>

      {/* ── Vessel detail drawer ───────────────────────────────────────── */}
      <VesselDetailDrawer
        vessel={selectedVessel}
        berths={berths}
        onClose={handleCloseDrawer}
        onViewOnMap={handleViewOnMap}
      />
    </div>
  );
}
