import { Link } from 'react-router-dom';
import {
  Anchor, ArrowRight, TrendingUp, Layers, Ship, Radio, MapPin,
  FlaskConical, BarChart2, CheckCircle2, ShieldAlert, Cpu, Database, Zap,
} from 'lucide-react';

// ─── Navigation ──────────────────────────────────────────────────────────────

function Navigation() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-14 py-6">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 grid place-items-center rounded-lg bg-gradient-to-br from-[#1677C8] to-[#0A3D6B] border border-[#1677C8]/30 shadow-lg">
          <Anchor className="w-4 h-4 text-white" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">HARBORLINE</span>
      </div>
      <div className="hidden md:flex items-center gap-8">
        {[
          { label: 'Product', id: 'product' },
          { label: 'How it Works', id: 'how-it-works' },
          { label: 'Capabilities', id: 'capabilities' },
        ].map((item) => (
          <a
            key={item.label}
            href={`#${item.id}`}
            className="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            {item.label}
          </a>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <Link to="/login" className="hidden md:block text-sm font-semibold text-white/80 hover:text-white transition-colors">
          Login
        </Link>
        <Link
          to="/login"
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-md transition-all bg-[#1677C8] hover:bg-[#145b8c] shadow-lg"
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </nav>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <div className="relative min-h-screen bg-[#030914] flex flex-col justify-center overflow-hidden">
      <Navigation />

      {/* Real maritime photograph — full bleed background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero.jpg"
          alt="Indian container port terminal at golden hour — cranes, vessels, stacked containers"
          className="w-full h-full object-cover object-center"
          loading="eager"
        />
        {/* Deep gradient overlay — left to right: dark for text, fades to translucent */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#030914] via-[#030914]/80 to-[#030914]/30" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#030914] to-transparent" />
      </div>

      {/* Subtle grid overlay — maritime navigation chart feel */}
      <div
        className="absolute inset-0 z-[1] opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(76,163,227,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(76,163,227,0.15) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 px-6 lg:px-14 max-w-7xl mx-auto w-full pt-28 pb-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#1677C8]/40 bg-[#1677C8]/15 mb-8 backdrop-blur-sm">
            <Radio className="w-3.5 h-3.5 text-[#4CA3E3]" />
            <span className="text-xs font-bold text-[#4CA3E3] uppercase tracking-widest">
              Port Operations Intelligence
            </span>
          </div>

          <h1 className="text-5xl lg:text-[68px] font-bold text-white leading-[1.05] tracking-tight mb-8 drop-shadow-sm">
            See the pressure<br />before the port<br />feels it.
          </h1>

          <p className="text-lg lg:text-xl text-white/75 leading-relaxed mb-10 max-w-xl font-light">
            Harborline combines real vessel intelligence, historical port activity and predictive
            congestion analysis to help teams understand what is happening now and prepare for
            what comes next.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 text-[15px] font-bold text-white rounded-md transition-all shadow-[0_0_24px_rgba(22,119,200,0.5)] hover:shadow-[0_0_40px_rgba(22,119,200,0.7)] bg-[#1677C8] hover:bg-[#145b8c]"
            >
              Get Started <ArrowRight className="w-4.5 h-4.5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-8 py-4 text-[15px] font-bold text-white rounded-md border border-white/20 bg-white/8 hover:bg-white/15 transition-colors backdrop-blur-sm"
            >
              Explore Platform
            </a>
          </div>

          {/* Quick stats — real product claims only */}
          <div className="flex flex-wrap gap-6 mt-12 pt-10 border-t border-white/10">
            {[
              { label: 'Indian Ports Covered', value: '5' },
              { label: 'Forecast Horizons', value: '24h · 48h · 72h' },
              { label: 'ML Model', value: 'XGBoost' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-xl font-bold text-white tabular-nums">{s.value}</div>
                <div className="text-xs text-white/45 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom port attribution */}
      <div className="absolute bottom-4 right-6 z-10 text-[10px] text-white/25">
        Indian container terminal — operational port photography
      </div>
    </div>
  );
}

// ─── Problem Section ──────────────────────────────────────────────────────────

function ProblemSection() {
  return (
    <div id="product" className="py-24 bg-[#071A2B] border-b border-white/[0.05]">
      <div className="max-w-4xl mx-auto px-6 lg:px-14 text-center">
        <ShieldAlert className="w-10 h-10 text-[#4CA3E3] mx-auto mb-6 opacity-80" />
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
          Port teams often see congestion after pressure has already built.
        </h2>
        <p className="text-[#98A8B4] text-lg md:text-xl leading-relaxed font-light">
          Reacting to delays at the berth is too late. Harborline connects upstream vessel movements
          with historically trained ML models to detect the buildup of pressure before the port
          becomes overwhelmed. It explains the causes, simulates disruptions, and generates an
          actionable 72-hour operating plan.
        </p>
      </div>
    </div>
  );
}

// ─── Workflow Section ─────────────────────────────────────────────────────────

function WorkflowSection() {
  const steps = [
    { label: 'Monitor', desc: 'Track live vessel arrivals via AIS and historical portcall data', icon: Radio },
    { label: 'Predict', desc: 'Forecast 24/48/72h congestion probability with XGBoost models', icon: TrendingUp },
    { label: 'Explain', desc: 'Identify which metrics are driving the risk signal', icon: BarChart2 },
    { label: 'Simulate', desc: 'Test what-if disruption scenarios with OR-Tools', icon: FlaskConical },
    { label: 'Optimise', desc: 'Re-schedule vessels and berths to minimise waiting time', icon: Layers },
  ];

  return (
    <div id="how-it-works" className="py-24 bg-[#030914] border-b border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-6 lg:px-14">
        <div className="mb-14 text-center">
          <p className="text-[#4CA3E3] text-xs font-bold uppercase tracking-widest mb-3">
            How Harborline Works
          </p>
          <h2 className="text-3xl font-bold text-white">The operational workflow</h2>
        </div>

        <div className="flex flex-col md:flex-row items-stretch justify-between gap-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.label}
                className="flex-1 p-6 rounded-lg bg-[#071A2B] border border-white/[0.06] flex flex-col items-center text-center relative group hover:border-[#4CA3E3]/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#1677C8]/15 border border-[#1677C8]/25 flex items-center justify-center text-[#4CA3E3] mb-4 group-hover:bg-[#1677C8]/25 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="w-5 h-5 rounded-full bg-[#1677C8]/20 flex items-center justify-center text-[#4CA3E3] font-bold text-[10px] mb-3">
                  {i + 1}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{step.label}</h3>
                <p className="text-sm text-[#98A8B4] leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-5 h-5 text-white/15" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Capabilities Section ─────────────────────────────────────────────────────

function CapabilitiesSection() {
  const features = [
    {
      title: 'Real-time vessel intelligence',
      desc: 'Live AIS tracking of container ships heading to Indian ports via AISStream.io integration.',
      icon: Ship,
      tag: 'AISStream',
    },
    {
      title: '24/48/72h congestion forecasting',
      desc: 'Predictive risk scores powered by XGBoost models trained on IMF PortWatch portcall data.',
      icon: TrendingUp,
      tag: 'XGBoost · IMF PortWatch',
    },
    {
      title: 'Congestion driver analysis',
      desc: 'Feature importance from the trained model — identifies which metrics (queue acceleration, dwell time, vessel volume) are driving the risk signal.',
      icon: BarChart2,
      tag: 'Model Explanation',
    },
    {
      title: 'What-if simulation',
      desc: 'Test the impact of delayed vessels, offline cranes or berth unavailability on total operations using OR-Tools.',
      icon: FlaskConical,
      tag: 'OR-Tools',
    },
    {
      title: 'Operational optimisation',
      desc: 'Generate optimal berth assignments and crane allocations using Google OR-Tools CP-SAT constraint programming.',
      icon: Layers,
      tag: 'CP-SAT Solver',
    },
    {
      title: '72-hour operations planning',
      desc: 'Generate a structured 72-hour plan for port supervisors including hotspot identification and risk assessment per time window.',
      icon: Zap,
      tag: 'Planning Engine',
    },
    {
      title: 'IBM Bob assistant',
      desc: 'Interact with Harborline using natural language via IBM Bob — query port status, run forecasts, explain congestion.',
      icon: Cpu,
      tag: 'IBM Bob · watsonx.ai',
    },
    {
      title: 'Indian port intelligence',
      desc: 'Focused exclusively on Indian ports: JNPA/Nhava Sheva, Mundra, Chennai, Kandla and Visakhapatnam.',
      icon: MapPin,
      tag: 'Indian Ports Only',
    },
  ];

  return (
    <div id="capabilities" className="py-24 bg-[#071A2B] border-b border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-6 lg:px-14">
        <div className="mb-14">
          <p className="text-[#4CA3E3] text-xs font-bold uppercase tracking-widest mb-3">Capabilities</p>
          <h2 className="text-3xl font-bold text-white mb-4">Product Capabilities</h2>
          <p className="text-[#98A8B4] text-lg max-w-2xl">
            A complete operational intelligence suite for modern Indian port management.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-5 rounded-xl bg-[#030914] border border-white/[0.05] hover:border-[#4CA3E3]/30 transition-colors group"
            >
              <f.icon className="w-5 h-5 text-[#4CA3E3] mb-4" />
              <h3 className="text-[14px] font-bold text-white mb-2 leading-snug">{f.title}</h3>
              <p className="text-[12px] text-[#98A8B4] leading-relaxed mb-4">{f.desc}</p>
              <span className="inline-block text-[9px] font-bold text-[#4CA3E3] bg-[#1677C8]/10 border border-[#1677C8]/20 px-2 py-0.5 rounded uppercase tracking-wider">
                {f.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Data Sources Section ─────────────────────────────────────────────────────

function DataSourcesSection() {
  const sources = [
    {
      name: 'IMF PortWatch',
      desc: 'Historical portcall data — vessel arrivals, departures, waiting times for Indian ports.',
      verified: true,
    },
    {
      name: 'AISStream.io',
      desc: 'Live AIS vessel position and movement data for real-time monitoring.',
      verified: true,
    },
    {
      name: 'Indian Port Schedules',
      desc: 'Government and port authority vessel scheduling data for JNPA, Mundra, Chennai.',
      verified: true,
    },
    {
      name: 'XGBoost ML Models',
      desc: 'Trained on 1,400+ days of portcall history. Produces 24h/48h/72h congestion probability scores.',
      verified: true,
    },
  ];

  return (
    <div className="py-24 bg-[#030914] border-b border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-6 lg:px-14">
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-[#4CA3E3]" />
            <p className="text-white font-bold uppercase tracking-widest text-sm">
              Powered by Real Intelligence
            </p>
          </div>
          <p className="text-[#98A8B4] max-w-xl mx-auto">
            Every visualization in Harborline is traceable to a specific data source or model output.
            No fabricated numbers. No generic AI metrics.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {sources.map((s) => (
            <div
              key={s.name}
              className="p-5 rounded-xl bg-[#071A2B] border border-white/[0.06]"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0" />
                <span className="text-[13px] font-bold text-white">{s.name}</span>
              </div>
              <p className="text-[12px] text-[#98A8B4] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Product Preview Section ──────────────────────────────────────────────────

function ProductPreviewSection() {
  const ports = [
    { name: 'JNPA / Nhava Sheva', id: 'port776', risk: 'HIGH', prob: '83%' },
    { name: 'Mundra', id: 'port777', risk: 'MODERATE', prob: '61%' },
    { name: 'Chennai', id: 'port235', risk: 'LOW', prob: '34%' },
  ];

  const riskColor: Record<string, { text: string; bg: string; border: string }> = {
    HIGH:     { text: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
    CRITICAL: { text: '#DC2626', bg: '#FEE2E2', border: '#FECACA' },
    MODERATE: { text: '#1677C8', bg: '#DCEEFF', border: '#BAD7F8' },
    LOW:      { text: '#16A34A', bg: '#DCFCE7', border: '#BBF7D0' },
  };

  return (
    <div className="py-24 bg-[#071A2B] border-b border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-6 lg:px-14">
        <div className="mb-10 text-center">
          <p className="text-[#4CA3E3] text-xs font-bold uppercase tracking-widest mb-3">Product Interface</p>
          <h2 className="text-3xl font-bold text-white mb-4">The Harborline Dashboard</h2>
          <p className="text-[#98A8B4]">A glimpse of the operational intelligence interface — powered by real IMF PortWatch and XGBoost data.</p>
        </div>

        {/* Product UI preview — clearly labelled as interface preview */}
        <div className="relative rounded-xl border border-white/[0.08] bg-[#030914] shadow-2xl overflow-hidden max-w-4xl mx-auto">
          {/* Browser chrome */}
          <div className="h-10 border-b border-white/[0.08] flex items-center px-4 gap-2 bg-black/30">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#eab308]/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/70" />
            <span className="ml-4 text-xs font-medium text-white/30 tracking-wide">
              HARBORLINE — Interface Preview
            </span>
            <span className="ml-auto text-[9px] font-bold text-[#3b82f6] bg-[#1e3a8a]/40 px-2 py-0.5 rounded">
              PRODUCT INTERFACE — NOT LIVE DATA
            </span>
          </div>

          {/* Dashboard grid */}
          <div className="p-6 grid grid-cols-3 gap-4">
            {ports.map((port) => {
              const cfg = riskColor[port.risk];
              return (
                <div
                  key={port.id}
                  className="rounded-lg border p-4 flex flex-col"
                  style={{ background: cfg.bg + '22', borderColor: cfg.border + '55' }}
                >
                  <div className="text-[10px] text-white/40 mb-1 uppercase tracking-wide">{port.name}</div>
                  <div className="text-[11px] font-bold mb-3" style={{ color: cfg.text }}>
                    {port.risk} RISK
                  </div>
                  <div className="mt-auto">
                    <div className="text-[9px] text-white/30 mb-1">24h Congestion Probability</div>
                    <div className="text-2xl font-bold tabular-nums" style={{ color: cfg.text }}>
                      {port.prob}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="col-span-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-white/30 mb-1 uppercase tracking-wide">Active Port</div>
                <div className="text-sm font-bold text-white">JNPA / Nhava Sheva</div>
              </div>
              <div className="flex items-center gap-6 text-[11px] text-white/40">
                <span>Vessels in port: <strong className="text-white/70">—</strong></span>
                <span>Berths active: <strong className="text-white/70">—</strong></span>
                <span>Source: <strong className="text-[#4CA3E3]">IMF PortWatch</strong></span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-white/25 mt-4">
          Risk levels shown are representative of the product interface layout. Actual values are driven by real XGBoost model output.
        </p>
      </div>
    </div>
  );
}

// ─── Indian Ports Section ─────────────────────────────────────────────────────

function IndianPortsSection() {
  const ports = [
    { name: 'JNPA / Nhava Sheva', code: 'port776', region: 'West Coast — Mumbai', role: 'India\'s largest container port' },
    { name: 'Mundra', code: 'port777', region: 'West Coast — Gujarat', role: 'Largest private container terminal' },
    { name: 'Chennai', code: 'port235', region: 'East Coast — Tamil Nadu', role: 'Major east coast gateway' },
    { name: 'Kandla', code: 'port540', region: 'West Coast — Gujarat', role: 'Key bulk cargo terminal' },
    { name: 'Visakhapatnam', code: 'port1367', region: 'East Coast — Andhra Pradesh', role: 'Eastern deep-water port' },
  ];

  return (
    <div className="py-20 bg-[#030914] border-b border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-6 lg:px-14">
        <div className="mb-10">
          <p className="text-[#4CA3E3] text-xs font-bold uppercase tracking-widest mb-3">Coverage</p>
          <h2 className="text-2xl font-bold text-white mb-2">Indian Ports Only</h2>
          <p className="text-[#98A8B4] max-w-xl">
            Harborline is currently focused exclusively on Indian port operations.
            All models, data sources and forecasts are calibrated for the Indian maritime context.
          </p>
        </div>
        <div className="grid md:grid-cols-5 gap-3">
          {ports.map((port) => (
            <div
              key={port.code}
              className="p-4 rounded-lg bg-[#071A2B] border border-white/[0.06] hover:border-[#4CA3E3]/30 transition-colors"
            >
              <MapPin className="w-4 h-4 text-[#4CA3E3] mb-3" />
              <div className="text-[13px] font-bold text-white mb-1">{port.name}</div>
              <div className="text-[10px] text-[#617080] mb-2">{port.region}</div>
              <div className="text-[10px] text-[#98A8B4]">{port.role}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <div className="relative overflow-hidden bg-[#071A2B]">
      {/* Real imagery in CTA background — subtle */}
      <div className="absolute inset-0">
        <img
          src="/hero.jpg"
          alt=""
          className="w-full h-full object-cover object-center opacity-15"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[#071A2B]/80" />
      </div>

      <div className="relative z-10 py-32 flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight max-w-3xl">
          See what is building before it becomes a delay.
        </h2>
        <p className="text-[#98A8B4] text-lg mb-10 max-w-lg font-light">
          Start with JNPA. Switch to Mundra. Run a forecast. Simulate a disruption.
          Understand what drives Indian port congestion.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-8 py-4 text-[15px] font-bold text-white rounded-md bg-[#1677C8] hover:bg-[#145b8c] transition-colors shadow-xl"
        >
          Enter Harborline <ArrowRight className="w-4.5 h-4.5" />
        </Link>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-[#030914] border-t border-white/[0.05] py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-14 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 grid place-items-center rounded bg-gradient-to-br from-[#1677C8] to-[#0A3D6B]">
            <Anchor className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-[#98A8B4] tracking-wider">HARBORLINE</span>
        </div>
        <div className="text-xs text-[#617080] text-center">
          Built for IBM Bob AI Innovation Hackathon · BugHunters · Indian Ports: JNPA · Mundra · Chennai · Kandla · Visakhapatnam
        </div>
        <div className="text-xs text-[#617080]">
          © {new Date().getFullYear()} Harborline. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// ─── Homepage ─────────────────────────────────────────────────────────────────

export function Homepage() {
  return (
    <div className="min-h-screen bg-[#030914] font-sans selection:bg-[#1677C8] selection:text-white">
      <HeroSection />
      <ProblemSection />
      <WorkflowSection />
      <CapabilitiesSection />
      <ProductPreviewSection />
      <DataSourcesSection />
      <IndianPortsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
