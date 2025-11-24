-- Sync missing partners: Copy partners that exist in one group but not another
-- This will copy "Anja" from "Ukraine" to "Gäu Figgers"

INSERT INTO partners (nickname, user_id, group_id, status, financial_total, time_total, intimacy_score)
SELECT
    p1.nickname,
    p1.user_id,
    gm.group_id as target_group_id,
    p1.status,
    p1.financial_total,
    p1.time_total,
    p1.intimacy_score
FROM partners p1
JOIN group_members gm ON p1.user_id = gm.user_id AND p1.group_id != gm.group_id
WHERE NOT EXISTS (
    SELECT 1 FROM partners p2
    WHERE p2.user_id = p1.user_id
    AND p2.nickname = p1.nickname
    AND p2.group_id = gm.group_id
);

-- Verify the sync worked
SELECT
    p.nickname,
    p.user_id,
    p.group_id,
    g.name as group_name
FROM partners p
LEFT JOIN groups g ON p.group_id = g.id
WHERE p.nickname = 'Anja'
ORDER BY p.group_id;
