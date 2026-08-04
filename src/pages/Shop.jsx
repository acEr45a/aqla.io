import React from "react";
import { ShoppingBag, Package, Sparkles, Truck } from "lucide-react";
import AqlaLogo from "@/components/AqlaLogo";

// AQLA Shop — ships AQLA-branded boxes filled with the supplements matched to your
// protocol. Currently a coming-soon placeholder; fulfillment flow is not built yet.
export default function Shop() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
      <div className="flex items-center gap-2.5">
        <ShoppingBag className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <p className="text-xs text-muted-foreground tracking-widest uppercase">AQLA Shop</p>
      </div>
      <h1 className="mt-2 text-3xl md:text-5xl font-light tracking-tight text-foreground">
        Your protocol, <span className="text-primary">delivered.</span>
      </h1>
      <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
        AQLA Labs boxes arrive with the exact formulas matched to your cognitive profile —
        branded, batched, and built for the bottleneck you're working on. No guessing, no
        filler, just what your protocol calls for.
      </p>

      <div className="mt-10 relative overflow-hidden rounded-3xl border border-border/60 aqla-panel p-8 md:p-12">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <AqlaLogo showWordmark={false} className="text-foreground" />
            <span className="font-display text-lg tracking-tight text-foreground">AQLA Labs</span>
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-primary">Coming soon</p>
          <p className="mt-3 text-lg md:text-xl text-foreground font-light leading-relaxed max-w-md">
            Supplement boxes tailored to your brain — launching soon.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Fulfillment and checkout are still being built. Check back here when AQLA Labs goes live.
          </p>
        </div>
        <div className="pointer-events-none absolute -right-10 -bottom-10 opacity-20">
          <Package className="w-56 h-56 text-primary" strokeWidth={0.6} />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Sparkles, title: "Matched to you", body: "Each box reflects your latest protocol and cognitive profile." },
          { icon: Package, title: "Branded boxes", body: "AQLA Labs packaging, labelled by formula family and cycle." },
          { icon: Truck, title: "Doorstep delivery", body: "Shipped on your protocol cadence so you never run out." },
        ].map((f) => (
          <div key={f.title} className="aqla-panel rounded-2xl p-5">
            <f.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <p className="mt-3 font-display text-sm text-foreground">{f.title}</p>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}