"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Calendar, Target, Tag, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import type { User, BetCategory } from "@/types";
import { createBet, placeWager } from "@/services/bettingService";

interface CreateBetModalProps {
  groupId: string;
  groupMembers: User[];
  onClose: () => void;
  onSuccess: () => void;
}

const BET_CATEGORIES: { value: BetCategory; label: string; description: string }[] = [
  { value: "first_date", label: "First Date", description: "Will they go on a first date?" },
  { value: "kiss", label: "Kiss", description: "Will they kiss someone?" },
  { value: "sex", label: "Intimacy", description: "Will they reach a new intimacy level?" },
  { value: "relationship", label: "Relationship", description: "Will they start a relationship?" },
  { value: "breakup", label: "Breakup", description: "Will they break up?" },
  { value: "response_time", label: "Response Time", description: "How fast will they respond?" },
  { value: "money_spent", label: "Money Spent", description: "How much will they spend?" },
  { value: "custom", label: "Custom", description: "Create your own bet" },
];

export const CreateBetModal: React.FC<CreateBetModalProps> = ({
  groupId,
  groupMembers,
  onClose,
  onSuccess,
}) => {
  const [targetUserId, setTargetUserId] = useState("");
  const [category, setCategory] = useState<BetCategory>("first_date");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [initialAmount, setInitialAmount] = useState("");
  const [initialPrediction, setInitialPrediction] = useState<"yes" | "no">("yes");
  const [daysUntilDeadline, setDaysUntilDeadline] = useState("7");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateBet = async () => {
    const amount = parseInt(initialAmount);
    if (!targetUserId || !title.trim() || !amount || amount <= 0) {
      setError("Please fill all fields and enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + parseInt(daysUntilDeadline));

      // Create the bet
      const newBet = await createBet({
        groupId,
        targetUserId,
        title,
        description,
        betType: "custom",
        category,
        deadline: deadline.toISOString(),
        stakeAmount: amount,
      });

      // Place initial wager
      await placeWager(
        newBet.id,
        amount,
        { outcome: initialPrediction },
        1.0
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create bet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        className="w-full max-w-2xl bg-deep-void border-2 border-holo-cyan/30 rounded-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-holo-cyan/10 to-transparent sticky top-0 z-10 bg-deep-void">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-display font-bold text-white uppercase mb-1">
                Create New Bet
              </h3>
              <p className="text-sm text-white/70 font-mono">
                Set up a custom bet for your group
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
          {/* Target User Selection */}
          <div>
            <label className="block text-sm font-mono text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Target User
            </label>
            <div className="grid grid-cols-2 gap-3">
              {groupMembers.map((member) => (
                <motion.button
                  key={member.id}
                  onClick={() => setTargetUserId(member.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    targetUserId === member.id
                      ? "bg-holo-cyan/30 border-holo-cyan"
                      : "bg-white/5 border-white/10 hover:border-holo-cyan/50"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-holo-cyan to-lust-pink flex items-center justify-center text-sm font-bold text-black">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-display font-bold text-white">
                        {member.username}
                      </div>
                      <div className="text-xs text-white/50 font-mono">
                        Level {member.level}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-mono text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              {BET_CATEGORIES.map((cat) => (
                <motion.button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    category === cat.value
                      ? "bg-lust-pink/30 border-lust-pink"
                      : "bg-white/5 border-white/10 hover:border-lust-pink/50"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className={`text-sm font-mono font-bold mb-1 ${
                      category === cat.value ? "text-lust-pink" : "text-white"
                    }`}
                  >
                    {cat.label}
                  </div>
                  <div className="text-xs text-white/50">{cat.description}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-sm font-mono text-white/50 uppercase tracking-wider mb-3">
              Bet Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Will John go on a date this week?"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-mono focus:outline-none focus:border-holo-cyan transition-colors"
              maxLength={255}
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-mono text-white/50 uppercase tracking-wider mb-3">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about this bet..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-mono focus:outline-none focus:border-holo-cyan transition-colors resize-none"
              rows={3}
            />
          </div>

          {/* Stake Amount */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-holo-cyan/10 to-transparent border border-holo-cyan/30">
            <label className="block text-sm font-mono text-holo-cyan uppercase tracking-wider mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Stake Amount (Everyone Must Bet This)
            </label>

            {/* Prediction Selection */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => setInitialPrediction("yes")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  initialPrediction === "yes"
                    ? "bg-toxic-green/30 border-toxic-green"
                    : "bg-white/5 border-white/10 hover:border-toxic-green/50"
                }`}
              >
                <TrendingUp className={`w-5 h-5 mx-auto mb-1 ${initialPrediction === "yes" ? "text-toxic-green" : "text-white/50"}`} />
                <div className={`text-sm font-mono font-bold ${initialPrediction === "yes" ? "text-toxic-green" : "text-white/70"}`}>
                  YES
                </div>
              </button>

              <button
                type="button"
                onClick={() => setInitialPrediction("no")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  initialPrediction === "no"
                    ? "bg-simp-red/30 border-simp-red"
                    : "bg-white/5 border-white/10 hover:border-simp-red/50"
                }`}
              >
                <TrendingDown className={`w-5 h-5 mx-auto mb-1 ${initialPrediction === "no" ? "text-simp-red" : "text-white/50"}`} />
                <div className={`text-sm font-mono font-bold ${initialPrediction === "no" ? "text-simp-red" : "text-white/70"}`}>
                  NO
                </div>
              </button>
            </div>

            {/* Amount Input */}
            <input
              type="number"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
              placeholder="Enter amount in CHF"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-lg focus:outline-none focus:border-holo-cyan transition-colors"
              min="1"
            />
            <div className="mt-2 text-xs text-white/50 font-mono">
              Everyone who joins this bet must bet exactly this amount
            </div>
          </div>

          {/* Deadline Input */}
          <div>
            <label className="block text-sm font-mono text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Days Until Deadline
            </label>
            <div className="flex gap-2">
              {[1, 3, 7, 14, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setDaysUntilDeadline(days.toString())}
                  className={`flex-1 px-3 py-2 rounded border transition-colors ${
                    daysUntilDeadline === days.toString()
                      ? "bg-toxic-green/30 border-toxic-green text-toxic-green"
                      : "bg-white/5 border-white/10 text-white/70 hover:border-toxic-green/50"
                  }`}
                >
                  <div className="text-sm font-mono font-bold">{days}d</div>
                </button>
              ))}
            </div>
            <input
              type="number"
              value={daysUntilDeadline}
              onChange={(e) => setDaysUntilDeadline(e.target.value)}
              min="1"
              max="365"
              className="w-full mt-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-holo-cyan transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-simp-red/20 border border-simp-red rounded text-sm text-simp-red font-mono">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/5 sticky bottom-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 font-mono uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <motion.button
              onClick={handleCreateBet}
              disabled={!targetUserId || !title.trim() || !initialAmount || loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-holo-cyan to-lust-pink hover:from-holo-cyan/80 hover:to-lust-pink/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-mono font-bold uppercase tracking-wider transition-all shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5" />
              {loading ? "Creating..." : `Create Bet (${initialAmount || 0} CHF)`}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
