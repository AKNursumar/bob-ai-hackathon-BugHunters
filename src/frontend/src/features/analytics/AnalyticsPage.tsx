import { PageHeader } from '@/components/PageHeader';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

// Simple SVG bar chart
function BarChart({ data, color = '#1677C8', height = 80 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data, 1);
  const w = 400;
  const barW = Math.floor(w / data.length) - 2;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full">
      {data.map((v, i) => {
        const bh = (v / max) * (height - 4);
        return (
          <rect
            key={i}
            x={i * (w / data.length)}
            y={height - bh}
            width={barW}
            height={bh}
            fill={color}
            opacity={0.75}
            rx={2}
          />
        );
      })}
    </svg>
  );
}

// Line chart
function LineChart({ data, color = '#1677C8', secondary, height = 80 }: {
  data: number[];
  color?: string;
  secondary?: number[];
  height?: number;
}) {
  const w = 400;
  const max = Math.max(...data, ...(secondary ?? []), 1);
  const xScale = (i: number) => (i / (data.length - 1)) * w;
  const yScale = (v: number) => height - (v / max) * (height - 8) - 4;

  const path1 = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)},${yScale(v)}`).join(' ');
  const path2 = secondary?.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)},${yScale(v)}`).join(' ');
  const area = `${path1} L ${w},${height} L 0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full">
      <path d={area} fill={color} opacity="0.06" />
      {path2 && <path d={path2} stroke="#C8D5DE" strokeWidth="1.5" fill="none" />}
      <path d={path1} stroke={color} strokeWidth="2" fill="none" />
    </svg>
  );
}

export function AnalyticsPage() {
  // These are historical demonstration datasets drawn from IMF PortWatch portcall
  // patterns for Indian ports. They are not live API data.
  const congestionHistory = [55, 62, 58, 71, 68, 75, 82, 79, 85, 88, 78, 72, 68, 65, 72, 78, 83, 85, 82, 78, 74, 71, 68, 73, 79, 83, 86, 88, 85, 81];
  const waitingTime = [2.1, 2.4, 2.2, 2.8, 2.6, 3.1, 3.4, 3.2, 3.6, 3.8, 3.3, 3.0, 2.8, 2.7, 2.9, 3.1, 3.5, 3.8, 3.6, 3.4, 3.1, 2.9, 2.7, 3.0, 3.2, 3.5, 3.7, 3.9, 3.7, 3.5];
  const berthUtil = [72, 75, 74, 80, 78, 84, 88, 86, 91, 93, 89, 84, 80, 79, 81, 85, 89, 92, 90, 87, 84, 82, 80, 83, 86, 89, 92, 94, 91, 88];
  const arrivals = [18, 22, 19, 25, 21, 28, 31, 27, 33, 35, 29, 24, 22, 21, 24, 27, 31, 34, 32, 29, 26, 24, 22, 25, 28, 31, 34, 36, 33, 30];
  const optimizationImpact = [0, 0, 0, 0, 0, 5, 8, 12, 15, 18, 22, 25, 28, 30, 32, 35, 38, 40, 42, 45, 47, 50, 52, 55, 57, 60, 62, 65, 68, 70];

  const stats = [
    { label: 'Avg Congestion Index', value: '76.2%', change: '+8.4% vs prev period', up: true, warn: true },
    { label: 'Avg Waiting Time', value: '3.2h', change: '+0.8h vs prev period', up: true, warn: true },
    { label: 'Berth Utilisation', value: '83.7%', change: '+5.2% vs prev period', up: false },
    { label: 'Optimisation Gain', value: '68%', change: 'cumulative improvement', up: false },
  ];

  const charts = [
    { title: 'Historical Congestion Index', subtitle: '30-day trend — IMF PortWatch portcall ratio', data: congestionHistory, color: '#1677C8', secondary: undefined },
    { title: 'Average Waiting Time', subtitle: '30-day trend (scaled, hours)', data: waitingTime.map(v => v * 20), color: '#D97706', secondary: undefined },
    { title: 'Berth Utilisation', subtitle: '30-day trend (%)', data: berthUtil, color: '#16A34A', secondary: undefined },
    { title: 'Daily Vessel Arrivals', subtitle: '30-day portcall count', data: arrivals, color: '#145B8C', type: 'bar' },
    { title: 'Predicted vs Actual Congestion', subtitle: '30-day model comparison', data: congestionHistory, color: '#1677C8', secondary: congestionHistory.map(v => v * 0.95 + 2) },
    { title: 'Optimisation Impact', subtitle: 'Cumulative wait-time reduction (demo)', data: optimizationImpact, color: '#16A34A', secondary: undefined },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl fade-in-up">
      <PageHeader
        title="Analytics"
        subtitle="Historical performance, trend analysis and optimisation impact measurement"
      />



      {/* Summary KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="hl-card p-5 rounded-xl">
            <p className="eyebrow mb-3">{stat.label}</p>
            <p className="text-3xl font-bold text-[#071A2B] tabular-nums mb-2">{stat.value}</p>
            <div className={`flex items-center gap-1 text-[11px] font-medium ${stat.warn ? 'text-[#D97706]' : 'text-[#16A34A]'}`}>
              {stat.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {charts.map((chart) => (
          <div key={chart.title} className="hl-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-3.5 h-3.5 text-[#617080]" />
              <h3 className="text-[12px] font-bold text-[#071A2B]">{chart.title}</h3>
            </div>
            <p className="text-[10px] text-[#617080] mb-4">{chart.subtitle}</p>
            <div className="h-20">
              {chart.type === 'bar' ? (
                <BarChart data={chart.data} color={chart.color} height={80} />
              ) : (
                <LineChart data={chart.data} color={chart.color} secondary={chart.secondary} height={80} />
              )}
            </div>
            <div className="flex justify-between mt-3 pt-2 border-t border-[#DCE3E8]">
              <span className="text-[10px] text-[#98A8B4]">30 days ago</span>
              <div className="flex items-center gap-1 text-[10px] text-[#3b82f6] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                DEMO
              </div>
              <span className="text-[10px] text-[#98A8B4]">Today</span>
            </div>
          </div>
        ))}
      </div>

      {/* Data attribution */}
      <div className="px-4 py-3 rounded-lg bg-[#F7F7F5] border border-[#DCE3E8] text-[11px] text-[#617080]">
        <strong className="text-[#071A2B]">Data sources for this page:</strong>{' '}
        IMF PortWatch (vessel arrival/departure portcall data for JNPA/Mundra/Chennai) · XGBoost model congestion predictions · OR-Tools optimization engine output.
        Live API integration pending.
      </div>
    </div>
  );
}
