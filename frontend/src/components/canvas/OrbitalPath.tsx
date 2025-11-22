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
  // Color based on status - matching PlanetNode colors exactly
  const getOrbitColor = () => {
    switch (status) {
      case 'Exclusive':
        return '#00F0FF'; // Holo-cyan (rgb(0, 240, 255))
      case 'Signed':
        return '#4ADE80'; // Green-400 (rgb(74, 222, 128))
      case 'Dating':
        return '#C084FC'; // Purple-400 (rgb(192, 132, 252))
      case 'Talking':
        return '#FB923C'; // Orange-400 (rgb(251, 146, 60))
      case "It's Complicated":
        return '#FACC15'; // Yellow-400 (rgb(250, 204, 21))
      case 'Graveyard':
        return '#9CA3AF'; // Gray-400 (rgb(156, 163, 175))
      default:
        return '#9CA3AF'; // Gray-400 default
    }
  };

  const orbitColor = getOrbitColor();

  // Higher opacity for better visibility against galaxy background
  const baseOpacity = {
    close: 0.35,
    medium: 0.3,
    far: 0.25,
    void: 0.2,
  }[tier];

  // Glow intensity
  const baseGlow = {
    close: 6,
    medium: 5,
    far: 4,
    void: 3,
  }[tier];

  return (
    <motion.circle
      cx="0"
      cy="0"
      r={radius}
      fill="none"
      stroke={orbitColor}
      strokeWidth={isHovered ? 2.5 : 1.5}
      strokeDasharray="0"
      initial={{ opacity: baseOpacity }}
      animate={{
        opacity: isHovered ? Math.min(baseOpacity * 1.8, 0.7) : baseOpacity,
        strokeWidth: isHovered ? 2.5 : 1.5,
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      className="pointer-events-none"
      style={{
        filter: isHovered
          ? `drop-shadow(0 0 ${baseGlow * 2}px ${orbitColor})`
          : `drop-shadow(0 0 ${baseGlow}px ${orbitColor})`,
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
