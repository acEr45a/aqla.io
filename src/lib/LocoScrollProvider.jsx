import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

const LocoScrollContext = createContext({ scrollY: { current: 0 }, ready: false });

/**
 * Shared Locomotive Scroll v5 provider.
 *
 * Wraps any part of the tree that wants smooth-scroll + scroll-progress data.
 * Auth pages pipe `scrollY` into the R3F brain panel for parallax.
 * The landing page can plug in later with `useLocoScroll()`.
 */
export function LocoScrollProvider({ children }) {
  const scrollYRef = useRef(0);
  const [ready, setReady] = useState(false);
  const scrollInstanceRef = useRef(null);

  // Lazy-init: Locomotive Scroll is imported only when the provider mounts.
  useEffect(() => {
    let instance = null;
    let cancelled = false;

    (async () => {
      try {
        const LocomotiveScroll = (await import("locomotive-scroll")).default;
        if (cancelled) return;

        instance = new LocomotiveScroll({
          // v5 defaults — smooth inertia everywhere
          lenisOptions: {
            lerp: 0.08,
            duration: 1.2,
            smoothWheel: true,
          },
        });

        instance.on("scroll", ({ scroll }) => {
          scrollYRef.current = scroll;
        });

        scrollInstanceRef.current = instance;
        setReady(true);
      } catch {
        // If Locomotive Scroll fails to load, degrade gracefully — no smooth scroll.
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      if (instance) {
        instance.destroy();
      }
      scrollInstanceRef.current = null;
    };
  }, []);

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
 * Hook to consume Locomotive Scroll state from any component.
 * Returns { scrollY: MutableRefObject<number>, ready: boolean, instance: Ref }
 */
export function useLocoScroll() {
  return useContext(LocoScrollContext);
}
