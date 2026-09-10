import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const LocoScrollContext = createContext({ scrollY: { current: 0 }, ready: false, instance: { current: null } });

/**
 * Shared Locomotive Scroll v5 provider (scoped per-page).
 *
 * Wraps individual pages (e.g. Landing, coming-soon teasers) that want
 * inertia smooth scrolling and parallax attributes (data-scroll, data-scroll-speed).
 * When unmounted upon navigating to dashboard, clinician, or forms, it cleanly
 * destroys the Locomotive / Lenis instance and restores native browser scrolling.
 */
export function LocoScrollProvider({ children, options }) {
  const scrollYRef = useRef(0);
  const [ready, setReady] = useState(false);
  const scrollInstanceRef = useRef(null);

  useEffect(() => {
    let instance = null;
    let cancelled = false;

    (async () => {
      try {
        const LocomotiveScroll = (await import("locomotive-scroll")).default;
        if (cancelled) return;

        instance = new LocomotiveScroll({
          lenisOptions: {
            lerp: 0.08,
            duration: 1.2,
            smoothWheel: true,
            syncTouch: false, // avoid touch hijacking on mobile
            ...options?.lenisOptions,
          },
          ...options,
        });

        if (cancelled) {
          instance.destroy();
          return;
        }

        instance.on("scroll", ({ scroll }) => {
          scrollYRef.current = scroll;
        });

        scrollInstanceRef.current = instance;
        setReady(true);
      } catch (err) {
        console.warn("[LocoScrollProvider] Failed to load Locomotive Scroll:", err);
        // Degrade gracefully — native browser scroll remains active
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      if (instance) {
        try {
          instance.destroy();
        } catch (e) {
          console.warn("[LocoScrollProvider] Error destroying instance:", e);
        }
      }
      scrollInstanceRef.current = null;
      setReady(false);

      // Clean up any residual HTML/body classes and styles left by Locomotive/Lenis
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove(
          "has-scroll-smooth",
          "has-scroll-init",
          "lenis",
          "lenis-smooth",
          "lenis-scrolling",
          "lenis-stopped"
        );
        document.body.classList.remove("lenis", "lenis-smooth", "lenis-scrolling", "lenis-stopped");
        document.documentElement.style.removeProperty("overflow");
        document.documentElement.style.removeProperty("height");
        document.body.style.removeProperty("overflow");
        document.body.style.removeProperty("height");
      }
    };
  }, [options]);

  const value = React.useMemo(
    () => ({ scrollY: scrollYRef, ready, instance: scrollInstanceRef }),
    [ready]
  );

  return (
    <LocoScrollContext.Provider value={value}>
      {children}
    </LocoScrollContext.Provider>
  );
}

/**
 * Hook to consume Locomotive Scroll state from any component within a LocoScrollProvider tree.
 * Returns { scrollY: MutableRefObject<number>, ready: boolean, instance: MutableRefObject }
 */
export function useLocoScroll() {
  return useContext(LocoScrollContext);
}

export default LocoScrollProvider;
