-- Check all partners and which groups they belong to
SELECT
    p.id as partner_id,
    p.nickname,
    p.user_id,
    p.group_id,
    g.name as group_name,
    p.status,
    p.financial_total,
    p.created_at
FROM partners p
LEFT JOIN groups g ON p.group_id = g.id
ORDER BY p.user_id, p.nickname, p.group_id;

-- Check which users are in which groups
SELECT
    gm.user_id,
    gm.group_id,
    g.name as group_name,
    gm.role
FROM group_members gm
LEFT JOIN groups g ON gm.group_id = g.id
ORDER BY gm.user_id, gm.group_id;

-- Find partners that exist in one group but not another (for same user + nickname)
SELECT
    p1.nickname,
    p1.user_id,
    p1.group_id as has_in_group,
    g1.name as group_name,
    gm.group_id as missing_in_group,
    g2.name as missing_group_name
FROM partners p1
JOIN group_members gm ON p1.user_id = gm.user_id AND p1.group_id != gm.group_id
LEFT JOIN groups g1 ON p1.group_id = g1.id
LEFT JOIN groups g2 ON gm.group_id = g2.id
WHERE NOT EXISTS (
    SELECT 1 FROM partners p2
    WHERE p2.user_id = p1.user_id
    AND p2.nickname = p1.nickname
    AND p2.group_id = gm.group_id
)
ORDER BY p1.user_id, p1.nickname;
