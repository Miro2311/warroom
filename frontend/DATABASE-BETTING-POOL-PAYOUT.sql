-- =============================================
-- POOL-BASED BETTING PAYOUT SYSTEM
-- =============================================
-- Replace the traditional odds-based system with a pool-based system
-- where losers pay winners proportionally

-- Drop the old resolve function
DROP FUNCTION IF EXISTS resolve_bet(UUID, UUID, JSONB, TEXT);

-- Create new pool-based resolve function
CREATE OR REPLACE FUNCTION resolve_bet(
    p_bet_id UUID,
    p_resolved_by UUID,
    p_winning_outcome JSONB,
    p_resolution_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_wager RECORD;
    v_payout DECIMAL;
    v_total_pot DECIMAL;
    v_winning_side_total DECIMAL;
BEGIN
    -- Update bet status
    UPDATE public.bets
    SET status = 'resolved',
        winning_outcome = p_winning_outcome,
        resolved_by = p_resolved_by,
        resolved_at = NOW(),
        resolution_notes = p_resolution_notes
    WHERE id = p_bet_id;

    -- Calculate total pot
    SELECT COALESCE(SUM(amount), 0) INTO v_total_pot
    FROM public.wagers
    WHERE bet_id = p_bet_id AND status = 'active';

    -- Calculate total on winning side
    SELECT COALESCE(SUM(amount), 0) INTO v_winning_side_total
    FROM public.wagers
    WHERE bet_id = p_bet_id
      AND status = 'active'
      AND prediction = p_winning_outcome;

    -- If no one won, refund everyone
    IF v_winning_side_total = 0 THEN
        FOR v_wager IN
            SELECT * FROM public.wagers
            WHERE bet_id = p_bet_id AND status = 'active'
        LOOP
            UPDATE public.wagers
            SET status = 'cancelled',
                payout_amount = v_wager.amount
            WHERE id = v_wager.id;

            -- Refund (but money was never deducted in pool system)
            -- Just log the transaction
            INSERT INTO public.bet_transactions (
                user_id, wager_id, amount, transaction_type,
                balance_before, balance_after, description
            )
            VALUES (
                v_wager.user_id,
                v_wager.id,
                0,
                'wager_refund',
                0,
                0,
                'Bet cancelled - no winners: ' || (SELECT title FROM public.bets WHERE id = p_bet_id)
            );
        END LOOP;
        RETURN;
    END IF;

    -- Process all wagers
    FOR v_wager IN
        SELECT * FROM public.wagers
        WHERE bet_id = p_bet_id AND status = 'active'
    LOOP
        -- Check if wager won
        IF v_wager.prediction = p_winning_outcome THEN
            -- Winner - calculate proportional share of total pot
            v_payout := FLOOR((v_wager.amount::DECIMAL / v_winning_side_total::DECIMAL) * v_total_pot);

            UPDATE public.wagers
            SET status = 'won',
                payout_amount = v_payout
            WHERE id = v_wager.id;

            -- Log transaction (no actual currency transfer in pool system)
            INSERT INTO public.bet_transactions (
                user_id, wager_id, amount, transaction_type,
                balance_before, balance_after, description
            )
            VALUES (
                v_wager.user_id,
                v_wager.id,
                v_payout - v_wager.amount,
                'wager_won',
                0,
                0,
                'Won bet: ' || (SELECT title FROM public.bets WHERE id = p_bet_id)
            );
        ELSE
            -- Loser
            UPDATE public.wagers
            SET status = 'lost',
                payout_amount = 0
            WHERE id = v_wager.id;

            -- Log transaction
            INSERT INTO public.bet_transactions (
                user_id, wager_id, amount, transaction_type,
                balance_before, balance_after, description
            )
            VALUES (
                v_wager.user_id,
                v_wager.id,
                -v_wager.amount,
                'wager_lost',
                0,
                0,
                'Lost bet: ' || (SELECT title FROM public.bets WHERE id = p_bet_id)
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SETTLEMENT CALCULATION FUNCTION
-- =============================================
-- Get settlement details showing who owes who how much

CREATE OR REPLACE FUNCTION get_bet_settlement(p_bet_id UUID)
RETURNS TABLE (
    payer_id UUID,
    payer_name TEXT,
    receiver_id UUID,
    receiver_name TEXT,
    amount INTEGER
) AS $$
DECLARE
    v_winner RECORD;
    v_loser RECORD;
    v_total_losers DECIMAL;
    v_loser_share DECIMAL;
BEGIN
    -- Get total amount lost
    SELECT COALESCE(SUM(amount), 0) INTO v_total_losers
    FROM public.wagers
    WHERE bet_id = p_bet_id AND status = 'lost';

    -- For each winner, calculate how much they should receive from each loser
    FOR v_winner IN
        SELECT w.*, u.username as winner_name
        FROM public.wagers w
        JOIN public.users u ON u.id = w.user_id
        WHERE w.bet_id = p_bet_id AND w.status = 'won'
    LOOP
        -- For each loser
        FOR v_loser IN
            SELECT w.*, u.username as loser_name
            FROM public.wagers w
            JOIN public.users u ON u.id = w.user_id
            WHERE w.bet_id = p_bet_id AND w.status = 'lost'
        LOOP
            -- Calculate this loser's share of this winner's payout
            v_loser_share := FLOOR(
                ((v_winner.payout_amount - v_winner.amount)::DECIMAL / v_total_losers::DECIMAL)
                * v_loser.amount::DECIMAL
            );

            IF v_loser_share > 0 THEN
                payer_id := v_loser.user_id;
                payer_name := v_loser.loser_name;
                receiver_id := v_winner.user_id;
                receiver_name := v_winner.winner_name;
                amount := v_loser_share;
                RETURN NEXT;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- NOTES
-- =============================================
-- This pool-based system ensures:
-- 1. Total money in = Total money out (always balanced)
-- 2. Winners split the entire pot proportional to their bets
-- 3. No virtual currency needed - track real CHF amounts
-- 4. Settlement shows exact Twint payments needed
