import React from "react";
import { Handle, Position } from "@xyflow/react";
import { User } from "@/types";

// Props passed by ReactFlow
interface SunNodeProps {
  data: {
    user: User;
  };
}

export const SunNode = ({ data }: SunNodeProps) => {
  const { user } = data;
  // Size increases based on level. Base size 80px + level * 10
  const size = 80 + user.level * 10;

  // Color intensity based on level
  const getStarColor = (level: number) => {
    if (level >= 10) return { from: "#4FC3F7", mid: "#FF6B35", to: "#FF1744" }; // Blue giant
    if (level >= 5) return { from: "#FFD700", mid: "#FF8C00", to: "#FF4500" }; // Yellow/Orange
    return { from: "#FFF8DC", mid: "#FFD700", to: "#FF8C00" }; // Dim white
  };

  const colors = getStarColor(user.level);

  return (
    <div
      className="rounded-full relative flex items-center justify-center animate-pulse"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${colors.from} 0%, ${colors.mid} 50%, ${colors.to} 100%)`,
        boxShadow: `0 0 ${size * 0.8}px rgba(255, 69, 0, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.5)`,
        willChange: 'transform',
      }}
    >
      {/* Core Glow - Static */}
      <div className="absolute inset-[-10px] rounded-full bg-orange-500/20 blur-xl pointer-events-none" />

      {/* Corona Effect - Static */}
      <div className="absolute inset-0 rounded-full border-2 border-yellow-300/30" />

      {/* User Info */}
      <div className="z-10 text-center pointer-events-none">
        <div className="font-display text-white font-bold tracking-wider text-sm uppercase drop-shadow-lg">
          {user.username}
        </div>
        <div className="font-mono text-[10px] text-yellow-200 font-bold">
          LVL {user.level}
        </div>
      </div>

      {/* Handle for connecting to planets */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0"
      />
      <Handle type="target" position={Position.Top} className="opacity-0" />
    </div>
  );
};
