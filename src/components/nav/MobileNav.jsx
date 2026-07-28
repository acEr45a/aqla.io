import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MoreHorizontal } from "lucide-react";

// Five primary tabs stay in the bar; everything else lives in a "More" sheet.
export default function MobileNav({ primary, secondary }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const moreActive = secondary.some((item) => item.to === pathname);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-lg">
      <div className="grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {primary.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2.5 text-[11px] ${isActive ? "text-primary" : "text-muted-foreground"}`}>
            <Icon className="w-5 h-5" strokeWidth={1.75} />
            <span className="truncate max-w-full px-1">{label}</span>
          </NavLink>
        ))}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${moreActive ? "text-primary" : "text-muted-foreground"}`}>
            <MoreHorizontal className="w-5 h-5" strokeWidth={1.75} />
            <span>More</span>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <div className="grid grid-cols-3 gap-3 pt-4">
              {secondary.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) =>
                  `flex flex-col items-center gap-2 rounded-2xl border py-4 text-xs ${
                    isActive ? "border-primary/40 bg-primary/5 text-primary" : "border-border/60 text-muted-foreground"}`}>
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                  <span className="text-center leading-tight px-1">{label}</span>
                </NavLink>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}