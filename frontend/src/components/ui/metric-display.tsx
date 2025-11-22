"use client";

import React, { useEffect, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface MetricDisplayProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

export const MetricDisplay: React.FC<MetricDisplayProps> = ({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1,
  className,
}) => {
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (latest) =>
    latest.toFixed(decimals)
  );

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return (
    <motion.span className={cn("tabular-nums", className)}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
};

interface AnimatedProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  variant?: "default" | "gradient" | "danger";
  className?: string;
  height?: "sm" | "md" | "lg";
}

const heightStyles = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  max = 100,
  showLabel = false,
  variant = "default",
  className,
  height = "md",
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const gradientStyles = {
    default: "bg-holo-cyan",
    gradient: "bg-gradient-to-r from-lust-pink via-holo-cyan to-toxic-green",
    danger: "bg-simp-red",
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-mono text-white/50">
          <span>Progress</span>
          <span>{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div
        className={cn(
          "w-full bg-white/10 rounded-full overflow-hidden",
          heightStyles[height]
        )}
      >
        <motion.div
          className={cn("h-full rounded-full", gradientStyles[variant])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
          }}
        />
      </div>
    </div>
  );
};
