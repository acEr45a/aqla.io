import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import GuestTestSync from "@/components/GuestTestSync";
import WelcomeEmailTrigger from "@/components/WelcomeEmailTrigger";
import AqlaAssistant from "@/components/coach/AqlaAssistant";
import ReassessmentPrompt from "@/components/ReassessmentPrompt";
import DailyCheckInPrompt from "@/components/today/DailyCheckInPrompt";
import PlanReviewGate from "@/components/review/PlanReviewGate";
import UserAccountBox from "@/components/UserAccountBox";
import MobileNav from "@/components/nav/MobileNav";
import AqlaLogo from "@/components/AqlaLogo";
import { Sun, Radar, ClipboardList, FlaskConical, TrendingUp, MessageCircle, Timer, BookOpen, Gamepad2, CircleHelp, Settings, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Sun },
  { to: "/map", label: "Brain Map", icon: Radar },
  { to: "/tests", label: "Tests", icon: Timer },
  { to: "/games", label: "Train", icon: Gamepad2 },
  { to: "/protocol", label: "Protocol", icon: ClipboardList },
  { to: "/experiments", label: "Experiments", icon: FlaskConical },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/coach", label: "AQLA Intelligence", icon: MessageCircle },
  { to: "/evidence-library", label: "Science", icon: BookOpen },
  { to: "/help-center", label: "Help", icon: CircleHelp },
  { to: "/settings", label: "Settings", icon: Settings },
];

const SHORT_LABELS = { "Brain Map": "Map", Experiments: "Trials", Dashboard: "Home", "AQLA Intelligence": "AQLA" };
const PRIMARY_ROUTES = ["/dashboard", "/map", "/protocol", "/coach"];
const mobileItem = (item) => ({ ...item, label: SHORT_LABELS[item.label] || item.label });
const PRIMARY_NAV = NAV.filter((item) => PRIMARY_ROUTES.includes(item.to)).map(mobileItem);
const SECONDARY_NAV = NAV.filter((item) => !PRIMARY_ROUTES.includes(item.to)).map(mobileItem);

export default function AppLayout() {
  const [isAdmin, setIsAdmin] = useState(false);
  const { pathname } = useLocation();
  const onAdmin = pathname.startsWith("/admin");
  useEffect(() => { base44.auth.me().then((user) => setIsAdmin(user.role === "admin")); }, []);
  const nav = isAdmin ? [...NAV, { to: "/admin", label: "Admin", icon: ShieldCheck }] : NAV;
  const primaryNav = nav.filter((item) => PRIMARY_ROUTES.includes(item.to)).map(mobileItem);
  const secondaryNav = nav.filter((item) => !PRIMARY_ROUTES.includes(item.to)).map(mobileItem);
  return (
    <div className="min-h-screen bg-background aqla-glow">
      <GuestTestSync />
      <WelcomeEmailTrigger />
      {!onAdmin && <AqlaAssistant />}
      <ReassessmentPrompt />
      <DailyCheckInPrompt />
      <PlanReviewGate />
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 flex-col border-r border-border/60 bg-sidebar/60 backdrop-blur-md z-40">
        <div className="px-6 py-7 flex items-center gap-2.5">
          <AqlaLogo showWordmark={false} className="shrink-0 text-foreground" />
          <div className="min-w-0">
            <span className="font-display text-xl tracking-tight text-foreground">AQLA</span>
            <span className="block text-[11px] text-muted-foreground mt-0.5">Personal Brain OS</span>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
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

      <MobileNav primary={primaryNav} secondary={secondaryNav} />
    </div>
  );
}