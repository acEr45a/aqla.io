import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Settings, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";

const iconClass = ({ isActive }) => `shrink-0 rounded-lg p-2 transition-colors ${
  isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
}`;

export default function UserAccountBox() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  return (
    <div className="mx-3 mb-4 flex items-center gap-2 rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
          {user?.full_name || "User"}
        </p>
        <p className="mt-0.5 truncate text-xs text-sidebar-foreground">
          {user?.email || "Loading email…"}
        </p>
      </div>
      {user?.role === "admin" && (
        <NavLink to="/admin" aria-label="Admin console" title="Admin console" className={iconClass}>
          <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
        </NavLink>
      )}
      <NavLink to="/settings" aria-label="Settings" className={iconClass}>
        <Settings className="h-4 w-4" strokeWidth={1.75} />
      </NavLink>
    </div>
  );
}