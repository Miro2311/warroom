"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TimelineItemProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  timestamp: string;
  variant?: "default" | "success" | "warning" | "danger";
  isLast?: boolean;
  metadata?: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: {
    icon: "bg-white/10 text-white border-white/20",
    line: "bg-white/20",
  },
  success: {
    icon: "bg-toxic-green/20 text-toxic-green border-toxic-green/40",
    line: "bg-toxic-green/20",
  },
  warning: {
    icon: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    line: "bg-yellow-500/20",
  },
  danger: {
    icon: "bg-simp-red/20 text-simp-red border-simp-red/40",
    line: "bg-simp-red/20",
  },
};

export const TimelineItem: React.FC<TimelineItemProps> = ({
  icon,
  title,
  description,
  timestamp,
  variant = "default",
  isLast = false,
  metadata,
  className,
}) => {
  const styles = variantStyles[variant];

  return (
    <motion.div
      className={cn("relative flex gap-4 pb-8", className)}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      {/* Timeline Line */}
      {!isLast && (
        <div
          className={cn(
            "absolute left-6 top-12 w-0.5 h-full",
            styles.line
          )}
        />
      )}

      {/* Icon Circle */}
      <motion.div
        className={cn(
          "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 backdrop-blur-sm",
          styles.icon
        )}
        whileHover={{
          scale: 1.1,
          rotate: [0, -5, 5, 0],
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 20,
        }}
      >
        {icon}
      </motion.div>

      {/* Content */}
      <div className="flex-1 pt-1">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h4 className="text-base font-display font-bold text-white">
            {title}
          </h4>
          <span className="text-xs font-mono text-white/50 whitespace-nowrap">
            {timestamp}
          </span>
        </div>

        {description && (
          <p className="text-sm text-white/70 mb-3">{description}</p>
        )}

        {metadata && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {metadata}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

interface TimelineContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const TimelineContainer: React.FC<TimelineContainerProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn("relative space-y-0", className)}>
      {children}
    </div>
  );
};
