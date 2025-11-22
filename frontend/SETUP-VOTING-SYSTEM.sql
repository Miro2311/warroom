-- Complete Voting System Setup
-- This script creates the voting tables and ensures proper constraints

-- =============================================
-- 1. CREATE VOTE TRACKING TABLE
-- =============================================

-- Create the vote tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.partner_note_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID NOT NULL REFERENCES public.partner_notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- One vote per user per note
    UNIQUE(note_id, user_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_partner_note_votes_note_id ON public.partner_note_votes(note_id);
CREATE INDEX IF NOT EXISTS idx_partner_note_votes_user_id ON public.partner_note_votes(user_id);

-- Disable RLS for development
ALTER TABLE public.partner_note_votes DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. CLEAN UP ANY EXISTING DUPLICATE VOTES
-- =============================================

-- If the table already existed, remove any duplicate votes
DO $$
BEGIN
    -- Try to remove duplicates (this will only work if table already had data)
    DELETE FROM public.partner_note_votes
    WHERE id IN (
        SELECT id FROM (
            SELECT id,
                ROW_NUMBER() OVER (
                    PARTITION BY note_id, user_id
                    ORDER BY created_at DESC
                ) as rn
            FROM public.partner_note_votes
        ) t
        WHERE t.rn > 1
    );

    RAISE NOTICE 'Cleaned up any duplicate votes';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'No duplicates to clean up';
END $$;

-- =============================================
-- 3. ENSURE UNIQUE CONSTRAINT EXISTS
-- =============================================

-- Drop the constraint if it exists (to avoid errors)
ALTER TABLE public.partner_note_votes
DROP CONSTRAINT IF EXISTS partner_note_votes_note_id_user_id_key;

-- Add the unique constraint
ALTER TABLE public.partner_note_votes
ADD CONSTRAINT partner_note_votes_note_id_user_id_key
UNIQUE(note_id, user_id);

-- =============================================
-- 4. RECALCULATE VOTE COUNTS FOR ALL NOTES
-- =============================================

-- Update upvotes and downvotes based on actual votes in partner_note_votes table
UPDATE public.partner_notes pn
SET
    upvotes = (
        SELECT COUNT(*)
        FROM public.partner_note_votes
        WHERE note_id = pn.id AND vote_type = 'up'
    ),
    downvotes = (
        SELECT COUNT(*)
        FROM public.partner_note_votes
        WHERE note_id = pn.id AND vote_type = 'down'
    );

-- =============================================
-- 5. VERIFY THE SETUP
-- =============================================

-- Show notes with their recalculated vote counts
SELECT
    id,
    LEFT(content, 50) as content_preview,
    upvotes,
    downvotes,
    (SELECT COUNT(*) FROM partner_note_votes WHERE note_id = partner_notes.id AND vote_type = 'up') as actual_upvotes,
    (SELECT COUNT(*) FROM partner_note_votes WHERE note_id = partner_notes.id AND vote_type = 'down') as actual_downvotes
FROM public.partner_notes
ORDER BY created_at DESC
LIMIT 10;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'VOTING SYSTEM SETUP COMPLETE!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Refresh your app';
    RAISE NOTICE '2. Try voting on a note';
    RAISE NOTICE '3. Verify you can only vote once per note';
    RAISE NOTICE '4. Test switching between upvote and downvote';
    RAISE NOTICE '==============================================';
END $$;

COMMENT ON TABLE public.partner_note_votes
IS 'Tracks individual user votes on partner notes. Ensures one vote per user per note.';

COMMENT ON CONSTRAINT partner_note_votes_note_id_user_id_key
ON public.partner_note_votes
IS 'Ensures each user can only cast one vote (up or down) per note';
