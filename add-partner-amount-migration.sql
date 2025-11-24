-- Migration: Add partner_amount field to timeline_events table
-- This field tracks how much the partner spent (gifts, paid for dates, etc.)

ALTER TABLE public.timeline_events
ADD COLUMN IF NOT EXISTS partner_amount numeric CHECK (partner_amount >= 0::numeric);

-- Add comment explaining the field
COMMENT ON COLUMN public.timeline_events.partner_amount IS 'Amount spent by the partner (gifts, paying for dates, etc.)';
