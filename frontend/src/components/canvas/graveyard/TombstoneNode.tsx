"use client";

import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, Variants } from "framer-motion";
import { Handle, Position } from "@xyflow/react";
import { PartnerNode } from "@/types";
import { cn } from "@/lib/utils";

const tombstoneAnimation: Variants = {
  hidden: {
    scale: 0,
    y: -50,
    opacity: 0,
    rotate: -10,
  },
  visible: {
    scale: 1,
    y: 0,
    opacity: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20,
      delay: 0.2,
    },
  },
  hover: {
    scale: 1.05,
    y: -5,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
};

interface TombstoneNodeProps {
  data: {
    partner: PartnerNode;
    owner_username: string;
  };
}

export const TombstoneNode = ({ data }: TombstoneNodeProps) => {
  const { partner, owner_username } = data;
  const [showDetails, setShowDetails] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 120
      });
    }
    setShowDetails(true);
  };

  const getCauseIcon = (cause: string | undefined) => {
    switch (cause) {
      case "Ghosted":
        return "👻";
      case "Cheated":
        return "💔";
      case "Boring":
        return "😴";
      case "Lost Interest":
        return "📉";
      case "Toxic Behavior":
        return "☢️";
      case "Distance Issues":
        return "🌍";
      case "Different Goals":
        return "🎯";
      case "Red Flags":
        return "🚩";
      case "No Chemistry":
        return "🧪";
      default:
        return "⚰️";
    }
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "Unknown";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <>
      <motion.div
        ref={nodeRef}
        className="relative select-none"
        variants={tombstoneAnimation}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowDetails(false)}
        style={{ width: 120, height: 140 }}
      >
      {/* Tombstone Shape */}
      <svg
        width="120"
        height="140"
        viewBox="0 0 120 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
      >
        {/* Shadow/Base */}
        <ellipse cx="60" cy="135" rx="45" ry="5" fill="rgba(0,0,0,0.4)" />

        {/* Main Tombstone Body */}
        <path
          d="M 20 140 L 20 40 Q 20 10, 60 10 Q 100 10, 100 40 L 100 140 Z"
          fill="#2A2A2A"
          stroke="#1A1A1A"
          strokeWidth="2"
        />

        {/* Texture/Cracks Overlay */}
        <path
          d="M 20 140 L 20 40 Q 20 10, 60 10 Q 100 10, 100 40 L 100 140 Z"
          fill="url(#stoneTexture)"
          opacity="0.3"
        />

        {/* Moss/Decay Accent */}
        <path
          d="M 30 130 Q 35 125, 40 130 L 35 135 Z"
          fill="rgba(57, 255, 20, 0.2)"
        />
        <path
          d="M 80 120 Q 85 115, 90 120 L 85 125 Z"
          fill="rgba(57, 255, 20, 0.15)"
        />

        {/* Gradient Definition */}
        <defs>
          <pattern id="stoneTexture" patternUnits="userSpaceOnUse" width="4" height="4">
            <rect width="2" height="2" fill="#1A1A1A" opacity="0.5" />
            <rect x="2" y="2" width="2" height="2" fill="#1A1A1A" opacity="0.5" />
          </pattern>
        </defs>
      </svg>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 pointer-events-none">
        {/* RIP Text */}
        <div className="font-display text-gray-400 text-xl font-bold mb-1 tracking-wider" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
          R.I.P
        </div>

        {/* Partner Nickname */}
        <div className="font-mono text-white text-sm font-semibold mb-2 text-center truncate max-w-full" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}>
          {partner.nickname}
        </div>

        {/* Cause Icon */}
        <div className="text-2xl mb-1 filter drop-shadow-md">
          {getCauseIcon(partner.cause_of_death)}
        </div>

        {/* Owner Tag */}
        <div className="font-mono text-[9px] text-gray-500 uppercase tracking-wide">
          by {owner_username}
        </div>

        {/* Date */}
        <div className="font-mono text-[8px] text-gray-600 mt-1">
          {formatDate(partner.graveyard_date)}
        </div>
      </div>

        {/* Glow on Hover */}
        {showDetails && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(57, 255, 20, 0.2) 0%, transparent 70%)",
              filter: "blur(15px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Handle for React Flow */}
        <Handle type="target" position={Position.Top} className="opacity-0" />
      </motion.div>

      {/* Floating Tooltip Portal */}
      {typeof window !== "undefined" && showDetails && createPortal(
        <motion.div
          className="fixed bg-black/95 border border-toxic-green/30 rounded-lg p-3 min-w-[200px] z-[9999] pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateX(-50%)'
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="font-display text-xs text-toxic-green uppercase tracking-wider mb-2">Cause of Death</div>
          <div className="font-mono text-sm text-white mb-2">
            {partner.cause_of_death || "Unknown"}
          </div>
          {partner.cause_of_death_custom && (
            <div className="font-mono text-xs text-gray-400 italic">
              {partner.cause_of_death_custom}
            </div>
          )}
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="font-mono text-[10px] text-gray-500">
              <div>Total Spent: ${partner.financial_total}</div>
              <div>Time Invested: {partner.time_total}h</div>
              <div>Intimacy: {partner.intimacy_score}/10</div>
            </div>
          </div>
        </motion.div>,
        document.body
      )}
    </>
  );
};
