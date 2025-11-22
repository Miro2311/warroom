"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { CauseOfDeath } from "@/types";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface CauseOfDeathModalProps {
  isOpen: boolean;
  partnerNickname: string;
  onConfirm: (cause: CauseOfDeath, customReason?: string) => void;
  onCancel: () => void;
}

const CAUSE_OPTIONS: { value: CauseOfDeath; label: string; description: string }[] = [
  { value: "Ghosted", label: "Ghosted", description: "Disappeared without a trace" },
  { value: "Cheated", label: "Cheated", description: "Broke trust, game over" },
  { value: "Boring", label: "Boring", description: "Zero excitement, pure snoozefest" },
  { value: "Lost Interest", label: "Lost Interest", description: "The spark just died" },
  { value: "Toxic Behavior", label: "Toxic Behavior", description: "Red flags everywhere" },
  { value: "Distance Issues", label: "Distance Issues", description: "Too far, too hard" },
  { value: "Different Goals", label: "Different Goals", description: "Wanted different things" },
  { value: "Red Flags", label: "Red Flags", description: "Warning signs ignored no more" },
  { value: "No Chemistry", label: "No Chemistry", description: "Just wasn't there" },
  { value: "Custom", label: "Custom", description: "Write your own epitaph" },
];

export const CauseOfDeathModal: React.FC<CauseOfDeathModalProps> = ({
  isOpen,
  partnerNickname,
  onConfirm,
  onCancel,
}) => {
  const [selectedCause, setSelectedCause] = useState<CauseOfDeath | null>(null);
  const [customReason, setCustomReason] = useState("");

  const handleConfirm = () => {
    if (!selectedCause) return;
    onConfirm(selectedCause, selectedCause === "Custom" ? customReason : undefined);
    setSelectedCause(null);
    setCustomReason("");
  };

  const handleCancel = () => {
    setSelectedCause(null);
    setCustomReason("");
    onCancel();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleCancel}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/90 backdrop-blur-md z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>

            {/* Modal Content */}
            <Dialog.Content asChild>
              <motion.div
                className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-2xl bg-deep-space border border-white/20 shadow-2xl overflow-hidden rounded-lg"
                initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-48%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-48%" }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                {/* Header */}
                <div className="border-b border-white/10 p-6 flex items-center justify-between bg-gradient-to-r from-white/5 to-transparent backdrop-blur-sm">
                  <div className="flex-1">
                    <Dialog.Title className="text-2xl font-display font-bold text-white uppercase tracking-wider">
                      Relationship Ended
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-white/50 font-mono mt-2">
                      {partnerNickname} has been moved to the graveyard
                    </Dialog.Description>
                  </div>

                  <Dialog.Close asChild>
                    <motion.button
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X className="w-5 h-5 text-white" />
                    </motion.button>
                  </Dialog.Close>
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="font-mono text-xs uppercase tracking-wider text-white/50 mb-4">
                    Select Cause of Death
                  </div>

                  {/* Grid of Options */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {CAUSE_OPTIONS.map((option) => (
                      <motion.button
                        key={option.value}
                        onClick={() => setSelectedCause(option.value)}
                        className={cn(
                          "p-4 rounded border transition-all duration-150 text-left",
                          selectedCause === option.value
                            ? "border-holo-cyan bg-holo-cyan/10"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="font-display text-sm uppercase tracking-wide text-white mb-1">
                          {option.label}
                        </div>
                        <div className={cn(
                          "font-mono text-xs",
                          selectedCause === option.value ? "text-holo-cyan" : "text-white/50"
                        )}>
                          {option.description}
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Custom Reason Input */}
                  <AnimatePresence>
                    {selectedCause === "Custom" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <label className="font-mono text-xs uppercase tracking-wider text-white/50 mb-2 block">
                          Custom Reason
                        </label>
                        <textarea
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="What happened..."
                          className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 font-mono text-sm text-white placeholder-white/30 focus:border-holo-cyan focus:outline-none resize-none"
                          rows={3}
                          maxLength={200}
                          autoFocus
                        />
                        <div className="text-right font-mono text-xs text-white/30 mt-1">
                          {customReason.length}/200
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-white/10 p-6 flex items-center justify-end gap-3 bg-gradient-to-r from-white/5 to-transparent backdrop-blur-sm">
                  <motion.button
                    onClick={handleCancel}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-display rounded transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleConfirm}
                    disabled={!selectedCause || (selectedCause === "Custom" && !customReason.trim())}
                    className={cn(
                      "px-6 py-3 rounded font-display font-bold transition-all",
                      selectedCause && (selectedCause !== "Custom" || customReason.trim())
                        ? "bg-simp-red hover:bg-simp-red/80 text-white"
                        : "bg-white/10 text-white/30 cursor-not-allowed"
                    )}
                    whileHover={selectedCause && (selectedCause !== "Custom" || customReason.trim()) ? { scale: 1.05 } : {}}
                    whileTap={selectedCause && (selectedCause !== "Custom" || customReason.trim()) ? { scale: 0.95 } : {}}
                  >
                    Confirm Death
                  </motion.button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};
