import React, { useState } from "react";
import { Image } from "@/components/ui/image";
import { BRAIN_IMAGE, ANATOMY } from "./brainAnatomy";
import BrainMarker from "./BrainMarker";

// Anatomical brain visualization: illustrated brain with score nodes pinned
// to the region responsible for each domain.
export default function BrainVisual({ domains = [], onSelect, selectedKey }) {
  const [hover, setHover] = useState(null);
  const byKey = Object.fromEntries(domains.map((d) => [d.key, d]));
  const activeAnatomy = ANATOMY.find((a) => a.key === (hover || selectedKey));
  const activeDomain = activeAnatomy && byKey[activeAnatomy.key];

  return (
    <div>
      <div className="relative w-full aspect-square max-w-[560px] mx-auto">
        <Image src={BRAIN_IMAGE} alt="Brain map with anatomical regions" fittingType="fit" className="absolute inset-0 w-full h-full"
          style={{
            maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 55%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 55%, transparent 78%)",
          }} />
        {ANATOMY.map((a, i) => {
          const d = byKey[a.key];
          if (!d) return null;
          return (
            <BrainMarker key={a.key} anatomy={a} domain={d} delay={0.2 + i * 0.1}
              active={hover === a.key || selectedKey === a.key}
              onSelect={onSelect} onHover={setHover} />
          );
        })}
      </div>
      <div className="h-9 flex items-center justify-center">
        {activeDomain ? (
          <p className="text-xs text-muted-foreground text-center">
            <span style={{ color: activeDomain.color }}>{activeAnatomy.region}</span>
            <span className="mx-2 text-border">·</span>
            {activeAnatomy.role}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground text-center">Each node sits on the brain region responsible for that capacity.</p>
        )}
      </div>
    </div>
  );
}