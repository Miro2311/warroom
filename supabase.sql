-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_type text NOT NULL,
  achievement_name text NOT NULL,
  achievement_description text,
  xp_reward integer NOT NULL,
  unlocked_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT achievements_pkey PRIMARY KEY (id),
  CONSTRAINT achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.assets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  type text NOT NULL,
  amount numeric DEFAULT 0,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assets_pkey PRIMARY KEY (id),
  CONSTRAINT assets_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id)
);
CREATE TABLE public.bet_master_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  voter_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bet_master_votes_pkey PRIMARY KEY (id),
  CONSTRAINT bet_master_votes_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT bet_master_votes_voter_id_fkey FOREIGN KEY (voter_id) REFERENCES public.users(id),
  CONSTRAINT bet_master_votes_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.users(id)
);
CREATE TABLE public.bet_odds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bet_id uuid NOT NULL,
  user_id uuid NOT NULL,
  odds_success numeric NOT NULL,
  odds_failure numeric NOT NULL,
  calculation_basis jsonb,
  confidence_score integer,
  calculated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bet_odds_pkey PRIMARY KEY (id),
  CONSTRAINT bet_odds_bet_id_fkey FOREIGN KEY (bet_id) REFERENCES public.bets(id),
  CONSTRAINT bet_odds_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.bet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  wager_id uuid,
  amount integer NOT NULL,
  transaction_type character varying NOT NULL CHECK (transaction_type::text = ANY (ARRAY['wager_placed'::character varying, 'wager_won'::character varying, 'wager_lost'::character varying, 'wager_refund'::character varying, 'daily_bonus'::character varying, 'admin_adjustment'::character varying]::text[])),
  balance_before integer NOT NULL,
  balance_after integer NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bet_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT bet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT bet_transactions_wager_id_fkey FOREIGN KEY (wager_id) REFERENCES public.wagers(id)
);
CREATE TABLE public.bets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  creator_id uuid,
  target_user_id uuid NOT NULL,
  title character varying NOT NULL,
  description text,
  bet_type character varying NOT NULL CHECK (bet_type::text = ANY (ARRAY['system'::character varying, 'custom'::character varying]::text[])),
  category character varying NOT NULL CHECK (category::text = ANY (ARRAY['first_date'::character varying, 'kiss'::character varying, 'sex'::character varying, 'relationship'::character varying, 'breakup'::character varying, 'response_time'::character varying, 'money_spent'::character varying, 'custom'::character varying]::text[])),
  outcome_type character varying DEFAULT 'boolean'::character varying CHECK (outcome_type::text = ANY (ARRAY['boolean'::character varying, 'number'::character varying, 'date'::character varying]::text[])),
  deadline timestamp with time zone NOT NULL,
  status character varying DEFAULT 'open'::character varying CHECK (status::text = ANY (ARRAY['open'::character varying, 'locked'::character varying, 'resolved'::character varying, 'cancelled'::character varying]::text[])),
  winning_outcome jsonb,
  total_pot integer DEFAULT 0,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  resolution_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  stake_amount integer NOT NULL DEFAULT 0 CHECK (stake_amount >= 0),
  CONSTRAINT bets_pkey PRIMARY KEY (id),
  CONSTRAINT bets_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id),
  CONSTRAINT bets_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT bets_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id),
  CONSTRAINT bets_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.group_bet_master (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  elected_at timestamp with time zone DEFAULT now(),
  term_ends_at timestamp with time zone,
  total_votes integer DEFAULT 0,
  CONSTRAINT group_bet_master_pkey PRIMARY KEY (id),
  CONSTRAINT group_bet_master_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT group_bet_master_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member'::text CHECK (role = ANY (ARRAY['admin'::text, 'member'::text])),
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT group_members_pkey PRIMARY KEY (id),
  CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT groups_pkey PRIMARY KEY (id)
);
CREATE TABLE public.partner_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partner_images_pkey PRIMARY KEY (id),
  CONSTRAINT partner_images_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id)
);
CREATE TABLE public.partner_note_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL,
  user_id uuid NOT NULL,
  vote_type character varying NOT NULL CHECK (vote_type::text = ANY (ARRAY['up'::character varying, 'down'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partner_note_votes_pkey PRIMARY KEY (id),
  CONSTRAINT partner_note_votes_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.partner_notes(id),
  CONSTRAINT partner_note_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.partner_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partner_notes_pkey PRIMARY KEY (id),
  CONSTRAINT partner_notes_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id),
  CONSTRAINT partner_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id)
);
CREATE TABLE public.partner_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  rater_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 10),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partner_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT partner_ratings_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id),
  CONSTRAINT partner_ratings_rater_id_fkey FOREIGN KEY (rater_id) REFERENCES public.users(id)
);
CREATE TABLE public.partner_red_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  reported_by_id uuid NOT NULL,
  description text NOT NULL,
  severity character varying DEFAULT 'medium'::character varying CHECK (severity::text = ANY (ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partner_red_flags_pkey PRIMARY KEY (id),
  CONSTRAINT partner_red_flags_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id),
  CONSTRAINT partner_red_flags_reported_by_id_fkey FOREIGN KEY (reported_by_id) REFERENCES public.users(id)
);
CREATE TABLE public.partners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nickname text NOT NULL,
  photo_url text,
  user_id uuid NOT NULL,
  group_id uuid NOT NULL,
  financial_total integer DEFAULT 0,
  time_total integer DEFAULT 0,
  intimacy_score integer DEFAULT 5 CHECK (intimacy_score >= 0 AND intimacy_score <= 10),
  status text DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  last_updated_at timestamp with time zone DEFAULT now(),
  cause_of_death text,
  cause_of_death_custom text,
  graveyard_date timestamp with time zone,
  CONSTRAINT partners_pkey PRIMARY KEY (id),
  CONSTRAINT partners_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT partners_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id)
);
CREATE TABLE public.peer_validations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  group_id uuid NOT NULL,
  action_type text NOT NULL,
  action_description text NOT NULL,
  xp_amount integer NOT NULL,
  related_partner_id uuid,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  validators jsonb DEFAULT '[]'::jsonb,
  required_validations integer DEFAULT 2,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  CONSTRAINT peer_validations_pkey PRIMARY KEY (id),
  CONSTRAINT peer_validations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT peer_validations_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT peer_validations_related_partner_id_fkey FOREIGN KEY (related_partner_id) REFERENCES public.partners(id)
);
CREATE TABLE public.settlements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bet_id uuid NOT NULL,
  group_id uuid NOT NULL,
  payer_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'paid'::character varying, 'cancelled'::character varying]::text[])),
  marked_paid_at timestamp with time zone,
  marked_paid_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT settlements_pkey PRIMARY KEY (id),
  CONSTRAINT settlements_bet_id_fkey FOREIGN KEY (bet_id) REFERENCES public.bets(id),
  CONSTRAINT settlements_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT settlements_payer_id_fkey FOREIGN KEY (payer_id) REFERENCES public.users(id),
  CONSTRAINT settlements_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id),
  CONSTRAINT settlements_marked_paid_by_fkey FOREIGN KEY (marked_paid_by) REFERENCES public.users(id)
);
CREATE TABLE public.sticky_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  x numeric DEFAULT 0,
  y numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sticky_notes_pkey PRIMARY KEY (id),
  CONSTRAINT sticky_notes_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id),
  CONSTRAINT sticky_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id)
);
CREATE TABLE public.timeline_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type = ANY (ARRAY['date'::text, 'expense'::text, 'red_flag'::text, 'note'::text, 'intimacy'::text, 'status_change'::text, 'milestone'::text])),
  title text NOT NULL,
  description text,
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  amount numeric CHECK (amount >= 0::numeric),
  category text CHECK (category = ANY (ARRAY['Dining'::text, 'Entertainment'::text, 'Gifts'::text, 'Travel'::text, 'Shopping'::text, 'Activities'::text, 'Other'::text])),
  severity text CHECK (severity = ANY (ARRAY['Low'::text, 'Medium'::text, 'High'::text, 'Critical'::text])),
  intimacy_change integer CHECK (intimacy_change >= '-10'::integer AND intimacy_change <= 10),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT timeline_events_pkey PRIMARY KEY (id),
  CONSTRAINT timeline_events_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  username text NOT NULL,
  avatar_url text,
  current_xp integer DEFAULT 0,
  level integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  streak_count integer DEFAULT 0,
  last_activity_date date,
  total_xp_earned integer DEFAULT 0,
  bet_currency integer DEFAULT 1000,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.wagers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bet_id uuid NOT NULL,
  user_id uuid NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  prediction jsonb NOT NULL,
  odds_at_placement numeric NOT NULL,
  potential_payout integer NOT NULL,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'won'::character varying, 'lost'::character varying, 'cancelled'::character varying]::text[])),
  payout_amount integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wagers_pkey PRIMARY KEY (id),
  CONSTRAINT wagers_bet_id_fkey FOREIGN KEY (bet_id) REFERENCES public.bets(id),
  CONSTRAINT wagers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.weekly_system_bets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  bets_generated integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT weekly_system_bets_pkey PRIMARY KEY (id),
  CONSTRAINT weekly_system_bets_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id)
);
CREATE TABLE public.xp_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  group_id uuid NOT NULL,
  amount integer NOT NULL,
  reason text NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['milestone'::text, 'consistency'::text, 'social'::text, 'performance'::text, 'red_flag'::text, 'achievement'::text])),
  related_partner_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT xp_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT xp_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT xp_transactions_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT xp_transactions_related_partner_id_fkey FOREIGN KEY (related_partner_id) REFERENCES public.partners(id)
);