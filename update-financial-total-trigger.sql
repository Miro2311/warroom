-- Trigger to automatically update financial_total when timeline_events change
-- financial_total = SUM(amount) - SUM(partner_amount)

-- First, create a function to recalculate financial_total for a partner
CREATE OR REPLACE FUNCTION update_partner_financial_total()
RETURNS TRIGGER AS $$
DECLARE
    partner_uuid UUID;
    new_total NUMERIC;
BEGIN
    -- Get the partner_id depending on operation
    IF TG_OP = 'DELETE' THEN
        partner_uuid := OLD.partner_id;
    ELSE
        partner_uuid := NEW.partner_id;
    END IF;

    -- Calculate the new financial_total (your spending - her spending)
    SELECT COALESCE(SUM(COALESCE(amount, 0)) - SUM(COALESCE(partner_amount, 0)), 0)
    INTO new_total
    FROM timeline_events
    WHERE partner_id = partner_uuid
    AND event_type IN ('expense', 'date');

    -- Update the partner's financial_total
    UPDATE partners
    SET financial_total = new_total
    WHERE id = partner_uuid;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_financial_total ON timeline_events;

-- Create the trigger
CREATE TRIGGER trigger_update_financial_total
AFTER INSERT OR UPDATE OR DELETE ON timeline_events
FOR EACH ROW
EXECUTE FUNCTION update_partner_financial_total();

-- Also run a one-time update to fix all existing partners
UPDATE partners p
SET financial_total = (
    SELECT COALESCE(SUM(COALESCE(amount, 0)) - SUM(COALESCE(partner_amount, 0)), 0)
    FROM timeline_events te
    WHERE te.partner_id = p.id
    AND te.event_type IN ('expense', 'date')
);
