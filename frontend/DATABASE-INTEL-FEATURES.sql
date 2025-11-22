-- Intel Tab Features: Group Notes, Red Flags, and Peer Ratings
-- This adds collaborative intelligence features for the Intel tab

-- =============================================
-- PARTNER NOTES (Group Notes & Roasts)
-- =============================================
CREATE TABLE IF NOT EXISTS public.partner_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_partner_notes_partner_id ON public.partner_notes(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_notes_author_id ON public.partner_notes(author_id);

-- =============================================
-- NOTE VOTES (Track individual user votes)
-- =============================================
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

-- =============================================
-- RED FLAGS
-- =============================================
CREATE TABLE IF NOT EXISTS public.partner_red_flags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    reported_by_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    severity VARCHAR(10) CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_partner_red_flags_partner_id ON public.partner_red_flags(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_red_flags_reported_by_id ON public.partner_red_flags(reported_by_id);

-- =============================================
-- PEER RATINGS
-- =============================================
CREATE TABLE IF NOT EXISTS public.partner_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    rater_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 10) NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- One rating per user per partner
    UNIQUE(partner_id, rater_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_partner_ratings_partner_id ON public.partner_ratings(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_ratings_rater_id ON public.partner_ratings(rater_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
-- NOTE: RLS is DISABLED for development. Enable in production!

-- Disable RLS for development (matching other tables)
ALTER TABLE public.partner_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_note_votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_red_flags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_ratings DISABLE ROW LEVEL SECURITY;

-- ========== PRODUCTION RLS POLICIES (commented out for dev) ==========
-- Uncomment these when moving to production

/*
-- Enable RLS on all tables
ALTER TABLE public.partner_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_red_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_ratings ENABLE ROW LEVEL SECURITY;

-- ========== PARTNER NOTES POLICIES ==========

-- Anyone can read notes for partners in their group
CREATE POLICY "Users can read notes for partners in their group"
    ON public.partner_notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.partners p
            INNER JOIN public.group_members gm ON gm.group_id = p.group_id
            WHERE p.id = partner_notes.partner_id
            AND gm.user_id = auth.uid()
        )
    );

-- Users can insert notes for any partner in their group
CREATE POLICY "Users can create notes for partners in their group"
    ON public.partner_notes FOR INSERT
    WITH CHECK (
        auth.uid() = author_id
        AND EXISTS (
            SELECT 1 FROM public.partners p
            INNER JOIN public.group_members gm ON gm.group_id = p.group_id
            WHERE p.id = partner_notes.partner_id
            AND gm.user_id = auth.uid()
        )
    );

-- Users can update any note for voting (within their group)
CREATE POLICY "Users can update notes for voting"
    ON public.partner_notes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.partners p
            INNER JOIN public.group_members gm ON gm.group_id = p.group_id
            WHERE p.id = partner_notes.partner_id
            AND gm.user_id = auth.uid()
        )
    );

-- Users can delete their own notes
CREATE POLICY "Users can delete their own notes"
    ON public.partner_notes FOR DELETE
    USING (auth.uid() = author_id);

-- ========== RED FLAGS POLICIES ==========

-- Anyone can read red flags for partners in their group
CREATE POLICY "Users can read red flags for partners in their group"
    ON public.partner_red_flags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.partners p
            INNER JOIN public.group_members gm ON gm.group_id = p.group_id
            WHERE p.id = partner_red_flags.partner_id
            AND gm.user_id = auth.uid()
        )
    );

-- Users can report red flags for any partner in their group
CREATE POLICY "Users can report red flags for partners in their group"
    ON public.partner_red_flags FOR INSERT
    WITH CHECK (
        auth.uid() = reported_by_id
        AND EXISTS (
            SELECT 1 FROM public.partners p
            INNER JOIN public.group_members gm ON gm.group_id = p.group_id
            WHERE p.id = partner_red_flags.partner_id
            AND gm.user_id = auth.uid()
        )
    );

-- Users can delete their own red flags
CREATE POLICY "Users can delete their own red flags"
    ON public.partner_red_flags FOR DELETE
    USING (auth.uid() = reported_by_id);

-- ========== PEER RATINGS POLICIES ==========

-- Anyone can read ratings for partners in their group
CREATE POLICY "Users can read ratings for partners in their group"
    ON public.partner_ratings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.partners p
            INNER JOIN public.group_members gm ON gm.group_id = p.group_id
            WHERE p.id = partner_ratings.partner_id
            AND gm.user_id = auth.uid()
        )
    );

-- Users can add ratings for any partner in their group
CREATE POLICY "Users can add ratings for partners in their group"
    ON public.partner_ratings FOR INSERT
    WITH CHECK (
        auth.uid() = rater_id
        AND EXISTS (
            SELECT 1 FROM public.partners p
            INNER JOIN public.group_members gm ON gm.group_id = p.group_id
            WHERE p.id = partner_ratings.partner_id
            AND gm.user_id = auth.uid()
        )
    );

-- Users can update their own ratings
CREATE POLICY "Users can update their own ratings"
    ON public.partner_ratings FOR UPDATE
    USING (auth.uid() = rater_id);

-- Users can delete their own ratings
CREATE POLICY "Users can delete their own ratings"
    ON public.partner_ratings FOR DELETE
    USING (auth.uid() = rater_id);
*/

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Update updated_at timestamp on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for all tables
CREATE TRIGGER update_partner_notes_updated_at
    BEFORE UPDATE ON partner_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_red_flags_updated_at
    BEFORE UPDATE ON partner_red_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_ratings_updated_at
    BEFORE UPDATE ON partner_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE partner_notes IS 'Collaborative notes and roasts from friends about a partner';
COMMENT ON TABLE partner_red_flags IS 'Red flags reported by the user or their friends';
COMMENT ON TABLE partner_ratings IS 'Peer ratings (1-10) from friends in the group';

COMMENT ON COLUMN partner_notes.upvotes IS 'Number of upvotes from group members';
COMMENT ON COLUMN partner_notes.downvotes IS 'Number of downvotes from group members';
COMMENT ON COLUMN partner_red_flags.severity IS 'Severity level: low, medium, or high';
COMMENT ON COLUMN partner_ratings.rating IS 'Rating from 1-10, where 10 is the best';
