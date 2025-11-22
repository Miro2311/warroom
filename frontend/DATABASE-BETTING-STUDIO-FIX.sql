-- =============================================
-- FIX: Add missing RLS policies for weekly_system_bets
-- =============================================

-- Allow users to view weekly bets in their groups
CREATE POLICY "Users can view weekly bets in their groups"
    ON public.weekly_system_bets FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = auth.uid()
        )
    );

-- Allow system/users to create weekly bet records in their groups
CREATE POLICY "Users can create weekly bets in their groups"
    ON public.weekly_system_bets FOR INSERT
    WITH CHECK (
        group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = auth.uid()
        )
    );

-- Allow users to update weekly bet counts in their groups
CREATE POLICY "Users can update weekly bets in their groups"
    ON public.weekly_system_bets FOR UPDATE
    USING (
        group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = auth.uid()
        )
    );
