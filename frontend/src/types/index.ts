export type RelationshipStatus =
  | "Talking"
  | "Dating"
  | "It's Complicated"
  | "Exclusive"
  | "Graveyard";

export interface User {
  id: string;
  username: string;
  avatar_url?: string;
  current_xp: number;
  level: number;
}

export interface PartnerNode {
  id: string;
  user_id: string;
  nickname: string;
  status: RelationshipStatus;
  financial_total: number; // Total $$ spent
  time_total: number; // Hours invested
  intimacy_score: number; // 1-10
  created_at: string;
  last_updated_at: string;
  // Derived metrics
  simp_index?: number;
  decay_level?: "active" | "rust" | "cobweb";
}

export interface Asset {
  id: string;
  node_id: string;
  url: string;
  type: "image" | "screenshot";
  is_blurred: boolean;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
}
