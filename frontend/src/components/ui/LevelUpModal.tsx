"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { Zap, Trophy, Star } from "lucide-react";
import { LevelUpResult } from "@/types/xp";

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: LevelUpResult | null;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  if (!result) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </Dialog.Overlay>

            {/* Modal Content */}
            <Dialog.Content asChild>
              <motion.div
                className="fixed left-1/2 top-1/2 z-[210] w-[90vw] max-w-md"
                initial={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                exit={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                <div className="relative bg-gradient-to-br from-deep-space via-deep-void to-deep-space border-2 border-holo-cyan shadow-2xl shadow-holo-cyan/50 rounded-lg overflow-hidden">
                  {/* Animated Background Effect */}
                  <motion.div
                    className="absolute inset-0 opacity-20"
                    animate={{
                      background: [
                        "radial-gradient(circle at 20% 50%, #00F0FF 0%, transparent 50%)",
                        "radial-gradient(circle at 80% 50%, #FF007F 0%, transparent 50%)",
                        "radial-gradient(circle at 50% 80%, #39FF14 0%, transparent 50%)",
                        "radial-gradient(circle at 20% 50%, #00F0FF 0%, transparent 50%)",
                      ],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />

                  {/* Content */}
                  <div className="relative z-10 p-8 text-center">
                    {/* Icon */}
                    <motion.div
                      className="mx-auto w-20 h-20 mb-6 relative"
                      initial={{ rotate: 0, scale: 0 }}
                      animate={{ rotate: 360, scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                        delay: 0.2,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-holo-cyan to-lust-pink rounded-full blur-xl opacity-50" />
                      <div className="relative w-full h-full bg-gradient-to-br from-holo-cyan to-lust-pink rounded-full flex items-center justify-center">
                        <Trophy className="w-10 h-10 text-white" />
                      </div>
                    </motion.div>

                    {/* Title */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Dialog.Title className="text-4xl font-display font-bold text-white uppercase tracking-wider mb-2">
                        Level Up!
                      </Dialog.Title>
                      <Dialog.Description className="text-lg text-holo-cyan font-bold mb-6">
                        You reached Level {result.new_level}
                      </Dialog.Description>
                    </motion.div>

                    {/* XP Stats */}
                    <motion.div
                      className="space-y-4 mb-8"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="font-mono">{result.new_xp} XP</span>
                      </div>

                      {/* Level Progress */}
                      <div className="relative">
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-holo-cyan to-lust-pink"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(result.new_xp % 1000) / 10}%`,
                            }}
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-1 font-mono">
                          <span>Level {result.new_level}</span>
                          <span>Level {result.new_level + 1}</span>
                        </div>
                      </div>

                      {/* Motivational Text */}
                      <p className="text-sm text-gray-400 italic">
                        Keep grinding. More XP awaits.
                      </p>
                    </motion.div>

                    {/* Stars Animation */}
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(12)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute"
                          initial={{
                            opacity: 0,
                            scale: 0,
                            x: "50%",
                            y: "50%",
                          }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                            x: `${50 + Math.cos((i / 12) * Math.PI * 2) * 150}%`,
                            y: `${50 + Math.sin((i / 12) * Math.PI * 2) * 150}%`,
                          }}
                          transition={{
                            duration: 1.5,
                            delay: 0.2 + i * 0.05,
                            ease: "easeOut",
                          }}
                        >
                          <Star
                            className="w-4 h-4 text-yellow-400 fill-yellow-400"
                            style={{
                              filter: "drop-shadow(0 0 4px rgba(250, 204, 21, 0.8))",
                            }}
                          />
                        </motion.div>
                      ))}
                    </div>

                    {/* Close Button */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Dialog.Close asChild>
                        <button
                          className="px-8 py-3 bg-gradient-to-r from-holo-cyan to-lust-pink text-white font-display font-bold uppercase tracking-wider rounded-lg hover:shadow-lg hover:shadow-holo-cyan/50 transition-all"
                          onClick={onClose}
                        >
                          Continue
                        </button>
                      </Dialog.Close>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};
