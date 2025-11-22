"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number | React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "warning" | "danger" | "success";
  className?: string;
  animate?: boolean;
  glowOnHover?: boolean;
  onClick?: () => void;
}

const variantStyles = {
  default: {
    bg: "bg-white/5",
    border: "border-white/10",
    glow: "",
  },
  success: {
    bg: "bg-holo-cyan/10",
    border: "border-holo-cyan/30",
    glow: "shadow-[0_0_20px_rgba(0,240,255,0.3)]",
  },
  warning: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    glow: "shadow-[0_0_20px_rgba(234,179,8,0.3)]",
  },
  danger: {
    bg: "bg-simp-red/10",
    border: "border-simp-red/30",
    glow: "shadow-[0_0_20px_rgba(255,42,42,0.3)]",
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = "default",
  className,
  animate = true,
  glowOnHover = true,
  onClick,
}) => {
  const styles = variantStyles[variant];

  return (
    <motion.div
      className={cn(
        "relative p-6 rounded-lg border backdrop-blur-sm",
        styles.bg,
        styles.border,
        glowOnHover && "hover:" + styles.glow,
        onClick && "cursor-pointer",
        "transition-all duration-300",
        className
      )}
      initial={animate ? { opacity: 0, scale: 0.95 } : false}
      animate={animate ? { opacity: 1, scale: 1 } : false}
      whileHover={
        glowOnHover
          ? {
              scale: 1.02,
              transition: { type: "spring", stiffness: 400, damping: 20 },
            }
          : undefined
      }
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
    >
      {/* Icon & Title */}
      <div className="flex items-center gap-3 mb-4">
        {icon && (
          <motion.div
            className="text-white/70"
            animate={
              variant === "danger"
                ? { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }
                : undefined
            }
            transition={
              variant === "danger"
                ? { duration: 2, repeat: Infinity }
                : undefined
            }
          >
            {icon}
          </motion.div>
        )}
        <h3 className="text-xs font-mono text-white/50 uppercase tracking-wider">
          {title}
        </h3>
      </div>

      {/* Value */}
      <motion.div
        className="text-4xl font-mono font-bold text-white mb-2"
        initial={animate ? { opacity: 0, y: 20 } : false}
        animate={animate ? { opacity: 1, y: 0 } : false}
        transition={{ delay: 0.1 }}
      >
        {value}
      </motion.div>

      {/* Subtitle & Trend */}
      <div className="flex items-center justify-between">
        {subtitle && (
          <span className="text-sm font-mono text-white/50">{subtitle}</span>
        )}
        {trend && trendValue && (
          <motion.div
            className={cn(
              "flex items-center gap-1 text-xs font-mono",
              trend === "up" && "text-toxic-green",
              trend === "down" && "text-simp-red",
              trend === "neutral" && "text-white/50"
            )}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {trend === "up" && "↑"}
            {trend === "down" && "↓"}
            {trend === "neutral" && "→"}
            <span>{trendValue}</span>
          </motion.div>
        )}
      </div>

      {/* Pulse Effect for Danger */}
      {variant === "danger" && (
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-simp-red pointer-events-none"
          animate={{
            opacity: [0.5, 0, 0.5],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
};
