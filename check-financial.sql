-- Check timeline events with amounts
SELECT
    te.id,
    te.title,
    te.event_type,
    te.amount as your_spending,
    te.partner_amount as her_spending,
    te.event_date,
    p.nickname,
    p.financial_total
FROM timeline_events te
JOIN partners p ON te.partner_id = p.id
WHERE te.event_type IN ('expense', 'date')
ORDER BY te.event_date DESC;

-- Check if partner_amount column exists and has data
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'timeline_events'
AND column_name IN ('amount', 'partner_amount');

-- Recalculate financial_total for all partners (manual fix)
-- financial_total = SUM(your spending) - SUM(her spending)
UPDATE partners p
SET financial_total = (
    SELECT COALESCE(SUM(COALESCE(amount, 0)) - SUM(COALESCE(partner_amount, 0)), 0)
    FROM timeline_events te
    WHERE te.partner_id = p.id
    AND te.event_type IN ('expense', 'date')
);

-- Verify the update
SELECT
    p.nickname,
    p.financial_total,
    (SELECT SUM(COALESCE(amount, 0)) FROM timeline_events WHERE partner_id = p.id AND event_type IN ('expense', 'date')) as your_total,
    (SELECT SUM(COALESCE(partner_amount, 0)) FROM timeline_events WHERE partner_id = p.id AND event_type IN ('expense', 'date')) as her_total
FROM partners p;
