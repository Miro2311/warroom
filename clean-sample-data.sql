-- CLEAN ALL SAMPLE DATA
-- This will delete ALL data from the database
-- WARNING: This is irreversible! Only run this if you want a fresh start.

BEGIN;

-- Disable triggers temporarily to avoid foreign key issues
SET session_replication_role = replica;

-- Delete all data from tables (in correct order due to foreign keys)
DELETE FROM public.peer_validations;
DELETE FROM public.xp_transactions;
DELETE FROM public.achievements;

DELETE FROM public.bet_master_votes;
DELETE FROM public.group_bet_master;
DELETE FROM public.settlements;
DELETE FROM public.bet_transactions;
DELETE FROM public.bet_odds;
DELETE FROM public.wagers;
DELETE FROM public.bets;
DELETE FROM public.weekly_system_bets;

DELETE FROM public.timeline_events;
DELETE FROM public.sticky_notes;
DELETE FROM public.assets;

DELETE FROM public.partner_note_votes;
DELETE FROM public.partner_notes;
DELETE FROM public.partner_ratings;
DELETE FROM public.partner_red_flags;
DELETE FROM public.partner_images;
DELETE FROM public.partners;

DELETE FROM public.group_members;
DELETE FROM public.groups;

-- Delete users (but keep auth.users intact - those are managed by Supabase Auth)
DELETE FROM public.users;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

COMMIT;

-- Verify all tables are empty
SELECT 'users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'groups', COUNT(*) FROM public.groups
UNION ALL
SELECT 'group_members', COUNT(*) FROM public.group_members
UNION ALL
SELECT 'partners', COUNT(*) FROM public.partners
UNION ALL
SELECT 'partner_images', COUNT(*) FROM public.partner_images
UNION ALL
SELECT 'partner_notes', COUNT(*) FROM public.partner_notes
UNION ALL
SELECT 'timeline_events', COUNT(*) FROM public.timeline_events
UNION ALL
SELECT 'achievements', COUNT(*) FROM public.achievements
UNION ALL
SELECT 'xp_transactions', COUNT(*) FROM public.xp_transactions
ORDER BY table_name;

-- Show auth users (these will NOT be deleted - managed by Supabase Auth)
SELECT
  'Auth Users (NOT deleted - use Supabase Auth UI to delete)' as note,
  COUNT(*) as count
FROM auth.users;
