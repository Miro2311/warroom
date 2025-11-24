-- Add unique constraint to prevent duplicate group memberships
-- This ensures a user can only be a member of a group once
-- Run this AFTER testing that no duplicate memberships exist

-- First, check for existing duplicates
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO duplicate_count
  FROM (
    SELECT group_id, user_id, COUNT(*) as cnt
    FROM public.group_members
    GROUP BY group_id, user_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE NOTICE 'WARNING: Found % duplicate memberships that need to be cleaned up', duplicate_count;
    RAISE NOTICE 'Run the following query to see duplicates:';
    RAISE NOTICE 'SELECT group_id, user_id, COUNT(*) FROM public.group_members GROUP BY group_id, user_id HAVING COUNT(*) > 1;';
  ELSE
    RAISE NOTICE 'No duplicate memberships found, safe to add constraint';
  END IF;
END $$;

-- Clean up duplicates by keeping only the oldest record for each (group_id, user_id) pair
DELETE FROM public.group_members
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY group_id, user_id ORDER BY joined_at ASC) as rn
    FROM public.group_members
  ) t
  WHERE t.rn > 1
);

-- Add unique constraint on (group_id, user_id)
-- This prevents the race condition where a user could join a group multiple times
ALTER TABLE public.group_members
ADD CONSTRAINT group_members_group_user_unique UNIQUE (group_id, user_id);

-- Verify constraint was added
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'group_members'
  AND tc.constraint_type = 'UNIQUE';
