"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

interface BlurImageProps {
  src: string;
  alt: string;
  blurred?: boolean;
  onToggleBlur?: (blurred: boolean) => void;
  aspectRatio?: "square" | "video" | "portrait";
  className?: string;
  showToggle?: boolean;
}

const aspectRatioStyles = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
};

export const BlurImage: React.FC<BlurImageProps> = ({
  src,
  alt,
  blurred: controlledBlurred,
  onToggleBlur,
  aspectRatio = "square",
  className,
  showToggle = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [internalBlurred, setInternalBlurred] = useState(true);

  const isBlurred =
    controlledBlurred !== undefined ? controlledBlurred : internalBlurred;

  const handleToggle = () => {
    if (controlledBlurred === undefined) {
      setInternalBlurred(!internalBlurred);
    }
    onToggleBlur?.(!isBlurred);
  };

  const shouldBlur = isBlurred && !isHovered;

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden group",
        aspectRatioStyles[aspectRatio],
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        animate={{
          filter: shouldBlur ? "blur(20px)" : "blur(0px)",
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
      />

      {/* Blur Overlay with "Fog of War" Effect */}
      <AnimatePresence>
        {shouldBlur && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-black/60 via-white/10 to-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Eye Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
              >
                <EyeOff className="w-12 h-12 text-white/50" />
              </motion.div>
            </div>

            {/* Hover Hint */}
            <motion.div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-mono text-white/70 uppercase tracking-wider"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Hover to Reveal
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unblur Indicator on Hover */}
      <AnimatePresence>
        {isBlurred && isHovered && (
          <motion.div
            className="absolute top-4 right-4 px-3 py-1 bg-holo-cyan/90 rounded-full text-xs font-mono font-bold text-black uppercase"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 20,
            }}
          >
            Revealed
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      {showToggle && (
        <motion.button
          onClick={handleToggle}
          className={cn(
            "absolute top-4 left-4 p-2 rounded-full backdrop-blur-md border transition-colors z-10",
            isBlurred
              ? "bg-white/10 border-white/20 hover:bg-white/20"
              : "bg-holo-cyan/20 border-holo-cyan/50 hover:bg-holo-cyan/30"
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {isBlurred ? (
            <EyeOff className="w-4 h-4 text-white" />
          ) : (
            <Eye className="w-4 h-4 text-holo-cyan" />
          )}
        </motion.button>
      )}
    </div>
  );
};
