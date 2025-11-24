export type RelationshipStatus =
  | "Talking"
  | "Dating"
  | "It's Complicated"
  | "Signed"
  | "Exclusive"
  | "Graveyard";

export type CauseOfDeath =
  | "Ghosted"
  | "Cheated"
  | "Boring"
  | "Lost Interest"
  | "Toxic Behavior"
  | "Distance Issues"
  | "Different Goals"
  | "Red Flags"
  | "No Chemistry"
  | "Custom";

export interface User {
  id: string;
  username: string;
  avatar_url?: string;
  current_xp: number;
  level: number;
  bet_currency?: number;
}

export interface PartnerNode {
  id: string;
  user_id: string;
  group_id: string;
  nickname: string;
  status: RelationshipStatus;
  financial_total: number; // Total $$ spent
  time_total: number; // Hours invested
  intimacy_score: number; // 1-10
  created_at: string;
  last_updated_at: string;
  photo_url?: string | null; // Partner photo
  // Derived metrics
  simp_index?: number;
  decay_level?: "active" | "rust" | "cobweb";
  // Graveyard fields
  cause_of_death?: CauseOfDeath;
  cause_of_death_custom?: string; // For custom reason
  graveyard_date?: string; // When moved to graveyard
}

export interface Asset {
  id: string;
  node_id: string;
  url: string;
  type: "image" | "screenshot";
  is_blurred: boolean;
}

export interface PartnerImage {
  id: string;
  partner_id: string;
  image_url: string;
  display_order: number;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
}

export type EventCategory =
  | "Dining"
  | "Entertainment"
  | "Gifts"
  | "Travel"
  | "Shopping"
  | "Activities"
  | "Other";

export type EventType =
  | "date"
  | "expense"
  | "red_flag"
  | "note"
  | "intimacy"
  | "status_change"
  | "milestone";

export type RedFlagSeverity =
  | "Low"
  | "Medium"
  | "High"
  | "Critical";

export interface TimelineEvent {
  id: string;
  partner_id: string;
  event_type: EventType;
  title: string;
  description?: string;
  event_date: string; // ISO date string
  created_at: string;
  // Financial data (for expenses and dates)
  amount?: number; // Your spending
  partner_amount?: number; // Her spending (gifts, paid for dates, etc.)
  category?: EventCategory;
  // Red flag data
  severity?: RedFlagSeverity;
  // Intimacy data
  intimacy_change?: number;
  // Flexible metadata
  metadata?: Record<string, any>;
}

// Legacy type for backward compatibility
export type TransactionCategory = EventCategory;
export type Transaction = TimelineEvent;

// =============================================
// BETTING STUDIO TYPES
// =============================================

export type BetType = "system" | "custom";

export type BetCategory =
  | "first_date"
  | "kiss"
  | "sex"
  | "relationship"
  | "breakup"
  | "response_time"
  | "money_spent"
  | "custom";

export type BetStatus = "open" | "locked" | "resolved" | "cancelled";

export type BetOutcomeType = "boolean" | "number" | "date";

export type WagerStatus = "active" | "won" | "lost" | "cancelled";

export type TransactionType =
  | "wager_placed"
  | "wager_won"
  | "wager_lost"
  | "wager_refund"
  | "daily_bonus"
  | "admin_adjustment";

export interface BetMaster {
  id: string;
  group_id: string;
  user_id: string;
  elected_at: string;
  term_ends_at?: string;
  total_votes: number;
  user?: User; // Populated via join
}

export interface BetMasterVote {
  id: string;
  group_id: string;
  voter_id: string;
  candidate_id: string;
  created_at: string;
  candidate?: User; // Populated via join
}

export interface Bet {
  id: string;
  group_id: string;
  creator_id?: string;
  target_user_id: string;
  title: string;
  description?: string;
  bet_type: BetType;
  category: BetCategory;
  outcome_type: BetOutcomeType;
  deadline: string;
  status: BetStatus;
  winning_outcome?: any;
  total_pot: number;
  stake_amount: number; // Fixed amount everyone must bet
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  // Populated via joins
  creator?: User;
  target_user?: User;
  resolver?: User;
  wagers?: Wager[];
  odds?: BetOdds[];
}

export interface BetOdds {
  id: string;
  bet_id: string;
  user_id: string;
  odds_success: number;
  odds_failure: number;
  calculation_basis?: any;
  confidence_score?: number;
  calculated_at: string;
  user?: User;
}

export interface Wager {
  id: string;
  bet_id: string;
  user_id: string;
  amount: number;
  prediction: any;
  odds_at_placement: number;
  potential_payout: number;
  status: WagerStatus;
  payout_amount?: number;
  created_at: string;
  updated_at: string;
  user?: User;
  bet?: Bet;
}

export interface BetTransaction {
  id: string;
  user_id: string;
  wager_id?: string;
  amount: number;
  transaction_type: TransactionType;
  balance_before: number;
  balance_after: number;
  description?: string;
  created_at: string;
}

export interface WeeklySystemBets {
  id: string;
  group_id: string;
  week_start: string;
  week_end: string;
  bets_generated: number;
  created_at: string;
}
