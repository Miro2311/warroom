-- Sync all existing timeline events across matching partners
-- This script copies timeline events from one partner to all matching partners (same nickname + user_id)

-- First, let's see which partners have matching profiles across groups
SELECT
    p1.id as partner1_id,
    p2.id as partner2_id,
    p1.nickname,
    p1.user_id,
    p1.group_id as group1,
    p2.group_id as group2,
    (SELECT COUNT(*) FROM timeline_events WHERE partner_id = p1.id) as events_in_group1,
    (SELECT COUNT(*) FROM timeline_events WHERE partner_id = p2.id) as events_in_group2
FROM partners p1
JOIN partners p2 ON p1.nickname = p2.nickname
    AND p1.user_id = p2.user_id
    AND p1.id != p2.id
    AND p1.group_id < p2.group_id;

-- Copy missing timeline events from partner to all matching partners
-- This inserts events that exist for one partner but not for matching partners
INSERT INTO timeline_events (partner_id, event_type, title, description, event_date, amount, partner_amount, category, severity, intimacy_change, metadata)
SELECT
    p2.id as partner_id,
    te.event_type,
    te.title,
    te.description,
    te.event_date,
    te.amount,
    te.partner_amount,
    te.category,
    te.severity,
    te.intimacy_change,
    te.metadata
FROM timeline_events te
JOIN partners p1 ON te.partner_id = p1.id
JOIN partners p2 ON p1.nickname = p2.nickname
    AND p1.user_id = p2.user_id
    AND p1.id != p2.id
WHERE NOT EXISTS (
    -- Don't insert if an event with same title, date, and type already exists
    SELECT 1 FROM timeline_events te2
    WHERE te2.partner_id = p2.id
    AND te2.title = te.title
    AND te2.event_date = te.event_date
    AND te2.event_type = te.event_type
);

-- Now recalculate financial_total for all partners
UPDATE partners p
SET financial_total = (
    SELECT COALESCE(SUM(COALESCE(amount, 0)) - SUM(COALESCE(partner_amount, 0)), 0)
    FROM timeline_events te
    WHERE te.partner_id = p.id
    AND te.event_type IN ('expense', 'date')
);

-- Verify the sync worked
SELECT
    p.nickname,
    p.group_id,
    p.financial_total,
    (SELECT COUNT(*) FROM timeline_events WHERE partner_id = p.id) as event_count
FROM partners p
ORDER BY p.nickname, p.group_id;
