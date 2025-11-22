-- ============================================================
-- RELATIONSHIP WAR ROOM - FINAL DATABASE SETUP
-- ============================================================
-- This is the FINAL, CLEAN version with correct UUIDs and schema
--
-- BEFORE RUNNING:
-- 1. Make sure you have these auth users in Supabase:
--    - test@rwr.com    (UUID: 932fc25c-86ff-407f-ad2f-92fe2f19a316)
--    - friend1@rwr.com (UUID: 785c7ce9-6c9d-495b-81f0-e779e7d38d52)
--    - friend2@rwr.com (UUID: 4b797dd0-c05e-4b6a-b89f-16ebaa0a56b4)
--
-- If your UUIDs are different, replace them in the DO block below!
-- ============================================================

-- ============================================
-- STEP 1: DROP ALL EXISTING TABLES
-- ============================================

DROP TABLE IF EXISTS public.sticky_notes CASCADE;
DROP TABLE IF EXISTS public.assets CASCADE;
DROP TABLE IF EXISTS public.partners CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================
-- STEP 2: CREATE TABLES WITH CORRECT SCHEMA
-- ============================================

-- Users table (links to auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  current_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group members (junction table)
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Partners table (CORRECT COLUMN NAMES!)
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL,                    -- Changed from 'name' to 'nickname'
  photo_url TEXT,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  financial_total INTEGER DEFAULT 0,         -- Changed from 'money_spent'
  time_total INTEGER DEFAULT 0,              -- Changed from 'hours_invested'
  intimacy_score INTEGER DEFAULT 5 CHECK (intimacy_score >= 0 AND intimacy_score <= 10),
  status TEXT DEFAULT 'Talking',             -- RelationshipStatus
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Changed from 'last_interaction'
  -- Graveyard fields
  cause_of_death TEXT,
  cause_of_death_custom TEXT,
  graveyard_date TIMESTAMP WITH TIME ZONE
);

-- Sticky notes table
CREATE TABLE public.sticky_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  x DECIMAL(10,2) DEFAULT 0,
  y DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets table
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  is_blurred BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 3: CREATE INDEXES
-- ============================================

CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_partners_user_id ON public.partners(user_id);
CREATE INDEX idx_partners_group_id ON public.partners(group_id);
CREATE INDEX idx_sticky_notes_partner_id ON public.sticky_notes(partner_id);
CREATE INDEX idx_sticky_notes_author_id ON public.sticky_notes(author_id);

-- ============================================
-- STEP 4: DISABLE RLS FOR DEVELOPMENT
-- ============================================

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticky_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: INSERT TEST DATA
-- ============================================

DO $$
DECLARE
  -- IMPORTANT: Replace these UUIDs with your actual auth.users IDs!
  test_user_id UUID := '932fc25c-86ff-407f-ad2f-92fe2f19a316';  -- test@rwr.com
  friend1_id UUID := '785c7ce9-6c9d-495b-81f0-e779e7d38d52';    -- friend1@rwr.com
  friend2_id UUID := '4b797dd0-c05e-4b6a-b89f-16ebaa0a56b4';    -- friend2@rwr.com
  squad_group_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Creating database...';
  RAISE NOTICE '========================================';

  -- Create user profiles
  INSERT INTO public.users (id, username, avatar_url, current_xp, level)
  VALUES
    (test_user_id, 'TestUser', 'https://api.dicebear.com/7.x/avataaars/svg?seed=TestUser', 1500, 3),
    (friend1_id, 'FriendOne', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Friend1', 800, 2),
    (friend2_id, 'FriendTwo', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Friend2', 500, 1);

  RAISE NOTICE '✓ Created 3 user profiles';

  -- Create group
  INSERT INTO public.groups (id, name, invite_code, created_at)
  VALUES (squad_group_id, 'The Squad', 'TESTSQD1', NOW());

  RAISE NOTICE '✓ Created group: The Squad (Invite: TESTSQD1)';

  -- Add users to group
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES
    (squad_group_id, test_user_id, 'admin'),
    (squad_group_id, friend1_id, 'member'),
    (squad_group_id, friend2_id, 'member');

  RAISE NOTICE '✓ Added 3 members to The Squad';

  -- Create TestUser's partners (5 dating partners)
  INSERT INTO public.partners (
    id, nickname, photo_url, user_id, group_id,
    financial_total, time_total, intimacy_score,
    status, created_at, last_updated_at
  ) VALUES
  (
    '22222222-2222-2222-2222-222222222222',
    'Barista Girl',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Barista',
    test_user_id,
    squad_group_id,
    200, 10, 8,
    'Dating',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '3 days'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Gym Crush',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=GymGirl',
    test_user_id,
    squad_group_id,
    300, 25, 4,
    'Talking',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '7 days'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Coffee Shop Regular',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=CoffeeGirl',
    test_user_id,
    squad_group_id,
    50, 5, 6,
    'Talking',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'Ex-Girlfriend',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Ex',
    test_user_id,
    squad_group_id,
    1500, 200, 2,
    'Graveyard',
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '45 days'
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'Tinder Match',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Tinder',
    test_user_id,
    squad_group_id,
    20, 2, 9,
    'Exclusive',
    NOW() - INTERVAL '7 days',
    NOW()
  );

  RAISE NOTICE '✓ Created 5 partners for TestUser';

  -- Create sticky notes
  INSERT INTO public.sticky_notes (id, partner_id, author_id, content, x, y, created_at)
  VALUES
  (
    '77777777-7777-7777-7777-777777777777',
    '22222222-2222-2222-2222-222222222222',
    friend1_id,
    'Bro she smiled at you, thats just customer service',
    -100, 50,
    NOW() - INTERVAL '2 days'
  ),
  (
    '88888888-8888-8888-8888-888888888888',
    '33333333-3333-3333-3333-333333333333',
    friend2_id,
    'Major simp energy detected',
    80, -60,
    NOW() - INTERVAL '5 days'
  ),
  (
    '99999999-9999-9999-9999-999999999999',
    '55555555-5555-5555-5555-555555555555',
    test_user_id,
    'Never again... probably',
    -120, -90,
    NOW() - INTERVAL '30 days'
  );

  RAISE NOTICE '✓ Created 3 sticky notes';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Login: test@rwr.com / TestPass123!';
  RAISE NOTICE 'Group: The Squad (Invite: TESTSQD1)';
  RAISE NOTICE '';
  RAISE NOTICE 'TestUser has 5 dating partners:';
  RAISE NOTICE '  1. Barista Girl (Status: Dating, Intimacy: 8)';
  RAISE NOTICE '  2. Gym Crush (Status: Talking, Intimacy: 4)';
  RAISE NOTICE '  3. Coffee Shop Regular (Status: Talking, Intimacy: 6)';
  RAISE NOTICE '  4. Ex-Girlfriend (Status: Graveyard, Intimacy: 2)';
  RAISE NOTICE '  5. Tinder Match (Status: Exclusive, Intimacy: 9)';
  RAISE NOTICE '';
  RAISE NOTICE 'Simp Index formula: (financial_total + time_total*20) / intimacy_score';
  RAISE NOTICE '  - Barista Girl: (200 + 10*20) / 8 = 50.0';
  RAISE NOTICE '  - Gym Crush: (300 + 25*20) / 4 = 200.0 (High simp!)';
  RAISE NOTICE '  - Ex-Girlfriend: (1500 + 200*20) / 2 = 2750.0 (MEGA SIMP!)';
  RAISE NOTICE '  - Tinder Match: (20 + 2*20) / 9 = 6.7 (Low simp, high game!)';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';

END $$;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT '=== DATA SUMMARY ===' as section;
SELECT 'Users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'Groups', COUNT(*) FROM public.groups
UNION ALL
SELECT 'Group Members', COUNT(*) FROM public.group_members
UNION ALL
SELECT 'Partners', COUNT(*) FROM public.partners
UNION ALL
SELECT 'Sticky Notes', COUNT(*) FROM public.sticky_notes;

SELECT '=== TESTUSER PARTNERS ===' as section;
SELECT
  p.nickname,
  p.financial_total,
  p.time_total,
  p.intimacy_score,
  p.status,
  ROUND((p.financial_total + p.time_total * 20.0) / NULLIF(p.intimacy_score, 0), 1) as simp_index
FROM public.partners p
JOIN public.users u ON p.user_id = u.id
WHERE u.username = 'TestUser'
ORDER BY simp_index DESC;

SELECT '=== SETUP COMPLETE - Ready to use! ===' as status;
