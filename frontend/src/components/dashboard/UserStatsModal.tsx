"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { User, PartnerNode } from "@/types";
import { AnimatedTabs, TabContent } from "@/components/ui/animated-tabs";
import {
  X,
  Users,
  DollarSign,
  Heart,
  TrendingUp,
  Clock,
  AlertTriangle,
  Target,
  Skull,
  BarChart3,
  Zap,
  Award,
  TrendingDown,
} from "lucide-react";
import { useXP } from "@/hooks/useXP";
import { XPTransaction, Achievement } from "@/types/xp";

interface UserStatsModalProps {
  user: User | null;
  partners: PartnerNode[];
  isOpen: boolean;
  onClose: () => void;
}

interface UserStats {
  totalPartners: number;
  activePartners: number;
  graveyardCount: number;
  statusBreakdown: Record<string, number>;
  totalSpent: number;
  avgSpentPerPartner: number;
  totalHoursInvested: number;
  avgHoursPerPartner: number;
  avgIntimacyScore: number;
  highestIntimacyScore: number;
  avgSimpIndex: number;
  highestSimpIndex: number;
  lowestSimpIndex: number;
  totalDates: number;
  avgDatesPerPartner: number;
}

const calculateUserStats = (partners: PartnerNode[]): UserStats => {
  const activePartners = partners.filter(p => p.status !== "Graveyard");
  const graveyardPartners = partners.filter(p => p.status === "Graveyard");

  const statusBreakdown: Record<string, number> = {};
  partners.forEach(p => {
    statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1;
  });

  const totalSpent = partners.reduce((sum, p) => sum + (p.financial_total || 0), 0);
  const avgSpentPerPartner = activePartners.length > 0 ? totalSpent / activePartners.length : 0;

  const totalHoursInvested = partners.reduce((sum, p) => sum + (p.time_total || 0), 0);
  const avgHoursPerPartner = activePartners.length > 0 ? totalHoursInvested / activePartners.length : 0;

  const intimacyScores = activePartners.map(p => p.intimacy_score).filter(s => s > 0);
  const avgIntimacyScore = intimacyScores.length > 0
    ? intimacyScores.reduce((sum, s) => sum + s, 0) / intimacyScores.length
    : 0;
  const highestIntimacyScore = intimacyScores.length > 0 ? Math.max(...intimacyScores) : 0;

  const simpIndices = activePartners
    .map(p => p.simp_index)
    .filter((s): s is number => s !== undefined && s !== null && s > 0);

  const avgSimpIndex = simpIndices.length > 0
    ? simpIndices.reduce((sum, s) => sum + s, 0) / simpIndices.length
    : 0;
  const highestSimpIndex = simpIndices.length > 0 ? Math.max(...simpIndices) : 0;
  const lowestSimpIndex = simpIndices.length > 0 ? Math.min(...simpIndices) : 0;

  return {
    totalPartners: partners.length,
    activePartners: activePartners.length,
    graveyardCount: graveyardPartners.length,
    statusBreakdown,
    totalSpent,
    avgSpentPerPartner,
    totalHoursInvested,
    avgHoursPerPartner,
    avgIntimacyScore,
    highestIntimacyScore,
    avgSimpIndex,
    highestSimpIndex,
    lowestSimpIndex,
    totalDates: 0,
    avgDatesPerPartner: 0,
  };
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}> = ({ icon, label, value, subValue, color = "holo-cyan" }) => {
  const colorClass = {
    "holo-cyan": "text-holo-cyan border-holo-cyan/30",
    "simp-red": "text-simp-red border-simp-red/30",
    "lust-pink": "text-lust-pink border-lust-pink/30",
    "toxic-green": "text-toxic-green border-toxic-green/30",
    "yellow": "text-yellow-400 border-yellow-400/30",
  }[color] || "text-holo-cyan border-holo-cyan/30";

  return (
    <motion.div
      className={`relative p-4 border ${colorClass} bg-deep-void/50 backdrop-blur-sm rounded-lg hover:bg-deep-void/70 transition-all`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex items-start gap-3">
        <div className={`${colorClass.split(' ')[0]} mt-1`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            {label}
          </div>
          <div className={`text-2xl font-display font-bold ${colorClass.split(' ')[0]}`}>
            {value}
          </div>
          {subValue && (
            <div className="text-xs text-gray-500 mt-1">
              {subValue}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const OverviewContent: React.FC<{ user: User; stats: UserStats }> = ({ user, stats }) => {
  const xpForNextLevel = user.level * 1000;
  const xpProgress = (user.current_xp / xpForNextLevel) * 100;

  return (
    <div className="space-y-6">
      {/* XP Progress Section */}
      <div className="p-6 border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5 text-holo-cyan" />
          <h3 className="text-lg font-display font-bold text-white uppercase tracking-wider">
            Experience & Level
          </h3>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>Level {user.level} Progress</span>
          <span>{user.current_xp} / {xpForNextLevel} XP</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-holo-cyan to-lust-pink"
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Relationship Overview */}
      <div>
        <h3 className="text-lg font-display font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-holo-cyan" />
          Relationship Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Total Partners"
            value={stats.totalPartners}
            color="holo-cyan"
          />
          <StatCard
            icon={<Heart className="w-5 h-5" />}
            label="Active"
            value={stats.activePartners}
            color="lust-pink"
          />
          <StatCard
            icon={<Skull className="w-5 h-5" />}
            label="Graveyard"
            value={stats.graveyardCount}
            color="simp-red"
          />
        </div>

        {/* Status Breakdown */}
        {stats.totalPartners > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(stats.statusBreakdown)
              .filter(([status]) => status !== "Graveyard")
              .map(([status, count]) => (
                <div
                  key={status}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded text-xs"
                >
                  <span className="text-gray-400">{status}:</span>{" "}
                  <span className="text-white font-bold">{count}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

const FinancialsContent: React.FC<{ stats: UserStats }> = ({ stats }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-toxic-green" />
          Financial Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Total Spent"
            value={`$${stats.totalSpent.toFixed(2)}`}
            color="toxic-green"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Avg Per Partner"
            value={`$${stats.avgSpentPerPartner.toFixed(2)}`}
            color="toxic-green"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-display font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          Time Investment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Total Hours"
            value={stats.totalHoursInvested.toFixed(1)}
            subValue={`${(stats.totalHoursInvested / 24).toFixed(1)} days`}
            color="yellow"
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="Avg Hours/Partner"
            value={stats.avgHoursPerPartner.toFixed(1)}
            color="yellow"
          />
        </div>
      </div>
    </div>
  );
};

const PerformanceContent: React.FC<{ stats: UserStats }> = ({ stats }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-lust-pink" />
          Intimacy & Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            icon={<Heart className="w-5 h-5" />}
            label="Avg Intimacy"
            value={stats.avgIntimacyScore.toFixed(1)}
            subValue="out of 10"
            color="lust-pink"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Highest Intimacy"
            value={stats.highestIntimacyScore.toFixed(1)}
            color="lust-pink"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-display font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-simp-red" />
          Simp Index Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Average"
            value={stats.avgSimpIndex.toFixed(1)}
            color="yellow"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Highest"
            value={stats.highestSimpIndex.toFixed(1)}
            color="simp-red"
          />
          <StatCard
            icon={<Heart className="w-5 h-5" />}
            label="Lowest"
            value={stats.lowestSimpIndex.toFixed(1)}
            color="toxic-green"
          />
        </div>
        <div className="mt-4 p-4 bg-deep-void/50 border border-simp-red/30 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">Simp Index Formula:</div>
          <div className="font-mono text-sm text-simp-red">
            (Money Spent + Hours × $20) / Intimacy Score
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Lower is better. Track your efficiency across all relationships.
          </div>
        </div>
      </div>
    </div>
  );
};

const XPHistoryContent: React.FC<{ xpHistory: XPTransaction[] }> = ({ xpHistory }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-display font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-holo-cyan" />
        XP Transaction History
      </h3>

      {xpHistory.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No XP transactions yet. Start earning XP by updating your relationships!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {xpHistory.map((transaction) => (
            <motion.div
              key={transaction.id}
              className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`font-bold font-display ${
                        transaction.amount > 0 ? "text-holo-cyan" : "text-simp-red"
                      }`}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount} XP
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-gray-400 uppercase font-mono">
                      {transaction.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {transaction.reason.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-mono">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-600 font-mono">
                    {new Date(transaction.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const AchievementsContent: React.FC<{ achievements: Achievement[] }> = ({ achievements }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-display font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-yellow-400" />
        Achievements Unlocked
      </h3>

      {achievements.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No achievements unlocked yet. Keep tracking your relationships to unlock achievements!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              className="p-4 bg-gradient-to-br from-white/10 to-white/5 border-2 border-yellow-400/30 rounded-lg hover:border-yellow-400/50 transition-all"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-display font-bold text-white mb-1">
                    {achievement.achievement_name}
                  </h4>
                  <p className="text-sm text-gray-400 mb-2">
                    {achievement.achievement_description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-holo-cyan">
                      +{achievement.xp_reward} XP
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      {new Date(achievement.unlocked_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const TABS = [
  { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "financials", label: "Financials", icon: <DollarSign className="w-4 h-4" /> },
  { id: "performance", label: "Performance", icon: <Target className="w-4 h-4" /> },
  { id: "xp", label: "XP History", icon: <Zap className="w-4 h-4" /> },
  { id: "achievements", label: "Achievements", icon: <Award className="w-4 h-4" /> },
];

export const UserStatsModal: React.FC<UserStatsModalProps> = ({
  user,
  partners,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const { xpHistory, achievements, loadXPHistory, loadAchievements } = useXP();

  useEffect(() => {
    if (isOpen && user) {
      loadXPHistory();
      loadAchievements();
    }
  }, [isOpen, user]);

  if (!user) return null;

  // Filter partners to only show those belonging to this user
  const userPartners = partners.filter(partner => partner.user_id === user.id);
  const stats = calculateUserStats(userPartners);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>

            {/* Modal Content */}
            <Dialog.Content asChild>
              <motion.div
                className="fixed left-1/2 top-1/2 z-[110] w-[95vw] max-w-7xl h-[90vh] bg-deep-space border border-white/20 shadow-2xl overflow-hidden rounded-lg"
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
                      Command Center
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-white/50 font-mono mt-2">
                      {user.username} • Level {user.level} • {stats.totalPartners} Partners
                    </Dialog.Description>
                  </div>

                  <div className="flex items-center gap-3">
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
                </div>

                {/* Tabs & Content */}
                <div className="h-[calc(90vh-120px)] overflow-y-auto p-6">
                  <AnimatedTabs
                    tabs={TABS}
                    value={activeTab}
                    onValueChange={setActiveTab}
                  >
                    <TabContent value="overview">
                      <OverviewContent user={user} stats={stats} />
                    </TabContent>
                    <TabContent value="financials">
                      <FinancialsContent stats={stats} />
                    </TabContent>
                    <TabContent value="performance">
                      <PerformanceContent stats={stats} />
                    </TabContent>
                    <TabContent value="xp">
                      <XPHistoryContent xpHistory={xpHistory} />
                    </TabContent>
                    <TabContent value="achievements">
                      <AchievementsContent achievements={achievements} />
                    </TabContent>
                  </AnimatedTabs>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};
