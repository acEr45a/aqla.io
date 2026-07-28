import React, { useState } from "react";
import { REGIONS } from "./brainRegions";
import HologramLabels from "./HologramLabels";
import RankLegend from "./RankLegend";
import BrainTurntable from "./BrainTurntable";

export default function NeuralBrainVisual({ domains = [], onSelect, selectedKey }) {
  const [hover, setHover] = useState(null);
  const [angle, setAngle] = useState(0);
  const activeKey = hover || selectedKey;
  const activeRegion = REGIONS.find((region) => region.key === activeKey);

  return (
    <div className="mx-auto w-full max-w-[900px] select-none">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border/50 bg-background shadow-2xl">
        <BrainTurntable onAngleChange={setAngle} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_52%,transparent_58%,hsl(26_14%_6%/0.6)_100%)]" />
        <span className="pointer-events-none absolute left-1/2 top-[5%] -translate-x-1/2 font-display text-xs tabular-nums text-muted-foreground">
          {Math.round(angle)}°
        </span>
        <HologramLabels domains={domains} activeKey={activeKey} onHover={setHover} onSelect={onSelect} />
        <div className="pointer-events-none absolute bottom-[5%] left-1/2 -translate-x-1/2 text-xs text-muted-foreground">↻&nbsp; Drag to rotate</div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        {activeRegion ? `${activeRegion.region} · ${activeRegion.role}` : "Each region carries its own rank — hover a region to see how close it is to the next one."}
      </p>
      <RankLegend />
    </div>
  );
}