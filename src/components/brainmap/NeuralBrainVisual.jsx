import React, { useState } from "react";
import { REGIONS } from "./brainShapes";
import Brain3DView from "./Brain3DView";
import RankLegend from "./RankLegend";

export default function NeuralBrainVisual({ domains = [], onSelect, selectedKey }) {
  const [hover, setHover] = useState(null);
  const activeKey = hover || selectedKey;
  const activeRegion = REGIONS.find((region) => region.key === activeKey);

  return (
    <div className="mx-auto w-full max-w-[900px] select-none">
      <div className="relative aspect-[660/560] w-full overflow-hidden rounded-3xl border border-border/50 bg-background shadow-2xl p-2">
        <Brain3DView domains={domains} activeKey={activeKey} onHover={setHover} onSelect={onSelect} />
        <div className="pointer-events-none absolute bottom-[6%] left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
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