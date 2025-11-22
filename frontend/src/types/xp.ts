export type XPCategory =
  | "milestone"
  | "consistency"
  | "social"
  | "performance"
  | "red_flag"
  | "achievement";

export type XPReason =
  // Milestones
  | "status_talking_to_dating"
  | "status_dating_to_exclusive"
  | "status_to_complicated"
  | "clean_breakup"
  | "second_chance"
  | "partner_added"
  // Consistency
  | "timeline_event_added"
  | "weekly_update_bonus"
  | "decay_cleanup"
  | "complete_profile"
  | "partner_info_updated"
  | "partner_photo_added"
  // Social
  | "sticky_note_created"
  | "peer_validation"
  | "poke_decayed_node"
  | "red_flag_help"
  // Performance
  | "low_simp_index"
  | "high_intimacy"
  | "balanced_dating"
  | "simp_index_improved"
  | "intimacy_improved"
  // Red Flag
  | "red_flag_documented"
  | "critical_red_flag_early"
  | "toxic_relationship_ended"
  // Penalties
  | "high_simp_penalty"
  | "partner_neglect"
  | "serial_dating_penalty"
  | "ignored_decay"
  // Achievement
  | "achievement_unlocked";

export interface XPTransaction {
  id: string;
  user_id: string;
  group_id: string;
  amount: number;
  reason: XPReason;
  category: XPCategory;
  related_partner_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_name: string;
  achievement_description?: string;
  xp_reward: number;
  unlocked_at: string;
  metadata?: Record<string, any>;
}

export interface PeerValidation {
  id: string;
  user_id: string;
  group_id: string;
  action_type: string;
  action_description: string;
  xp_amount: number;
  related_partner_id?: string;
  status: "pending" | "approved" | "rejected";
  validators: string[];
  required_validations: number;
  metadata?: Record<string, any>;
  created_at: string;
  resolved_at?: string;
}

export interface XPConfig {
  // Milestones
  STATUS_TALKING_TO_DATING: number;
  STATUS_DATING_TO_EXCLUSIVE: number;
  STATUS_TO_COMPLICATED: number;
  CLEAN_BREAKUP: number;
  SECOND_CHANCE: number;
  PARTNER_ADDED: number;
  // Consistency
  TIMELINE_EVENT_ADDED: number;
  WEEKLY_UPDATE_BONUS: number;
  DECAY_CLEANUP: number;
  COMPLETE_PROFILE: number;
  PARTNER_INFO_UPDATED: number;
  PARTNER_PHOTO_ADDED: number;
  // Social
  STICKY_NOTE_CREATED: number;
  PEER_VALIDATION: number;
  POKE_DECAYED_NODE: number;
  RED_FLAG_HELP: number;
  // Performance
  LOW_SIMP_INDEX: number;
  HIGH_INTIMACY: number;
  BALANCED_DATING: number;
  SIMP_INDEX_IMPROVED: number;
  INTIMACY_IMPROVED: number;
  // Red Flag
  RED_FLAG_DOCUMENTED: number;
  CRITICAL_RED_FLAG_EARLY: number;
  TOXIC_RELATIONSHIP_ENDED: number;
  // Penalties
  HIGH_SIMP_PENALTY: number;
  PARTNER_NEGLECT: number;
  SERIAL_DATING_PENALTY: number;
  IGNORED_DECAY: number;
}

export const XP_REWARDS: XPConfig = {
  // Milestones
  STATUS_TALKING_TO_DATING: 50,
  STATUS_DATING_TO_EXCLUSIVE: 150,
  STATUS_TO_COMPLICATED: -30,
  CLEAN_BREAKUP: 40,
  SECOND_CHANCE: 75,
  PARTNER_ADDED: 25,
  // Consistency
  TIMELINE_EVENT_ADDED: 10,
  WEEKLY_UPDATE_BONUS: 30,
  DECAY_CLEANUP: 20,
  COMPLETE_PROFILE: 50,
  PARTNER_INFO_UPDATED: 10,
  PARTNER_PHOTO_ADDED: 15,
  // Social
  STICKY_NOTE_CREATED: 5,
  PEER_VALIDATION: 15,
  POKE_DECAYED_NODE: 8,
  RED_FLAG_HELP: 12,
  // Performance
  LOW_SIMP_INDEX: 100,
  HIGH_INTIMACY: 80,
  BALANCED_DATING: 200,
  SIMP_INDEX_IMPROVED: 50,
  INTIMACY_IMPROVED: 25,
  // Red Flag
  RED_FLAG_DOCUMENTED: 15,
  CRITICAL_RED_FLAG_EARLY: 60,
  TOXIC_RELATIONSHIP_ENDED: 120,
  // Penalties
  HIGH_SIMP_PENALTY: -50,
  PARTNER_NEGLECT: -25,
  SERIAL_DATING_PENALTY: -75,
  IGNORED_DECAY: -15,
};

export interface LevelUpResult {
  new_xp: number;
  new_level: number;
  leveled_up: boolean;
}
