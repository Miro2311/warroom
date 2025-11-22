# Row Level Security (RLS) Setup Guide

## Overview
This guide explains how to enable Row Level Security (RLS) for production-ready data isolation in the Relationship War Room application.

## Problem
Currently, RLS is **DISABLED** on all tables, which means:
- All users can see ALL data in the database
- Users clicking on different suns see the same data
- No proper data isolation between users

## Solution
Enable RLS and create proper policies to ensure:
- Users only see partners in **their groups**
- Users can only edit/delete **their own partners**
- Intel features (notes, flags, ratings) are **shared** within groups but with proper delete permissions
- Timeline/Transactions are **owner-only** for create/delete

## How to Apply

### Step 1: Run the RLS Setup Script

Execute the SQL script in Supabase:

```bash
# In Supabase SQL Editor, run:
frontend/ENABLE-RLS-POLICIES.sql
```

This will:
1. Enable RLS on all tables
2. Create proper policies for data isolation
3. Set up permissions for shared vs owner-only features

### Step 2: Verify RLS is Enabled

After running the script, you should see:
```
RLS Status Check:
- users: ENABLED
- groups: ENABLED
- partners: ENABLED
- partner_notes: ENABLED
- partner_red_flags: ENABLED
- timeline_events: ENABLED
... (all tables should show ENABLED)
```

### Step 3: Test with Multiple Users

1. Login as **TestUser** (test@rwr.com)
   - Should see ONLY their own partners
   - Can edit/delete ONLY their own partners
   - Can view partners from other users in the same group
   - Can add notes/flags/ratings to any partner in the group

2. Login as **FriendOne** (friend1@rwr.com)
   - Should see ONLY their own partners
   - Should see TestUser's partners (read-only in most tabs)
   - Can add intel to TestUser's partners
   - Cannot delete TestUser's partners or timeline events

3. Login as **FriendTwo** (friend2@rwr.com)
   - Same behavior as FriendOne

## Permission Matrix

| Feature | View | Create | Update | Delete |
|---------|------|--------|--------|--------|
| **Partners** | All in group | Own only | Own only | Own only |
| **Timeline Events** | All in group | Own partners only | Own partners only | Own partners only |
| **Transactions** | All in group | Own partners only | - | Own partners only |
| **Notes (Intel)** | All in group | All in group | Own notes only | Own notes only |
| **Red Flags** | All in group | All in group | - | Author OR Partner Owner |
| **Ratings** | All in group | All in group | Own ratings only | Own ratings only |
| **Votes** | All in group | All in group | Own votes only | Own votes only |

## Key Rules

### Owner-Only Features
- **Partners**: Only the owner can create, update, or delete
- **Timeline**: Only the partner owner can add/delete events
- **Transactions**: Only the partner owner can add/delete transactions

### Shared Features (Intel Tab)
- **Notes**: Anyone in group can add, only author can delete
- **Red Flags**: Anyone in group can add, author OR partner owner can delete
- **Ratings**: Anyone in group can add, only author can edit/delete
- **Votes**: Anyone in group can vote, only voter can change/delete

### Read Access
- All users in a group can **view** all partners in that group
- This enables:
  - Betting Studio (betting on friends' relationships)
  - Intel sharing (notes, flags, ratings)
  - Group accountability

## Frontend Implementation

The frontend components have been updated with proper permission checks:

### IntelTab.tsx
- ✅ Delete buttons for notes (only show for author)
- ✅ Delete buttons for red flags (only show for author OR partner owner)
- ✅ Permission checks before delete operations

### TimelineTab.tsx
- ✅ "Add Event" button only shows for partner owner
- ✅ Delete buttons only show for partner owner
- ✅ View-only mode indicator for non-owners

### OverviewTab.tsx
- ✅ Edit mode only available for partner owner
- ✅ Read-only view for other group members

## Testing Checklist

After enabling RLS, verify the following:

- [ ] TestUser sees only their own partners in the solar system
- [ ] FriendOne sees only their own partners in the solar system
- [ ] TestUser can edit their partners (time, intimacy, status)
- [ ] FriendOne cannot edit TestUser's partners
- [ ] TestUser can add timeline events to their partners
- [ ] FriendOne cannot add timeline events to TestUser's partners
- [ ] Both TestUser and FriendOne can add notes to any partner in the group
- [ ] TestUser can delete their own notes
- [ ] TestUser can delete red flags on their partners (even if reported by someone else)
- [ ] FriendOne can only delete their own notes (not TestUser's notes)
- [ ] Both can add ratings and votes to any partner
- [ ] Each user sees their own XP/level correctly

## Rollback (Emergency)

If you need to temporarily disable RLS (for debugging):

```sql
-- WARNING: Only use for debugging, NOT for production!
ALTER TABLE public.partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_notes DISABLE ROW LEVEL SECURITY;
-- ... (disable for other tables as needed)
```

To re-enable, run the `ENABLE-RLS-POLICIES.sql` script again.

## Common Issues

### Issue: Users can't see any data after enabling RLS
**Cause**: User is not authenticated or not in any groups
**Solution**:
1. Check that user is logged in (`auth.uid()` returns a value)
2. Verify user is in the `group_members` table
3. Check that partners have the correct `group_id`

### Issue: Users can see other users' partners
**Cause**: RLS policies not applied correctly
**Solution**:
1. Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`
2. Re-run the `ENABLE-RLS-POLICIES.sql` script

### Issue: Database errors when trying to update data
**Cause**: RLS policies blocking legitimate updates
**Solution**:
1. Check the error message - it will indicate which policy is blocking
2. Verify the user owns the resource they're trying to update
3. Check that `auth.uid()` matches the `user_id` field

## Production Deployment

Before deploying to production:

1. ✅ Enable RLS on all tables
2. ✅ Test with all user roles
3. ✅ Verify data isolation
4. ✅ Test group functionality (betting, intel sharing)
5. ✅ Monitor Supabase logs for policy violations
6. ✅ Set up proper error handling in frontend for permission denied errors

## Database Security Best Practices

1. **Never disable RLS in production**
2. **Always use `auth.uid()` in policies**, not client-provided user IDs
3. **Test policies with multiple users** before deploying
4. **Monitor policy performance** - complex policies can slow down queries
5. **Use indexes on filtered columns** (user_id, group_id, etc.)
6. **Review policies regularly** as features are added

## Next Steps

After enabling RLS:

1. Test thoroughly with all 3 test users
2. Add error handling for permission denied errors in frontend
3. Add user-friendly messages when users try to perform unauthorized actions
4. Consider adding a "Report Issue" feature for when users encounter unexpected permission errors
5. Monitor Supabase logs for any policy violations or unexpected behavior

## Support

If you encounter issues:

1. Check the Supabase logs for detailed error messages
2. Verify RLS is enabled on all relevant tables
3. Test queries directly in Supabase SQL Editor with `set local role authenticated;`
4. Review the policy definitions in `ENABLE-RLS-POLICIES.sql`

---

**Last Updated**: 2025-11-22
**Status**: Ready for Production Testing
