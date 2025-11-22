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
            className="fixed top-1/2 left-1/2 z-[210] w-[90vw] max-w-6xl"
            initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="bg-deep-void border-2 border-yellow-400/30 rounded-lg shadow-[0_0_50px_rgba(250,204,21,0.2)] overflow-hidden max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b-2 border-yellow-400/20 flex items-center justify-between bg-gradient-to-r from-yellow-400/5 to-transparent">
                <div>
                  <h2 className="font-display text-2xl uppercase tracking-wider text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] flex items-center gap-3">
                    <span className="text-3xl">🎰</span>
                    Betting Studio
                  </h2>
                  <p className="font-mono text-sm text-gray-400 mt-1">
                    Place your bets and dominate the leaderboard
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-yellow-400/10 rounded-lg transition-colors border border-yellow-400/20"
                >
                  <X className="w-6 h-6 text-yellow-400" />
                </button>
              </div>

              {/* Body - Scrollable Content */}
              <div className="p-8 overflow-y-auto custom-scrollbar">
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
