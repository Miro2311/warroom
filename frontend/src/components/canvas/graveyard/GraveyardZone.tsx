"use client";

import React from "react";
import { GRAVEYARD_CONFIG } from "./utils";

interface GraveyardZoneProps {
  data?: {
    count?: number;
    onClick?: () => void;
  };
}

export const GraveyardZone = ({ data }: GraveyardZoneProps) => {
  const count = data?.count || 0;

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer group"
      style={{ width: GRAVEYARD_CONFIG.width, height: GRAVEYARD_CONFIG.height }}
      onClick={data?.onClick}
    >
      {/* Count Badge */}
      {count > 0 && (
        <div className="absolute -top-2 -right-2 text-toxic-green font-mono text-lg font-bold z-10">
          {count}
        </div>
      )}

      {/* Simple Tombstone SVG */}
      <svg
        width="80"
        height="100"
        viewBox="0 0 80 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-60 group-hover:opacity-100 transition-opacity"
      >
        {/* Tombstone Shape */}
        <path
          d="M 15 100 L 15 30 Q 15 10, 40 10 Q 65 10, 65 30 L 65 100 Z"
          fill="rgba(57, 255, 20, 0.15)"
          stroke="rgba(57, 255, 20, 0.5)"
          strokeWidth="1.5"
        />

        {/* RIP Text */}
        <text
          x="40"
          y="45"
          textAnchor="middle"
          className="font-display text-sm"
          fill="rgba(57, 255, 20, 0.8)"
        >
          RIP
        </text>

        {/* Small cross or line decoration */}
        <line x1="30" y1="60" x2="50" y2="60" stroke="rgba(57, 255, 20, 0.4)" strokeWidth="1" />
      </svg>
    </div>
  );
};
