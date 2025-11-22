-- =============================================
-- CLEANUP SCRIPT FOR BETTING STUDIO
-- =============================================
-- Run this first to clean up any partial installations

-- Drop all policies first
DROP POLICY IF EXISTS "Users can view bet master of their groups" ON public.group_bet_master;
DROP POLICY IF EXISTS "Users can update bet master in their groups" ON public.group_bet_master;
DROP POLICY IF EXISTS "Users can view votes in their groups" ON public.bet_master_votes;
DROP POLICY IF EXISTS "Users can vote in their groups" ON public.bet_master_votes;
DROP POLICY IF EXISTS "Users can view bets in their groups" ON public.bets;
DROP POLICY IF EXISTS "Users can create bets in their groups" ON public.bets;
DROP POLICY IF EXISTS "Bet master can update bets in their group" ON public.bets;
DROP POLICY IF EXISTS "Users can view odds for bets in their groups" ON public.bet_odds;
DROP POLICY IF EXISTS "Users can view all wagers in their groups" ON public.wagers;
DROP POLICY IF EXISTS "Users can place wagers in their groups" ON public.wagers;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.bet_transactions;
DROP POLICY IF EXISTS "System can create transactions" ON public.bet_transactions;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_bet_odds(UUID, VARCHAR);
DROP FUNCTION IF EXISTS resolve_bet(UUID, UUID, JSONB, TEXT);
DROP FUNCTION IF EXISTS place_wager(UUID, UUID, INTEGER, JSONB, DECIMAL);

-- Drop tables in reverse order (respecting foreign keys)
DROP TABLE IF EXISTS public.bet_transactions CASCADE;
DROP TABLE IF EXISTS public.wagers CASCADE;
DROP TABLE IF EXISTS public.bet_odds CASCADE;
DROP TABLE IF EXISTS public.weekly_system_bets CASCADE;
DROP TABLE IF EXISTS public.bets CASCADE;
DROP TABLE IF EXISTS public.bet_master_votes CASCADE;
DROP TABLE IF EXISTS public.group_bet_master CASCADE;

-- Note: We don't drop the bet_currency column from users table
-- If you want to remove it, uncomment the line below:
-- ALTER TABLE public.users DROP COLUMN IF EXISTS bet_currency;

-- =============================================
-- Now run DATABASE-BETTING-STUDIO.sql
-- =============================================
