import React from "react";
import { Handle, Position } from "@xyflow/react";
import { PartnerNode } from "@/types";
import { cn } from "@/lib/utils";

interface PlanetNodeProps {
  data: {
    partner: PartnerNode;
  };
}

export const PlanetNode = ({ data }: PlanetNodeProps) => {
  const { partner } = data;

  // Determine color based on status
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Exclusive":
        return "bg-holo-cyan/10 border-holo-cyan text-holo-cyan shadow-[0_0_20px_rgba(0,240,255,0.3)]";
      case "Signed":
        return "bg-green-500/10 border-green-400 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
      case "Dating":
        return "bg-purple-500/10 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]";
      case "Talking":
        return "bg-orange-500/10 border-orange-400 text-orange-300 shadow-[0_0_15px_rgba(251,146,60,0.3)]";
      case "It's Complicated":
        return "bg-yellow-500/10 border-yellow-400 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.3)]";
      case "Graveyard":
        return "bg-gray-800/50 border-gray-600 text-gray-400 grayscale opacity-60";
      default:
        return "bg-glass-panel border-white/20 text-gray-300";
    }
  };

  // Abbreviate status text for display
  const getStatusDisplay = (status: string) => {
    if (status === "It's Complicated") return "Complicated";
    return status;
  };

  // Dynamic text size based on name length
  const getTextSize = (name: string) => {
    const length = name.length;
    if (length <= 8) return "text-xs";
    if (length <= 12) return "text-[10px]";
    if (length <= 16) return "text-[9px]";
    return "text-[8px]";
  };

  // Simp Index Logic
  const simpIndex = partner.simp_index || (partner.financial_total + partner.time_total * 20) / (partner.intimacy_score || 1);
  const isSimping = simpIndex > 500;

  return (
    <div
      className={cn(
        "w-24 h-24 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-500 relative backdrop-blur-md group",
        getStatusStyles(partner.status),
        isSimping && "animate-pulse border-simp-red shadow-[0_0_30px_#FF2A2A]"
      )}
    >
      {/* Inner orbital ring */}
      <div className="absolute inset-1 rounded-full border border-white/10 opacity-50 group-hover:scale-90 transition-transform duration-700" />
      
      <div className="z-10 pointer-events-none flex flex-col items-center gap-1">
        <span className={cn(
          "font-display font-bold uppercase tracking-wider max-w-[90%] text-center px-1",
          getTextSize(partner.nickname)
        )}>
          {partner.nickname}
        </span>
        <div className="px-1 py-0.5 rounded-full bg-black/40 border border-white/5 text-[7px] font-mono uppercase whitespace-nowrap">
          {getStatusDisplay(partner.status)}
        </div>
      </div>

      {/* Stats Hover Tooltip (Simple) */}
      <div className="absolute -bottom-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 border border-white/20 p-2 rounded text-[10px] font-mono text-white whitespace-nowrap z-50 pointer-events-none">
        $$: {partner.financial_total} | SIMP: {Math.round(simpIndex)}
      </div>

      {/* Handle for connection lines - Centered */}
      <Handle
        type="target"
        position={Position.Left}
        className="opacity-0"
        style={{ top: '50%', left: '50%' }}
      />
    </div>
  );
};
