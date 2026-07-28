import React, { useState } from "react";
import { REGIONS } from "./brainRegions";
import NeuralBrainCanvas from "./NeuralBrainCanvas";
import HologramLabels from "./HologramLabels";
import RankLegend from "./RankLegend";

export default function NeuralBrainVisual({ domains = [], onSelect, selectedKey }) {
  const [hover, setHover] = useState(null);
  const activeKey = hover || selectedKey;
  const activeRegion = REGIONS.find((region) => region.key === activeKey);

  return (
    <div className="mx-auto w-full max-w-[900px] select-none">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border/50 bg-background shadow-2xl">
        <NeuralBrainCanvas domains={domains} />
        <div className="pointer-events-none absolute inset-[9%] rounded-full border border-muted-foreground/25" />
        <span className="pointer-events-none absolute left-1/2 top-[7%] -translate-x-1/2 text-xs text-muted-foreground">0°</span>
        <span className="pointer-events-none absolute left-[9%] top-1/2 text-xs text-muted-foreground">80°</span>
        <HologramLabels domains={domains} activeKey={activeKey} onHover={setHover} onSelect={onSelect} />
        <div className="pointer-events-none absolute bottom-[8%] left-1/2 -translate-x-1/2 text-xs text-muted-foreground">↻&nbsp; Drag to rotate</div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        {activeRegion ? `${activeRegion.region} · ${activeRegion.role}` : "Each region carries its own rank — hover a region to see how close it is to the next one."}
      </p>
      <RankLegend />
    </div>
  );
}