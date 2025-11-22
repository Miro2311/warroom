# Voting System Fix - One Vote Per User Per Note

## Problem
Users were able to click the upvote/downvote buttons multiple times on group notes, and the vote counts would keep incrementing instead of being limited to one vote per user.

## Solution
The fix ensures that each user can only cast ONE vote per note (either upvote OR downvote), with the ability to:
1. Switch their vote (from upvote to downvote or vice versa)
2. Remove their vote by clicking the same button again (toggle off)
3. Cannot vote multiple times - system enforces one vote maximum

## Changes Made

### 1. Database Schema (Already in place)
The database already has the correct schema in `DATABASE-INTEL-FEATURES.sql`:
- `partner_note_votes` table tracks individual votes
- `UNIQUE(note_id, user_id)` constraint ensures one vote per user per note
- Vote counts are stored in `partner_notes.upvotes` and `partner_notes.downvotes`

### 2. SQL Fix Script
Created `FIX-VOTE-COUNTS.sql` to:
- Remove any duplicate votes (keeping only the most recent)
- Ensure the unique constraint exists
- Recalculate all vote counts to match actual votes in the database

### 3. Frontend Code Improvements
Updated `IntelTab.tsx:294-389` with better vote handling:
- Changed `.single()` to `.maybeSingle()` to avoid errors when no vote exists
- Added proper error handling for all database operations
- Recalculate vote counts from the votes table after each vote action
- Ensures UI reloads to show accurate state even if errors occur
- Handles race conditions by reloading data when unique constraint violations occur

## How to Apply the Fix

### Step 1: Run the SQL Fix Script
Execute the SQL script against your Supabase database:

```bash
# Copy the contents of FIX-VOTE-COUNTS.sql and run in Supabase SQL Editor
# OR use the Supabase CLI:
# supabase db execute < frontend/FIX-VOTE-COUNTS.sql
```

This will:
- Clean up any duplicate votes
- Ensure the unique constraint is in place
- Fix vote counts to match actual votes

### Step 2: Test the Voting System
1. Open the app and navigate to a partner's Intel tab
2. Add a group note if there aren't any
3. Try the following scenarios:

**Scenario 1: New Vote**
- Click upvote - count should increase to 1
- Click upvote again - count should decrease to 0 (toggle off)

**Scenario 2: Switch Vote**
- Click upvote - count should show 1 upvote, 0 downvote
- Click downvote - count should show 0 upvote, 1 downvote
- The vote switched, not added

**Scenario 3: Multiple Users**
- Have different users vote on the same note
- Each user's vote should be independent
- Each user can only have one active vote at a time

### Step 3: Verify in Database
Check that the unique constraint is working:

```sql
-- This should show one vote per user per note
SELECT note_id, user_id, vote_type, COUNT(*)
FROM partner_note_votes
GROUP BY note_id, user_id, vote_type
HAVING COUNT(*) > 1;

-- Should return no rows (empty result)
```

## Technical Details

### Vote Flow
1. User clicks upvote or downvote button
2. Frontend checks if user has already voted on this note
3. Based on existing vote:
   - **No vote**: Insert new vote
   - **Same vote**: Delete vote (toggle off)
   - **Different vote**: Update vote type (switch)
4. Recalculate vote counts from votes table
5. Update the note's vote counts
6. Reload notes to show updated UI

### Database Constraint
```sql
ALTER TABLE public.partner_note_votes
ADD CONSTRAINT partner_note_votes_note_id_user_id_key
UNIQUE(note_id, user_id);
```

This ensures at the database level that no user can have multiple votes on the same note.

## Benefits
- Prevents vote manipulation
- Ensures accurate vote counts
- Better user experience with toggle functionality
- Database-enforced data integrity
- Handles race conditions gracefully
