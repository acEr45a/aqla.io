import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, Layers, Compass, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";

export default function MockupSwitcherDock() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isExpanded, setIsExpanded] = useState(false);

  const mockups = [
    {
      id: "tunnel",
      path: "/mockup-1",
      altPath: "/mockup",
      label: "3D Obsidian Studio",
      icon: Sparkles,
      desc: "Asymmetric layout & glass cortex",
      color: "#bef264",
    },
    {
      id: "matrix",
      path: "/mockup-2",
      label: "Volumetric Point-Cloud",
      icon: Layers,
      desc: "Full-bleed 22k particle universe",
      color: "#38bdf8",
    },
    {
      id: "luxury",
      path: "/mockup-3",
      label: "Clinical Luxury",
      icon: Compass,
      desc: "Dark nature & circadian wheel",
      color: "#a78bfa",
    },
    {
      id: "unseen",
      path: "/mockup-4",
      label: "Obsidian Glass",
      icon: Sparkles,
      desc: "Unseen Studio master cut",
      color: "#34d399",
    },
  ];

  const activeMockup = mockups.find(
    (m) => currentPath === m.path || (m.altPath && currentPath === m.altPath)
  ) || mockups[0];

  return (
    <aside
      aria-label="Mockup Version Switcher"
      className="fixed bottom-5 right-5 z-[100] select-none"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col items-end gap-2">
        {/* Expanded Tray */}
        {isExpanded && (
          <div className="flex items-center gap-1.5 p-1.5 rounded-full border border-white/15 bg-black/90 backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-bottom-2 duration-200">
            <span className="flex items-center gap-1.5 pl-3 pr-2 text-[10px] font-mono uppercase tracking-widest text-white/40 border-r border-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-[#bef264] animate-pulse" />
              MOCKUPS
            </span>

            {mockups.map((m) => {
              const Icon = m.icon;
              const isActive =
                currentPath === m.path || (m.altPath && currentPath === m.altPath);

              return (
                <Link
                  key={m.id}
                  to={m.path}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "text-black shadow-lg font-semibold"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                  style={{
                    backgroundColor: isActive ? m.color : "transparent",
                    boxShadow: isActive ? `0 0 16px ${m.color}50` : "none",
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </Link>
              );
            })}

            <div className="pl-1 border-l border-white/10">
              <Link
                to="/"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-mono text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title="Return to production landing page"
              >
                <span>Prod</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Collapsed Pill Button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/20 bg-black/80 backdrop-blur-xl shadow-2xl hover:border-white/40 hover:bg-black/95 transition-all text-xs font-mono text-white/90"
        >
          <span
            className="h-2 w-2 rounded-full animate-pulse"
            style={{ backgroundColor: activeMockup.color }}
          />
          <span className="tracking-wide text-white/60">VIEWING:</span>
          <span className="font-semibold text-white">{activeMockup.label}</span>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-white/40" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-white/40" />
          )}
        </button>
      </div>
    </aside>
  );
}
