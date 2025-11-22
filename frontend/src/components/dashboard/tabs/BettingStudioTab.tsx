"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Coins,
  TrendingUp,
  TrendingDown,
  Plus,
  Vote,
  Zap,
  Clock,
  Users,
  DollarSign,
  Target,
  Check,
  X,
  Crown,
  AlertTriangle,
  Banknote,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/ui/stat-card";
import { AnimatedBadge } from "@/components/ui/animated-badge";
import { PlaceBetModal } from "./PlaceBetModal";
import { CreateBetModal } from "./CreateBetModal";
import { ResolveBetModal } from "./ResolveBetModal";
import { SettlementsTab } from "./SettlementsTab";
import type { Bet, BetMaster, Wager, User } from "@/types";
import {
  getBetMaster,
  getBets,
  getUserBalance,
  getUserWagers,
  getBetMasterVotes,
  voteForBetMaster,
  electBetMaster,
  getGroupLeaderboard,
  getWagers,
} from "@/services/bettingService";
import { supabase } from "@/lib/supabase";

interface BettingStudioTabProps {
  groupId: string;
  groupMembers?: User[];
}

export const BettingStudioTab: React.FC<BettingStudioTabProps> = ({
  groupId,
  groupMembers = [],
}) => {
  const { user } = useAuth();
  const [betMaster, setBetMaster] = useState<BetMaster | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [userWagers, setUserWagers] = useState<Wager[]>([]);
  const [userBalance, setUserBalance] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [betWagers, setBetWagers] = useState<Map<string, Wager[]>>(new Map());
  const [loading, setLoading] = useState(true);

  // Voting state
  const [showVoting, setShowVoting] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [voteResults, setVoteResults] = useState<Map<string, number>>(new Map());

  // Bet creation state
  const [showCreateBet, setShowCreateBet] = useState(false);

  // Place bet modal state
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);

  // Resolve bet modal state
  const [resolvingBet, setResolvingBet] = useState<Bet | null>(null);

  // Tab switcher state
  const [activeView, setActiveView] = useState<"bets" | "settlements">("bets");

  useEffect(() => {
    if (groupId && user) {
      loadAllData();
    }
  }, [groupId, user]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadBetMaster(),
        loadBets(),
        loadUserData(),
        loadLeaderboard(),
      ]);
    } catch (error) {
      console.error("Error loading betting data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBetMaster = async () => {
    try {
      const master = await getBetMaster(groupId);
      setBetMaster(master);

      if (!master) {
        // No bet master yet, show voting
        setShowVoting(true);
        const votes = await getBetMasterVotes(groupId);
        const results = new Map<string, number>();
        votes.forEach((vote) => {
          results.set(vote.candidate_id, (results.get(vote.candidate_id) || 0) + 1);
        });
        setVoteResults(results);
      }
    } catch (error: any) {
      // Silently handle table not existing yet
      if (error?.code === '42P01' || error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
        console.warn("Betting tables not yet created. Please run DATABASE-BETTING-STUDIO.sql");
        setShowVoting(true); // Show voting UI anyway
      } else {
        console.error("Error loading bet master:", error);
      }
    }
  };

  const loadBets = async () => {
    try {
      const allBets = await getBets(groupId);
      setBets(allBets);

      // Load wagers for each bet
      await loadBetWagers(allBets);
    } catch (error: any) {
      // Silently handle table not existing yet
      if (error?.code === '42P01' || error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
        console.warn("Betting tables not yet created. Please run DATABASE-BETTING-STUDIO.sql");
      } else {
        console.error("Error loading bets:", error);
      }
    }
  };

  const loadBetWagers = async (betsToLoad: Bet[]) => {
    try {
      const wagersMap = new Map<string, Wager[]>();

      for (const bet of betsToLoad) {
        const wagers = await getWagers(bet.id);
        // Fetch user data for each wager
        const wagersWithUsers = await Promise.all(
          wagers.map(async (wager) => {
            const { data: userData } = await supabase
              .from("users")
              .select("id, username, avatar_url, level, current_xp, created_at, streak_count, last_activity_date, total_xp_earned, bet_currency")
              .eq("id", wager.user_id)
              .single();

            return {
              ...wager,
              user: userData || undefined,
            };
          })
        );
        wagersMap.set(bet.id, wagersWithUsers);
      }

      setBetWagers(wagersMap);
    } catch (error) {
      console.error("Error loading bet wagers:", error);
    }
  };

  const loadUserData = async () => {
    if (!user) return;

    try {
      const [balance, wagers] = await Promise.all([
        getUserBalance(user.id),
        getUserWagers(user.id),
      ]);

      setUserBalance(balance);
      setUserWagers(wagers);
    } catch (error: any) {
      // Silently handle table not existing yet
      if (error?.code === '42P01' || error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
        console.warn("Betting tables not yet created. Please run DATABASE-BETTING-STUDIO.sql");
        setUserBalance(1000); // Default starting balance
      } else {
        console.error("Error loading user data:", error);
      }
    }
  };

  const loadLeaderboard = async () => {
    try {
      const leaders = await getGroupLeaderboard(groupId, 5);
      setLeaderboard(leaders);
    } catch (error: any) {
      console.error("Error loading leaderboard:", error);
      setLeaderboard([]);
    }
  };

  const handleVote = async (candidateId: string) => {
    if (!user) return;

    try {
      await voteForBetMaster(groupId, candidateId);
      setSelectedCandidate(candidateId);

      // Reload votes
      const votes = await getBetMasterVotes(groupId);
      const results = new Map<string, number>();
      votes.forEach((vote) => {
        results.set(vote.candidate_id, (results.get(vote.candidate_id) || 0) + 1);
      });
      setVoteResults(results);

      // Check if we should elect/change bet master
      if (results.size > 0) {
        const maxVotes = Math.max(...Array.from(results.values()));
        const winnerId = Array.from(results.entries()).find(
          ([_, count]) => count === maxVotes
        )?.[0];

        if (winnerId) {
          // If there's already a bet master, require unanimous vote
          if (betMaster) {
            const totalMembers = groupMembers.length;
            if (maxVotes === totalMembers && winnerId !== betMaster.user_id) {
              // Everyone voted and all agree on someone new
              await electBetMaster(groupId, winnerId);
              await loadBetMaster();
              setShowVoting(false);
            }
          } else {
            // No bet master yet, elect the one with most votes
            if (maxVotes > 0) {
              await electBetMaster(groupId, winnerId);
              await loadBetMaster();
              setShowVoting(false);
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Error voting:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        error: error
      });
    }
  };

  const activeBets = bets.filter((b) => b.status === "open");
  const resolvedBets = bets.filter((b) => b.status === "resolved");
  const wonWagers = userWagers.filter((w) => w.status === "won");
  const lostWagers = userWagers.filter((w) => w.status === "lost");
  const totalWon = wonWagers.reduce((sum, w) => sum + (w.payout_amount || 0), 0);
  const totalLost = lostWagers.reduce((sum, w) => sum + w.amount, 0);

  const getRelativeTime = (timestamp: string) => {
    const diff = new Date(timestamp).getTime() - Date.now();
    if (diff < 0) return "Ended";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h left`;
    const days = Math.floor(hours / 24);
    return `${days}d left`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "first_date":
        return "text-lust-pink";
      case "kiss":
        return "text-holo-cyan";
      case "sex":
        return "text-simp-red";
      case "relationship":
        return "text-toxic-green";
      default:
        return "text-white";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/50 font-mono">Loading betting studio...</div>
      </div>
    );
  }

  // Check if betting system is set up
  const needsSetup = !betMaster && !loading && groupMembers.length > 0 && showVoting;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-display font-bold text-white uppercase flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Betting Studio
          </h3>
          <p className="text-sm text-white/50 font-mono">
            Place bets, beat the odds, dominate the board
          </p>
        </div>
        {betMaster && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-400/20 border border-yellow-400/50 rounded">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-mono text-yellow-400 uppercase">
                Bet Master: {betMaster.user?.username || "Unknown"}
              </span>
            </div>
            <motion.button
              onClick={() => setShowVoting(true)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded text-xs font-mono text-white/70 hover:text-white uppercase transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Change Bet Master
            </motion.button>
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveView("bets")}
          className={`flex items-center gap-2 px-4 py-3 font-mono text-sm uppercase tracking-wider transition-all ${
            activeView === "bets"
              ? "text-holo-cyan border-b-2 border-holo-cyan"
              : "text-white/50 hover:text-white/70"
          }`}
        >
          <Trophy className="w-4 h-4" />
          Bets
        </button>
        <button
          onClick={() => setActiveView("settlements")}
          className={`flex items-center gap-2 px-4 py-3 font-mono text-sm uppercase tracking-wider transition-all ${
            activeView === "settlements"
              ? "text-holo-cyan border-b-2 border-holo-cyan"
              : "text-white/50 hover:text-white/70"
          }`}
        >
          <Banknote className="w-4 h-4" />
          Settlements
        </button>
      </div>

      {/* Bets View */}
      {activeView === "bets" && (
        <>
      {/* Bet Master Voting */}
      <AnimatePresence>
        {showVoting && (
          <motion.div
            className="p-6 rounded-lg bg-gradient-to-br from-yellow-400/10 to-transparent border border-yellow-400/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Vote className="w-6 h-6 text-yellow-400" />
                <div>
                  <h4 className="text-lg font-display font-bold text-yellow-400 uppercase">
                    {betMaster ? "Change Bet Master" : "Elect Bet Master"}
                  </h4>
                  <p className="text-sm text-white/70 font-mono">
                    {betMaster
                      ? "Everyone must agree to change (unanimous vote required)"
                      : "Vote for who will resolve and confirm bet outcomes"}
                  </p>
                </div>
              </div>
              {betMaster && (
                <button
                  onClick={() => setShowVoting(false)}
                  className="p-2 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-white/50" />
                </button>
              )}
            </div>

            {betMaster && (
              <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono text-white/70">
                    Votes Required for Change
                  </span>
                  <span className="text-lg font-mono font-bold text-yellow-400">
                    {Array.from(voteResults.values()).reduce((a, b) => Math.max(a, b), 0)} / {groupMembers.length}
                  </span>
                </div>
                {Array.from(voteResults.values()).reduce((a, b) => Math.max(a, b), 0) === groupMembers.length && (
                  <div className="mt-2 text-xs text-toxic-green font-mono">
                    ✓ Unanimous! Bet Master will change automatically
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {groupMembers.map((member) => (
                <motion.button
                  key={member.id}
                  onClick={() => handleVote(member.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedCandidate === member.id
                      ? "bg-yellow-400/30 border-yellow-400"
                      : "bg-white/5 border-white/10 hover:border-yellow-400/50"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-lust-pink flex items-center justify-center text-sm font-bold text-black">
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
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-mono font-bold text-yellow-400">
                        {voteResults.get(member.id) || 0}
                      </span>
                      {selectedCandidate === member.id && (
                        <Check className="w-5 h-5 text-yellow-400" />
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Bet Button */}
      <div className="flex gap-4">
        <motion.button
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-holo-cyan/20 hover:bg-holo-cyan/30 border border-holo-cyan text-holo-cyan font-mono text-sm uppercase tracking-wider rounded transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateBet(!showCreateBet)}
        >
          <Plus className="w-4 h-4" />
          Create Custom Bet
        </motion.button>
      </div>

      {/* Active Bets */}
      <motion.div
        className="p-6 rounded-lg bg-white/5 border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-holo-cyan" />
            <h4 className="text-sm font-mono text-white/50 uppercase tracking-wider">
              Active Bets
            </h4>
          </div>
          <AnimatedBadge variant="warning">{activeBets.length} Open</AnimatedBadge>
        </div>

        <div className="space-y-4">
          {activeBets.length === 0 ? (
            <div className="text-center py-8 text-white/50 font-mono text-sm">
              No active bets. Create one to get started!
            </div>
          ) : (
            activeBets.map((bet, index) => (
              <motion.div
                key={bet.id}
                className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-holo-cyan/50 transition-colors cursor-pointer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {bet.bet_type === "system" && (
                        <AnimatedBadge variant="default" size="sm">
                          System
                        </AnimatedBadge>
                      )}
                      <span className={`text-xs font-mono uppercase ${getCategoryColor(bet.category)}`}>
                        {bet.category.replace("_", " ")}
                      </span>
                    </div>
                    <h5 className="text-base font-display font-bold text-white mb-1">
                      {bet.title}
                    </h5>
                    {bet.description && (
                      <p className="text-sm text-white/70">{bet.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-xs text-white/50 font-mono">
                        <Target className="w-3 h-3" />
                        {bet.target_user?.username || "Unknown"}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-white/50 font-mono">
                        <Clock className="w-3 h-3" />
                        {getRelativeTime(bet.deadline)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-holo-cyan mb-1">
                      {bet.stake_amount} CHF
                    </div>
                    <div className="text-xs text-white/50 font-mono">Stake Amount</div>
                    <div className="text-sm font-mono text-toxic-green mt-1">
                      Pot: {betWagers.has(bet.id)
                        ? betWagers.get(bet.id)!.reduce((sum, w) => sum + w.amount, 0)
                        : 0} CHF
                    </div>
                  </div>
                </div>

                {/* Participants */}
                {betWagers.has(bet.id) && betWagers.get(bet.id)!.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-xs text-white/50 font-mono uppercase mb-2">
                      Participants ({betWagers.get(bet.id)!.length})
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {/* YES side */}
                      <div className="p-3 rounded-lg bg-toxic-green/10 border border-toxic-green/30">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-3 h-3 text-toxic-green" />
                          <span className="text-xs font-mono font-bold text-toxic-green uppercase">
                            YES
                          </span>
                        </div>
                        <div className="space-y-1">
                          {betWagers
                            .get(bet.id)!
                            .filter((w) => w.prediction?.outcome === "yes")
                            .map((wager) => (
                              <div
                                key={wager.id}
                                className="flex items-center gap-2 text-xs"
                              >
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-toxic-green to-holo-cyan flex items-center justify-center text-[10px] font-bold text-black">
                                  {wager.user?.username?.charAt(0).toUpperCase() || "?"}
                                </div>
                                <span className="text-white/70 font-mono">
                                  {wager.user?.username || "Unknown"}
                                </span>
                              </div>
                            ))}
                          {betWagers
                            .get(bet.id)!
                            .filter((w) => w.prediction?.outcome === "yes").length === 0 && (
                            <div className="text-xs text-white/30 font-mono italic">
                              No bets yet
                            </div>
                          )}
                        </div>
                      </div>

                      {/* NO side */}
                      <div className="p-3 rounded-lg bg-simp-red/10 border border-simp-red/30">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown className="w-3 h-3 text-simp-red" />
                          <span className="text-xs font-mono font-bold text-simp-red uppercase">
                            NO
                          </span>
                        </div>
                        <div className="space-y-1">
                          {betWagers
                            .get(bet.id)!
                            .filter((w) => w.prediction?.outcome === "no")
                            .map((wager) => (
                              <div
                                key={wager.id}
                                className="flex items-center gap-2 text-xs"
                              >
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-simp-red to-lust-pink flex items-center justify-center text-[10px] font-bold text-black">
                                  {wager.user?.username?.charAt(0).toUpperCase() || "?"}
                                </div>
                                <span className="text-white/70 font-mono">
                                  {wager.user?.username || "Unknown"}
                                </span>
                              </div>
                            ))}
                          {betWagers
                            .get(bet.id)!
                            .filter((w) => w.prediction?.outcome === "no").length === 0 && (
                            <div className="text-xs text-white/30 font-mono italic">
                              No bets yet
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <motion.button
                    onClick={() => setSelectedBet(bet)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-holo-cyan/20 hover:bg-holo-cyan/30 border border-holo-cyan text-holo-cyan font-mono text-xs uppercase rounded transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <DollarSign className="w-3 h-3" />
                    Place Bet
                  </motion.button>

                  {/* Resolve button only for Bet Master */}
                  {betMaster && user && betMaster.user_id === user.id && (
                    <motion.button
                      onClick={() => setResolvingBet(bet)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400 text-yellow-400 font-mono text-xs uppercase rounded transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Check className="w-3 h-3" />
                      Resolve
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* My Wagers */}
      <motion.div
        className="p-6 rounded-lg bg-white/5 border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-5 h-5 text-lust-pink" />
          <h4 className="text-sm font-mono text-white/50 uppercase tracking-wider">
            My Wagers
          </h4>
        </div>

        <div className="space-y-3">
          {userWagers.length === 0 ? (
            <div className="text-center py-8 text-white/50 font-mono text-sm">
              No wagers yet. Place your first bet above!
            </div>
          ) : (
            userWagers.slice(0, 5).map((wager, index) => (
              <motion.div
                key={wager.id}
                className="flex items-center justify-between p-3 rounded bg-white/5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <div className="flex-1">
                  <div className="text-sm font-display font-bold text-white mb-1">
                    {wager.bet?.title || "Unknown Bet"}
                  </div>
                  <div className="flex items-center gap-2">
                    <AnimatedBadge
                      variant={
                        wager.status === "won"
                          ? "success"
                          : wager.status === "lost"
                          ? "danger"
                          : "default"
                      }
                      size="sm"
                    >
                      {wager.status}
                    </AnimatedBadge>
                    <span className="text-xs text-white/50 font-mono">
                      ${wager.amount} @ {wager.odds_at_placement}x
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {wager.status === "won" && (
                    <div className="text-lg font-mono font-bold text-toxic-green">
                      +${wager.payout_amount}
                    </div>
                  )}
                  {wager.status === "lost" && (
                    <div className="text-lg font-mono font-bold text-simp-red">
                      -${wager.amount}
                    </div>
                  )}
                  {wager.status === "active" && (
                    <div className="text-sm font-mono text-white/50">
                      Potential: ${wager.potential_payout}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Leaderboard */}
      <motion.div
        className="p-6 rounded-lg bg-gradient-to-br from-yellow-400/10 to-transparent border border-yellow-400/30"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h5 className="text-lg font-display font-bold text-yellow-400 uppercase">
            Leaderboard
          </h5>
        </div>

        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-white/50 font-mono text-sm">
              No betting activity yet
            </div>
          ) : (
            leaderboard.map((leader, index) => (
              <motion.div
                key={leader.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-lust-pink font-mono font-bold text-black text-sm">
                  {index + 1}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="text-sm font-display font-bold text-white">
                    {leader.username}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-white/50 font-mono">
                      {leader.totalBets} bets
                    </span>
                    <span className="text-xs text-white/50 font-mono">
                      {leader.winRate}% win rate
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-toxic-green">
                    ${leader.bet_currency}
                  </div>
                  <div className={`text-xs font-mono ${leader.netProfit >= 0 ? "text-toxic-green" : "text-simp-red"}`}>
                    {leader.netProfit >= 0 ? "+" : ""}${leader.netProfit}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
        </>
      )}

      {/* Settlements View */}
      {activeView === "settlements" && (
        <SettlementsTab groupId={groupId} />
      )}

      {/* Place Bet Modal */}
      {selectedBet && (
        <PlaceBetModal
          bet={selectedBet}
          userBalance={userBalance}
          onClose={() => setSelectedBet(null)}
          onSuccess={() => {
            loadAllData();
          }}
        />
      )}

      {/* Create Bet Modal */}
      {showCreateBet && (
        <CreateBetModal
          groupId={groupId}
          groupMembers={groupMembers}
          onClose={() => setShowCreateBet(false)}
          onSuccess={() => {
            loadAllData();
          }}
        />
      )}

      {/* Resolve Bet Modal */}
      {resolvingBet && (
        <ResolveBetModal
          bet={resolvingBet}
          onClose={() => setResolvingBet(null)}
          onSuccess={() => {
            loadAllData();
          }}
        />
      )}
    </div>
  );
};
