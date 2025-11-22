"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Trophy, AlertCircle, ArrowRight, Banknote } from "lucide-react";
import type { Bet } from "@/types";
import { resolveBet, getBetSettlement } from "@/services/bettingService";

interface ResolveBetModalProps {
  bet: Bet;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResolveBetModal: React.FC<ResolveBetModalProps> = ({
  bet,
  onClose,
  onSuccess,
}) => {
  const [outcome, setOutcome] = useState<"yes" | "no" | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settlement, setSettlement] = useState<any[] | null>(null);
  const [showSettlement, setShowSettlement] = useState(false);

  const handleResolve = async () => {
    if (!outcome) {
      setError("Please select an outcome");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Resolve the bet
      await resolveBet(
        bet.id,
        { outcome },
        notes.trim() || undefined
      );

      // Fetch settlement details
      const settlementData = await getBetSettlement(bet.id);
      setSettlement(settlementData);
      setShowSettlement(true);

      // Don't close yet - show settlement first
    } catch (err: any) {
      setError(err.message || "Failed to resolve bet");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        className="w-full max-w-md bg-deep-void border-2 border-yellow-400/30 rounded-lg shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-yellow-400/10 to-transparent">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h3 className="text-xl font-display font-bold text-white uppercase">
                  Resolve Bet
                </h3>
              </div>
              <p className="text-sm text-white/70 font-mono">
                {bet.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Info Box */}
          <div className="p-4 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-mono text-yellow-400 font-bold mb-1">
                Bet Master Decision
              </div>
              <div className="text-xs text-white/70">
                As the bet master, you decide the outcome. All wagers will be automatically
                paid out based on your decision. This action cannot be undone.
              </div>
            </div>
          </div>

          {/* Bet Details */}
          {bet.description && (
            <div className="p-3 rounded bg-white/5 border border-white/10">
              <div className="text-xs text-white/50 font-mono uppercase mb-1">
                Description
              </div>
              <div className="text-sm text-white/90">{bet.description}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded bg-white/5 border border-white/10">
              <div className="text-xs text-white/50 font-mono uppercase mb-1">
                Target User
              </div>
              <div className="text-sm text-white font-display font-bold">
                {bet.target_user?.username || "Unknown"}
              </div>
            </div>
            <div className="p-3 rounded bg-white/5 border border-white/10">
              <div className="text-xs text-white/50 font-mono uppercase mb-1">
                Total Pot
              </div>
              <div className="text-sm text-toxic-green font-mono font-bold">
                {bet.total_pot} CHF
              </div>
            </div>
          </div>

          {/* Outcome Selection */}
          <div>
            <label className="block text-sm font-mono text-white/50 uppercase tracking-wider mb-3">
              What is the outcome?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                onClick={() => setOutcome("yes")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  outcome === "yes"
                    ? "bg-toxic-green/30 border-toxic-green"
                    : "bg-white/5 border-white/10 hover:border-toxic-green/50"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Check
                  className={`w-6 h-6 mx-auto mb-2 ${
                    outcome === "yes" ? "text-toxic-green" : "text-white/50"
                  }`}
                />
                <div
                  className={`text-sm font-mono font-bold ${
                    outcome === "yes" ? "text-toxic-green" : "text-white/70"
                  }`}
                >
                  YES
                </div>
                <div className="text-xs text-white/50 mt-1">
                  Bet happened
                </div>
              </motion.button>

              <motion.button
                onClick={() => setOutcome("no")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  outcome === "no"
                    ? "bg-simp-red/30 border-simp-red"
                    : "bg-white/5 border-white/10 hover:border-simp-red/50"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <X
                  className={`w-6 h-6 mx-auto mb-2 ${
                    outcome === "no" ? "text-simp-red" : "text-white/50"
                  }`}
                />
                <div
                  className={`text-sm font-mono font-bold ${
                    outcome === "no" ? "text-simp-red" : "text-white/70"
                  }`}
                >
                  NO
                </div>
                <div className="text-xs text-white/50 mt-1">
                  Did not happen
                </div>
              </motion.button>
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-sm font-mono text-white/50 uppercase tracking-wider mb-3">
              Resolution Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any context or explanation..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-yellow-400 transition-colors resize-none"
              rows={3}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-simp-red/20 border border-simp-red rounded text-sm text-simp-red font-mono">
              {error}
            </div>
          )}
        </div>

        {/* Settlement Display */}
        {showSettlement && settlement && settlement.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-gradient-to-br from-holo-cyan/10 to-transparent">
            <div className="flex items-center gap-3 mb-4">
              <Banknote className="w-6 h-6 text-holo-cyan" />
              <div>
                <h4 className="text-lg font-display font-bold text-holo-cyan uppercase">
                  Settlement via Twint
                </h4>
                <p className="text-xs text-white/70 font-mono">
                  Who pays who - send money now
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {settlement.map((payment, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-holo-cyan/30"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-simp-red/30 flex items-center justify-center text-sm font-bold text-simp-red">
                        {payment.payer_username?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <span className="text-sm font-display font-bold text-white">
                        {payment.payer_username || "Unknown"}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-holo-cyan" />

                  <div className="text-center px-4">
                    <div className="text-2xl font-mono font-bold text-holo-cyan">
                      {payment.amount} CHF
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-holo-cyan" />

                  <div className="flex-1 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm font-display font-bold text-white">
                        {payment.receiver_username || "Unknown"}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-toxic-green/30 flex items-center justify-center text-sm font-bold text-toxic-green">
                        {payment.receiver_username?.charAt(0).toUpperCase() || "?"}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {showSettlement && settlement && settlement.length === 0 && (
          <div className="p-6 border-t border-white/10">
            <div className="text-center text-white/70 font-mono text-sm">
              No payments needed - all bets on the same side or no bets placed
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/5">
          {!showSettlement ? (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 font-mono uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <motion.button
                onClick={handleResolve}
                disabled={!outcome || loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-lust-pink hover:from-yellow-400/80 hover:to-lust-pink/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-black font-mono font-bold uppercase tracking-wider transition-all shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Trophy className="w-5 h-5" />
                {loading ? "Resolving..." : "Resolve Bet"}
              </motion.button>
            </div>
          ) : (
            <motion.button
              onClick={handleFinish}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-holo-cyan to-toxic-green hover:from-holo-cyan/80 hover:to-toxic-green/80 rounded-lg text-black font-mono font-bold uppercase tracking-wider transition-all shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Check className="w-5 h-5" />
              Done - Close
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
