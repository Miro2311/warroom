-- Add stake_amount to bets table
-- This is the fixed amount everyone must bet to join

ALTER TABLE public.bets
ADD COLUMN IF NOT EXISTS stake_amount INTEGER NOT NULL DEFAULT 0;

-- Add a check constraint to ensure stake_amount is positive
ALTER TABLE public.bets
ADD CONSTRAINT bets_stake_amount_positive
CHECK (stake_amount >= 0);
