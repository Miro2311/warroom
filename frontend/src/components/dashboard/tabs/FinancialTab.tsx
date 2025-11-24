"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { PartnerNode, TimelineEvent, EventCategory } from "@/types";
import { StatCard } from "@/components/ui/stat-card";
import { MetricDisplay } from "@/components/ui/metric-display";
import { AnimatedBadge } from "@/components/ui/animated-badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  PieChart,
  Receipt,
  CreditCard,
  Wallet,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { syncTimelineEvent, syncDeleteTimelineEvent } from "@/lib/partnerSync";

interface FinancialTabProps {
  partner: PartnerNode;
}

const CATEGORY_COLORS: Record<EventCategory, { text: string; bg: string; border: string }> = {
  Dining: { text: "text-yellow-400", bg: "bg-yellow-400/20", border: "border-yellow-400/40" },
  Entertainment: { text: "text-lust-pink", bg: "bg-lust-pink/20", border: "border-lust-pink/40" },
  Gifts: { text: "text-holo-cyan", bg: "bg-holo-cyan/20", border: "border-holo-cyan/40" },
  Travel: { text: "text-toxic-green", bg: "bg-toxic-green/20", border: "border-toxic-green/40" },
  Shopping: { text: "text-purple-400", bg: "bg-purple-400/20", border: "border-purple-400/40" },
  Activities: { text: "text-orange-400", bg: "bg-orange-400/20", border: "border-orange-400/40" },
  Other: { text: "text-white/50", bg: "bg-white/5", border: "border-white/10" },
};

const CATEGORIES: EventCategory[] = ["Dining", "Entertainment", "Gifts", "Travel", "Shopping", "Activities", "Other"];

export const FinancialTab: React.FC<FinancialTabProps> = ({ partner }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | "all">("all");
  const [newEvent, setNewEvent] = useState({
    amount: "",
    category: "Dining" as EventCategory,
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load financial events (expenses and dates with amounts) from database
  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner.id]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("timeline_events")
        .select("*")
        .eq("partner_id", partner.id)
        .in("event_type", ["expense", "date"])
        .not("amount", "is", null)
        .order("event_date", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error loading financial events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.amount || !newEvent.title) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from("timeline_events")
        .insert({
          partner_id: partner.id,
          event_type: "expense",
          title: newEvent.title,
          description: newEvent.description,
          amount: parseFloat(newEvent.amount),
          category: newEvent.category,
          event_date: newEvent.date,
        })
        .select()
        .single();

      if (error) throw error;

      // Sync to all matching partners in other groups
      await syncTimelineEvent(partner.id, {
        event_type: "expense",
        title: newEvent.title,
        description: newEvent.description || null,
        event_date: newEvent.date,
        amount: parseFloat(newEvent.amount),
        category: newEvent.category,
      });

      setEvents([data, ...events]);
      setShowAddForm(false);
      setNewEvent({
        amount: "",
        category: "Dining",
        title: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });

      // Reload partner data to get updated financial_total
      window.location.reload();
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      // Get the event data before deleting (for sync)
      const eventToDelete = events.find(e => e.id === id);

      const { error } = await supabase
        .from("timeline_events")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Sync delete to all matching partners
      if (eventToDelete) {
        await syncDeleteTimelineEvent(partner.id, {
          title: eventToDelete.title,
          event_date: eventToDelete.event_date,
          event_type: eventToDelete.event_type,
        });
      }

      setEvents(events.filter((e) => e.id !== id));

      // Reload partner data to get updated financial_total
      window.location.reload();
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  // Calculate totals from events (your spending - her spending = net)
  const yourTotal = events.reduce((sum, e) => sum + (e.amount || 0), 0);
  const herTotal = events.reduce((sum, e) => sum + (e.partner_amount || 0), 0);
  const netTotal = yourTotal - herTotal; // Can be negative if she spent more

  // Calculate expense breakdown by category
  const expensesByCategory = CATEGORIES.map((category) => {
    const categoryEvents = events.filter((e) => e.category === category);
    const amount = categoryEvents.reduce((sum, e) => sum + (e.amount || 0), 0);
    const partnerAmount = categoryEvents.reduce((sum, e) => sum + (e.partner_amount || 0), 0);
    const netAmount = amount - partnerAmount;
    const percentage = Math.abs(netTotal) > 0 ? (Math.abs(netAmount) / Math.abs(netTotal)) * 100 : 0;

    return {
      category,
      amount: netAmount,
      yourAmount: amount,
      herAmount: partnerAmount,
      percentage,
      ...CATEGORY_COLORS[category],
    };
  }).filter((exp) => exp.yourAmount > 0 || exp.herAmount > 0);

  const roi = netTotal / Math.max(partner.intimacy_score, 1);
  const monthlyBurn =
    netTotal /
    Math.max(
      Math.floor(
        (Date.now() - new Date(partner.created_at).getTime()) /
          (1000 * 60 * 60 * 24 * 30)
      ),
      1
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-display font-bold text-white uppercase">
            Financial Ledger
          </h3>
          <p className="text-sm text-white/50 font-mono">
            Transaction-based expense tracking
          </p>
        </div>
        <motion.button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Add Transaction button clicked');
            setShowAddForm(true);
          }}
          className="px-4 py-2 bg-holo-cyan text-black font-display font-bold rounded flex items-center gap-2 hover:bg-holo-cyan/80 transition-colors cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "tween", duration: 0.2 }}
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </motion.button>
      </div>

      {/* Add Transaction Modal - Using Portal */}
      {mounted && showAddForm && createPortal(
        <AnimatePresence>
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              className="bg-deep-space border border-white/20 rounded-lg p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-display font-bold text-white">
                  Add Expense
                </h4>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-white/50 uppercase tracking-wider">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, title: e.target.value })
                    }
                    className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded text-white font-mono focus:outline-none focus:border-holo-cyan transition-colors"
                    placeholder="e.g. Dinner at restaurant"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-white/50 uppercase tracking-wider">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newEvent.amount}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, amount: e.target.value })
                    }
                    className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded text-white font-mono focus:outline-none focus:border-holo-cyan transition-colors"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-white/50 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={newEvent.category}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        category: e.target.value as EventCategory,
                      })
                    }
                    className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded text-white font-display focus:outline-none focus:border-holo-cyan transition-colors"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-white/50 uppercase tracking-wider">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        description: e.target.value,
                      })
                    }
                    className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded text-white font-mono focus:outline-none focus:border-holo-cyan transition-colors"
                    placeholder="Additional details"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-white/50 uppercase tracking-wider">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, date: e.target.value })
                    }
                    className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded text-white font-mono focus:outline-none focus:border-holo-cyan transition-colors"
                  />
                </div>

                <motion.button
                  onClick={handleAddEvent}
                  className="w-full py-3 bg-holo-cyan text-black font-display font-bold rounded hover:bg-holo-cyan/80 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "tween", duration: 0.2 }}
                >
                  Add Expense
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Top Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Your Spending"
          value={<MetricDisplay value={yourTotal} prefix="$" decimals={2} />}
          subtitle="total spent by you"
          icon={<Wallet className="w-5 h-5" />}
          variant="default"
        />
        <StatCard
          title="Her Spending"
          value={<MetricDisplay value={herTotal} prefix="$" decimals={2} />}
          subtitle="gifts & paid dates"
          icon={<Wallet className="w-5 h-5" />}
          variant="success"
        />
        <StatCard
          title="Net Balance"
          value={
            <span className={netTotal < 0 ? "text-toxic-green" : netTotal > 0 ? "text-yellow-400" : "text-white"}>
              {netTotal < 0 ? "+$" : netTotal > 0 ? "-$" : "$"}{Math.abs(netTotal).toFixed(2)}
            </span>
          }
          subtitle={netTotal < 0 ? "she spent more" : netTotal > 0 ? "you spent more" : "balanced"}
          icon={<TrendingUp className="w-5 h-5" />}
          variant={netTotal < 0 ? "success" : netTotal > 200 ? "warning" : "default"}
        />
        <StatCard
          title="Cost per Intimacy"
          value={<MetricDisplay value={Math.abs(roi)} prefix={roi < 0 ? "+$" : "$"} decimals={2} />}
          subtitle="ROI metric"
          icon={<CreditCard className="w-5 h-5" />}
          variant={roi > 50 ? "danger" : roi < 0 ? "success" : "default"}
        />
      </div>

      {/* Expense Breakdown */}
      {expensesByCategory.length > 0 && (
        <motion.div
          className="p-6 rounded-lg bg-white/5 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="w-5 h-5 text-holo-cyan" />
            <h4 className="text-sm font-mono text-white/50 uppercase tracking-wider">
              Expense Categories
            </h4>
          </div>

          <div className="space-y-4">
            {expensesByCategory.map((expense, index) => (
              <motion.div
                key={expense.category}
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${expense.bg}`} />
                    <span className="text-sm font-display text-white">
                      {expense.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-mono font-bold ${expense.text}`}>
                      ${expense.amount.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-white/50 w-12 text-right">
                      {expense.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${expense.bg.replace("/20", "/60")}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${expense.percentage}%` }}
                    transition={{
                      duration: 1,
                      delay: index * 0.1,
                      ease: "easeOut",
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Transactions */}
      <motion.div
        className="p-6 rounded-lg bg-white/5 border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Receipt className="w-5 h-5 text-holo-cyan" />
            <h4 className="text-sm font-mono text-white/50 uppercase tracking-wider">
              All Expenses
            </h4>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <motion.button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all ${
              selectedCategory === "all"
                ? "bg-holo-cyan text-black"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "tween", duration: 0.2 }}
          >
            All ({events.length})
          </motion.button>
          {CATEGORIES.map((category) => {
            const count = events.filter((e) => e.category === category).length;
            if (count === 0) return null;
            return (
              <motion.button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all ${
                  selectedCategory === category
                    ? "bg-holo-cyan text-black"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "tween", duration: 0.2 }}
              >
                {category} ({count})
              </motion.button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-8 text-white/50 font-mono">
            Loading expenses...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-white/50 font-mono">
            No expenses yet. Add your first expense to track spending.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {events
              .filter((event) => selectedCategory === "all" || event.category === selectedCategory)
              .map((event, index) => (
              <motion.div
                key={event.id}
                className="flex items-center justify-between p-3 rounded bg-white/5 hover:bg-white/10 transition-colors group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05, type: "tween" }}
                whileHover={{ x: 4 }}
              >
                <div className="flex-1">
                  <div className="text-sm font-display text-white mb-1">
                    {event.title}
                  </div>
                  {event.description && (
                    <div className="text-xs text-white/50 mb-1">
                      {event.description}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-white/50">
                      {new Date(event.event_date).toLocaleDateString()}
                    </span>
                    {event.category && (
                      <AnimatedBadge variant="default" size="sm">
                        {event.category}
                      </AnimatedBadge>
                    )}
                    <AnimatedBadge variant={event.event_type === 'date' ? 'info' : 'warning'} size="sm">
                      {event.event_type}
                    </AnimatedBadge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    {event.amount && event.amount > 0 && (
                      <div className="text-sm font-mono font-bold text-yellow-400">
                        You: -${event.amount.toFixed(2)}
                      </div>
                    )}
                    {event.partner_amount && event.partner_amount > 0 && (
                      <div className="text-sm font-mono font-bold text-toxic-green">
                        Her: +${event.partner_amount.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <motion.button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="w-8 h-8 rounded-full bg-simp-red/20 text-simp-red opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-simp-red/30"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "tween", duration: 0.2 }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Budget Warning */}
      {monthlyBurn > 200 && (
        <motion.div
          className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            <div>
              <h5 className="text-sm font-display font-bold text-yellow-400">
                High Monthly Burn Rate
              </h5>
              <p className="text-xs text-white/70">
                Consider budget constraints for sustainable relationship investment
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
