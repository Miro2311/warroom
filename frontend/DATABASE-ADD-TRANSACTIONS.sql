-- ============================================================
-- ADD TRANSACTIONS TABLE TO EXISTING DATABASE
-- ============================================================
-- This script adds the transactions table without dropping existing data
-- Run this in your Supabase SQL editor
-- ============================================================

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL CHECK (category IN ('Dining', 'Entertainment', 'Gifts', 'Travel', 'Shopping', 'Activities', 'Other')),
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_partner_id ON public.transactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);

-- Disable RLS for development
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- CREATE FUNCTION TO AUTO-CALCULATE financial_total
-- ============================================================

-- Function to recalculate financial_total for a partner
CREATE OR REPLACE FUNCTION recalculate_financial_total(p_partner_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.partners
  SET financial_total = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.transactions
    WHERE partner_id = p_partner_id
  )
  WHERE id = p_partner_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update financial_total on transaction changes
CREATE OR REPLACE FUNCTION update_partner_financial_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT and UPDATE
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    PERFORM recalculate_financial_total(NEW.partner_id);
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF (TG_OP = 'DELETE') THEN
    PERFORM recalculate_financial_total(OLD.partner_id);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_financial_total ON public.transactions;

-- Create trigger on transactions table
CREATE TRIGGER trigger_update_financial_total
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_financial_total();

-- ============================================================
-- ADD SAMPLE TRANSACTIONS FOR EXISTING PARTNERS
-- ============================================================

-- Add sample transactions for existing test partners
DO $$
DECLARE
  barista_id UUID := '22222222-2222-2222-2222-222222222222';
  gym_id UUID := '33333333-3333-3333-3333-333333333333';
  coffee_id UUID := '44444444-4444-4444-4444-444444444444';
  tinder_id UUID := '66666666-6666-6666-6666-666666666666';
BEGIN
  -- Only insert if the partners exist
  IF EXISTS (SELECT 1 FROM public.partners WHERE id = barista_id) THEN
    -- Barista Girl transactions (total should be ~200)
    INSERT INTO public.transactions (partner_id, amount, category, description, date) VALUES
      (barista_id, 45.50, 'Dining', 'Coffee date at her cafe', NOW() - INTERVAL '3 days'),
      (barista_id, 80.00, 'Dining', 'Dinner at Italian restaurant', NOW() - INTERVAL '7 days'),
      (barista_id, 35.00, 'Gifts', 'Flowers for birthday', NOW() - INTERVAL '15 days'),
      (barista_id, 25.00, 'Entertainment', 'Movie tickets', NOW() - INTERVAL '20 days'),
      (barista_id, 14.50, 'Dining', 'Brunch together', NOW() - INTERVAL '25 days');

    RAISE NOTICE 'Added transactions for Barista Girl';
  END IF;

  IF EXISTS (SELECT 1 FROM public.partners WHERE id = gym_id) THEN
    -- Gym Crush transactions (total should be ~300)
    INSERT INTO public.transactions (partner_id, amount, category, description, date) VALUES
      (gym_id, 120.00, 'Activities', 'Gym membership gift', NOW() - INTERVAL '10 days'),
      (gym_id, 85.00, 'Dining', 'Post-workout protein smoothies', NOW() - INTERVAL '15 days'),
      (gym_id, 60.00, 'Gifts', 'Fitness gear', NOW() - INTERVAL '30 days'),
      (gym_id, 35.00, 'Activities', 'Rock climbing date', NOW() - INTERVAL '45 days');

    RAISE NOTICE 'Added transactions for Gym Crush';
  END IF;

  IF EXISTS (SELECT 1 FROM public.partners WHERE id = coffee_id) THEN
    -- Coffee Shop Regular transactions (total should be ~50)
    INSERT INTO public.transactions (partner_id, amount, category, description, date) VALUES
      (coffee_id, 15.00, 'Dining', 'Coffee and pastries', NOW() - INTERVAL '1 day'),
      (coffee_id, 20.00, 'Dining', 'Lunch at cafe', NOW() - INTERVAL '5 days'),
      (coffee_id, 15.00, 'Dining', 'Coffee date', NOW() - INTERVAL '10 days');

    RAISE NOTICE 'Added transactions for Coffee Shop Regular';
  END IF;

  IF EXISTS (SELECT 1 FROM public.partners WHERE id = tinder_id) THEN
    -- Tinder Match transactions (total should be ~20)
    INSERT INTO public.transactions (partner_id, amount, category, description, date) VALUES
      (tinder_id, 12.00, 'Dining', 'Coffee first date', NOW() - INTERVAL '2 days'),
      (tinder_id, 8.00, 'Dining', 'Ice cream', NOW() - INTERVAL '5 days');

    RAISE NOTICE 'Added transactions for Tinder Match';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'TRANSACTIONS TABLE SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Transactions have been created for all active partners.';
  RAISE NOTICE 'The financial_total field will now auto-update when you add/edit/delete transactions.';
  RAISE NOTICE '';
END $$;

-- Verify the setup
SELECT
  p.nickname,
  p.financial_total as current_total,
  COUNT(t.id) as transaction_count,
  COALESCE(SUM(t.amount), 0) as calculated_total
FROM public.partners p
LEFT JOIN public.transactions t ON t.partner_id = p.id
WHERE p.status != 'Graveyard'
GROUP BY p.id, p.nickname, p.financial_total
ORDER BY calculated_total DESC;
