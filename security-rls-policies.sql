-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Relationship War Room - Security Update
-- =====================================================
-- WICHTIG: Dieses Script in Supabase SQL Editor ausfuehren!
-- =====================================================

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if a user is member of a group
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user is admin of a group
CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id
    AND user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get partner's group_id (legacy - may be null for global partners)
CREATE OR REPLACE FUNCTION public.get_partner_group(p_partner_id uuid)
RETURNS uuid AS $$
DECLARE
  v_group_id uuid;
BEGIN
  SELECT group_id INTO v_group_id FROM public.partners WHERE id = p_partner_id;
  RETURN v_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user shares any group with partner owner
-- Partners are GLOBAL - visible to all users who share a group with the owner
CREATE OR REPLACE FUNCTION public.shares_group_with_partner_owner(p_partner_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.partners p
    JOIN public.group_members gm1 ON gm1.user_id = p.user_id
    JOIN public.group_members gm2 ON gm2.group_id = gm1.group_id
    WHERE p.id = p_partner_id
    AND gm2.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get partner owner's user_id
CREATE OR REPLACE FUNCTION public.get_partner_owner(p_partner_id uuid)
RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id FROM public.partners WHERE id = p_partner_id;
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns a partner
CREATE OR REPLACE FUNCTION public.owns_partner(p_partner_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.partners
    WHERE id = p_partner_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticky_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_note_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_red_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wagers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_bet_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_master_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_system_bets ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DROP EXISTING POLICIES (falls vorhanden)
-- =====================================================

-- Users
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_group_members" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

-- Groups
DROP POLICY IF EXISTS "groups_select_member" ON public.groups;
DROP POLICY IF EXISTS "groups_select_by_invite" ON public.groups;
DROP POLICY IF EXISTS "groups_insert_authenticated" ON public.groups;
DROP POLICY IF EXISTS "groups_update_admin" ON public.groups;

-- Group Members
DROP POLICY IF EXISTS "group_members_select" ON public.group_members;
DROP POLICY IF EXISTS "group_members_insert" ON public.group_members;
DROP POLICY IF EXISTS "group_members_delete_self" ON public.group_members;
DROP POLICY IF EXISTS "group_members_delete_admin" ON public.group_members;

-- Partners
DROP POLICY IF EXISTS "partners_select_group" ON public.partners;
DROP POLICY IF EXISTS "partners_select_own" ON public.partners;
DROP POLICY IF EXISTS "partners_select_shared_group" ON public.partners;
DROP POLICY IF EXISTS "partners_insert_own" ON public.partners;
DROP POLICY IF EXISTS "partners_update_own" ON public.partners;
DROP POLICY IF EXISTS "partners_delete_own" ON public.partners;

-- Timeline Events
DROP POLICY IF EXISTS "timeline_select_group" ON public.timeline_events;
DROP POLICY IF EXISTS "timeline_insert_own_partner" ON public.timeline_events;
DROP POLICY IF EXISTS "timeline_update_own_partner" ON public.timeline_events;
DROP POLICY IF EXISTS "timeline_delete_own_partner" ON public.timeline_events;

-- Sticky Notes
DROP POLICY IF EXISTS "sticky_select_group" ON public.sticky_notes;
DROP POLICY IF EXISTS "sticky_insert_group" ON public.sticky_notes;
DROP POLICY IF EXISTS "sticky_update_own" ON public.sticky_notes;
DROP POLICY IF EXISTS "sticky_delete_own" ON public.sticky_notes;

-- Partner Notes
DROP POLICY IF EXISTS "partner_notes_select_group" ON public.partner_notes;
DROP POLICY IF EXISTS "partner_notes_insert_group" ON public.partner_notes;
DROP POLICY IF EXISTS "partner_notes_update_own" ON public.partner_notes;
DROP POLICY IF EXISTS "partner_notes_delete_own" ON public.partner_notes;

-- Partner Note Votes
DROP POLICY IF EXISTS "note_votes_select_group" ON public.partner_note_votes;
DROP POLICY IF EXISTS "note_votes_insert" ON public.partner_note_votes;
DROP POLICY IF EXISTS "note_votes_update_own" ON public.partner_note_votes;
DROP POLICY IF EXISTS "note_votes_delete_own" ON public.partner_note_votes;

-- Partner Ratings
DROP POLICY IF EXISTS "ratings_select_group" ON public.partner_ratings;
DROP POLICY IF EXISTS "ratings_insert_group" ON public.partner_ratings;
DROP POLICY IF EXISTS "ratings_update_own" ON public.partner_ratings;
DROP POLICY IF EXISTS "ratings_delete_own" ON public.partner_ratings;

-- Partner Red Flags
DROP POLICY IF EXISTS "red_flags_select_group" ON public.partner_red_flags;
DROP POLICY IF EXISTS "red_flags_insert_group" ON public.partner_red_flags;
DROP POLICY IF EXISTS "red_flags_update_own" ON public.partner_red_flags;
DROP POLICY IF EXISTS "red_flags_delete_own" ON public.partner_red_flags;

-- Partner Images
DROP POLICY IF EXISTS "images_select_group" ON public.partner_images;
DROP POLICY IF EXISTS "images_insert_own_partner" ON public.partner_images;
DROP POLICY IF EXISTS "images_delete_own_partner" ON public.partner_images;

-- Assets
DROP POLICY IF EXISTS "assets_select_group" ON public.assets;
DROP POLICY IF EXISTS "assets_insert_own_partner" ON public.assets;
DROP POLICY IF EXISTS "assets_update_own_partner" ON public.assets;
DROP POLICY IF EXISTS "assets_delete_own_partner" ON public.assets;

-- XP Transactions
DROP POLICY IF EXISTS "xp_select_own" ON public.xp_transactions;
DROP POLICY IF EXISTS "xp_select_group" ON public.xp_transactions;
DROP POLICY IF EXISTS "xp_insert" ON public.xp_transactions;

-- Peer Validations
DROP POLICY IF EXISTS "validations_select_group" ON public.peer_validations;
DROP POLICY IF EXISTS "validations_insert" ON public.peer_validations;
DROP POLICY IF EXISTS "validations_update_group" ON public.peer_validations;

-- Achievements
DROP POLICY IF EXISTS "achievements_select_own" ON public.achievements;
DROP POLICY IF EXISTS "achievements_insert" ON public.achievements;

-- Bets
DROP POLICY IF EXISTS "bets_select_group" ON public.bets;
DROP POLICY IF EXISTS "bets_insert_group" ON public.bets;
DROP POLICY IF EXISTS "bets_update_creator_or_betmaster" ON public.bets;

-- Wagers
DROP POLICY IF EXISTS "wagers_select_group" ON public.wagers;
DROP POLICY IF EXISTS "wagers_insert_group" ON public.wagers;
DROP POLICY IF EXISTS "wagers_update_own" ON public.wagers;

-- Bet Odds
DROP POLICY IF EXISTS "odds_select_group" ON public.bet_odds;
DROP POLICY IF EXISTS "odds_insert_own" ON public.bet_odds;

-- Bet Transactions
DROP POLICY IF EXISTS "bet_tx_select_own" ON public.bet_transactions;
DROP POLICY IF EXISTS "bet_tx_insert" ON public.bet_transactions;

-- Settlements
DROP POLICY IF EXISTS "settlements_select_involved" ON public.settlements;
DROP POLICY IF EXISTS "settlements_update_involved" ON public.settlements;

-- Group Bet Master
DROP POLICY IF EXISTS "bet_master_select_group" ON public.group_bet_master;
DROP POLICY IF EXISTS "bet_master_insert" ON public.group_bet_master;
DROP POLICY IF EXISTS "bet_master_update" ON public.group_bet_master;

-- Bet Master Votes
DROP POLICY IF EXISTS "votes_select_group" ON public.bet_master_votes;
DROP POLICY IF EXISTS "votes_insert" ON public.bet_master_votes;
DROP POLICY IF EXISTS "votes_update_own" ON public.bet_master_votes;

-- Weekly System Bets
DROP POLICY IF EXISTS "weekly_bets_select_group" ON public.weekly_system_bets;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = auth.uid());

-- Users can view profiles of users in their groups
CREATE POLICY "users_select_group_members" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
      AND gm2.user_id = users.id
    )
  );

-- Users can insert their own profile (for signup)
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

-- Users can only update their own profile
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- =====================================================
-- GROUPS TABLE POLICIES
-- =====================================================

-- Members can view their groups
CREATE POLICY "groups_select_member" ON public.groups
  FOR SELECT USING (is_group_member(id));

-- Anyone can search groups by invite code (for joining)
CREATE POLICY "groups_select_by_invite" ON public.groups
  FOR SELECT USING (true);

-- Authenticated users can create groups
CREATE POLICY "groups_insert_authenticated" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins can update group settings
CREATE POLICY "groups_update_admin" ON public.groups
  FOR UPDATE USING (is_group_admin(id))
  WITH CHECK (is_group_admin(id));

-- =====================================================
-- GROUP MEMBERS TABLE POLICIES
-- =====================================================

-- Members can see other members in their groups
CREATE POLICY "group_members_select" ON public.group_members
  FOR SELECT USING (is_group_member(group_id));

-- Users can join groups (insert themselves)
CREATE POLICY "group_members_insert" ON public.group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can leave groups (delete themselves)
CREATE POLICY "group_members_delete_self" ON public.group_members
  FOR DELETE USING (user_id = auth.uid());

-- Admins can remove members
CREATE POLICY "group_members_delete_admin" ON public.group_members
  FOR DELETE USING (is_group_admin(group_id));

-- =====================================================
-- PARTNERS TABLE POLICIES
-- Partners are GLOBAL - they belong to a USER, not a group
-- They are visible to all users who share ANY group with the owner
-- =====================================================

-- Users can view their own partners
CREATE POLICY "partners_select_own" ON public.partners
  FOR SELECT USING (user_id = auth.uid());

-- Users can view partners of users they share a group with
CREATE POLICY "partners_select_shared_group" ON public.partners
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = partners.user_id
      AND gm2.user_id = auth.uid()
    )
  );

-- Users can only create partners for themselves
-- group_id is optional/legacy - user just needs to be authenticated
CREATE POLICY "partners_insert_own" ON public.partners
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Users can only update their own partners
CREATE POLICY "partners_update_own" ON public.partners
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can only delete their own partners
CREATE POLICY "partners_delete_own" ON public.partners
  FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- TIMELINE EVENTS TABLE POLICIES
-- Timeline events are visible if user can see the partner (global model)
-- =====================================================

-- Users can view timeline events if they share a group with the partner owner
CREATE POLICY "timeline_select_group" ON public.timeline_events
  FOR SELECT USING (
    shares_group_with_partner_owner(partner_id)
  );

-- Users can only add events to their own partners
CREATE POLICY "timeline_insert_own_partner" ON public.timeline_events
  FOR INSERT WITH CHECK (owns_partner(partner_id));

-- Users can only update events on their own partners
CREATE POLICY "timeline_update_own_partner" ON public.timeline_events
  FOR UPDATE USING (owns_partner(partner_id))
  WITH CHECK (owns_partner(partner_id));

-- Users can only delete events on their own partners
CREATE POLICY "timeline_delete_own_partner" ON public.timeline_events
  FOR DELETE USING (owns_partner(partner_id));

-- =====================================================
-- STICKY NOTES TABLE POLICIES
-- Sticky notes are visible if user can see the partner (global model)
-- =====================================================

-- Users can view sticky notes if they share a group with the partner owner
CREATE POLICY "sticky_select_group" ON public.sticky_notes
  FOR SELECT USING (
    shares_group_with_partner_owner(partner_id)
  );

-- Users can add sticky notes to partners they can see
CREATE POLICY "sticky_insert_group" ON public.sticky_notes
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND shares_group_with_partner_owner(partner_id)
  );

-- Users can only update their own sticky notes
CREATE POLICY "sticky_update_own" ON public.sticky_notes
  FOR UPDATE USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Users can only delete their own sticky notes
CREATE POLICY "sticky_delete_own" ON public.sticky_notes
  FOR DELETE USING (author_id = auth.uid());

-- =====================================================
-- PARTNER NOTES TABLE POLICIES
-- Notes are visible if user can see the partner (global model)
-- =====================================================

-- Users can view notes if they share a group with the partner owner
CREATE POLICY "partner_notes_select_group" ON public.partner_notes
  FOR SELECT USING (
    shares_group_with_partner_owner(partner_id)
  );

-- Users can add notes to partners they can see
CREATE POLICY "partner_notes_insert_group" ON public.partner_notes
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND shares_group_with_partner_owner(partner_id)
  );

-- Users can only update their own notes
CREATE POLICY "partner_notes_update_own" ON public.partner_notes
  FOR UPDATE USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Users can only delete their own notes
CREATE POLICY "partner_notes_delete_own" ON public.partner_notes
  FOR DELETE USING (author_id = auth.uid());

-- =====================================================
-- PARTNER NOTE VOTES TABLE POLICIES
-- Votes are visible if user can see the note's partner (global model)
-- =====================================================

-- Users can see votes on notes they can view
CREATE POLICY "note_votes_select_group" ON public.partner_note_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partner_notes pn
      WHERE pn.id = note_id
      AND shares_group_with_partner_owner(pn.partner_id)
    )
  );

-- Users can vote on notes they can view
CREATE POLICY "note_votes_insert" ON public.partner_note_votes
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.partner_notes pn
      WHERE pn.id = note_id
      AND shares_group_with_partner_owner(pn.partner_id)
    )
  );

-- Users can update their own votes
CREATE POLICY "note_votes_update_own" ON public.partner_note_votes
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own votes
CREATE POLICY "note_votes_delete_own" ON public.partner_note_votes
  FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- PARTNER RATINGS TABLE POLICIES
-- Ratings are visible if user can see the partner (global model)
-- =====================================================

-- Users can view ratings if they share a group with the partner owner
CREATE POLICY "ratings_select_group" ON public.partner_ratings
  FOR SELECT USING (
    shares_group_with_partner_owner(partner_id)
  );

-- Users can rate partners they can see (not their own)
CREATE POLICY "ratings_insert_group" ON public.partner_ratings
  FOR INSERT WITH CHECK (
    rater_id = auth.uid()
    AND shares_group_with_partner_owner(partner_id)
    AND NOT owns_partner(partner_id)
  );

-- Users can update their own ratings
CREATE POLICY "ratings_update_own" ON public.partner_ratings
  FOR UPDATE USING (rater_id = auth.uid())
  WITH CHECK (rater_id = auth.uid());

-- Users can delete their own ratings
CREATE POLICY "ratings_delete_own" ON public.partner_ratings
  FOR DELETE USING (rater_id = auth.uid());

-- =====================================================
-- PARTNER RED FLAGS TABLE POLICIES
-- Red flags are visible if user can see the partner (global model)
-- =====================================================

-- Users can view red flags if they share a group with the partner owner
CREATE POLICY "red_flags_select_group" ON public.partner_red_flags
  FOR SELECT USING (
    shares_group_with_partner_owner(partner_id)
  );

-- Users can report red flags on partners they can see
CREATE POLICY "red_flags_insert_group" ON public.partner_red_flags
  FOR INSERT WITH CHECK (
    reported_by_id = auth.uid()
    AND shares_group_with_partner_owner(partner_id)
  );

-- Users can update their own red flag reports
CREATE POLICY "red_flags_update_own" ON public.partner_red_flags
  FOR UPDATE USING (reported_by_id = auth.uid())
  WITH CHECK (reported_by_id = auth.uid());

-- Users can delete their own red flag reports
CREATE POLICY "red_flags_delete_own" ON public.partner_red_flags
  FOR DELETE USING (reported_by_id = auth.uid());

-- =====================================================
-- PARTNER IMAGES TABLE POLICIES
-- Images are visible if user can see the partner (global model)
-- =====================================================

-- Users can view images if they share a group with the partner owner
CREATE POLICY "images_select_group" ON public.partner_images
  FOR SELECT USING (
    shares_group_with_partner_owner(partner_id)
  );

-- Users can only add images to their own partners
CREATE POLICY "images_insert_own_partner" ON public.partner_images
  FOR INSERT WITH CHECK (owns_partner(partner_id));

-- Users can only delete images from their own partners
CREATE POLICY "images_delete_own_partner" ON public.partner_images
  FOR DELETE USING (owns_partner(partner_id));

-- =====================================================
-- ASSETS TABLE POLICIES
-- Assets are visible if user can see the partner (global model)
-- =====================================================

-- Users can view assets if they share a group with the partner owner
CREATE POLICY "assets_select_group" ON public.assets
  FOR SELECT USING (
    shares_group_with_partner_owner(partner_id)
  );

-- Users can only add assets to their own partners
CREATE POLICY "assets_insert_own_partner" ON public.assets
  FOR INSERT WITH CHECK (owns_partner(partner_id));

-- Users can only update assets on their own partners
CREATE POLICY "assets_update_own_partner" ON public.assets
  FOR UPDATE USING (owns_partner(partner_id))
  WITH CHECK (owns_partner(partner_id));

-- Users can only delete assets from their own partners
CREATE POLICY "assets_delete_own_partner" ON public.assets
  FOR DELETE USING (owns_partner(partner_id));

-- =====================================================
-- XP TRANSACTIONS TABLE POLICIES
-- =====================================================

-- Users can view their own XP transactions
CREATE POLICY "xp_select_own" ON public.xp_transactions
  FOR SELECT USING (user_id = auth.uid());

-- Group members can view XP transactions in their group (for leaderboards)
CREATE POLICY "xp_select_group" ON public.xp_transactions
  FOR SELECT USING (is_group_member(group_id));

-- XP can only be inserted by authenticated users for themselves
-- NOTE: This should be restricted to server-side only in production
CREATE POLICY "xp_insert" ON public.xp_transactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND is_group_member(group_id)
  );

-- =====================================================
-- PEER VALIDATIONS TABLE POLICIES
-- =====================================================

-- Group members can view validation requests in their group
CREATE POLICY "validations_select_group" ON public.peer_validations
  FOR SELECT USING (is_group_member(group_id));

-- Users can create validation requests for themselves
CREATE POLICY "validations_insert" ON public.peer_validations
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND is_group_member(group_id)
  );

-- Group members can update validations (to approve/reject)
-- The validators array is checked in application logic
CREATE POLICY "validations_update_group" ON public.peer_validations
  FOR UPDATE USING (is_group_member(group_id))
  WITH CHECK (is_group_member(group_id));

-- =====================================================
-- ACHIEVEMENTS TABLE POLICIES
-- =====================================================

-- Users can view their own achievements
CREATE POLICY "achievements_select_own" ON public.achievements
  FOR SELECT USING (user_id = auth.uid());

-- Achievements are inserted by system (but user must be authenticated)
CREATE POLICY "achievements_insert" ON public.achievements
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- BETS TABLE POLICIES (Lesen erlaubt, Modifikation eingeschraenkt)
-- =====================================================

-- Group members can view bets in their group
CREATE POLICY "bets_select_group" ON public.bets
  FOR SELECT USING (is_group_member(group_id));

-- Group members can create bets in their group
CREATE POLICY "bets_insert_group" ON public.bets
  FOR INSERT WITH CHECK (
    creator_id = auth.uid()
    AND is_group_member(group_id)
  );

-- Only bet creator or bet master can update bets
CREATE POLICY "bets_update_creator_or_betmaster" ON public.bets
  FOR UPDATE USING (
    creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_bet_master
      WHERE group_id = bets.group_id
      AND user_id = auth.uid()
    )
  );

-- =====================================================
-- WAGERS TABLE POLICIES
-- =====================================================

-- Group members can view wagers on bets in their group
CREATE POLICY "wagers_select_group" ON public.wagers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bets b
      WHERE b.id = bet_id
      AND is_group_member(b.group_id)
    )
  );

-- Users can place wagers on bets in their group
CREATE POLICY "wagers_insert_group" ON public.wagers
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.bets b
      WHERE b.id = bet_id
      AND is_group_member(b.group_id)
      AND b.status = 'open'
    )
  );

-- Users can only update their own wagers (limited cases)
CREATE POLICY "wagers_update_own" ON public.wagers
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- BET ODDS TABLE POLICIES
-- =====================================================

-- Group members can view odds on bets in their group
CREATE POLICY "odds_select_group" ON public.bet_odds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bets b
      WHERE b.id = bet_id
      AND is_group_member(b.group_id)
    )
  );

-- Users can submit their own odds
CREATE POLICY "odds_insert_own" ON public.bet_odds
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- BET TRANSACTIONS TABLE POLICIES
-- =====================================================

-- Users can only view their own bet transactions
CREATE POLICY "bet_tx_select_own" ON public.bet_transactions
  FOR SELECT USING (user_id = auth.uid());

-- Bet transactions are system-managed
CREATE POLICY "bet_tx_insert" ON public.bet_transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- SETTLEMENTS TABLE POLICIES
-- =====================================================

-- Users can view settlements where they are payer or receiver
CREATE POLICY "settlements_select_involved" ON public.settlements
  FOR SELECT USING (
    payer_id = auth.uid()
    OR receiver_id = auth.uid()
    OR is_group_member(group_id)
  );

-- Only involved parties can update settlement status
CREATE POLICY "settlements_update_involved" ON public.settlements
  FOR UPDATE USING (
    payer_id = auth.uid()
    OR receiver_id = auth.uid()
  );

-- =====================================================
-- GROUP BET MASTER TABLE POLICIES
-- =====================================================

-- Group members can view the bet master
CREATE POLICY "bet_master_select_group" ON public.group_bet_master
  FOR SELECT USING (is_group_member(group_id));

-- System managed - require admin for changes
CREATE POLICY "bet_master_insert" ON public.group_bet_master
  FOR INSERT WITH CHECK (is_group_admin(group_id));

CREATE POLICY "bet_master_update" ON public.group_bet_master
  FOR UPDATE USING (is_group_admin(group_id));

-- =====================================================
-- BET MASTER VOTES TABLE POLICIES
-- =====================================================

-- Group members can view votes in their group
CREATE POLICY "votes_select_group" ON public.bet_master_votes
  FOR SELECT USING (is_group_member(group_id));

-- Users can cast votes in their group (one vote per user)
CREATE POLICY "votes_insert" ON public.bet_master_votes
  FOR INSERT WITH CHECK (
    voter_id = auth.uid()
    AND is_group_member(group_id)
  );

-- Users can change their own vote
CREATE POLICY "votes_update_own" ON public.bet_master_votes
  FOR UPDATE USING (voter_id = auth.uid())
  WITH CHECK (voter_id = auth.uid());

-- =====================================================
-- WEEKLY SYSTEM BETS TABLE POLICIES
-- =====================================================

-- Group members can view weekly bet status
CREATE POLICY "weekly_bets_select_group" ON public.weekly_system_bets
  FOR SELECT USING (is_group_member(group_id));

-- =====================================================
-- ADDITIONAL SECURITY TRIGGERS
-- =====================================================

-- Trigger to prevent users from validating their own actions
CREATE OR REPLACE FUNCTION public.check_self_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if any validator in the new validators array is the action owner
  IF NEW.user_id = ANY(
    SELECT jsonb_array_elements_text(NEW.validators::jsonb)::uuid
  ) THEN
    RAISE EXCEPTION 'Cannot validate your own action';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_self_validation ON public.peer_validations;
CREATE TRIGGER prevent_self_validation
  BEFORE UPDATE ON public.peer_validations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_self_validation();

-- Trigger to ensure XP transactions are for valid group members
CREATE OR REPLACE FUNCTION public.check_xp_group_membership()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = NEW.group_id
    AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'User is not a member of this group';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_xp_group_membership ON public.xp_transactions;
CREATE TRIGGER validate_xp_group_membership
  BEFORE INSERT ON public.xp_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_xp_group_membership();

-- Trigger to prevent partner ownership changes
CREATE OR REPLACE FUNCTION public.prevent_partner_ownership_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'Cannot change partner ownership';
  END IF;
  IF OLD.group_id != NEW.group_id THEN
    RAISE EXCEPTION 'Cannot move partner to different group';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_partner_ownership_change ON public.partners;
CREATE TRIGGER prevent_partner_ownership_change
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_partner_ownership_change();

-- =====================================================
-- SECURE THE add_xp_to_user FUNCTION
-- =====================================================

-- Drop existing function if exists and recreate with security checks
CREATE OR REPLACE FUNCTION public.add_xp_to_user(
  p_user_id uuid,
  p_amount integer
)
RETURNS TABLE(new_xp integer, new_level integer, leveled_up boolean) AS $$
DECLARE
  v_current_xp integer;
  v_current_level integer;
  v_new_xp integer;
  v_new_level integer;
  v_xp_for_next_level integer;
  v_leveled_up boolean := false;
BEGIN
  -- Security check: Only allow user to add XP to themselves
  -- or allow if called from a trusted context (service role)
  IF p_user_id != auth.uid() AND current_setting('role', true) != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Can only modify own XP';
  END IF;

  -- Validate amount (prevent negative XP gaming)
  IF p_amount < -100 OR p_amount > 1000 THEN
    RAISE EXCEPTION 'Invalid XP amount: must be between -100 and 1000';
  END IF;

  -- Get current user stats
  SELECT current_xp, level INTO v_current_xp, v_current_level
  FROM public.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Calculate new XP (ensure it doesn't go below 0)
  v_new_xp := GREATEST(0, v_current_xp + p_amount);
  v_new_level := v_current_level;

  -- Level up calculation (100 XP per level, scaling)
  v_xp_for_next_level := v_current_level * 100;

  WHILE v_new_xp >= v_xp_for_next_level LOOP
    v_new_xp := v_new_xp - v_xp_for_next_level;
    v_new_level := v_new_level + 1;
    v_leveled_up := true;
    v_xp_for_next_level := v_new_level * 100;
  END LOOP;

  -- Update user
  UPDATE public.users
  SET
    current_xp = v_new_xp,
    level = v_new_level,
    total_xp_earned = total_xp_earned + GREATEST(0, p_amount)
  WHERE id = p_user_id;

  RETURN QUERY SELECT v_new_xp, v_new_level, v_leveled_up;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PROPER PERMISSIONS
-- =====================================================

-- Revoke all from public, grant to authenticated users
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Allow anon to read groups (for invite code lookup)
GRANT SELECT ON public.groups TO anon;

-- =====================================================
-- VERIFICATION QUERIES (run these to check policies)
-- =====================================================

-- List all RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- Check RLS is enabled on all tables
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public';

COMMIT;
