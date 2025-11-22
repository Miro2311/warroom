"use client";

import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { BettingStudioTab } from "@/components/dashboard/tabs/BettingStudioTab";
import type { User } from "@/types";

interface BettingStudioPanelProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupMembers: User[];
}

export const BettingStudioPanel = ({
  isOpen,
  onClose,
  groupId,
  groupMembers,
}: BettingStudioPanelProps) => {
  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel - Centered */}
          <motion.div
            className="fixed top-1/2 left-1/2 z-[210] w-[95vw] md:w-[90vw] max-w-6xl"
            initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="bg-deep-void border-2 border-yellow-400/30 rounded-lg shadow-[0_0_50px_rgba(250,204,21,0.2)] overflow-hidden max-h-[95vh] md:max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-4 md:p-6 border-b-2 border-yellow-400/20 flex items-center justify-between bg-gradient-to-r from-yellow-400/5 to-transparent">
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-xl md:text-2xl uppercase tracking-wider text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] flex items-center gap-2 md:gap-3">
                    <span className="text-2xl md:text-3xl">🎰</span>
                    <span className="truncate">Betting Studio</span>
                  </h2>
                  <p className="font-mono text-xs md:text-sm text-gray-400 mt-1">
                    Place your bets and dominate the leaderboard
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 md:p-2 hover:bg-yellow-400/10 rounded-lg transition-colors border border-yellow-400/20 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
                </button>
              </div>

              {/* Body - Scrollable Content */}
              <div className="p-4 md:p-8 overflow-y-auto scrollbar-hide">
                <BettingStudioTab groupId={groupId} groupMembers={groupMembers} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
