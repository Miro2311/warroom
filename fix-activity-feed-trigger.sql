-- ===========================================
-- FIX: Activity Feed Trigger - Only create activities in groups where actor is member
-- ===========================================
-- Problem: When a user makes changes to a partner, activities are being created
-- in groups where the actor is NOT a member.
--
-- Solution: Before creating an activity, verify that the actor_id is a member
-- of the target group_id.
--
-- WICHTIG: Dieses Script muss in Supabase SQL Editor ausgefuehrt werden!

-- First, let's check what triggers exist on activity_feed related tables
-- Run this to see existing triggers:
-- SELECT tgname, tgrelid::regclass, tgtype, proname
-- FROM pg_trigger t
-- JOIN pg_proc p ON t.tgfoid = p.oid
-- WHERE tgrelid::regclass::text IN ('partners', 'partner_notes', 'partner_ratings', 'partner_red_flags', 'partner_images');

-- ===========================================
-- Option 1: Add a check constraint/trigger on activity_feed table itself
-- This ensures NO activity can be inserted where actor is not a group member
-- ===========================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS check_activity_actor_membership ON activity_feed;
DROP FUNCTION IF EXISTS check_activity_actor_is_group_member();

-- Create function to validate actor membership before insert
CREATE OR REPLACE FUNCTION check_activity_actor_is_group_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the actor is a member of the target group
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = NEW.group_id
    AND user_id = NEW.actor_id
  ) THEN
    -- Actor is not a member of this group - silently skip the insert
    -- by returning NULL (for BEFORE INSERT triggers, this cancels the insert)
    RAISE NOTICE 'Activity skipped: actor % is not a member of group %', NEW.actor_id, NEW.group_id;
    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger that runs BEFORE INSERT to validate membership
CREATE TRIGGER check_activity_actor_membership
  BEFORE INSERT ON activity_feed
  FOR EACH ROW
  EXECUTE FUNCTION check_activity_actor_is_group_member();

-- ===========================================
-- Option 2: Clean up existing invalid activities (optional)
-- This removes activities where the actor was never a member of that group
-- ===========================================

-- First, let's see how many invalid activities exist:
-- SELECT COUNT(*) as invalid_count
-- FROM activity_feed af
-- WHERE NOT EXISTS (
--   SELECT 1 FROM group_members gm
--   WHERE gm.group_id = af.group_id
--   AND gm.user_id = af.actor_id
-- );

-- Uncomment to delete invalid activities:
-- DELETE FROM activity_feed af
-- WHERE NOT EXISTS (
--   SELECT 1 FROM group_members gm
--   WHERE gm.group_id = af.group_id
--   AND gm.user_id = af.actor_id
-- );

-- ===========================================
-- Verification queries
-- ===========================================

-- Check that the trigger was created:
-- SELECT tgname, tgrelid::regclass
-- FROM pg_trigger
-- WHERE tgrelid = 'activity_feed'::regclass;

-- Test: Try to insert an activity where actor is not a member (should be blocked):
-- INSERT INTO activity_feed (group_id, actor_id, event_type, title)
-- VALUES ('some-group-id', 'non-member-user-id', 'test', 'Test Activity');
-- This should be silently rejected

COMMENT ON FUNCTION check_activity_actor_is_group_member() IS
'Ensures that activities can only be created in groups where the actor is a member.
This prevents cross-group activity leakage when users are members of multiple groups.';
