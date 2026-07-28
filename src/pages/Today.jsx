import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import CheckInDialog from "@/components/today/CheckInDialog";
import { localDateKey } from "@/lib/dateKey";
import { ChevronDown, MessageCircle, ClipboardList, Sparkles } from "lucide-react";

function Signal({ label, value, color }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground truncate">{label}</p>
      <p className="mt-1 font-display text-lg text-foreground tabular-nums" style={color ? { color } : {}}>{value}</p>
    </div>
  );
}

export default function Today() {
  const [user, setUser] = useState(null);
  const [protocol, setProtocol] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [showSupport, setShowSupport] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);

  const load = () => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.Protocol.filter({ status: "active" }, "-created_date", 1).then((p) => setProtocol(p[0] || null));
    base44.entities.DailyCheckIn.list("-date", 8).then(setCheckIns);
  };
  useEffect(() => {
    load();
    window.addEventListener("aqla:check-in-saved", load);
    return () => window.removeEventListener("aqla:check-in-saved", load);
  }, []);

  const today = localDateKey();
  const checkedInToday = checkIns.some((c) => c.date === today);
  const latest = checkIns[0];
  const readiness = latest ? Math.round(((latest.clarity + latest.energy + latest.sleep_quality + (10 - latest.stress)) / 40) * 100) : null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.full_name?.split(" ")[0] || "there";

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <p className="text-xs text-muted-foreground tracking-widest uppercase">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-light text-foreground">{greeting}, {firstName}.</h1>
        <p className="mt-2 text-muted-foreground">
          {protocol?.family === "RESET" ? "Your system is prioritizing recovery today." : "Your system is watching your signals today."}
        </p>
      </motion.div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 aqla-panel rounded-2xl px-6 py-5">
        <Signal label="Cognitive readiness" value={readiness != null ? `${readiness}%` : "—"} color={readiness >= 65 ? "#C9F24E" : readiness != null ? "#F2C04E" : undefined} />
        <Signal label="Sleep recovery" value={latest?.sleep_quality != null ? `${latest.sleep_quality}/10` : "—"} color="#5FD4E8" />
        <Signal label="Focus window" value="9:30–12:00" />
        <Signal label="Energy-risk period" value="2–4 PM" color="#F2C04E" />
      </div>

      {/* Priority */}
      <div className="mt-8 rounded-3xl border border-primary/25 bg-primary/5 p-8">
        <p className="text-xs uppercase tracking-widest text-primary flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" /> Today's priority
        </p>
        <h2 className="mt-3 font-display text-2xl text-foreground">Protect your 9:30 AM–12:00 PM focus window</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          Your recovery pattern suggests your best sustained attention occurs late morning. Guard it before anything else.
        </p>
      </div>

      {/* Protocol actions */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-foreground">Today's protocol</h3>
          {protocol && (
            <Link to="/protocol" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" /> {protocol.name}
            </Link>
          )}
        </div>
        {protocol ? (
          <>
            <div className="space-y-px rounded-2xl overflow-hidden border border-border/60">
              {(protocol.actions || []).slice(0, 3).map((a, i) => (
                <div key={i} className="flex items-center gap-5 bg-card/60 px-6 py-5">
                  <span className="font-display text-xl text-primary/70 tabular-nums">0{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{a.title}</p>
                    {a.detail && <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>}
                  </div>
                  {a.time && <span className="text-xs text-muted-foreground tabular-nums">{a.time}</span>}
                </div>
              ))}
            </div>
            {protocol.supporting_actions?.length > 0 && (
              <div className="mt-3">
                <button onClick={() => setShowSupport(!showSupport)} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  View supporting actions <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSupport ? "rotate-180" : ""}`} />
                </button>
                {showSupport && (
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground pl-1">
                    {protocol.supporting_actions.map((a) => <li key={a} className="flex gap-2"><span className="text-primary">·</span>{a}</li>)}
                  </ul>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="aqla-panel rounded-2xl p-8 text-center">
            <p className="text-foreground">No active protocol yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Complete your assessment and AQLA will build your first protocol.</p>
            <Link to="/assessment" className="inline-block mt-5 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium">Start Assessment</Link>
          </div>
        )}
      </div>

      {/* Check-in + coach */}
      <div className="mt-8 grid md:grid-cols-2 gap-4">
        <button onClick={() => setCheckInOpen(true)} disabled={checkedInToday}
          className={`text-left rounded-2xl p-6 border transition-colors ${checkedInToday ? "border-border/50 bg-card/40" : "border-primary/30 bg-primary/5 hover:bg-primary/10"}`}>
          <p className="font-display text-foreground">{checkedInToday ? "Check-in complete" : "Daily check-in"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{checkedInToday ? "AQLA has updated today's recommendations." : "Takes under 60 seconds. Updates today's protocol."}</p>
        </button>
        <Link to="/coach" className="rounded-2xl p-6 border border-border/60 bg-card/40 hover:border-border transition-colors">
          <p className="font-display text-foreground flex items-center gap-2"><MessageCircle className="w-4 h-4 text-primary" /> AQLA Intelligence</p>
          <p className="mt-1 text-xs text-muted-foreground">Ask why your focus changed, what to adjust first, or what the evidence says.</p>
        </Link>
      </div>

      {/* Insight */}
      <div className="mt-8 border-l-2 border-primary/50 pl-5 py-1">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Today's insight</p>
        <p className="mt-2 text-sm text-foreground/90 leading-relaxed max-w-xl">
          Your strongest attention scores occur after nights with at least seven hours of sleep and a consistent wake time.
        </p>
      </div>

      <CheckInDialog open={checkInOpen} onOpenChange={setCheckInOpen} onSaved={load} />
    </div>
  );
}