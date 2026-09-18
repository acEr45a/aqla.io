import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AqlaLogo from "@/components/AqlaLogo";
import { 
  ShieldCheck, 
  Brain, 
  Chrome, 
  Layers, 
  ArrowRight, 
  Activity, 
  Lock, 
  Cpu, 
  CheckCircle2, 
  Sparkles,
  ChevronRight
} from "lucide-react";

const SECTIONS = [
  {
    id: "how-it-works",
    label: "How It Works",
    icon: Brain,
    badge: "Core Architecture",
    title: "Precision Cognitive Optimization",
    subtitle: "A continuous loop of measurement, analysis, and protocol delivery designed for high-performance mental output.",
    content: (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-lime-400/30 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 mb-4 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">1. Continuous Tracking</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Standardized psychometric paradigms measure reaction variance, focus depth, executive control, and working memory in short daily sessions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-lime-400/30 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 mb-4 group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">2. Dynamic Brain Mapping</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Real-time algorithms synthesize assessment signals into a 5-domain cognitive score matrix and interactive 3D neural map.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-lime-400/30 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 mb-4 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">3. Adaptive Protocols</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Personalized regimens (SPARK, RESTORE, HYPERFOCUS, NEUROSHIELD, FLOW) deliver targeted micro-habits calibrated to your readiness score.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-lime-400/[0.05] via-transparent to-transparent border border-lime-400/20">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lime-400"></span>
            The 5 Cognitive Domains
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
            {[
              { title: "Focus Depth", desc: "Sustained attention" },
              { title: "Working Memory", desc: "Information retention" },
              { title: "Executive Control", desc: "Response inhibition" },
              { title: "Processing Speed", desc: "Cognitive velocity" },
              { title: "Resilience", desc: "Stress recovery" }
            ].map((d, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-xs font-medium text-white block">{d.title}</span>
                <span className="text-[10px] text-white/50 block mt-0.5">{d.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  },
  {
    id: "data-privacy",
    label: "Data & Privacy",
    icon: ShieldCheck,
    badge: "Security & Sovereignty",
    title: "How We Protect Your Cognitive Data",
    subtitle: "Your mental health metrics and assessment data belong entirely to you. We maintain strict privacy boundaries.",
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white mb-1">Encrypted & Isolated</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                All data is encrypted in transit and at rest using enterprise industry standards. Strict access policies isolate your records so only authorized sessions can access your cognitive profile.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white mb-1">Zero Data Monetization</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                AQLA never sells, leases, or shares your personal cognitive profiles or assessment logs with third-party advertisers or data brokers.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
          <h4 className="text-sm font-semibold text-white mb-4">Core Privacy Principles</h4>
          <ul className="space-y-3">
            {[
              "Full Data Exportability: You can download your complete cognitive history at any time.",
              "Right to Erasure: Permanent account and metric deletion available directly from settings.",
              "Minimal Telemetry: We collect only operational performance logs required to maintain platform reliability."
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-xs text-white/70">
                <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  },
  {
    id: "chrome-extension",
    label: "Chrome Extension",
    icon: Chrome,
    badge: "Companion Integration",
    title: "AQLA Companion for Web Workflows",
    subtitle: "Seamlessly connect your daily web browsing and focus sessions directly with your AQLA cognitive dashboard.",
    content: (
      <div className="space-y-6">
        <div className="p-8 rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-lime-400/5 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-xl space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-mono">
              <Chrome className="w-3.5 h-3.5" /> Companion App Overview
            </span>
            <h3 className="text-xl font-medium text-white">Focus Monitoring & Micro-Interventions</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              The AQLA Chrome Extension lives in your browser side-panel to deliver real-time focus prompts, quick cognitive check-ins, and instant protocol synchronization while you work.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Side-Panel Assistant", desc: "Access micro-protocols without leaving your active tab." },
            { title: "Real-time Sync", desc: "Automatically syncs session logs with your central dashboard." },
            { title: "Distraction Shield", desc: "Subtle visual cues when focus fragmentation is detected." }
          ].map((item, i) => (
            <div key={i} className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
              <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
              <p className="text-xs text-white/50">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: "the-platform",
    label: "The Platform",
    icon: Layers,
    badge: "Web Application",
    title: "The Personal Brain Operating System",
    subtitle: "An integrated suite of tools engineered for cognitive mapping, protocol adherence, and personal growth.",
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h3 className="text-base font-semibold text-white mb-2">Interactive 3D Brain Map</h3>
            <p className="text-xs text-white/60 leading-relaxed mb-4">
              Visualize your neural strengths and vulnerability zones in real-time with our Three.js WebGL topography explorer.
            </p>
            <Link to="/map" className="inline-flex items-center gap-1.5 text-xs text-lime-400 hover:underline">
              Explore Map <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h3 className="text-base font-semibold text-white mb-2">AI Intelligence Coach</h3>
            <p className="text-xs text-white/60 leading-relaxed mb-4">
              Engage with an evidence-backed conversational AI tuned specifically for cognitive protocol advice and daily readiness.
            </p>
            <Link to="/coach" className="inline-flex items-center gap-1.5 text-xs text-lime-400 hover:underline">
              Launch Coach <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-white">Ready to explore AQLA?</h4>
            <p className="text-xs text-white/50 mt-0.5">Start your baseline cognitive assessment today.</p>
          </div>
          <Link
            to="/start"
            className="px-5 py-2.5 rounded-xl bg-lime-400 text-black text-xs font-semibold hover:bg-lime-300 transition-colors flex items-center gap-2 shrink-0"
          >
            Get Started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    )
  }
];

export default function Docs() {
  const [activeTab, setActiveTab] = useState("how-it-works");

  const currentSection = SECTIONS.find((s) => s.id === activeTab) || SECTIONS[0];
  const Icon = currentSection.icon;

  return (
    <div className="min-h-screen bg-[#06080c] text-white selection:bg-lime-400 selection:text-black">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#06080c]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <AqlaLogo className="w-8 h-8" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs text-white/60 hover:text-white transition-colors">
              Home
            </Link>
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-full border border-white/20 text-xs font-medium text-white hover:bg-white/5 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-mono mb-4">
          <Brain className="w-3.5 h-3.5" /> Product Documentation
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-medium text-white tracking-tight mb-3">
          AQLA Documentation Hub
        </h1>
        <p className="text-sm text-white/60 max-w-2xl leading-relaxed">
          Explore how AQLA combines standardized psychometrics, adaptive neuroplasticity protocols, and secure data privacy to build your personal brain operating system.
        </p>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-1">
          <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase px-3 block mb-2">
            Overview
          </span>
          {SECTIONS.map((sec) => {
            const SecIcon = sec.icon;
            const isActive = activeTab === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2.5 ${
                  isActive
                    ? "bg-white/10 text-white border border-white/10 shadow-sm"
                    : "text-white/60 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                <SecIcon className={`w-4 h-4 ${isActive ? "text-lime-400" : "text-white/40"}`} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="border-b border-white/10 pb-6">
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-lime-400 mb-3 uppercase tracking-wider">
                  {currentSection.badge}
                </span>
                <h2 className="text-2xl font-medium text-white mb-2 flex items-center gap-3">
                  {currentSection.title}
                </h2>
                <p className="text-xs text-white/60 leading-relaxed">
                  {currentSection.subtitle}
                </p>
              </div>

              {currentSection.content}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 bg-[#06080c]">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-white/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AqlaLogo className="w-5 h-5 opacity-60" showWordmark={false} />
            <span>© {new Date().getFullYear()} AQLA. Private & Proprietary.</span>
          </div>
          <div className="flex items-center gap-6 text-white/60">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
