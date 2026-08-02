import React, { useState } from "react";
import { REGIONS } from "./brainShapes";
import BrainProfileMap from "./BrainProfileMap";
import RankLegend from "./RankLegend";

export default function NeuralBrainVisual({ domains = [], onSelect, selectedKey }) {
  const [hover, setHover] = useState(null);
  const activeKey = hover || selectedKey;
  const activeRegion = REGIONS.find((region) => region.key === activeKey);

  return (
    <div className="mx-auto w-full max-w-[900px] select-none">
      <div className="relative aspect-[660/560] w-full overflow-hidden rounded-lg border border-border/50 bg-background p-2">
        <BrainProfileMap domains={domains} activeKey={activeKey} onHover={setHover} onSelect={onSelect} />
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        {activeRegion ? `${activeRegion.region} · ${activeRegion.role}` : "Each region carries its own rank — hover a region to see how close it is to the next one."}
      </p>
      <RankLegend />
    </div>
  );
}