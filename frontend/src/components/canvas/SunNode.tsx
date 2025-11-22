import React from "react";
import { Handle, Position } from "@xyflow/react";
import { User, PartnerNode } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { getOrbitData } from "@/lib/orbitCalculator";
import { useStore } from "@/store/useStore";

// Props passed by ReactFlow
interface SunNodeProps {
  data: {
    user: User;
    partners?: PartnerNode[];
  };
}

export const SunNode = ({ data }: SunNodeProps) => {
  const { user, partners = [] } = data;
  const setUserStatsModalOpen = useStore((state) => state.setUserStatsModalOpen);

  // Click handler to open user stats modal
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUserStatsModalOpen(true);
  };

  // Check if user is a cheater (has "Signed" partner(s) AND other partners)
  const signedPartners = partners.filter(p => p.status === "Signed");
  const otherPartners = partners.filter(p => p.status !== "Signed");
  const isCheater = signedPartners.length >= 1 && otherPartners.length >= 1;

  // Size increases based on level. Base size 80px + level * 10
  const size = 80 + user.level * 10;

  // Get orbital data for each partner (excluding graveyard)
  const activePartners = partners.filter(p => p.status !== "Graveyard");

  // Group by status (each status gets exactly ONE orbit ring)
  const statusMap = new Map<string, { radius: number; status: string }>();
  activePartners.forEach(partner => {
    if (!statusMap.has(partner.status)) {
      const orbitData = getOrbitData(partner);
      statusMap.set(partner.status, {
        radius: orbitData.radius,
        status: partner.status,
      });
    }
  });

  // Convert to array of unique orbits (one per status)
  const orbits = Array.from(statusMap.values());

  // Get color for orbit ring
  const getOrbitColor = (status: string) => {
    switch (status) {
      case 'Exclusive': return '#00F0FF';  // Cyan
      case 'Signed': return '#4ADE80';     // Green
      case 'Dating': return '#C084FC';     // Purple
      case 'Talking': return '#FB923C';    // Orange
      case "It's Complicated": return '#FACC15'; // Yellow
      default: return '#9CA3AF';
    }
  };

  return (
    <div
      className="rounded-full relative flex items-center justify-center transition-all duration-500 cursor-pointer hover:scale-105"
      onClick={handleClick}
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 30% 30%, #FFD700 0%, #FF8C00 50%, #FF4500 100%)",
        boxShadow: "0 0 60px rgba(255, 69, 0, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.5)"
      }}
    >
      {/* Orbital Rings - One ring per unique radius */}
      {orbits.map((orbit, index) => (
        <div
          key={`orbit-${orbit.radius}-${index}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: orbit.radius * 2,
            height: orbit.radius * 2,
            border: `1px solid ${getOrbitColor(orbit.status)}`,
            opacity: 0.15,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      {/* Core Pulse Animation */}
      <div className="absolute inset-[-10px] rounded-full bg-orange-500/20 blur-xl animate-pulse pointer-events-none" />

      {/* CHEATER Animation Ring */}
      <AnimatePresence>
        {isCheater && (
          <motion.div
            className="absolute pointer-events-none"
            style={{
              width: size + 100,
              height: size + 100,
              left: '50%',
              top: '50%',
              marginLeft: -(size + 100) / 2,
              marginTop: -(size + 100) / 2,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: 360,
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              rotate: {
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              },
              opacity: { duration: 0.5 },
              scale: { duration: 0.5 }
            }}
          >
            {/* Pulsing Alert Ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-simp-red"
              style={{
                boxShadow: "0 0 40px rgba(255, 42, 42, 0.8), inset 0 0 20px rgba(255, 42, 42, 0.4)"
              }}
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* CHEATER Text Labels - 4 positions around the ring */}
            {[0, 90, 180, 270].map((angle, index) => {
              const radian = (angle * Math.PI) / 180;
              const radius = (size + 100) / 2;
              const x = radius + Math.cos(radian) * (radius - 20);
              const y = radius + Math.sin(radian) * (radius - 20);

              return (
                <motion.div
                  key={angle}
                  className="absolute font-display font-black text-simp-red uppercase tracking-widest"
                  style={{
                    left: x,
                    top: y,
                    transform: 'translate(-50%, -50%)',
                    fontSize: '14px',
                    textShadow: '0 0 10px #FF2A2A, 0 0 20px #FF2A2A, 0 0 30px #FF2A2A',
                    filter: 'drop-shadow(0 0 8px rgba(255, 42, 42, 0.8))',
                  }}
                  animate={{
                    opacity: [1, 0.6, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.25,
                  }}
                >
                  CHEATER
                </motion.div>
              );
            })}

            {/* Warning Triangles */}
            <motion.div
              className="absolute inset-0"
              animate={{
                rotate: -360,
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {[0, 120, 240].map((angle) => {
                const radian = (angle * Math.PI) / 180;
                const radius = (size + 100) / 2;
                const x = radius + Math.cos(radian) * (radius - 10);
                const y = radius + Math.sin(radian) * (radius - 10);

                return (
                  <div
                    key={angle}
                    className="absolute text-simp-red text-xl"
                    style={{
                      left: x,
                      top: y,
                      transform: 'translate(-50%, -50%)',
                      filter: 'drop-shadow(0 0 6px rgba(255, 42, 42, 0.8))',
                    }}
                  >
                    ⚠
                  </div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
