import React, { useState } from "react";
import { motion } from "framer-motion";
import { REGIONS } from "./brainRegions";
import HologramLabels from "./HologramLabels";
import RankLegend from "./RankLegend";
import { Image } from "@/components/ui/image";

const BRAIN_IMAGE = "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/e717df4e3_generated_image.png";

export default function NeuralBrainVisual({ domains = [], onSelect, selectedKey }) {
  const [hover, setHover] = useState(null);
  const activeKey = hover || selectedKey;
  const activeRegion = REGIONS.find((region) => region.key === activeKey);

  return (
    <div className="mx-auto w-full max-w-[900px] select-none">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border/50 bg-background shadow-2xl">
        <motion.div
          className="absolute inset-[6%]"
          animate={{ y: [0, -8, 0], scale: [1, 1.015, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image src={BRAIN_IMAGE} alt="Glass hologram of a human brain" fittingType="fit" className="h-full w-full" />
        </motion.div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_52%,transparent_55%,hsl(26_14%_6%/0.55)_100%)]" />
        <HologramLabels domains={domains} activeKey={activeKey} onHover={setHover} onSelect={onSelect} />
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        {activeRegion ? `${activeRegion.region} · ${activeRegion.role}` : "Each region carries its own rank — hover a region to see how close it is to the next one."}
      </p>
      <RankLegend />
    </div>
  );
}