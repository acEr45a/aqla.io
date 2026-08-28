import React, { useRef, lazy, Suspense } from "react";
import { useLocoScroll } from "@/lib/LocoScrollProvider";

const AuthBrainPanel = lazy(() => import("@/components/auth/AuthBrainPanel"));

/**
 * AuthLayout — Magnific-style split-panel shell.
 *
 * Desktop: 60% immersive 3D brain (left) / 40% glassmorphism form (right).
 * Mobile (<768px): full-width form only — brain panel hidden.
 *
 * All existing page props (icon, title, subtitle, footer, children) are preserved.
 */
export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  const { scrollY } = useLocoScroll();
  const formRef = useRef(null);

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(26 14% 6%)" }}>

      {/* ── LEFT: 3D brain panel (hidden on mobile) ── */}
      <div className="hidden md:block md:w-[60%] relative flex-shrink-0 sticky top-0 h-screen">
        <Suspense fallback={
          <div className="w-full h-full animate-pulse" style={{ background: "hsl(26 14% 5%)" }} />
        }>
          <AuthBrainPanel scrollYRef={scrollY} />
        </Suspense>
      </div>

      {/* ── RIGHT: Form panel ── */}
      <div
        ref={formRef}
        className="flex-1 md:w-[40%] overflow-y-auto relative"
        style={{ background: "hsl(26 14% 3%)" }}
      >
        {/* subtle left border line */}
        <div
          className="hidden md:block absolute left-0 inset-y-0 w-px pointer-events-none z-10"
          style={{ background: "linear-gradient(to bottom, transparent, hsl(75 82% 60% / 0.15), transparent)" }}
        />

        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative aqla-grain">
          {/* Subtle background glow behind the form */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none"
            style={{
              background: "radial-gradient(circle, hsl(75 60% 40% / 0.04) 0%, transparent 60%)",
            }}
          />

          <div className="w-full max-w-[380px] relative z-10">

            {/* Header */}
            <div className="text-center mb-10">
              {Icon && (
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6 shadow-2xl relative group">
                  <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl opacity-50 group-hover:opacity-80 transition-opacity" />
                  <div className="relative w-full h-full rounded-2xl bg-card border border-primary/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                </div>
              )}
              {typeof title === "string" ? (
                <h1 className="text-3xl font-display font-medium tracking-tight text-foreground">{title}</h1>
              ) : (
                title
              )}
              {subtitle && (
                <p className="text-[15px] text-muted-foreground mt-2 font-light">{subtitle}</p>
              )}
            </div>

            {/* Form card - Premium Glassmorphism */}
            <div
              className="rounded-3xl p-8 space-y-6"
              style={{
                background: "linear-gradient(160deg, hsl(26 11% 9% / 0.6), hsl(26 14% 5% / 0.8))",
                border: "1px solid hsl(75 20% 60% / 0.1)",
                borderTop: "1px solid hsl(75 40% 60% / 0.2)",
                boxShadow: "0 25px 50px -12px hsl(26 14% 1% / 0.8), inset 0 1px 0 hsl(0 0% 100% / 0.05)",
                backdropFilter: "blur(24px)",
              }}
            >
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <p className="text-center text-[13px] text-muted-foreground mt-8 px-4">{footer}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
