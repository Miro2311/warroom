"use client";

import React, { useState, useEffect } from "react";
import { PartnerNode, TimelineEvent, EventType, EventCategory, RedFlagSeverity } from "@/types";
import { TimelineContainer, TimelineItem } from "@/components/ui/timeline-item";
import { StatCard } from "@/components/ui/stat-card";
import { MetricDisplay } from "@/components/ui/metric-display";
import { AnimatedBadge } from "@/components/ui/animated-badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  DollarSign,
  MessageCircle,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Users,
  Plus,
  X,
  Gift,
  Flag,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { syncTimelineEvent, syncDeleteTimelineEvent } from "@/lib/partnerSync";

interface TimelineTabProps {
  partner: PartnerNode;
}

const EVENT_TYPE_CONFIG = {
  date: { icon: Calendar, color: "text-lust-pink", bg: "bg-lust-pink/10", border: "border-lust-pink/30", label: "Date" },
  expense: { icon: DollarSign, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", label: "Expense" },
  red_flag: { icon: AlertTriangle, color: "text-simp-red", bg: "bg-simp-red/10", border: "border-simp-red/30", label: "Red Flag" },
  note: { icon: MessageCircle, color: "text-toxic-green", bg: "bg-toxic-green/10", border: "border-toxic-green/30", label: "Note" },
  intimacy: { icon: Heart, color: "text-lust-pink", bg: "bg-lust-pink/10", border: "border-lust-pink/30", label: "Intimacy" },
  status_change: { icon: TrendingUp, color: "text-holo-cyan", bg: "bg-holo-cyan/10", border: "border-holo-cyan/30", label: "Status" },
  milestone: { icon: Gift, color: "text-toxic-green", bg: "bg-toxic-green/10", border: "border-toxic-green/30", label: "Milestone" },
};

const CATEGORIES: EventCategory[] = ["Dining", "Entertainment", "Gifts", "Travel", "Shopping", "Activities", "Other"];
const SEVERITIES: RedFlagSeverity[] = ["Low", "Medium", "High", "Critical"];

const CATEGORY_COLORS: Record<EventCategory, { text: string; bg: string }> = {
  Dining: { text: "text-yellow-400", bg: "bg-yellow-400/20" },
  Entertainment: { text: "text-lust-pink", bg: "bg-lust-pink/20" },
  Gifts: { text: "text-holo-cyan", bg: "bg-holo-cyan/20" },
  Travel: { text: "text-toxic-green", bg: "bg-toxic-green/20" },
  Shopping: { text: "text-purple-400", bg: "bg-purple-400/20" },
  Activities: { text: "text-orange-400", bg: "bg-orange-400/20" },
  Other: { text: "text-white/50", bg: "bg-white/5" },
};

export const TimelineTab: React.FC<TimelineTabProps> = ({ partner }) => {
  const { user: authUser } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<EventType | "all">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);

  // Check if current user is the owner - only owner can add timeline events
  const isOwner = authUser?.id === partner.user_id;

  // Form state
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    partner_amount: "", // Her spending
    category: "Dining" as EventCategory,
    severity: "Medium" as RedFlagSeverity,
    intimacy_change: 0,
  });

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
        .order("event_date", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error loading timeline events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (!selectedEventType || !newEvent.title.trim()) {
      console.log("Validation failed:", { selectedEventType, title: newEvent.title });
      return;
    }

    try {
      const eventData: any = {
        partner_id: partner.id,
        event_type: selectedEventType,
        title: newEvent.title.trim(),
        description: newEvent.description?.trim() || null,
        event_date: newEvent.date,
      };

      // Add type-specific fields
      if (selectedEventType === "expense" || selectedEventType === "date") {
        if (newEvent.amount) {
          eventData.amount = parseFloat(newEvent.amount);
        }
        if (newEvent.partner_amount) {
          eventData.partner_amount = parseFloat(newEvent.partner_amount);
        }
        eventData.category = newEvent.category;
      }

      if (selectedEventType === "red_flag") {
        eventData.severity = newEvent.severity;
      }

      if (selectedEventType === "intimacy") {
        eventData.intimacy_change = newEvent.intimacy_change;
      }

      console.log("Inserting event:", eventData);

      const { data, error } = await supabase
        .from("timeline_events")
        .insert(eventData)
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Event created successfully:", data);

      // Sync to all matching partners in other groups
      const { partner_id, id, created_at, ...syncData } = eventData;
      await syncTimelineEvent(partner.id, syncData);

      setEvents([data, ...events]);
      setShowAddModal(false);
      setSelectedEventType(null);
      resetForm();

      // Award XP for adding timeline event
      if (authUser?.id && partner.group_id) {
        const { XPService } = await import("@/services/xpService");
        const { AchievementService } = await import("@/services/achievementService");

        await XPService.handleTimelineEvent(
          authUser.id,
          partner.group_id,
          partner.id,
          selectedEventType
        );

        // Award XP for red flag if applicable
        if (selectedEventType === "red_flag" && newEvent.severity) {
          await XPService.awardRedFlagXP(
            authUser.id,
            partner.group_id,
            partner.id,
            newEvent.severity
          );
        }

        // Check achievements
        await AchievementService.checkAchievements(authUser.id, partner.group_id);

        // Update streak
        await XPService.updateStreak(authUser.id);
      }
    } catch (error) {
      console.error("Error adding event:", error);
      alert(`Failed to add event: ${error instanceof Error ? error.message : String(error)}`);
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
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const resetForm = () => {
    setNewEvent({
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      amount: "",
      partner_amount: "",
      category: "Dining",
      severity: "Medium",
      intimacy_change: 0,
    });
  };

  const filteredEvents = selectedFilter === "all"
    ? events
    : events.filter((e) => e.event_type === selectedFilter);

  const renderEventIcon = (event: TimelineEvent) => {
    const config = EVENT_TYPE_CONFIG[event.event_type];
    const Icon = config.icon;
    return <Icon className="w-5 h-5" />;
  };

  const renderEventMetadata = (event: TimelineEvent) => {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <AnimatedBadge variant="default" size="sm">
          {EVENT_TYPE_CONFIG[event.event_type].label}
        </AnimatedBadge>

        {event.amount && (
          <span className="text-sm font-mono text-yellow-400" title="Your spending">
            You: ${event.amount.toFixed(2)}
          </span>
        )}

        {event.partner_amount && (
          <span className="text-sm font-mono text-lust-pink" title="Her spending">
            Her: ${event.partner_amount.toFixed(2)}
          </span>
        )}

        {event.category && (
          <AnimatedBadge variant="default" size="sm">
            {event.category}
          </AnimatedBadge>
        )}

        {event.severity && (
          <AnimatedBadge
            variant={event.severity === "Critical" ? "danger" : event.severity === "High" ? "warning" : "default"}
            size="sm"
          >
            {event.severity}
          </AnimatedBadge>
        )}

        {event.intimacy_change !== undefined && event.intimacy_change !== 0 && (
          <span className={`text-sm font-mono ${event.intimacy_change > 0 ? 'text-toxic-green' : 'text-simp-red'}`}>
            {event.intimacy_change > 0 ? '+' : ''}{event.intimacy_change} intimacy
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-display font-bold text-white uppercase">
            Relationship Timeline
          </h3>
          <p className="text-sm text-white/50 font-mono">
            Chronological history of all interactions
            {!isOwner && <span className="ml-2 text-yellow-400">(View Only)</span>}
          </p>
        </div>
        {isOwner && (
          <motion.button
            onClick={() => {
              setShowAddModal(true);
              setSelectedEventType("date"); // Set default to "date" event type
            }}
            className="flex items-center gap-2 px-4 py-2 bg-holo-cyan text-black font-display font-bold rounded hover:bg-holo-cyan/80 transition-colors"
            style={{ position: 'relative', zIndex: 10 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "tween", duration: 0.2 }}
          >
            <Plus className="w-4 h-4" />
            Add Event
          </motion.button>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <motion.button
          onClick={() => setSelectedFilter("all")}
          className={`px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition-all ${
            selectedFilter === "all"
              ? "bg-holo-cyan text-black"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "tween", duration: 0.2 }}
        >
          All Events ({events.length})
        </motion.button>
        {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => {
          const count = events.filter((e) => e.event_type === type).length;
          const isActive = selectedFilter === type;
          return (
            <motion.button
              key={type}
              onClick={() => setSelectedFilter(type as EventType)}
              className={`px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition-all ${
                isActive
                  ? "bg-holo-cyan text-black"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "tween", duration: 0.2 }}
            >
              {config.label} ({count})
            </motion.button>
          );
        })}
      </div>


      {/* Timeline Events */}
      {loading ? (
        <div className="text-center py-12 text-white/50 font-mono">
          Loading events...
        </div>
      ) : filteredEvents.length === 0 ? (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50 font-mono">
            {selectedFilter === "all"
              ? "No events yet. Add your first event to start tracking."
              : `No ${selectedFilter} events found.`}
          </p>
        </motion.div>
      ) : (
        <TimelineContainer>
          {filteredEvents.map((event, index) => (
            <TimelineItem
              key={event.id}
              icon={renderEventIcon(event)}
              title={event.title}
              description={event.description || ""}
              timestamp={new Date(event.event_date).toLocaleDateString()}
              variant={event.event_type === "red_flag" ? "danger" : event.event_type === "intimacy" ? "success" : "default"}
              isLast={index === filteredEvents.length - 1}
              metadata={renderEventMetadata(event)}
            >
              {isOwner && (
                <motion.button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="absolute top-0 right-0 w-8 h-8 rounded-full bg-simp-red/20 text-simp-red opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-simp-red/30"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "tween", duration: 0.2 }}
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              )}
            </TimelineItem>
          ))}
        </TimelineContainer>
      )}

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowAddModal(false);
              setSelectedEventType(null);
              resetForm();
            }}
          >
            <motion.div
              className="bg-deep-space border border-white/20 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-white">
                  {selectedEventType ? `Add ${EVENT_TYPE_CONFIG[selectedEventType].label}` : "Choose Event Type"}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedEventType(null);
                    resetForm();
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {!selectedEventType ? (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <motion.button
                        key={type}
                        onClick={() => setSelectedEventType(type as EventType)}
                        className={`p-6 rounded-lg ${config.bg} border ${config.border} transition-all`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon className={`w-8 h-8 ${config.color} mx-auto mb-3`} />
                        <span className={`text-sm font-display font-bold ${config.color}`}>
                          {config.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleAddEvent(); }} className="space-y-4">
                  {/* Event Type Selector */}
                  <div>
                    <label className="text-xs font-mono text-white/50 uppercase tracking-wider block mb-2">
                      Event Type
                    </label>
                    <select
                      value={selectedEventType}
                      onChange={(e) => setSelectedEventType(e.target.value as EventType)}
                      className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded text-white font-display focus:outline-none focus:border-holo-cyan transition-colors"
                    >
                      {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => (
                        <option key={type} value={type}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-xs font-mono text-white/50 uppercase tracking-wider block mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded text-white font-mono focus:outline-none focus:border-holo-cyan transition-colors"
                      placeholder={`e.g. ${selectedEventType === 'date' ? 'Dinner at Italian place' : selectedEventType === 'expense' ? 'Birthday gift' : selectedEventType === 'red_flag' ? 'Cancelled plans last minute' : 'Quick note'}`}
                      autoFocus
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-mono text-white/50 uppercase tracking-wider block mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded text-white font-mono focus:outline-none focus:border-holo-cyan transition-colors resize-none"
                      rows={3}
                      placeholder="Additional details..."
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="text-xs font-mono text-white/50 uppercase tracking-wider block mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded text-white font-mono focus:outline-none focus:border-holo-cyan transition-colors"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>

                  {/* Type-specific fields */}
                  {(selectedEventType === "expense" || selectedEventType === "date") && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-mono text-yellow-400 uppercase tracking-wider block mb-2">
                            Your Spending ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={newEvent.amount}
                            onChange={(e) => setNewEvent({ ...newEvent, amount: e.target.value })}
                            className="w-full bg-white/10 border border-yellow-400/30 px-4 py-3 rounded text-white font-mono focus:outline-none focus:border-yellow-400 transition-colors"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-mono text-lust-pink uppercase tracking-wider block mb-2">
                            Her Spending ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={newEvent.partner_amount}
                            onChange={(e) => setNewEvent({ ...newEvent, partner_amount: e.target.value })}
                            className="w-full bg-white/10 border border-lust-pink/30 px-4 py-3 rounded text-white font-mono focus:outline-none focus:border-lust-pink transition-colors"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-mono text-white/50 uppercase tracking-wider block mb-2">
                          Category
                        </label>
                        <select
                          value={newEvent.category}
                          onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as EventCategory })}
                          className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded text-white font-display focus:outline-none focus:border-holo-cyan transition-colors"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {selectedEventType === "red_flag" && (
                    <div>
                      <label className="text-xs font-mono text-white/50 uppercase tracking-wider block mb-2">
                        Severity
                      </label>
                      <select
                        value={newEvent.severity}
                        onChange={(e) => setNewEvent({ ...newEvent, severity: e.target.value as RedFlagSeverity })}
                        className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded text-white font-display focus:outline-none focus:border-holo-cyan transition-colors"
                      >
                        {SEVERITIES.map((sev) => (
                          <option key={sev} value={sev}>{sev}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedEventType === "intimacy" && (
                    <div>
                      <label className="text-xs font-mono text-white/50 uppercase tracking-wider block mb-2">
                        Intimacy Change
                      </label>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        value={newEvent.intimacy_change}
                        onChange={(e) => setNewEvent({ ...newEvent, intimacy_change: parseInt(e.target.value) })}
                        className="w-full accent-holo-cyan"
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs font-mono text-white/50">-10</span>
                        <motion.div
                          className={`text-2xl font-mono font-bold ${newEvent.intimacy_change > 0 ? 'text-toxic-green' : newEvent.intimacy_change < 0 ? 'text-simp-red' : 'text-white/50'}`}
                          key={newEvent.intimacy_change}
                          initial={{ scale: 1.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                        >
                          {newEvent.intimacy_change > 0 ? '+' : ''}{newEvent.intimacy_change}
                        </motion.div>
                        <span className="text-xs font-mono text-white/50">+10</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <motion.button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setSelectedEventType(null);
                        resetForm();
                      }}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-display rounded transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={!newEvent.title.trim()}
                      className={`flex-1 py-3 font-display font-bold rounded transition-colors ${
                        !newEvent.title.trim()
                          ? 'bg-white/10 text-white/30 cursor-not-allowed'
                          : 'bg-holo-cyan hover:bg-holo-cyan/80 text-black'
                      }`}
                      whileHover={newEvent.title.trim() ? { scale: 1.02 } : {}}
                      whileTap={newEvent.title.trim() ? { scale: 0.98 } : {}}
                    >
                      Add Event
                    </motion.button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
