-- =============================================
-- SETTLEMENTS TABLE
-- =============================================
-- Track who owes who money from resolved bets
-- Winners can mark payments as received

CREATE TABLE IF NOT EXISTS public.settlements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bet_id UUID NOT NULL REFERENCES public.bets(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,

    -- Who pays and who receives
    payer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Amount and status
    amount INTEGER NOT NULL CHECK (amount > 0),
    status VARCHAR(20) CHECK (status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',

    -- Payment confirmation
    marked_paid_at TIMESTAMPTZ,
    marked_paid_by UUID REFERENCES public.users(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settlements_bet_id ON public.settlements(bet_id);
CREATE INDEX IF NOT EXISTS idx_settlements_group_id ON public.settlements(group_id);
CREATE INDEX IF NOT EXISTS idx_settlements_payer_id ON public.settlements(payer_id);
CREATE INDEX IF NOT EXISTS idx_settlements_receiver_id ON public.settlements(receiver_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON public.settlements(status);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Users can view settlements in their groups
CREATE POLICY "Users can view settlements in their groups"
    ON public.settlements FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = auth.uid()
        )
    );

-- Receivers can mark settlements as paid
CREATE POLICY "Receivers can update their settlements"
    ON public.settlements FOR UPDATE
    USING (
        receiver_id = auth.uid() AND
        group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = auth.uid()
        )
    );

-- System can create settlements
CREATE POLICY "System can create settlements"
    ON public.settlements FOR INSERT
    WITH CHECK (
        group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- UPDATE resolve_bet TO CREATE SETTLEMENTS
-- =============================================

-- Drop the old function
DROP FUNCTION IF EXISTS resolve_bet(UUID, UUID, JSONB, TEXT);

-- Recreate with settlement creation
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
    v_group_id UUID;
    v_loser RECORD;
    v_winner RECORD;
    v_loser_share DECIMAL;
    v_total_losers DECIMAL;
BEGIN
    -- Get group_id
    SELECT group_id INTO v_group_id FROM public.bets WHERE id = p_bet_id;

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
        END LOOP;
        RETURN;
    END IF;

    -- Calculate total amount lost
    SELECT COALESCE(SUM(amount), 0) INTO v_total_losers
    FROM public.wagers
    WHERE bet_id = p_bet_id AND status = 'active'
      AND prediction != p_winning_outcome;

    -- Process all wagers
    FOR v_wager IN
        SELECT * FROM public.wagers
        WHERE bet_id = p_bet_id AND status = 'active'
    LOOP
        IF v_wager.prediction = p_winning_outcome THEN
            -- Winner
            v_payout := FLOOR((v_wager.amount::DECIMAL / v_winning_side_total::DECIMAL) * v_total_pot);

            UPDATE public.wagers
            SET status = 'won',
                payout_amount = v_payout
            WHERE id = v_wager.id;
        ELSE
            -- Loser
            UPDATE public.wagers
            SET status = 'lost',
                payout_amount = 0
            WHERE id = v_wager.id;
        END IF;
    END LOOP;

    -- Create settlements (who owes who)
    FOR v_winner IN
        SELECT * FROM public.wagers
        WHERE bet_id = p_bet_id AND status = 'won'
    LOOP
        FOR v_loser IN
            SELECT * FROM public.wagers
            WHERE bet_id = p_bet_id AND status = 'lost'
        LOOP
            -- Calculate this loser's share of this winner's profit
            v_loser_share := FLOOR(
                ((v_winner.payout_amount - v_winner.amount)::DECIMAL / v_total_losers::DECIMAL)
                * v_loser.amount::DECIMAL
            );

            IF v_loser_share > 0 THEN
                INSERT INTO public.settlements (
                    bet_id,
                    group_id,
                    payer_id,
                    receiver_id,
                    amount,
                    status
                )
                VALUES (
                    p_bet_id,
                    v_group_id,
                    v_loser.user_id,
                    v_winner.user_id,
                    v_loser_share,
                    'pending'
                );
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
