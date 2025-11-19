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

  return (
    <div
      className="rounded-full relative flex items-center justify-center transition-all duration-500"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 30% 30%, #FFD700 0%, #FF8C00 50%, #FF4500 100%)",
        boxShadow: "0 0 60px rgba(255, 69, 0, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.5)"
      }}
    >
      {/* Core Pulse Animation */}
      <div className="absolute inset-[-10px] rounded-full bg-orange-500/20 blur-xl animate-pulse pointer-events-none" />

      <div className="z-10 text-center pointer-events-none">
        <div className="font-display text-white font-bold tracking-wider text-sm uppercase drop-shadow-md">
          {user.username}
        </div>
        <div className="font-mono text-[10px] text-yellow-200 font-bold">
          LVL {user.level}
        </div>
      </div>
      
      {/* Handle for connecting to planets - Centered */}
      <Handle
        type="source"
        position={Position.Right}
        className="opacity-0"
        style={{ top: '50%', right: '50%' }}
      />
    </div>
  );
};
