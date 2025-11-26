"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  UserPlus,
  Heart,
  Image,
  Flag,
  Star,
  MessageCircle,
  AlertTriangle,
  Trophy,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ActivityFeedItem, ActivityEventType } from "@/types";
import { cn } from "@/lib/utils";

interface ActivityFeedProps {
  groupId: string;
  isMobile?: boolean;
}

const eventConfig: Record<
  ActivityEventType,
  {
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  member_joined: {
    icon: UserPlus,
    color: "text-holo-cyan",
    bgColor: "bg-holo-cyan/20",
    borderColor: "border-holo-cyan/40",
  },
  date_created: {
    icon: Heart,
    color: "text-lust-pink",
    bgColor: "bg-lust-pink/20",
    borderColor: "border-lust-pink/40",
  },
  photo_added: {
    icon: Image,
    color: "text-lust-pink",
    bgColor: "bg-lust-pink/20",
    borderColor: "border-lust-pink/40",
  },
  red_flag_added: {
    icon: Flag,
    color: "text-simp-red",
    bgColor: "bg-simp-red/20",
    borderColor: "border-simp-red/40",
  },
  friend_rating_added: {
    icon: Star,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/20",
    borderColor: "border-yellow-400/40",
  },
  note_added: {
    icon: MessageCircle,
    color: "text-toxic-green",
    bgColor: "bg-toxic-green/20",
    borderColor: "border-toxic-green/40",
  },
  simp_alert: {
    icon: AlertTriangle,
    color: "text-simp-red",
    bgColor: "bg-simp-red/20",
    borderColor: "border-simp-red/40",
  },
  bet_created: {
    icon: Trophy,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/20",
    borderColor: "border-yellow-400/40",
  },
};

const getRelativeTime = (timestamp: string) => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

// Intel events are group-specific and should NOT be shown globally
const INTEL_EVENT_TYPES: ActivityEventType[] = [
  "friend_rating_added",
  "note_added",
  "red_flag_added",
];

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  groupId,
  isMobile = false,
}) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userGroupIds, setUserGroupIds] = useState<string[]>([]);

  // Load user's group memberships
  useEffect(() => {
    const loadUserGroups = async () => {
      if (!user?.id) return;

      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (memberships) {
        setUserGroupIds(memberships.map((m) => m.group_id));
      }
    };

    loadUserGroups();
  }, [user?.id]);

  // Handle clicking on an activity to navigate to the partner
  const handleClickPartner = (partnerId: string) => {
    // Close the sidebar/sheet
    setIsOpen(false);
    setExpanded(false);

    // Dispatch event to open partner modal (same pattern as clicking a planet)
    window.dispatchEvent(new CustomEvent('open-partner-detail', {
      detail: { partnerId }
    }));
  };

  const loadActivities = useCallback(async () => {
    if (!groupId || userGroupIds.length === 0) return;

    try {
      setLoading(true);

      // Load activities from ALL groups the user is member of
      // But filter out Intel events from other groups (those stay group-specific)
      const { data: allActivities, error } = await supabase
        .from("activity_feed")
        .select("*")
        .in("group_id", userGroupIds)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      if (allActivities && allActivities.length > 0) {
        // Filter: Show all events from current group
        // From other groups: only show non-Intel events (global partner events)
        let filteredActivities = allActivities.filter((activity) => {
          if (activity.group_id === groupId) {
            // Current group: show everything
            return true;
          } else {
            // Other groups: hide Intel events (notes, ratings, red flags)
            return !INTEL_EVENT_TYPES.includes(activity.event_type);
          }
        });

        // Deduplicate global events (same actor + event_type + target within 5 seconds)
        // This handles cases where database triggers create multiple entries
        const seen = new Map<string, number>();
        filteredActivities = filteredActivities.filter((activity) => {
          // Only dedupe non-Intel (global) events
          if (INTEL_EVENT_TYPES.includes(activity.event_type)) {
            return true;
          }

          const key = `${activity.actor_id}-${activity.event_type}-${activity.target_partner_id || 'none'}`;
          const timestamp = new Date(activity.created_at).getTime();
          const existingTimestamp = seen.get(key);

          if (existingTimestamp && Math.abs(timestamp - existingTimestamp) < 5000) {
            // Duplicate within 5 seconds - skip
            return false;
          }

          seen.set(key, timestamp);
          return true;
        }).slice(0, 50); // Limit to 50 after filtering

        // Get unique actor IDs
        const actorIds = [...new Set(filteredActivities.map((a) => a.actor_id))];

        // Fetch usernames
        const { data: usersData } = await supabase
          .from("users")
          .select("id, username, avatar_url, current_xp, level")
          .in("id", actorIds);

        const usersMap = new Map(usersData?.map((u) => [u.id, u]) || []);

        setActivities(
          filteredActivities.map((activity) => ({
            ...activity,
            actor: usersMap.get(activity.actor_id),
          }))
        );
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error("Error loading activities:", error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [groupId, userGroupIds]);

  // Load activities when opened
  useEffect(() => {
    if (isOpen && groupId && userGroupIds.length > 0) {
      loadActivities();
      setUnreadCount(0);
    }
  }, [isOpen, groupId, userGroupIds, loadActivities]);

  // Load unread count on mount - count from all groups
  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!groupId || !user?.id || userGroupIds.length === 0) return;

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Get count from all groups the user is in
      const { data: allActivities, error } = await supabase
        .from("activity_feed")
        .select("event_type, group_id")
        .in("group_id", userGroupIds)
        .neq("actor_id", user.id)
        .gte("created_at", twentyFourHoursAgo);

      if (!error && allActivities) {
        // Filter same as in loadActivities
        const filteredCount = allActivities.filter((activity) => {
          if (activity.group_id === groupId) {
            return true;
          } else {
            return !INTEL_EVENT_TYPES.includes(activity.event_type);
          }
        }).length;

        setUnreadCount(filteredCount);
      }
    };

    loadUnreadCount();
  }, [groupId, user?.id, userGroupIds]);

  // Track recently seen activities to prevent duplicates from multiple subscriptions
  const recentActivityKeys = useRef<Map<string, number>>(new Map());

  // Real-time subscription for new activities - subscribe to all user's groups
  useEffect(() => {
    if (!groupId || userGroupIds.length === 0) return;

    // Clean up old keys (older than 10 seconds)
    const cleanupOldKeys = () => {
      const now = Date.now();
      recentActivityKeys.current.forEach((timestamp, key) => {
        if (now - timestamp > 10000) {
          recentActivityKeys.current.delete(key);
        }
      });
    };

    // Create channels for all groups the user is in
    const channels = userGroupIds.map((gid) =>
      supabase
        .channel(`activity_feed_${gid}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "activity_feed",
            filter: `group_id=eq.${gid}`,
          },
          async (payload) => {
            const newActivity = payload.new as ActivityFeedItem;

            // Check if this activity should be shown
            const shouldShow =
              newActivity.group_id === groupId ||
              !INTEL_EVENT_TYPES.includes(newActivity.event_type);

            if (!shouldShow) return;

            // Deduplicate: Check if we've seen this activity recently
            // For global events, use actor + event_type + target as key
            const isGlobalEvent = !INTEL_EVENT_TYPES.includes(newActivity.event_type);
            if (isGlobalEvent) {
              const dedupeKey = `${newActivity.actor_id}-${newActivity.event_type}-${newActivity.target_partner_id || 'none'}`;
              const now = Date.now();
              const lastSeen = recentActivityKeys.current.get(dedupeKey);

              if (lastSeen && now - lastSeen < 5000) {
                // Duplicate within 5 seconds - skip
                return;
              }

              recentActivityKeys.current.set(dedupeKey, now);
              cleanupOldKeys();
            }

            // Increment unread count if not from current user and sidebar is closed
            if (newActivity.actor_id !== user?.id && !isOpen) {
              setUnreadCount((prev) => prev + 1);
            }

            // If sidebar is open, add to activities list
            if (isOpen) {
              const { data: actorData } = await supabase
                .from("users")
                .select("id, username, avatar_url, current_xp, level")
                .eq("id", newActivity.actor_id)
                .single();

              setActivities((prev) => [
                { ...newActivity, actor: actorData || undefined },
                ...prev,
              ]);
            }
          }
        )
        .subscribe()
    );

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [groupId, userGroupIds, user?.id, isOpen]);

  // Desktop Sidebar with Toggle Tab
  if (!isMobile) {
    return (
      <div className="fixed right-0 top-0 h-full z-40 pointer-events-none">
        {/* Toggle Tab - Always visible */}
        <motion.button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) setUnreadCount(0);
          }}
          className={cn(
            "pointer-events-auto absolute top-1/2 -translate-y-1/2 flex items-center gap-1 py-3 px-1.5 rounded-l-lg border border-r-0 transition-all",
            isOpen
              ? "right-80 bg-void-glass/95 border-white/10"
              : "right-0 bg-void-glass/80 border-white/10 hover:bg-void-glass/95"
          )}
          whileHover={{ x: isOpen ? 0 : -4 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex flex-col items-center gap-2">
            {isOpen ? (
              <ChevronRight className="w-4 h-4 text-white/70" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 text-white/70" />
                <Activity className="w-4 h-4 text-holo-cyan" />
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="min-w-5 h-5 px-1 bg-lust-pink rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </motion.div>
                )}
              </>
            )}
          </div>
        </motion.button>

        {/* Sidebar Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="pointer-events-auto absolute right-0 top-0 h-full w-80 bg-void-glass/95 backdrop-blur-xl border-l border-white/10 flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              {/* Header */}
              <div className="p-4 border-b border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-holo-cyan/20 border border-holo-cyan/40 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-holo-cyan" />
                </div>
                <div>
                  <h3 className="text-sm font-display font-bold text-white uppercase">
                    Activity Feed
                  </h3>
                  <p className="text-xs font-mono text-white/50">
                    {activities.length} updates
                  </p>
                </div>
              </div>

              {/* Activity List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-white/50 font-mono text-sm">
                      Loading activity...
                    </div>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="w-10 h-10 text-white/20 mb-3" />
                    <p className="text-white/50 font-mono text-sm">
                      No activity yet
                    </p>
                    <p className="text-white/30 font-mono text-xs mt-1">
                      Updates will appear here
                    </p>
                  </div>
                ) : (
                  activities.map((activity, index) => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      index={index}
                      currentUserId={user?.id}
                      onClickPartner={handleClickPartner}
                    />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Mobile Bottom Sheet
  return (
    <>
      {/* Mobile Toggle Button - Fixed at bottom right */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full bg-void-glass/95 border border-holo-cyan/40 flex items-center justify-center shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Activity className="w-5 h-5 text-holo-cyan" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-lust-pink rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.div>
        )}
      </motion.button>

      {/* Mobile Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            {expanded && (
              <motion.div
                className="fixed inset-0 bg-black/50 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setExpanded(false)}
              />
            )}

            {/* Bottom Sheet */}
            <motion.div
              className={cn(
                "fixed left-0 right-0 bottom-0 bg-void-glass/95 backdrop-blur-xl border-t border-white/10 z-50 rounded-t-2xl safe-bottom",
                expanded ? "h-[70dvh]" : "h-auto"
              )}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              drag={expanded ? undefined : "y"}
              dragConstraints={{ top: 0, bottom: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) {
                  setIsOpen(false);
                  setExpanded(false);
                } else if (info.offset.y < -50) {
                  setExpanded(true);
                }
              }}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-white/30" />
              </div>

              {/* Header */}
              <div className="px-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-holo-cyan/20 border border-holo-cyan/40 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-holo-cyan" />
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-bold text-white uppercase">
                      Activity
                    </h3>
                    <p className="text-xs font-mono text-white/50">
                      {activities.length} updates
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => setExpanded(!expanded)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {expanded ? (
                      <ChevronDown className="w-4 h-4 text-white" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-white" />
                    )}
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setIsOpen(false);
                      setExpanded(false);
                    }}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-4 h-4 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* Preview (collapsed) or Full List (expanded) */}
              {!expanded ? (
                <div className="px-4 pb-4 space-y-2">
                  {loading ? (
                    <div className="text-white/50 font-mono text-xs text-center py-4">
                      Loading...
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-white/50 font-mono text-xs text-center py-4">
                      No activity yet
                    </div>
                  ) : (
                    activities.slice(0, 3).map((activity, index) => (
                      <ActivityItemCompact
                        key={activity.id}
                        activity={activity}
                        index={index}
                      />
                    ))
                  )}
                  {activities.length > 3 && (
                    <button
                      onClick={() => setExpanded(true)}
                      className="w-full text-center text-xs font-mono text-holo-cyan py-2"
                    >
                      View all {activities.length} updates
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 max-h-[calc(70vh-100px)]">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-white/50 font-mono text-sm">
                        Loading activity...
                      </div>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Bell className="w-12 h-12 text-white/20 mb-4" />
                      <p className="text-white/50 font-mono text-sm">
                        No activity yet
                      </p>
                    </div>
                  ) : (
                    activities.map((activity, index) => (
                      <ActivityItem
                        key={activity.id}
                        activity={activity}
                        index={index}
                        currentUserId={user?.id}
                        onClickPartner={handleClickPartner}
                      />
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Full Activity Item
const ActivityItem: React.FC<{
  activity: ActivityFeedItem;
  index: number;
  currentUserId?: string;
  onClickPartner?: (partnerId: string) => void;
}> = ({ activity, index, currentUserId, onClickPartner }) => {
  const config = eventConfig[activity.event_type];
  const Icon = config.icon;
  const isOwnActivity = activity.actor_id === currentUserId;
  const isClickable = !!activity.target_partner_id && !!onClickPartner;

  const handleClick = () => {
    if (isClickable && activity.target_partner_id) {
      onClickPartner(activity.target_partner_id);
    }
  };

  return (
    <motion.div
      className={cn(
        "p-2.5 rounded-lg border backdrop-blur-sm",
        config.bgColor,
        config.borderColor,
        isClickable && "cursor-pointer hover:brightness-110 transition-all"
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: index * 0.03,
      }}
      onClick={handleClick}
      whileHover={isClickable ? { scale: 1.02 } : undefined}
      whileTap={isClickable ? { scale: 0.98 } : undefined}
    >
      <div className="flex gap-2.5">
        {/* Icon */}
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
            config.bgColor,
            "border",
            config.borderColor
          )}
        >
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-display font-bold text-white leading-tight">
              {activity.title}
              {isOwnActivity && (
                <span className="text-[10px] font-mono text-white/50 ml-1">
                  (You)
                </span>
              )}
            </p>
            <span className="text-[10px] font-mono text-white/50 whitespace-nowrap shrink-0">
              {getRelativeTime(activity.created_at)}
            </span>
          </div>
          {activity.description && (
            <p className="text-[11px] text-white/60 mt-0.5 line-clamp-2">
              {activity.description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Compact Activity Item (for mobile preview)
const ActivityItemCompact: React.FC<{
  activity: ActivityFeedItem;
  index: number;
}> = ({ activity, index }) => {
  const config = eventConfig[activity.event_type];
  const Icon = config.icon;

  return (
    <motion.div
      className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          config.bgColor
        )}
      >
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-display text-white truncate">
          {activity.title}
        </p>
      </div>
      <span className="text-xs font-mono text-white/50 shrink-0">
        {getRelativeTime(activity.created_at)}
      </span>
    </motion.div>
  );
};

export default ActivityFeed;
