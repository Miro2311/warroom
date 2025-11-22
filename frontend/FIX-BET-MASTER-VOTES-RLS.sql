-- Add UPDATE policy for bet_master_votes
-- Users should be able to change their own votes

CREATE POLICY "Users can update their own votes"
    ON public.bet_master_votes FOR UPDATE
    USING (voter_id = auth.uid())
    WITH CHECK (voter_id = auth.uid());
