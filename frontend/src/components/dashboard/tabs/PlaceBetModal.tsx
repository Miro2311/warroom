"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, DollarSign, Zap, PieChart } from "lucide-react";
import type { Bet } from "@/types";
import { placeWager } from "@/services/bettingService";
import { supabase } from "@/lib/supabase";

interface PlaceBetModalProps {
  bet: Bet;
  userBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const PlaceBetModal: React.FC<PlaceBetModalProps> = ({
  bet,
  userBalance,
  onClose,
  onSuccess,
}) => {
  const [prediction, setPrediction] = useState<"yes" | "no" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingWagers, setExistingWagers] = useState<any[]>([]);

  // Use bet's fixed stake amount
  const betAmount = bet.stake_amount;

  // Load existing wagers to show pot distribution
  useEffect(() => {
    const loadWagers = async () => {
      try {
        const { data, error } = await supabase
          .from("wagers")
          .select("*")
          .eq("bet_id", bet.id)
          .eq("status", "active");

        if (!error && data) {
          setExistingWagers(data);
        }
      } catch (err) {
        console.error("Failed to load wagers", err);
      }
    };

    loadWagers();
  }, [bet.id]);

  // Calculate current pot distribution
  const yesTotal = existingWagers
    .filter((w) => w.prediction?.outcome === "yes")
    .reduce((sum, w) => sum + w.amount, 0);
  const noTotal = existingWagers
    .filter((w) => w.prediction?.outcome === "no")
    .reduce((sum, w) => sum + w.amount, 0);
  const currentTotalPot = yesTotal + noTotal;

  // Calculate new totals if user places bet
  const newYesTotal = yesTotal + (prediction === "yes" ? betAmount : 0);
  const newNoTotal = noTotal + (prediction === "no" ? betAmount : 0);
  const newTotalPot = newYesTotal + newNoTotal;

  // Calculate potential payout (share of the pot if you win)
  let potentialPayout = 0;
  if (prediction && betAmount > 0) {
    const yourSideTotal = prediction === "yes" ? newYesTotal : newNoTotal;
    if (yourSideTotal > 0) {
      potentialPayout = Math.floor((betAmount / yourSideTotal) * newTotalPot);
    }
  }
  const potentialProfit = potentialPayout - betAmount;

  const handlePlaceBet = async () => {
    if (!prediction || betAmount <= 0) {
      setError("Please select a prediction and enter an amount");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use odds of 1.0 since we're doing pool-based payouts
      await placeWager(
        bet.id,
        betAmount,
        { outcome: prediction },
        1.0
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to place bet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          className="w-full max-w-md bg-deep-void border-2 border-holo-cyan/30 rounded-lg shadow-2xl overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-holo-cyan/10 to-transparent">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-display font-bold text-white uppercase mb-1">
                  {bet.title}
                </h3>
                <p className="text-sm text-white/70 font-mono">
                  Place your bet
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
            {/* Prediction Selection */}
            <div>
              <label className="block text-sm font-mono text-white/50 uppercase tracking-wider mb-3">
                Your Prediction
              </label>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={() => setPrediction("yes")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    prediction === "yes"
                      ? "bg-toxic-green/30 border-toxic-green"
                      : "bg-white/5 border-white/10 hover:border-toxic-green/50"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <TrendingUp
                    className={`w-6 h-6 mx-auto mb-2 ${
                      prediction === "yes" ? "text-toxic-green" : "text-white/50"
                    }`}
                  />
                  <div
                    className={`text-sm font-mono font-bold ${
                      prediction === "yes" ? "text-toxic-green" : "text-white/70"
                    }`}
                  >
                    YES
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    {yesTotal} CHF in pot
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => setPrediction("no")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    prediction === "no"
                      ? "bg-simp-red/30 border-simp-red"
                      : "bg-white/5 border-white/10 hover:border-simp-red/50"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <TrendingDown
                    className={`w-6 h-6 mx-auto mb-2 ${
                      prediction === "no" ? "text-simp-red" : "text-white/50"
                    }`}
                  />
                  <div
                    className={`text-sm font-mono font-bold ${
                      prediction === "no" ? "text-simp-red" : "text-white/70"
                    }`}
                  >
                    NO
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    {noTotal} CHF in pot
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Current Pot Distribution */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-holo-cyan" />
                  <span className="text-sm font-mono text-white/70 uppercase">
                    Current Pot
                  </span>
                </div>
                <div className="text-lg font-mono font-bold text-white">
                  {currentTotalPot} CHF
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-xs text-white/50 mb-1">YES</div>
                  <div className="text-lg font-mono font-bold text-toxic-green">
                    {yesTotal} CHF
                  </div>
                </div>
                <div className="text-white/30">VS</div>
                <div className="flex-1 text-right">
                  <div className="text-xs text-white/50 mb-1">NO</div>
                  <div className="text-lg font-mono font-bold text-simp-red">
                    {noTotal} CHF
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Stake Amount Display */}
            <div className="p-6 rounded-lg bg-gradient-to-br from-holo-cyan/10 to-transparent border border-holo-cyan/30">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-holo-cyan" />
                <label className="text-sm font-mono text-holo-cyan uppercase tracking-wider">
                  Stake Amount (Fixed)
                </label>
              </div>
              <div className="text-4xl font-mono font-bold text-white mb-2">
                {betAmount} CHF
              </div>
              <div className="text-xs text-white/50 font-mono">
                Everyone must bet this amount - pay via Twint
              </div>
            </div>

            {/* Payout Display */}
            {prediction && betAmount > 0 && (
              <motion.div
                className="p-4 rounded-lg bg-gradient-to-r from-holo-cyan/10 to-transparent border border-holo-cyan/30"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-white/70">
                      New Total Pot
                    </span>
                    <span className="text-lg font-mono font-bold text-white">
                      {newTotalPot} CHF
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-white/70">
                      Your Potential Win
                    </span>
                    <span className="text-xl font-mono font-bold text-holo-cyan">
                      {potentialPayout} CHF
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-white/70">
                      Potential Profit
                    </span>
                    <span className="text-lg font-mono font-bold text-toxic-green">
                      +{potentialProfit} CHF
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-simp-red/20 border border-simp-red rounded text-sm text-simp-red font-mono">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 bg-white/5">
            <motion.button
              onClick={handlePlaceBet}
              disabled={!prediction || betAmount <= 0 || loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-holo-cyan to-lust-pink hover:from-holo-cyan/80 hover:to-lust-pink/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-mono font-bold uppercase tracking-wider transition-all shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Zap className="w-5 h-5" />
              {loading ? "Placing Bet..." : "Place Bet"}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
