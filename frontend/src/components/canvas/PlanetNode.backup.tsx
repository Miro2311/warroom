import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { PartnerNode } from "@/types";
import { cn } from "@/lib/utils";
import { getOrbitData } from "@/lib/orbitCalculator";

interface PlanetNodeProps {
  data: {
    partner: PartnerNode;
  };
}

export const PlanetNode = ({ data }: PlanetNodeProps) => {
  const { partner } = data;
  const [isHovered, setIsHovered] = useState(false);

  // Calculate orbital properties (memoized)
  const orbitData = React.useMemo(() => getOrbitData(partner), [partner.status, partner.intimacy_score]);

  // Determine color based on status
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Exclusive":
        return "bg-holo-cyan/10 border-holo-cyan text-holo-cyan shadow-[0_0_20px_rgba(0,240,255,0.3)]";
      case "Dating":
        return "bg-blue-500/10 border-blue-400 text-blue-300";
      case "Talking":
        return "bg-lust-pink/10 border-lust-pink text-lust-pink shadow-[0_0_15px_rgba(255,0,127,0.3)]";
      case "It's Complicated":
        return "bg-purple-500/10 border-purple-400 text-purple-300";
      case "Graveyard":
        return "bg-gray-800/50 border-gray-600 text-gray-400 grayscale opacity-60";
      default:
        return "bg-glass-panel border-white/20 text-gray-300";
    }
  };

  // Simp Index Logic
  const simpIndex = partner.simp_index || (partner.financial_total + partner.time_total * 20) / (partner.intimacy_score || 1);
  const isSimping = simpIndex > 500;

  return (
    <div
      className={cn(
        "w-24 h-24 rounded-full flex flex-col items-center justify-center border-2 relative backdrop-blur-md group",
        "transition-transform duration-200",
        getStatusStyles(partner.status),
        isSimping && "animate-pulse border-simp-red shadow-[0_0_30px_#FF2A2A]",
        isHovered && "scale-110"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        willChange: isHovered ? 'transform' : 'auto',
      }}
    >
      {/* Inner orbital ring - Simple static ring */}
      <div className={cn(
        "absolute inset-1 rounded-full border border-white/10 opacity-50 transition-all duration-300",
        isHovered && "scale-90 opacity-70"
      )} />

      <div className="z-10 pointer-events-none flex flex-col items-center gap-1">
        <span className="font-display font-bold text-xs uppercase tracking-wider max-w-[90%] truncate">
          {partner.nickname}
        </span>
        <div className="px-1.5 py-0.5 rounded-full bg-black/40 border border-white/5 text-[9px] font-mono uppercase">
          {partner.status}
        </div>
      </div>

      {/* Enhanced Stats Tooltip */}
      <div
        className={cn(
          "absolute -bottom-16 bg-black/95 border border-white/20 p-2 rounded text-[10px] font-mono text-white whitespace-nowrap z-50 pointer-events-none",
          "transition-all duration-200",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        )}
      >
        <div className="flex flex-col gap-0.5">
          <div>$$: {partner.financial_total}</div>
          <div>SIMP: {Math.round(simpIndex)}</div>
          <div className="text-holo-cyan">ORBIT: {Math.round(orbitData.radius)}px</div>
          <div className="text-lust-pink">SPEED: {orbitData.speed.toFixed(1)}deg/s</div>
        </div>
      </div>

      {/* Orbit tier indicator */}
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white/30 bg-black/60 flex items-center justify-center">
        <div className={cn(
          "w-1.5 h-1.5 rounded-full",
          orbitData.tier === 'close' && "bg-holo-cyan animate-pulse",
          orbitData.tier === 'medium' && "bg-blue-400",
          orbitData.tier === 'far' && "bg-lust-pink",
          orbitData.tier === 'void' && "bg-gray-500"
        )} />
      </div>

      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};
