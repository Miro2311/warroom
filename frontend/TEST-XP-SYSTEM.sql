-- Test XP System Database Functions
-- Run this in Supabase SQL Editor to verify everything works

-- 1. Check if tables exist
SELECT 'xp_transactions table exists' as test,
       EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'xp_transactions') as result;

SELECT 'achievements table exists' as test,
       EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'achievements') as result;

SELECT 'peer_validations table exists' as test,
       EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'peer_validations') as result;

-- 2. Check if users table has new columns
SELECT 'users.streak_count column exists' as test,
       EXISTS (SELECT FROM information_schema.columns
               WHERE table_name = 'users' AND column_name = 'streak_count') as result;

SELECT 'users.last_activity_date column exists' as test,
       EXISTS (SELECT FROM information_schema.columns
               WHERE table_name = 'users' AND column_name = 'last_activity_date') as result;

SELECT 'users.total_xp_earned column exists' as test,
       EXISTS (SELECT FROM information_schema.columns
               WHERE table_name = 'users' AND column_name = 'total_xp_earned') as result;

-- 3. Check if functions exist
SELECT 'calculate_level function exists' as test,
       EXISTS (SELECT FROM pg_proc WHERE proname = 'calculate_level') as result;

SELECT 'add_xp_to_user function exists' as test,
       EXISTS (SELECT FROM pg_proc WHERE proname = 'add_xp_to_user') as result;

SELECT 'update_user_streak function exists' as test,
       EXISTS (SELECT FROM pg_proc WHERE proname = 'update_user_streak') as result;

-- 4. Test calculate_level function
SELECT 'Level for 0 XP' as test, calculate_level(0) as result, 1 as expected;
SELECT 'Level for 500 XP' as test, calculate_level(500) as result, 1 as expected;
SELECT 'Level for 1000 XP' as test, calculate_level(1000) as result, 2 as expected;
SELECT 'Level for 2500 XP' as test, calculate_level(2500) as result, 3 as expected;
SELECT 'Level for 10000 XP' as test, calculate_level(10000) as result, 11 as expected;

-- 5. Test add_xp_to_user function (replace USER_ID with an actual user ID from your database)
-- First, let's get a user ID to test with:
SELECT 'Sample user for testing' as test, id, username, current_xp, level
FROM users
LIMIT 1;

-- MANUAL TEST INSTRUCTIONS:
-- 1. Copy a user ID from the query above
-- 2. Replace 'YOUR_USER_ID_HERE' in the commands below
-- 3. Run them one by one:

-- Test adding 100 XP:
-- SELECT * FROM add_xp_to_user('YOUR_USER_ID_HERE', 100);

-- Test adding 900 XP (should level up to 2):
-- SELECT * FROM add_xp_to_user('YOUR_USER_ID_HERE', 900);

-- Verify user data:
-- SELECT id, username, current_xp, level, total_xp_earned FROM users WHERE id = 'YOUR_USER_ID_HERE';

-- 6. Test XP transaction logging
-- Check if XP transactions are being recorded:
SELECT 'Recent XP transactions' as test, COUNT(*) as count
FROM xp_transactions
WHERE created_at > NOW() - INTERVAL '1 day';

-- View recent transactions:
SELECT
  u.username,
  t.amount,
  t.reason,
  t.category,
  t.created_at
FROM xp_transactions t
JOIN users u ON t.user_id = u.id
ORDER BY t.created_at DESC
LIMIT 10;

-- 7. Check RLS policies
SELECT 'xp_transactions RLS enabled' as test,
       relrowsecurity as result
FROM pg_class
WHERE relname = 'xp_transactions';

SELECT 'achievements RLS enabled' as test,
       relrowsecurity as result
FROM pg_class
WHERE relname = 'achievements';

SELECT 'peer_validations RLS enabled' as test,
       relrowsecurity as result
FROM pg_class
WHERE relname = 'peer_validations';

-- 8. Achievement check
SELECT 'Total achievements defined' as test, COUNT(*) as count
FROM (
  VALUES
    ('first_partner'),
    ('five_partners'),
    ('ten_partners'),
    ('first_exclusive'),
    ('low_simp_master'),
    ('intimacy_champion')
) as defined_achievements;

-- 9. Summary
SELECT 'XP System Status' as summary,
       CASE
         WHEN EXISTS (SELECT FROM xp_transactions LIMIT 1) THEN 'Active - transactions exist'
         ELSE 'Ready - no transactions yet'
       END as status;

-- DEBUGGING QUERIES:

-- If XP is not being awarded, check these:

-- Check user's current XP status:
-- SELECT id, username, current_xp, level, total_xp_earned, streak_count, last_activity_date
-- FROM users
-- WHERE id = 'YOUR_USER_ID_HERE';

-- Check if XP transactions are being created:
-- SELECT * FROM xp_transactions
-- WHERE user_id = 'YOUR_USER_ID_HERE'
-- ORDER BY created_at DESC
-- LIMIT 20;

-- Check for any errors in function execution:
-- Try manually awarding XP:
-- SELECT * FROM add_xp_to_user('YOUR_USER_ID_HERE', 50);

-- If that works, the problem is in the application code calling the function
-- If that fails, check the error message
