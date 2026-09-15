import { useState, useCallback, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Vessel } from '@/types/vessel';
import type { Berth, BerthStatus } from '@/types/berth';
import { ChartSkeleton } from '@/components/LoadingSkeleton';
import { ErrorState } from '@/components/ErrorState';

// ─── Coordinate projection ────────────────────────────────────────────────────

const MAP_BOUNDS = {
  latMin: 33.710,
  latMax: 33.755,
  lonMin: -118.335,
  lonMax: -118.255,
} as const;

const SVG_WIDTH = 680;
const SVG_HEIGHT = 420;

function projectLon(lon: number): number {
  return ((lon - MAP_BOUNDS.lonMin) / (MAP_BOUNDS.lonMax - MAP_BOUNDS.lonMin)) * SVG_WIDTH;
}

function projectLat(lat: number): number {
  return (1 - (lat - MAP_BOUNDS.latMin) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * SVG_HEIGHT;
}

// ─── Visual config ────────────────────────────────────────────────────────────

const VESSEL_STATUS_COLOR: Record<string, string> = {
  ARRIVING: '#00b4a6',
  AT_BERTH: '#0d1f2d',
  WAITING: '#f59e0b',
  DEPARTING: '#3a5468',
};

const BERTH_STATUS_COLOR: Record<BerthStatus, string> = {
  AVAILABLE: '#00b4a6',
  OCCUPIED: '#0d1f2d',
  WARNING: '#f59e0b',
  CRITICAL: '#e53e3e',
};

const BERTH_STATUS_FILL: Record<BerthStatus, string> = {
  AVAILABLE: '#e6faf9',
  OCCUPIED: '#e8f0f5',
  WARNING: '#fef9ec',
  CRITICAL: '#fef2f2',
};

// ─── Vessel marker ────────────────────────────────────────────────────────────

interface VesselMarkerProps {
  vessel: Vessel;
  isSelected: boolean;
  onSelect: (vessel: Vessel) => void;
}

function VesselMarker({ vessel, isSelected, onSelect }: VesselMarkerProps) {
  if (vessel.latitude === undefined || vessel.longitude === undefined) return null;

  const cx = projectLon(vessel.longitude);
  const cy = projectLat(vessel.latitude);
  const color = VESSEL_STATUS_COLOR[vessel.status] ?? '#6b8899';
  const r = vessel.status === 'AT_BERTH' ? 7 : 5;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Vessel: ${vessel.name}, status: ${vessel.status}`}
      onClick={() => onSelect(vessel)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(vessel);
      }}
      style={{ cursor: 'pointer' }}
    >
      {/* Selection ring */}
      {isSelected && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 5}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray="3 2"
          opacity={0.7}
        />
      )}
      {/* Vessel dot */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={color}
        stroke="#ffffff"
        strokeWidth={1.5}
        opacity={0.95}
      />
      {/* Vessel name label */}
      <text
        x={cx + r + 4}
        y={cy + 4}
        fontSize={9}
        fill="#0d1f2d"
        fontFamily="monospace"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {vessel.name.length > 16 ? vessel.name.slice(0, 14) + '…' : vessel.name}
      </text>
    </g>
  );
}

// ─── Berth marker ─────────────────────────────────────────────────────────────

interface BerthMarkerProps {
  berth: Berth;
}

function BerthMarker({ berth }: BerthMarkerProps) {
  if (berth.latitude === undefined || berth.longitude === undefined) return null;

  const cx = projectLon(berth.longitude);
  const cy = projectLat(berth.latitude);
  const color = BERTH_STATUS_COLOR[berth.status];
  const fill = BERTH_STATUS_FILL[berth.status];

  return (
    <g aria-label={`Berth: ${berth.name}, status: ${berth.status}`}>
      <rect
        x={cx - 10}
        y={cy - 7}
        width={20}
        height={14}
        rx={2}
        fill={fill}
        stroke={color}
        strokeWidth={1.5}
        opacity={0.85}
      />
      <text
        x={cx}
        y={cy + 4}
        fontSize={8}
        fill={color}
        textAnchor="middle"
        fontFamily="monospace"
        fontWeight="bold"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {berth.id}
      </text>
    </g>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function MapLegend() {
  const items = [
    { color: VESSEL_STATUS_COLOR.ARRIVING, label: 'Arriving' },
    { color: VESSEL_STATUS_COLOR.AT_BERTH, label: 'At Berth' },
    { color: VESSEL_STATUS_COLOR.WAITING, label: 'Waiting' },
    { color: VESSEL_STATUS_COLOR.DEPARTING, label: 'Departing' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#d1e0ea] mt-2">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-xs text-[#6b8899]">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: item.color }}
          />
          {item.label}
        </span>
      ))}
      <span className="flex items-center gap-1.5 text-xs text-[#6b8899]">
        <span className="w-4 h-2.5 rounded-sm border border-[#3a5468] bg-[#e8f0f5] shrink-0" />
        Berth
      </span>
    </div>
  );
}

// ─── Port Map ─────────────────────────────────────────────────────────────────

interface PortMapProps {
  vessels: Vessel[];
  berths: Berth[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  selectedVesselId?: string;
  onSelectVessel?: (vessel: Vessel) => void;
  centreVesselId?: string;
}

export function PortMap({
  vessels,
  berths,
  isLoading,
  isError,
  onRetry,
  selectedVesselId,
  onSelectVessel,
  centreVesselId,
}: PortMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: SVG_WIDTH, h: SVG_HEIGHT });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number; vbx: number; vby: number } | null>(null);

  const prevCentreRef = useRef<string | undefined>(undefined);
  if (centreVesselId && centreVesselId !== prevCentreRef.current) {
    prevCentreRef.current = centreVesselId;
    const vessel = vessels.find((v) => v.id === centreVesselId);
    if (vessel?.latitude !== undefined && vessel?.longitude !== undefined) {
      const cx = projectLon(vessel.longitude);
      const cy = projectLat(vessel.latitude);
      setViewBox((vb) => ({
        x: cx - vb.w / 2,
        y: cy - vb.h / 2,
        w: vb.w,
        h: vb.h,
      }));
    }
  }

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 0.87;
    setViewBox((vb) => {
      const newW = Math.min(SVG_WIDTH, Math.max(SVG_WIDTH * 0.25, vb.w * factor));
      const newH = Math.min(SVG_HEIGHT, Math.max(SVG_HEIGHT * 0.25, vb.h * factor));
      const cx = vb.x + vb.w / 2;
      const cy = vb.y + vb.h / 2;
      return { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH };
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, vbx: 0, vby: 0 };
    setViewBox((vb) => {
      panStart.current = { x: e.clientX, y: e.clientY, vbx: vb.x, vby: vb.y };
      return vb;
    });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !panStart.current) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setViewBox((vb) => {
        const scaleX = vb.w / SVG_WIDTH;
        const scaleY = vb.h / SVG_HEIGHT;
        return {
          x: panStart.current!.vbx - dx * scaleX,
          y: panStart.current!.vby - dy * scaleY,
          w: vb.w,
          h: vb.h,
        };
      });
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    panStart.current = null;
  }, []);

  const handleResetView = useCallback(() => {
    setViewBox({ x: 0, y: 0, w: SVG_WIDTH, h: SVG_HEIGHT });
  }, []);

  if (isLoading) return <ChartSkeleton className="h-full min-h-[320px]" />;
  if (isError) return <ErrorState message="Map data is currently unavailable." onRetry={onRetry} />;

  const vb = `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`;
  const mappableVessels = vessels.filter(
    (v) => v.latitude !== undefined && v.longitude !== undefined
  );
  const unmappableCount = vessels.length - mappableVessels.length;

  return (
    <div className="flex flex-col h-full">
      {/* Controls bar */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-3 text-xs text-[#6b8899]">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {mappableVessels.length} vessel{mappableVessels.length !== 1 ? 's' : ''} plotted
          </span>
          {unmappableCount > 0 && (
            <span className="text-[#9eb5c1]">
              · {unmappableCount} location unavailable
            </span>
          )}
        </div>
        <button
          onClick={handleResetView}
          className="text-xs text-[#6b8899] hover:text-[#0d1f2d] border border-[#d1e0ea] hover:border-[#b8cdd8] px-2 py-0.5 rounded-sm transition-colors"
          aria-label="Reset map view"
        >
          Reset view
        </button>
      </div>

      {/* SVG map canvas */}
      <div
        className={cn(
          'flex-1 min-h-[280px] bg-[#e8f0f5] border border-[#d1e0ea] rounded-sm overflow-hidden',
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        )}
        style={{ position: 'relative' }}
      >
        {/* Demo notice overlay */}
        <div
          className="absolute top-2 left-2 z-10 text-[9px] font-semibold tracking-widest text-[#9eb5c1] uppercase pointer-events-none select-none"
        >
          Schematic · Not real geography
        </div>

        <svg
          ref={svgRef}
          viewBox={vb}
          width="100%"
          height="100%"
          aria-label="Port operational map"
          role="img"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ display: 'block' }}
        >
          {/* Background water area */}
          <rect x={0} y={0} width={SVG_WIDTH} height={SVG_HEIGHT} fill="#cde9f0" />

          {/* Port basin outline (schematic) */}
          <rect
            x={SVG_WIDTH * 0.35}
            y={SVG_HEIGHT * 0.12}
            width={SVG_WIDTH * 0.55}
            height={SVG_HEIGHT * 0.72}
            rx={6}
            fill="#e8f0f5"
            stroke="#b8cdd8"
            strokeWidth={1.5}
          />

          {/* Quay line */}
          <rect
            x={SVG_WIDTH * 0.35}
            y={SVG_HEIGHT * 0.12}
            width={12}
            height={SVG_HEIGHT * 0.72}
            fill="#b8cdd8"
            opacity={0.7}
          />

          {/* Anchorage zone label */}
          <text
            x={SVG_WIDTH * 0.12}
            y={SVG_HEIGHT * 0.5}
            fontSize={10}
            fill="#9eb5c1"
            textAnchor="middle"
            fontFamily="monospace"
            style={{ userSelect: 'none' }}
          >
            ANCHORAGE
          </text>
          <text
            x={SVG_WIDTH * 0.12}
            y={SVG_HEIGHT * 0.5 + 14}
            fontSize={10}
            fill="#9eb5c1"
            textAnchor="middle"
            fontFamily="monospace"
            style={{ userSelect: 'none' }}
          >
            ZONE
          </text>

          {/* Port basin label */}
          <text
            x={SVG_WIDTH * 0.63}
            y={SVG_HEIGHT * 0.93}
            fontSize={9}
            fill="#9eb5c1"
            textAnchor="middle"
            fontFamily="monospace"
            style={{ userSelect: 'none' }}
          >
            PORT BASIN
          </text>

          {/* Compass rose */}
          <g transform={`translate(${SVG_WIDTH - 36}, 28)`}>
            <text fontSize={9} fill="#9eb5c1" textAnchor="middle" y={-10} fontFamily="monospace">N</text>
            <line x1={0} y1={-8} x2={0} y2={8} stroke="#9eb5c1" strokeWidth={1} />
            <line x1={-8} y1={0} x2={8} y2={0} stroke="#9eb5c1" strokeWidth={1} />
          </g>

          {/* Berth markers — render below vessel markers */}
          {berths.map((berth) => (
            <BerthMarker key={berth.id} berth={berth} />
          ))}

          {/* Vessel markers */}
          {mappableVessels.map((vessel) => (
            <VesselMarker
              key={vessel.id}
              vessel={vessel}
              isSelected={vessel.id === selectedVesselId}
              onSelect={onSelectVessel ?? ((_v: Vessel) => {})}
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <MapLegend />
    </div>
  );
}
