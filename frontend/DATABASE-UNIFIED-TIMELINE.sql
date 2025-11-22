-- ============================================================
-- UNIFIED TIMELINE EVENTS SYSTEM
-- ============================================================
-- This replaces the separate transactions table with a unified
-- timeline_events table that supports multiple event types
-- ============================================================

-- Drop old transactions table if it exists
DROP TABLE IF EXISTS public.transactions CASCADE;

-- Create unified timeline_events table
CREATE TABLE IF NOT EXISTS public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,

  -- Event type and basic info
  event_type TEXT NOT NULL CHECK (event_type IN ('date', 'expense', 'red_flag', 'note', 'intimacy', 'status_change', 'milestone')),
  title TEXT NOT NULL,
  description TEXT,

  -- Timing
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Financial data (for expenses and dates with costs)
  amount DECIMAL(10,2) CHECK (amount >= 0),
  category TEXT CHECK (category IN ('Dining', 'Entertainment', 'Gifts', 'Travel', 'Shopping', 'Activities', 'Other')),

  -- Red flag data
  severity TEXT CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),

  -- Intimacy data
  intimacy_change INTEGER CHECK (intimacy_change >= -10 AND intimacy_change <= 10),

  -- Flexible metadata for additional data
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_timeline_events_partner_id ON public.timeline_events(partner_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON public.timeline_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_events_type ON public.timeline_events(event_type);
CREATE INDEX IF NOT EXISTS idx_timeline_events_partner_type ON public.timeline_events(partner_id, event_type);

-- Disable RLS for development
ALTER TABLE public.timeline_events DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- AUTO-CALCULATE financial_total FROM EXPENSE EVENTS
-- ============================================================

-- Function to recalculate financial_total for a partner
CREATE OR REPLACE FUNCTION recalculate_partner_totals(p_partner_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update financial_total from expense events
  UPDATE public.partners
  SET financial_total = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.timeline_events
    WHERE partner_id = p_partner_id
    AND event_type IN ('expense', 'date')
    AND amount IS NOT NULL
  )
  WHERE id = p_partner_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update partner totals on timeline event changes
CREATE OR REPLACE FUNCTION update_partner_totals_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT and UPDATE
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- Only recalculate if it's an expense or date event
    IF NEW.event_type IN ('expense', 'date') THEN
      PERFORM recalculate_partner_totals(NEW.partner_id);
    END IF;
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF (TG_OP = 'DELETE') THEN
    IF OLD.event_type IN ('expense', 'date') THEN
      PERFORM recalculate_partner_totals(OLD.partner_id);
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_partner_totals ON public.timeline_events;

-- Create trigger
CREATE TRIGGER trigger_update_partner_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_totals_trigger();

-- ============================================================
-- ADD SAMPLE TIMELINE EVENTS
-- ============================================================

DO $$
DECLARE
  barista_id UUID := '22222222-2222-2222-2222-222222222222';
  gym_id UUID := '33333333-3333-3333-3333-333333333333';
  coffee_id UUID := '44444444-4444-4444-4444-444444444444';
  tinder_id UUID := '66666666-6666-6666-6666-666666666666';
BEGIN
  -- Barista Girl events
  IF EXISTS (SELECT 1 FROM public.partners WHERE id = barista_id) THEN
    INSERT INTO public.timeline_events (partner_id, event_type, title, description, event_date, amount, category) VALUES
      (barista_id, 'date', 'Coffee Date at her Cafe', 'First proper date, she made me a custom latte', NOW() - INTERVAL '3 days', 45.50, 'Dining'),
      (barista_id, 'expense', 'Dinner at Italian Restaurant', 'Celebration dinner for her promotion', NOW() - INTERVAL '7 days', 80.00, 'Dining'),
      (barista_id, 'red_flag', 'Still talks about ex', 'Mentioned her ex-boyfriend multiple times during dinner', NOW() - INTERVAL '7 days', NULL, NULL),
      (barista_id, 'note', 'She loves jazz music', 'Found out she plays saxophone on weekends', NOW() - INTERVAL '10 days', NULL, NULL),
      (barista_id, 'date', 'Birthday Surprise', 'Brought her flowers at work', NOW() - INTERVAL '15 days', 35.00, 'Gifts'),
      (barista_id, 'intimacy', 'First Kiss', 'Amazing chemistry, felt natural', NOW() - INTERVAL '18 days', NULL, NULL),
      (barista_id, 'expense', 'Movie Night', 'Watched indie film she recommended', NOW() - INTERVAL '20 days', 25.00, 'Entertainment'),
      (barista_id, 'milestone', 'Met her Friends', 'Brunch with her college friends, went well', NOW() - INTERVAL '25 days', 30.00, 'Dining');

    RAISE NOTICE 'Added timeline events for Barista Girl';
  END IF;

  -- Gym Crush events
  IF EXISTS (SELECT 1 FROM public.partners WHERE id = gym_id) THEN
    INSERT INTO public.timeline_events (partner_id, event_type, title, description, event_date, amount, category, severity) VALUES
      (gym_id, 'expense', 'Gym Membership Gift', 'Got her a 3-month membership at my gym', NOW() - INTERVAL '10 days', 120.00, 'Activities', NULL),
      (gym_id, 'red_flag', 'Flirting with Trainer', 'Saw her being too friendly with the new trainer', NOW() - INTERVAL '12 days', NULL, NULL, 'Medium'),
      (gym_id, 'date', 'Post-Workout Smoothies', 'Smoothie bar date after leg day', NOW() - INTERVAL '15 days', 28.00, 'Dining', NULL),
      (gym_id, 'note', 'Competitive Nature', 'She always tries to outlift me, it is kind of hot', NOW() - INTERVAL '20 days', NULL, NULL, NULL),
      (gym_id, 'expense', 'Fitness Gear Gift', 'New workout clothes for her', NOW() - INTERVAL '30 days', 60.00, 'Gifts', NULL),
      (gym_id, 'date', 'Rock Climbing Adventure', 'First date outside the gym, she crushed it', NOW() - INTERVAL '45 days', 45.00, 'Activities', NULL);

    RAISE NOTICE 'Added timeline events for Gym Crush';
  END IF;

  -- Coffee Shop Regular events
  IF EXISTS (SELECT 1 FROM public.partners WHERE id = coffee_id) THEN
    INSERT INTO public.timeline_events (partner_id, event_type, title, description, event_date, amount, category) VALUES
      (coffee_id, 'date', 'Coffee and Pastries', 'Casual meetup at her favorite spot', NOW() - INTERVAL '1 day', 15.00, 'Dining'),
      (coffee_id, 'note', 'Works in Tech', 'Software engineer at a startup, very interesting', NOW() - INTERVAL '3 days', NULL, NULL),
      (coffee_id, 'date', 'Lunch at Cafe', 'Extended coffee date turned into lunch', NOW() - INTERVAL '5 days', 28.00, 'Dining'),
      (coffee_id, 'red_flag', 'Always on Phone', 'Checked her phone constantly during date', NOW() - INTERVAL '5 days', NULL, NULL),
      (coffee_id, 'date', 'First Meeting', 'Met while waiting in line for coffee', NOW() - INTERVAL '10 days', 12.00, 'Dining');

    RAISE NOTICE 'Added timeline events for Coffee Shop Regular';
  END IF;

  -- Tinder Match events
  IF EXISTS (SELECT 1 FROM public.partners WHERE id = tinder_id) THEN
    INSERT INTO public.timeline_events (partner_id, event_type, title, description, event_date, amount, category) VALUES
      (tinder_id, 'milestone', 'Became Exclusive', 'Had the talk, now officially dating', NOW() - INTERVAL '1 day', NULL, NULL),
      (tinder_id, 'date', 'Ice Cream Date', 'Walk in the park with ice cream', NOW() - INTERVAL '2 days', 8.00, 'Dining'),
      (tinder_id, 'intimacy', 'Great Connection', 'Everything just feels easy and natural', NOW() - INTERVAL '3 days', NULL, NULL),
      (tinder_id, 'date', 'Coffee First Date', 'Matched on Tinder, met for coffee, instant chemistry', NOW() - INTERVAL '5 days', 12.00, 'Dining'),
      (tinder_id, 'note', 'She is a Doctor', 'Resident at local hospital, busy schedule but makes time', NOW() - INTERVAL '6 days', NULL, NULL);

    RAISE NOTICE 'Added timeline events for Tinder Match';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'UNIFIED TIMELINE SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Timeline events support multiple types:';
  RAISE NOTICE '  - date: Dates with optional expenses';
  RAISE NOTICE '  - expense: Standalone expenses';
  RAISE NOTICE '  - red_flag: Warning signs and concerns';
  RAISE NOTICE '  - note: General observations and memories';
  RAISE NOTICE '  - intimacy: Intimacy milestones';
  RAISE NOTICE '  - status_change: Relationship status updates';
  RAISE NOTICE '  - milestone: Important relationship moments';
  RAISE NOTICE '';
  RAISE NOTICE 'Financial totals auto-calculate from date and expense events.';
  RAISE NOTICE '';
END $$;

-- ============================================================
-- VERIFICATION
-- ============================================================

SELECT '=== TIMELINE EVENTS SUMMARY ===' as section;
SELECT
  p.nickname,
  p.financial_total,
  COUNT(*) as total_events,
  SUM(CASE WHEN te.event_type = 'date' THEN 1 ELSE 0 END) as dates,
  SUM(CASE WHEN te.event_type = 'expense' THEN 1 ELSE 0 END) as expenses,
  SUM(CASE WHEN te.event_type = 'red_flag' THEN 1 ELSE 0 END) as red_flags,
  SUM(CASE WHEN te.event_type = 'note' THEN 1 ELSE 0 END) as notes,
  COALESCE(SUM(te.amount), 0) as calculated_total
FROM public.partners p
LEFT JOIN public.timeline_events te ON te.partner_id = p.id
WHERE p.status != 'Graveyard'
GROUP BY p.id, p.nickname, p.financial_total
ORDER BY total_events DESC;

SELECT '=== RECENT TIMELINE EVENTS ===' as section;
SELECT
  p.nickname,
  te.event_type,
  te.title,
  te.event_date,
  te.amount
FROM public.timeline_events te
JOIN public.partners p ON p.id = te.partner_id
ORDER BY te.event_date DESC
LIMIT 10;
