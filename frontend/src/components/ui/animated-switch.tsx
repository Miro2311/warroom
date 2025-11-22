"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedSwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const AnimatedSwitch: React.FC<AnimatedSwitchProps> = ({
  checked = false,
  onCheckedChange,
  label,
  disabled = false,
  className,
}) => {
  const handleToggle = () => {
    if (!disabled) {
      onCheckedChange?.(!checked);
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        role="switch"
        aria-checked={checked}
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "relative w-14 h-8 rounded-full transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-holo-cyan focus:ring-offset-2 focus:ring-offset-black",
          checked ? "bg-holo-cyan" : "bg-white/20",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer"
        )}
      >
        {/* Glow Effect */}
        {checked && !disabled && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: "0 0 20px rgba(0, 240, 255, 0.6)" }}
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Toggle Thumb */}
        <motion.div
          className={cn(
            "absolute top-1 w-6 h-6 rounded-full shadow-lg",
            checked ? "bg-black" : "bg-white"
          )}
          animate={{
            x: checked ? 24 : 4,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />
      </button>

      {label && (
        <span
          className={cn(
            "text-sm font-mono text-white/70",
            disabled && "opacity-50"
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
};
