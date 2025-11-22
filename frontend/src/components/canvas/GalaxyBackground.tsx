"use client";

import React, { useMemo } from "react";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDelay: number;
  animationDuration: number;
}

export const GalaxyBackground: React.FC = () => {
  // Generate stars with varied properties
  const stars = useMemo(() => {
    const starArray: Star[] = [];
    const starCount = 150;

    for (let i = 0; i < starCount; i++) {
      starArray.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.3,
        animationDelay: Math.random() * 5,
        animationDuration: Math.random() * 3 + 2,
      });
    }

    return starArray;
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Nebula gradients */}
      <div className="absolute inset-0">
        {/* Cyan nebula - top left */}
        <div
          className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full opacity-[0.03] blur-[120px] animate-nebula-drift"
          style={{
            background: "radial-gradient(circle, #00F0FF 0%, transparent 70%)",
            animationDelay: "0s",
          }}
        />

        {/* Purple nebula - bottom right */}
        <div
          className="absolute bottom-0 right-0 w-[700px] h-[700px] rounded-full opacity-[0.025] blur-[100px] animate-nebula-drift-reverse"
          style={{
            background: "radial-gradient(circle, #9d4edd 0%, transparent 70%)",
            animationDelay: "2s",
          }}
        />

        {/* Pink nebula - center right */}
        <div
          className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.02] blur-[110px] animate-nebula-pulse"
          style={{
            background: "radial-gradient(circle, #FF007F 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Stars */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {stars.map((star) => (
          <circle
            key={star.id}
            cx={`${star.x}%`}
            cy={`${star.y}%`}
            r={star.size}
            fill="#ffffff"
            opacity={star.opacity}
            style={{
              animation: `twinkle ${star.animationDuration}s ease-in-out infinite`,
              animationDelay: `${star.animationDelay}s`,
            }}
          />
        ))}
      </svg>
    </div>
  );
};
