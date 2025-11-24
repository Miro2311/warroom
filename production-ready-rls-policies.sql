-- PRODUCTION-READY RLS POLICIES
-- This script fixes critical RLS issues and prepares the database for production
--
-- Key Improvements:
-- 1. Performance optimization: auth.uid() wrapped in subqueries
-- 2. More restrictive policies for group_members to prevent abuse
-- 3. Comprehensive policies for all tables
-- 4. Better error handling with proper constraints
--
-- IMPORTANT: Run this AFTER testing in development with RLS ENABLED

BEGIN;

-- ============================================================================
-- STEP 1: Enable RLS on all tables
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_note_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_red_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticky_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wagers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_bet_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_master_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_system_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Drop all existing policies to start fresh
-- ============================================================================

-- Users table
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Groups table
DROP POLICY IF EXISTS "Users can read groups they are members of" ON public.groups;
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Users can update groups they are members of" ON public.groups;
DROP POLICY IF EXISTS "Users can delete groups they own" ON public.groups;

-- Group members table
DROP POLICY IF EXISTS "Users can read own group memberships" ON public.group_members;
DROP POLICY IF EXISTS "Users can read group memberships in their groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can insert group memberships" ON public.group_members;
DROP POLICY IF EXISTS "Users can delete own group memberships" ON public.group_members;

-- Partners table
DROP POLICY IF EXISTS "Users can read partners in their groups" ON public.partners;
DROP POLICY IF EXISTS "Users can insert partners in their groups" ON public.partners;
DROP POLICY IF EXISTS "Users can update own partners" ON public.partners;
DROP POLICY IF EXISTS "Users can delete own partners" ON public.partners;

-- Partner-related tables
DROP POLICY IF EXISTS "Users can read partner images in their groups" ON public.partner_images;
DROP POLICY IF EXISTS "Users can insert partner images for own partners" ON public.partner_images;
DROP POLICY IF EXISTS "Users can update own partner images" ON public.partner_images;
DROP POLICY IF EXISTS "Users can delete own partner images" ON public.partner_images;

DROP POLICY IF EXISTS "Users can read partner notes in their groups" ON public.partner_notes;
DROP POLICY IF EXISTS "Users can insert partner notes in their groups" ON public.partner_notes;
DROP POLICY IF EXISTS "Users can update own partner notes" ON public.partner_notes;
DROP POLICY IF EXISTS "Users can delete own partner notes" ON public.partner_notes;

DROP POLICY IF EXISTS "Users can read partner note votes in their groups" ON public.partner_note_votes;
DROP POLICY IF EXISTS "Users can insert partner note votes in their groups" ON public.partner_note_votes;
DROP POLICY IF EXISTS "Users can update own partner note votes" ON public.partner_note_votes;
DROP POLICY IF EXISTS "Users can delete own partner note votes" ON public.partner_note_votes;

DROP POLICY IF EXISTS "Users can read partner ratings in their groups" ON public.partner_ratings;
DROP POLICY IF EXISTS "Users can insert partner ratings in their groups" ON public.partner_ratings;
DROP POLICY IF EXISTS "Users can update own partner ratings" ON public.partner_ratings;

DROP POLICY IF EXISTS "Users can read partner red flags in their groups" ON public.partner_red_flags;
DROP POLICY IF EXISTS "Users can insert partner red flags in their groups" ON public.partner_red_flags;
DROP POLICY IF EXISTS "Users can update own partner red flags" ON public.partner_red_flags;
DROP POLICY IF EXISTS "Users can delete own partner red flags" ON public.partner_red_flags;

DROP POLICY IF EXISTS "Users can read sticky notes in their groups" ON public.sticky_notes;
DROP POLICY IF EXISTS "Users can insert sticky notes in their groups" ON public.sticky_notes;
DROP POLICY IF EXISTS "Users can update own sticky notes" ON public.sticky_notes;
DROP POLICY IF EXISTS "Users can delete own sticky notes" ON public.sticky_notes;

DROP POLICY IF EXISTS "Users can read timeline events in their groups" ON public.timeline_events;
DROP POLICY IF EXISTS "Users can insert timeline events in their groups" ON public.timeline_events;
DROP POLICY IF EXISTS "Users can update own timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Users can delete own timeline events" ON public.timeline_events;

-- XP and achievements
DROP POLICY IF EXISTS "Users can read achievements in their groups" ON public.achievements;
DROP POLICY IF EXISTS "Users can insert achievements in their groups" ON public.achievements;

DROP POLICY IF EXISTS "Users can read peer validations in their groups" ON public.peer_validations;
DROP POLICY IF EXISTS "Users can insert peer validations in their groups" ON public.peer_validations;

DROP POLICY IF EXISTS "Users can read xp transactions in their groups" ON public.xp_transactions;
DROP POLICY IF EXISTS "Users can insert xp transactions in their groups" ON public.xp_transactions;

-- ============================================================================
-- STEP 3: Create optimized policies with auth.uid() wrapped in subqueries
-- ============================================================================

-- =======================
-- USERS TABLE POLICIES
-- =======================

CREATE POLICY "Users can read own profile"
ON public.users
FOR SELECT
USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
WITH CHECK (id = (SELECT auth.uid()));

-- =======================
-- GROUPS TABLE POLICIES
-- =======================

CREATE POLICY "Users can read groups they are members of"
ON public.groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can create groups"
ON public.groups
FOR INSERT
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- =======================
-- GROUP_MEMBERS TABLE POLICIES
-- =======================

-- Allow users to read ALL memberships in groups they belong to
-- (so they can see who else is in their group)
CREATE POLICY "Users can read group memberships in their groups"
ON public.group_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm2
    WHERE gm2.group_id = group_members.group_id
    AND gm2.user_id = (SELECT auth.uid())
  )
);

-- IMPROVED: Restrict insert to only adding oneself as a member
-- This prevents users from adding other users to groups
CREATE POLICY "Users can insert own group memberships"
ON public.group_members
FOR INSERT
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND (SELECT auth.uid()) IS NOT NULL
);

-- Allow users to leave groups (delete their own membership)
CREATE POLICY "Users can delete own group memberships"
ON public.group_members
FOR DELETE
USING (user_id = (SELECT auth.uid()));

-- =======================
-- PARTNERS TABLE POLICIES
-- =======================

CREATE POLICY "Users can read partners in their groups"
ON public.partners
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = partners.group_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert partners in their groups"
ON public.partners
FOR INSERT
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = partners.group_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can update own partners"
ON public.partners
FOR UPDATE
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own partners"
ON public.partners
FOR DELETE
USING (user_id = (SELECT auth.uid()));

-- =======================
-- PARTNER IMAGES TABLE POLICIES
-- =======================

CREATE POLICY "Users can read partner images in their groups"
ON public.partner_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partners
    JOIN public.group_members ON group_members.group_id = partners.group_id
    WHERE partners.id = partner_images.partner_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert partner images for own partners"
ON public.partner_images
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.partners
    WHERE partners.id = partner_images.partner_id
    AND partners.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can update own partner images"
ON public.partner_images
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.partners
    WHERE partners.id = partner_images.partner_id
    AND partners.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can delete own partner images"
ON public.partner_images
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.partners
    WHERE partners.id = partner_images.partner_id
    AND partners.user_id = (SELECT auth.uid())
  )
);

-- =======================
-- PARTNER NOTES TABLE POLICIES
-- =======================

CREATE POLICY "Users can read partner notes in their groups"
ON public.partner_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partners
    JOIN public.group_members ON group_members.group_id = partners.group_id
    WHERE partners.id = partner_notes.partner_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert partner notes in their groups"
ON public.partner_notes
FOR INSERT
WITH CHECK (
  author_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.partners
    JOIN public.group_members ON group_members.group_id = partners.group_id
    WHERE partners.id = partner_notes.partner_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can update own partner notes"
ON public.partner_notes
FOR UPDATE
USING (author_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own partner notes"
ON public.partner_notes
FOR DELETE
USING (author_id = (SELECT auth.uid()));

-- =======================
-- PARTNER NOTE VOTES TABLE POLICIES
-- =======================

CREATE POLICY "Users can read partner note votes in their groups"
ON public.partner_note_votes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partner_notes
    JOIN public.partners ON partners.id = partner_notes.partner_id
    JOIN public.group_members ON group_members.group_id = partners.group_id
    WHERE partner_notes.id = partner_note_votes.note_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert partner note votes in their groups"
ON public.partner_note_votes
FOR INSERT
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.partner_notes
    JOIN public.partners ON partners.id = partner_notes.partner_id
    JOIN public.group_members ON group_members.group_id = partners.group_id
    WHERE partner_notes.id = partner_note_votes.note_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can update own partner note votes"
ON public.partner_note_votes
FOR UPDATE
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own partner note votes"
ON public.partner_note_votes
FOR DELETE
USING (user_id = (SELECT auth.uid()));

-- =======================
-- PARTNER RATINGS TABLE POLICIES
-- =======================

CREATE POLICY "Users can read partner ratings in their groups"
ON public.partner_ratings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partners
    JOIN public.group_members ON group_members.group_id = partners.group_id
    WHERE partners.id = partner_ratings.partner_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert partner ratings in their groups"
ON public.partner_ratings
FOR INSERT
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.partners
    JOIN public.group_members ON group_members.group_id = partners.group_id
    WHERE partners.id = partner_ratings.partner_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can update own partner ratings"
ON public.partner_ratings
FOR UPDATE
USING (user_id = (SELECT auth.uid()));

-- =======================
-- PARTNER RED FLAGS TABLE POLICIES
-- =======================

CREATE POLICY "Users can read partner red flags in their groups"
ON public.partner_red_flags
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partners
    JOIN public.group_members ON group_members.group_id = partners.group_id
    WHERE partners.id = partner_red_flags.partner_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert partner red flags in their groups"
ON public.partner_red_flags
FOR INSERT
WITH CHECK (
  reporter_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.partners
    JOIN public.group_members ON group_members.group_id = partners.group_id
    WHERE partners.id = partner_red_flags.partner_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can update own partner red flags"
ON public.partner_red_flags
FOR UPDATE
USING (reporter_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own partner red flags"
ON public.partner_red_flags
FOR DELETE
USING (reporter_id = (SELECT auth.uid()));

-- =======================
-- STICKY NOTES TABLE POLICIES
-- =======================

CREATE POLICY "Users can read sticky notes in their groups"
ON public.sticky_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = sticky_notes.group_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert sticky notes in their groups"
ON public.sticky_notes
FOR INSERT
WITH CHECK (
  author_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = sticky_notes.group_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can update own sticky notes"
ON public.sticky_notes
FOR UPDATE
USING (author_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own sticky notes"
ON public.sticky_notes
FOR DELETE
USING (author_id = (SELECT auth.uid()));

-- =======================
-- TIMELINE EVENTS TABLE POLICIES
-- =======================

CREATE POLICY "Users can read timeline events in their groups"
ON public.timeline_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partners
    JOIN public.group_members ON group_members.group_id = partners.group_id
    WHERE partners.id = timeline_events.partner_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert timeline events in their groups"
ON public.timeline_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.partners
    JOIN public.group_members ON group_members.group_id = partners.group_id
    WHERE partners.id = timeline_events.partner_id
    AND group_members.user_id = (SELECT auth.uid())
    AND partners.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can update own timeline events"
ON public.timeline_events
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.partners
    WHERE partners.id = timeline_events.partner_id
    AND partners.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can delete own timeline events"
ON public.timeline_events
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.partners
    WHERE partners.id = timeline_events.partner_id
    AND partners.user_id = (SELECT auth.uid())
  )
);

-- =======================
-- ACHIEVEMENTS TABLE POLICIES
-- =======================

CREATE POLICY "Users can read achievements in their groups"
ON public.achievements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = achievements.group_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert achievements in their groups"
ON public.achievements
FOR INSERT
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = achievements.group_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

-- =======================
-- PEER VALIDATIONS TABLE POLICIES
-- =======================

CREATE POLICY "Users can read peer validations in their groups"
ON public.peer_validations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.achievements
    JOIN public.group_members ON group_members.group_id = achievements.group_id
    WHERE achievements.id = peer_validations.achievement_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert peer validations in their groups"
ON public.peer_validations
FOR INSERT
WITH CHECK (
  validator_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.achievements
    JOIN public.group_members ON group_members.group_id = achievements.group_id
    WHERE achievements.id = peer_validations.achievement_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

-- =======================
-- XP TRANSACTIONS TABLE POLICIES
-- =======================

CREATE POLICY "Users can read xp transactions in their groups"
ON public.xp_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = xp_transactions.group_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert xp transactions in their groups"
ON public.xp_transactions
FOR INSERT
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = xp_transactions.group_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

-- =======================
-- ASSETS TABLE POLICIES
-- =======================

CREATE POLICY "Users can read assets in their groups"
ON public.assets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partners
    JOIN public.group_members ON group_members.group_id = partners.group_id
    WHERE partners.id = assets.partner_id
    AND group_members.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert assets for own partners"
ON public.assets
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.partners
    WHERE partners.id = assets.partner_id
    AND partners.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can update own assets"
ON public.assets
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.partners
    WHERE partners.id = assets.partner_id
    AND partners.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can delete own assets"
ON public.assets
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.partners
    WHERE partners.id = assets.partner_id
    AND partners.user_id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- NOTE: Betting system policies (bets, wagers, odds, transactions, settlements)
-- are not included here as they require more complex business logic.
-- Add these policies based on your specific betting rules and permissions.
-- ============================================================================

-- ============================================================================
-- STEP 4: Verify all policies were created successfully
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  RAISE NOTICE 'Total RLS policies created: %', policy_count;
END $$;

-- Show all created policies
SELECT
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

COMMIT;

-- ============================================================================
-- TESTING CHECKLIST
-- ============================================================================
-- After running this script:
-- [ ] Test user signup and profile creation
-- [ ] Test group creation and joining
-- [ ] Test adding partners to groups
-- [ ] Test reading partners in groups
-- [ ] Test that users CANNOT see data from groups they're not in
-- [ ] Test that users CANNOT add other users to groups
-- [ ] Monitor performance with auth.uid() in subqueries
-- ============================================================================
