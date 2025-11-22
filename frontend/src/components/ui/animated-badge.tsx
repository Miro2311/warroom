"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
}

const variantStyles = {
  default: "bg-white/10 text-white border-white/20",
  success: "bg-toxic-green/20 text-toxic-green border-toxic-green/40",
  warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  danger: "bg-simp-red/20 text-simp-red border-simp-red/40",
  info: "bg-holo-cyan/20 text-holo-cyan border-holo-cyan/40",
};

const sizeStyles = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
  lg: "text-base px-4 py-1.5",
};

export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  children,
  variant = "default",
  size = "sm",
  pulse = false,
  className,
}) => {
  return (
    <motion.span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-mono font-bold uppercase tracking-wider",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 20,
      }}
    >
      {pulse && (
        <motion.span
          className="w-2 h-2 rounded-full bg-current"
          animate={{
            opacity: [1, 0.3, 1],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      {children}
    </motion.span>
  );
};
