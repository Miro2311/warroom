-- =============================================
-- BETTING STUDIO (Wettstudio)
-- =============================================
-- Gamified betting system where users bet on each other's dating outcomes
-- Features: Bet Master voting, dynamic odds, custom + system bets

-- =============================================
-- BET MASTER SYSTEM
-- =============================================
-- Track the elected bet master for each group (acts as referee)
CREATE TABLE IF NOT EXISTS public.group_bet_master (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    elected_at TIMESTAMPTZ DEFAULT NOW(),
    term_ends_at TIMESTAMPTZ, -- Optional: term limits
    total_votes INTEGER DEFAULT 0,

    -- One bet master per group at a time
    UNIQUE(group_id)
);

-- Track individual votes for bet master
CREATE TABLE IF NOT EXISTS public.bet_master_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- One vote per user per group
    UNIQUE(group_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_bet_master_votes_group ON public.bet_master_votes(group_id);

-- =============================================
-- BETS
-- =============================================
-- Main betting table (both system-generated and custom)
CREATE TABLE IF NOT EXISTS public.bets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    target_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- Who the bet is about

    -- Bet details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    bet_type VARCHAR(20) CHECK (bet_type IN ('system', 'custom')) NOT NULL,
    category VARCHAR(50) CHECK (category IN (
        'first_date',
        'kiss',
        'sex',
        'relationship',
        'breakup',
        'response_time',
        'money_spent',
        'custom'
    )) NOT NULL,

    -- Outcome tracking
    outcome_type VARCHAR(20) CHECK (outcome_type IN ('boolean', 'number', 'date')) DEFAULT 'boolean',
    deadline TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) CHECK (status IN ('open', 'locked', 'resolved', 'cancelled')) DEFAULT 'open',
    winning_outcome JSONB, -- Stores the actual outcome

    -- Pot tracking
    total_pot INTEGER DEFAULT 0, -- Total money in the bet

    -- Resolution
    resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bets_group_id ON public.bets(group_id);
CREATE INDEX IF NOT EXISTS idx_bets_target_user_id ON public.bets(target_user_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON public.bets(status);
CREATE INDEX IF NOT EXISTS idx_bets_deadline ON public.bets(deadline);

-- =============================================
-- BET ODDS
-- =============================================
-- Dynamic odds calculated for each user based on their stats
CREATE TABLE IF NOT EXISTS public.bet_odds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bet_id UUID NOT NULL REFERENCES public.bets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Odds (e.g., 2.5 means 2.5:1 payout)
    odds_success DECIMAL(5,2) NOT NULL, -- Odds for "yes" outcome
    odds_failure DECIMAL(5,2) NOT NULL, -- Odds for "no" outcome

    -- Calculation metadata
    calculation_basis JSONB, -- Store what stats were used
    confidence_score INTEGER, -- 0-100 how confident the system is

    calculated_at TIMESTAMPTZ DEFAULT NOW(),

    -- One set of odds per user per bet
    UNIQUE(bet_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_bet_odds_bet_id ON public.bet_odds(bet_id);
CREATE INDEX IF NOT EXISTS idx_bet_odds_user_id ON public.bet_odds(user_id);

-- =============================================
-- WAGERS
-- =============================================
-- Individual bets placed by users
CREATE TABLE IF NOT EXISTS public.wagers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bet_id UUID NOT NULL REFERENCES public.bets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Wager details
    amount INTEGER NOT NULL CHECK (amount > 0), -- Amount of currency bet
    prediction JSONB NOT NULL, -- What they're betting on (e.g., {"outcome": "yes"})
    odds_at_placement DECIMAL(5,2) NOT NULL, -- Lock in odds when bet is placed
    potential_payout INTEGER NOT NULL, -- Calculated payout if they win

    -- Status
    status VARCHAR(20) CHECK (status IN ('active', 'won', 'lost', 'cancelled')) DEFAULT 'active',
    payout_amount INTEGER, -- Actual payout after resolution

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wagers_bet_id ON public.wagers(bet_id);
CREATE INDEX IF NOT EXISTS idx_wagers_user_id ON public.wagers(user_id);
CREATE INDEX IF NOT EXISTS idx_wagers_status ON public.wagers(status);

-- =============================================
-- WEEKLY SYSTEM BETS
-- =============================================
-- Track which system-generated bets have been created each week
CREATE TABLE IF NOT EXISTS public.weekly_system_bets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    bets_generated INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- One set of weekly bets per group per week
    UNIQUE(group_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_system_bets_group ON public.weekly_system_bets(group_id);

-- =============================================
-- CURRENCY/WALLET
-- =============================================
-- Add betting currency to users table if not exists
-- (You may want to integrate this with your existing XP system)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bet_currency INTEGER DEFAULT 1000; -- Starting amount

-- =============================================
-- TRANSACTION LOG
-- =============================================
-- Track all currency movements for transparency
CREATE TABLE IF NOT EXISTS public.bet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    wager_id UUID REFERENCES public.wagers(id) ON DELETE SET NULL,

    amount INTEGER NOT NULL, -- Positive for gains, negative for losses
    transaction_type VARCHAR(30) CHECK (transaction_type IN (
        'wager_placed',
        'wager_won',
        'wager_lost',
        'wager_refund',
        'daily_bonus',
        'admin_adjustment'
    )) NOT NULL,

    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,

    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bet_transactions_user_id ON public.bet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bet_transactions_wager_id ON public.bet_transactions(wager_id);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.group_bet_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_master_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wagers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_system_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_transactions ENABLE ROW LEVEL SECURITY;

-- group_bet_master policies
CREATE POLICY "Users can view bet master of their groups"
    ON public.group_bet_master FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update bet master in their groups"
    ON public.group_bet_master FOR ALL
    USING (
        group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = auth.uid()
        )
    );

-- bet_master_votes policies
CREATE POLICY "Users can view votes in their groups"
    ON public.bet_master_votes FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can vote in their groups"
    ON public.bet_master_votes FOR INSERT
    WITH CHECK (
        voter_id = auth.uid() AND
        group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = auth.uid()
        )
    );

-- bets policies
CREATE POLICY "Users can view bets in their groups"
    ON public.bets FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create bets in their groups"
    ON public.bets FOR INSERT
    WITH CHECK (
        creator_id = auth.uid() AND
        group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Bet master can update bets in their group"
    ON public.bets FOR UPDATE
    USING (
        group_id IN (
            SELECT group_id FROM public.group_bet_master
            WHERE user_id = auth.uid()
        )
    );

-- bet_odds policies
CREATE POLICY "Users can view odds for bets in their groups"
    ON public.bet_odds FOR SELECT
    USING (
        bet_id IN (
            SELECT id FROM public.bets
            WHERE group_id IN (
                SELECT group_id FROM public.group_members
                WHERE user_id = auth.uid()
            )
        )
    );

-- wagers policies
CREATE POLICY "Users can view all wagers in their groups"
    ON public.wagers FOR SELECT
    USING (
        bet_id IN (
            SELECT id FROM public.bets
            WHERE group_id IN (
                SELECT group_id FROM public.group_members
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can place wagers in their groups"
    ON public.wagers FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        bet_id IN (
            SELECT id FROM public.bets
            WHERE group_id IN (
                SELECT group_id FROM public.group_members
                WHERE user_id = auth.uid()
            )
        )
    );

-- bet_transactions policies
CREATE POLICY "Users can view their own transactions"
    ON public.bet_transactions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "System can create transactions"
    ON public.bet_transactions FOR INSERT
    WITH CHECK (true);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to calculate odds based on user stats
CREATE OR REPLACE FUNCTION calculate_bet_odds(
    p_user_id UUID,
    p_category VARCHAR(50)
)
RETURNS TABLE (
    odds_success DECIMAL(5,2),
    odds_failure DECIMAL(5,2),
    confidence INTEGER
) AS $$
DECLARE
    v_user_level INTEGER;
    v_total_partners INTEGER;
    v_success_rate DECIMAL(5,2);
    v_category_experience INTEGER;
BEGIN
    -- Get user stats
    SELECT level INTO v_user_level FROM public.users WHERE id = p_user_id;

    -- Count total partners
    SELECT COUNT(*) INTO v_total_partners
    FROM public.partners
    WHERE user_id = p_user_id;

    -- Get category-specific experience (this is simplified, you'll want to expand)
    CASE p_category
        WHEN 'sex' THEN
            SELECT COUNT(*) INTO v_category_experience
            FROM public.timeline_events
            WHERE user_id = p_user_id
            AND event_type = 'intimacy'
            AND metadata->>'level' = 'sex';
        WHEN 'first_date' THEN
            SELECT COUNT(*) INTO v_category_experience
            FROM public.timeline_events
            WHERE user_id = p_user_id
            AND event_type = 'date';
        ELSE
            v_category_experience := 0;
    END CASE;

    -- Calculate odds (simplified formula)
    -- High experience = lower odds (more likely to succeed)
    -- Low experience = higher odds (less likely, bigger payout)

    IF v_category_experience > 10 THEN
        -- Experienced: low odds
        odds_success := 1.2;
        odds_failure := 4.0;
        confidence := 80;
    ELSIF v_category_experience > 5 THEN
        -- Moderate: medium odds
        odds_success := 2.0;
        odds_failure := 2.5;
        confidence := 60;
    ELSE
        -- Inexperienced: high odds
        odds_success := 3.5;
        odds_failure := 1.3;
        confidence := 40;
    END IF;

    RETURN QUERY SELECT odds_success, odds_failure, confidence;
END;
$$ LANGUAGE plpgsql;

-- Function to resolve a bet and pay out winners
CREATE OR REPLACE FUNCTION resolve_bet(
    p_bet_id UUID,
    p_resolved_by UUID,
    p_winning_outcome JSONB,
    p_resolution_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_wager RECORD;
    v_payout INTEGER;
BEGIN
    -- Update bet status
    UPDATE public.bets
    SET status = 'resolved',
        winning_outcome = p_winning_outcome,
        resolved_by = p_resolved_by,
        resolved_at = NOW(),
        resolution_notes = p_resolution_notes
    WHERE id = p_bet_id;

    -- Process all wagers
    FOR v_wager IN
        SELECT * FROM public.wagers
        WHERE bet_id = p_bet_id AND status = 'active'
    LOOP
        -- Check if wager won (compare prediction to winning_outcome)
        IF v_wager.prediction = p_winning_outcome THEN
            -- Winner
            v_payout := v_wager.potential_payout;

            UPDATE public.wagers
            SET status = 'won',
                payout_amount = v_payout
            WHERE id = v_wager.id;

            -- Credit user account
            UPDATE public.users
            SET bet_currency = bet_currency + v_payout
            WHERE id = v_wager.user_id;

            -- Log transaction
            INSERT INTO public.bet_transactions (
                user_id, wager_id, amount, transaction_type,
                balance_before, balance_after, description
            )
            SELECT
                v_wager.user_id,
                v_wager.id,
                v_payout,
                'wager_won',
                u.bet_currency - v_payout,
                u.bet_currency,
                'Won bet: ' || (SELECT title FROM public.bets WHERE id = p_bet_id)
            FROM public.users u WHERE u.id = v_wager.user_id;
        ELSE
            -- Loser
            UPDATE public.wagers
            SET status = 'lost',
                payout_amount = 0
            WHERE id = v_wager.id;

            -- Money already deducted when bet was placed, just log
            INSERT INTO public.bet_transactions (
                user_id, wager_id, amount, transaction_type,
                balance_before, balance_after, description
            )
            SELECT
                v_wager.user_id,
                v_wager.id,
                -v_wager.amount,
                'wager_lost',
                u.bet_currency + v_wager.amount,
                u.bet_currency,
                'Lost bet: ' || (SELECT title FROM public.bets WHERE id = p_bet_id)
            FROM public.users u WHERE u.id = v_wager.user_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to place a wager (with balance check)
CREATE OR REPLACE FUNCTION place_wager(
    p_bet_id UUID,
    p_user_id UUID,
    p_amount INTEGER,
    p_prediction JSONB,
    p_odds DECIMAL(5,2)
)
RETURNS UUID AS $$
DECLARE
    v_wager_id UUID;
    v_user_balance INTEGER;
    v_potential_payout INTEGER;
BEGIN
    -- Check user balance
    SELECT bet_currency INTO v_user_balance
    FROM public.users
    WHERE id = p_user_id;

    IF v_user_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Calculate potential payout
    v_potential_payout := FLOOR(p_amount * p_odds);

    -- Create wager
    INSERT INTO public.wagers (
        bet_id, user_id, amount, prediction,
        odds_at_placement, potential_payout
    )
    VALUES (
        p_bet_id, p_user_id, p_amount, p_prediction,
        p_odds, v_potential_payout
    )
    RETURNING id INTO v_wager_id;

    -- Deduct from user balance
    UPDATE public.users
    SET bet_currency = bet_currency - p_amount
    WHERE id = p_user_id;

    -- Update bet total pot
    UPDATE public.bets
    SET total_pot = total_pot + p_amount
    WHERE id = p_bet_id;

    -- Log transaction
    INSERT INTO public.bet_transactions (
        user_id, wager_id, amount, transaction_type,
        balance_before, balance_after, description
    )
    VALUES (
        p_user_id,
        v_wager_id,
        -p_amount,
        'wager_placed',
        v_user_balance,
        v_user_balance - p_amount,
        'Placed wager on: ' || (SELECT title FROM public.bets WHERE id = p_bet_id)
    );

    RETURN v_wager_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- NOTES
-- =============================================
-- 1. Odds calculation is simplified - expand based on your needs
-- 2. You may want to add a house edge or fee system
-- 3. Consider adding bet categories based on partner tags/attributes
-- 4. System-generated bets could use ML/patterns from group history
-- 5. Add anti-gambling features (limits, cooldowns) if needed
