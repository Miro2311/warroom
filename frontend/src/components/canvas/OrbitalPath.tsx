"use client";

import React from "react";
import { motion } from "framer-motion";
import { OrbitData } from "@/lib/orbitCalculator";

interface OrbitalPathProps {
  radius: number;
  tier: OrbitData['tier'];
  isHovered?: boolean;
  status: string;
}

/**
 * Orbital Path Component
 * Renders the visible orbit trail that planets follow
 */
export const OrbitalPath: React.FC<OrbitalPathProps> = ({
  radius,
  tier,
  isHovered = false,
  status,
}) => {
  // Color based on tier and status
  const getOrbitColor = () => {
    if (status === 'Exclusive') return '#00F0FF'; // Holo-cyan
    if (status === 'Dating') return '#3B82F6';    // Blue
    if (status === 'Talking') return '#FF007F';   // Lust pink
    if (status === 'It\'s Complicated') return '#A855F7'; // Purple
    if (status === 'Graveyard') return '#6B7280'; // Gray
    return '#1A1A2E'; // Default
  };

  const orbitColor = getOrbitColor();

  // Opacity based on tier
  const baseOpacity = {
    close: 0.3,
    medium: 0.2,
    far: 0.15,
    void: 0.1,
  }[tier];

  return (
    <motion.circle
      cx="0"
      cy="0"
      r={radius}
      fill="none"
      stroke={orbitColor}
      strokeWidth={isHovered ? 2 : 1}
      strokeDasharray="5,10"
      initial={{ opacity: baseOpacity }}
      animate={{
        opacity: isHovered ? baseOpacity * 3 : baseOpacity,
        strokeWidth: isHovered ? 2 : 1,
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      className="pointer-events-none"
      style={{
        filter: isHovered
          ? `drop-shadow(0 0 8px ${orbitColor})`
          : 'none',
      }}
    />
  );
};

/**
 * Orbital Paths Container
 * Renders all orbital paths as SVG overlay on the canvas
 */
interface OrbitalPathsContainerProps {
  orbits: Array<{
    id: string;
    radius: number;
    tier: OrbitData['tier'];
    status: string;
    isHovered: boolean;
  }>;
  sunPosition: { x: number; y: number };
}

export const OrbitalPathsContainer: React.FC<OrbitalPathsContainerProps> = ({
  orbits,
}) => {
  return (
    <svg
      className="pointer-events-none"
      style={{
        width: '2000px',
        height: '2000px',
      }}
      viewBox="-1000 -1000 2000 2000"
    >
      {orbits.map((orbit) => (
        <OrbitalPath
          key={orbit.id}
          radius={orbit.radius}
          tier={orbit.tier}
          status={orbit.status}
          isHovered={orbit.isHovered}
        />
      ))}
    </svg>
  );
};
