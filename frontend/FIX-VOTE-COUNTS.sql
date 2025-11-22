-- Fix voting system to ensure one vote per user per note
-- This script ensures the unique constraint exists and recalculates vote counts

-- =============================================
-- 1. Remove duplicate votes (keep most recent)
-- =============================================

-- Delete duplicate votes, keeping only the most recent vote per user per note
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

-- =============================================
-- 2. Ensure unique constraint exists
-- =============================================

-- Drop the constraint if it exists (to avoid errors)
ALTER TABLE public.partner_note_votes
DROP CONSTRAINT IF EXISTS partner_note_votes_note_id_user_id_key;

-- Add the unique constraint
ALTER TABLE public.partner_note_votes
ADD CONSTRAINT partner_note_votes_note_id_user_id_key
UNIQUE(note_id, user_id);

-- =============================================
-- 3. Recalculate vote counts for all notes
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
-- 4. Verify the fix
-- =============================================

-- Show notes with their recalculated vote counts
SELECT
    id,
    content,
    upvotes,
    downvotes,
    (SELECT COUNT(*) FROM partner_note_votes WHERE note_id = partner_notes.id AND vote_type = 'up') as actual_upvotes,
    (SELECT COUNT(*) FROM partner_note_votes WHERE note_id = partner_notes.id AND vote_type = 'down') as actual_downvotes
FROM public.partner_notes
ORDER BY created_at DESC
LIMIT 10;

COMMENT ON CONSTRAINT partner_note_votes_note_id_user_id_key
ON public.partner_note_votes
IS 'Ensures each user can only cast one vote (up or down) per note';
