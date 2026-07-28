import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import GuestTestSync from "@/components/GuestTestSync";
import AqlaAssistant from "@/components/coach/AqlaAssistant";
import ReassessmentPrompt from "@/components/ReassessmentPrompt";
import DailyCheckInPrompt from "@/components/today/DailyCheckInPrompt";
import PlanReviewGate from "@/components/review/PlanReviewGate";
import UserAccountBox from "@/components/UserAccountBox";
import { Sun, Radar, ClipboardList, FlaskConical, TrendingUp, MessageCircle, Timer, BookOpen, Gamepad2, CircleHelp } from "lucide-react";

const NAV = [
  { to: "/today", label: "Today", icon: Sun },
  { to: "/map", label: "Brain Map", icon: Radar },
  { to: "/tests", label: "Tests", icon: Timer },
  { to: "/games", label: "Train", icon: Gamepad2 },
  { to: "/protocol", label: "Protocol", icon: ClipboardList },
  { to: "/experiments", label: "Experiments", icon: FlaskConical },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/coach", label: "AQLA Intelligence", icon: MessageCircle },
  { to: "/evidence-library", label: "Science", icon: BookOpen },
  { to: "/help-center", label: "Help", icon: CircleHelp },
];

const SHORT_LABELS = { "Brain Map": "Map", Experiments: "Trials" };

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background aqla-glow">
      <GuestTestSync />
      <AqlaAssistant />
      <ReassessmentPrompt />
      <DailyCheckInPrompt />
      <PlanReviewGate />
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 flex-col border-r border-border/60 bg-sidebar/60 backdrop-blur-md z-40">
        <div className="px-6 py-7">
          <span className="font-display text-xl tracking-tight text-foreground">AQLA</span>
          <span className="block text-[11px] text-muted-foreground mt-0.5">Personal Brain OS</span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}>
              <Icon className="w-4 h-4" strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>
        <UserAccountBox />
      </aside>

      <main className="md:pl-56 pb-24 md:pb-10">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-lg">
        <div className="flex overflow-x-auto scrollbar-none px-2 pb-[env(safe-area-inset-bottom)]">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `shrink-0 w-[19%] min-w-[68px] flex flex-col items-center gap-1 py-2.5 text-[10px] ${
                isActive ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="w-5 h-5" strokeWidth={1.75} />
              <span className="whitespace-nowrap">{SHORT_LABELS[label] || label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}