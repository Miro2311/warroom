-- INSERT TEST DATA FOR RWR
-- Run this AFTER you've created auth users in Supabase Dashboard

-- ============================================
-- STEP 1: GET YOUR AUTH USER IDs
-- ============================================
-- Run this first to see your auth users:
-- SELECT id, email FROM auth.users ORDER BY created_at DESC;

-- ============================================
-- STEP 2: REPLACE UUIDs BELOW
-- ============================================
-- Copy the UUIDs from Step 1 and paste them here:

DECLARE
  -- REPLACE THESE WITH YOUR ACTUAL UUIDs!
  test_user_id UUID := '785c7ce9-6c9d-495b-81f0-e779e7d38d52';
  friend1_id UUID := '4b797dd0-c05e-4b6a-b89f-16ebaa0a56b4';
  friend2_id UUID := '932fc25c-86ff-407f-ad2f-92fe2f19a316';
BEGIN
  -- Create user profiles
  DELETE FROM public.users WHERE id IN (test_user_id, friend1_id, friend2_id);

  INSERT INTO public.users (id, username, avatar_url, current_xp, level)
  VALUES
    (test_user_id, 'TestUser', 'https://api.dicebear.com/7.x/avataaars/svg?seed=TestUser', 1500, 3),
    (friend1_id, 'FriendOne', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Friend1', 800, 2),
    (friend2_id, 'FriendTwo', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Friend2', 500, 1);

  -- Create test group
  DELETE FROM public.groups WHERE id = '11111111-1111-1111-1111-111111111111';

  INSERT INTO public.groups (id, name, invite_code, created_at)
  VALUES ('11111111-1111-1111-1111-111111111111', 'The Squad', 'TESTSQD1', NOW());

  -- Add users to group
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES
    ('11111111-1111-1111-1111-111111111111', test_user_id, 'admin'),
    ('11111111-1111-1111-1111-111111111111', friend1_id, 'member'),
    ('11111111-1111-1111-1111-111111111111', friend2_id, 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  -- Delete existing test partners if any
  DELETE FROM public.partners WHERE id IN (
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666'
  );

  -- Create test partners for TestUser
  INSERT INTO public.partners (
    id, name, photo_url, user_id, group_id,
    simp_index, money_spent, hours_invested, intimacy_score,
    status, decay_days, created_at, last_interaction
  ) VALUES
  (
    '22222222-2222-2222-2222-222222222222',
    'Barista Girl',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Barista',
    test_user_id,
    '11111111-1111-1111-1111-111111111111',
    15.5, 200, 10, 8,
    'active', 3,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '3 days'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Gym Crush',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=GymGirl',
    test_user_id,
    '11111111-1111-1111-1111-111111111111',
    45.2, 300, 25, 4,
    'active', 7,
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '7 days'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Coffee Shop Regular',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=CoffeeGirl',
    test_user_id,
    '11111111-1111-1111-1111-111111111111',
    8.3, 50, 5, 6,
    'active', 1,
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'Ex-Girlfriend',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Ex',
    test_user_id,
    '11111111-1111-1111-1111-111111111111',
    89.7, 1500, 200, 2,
    'inactive', 45,
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '45 days'
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'Tinder Match',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Tinder',
    test_user_id,
    '11111111-1111-1111-1111-111111111111',
    3.5, 20, 2, 9,
    'active', 0,
    NOW() - INTERVAL '7 days',
    NOW()
  );

  -- Delete existing sticky notes
  DELETE FROM public.sticky_notes WHERE id IN (
    '77777777-7777-7777-7777-777777777777',
    '88888888-8888-8888-8888-888888888888',
    '99999999-9999-9999-9999-999999999999'
  );

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

  RAISE NOTICE '=================================';
  RAISE NOTICE 'TEST DATA INSERTED SUCCESSFULLY!';
  RAISE NOTICE '=================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Login credentials:';
  RAISE NOTICE '  Email: test@rwr.com';
  RAISE NOTICE '  Password: TestPass123!';
  RAISE NOTICE '';
  RAISE NOTICE 'Group: The Squad';
  RAISE NOTICE 'Invite Code: TESTSQD1';
  RAISE NOTICE '';
  RAISE NOTICE 'Partners created: 5';
  RAISE NOTICE '  - Barista Girl (Simp Index: 15.5)';
  RAISE NOTICE '  - Gym Crush (Simp Index: 45.2)';
  RAISE NOTICE '  - Coffee Shop Regular (Simp Index: 8.3)';
  RAISE NOTICE '  - Ex-Girlfriend (Simp Index: 89.7)';
  RAISE NOTICE '  - Tinder Match (Simp Index: 3.5)';
  RAISE NOTICE '';
END $$;

-- Verify data was inserted
SELECT 'Data verification:' as status;
SELECT 'Users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'Groups', COUNT(*) FROM public.groups
UNION ALL
SELECT 'Group Members', COUNT(*) FROM public.group_members
UNION ALL
SELECT 'Partners', COUNT(*) FROM public.partners
UNION ALL
SELECT 'Sticky Notes', COUNT(*) FROM public.sticky_notes;
