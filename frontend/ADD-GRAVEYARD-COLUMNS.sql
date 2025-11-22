-- ============================================================
-- ADD GRAVEYARD COLUMNS TO PARTNERS TABLE
-- ============================================================
-- This migration adds the missing graveyard-related columns
-- to the partners table without dropping existing data.
-- ============================================================

-- Add the graveyard columns if they don't exist
DO $$
BEGIN
    -- Add cause_of_death column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'partners'
        AND column_name = 'cause_of_death'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN cause_of_death TEXT;
        RAISE NOTICE '✓ Added cause_of_death column';
    ELSE
        RAISE NOTICE '  cause_of_death column already exists';
    END IF;

    -- Add cause_of_death_custom column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'partners'
        AND column_name = 'cause_of_death_custom'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN cause_of_death_custom TEXT;
        RAISE NOTICE '✓ Added cause_of_death_custom column';
    ELSE
        RAISE NOTICE '  cause_of_death_custom column already exists';
    END IF;

    -- Add graveyard_date column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'partners'
        AND column_name = 'graveyard_date'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN graveyard_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✓ Added graveyard_date column';
    ELSE
        RAISE NOTICE '  graveyard_date column already exists';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'GRAVEYARD COLUMNS MIGRATION COMPLETE!';
    RAISE NOTICE '========================================';
END $$;

-- Verify the columns were added
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'partners'
AND column_name IN ('cause_of_death', 'cause_of_death_custom', 'graveyard_date')
ORDER BY column_name;
