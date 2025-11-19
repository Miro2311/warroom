import React from "react";
import { cn } from "@/lib/utils";

interface SimpMeterProps {
  value: number;
  className?: string;
}

export const SimpMeter = ({ value, className }: SimpMeterProps) => {
  // Gauge Logic
  // Max value for visual gauge is 1000 (but can go higher in state)
  const normalizedValue = Math.min(value, 1000);
  const percent = normalizedValue / 1000;
  const circumference = 2 * Math.PI * 40; // radius 40
  const offset = circumference - percent * circumference * 0.75; // 75% circle

  // Determine status
  let color = "text-holo-cyan";
  let statusText = "SAFE";
  let glow = "shadow-[0_0_20px_#00F0FF]";
  
  if (value > 200 && value <= 500) {
    color = "text-yellow-400";
    statusText = "CAUTION";
    glow = "shadow-[0_0_20px_#FACC15]";
  } else if (value > 500) {
    color = "text-simp-red";
    statusText = "CRITICAL";
    glow = "shadow-[0_0_30px_#FF2A2A]";
  }

  const isCritical = value > 500;

  return (
    <div className={cn("flex flex-col items-center relative p-4", className)}>
      {/* Gauge Container */}
      <div className={cn("relative w-48 h-48 flex items-center justify-center", isCritical && "animate-shake")}>
        {/* SVG Gauge */}
        <svg className="w-full h-full rotate-[135deg]" viewBox="0 0 100 100">
          {/* Background Track */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#1A1A2E"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          />
          {/* Value Arc */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className={cn("transition-all duration-1000 ease-out", color)}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
          />
        </svg>

        {/* Inner Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-4">
          <div className="text-xs text-gray-400 font-mono uppercase tracking-widest">Simp Index</div>
          <div className={cn("text-3xl font-display font-bold tabular-nums", color)}>
            {Math.round(value)}
          </div>
          <div className={cn("text-[10px] font-bold px-2 py-0.5 rounded mt-1 bg-black/50 border border-white/10", color)}>
            {statusText}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px) rotate(-2deg); }
          75% { transform: translateX(2px) rotate(2deg); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
