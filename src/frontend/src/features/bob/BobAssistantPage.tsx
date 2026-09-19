import { useState, useEffect, useRef } from 'react';
import { Bot, Send, Cpu, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { apiUrl } from '@/lib/apiUrl';
import { usePort } from '@/contexts/PortContext';

interface MCPTool {
  name: string;
  description: string;
  status: 'registered' | 'active';
}

const FALLBACK_TOOLS: MCPTool[] = [
  { name: 'get_port_status', description: 'Retrieve real-time port capacity, waiting vessels, and crane utilization', status: 'registered' },
  { name: 'get_vessel_schedule', description: 'Query scheduled vessel arrival queue and planned berthing windows', status: 'registered' },
  { name: 'get_congestion_forecast', description: 'Query 24h, 48h, and 72h XGBoost congestion forecasts and risk probabilities', status: 'registered' },
  { name: 'get_congestion_hotspots', description: 'Identify spatial and temporal bottlenecks across berths and anchorage', status: 'registered' },
  { name: 'get_berth_status', description: 'Inspect available length, draft, and active gantry crane count per berth', status: 'registered' },
  { name: 'get_crane_status', description: 'Get crane availability and status per berth', status: 'registered' },
  { name: 'optimise_schedule', description: 'Trigger OR-Tools CP-SAT constraint solver to minimize vessel turnaround delays', status: 'registered' },
  { name: 'run_what_if', description: 'Run non-destructive what-if simulations for weather and equipment disruptions', status: 'registered' },
  { name: 'generate_72_hour_plan', description: 'Compile and lock the 72-hour operational plan for terminal operators', status: 'registered' },
  { name: 'explain_congestion', description: 'Explain forecast risk drivers with human-readable feature importance', status: 'registered' },
  { name: 'analyze_space_occupancy', description: 'Identify safe parallel berthing opportunities in unused berth space', status: 'registered' },
];

function resolveToolCall(text: string, portId: string): { tool: string; args: Record<string, unknown> } | null {
  const lower = text.toLowerCase();
  if (lower.includes('watch') || lower.includes('handover') || lower.includes('notes')) return { tool: 'explain_congestion', args: { port_id: portId, horizon: '24h' } };
  if (lower.includes('vessel schedule') || lower.includes('arrival')) return { tool: 'get_vessel_schedule', args: { port_id: portId, horizon_hours: 72 } };
  if (lower.includes('status') || lower.includes('port')) return { tool: 'get_port_status', args: { port_id: portId } };
  if (lower.includes('space') || lower.includes('occupancy') || lower.includes('unused berth') || lower.includes('parallel berth') || lower.includes('parallel berthing') || lower.includes('fit vessels')) return { tool: 'analyze_space_occupancy', args: { port_id: portId, include_waiting_vessels: true } };
  if (lower.includes('berth')) return { tool: 'get_berth_status', args: { port_id: portId } };
  if (lower.includes('crane')) return { tool: 'get_crane_status', args: { port_id: portId } };
  if (lower.includes('forecast') || lower.includes('predict') || lower.includes('congestion')) return { tool: 'get_congestion_forecast', args: { port_id: portId, horizon: '24h' } };
  if (lower.includes('hotspot') || lower.includes('bottleneck')) return { tool: 'get_congestion_hotspots', args: { port_id: portId, horizon_hours: 24 } };
  if (lower.includes('optimis') || lower.includes('optimize') || lower.includes('solver')) return { tool: 'optimise_schedule', args: { port_id: portId, horizon_hours: 72 } };
  if (lower.includes('plan') || lower.includes('72')) return { tool: 'generate_72_hour_plan', args: { port_id: portId } };
  if (lower.includes('what-if') || lower.includes('scenario') || lower.includes('simulate')) return { tool: 'run_what_if', args: { port_id: portId, scenario_type: 'VESSEL_DELAY', parameters: { vessel_id: 'VS-001', delay_hours: 4 } } };
  if (lower.startsWith('execute ')) return { tool: text.slice('Execute '.length).trim(), args: { port_id: portId } };
  return null;
}

function formatToolResponse(toolName: string, result: Record<string, unknown>): string {
  if (!result.success) return `Tool Error [${toolName}]:\n\n${result.error ?? 'Unknown error.'}`;
  const data = result as Record<string, unknown>;
  switch (toolName) {
    case 'get_port_status': {
      const d = (data.data ?? data) as Record<string, unknown>;
      return `Port Status — ${d.port_name ?? 'JNPA / Nhava Sheva'}\n\nActive Berths: ${d.total_berths ?? 5}\nAvailable Cranes: ${d.available_cranes ?? 10}\nWaiting Vessels: ${d.waiting_vessels ?? d.vessels_at_anchor ?? '—'}\nCongestion Level: ${d.congestion_level ?? '—'}`;
    }
    case 'get_congestion_forecast':
      return `Congestion Forecast — ${data.horizon_hours}h\n\nRisk Level: ${data.congestion_level}\nProbability: ${((data.congestion_probability as number) * 100).toFixed(0)}%\nConfidence: ${((data.confidence as number) * 100).toFixed(0)}%`;
    case 'optimise_schedule': {
      const im = (data.improvement_metrics as Record<string, unknown>) ?? {};
      return `Optimisation Complete\n\nBaseline: ${im.baseline_total_waiting_hours}h → Optimized: ${im.optimized_total_waiting_hours}h\nImprovement: ${im.improvement_percent}%\nSolve time: ${data.solve_time_seconds}s`;
    }
    case 'generate_72_hour_plan':
      return `72-Hour Plan Generated\n\nPlan ID: ${data.plan_id}\nVessels: ${data.total_vessels}\nWaiting time: ${data.total_waiting_time_hours}h\nBerth utilisation: ${data.berth_utilization_percent}%`;
    case 'explain_congestion':
      return `Congestion Explanation\n\n${data.summary}\n\nTop drivers:\n${((data.driver_explanations as string[]) ?? []).map((d) => `  • ${d}`).join('\n')}`;
    default:
      return `Tool Output [${toolName}]:\n\n${JSON.stringify(data, null, 2).slice(0, 500)}`;
  }
}

// Structured Bob response card
function BobResponseCard({ text }: { text: string }) {
  // Check if this looks like a structured response
  const isStructured = text.includes('\n\n');
  const lines = text.split('\n');
  const title = lines[0];
  const rest = lines.slice(1).join('\n');

  return (
    <div className="hl-card rounded-xl p-4 max-w-[90%]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-md grid place-items-center" style={{ background: '#1677C8' }}>
          <Bot className="w-3 h-3 text-white" />
        </div>
        <span className="text-[11px] font-bold text-[#071A2B]">IBM Bob</span>
      </div>
      {isStructured ? (
        <>
          <p className="text-[13px] font-semibold text-[#071A2B] mb-2">{title}</p>
          <p className="text-[12px] text-[#617080] leading-relaxed whitespace-pre-wrap">{rest}</p>
        </>
      ) : (
        <p className="text-[12px] text-[#617080] leading-relaxed">{text}</p>
      )}
    </div>
  );
}

export function BobAssistantPage() {
  const { selectedPort } = usePort();
  const [mcpTools, setMcpTools] = useState<MCPTool[]>(FALLBACK_TOOLS);
  const [toolCount, setToolCount] = useState(FALLBACK_TOOLS.length);
  const [activePrompt, setActivePrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bob'; text: string; time: string }>>([
    {
      sender: 'bob',
      text: 'Connected to Harborline MCP. I have access to port status, vessel schedules, congestion forecasts, the optimisation solver, and the 72-hour planning engine. How can I assist operations?',
      time: new Date().toLocaleTimeString(),
    },
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(apiUrl('/api/v1/mcp/tools'))
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && Array.isArray(data.tools) && data.tools.length > 0) {
          const tools: MCPTool[] = data.tools.map((t: { name: string; description: string }) => ({
            name: t.name, description: t.description, status: 'registered' as const,
          }));
          setMcpTools(tools);
          setToolCount(tools.length);
          setMessages((prev) => [...prev, {
            sender: 'bob',
            text: `MCP server connected. ${tools.length} operational tools registered and ready.`,
            time: new Date().toLocaleTimeString(),
          }]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText ?? activePrompt;
    if (!textToSend.trim() || isExecuting) return;
    setMessages((prev) => [...prev, { sender: 'user', text: textToSend, time: new Date().toLocaleTimeString() }]);
    setActivePrompt('');
    setIsExecuting(true);

    try {
      const resolved = resolveToolCall(textToSend, selectedPort.id);
      if (resolved) {
        const res = await fetch(apiUrl(`/api/v1/mcp/tools/${resolved.tool}`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ arguments: resolved.args }),
        });
        const result: Record<string, unknown> = res.ok ? await res.json() : { success: false, error: `HTTP ${res.status}` };
        setMessages((prev) => [...prev, { sender: 'bob', text: formatToolResponse(resolved.tool, result), time: new Date().toLocaleTimeString() }]);
      } else {
        setMessages((prev) => [...prev, {
          sender: 'bob',
          text: `I can query port status, vessel schedules, congestion forecasts, run the optimisation solver, or generate a 72-hour plan. Try one of the quick commands below.`,
          time: new Date().toLocaleTimeString(),
        }]);
      }
    } catch (err) {
      console.error('MCP call failed:', err);
      setMessages((prev) => [...prev, { sender: 'bob', text: 'MCP service temporarily unavailable. Please check backend connection.', time: new Date().toLocaleTimeString() }]);
    } finally {
      setIsExecuting(false);
    }
  };

  const quickCommands = [
    { label: 'Port Status', query: 'Check live Port Status & Capacities' },
    { label: 'Congestion Forecast', query: 'Get Congestion Forecast for next 24h' },
    { label: 'Run Optimizer', query: 'Run 72h Berth Optimization Solver' },
    { label: 'Generate Plan', query: 'Generate 72h Operations Plan' },
    { label: 'Explain Risk', query: 'Generate Watch Handover Notes' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl fade-in-up">
      <PageHeader
        title="IBM Bob"
        subtitle="AI operations copilot · Model Context Protocol (MCP) connected · 11 operational tools"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chat */}
        <div className="lg:col-span-7 hl-card rounded-xl flex flex-col" style={{ height: 600 }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#DCE3E8] shrink-0" style={{ background: '#071A2B' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: '#1677C8' }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white">IBM Bob · Operations Copilot</p>
                <p className="text-[10px] text-white/50">Harborline MCP Connected</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
              <span className="text-[11px] text-[#16A34A] font-bold">{toolCount} tools ready</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 min-h-0" style={{ background: '#F7F7F5' }}>
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="text-[10px] text-[#617080] mb-1 flex items-center gap-1">
                  <span>{m.sender === 'user' ? 'Watch Officer' : 'IBM Bob'}</span>
                  <span>· {m.time}</span>
                </div>
                {m.sender === 'user' ? (
                  <div
                    className="px-4 py-3 rounded-xl text-[13px] text-white max-w-[85%]"
                    style={{ background: '#071A2B' }}
                  >
                    {m.text}
                  </div>
                ) : (
                  <BobResponseCard text={m.text} />
                )}
              </div>
            ))}
            {isExecuting && (
              <div className="flex items-center gap-2 text-[12px] text-[#617080]">
                <Bot className="w-3.5 h-3.5 text-[#1677C8] animate-pulse" />
                Processing MCP tool request...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick commands */}
          <div className="px-4 py-3 border-t border-[#DCE3E8] shrink-0" style={{ background: '#F7F7F5' }}>
            <div className="flex flex-wrap gap-2">
              {quickCommands.map((cmd) => (
                <button
                  key={cmd.label}
                  onClick={() => handleSend(cmd.query)}
                  disabled={isExecuting}
                  className="px-3 py-1.5 text-[11px] font-medium bg-white border border-[#DCE3E8] rounded-lg text-[#617080] hover:bg-[#F3F8FC] transition-colors disabled:opacity-50"
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-[#DCE3E8] flex items-center gap-3 shrink-0">
            <input
              type="text"
              placeholder="Ask about port operations, forecasts, scheduling..."
              value={activePrompt}
              onChange={(e) => setActivePrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 text-[13px] border border-[#DCE3E8] rounded-lg px-4 py-2.5 text-[#071A2B] bg-white focus:outline-none focus:border-[#1677C8] transition-colors"
            />
            <button
              onClick={() => handleSend()}
              disabled={!activePrompt.trim() || isExecuting}
              className="px-4 py-2.5 rounded-lg text-white flex items-center gap-2 transition-all disabled:opacity-50"
              style={{ background: '#1677C8' }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MCP Tools directory */}
        <div className="lg:col-span-5 hl-card rounded-xl flex flex-col" style={{ height: 600 }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#DCE3E8] shrink-0">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#617080]" />
              <div>
                <p className="eyebrow mb-0.5">MCP Tools</p>
                <h3 className="text-[13px] font-bold text-[#071A2B]">Registered Capabilities ({toolCount})</h3>
              </div>
            </div>
            <span className="text-[10px] text-[#617080] bg-[#F3F8FC] px-2 py-1 rounded">/api/v1/mcp</span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-2 min-h-0">
            {mcpTools.map((tool) => (
              <button
                key={tool.name}
                onClick={() => handleSend(`Execute ${tool.name}`)}
                className="w-full text-left p-3 hl-card-flat rounded-lg hover:bg-[#F3F8FC] transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <code className="text-[11px] font-bold text-[#071A2B] group-hover:text-[#1677C8] transition-colors">
                    {tool.name}
                  </code>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                    <span className="text-[9px] font-bold text-[#16A34A] uppercase">Ready</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#617080] leading-snug line-clamp-2">{tool.description}</p>
                <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-3 h-3 text-[#1677C8]" />
                  <span className="text-[10px] text-[#1677C8] font-medium">Execute tool</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
