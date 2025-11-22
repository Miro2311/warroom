"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  ArrowRight,
  Check,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getGroupSettlements, markSettlementAsPaid } from "@/services/bettingService";

interface SettlementsTabProps {
  groupId: string;
}

export const SettlementsTab: React.FC<SettlementsTabProps> = ({ groupId }) => {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  useEffect(() => {
    if (groupId) {
      loadSettlements();
    }
  }, [groupId]);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      const data = await getGroupSettlements(groupId);
      setSettlements(data);
    } catch (error) {
      console.error("Error loading settlements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (settlementId: string) => {
    try {
      setMarking(settlementId);
      await markSettlementAsPaid(settlementId);
      await loadSettlements(); // Reload to update UI
    } catch (error) {
      console.error("Error marking as paid:", error);
    } finally {
      setMarking(null);
    }
  };

  // Separate settlements into what I owe and what I'm owed
  const iOwe = settlements.filter((s) => s.payer_id === user?.id);
  const owedToMe = settlements.filter((s) => s.receiver_id === user?.id);
  const others = settlements.filter(
    (s) => s.payer_id !== user?.id && s.receiver_id !== user?.id
  );

  const totalIOwn = iOwe.reduce((sum, s) => sum + s.amount, 0);
  const totalOwedToMe = owedToMe.reduce((sum, s) => sum + s.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/50 font-mono">Loading settlements...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-display font-bold text-white uppercase flex items-center gap-2">
          <Banknote className="w-6 h-6 text-holo-cyan" />
          Settlements
        </h3>
        <p className="text-sm text-white/50 font-mono">
          Who owes who - settle via Twint
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-simp-red/10 border border-simp-red/30">
          <div className="text-xs text-white/50 font-mono uppercase mb-1">
            You Owe
          </div>
          <div className="text-2xl font-mono font-bold text-simp-red">
            {totalIOwn} CHF
          </div>
          <div className="text-xs text-white/50 font-mono mt-1">
            {iOwe.length} payment{iOwe.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-toxic-green/10 border border-toxic-green/30">
          <div className="text-xs text-white/50 font-mono uppercase mb-1">
            Owed to You
          </div>
          <div className="text-2xl font-mono font-bold text-toxic-green">
            {totalOwedToMe} CHF
          </div>
          <div className="text-xs text-white/50 font-mono mt-1">
            {owedToMe.length} payment{owedToMe.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* My Debts */}
      {iOwe.length > 0 && (
        <motion.div
          className="p-6 rounded-lg bg-simp-red/5 border border-simp-red/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-simp-red" />
            <h4 className="text-sm font-mono text-simp-red uppercase tracking-wider">
              You Need to Pay
            </h4>
          </div>

          <div className="space-y-3">
            {iOwe.map((settlement, index) => (
              <motion.div
                key={settlement.id}
                className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-simp-red/30"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-white/50" />
                    <span className="text-xs text-white/50 font-mono">
                      {settlement.bet?.title || "Bet"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-display font-bold text-white">
                      Pay to {settlement.receiver?.username}
                    </span>
                  </div>
                </div>

                <ArrowRight className="w-5 h-5 text-simp-red" />

                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-simp-red">
                    {settlement.amount} CHF
                  </div>
                  <div className="text-xs text-white/50 font-mono mt-1">
                    via Twint
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Owed to Me */}
      {owedToMe.length > 0 && (
        <motion.div
          className="p-6 rounded-lg bg-toxic-green/5 border border-toxic-green/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Banknote className="w-5 h-5 text-toxic-green" />
            <h4 className="text-sm font-mono text-toxic-green uppercase tracking-wider">
              Waiting for Payment
            </h4>
          </div>

          <div className="space-y-3">
            {owedToMe.map((settlement, index) => (
              <motion.div
                key={settlement.id}
                className="p-4 rounded-lg bg-white/5 border border-toxic-green/30"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-white/50" />
                      <span className="text-xs text-white/50 font-mono">
                        {settlement.bet?.title || "Bet"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-display font-bold text-white">
                        {settlement.payer?.username} owes you
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-toxic-green" />

                  <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-toxic-green">
                      {settlement.amount} CHF
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={() => handleMarkAsPaid(settlement.id)}
                  disabled={marking === settlement.id}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-toxic-green/20 hover:bg-toxic-green/30 disabled:opacity-50 border border-toxic-green text-toxic-green font-mono text-sm uppercase rounded transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Check className="w-4 h-4" />
                  {marking === settlement.id
                    ? "Marking..."
                    : "Mark as Received"}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Other Settlements in Group */}
      {others.length > 0 && (
        <motion.div
          className="p-6 rounded-lg bg-white/5 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Banknote className="w-5 h-5 text-holo-cyan" />
            <h4 className="text-sm font-mono text-white/50 uppercase tracking-wider">
              Other Settlements
            </h4>
          </div>

          <div className="space-y-3">
            {others.map((settlement, index) => (
              <motion.div
                key={settlement.id}
                className="flex items-center gap-3 p-3 rounded bg-white/5 border border-white/10"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <div className="flex-1">
                  <div className="text-xs text-white/50 font-mono mb-1">
                    {settlement.bet?.title || "Bet"}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-display font-bold text-white">
                      {settlement.payer?.username}
                    </span>
                    <ArrowRight className="w-4 h-4 text-white/50" />
                    <span className="text-sm font-display font-bold text-white">
                      {settlement.receiver?.username}
                    </span>
                  </div>
                </div>

                <div className="text-lg font-mono font-bold text-holo-cyan">
                  {settlement.amount} CHF
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No Settlements */}
      {settlements.length === 0 && (
        <div className="text-center py-12">
          <Banknote className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <div className="text-white/50 font-mono text-sm">
            No pending settlements
          </div>
          <div className="text-white/30 font-mono text-xs mt-2">
            All debts are settled!
          </div>
        </div>
      )}
    </div>
  );
};
