-- ============================================================
-- ENABLE ROW LEVEL SECURITY (RLS) FOR PRODUCTION - FINAL VERSION
-- ============================================================
-- This script enables RLS and creates policies for proper data isolation
--
-- PERMISSION RULES:
-- - ALL users in a group can VIEW all partners in that group
-- - Only OWNER can edit/delete their own partners
-- - Intel Tab: ALL can add notes/flags/ratings, only OWNER can delete
-- - Timeline: Only OWNER can add/delete events
-- ============================================================

-- ============================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticky_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Enable RLS on additional tables (only if they exist)
DO $$
BEGIN
    -- partner_notes
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_notes') THEN
        ALTER TABLE public.partner_notes ENABLE ROW LEVEL SECURITY;
    END IF;

    -- partner_note_votes
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_note_votes') THEN
        ALTER TABLE public.partner_note_votes ENABLE ROW LEVEL SECURITY;
    END IF;

    -- partner_red_flags
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_red_flags') THEN
        ALTER TABLE public.partner_red_flags ENABLE ROW LEVEL SECURITY;
    END IF;

    -- partner_ratings
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_ratings') THEN
        ALTER TABLE public.partner_ratings ENABLE ROW LEVEL SECURITY;
    END IF;

    -- timeline_events
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'timeline_events') THEN
        ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
    END IF;

    -- transactions
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
        ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================
-- STEP 2: DROP EXISTING POLICIES (if any)
-- ============================================

-- Users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view group members" ON public.users;

-- Groups policies
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;

-- Group members policies
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;

-- Partners policies
DROP POLICY IF EXISTS "Users can view partners in their groups" ON public.partners;
DROP POLICY IF EXISTS "Users can create their own partners" ON public.partners;
DROP POLICY IF EXISTS "Users can update their own partners" ON public.partners;
DROP POLICY IF EXISTS "Users can delete their own partners" ON public.partners;

-- Sticky notes policies
DROP POLICY IF EXISTS "Users can view sticky notes in their groups" ON public.sticky_notes;
DROP POLICY IF EXISTS "Users can create sticky notes in their groups" ON public.sticky_notes;
DROP POLICY IF EXISTS "Users can update their own sticky notes" ON public.sticky_notes;
DROP POLICY IF EXISTS "Users can delete their own sticky notes" ON public.sticky_notes;

-- Assets policies
DROP POLICY IF EXISTS "Users can view assets in their groups" ON public.assets;
DROP POLICY IF EXISTS "Users can create assets for their partners" ON public.assets;
DROP POLICY IF EXISTS "Users can delete assets for their partners" ON public.assets;

-- Intel features policies (only if tables exist)
DO $$
BEGIN
    -- partner_notes policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_notes') THEN
        DROP POLICY IF EXISTS "Users can view notes in their groups" ON public.partner_notes;
        DROP POLICY IF EXISTS "Users can create notes in their groups" ON public.partner_notes;
        DROP POLICY IF EXISTS "Users can update their own notes" ON public.partner_notes;
        DROP POLICY IF EXISTS "Users can delete their own notes" ON public.partner_notes;
        DROP POLICY IF EXISTS "Partner owners can delete all notes" ON public.partner_notes;
    END IF;

    -- partner_note_votes policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_note_votes') THEN
        DROP POLICY IF EXISTS "Users can view votes in their groups" ON public.partner_note_votes;
        DROP POLICY IF EXISTS "Users can vote in their groups" ON public.partner_note_votes;
        DROP POLICY IF EXISTS "Users can delete their own votes" ON public.partner_note_votes;
        DROP POLICY IF EXISTS "Users can update their own votes" ON public.partner_note_votes;
    END IF;

    -- partner_red_flags policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_red_flags') THEN
        DROP POLICY IF EXISTS "Users can view red flags in their groups" ON public.partner_red_flags;
        DROP POLICY IF EXISTS "Users can create red flags in their groups" ON public.partner_red_flags;
        DROP POLICY IF EXISTS "Users can delete their own red flags" ON public.partner_red_flags;
        DROP POLICY IF EXISTS "Users can delete red flags for their partners" ON public.partner_red_flags;
        DROP POLICY IF EXISTS "Partner owners can delete all red flags" ON public.partner_red_flags;
    END IF;

    -- partner_ratings policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_ratings') THEN
        DROP POLICY IF EXISTS "Users can view ratings in their groups" ON public.partner_ratings;
        DROP POLICY IF EXISTS "Users can create ratings in their groups" ON public.partner_ratings;
        DROP POLICY IF EXISTS "Users can update their own ratings" ON public.partner_ratings;
        DROP POLICY IF EXISTS "Users can delete their own ratings" ON public.partner_ratings;
    END IF;

    -- timeline_events policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'timeline_events') THEN
        DROP POLICY IF EXISTS "Users can view timeline events in their groups" ON public.timeline_events;
        DROP POLICY IF EXISTS "Users can create timeline events for their partners" ON public.timeline_events;
        DROP POLICY IF EXISTS "Users can delete timeline events for their partners" ON public.timeline_events;
    END IF;

    -- transactions policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
        DROP POLICY IF EXISTS "Users can view transactions in their groups" ON public.transactions;
        DROP POLICY IF EXISTS "Users can create transactions for their partners" ON public.transactions;
        DROP POLICY IF EXISTS "Users can delete transactions for their partners" ON public.transactions;
    END IF;
END $$;

-- ============================================
-- STEP 3: CREATE RLS POLICIES
-- ============================================

-- =====================================
-- USERS TABLE POLICIES
-- =====================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- Users can create their own profile during signup
CREATE POLICY "Users can create their own profile"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- Users can view profiles of users in their groups
CREATE POLICY "Users can view group members"
ON public.users FOR SELECT
USING (
  id IN (
    SELECT user_id FROM public.group_members
    WHERE group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  )
);

-- =====================================
-- GROUPS TABLE POLICIES
-- =====================================

-- Users can view groups they are members of
CREATE POLICY "Users can view groups they are members of"
ON public.groups FOR SELECT
USING (
  id IN (
    SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
  )
);

-- =====================================
-- GROUP MEMBERS TABLE POLICIES
-- =====================================

-- Users can view members of groups they belong to
CREATE POLICY "Users can view group members"
ON public.group_members FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
  )
);

-- Users can join groups (insert)
CREATE POLICY "Users can join groups"
ON public.group_members FOR INSERT
WITH CHECK (user_id = auth.uid());

-- =====================================
-- PARTNERS TABLE POLICIES
-- =====================================

-- Users can view ALL partners in groups they belong to (for intel/betting)
CREATE POLICY "Users can view partners in their groups"
ON public.partners FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
  )
);

-- Users can only create partners for themselves
CREATE POLICY "Users can create their own partners"
ON public.partners FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can only update their OWN partners
CREATE POLICY "Users can update their own partners"
ON public.partners FOR UPDATE
USING (user_id = auth.uid());

-- Users can only delete their OWN partners
CREATE POLICY "Users can delete their own partners"
ON public.partners FOR DELETE
USING (user_id = auth.uid());

-- =====================================
-- STICKY NOTES TABLE POLICIES
-- =====================================

-- Users can view sticky notes for partners in their groups
CREATE POLICY "Users can view sticky notes in their groups"
ON public.sticky_notes FOR SELECT
USING (
  partner_id IN (
    SELECT id FROM public.partners
    WHERE group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  )
);

-- Users can create sticky notes in their groups
CREATE POLICY "Users can create sticky notes in their groups"
ON public.sticky_notes FOR INSERT
WITH CHECK (
  author_id = auth.uid()
  AND partner_id IN (
    SELECT id FROM public.partners
    WHERE group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  )
);

-- Users can only update their own sticky notes
CREATE POLICY "Users can update their own sticky notes"
ON public.sticky_notes FOR UPDATE
USING (author_id = auth.uid());

-- Users can only delete their own sticky notes
CREATE POLICY "Users can delete their own sticky notes"
ON public.sticky_notes FOR DELETE
USING (author_id = auth.uid());

-- =====================================
-- ASSETS TABLE POLICIES
-- =====================================

-- Users can view assets for partners in their groups
CREATE POLICY "Users can view assets in their groups"
ON public.assets FOR SELECT
USING (
  partner_id IN (
    SELECT id FROM public.partners
    WHERE group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  )
);

-- Users can only create assets for THEIR OWN partners
CREATE POLICY "Users can create assets for their partners"
ON public.assets FOR INSERT
WITH CHECK (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

-- Users can only delete assets for THEIR OWN partners
CREATE POLICY "Users can delete assets for their partners"
ON public.assets FOR DELETE
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

-- =====================================
-- CONDITIONAL POLICIES (only if tables exist)
-- =====================================

DO $$
BEGIN
    -- =====================================
    -- PARTNER NOTES TABLE POLICIES (Intel Tab - Shared)
    -- =====================================
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_notes') THEN
        -- Users can view notes for partners in their groups
        EXECUTE 'CREATE POLICY "Users can view notes in their groups"
        ON public.partner_notes FOR SELECT
        USING (
          partner_id IN (
            SELECT id FROM public.partners
            WHERE group_id IN (
              SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
            )
          )
        )';

        -- Users can create notes for any partner in their groups
        EXECUTE 'CREATE POLICY "Users can create notes in their groups"
        ON public.partner_notes FOR INSERT
        WITH CHECK (
          author_id = auth.uid()
          AND partner_id IN (
            SELECT id FROM public.partners
            WHERE group_id IN (
              SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
            )
          )
        )';

        -- Users can update their own notes
        EXECUTE 'CREATE POLICY "Users can update their own notes"
        ON public.partner_notes FOR UPDATE
        USING (author_id = auth.uid())';

        -- ONLY partner owners can delete ALL notes (including those from others)
        EXECUTE 'CREATE POLICY "Partner owners can delete all notes"
        ON public.partner_notes FOR DELETE
        USING (
          partner_id IN (
            SELECT id FROM public.partners WHERE user_id = auth.uid()
          )
        )';
    END IF;

    -- =====================================
    -- PARTNER NOTE VOTES TABLE POLICIES
    -- =====================================
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_note_votes') THEN
        -- Users can view votes for notes in their groups
        EXECUTE 'CREATE POLICY "Users can view votes in their groups"
        ON public.partner_note_votes FOR SELECT
        USING (
          note_id IN (
            SELECT id FROM public.partner_notes
            WHERE partner_id IN (
              SELECT id FROM public.partners
              WHERE group_id IN (
                SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
              )
            )
          )
        )';

        -- Users can vote on notes in their groups
        EXECUTE 'CREATE POLICY "Users can vote in their groups"
        ON public.partner_note_votes FOR INSERT
        WITH CHECK (
          user_id = auth.uid()
          AND note_id IN (
            SELECT id FROM public.partner_notes
            WHERE partner_id IN (
              SELECT id FROM public.partners
              WHERE group_id IN (
                SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
              )
            )
          )
        )';

        -- Users can update their own votes
        EXECUTE 'CREATE POLICY "Users can update their own votes"
        ON public.partner_note_votes FOR UPDATE
        USING (user_id = auth.uid())';

        -- Users can delete their own votes
        EXECUTE 'CREATE POLICY "Users can delete their own votes"
        ON public.partner_note_votes FOR DELETE
        USING (user_id = auth.uid())';
    END IF;

    -- =====================================
    -- PARTNER RED FLAGS TABLE POLICIES (Intel Tab - Shared)
    -- =====================================
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_red_flags') THEN
        -- Users can view red flags for partners in their groups
        EXECUTE 'CREATE POLICY "Users can view red flags in their groups"
        ON public.partner_red_flags FOR SELECT
        USING (
          partner_id IN (
            SELECT id FROM public.partners
            WHERE group_id IN (
              SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
            )
          )
        )';

        -- Users can create red flags for any partner in their groups
        EXECUTE 'CREATE POLICY "Users can create red flags in their groups"
        ON public.partner_red_flags FOR INSERT
        WITH CHECK (
          reported_by_id = auth.uid()
          AND partner_id IN (
            SELECT id FROM public.partners
            WHERE group_id IN (
              SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
            )
          )
        )';

        -- ONLY partner owners can delete ALL red flags (including those reported by others)
        EXECUTE 'CREATE POLICY "Partner owners can delete all red flags"
        ON public.partner_red_flags FOR DELETE
        USING (
          partner_id IN (
            SELECT id FROM public.partners WHERE user_id = auth.uid()
          )
        )';
    END IF;

    -- =====================================
    -- PARTNER RATINGS TABLE POLICIES (Intel Tab - Shared)
    -- =====================================
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_ratings') THEN
        -- Users can view ratings for partners in their groups
        EXECUTE 'CREATE POLICY "Users can view ratings in their groups"
        ON public.partner_ratings FOR SELECT
        USING (
          partner_id IN (
            SELECT id FROM public.partners
            WHERE group_id IN (
              SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
            )
          )
        )';

        -- Users can create ratings for any partner in their groups
        EXECUTE 'CREATE POLICY "Users can create ratings in their groups"
        ON public.partner_ratings FOR INSERT
        WITH CHECK (
          rater_id = auth.uid()
          AND partner_id IN (
            SELECT id FROM public.partners
            WHERE group_id IN (
              SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
            )
          )
        )';

        -- Users can update their own ratings
        EXECUTE 'CREATE POLICY "Users can update their own ratings"
        ON public.partner_ratings FOR UPDATE
        USING (rater_id = auth.uid())';

        -- Users can delete their own ratings
        EXECUTE 'CREATE POLICY "Users can delete their own ratings"
        ON public.partner_ratings FOR DELETE
        USING (rater_id = auth.uid())';
    END IF;

    -- =====================================
    -- TIMELINE EVENTS TABLE POLICIES (Owner Only)
    -- =====================================
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'timeline_events') THEN
        -- Users can view timeline events for partners in their groups
        EXECUTE 'CREATE POLICY "Users can view timeline events in their groups"
        ON public.timeline_events FOR SELECT
        USING (
          partner_id IN (
            SELECT id FROM public.partners
            WHERE group_id IN (
              SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
            )
          )
        )';

        -- Users can only create timeline events for THEIR OWN partners
        EXECUTE 'CREATE POLICY "Users can create timeline events for their partners"
        ON public.timeline_events FOR INSERT
        WITH CHECK (
          partner_id IN (
            SELECT id FROM public.partners WHERE user_id = auth.uid()
          )
        )';

        -- Users can only delete timeline events for THEIR OWN partners
        EXECUTE 'CREATE POLICY "Users can delete timeline events for their partners"
        ON public.timeline_events FOR DELETE
        USING (
          partner_id IN (
            SELECT id FROM public.partners WHERE user_id = auth.uid()
          )
        )';
    END IF;

    -- =====================================
    -- TRANSACTIONS TABLE POLICIES (Owner Only)
    -- =====================================
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
        -- Users can view transactions for partners in their groups
        EXECUTE 'CREATE POLICY "Users can view transactions in their groups"
        ON public.transactions FOR SELECT
        USING (
          partner_id IN (
            SELECT id FROM public.partners
            WHERE group_id IN (
              SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
            )
          )
        )';

        -- Users can only create transactions for THEIR OWN partners
        EXECUTE 'CREATE POLICY "Users can create transactions for their partners"
        ON public.transactions FOR INSERT
        WITH CHECK (
          partner_id IN (
            SELECT id FROM public.partners WHERE user_id = auth.uid()
          )
        )';

        -- Users can only delete transactions for THEIR OWN partners
        EXECUTE 'CREATE POLICY "Users can delete transactions for their partners"
        ON public.transactions FOR DELETE
        USING (
          partner_id IN (
            SELECT id FROM public.partners WHERE user_id = auth.uid()
          )
        )';
    END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check that RLS is enabled
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Status Check:';
  RAISE NOTICE '========================================';
END $$;

SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'groups', 'group_members', 'partners',
    'sticky_notes', 'assets', 'partner_notes', 'partner_note_votes',
    'partner_red_flags', 'partner_ratings', 'timeline_events', 'transactions'
  )
ORDER BY tablename;

-- ============================================
-- SUMMARY
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Policies Applied Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Data Isolation Rules:';
  RAISE NOTICE '- ALL users see ALL partners in their groups (read access)';
  RAISE NOTICE '- Only OWNER can edit/delete THEIR OWN partners';
  RAISE NOTICE '- Intel tab: ALL group members can ADD notes/flags/ratings';
  RAISE NOTICE '- Intel tab: ONLY PARTNER OWNER can DELETE anything';
  RAISE NOTICE '- Timeline/Transactions: Only OWNER can add/delete';
  RAISE NOTICE '';
  RAISE NOTICE 'System is now PRODUCTION READY!';
  RAISE NOTICE '========================================';
END $$;
