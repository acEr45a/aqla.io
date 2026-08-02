import React, { useState } from "react";
import { REGIONS } from "./brainShapes";
import NeuralBrainCanvas from "./NeuralBrainCanvas";
import Brain3DTooltip from "./Brain3DTooltip";
import RankLegend from "./RankLegend";

export default function NeuralBrainVisual({ domains = [], onSelect, selectedKey }) {
  const [hover, setHover] = useState(null);
  const activeKey = hover?.key || selectedKey;
  const activeRegion = REGIONS.find((region) => region.key === activeKey);
  const hoveredDomain = domains.find((d) => d.key === hover?.key);
  const hoveredRegion = REGIONS.find((r) => r.key === hover?.key);

  return (
    <div className="mx-auto w-full max-w-[900px] select-none">
      <div className="relative aspect-[660/560] w-full overflow-hidden rounded-3xl border border-border/50 bg-background shadow-2xl">
        <NeuralBrainCanvas domains={domains} onHover={setHover} onSelect={onSelect} />
        {hover && hoveredDomain && hoveredRegion && (
          <Brain3DTooltip domain={hoveredDomain} region={hoveredRegion} x={hover.x} y={hover.y} />
        )}
        <div className="pointer-events-none absolute bottom-[8%] left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
          ↻&nbsp; Drag to inspect
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        {activeRegion ? `${activeRegion.region} · ${activeRegion.role}` : "Each region carries its own rank — hover a region to see how close it is to the next one."}
      </p>
      <RankLegend />
    </div>
  );
}