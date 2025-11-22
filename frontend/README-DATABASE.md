# RWR Database - Final Setup

## Quick Start

### 1. Create Auth Users (if not done yet)

Go to Supabase Dashboard → **Authentication → Users → Add User**

| Email | Password | Auto Confirm |
|-------|----------|--------------|
| test@rwr.com | TestPass123! | ✅ YES |
| friend1@rwr.com | TestPass123! | ✅ YES |
| friend2@rwr.com | TestPass123! | ✅ YES |

### 2. Get UUIDs

After creating the users:
1. Go to **Authentication → Users**
2. Note down the UUIDs for each email
3. If they match these, you're good:
   - test@rwr.com = `932fc25c-86ff-407f-ad2f-92fe2f19a316`
   - friend1@rwr.com = `785c7ce9-6c9d-495b-81f0-e779e7d38d52`
   - friend2@rwr.com = `4b797dd0-c05e-4b6a-b89f-16ebaa0a56b4`
4. If different, edit `DATABASE-FINAL.sql` line 140-142

### 3. Run Database Setup

1. Open `DATABASE-FINAL.sql`
2. Copy **EVERYTHING**
3. Supabase → **SQL Editor** → Paste → **RUN**

### 4. Test!

1. Go to **http://localhost:4000**
2. Login: **test@rwr.com** / **TestPass123!**
3. Click **"The Squad"**
4. See your 5 planets! 🪐🪐🪐🪐🪐

## What You Get

### Test Data
- **3 Users**: TestUser, FriendOne, FriendTwo
- **1 Group**: "The Squad" (Invite: TESTSQD1)
- **5 Partners** for TestUser:
  1. Barista Girl (Dating, Simp Index: 50.0)
  2. Gym Crush (Talking, Simp Index: 200.0)
  3. Coffee Shop Regular (Talking, Simp Index: 18.3)
  4. Ex-Girlfriend (Graveyard, Simp Index: 2750.0) 💀
  5. Tinder Match (Exclusive, Simp Index: 6.7) ⭐
- **3 Sticky Notes**: Friend roasts on partners

### Correct Schema

The `partners` table now has the RIGHT column names:
- ✅ `nickname` (not `name`)
- ✅ `financial_total` (not `money_spent`)
- ✅ `time_total` (not `hours_invested`)
- ✅ `last_updated_at` (not `last_interaction`)

## Architecture

```
Group: "The Squad"
├── TestUser (Sun) ← YOU
│   ├── Barista Girl (Planet)
│   ├── Gym Crush (Planet)
│   ├── Coffee Shop Regular (Planet)
│   ├── Ex-Girlfriend (Planet in Graveyard)
│   └── Tinder Match (Planet)
├── FriendOne (Sun) ← Has own planets
└── FriendTwo (Sun) ← Has own planets
```

Each user sees ONLY their own partners/planets when logged in.
Friends can see each other's partners and leave roasts (sticky notes).

## Simp Index Formula

```
Simp Index = (financial_total + time_total * 20) / intimacy_score

Low (<50)   = Low simp, high game ⭐
Medium (50-200) = Normal dating 👍
High (>200) = Major simp energy 🚨
Mega (>1000) = Danger zone 💀
```

## Files

- `DATABASE-FINAL.sql` - Complete database setup (all-in-one)
- `README-DATABASE.md` - This guide

## What's Disabled

**RLS is disabled** for development. This means:
- No permission checks
- All data is visible
- Perfect for testing

**Before production:**
- Re-enable RLS
- Create proper policies
- Test security

## Troubleshooting

**No planets showing?**
- Check Browser Console (F12) for errors
- Verify you clicked "The Squad" in dashboard
- Check localStorage has `selectedGroupId`

**Wrong UUIDs?**
- Edit `DATABASE-FINAL.sql` lines 140-142
- Replace with your actual auth.users IDs
- Re-run the script

**Column errors?**
- Make sure you ran `DATABASE-FINAL.sql` (not old scripts)
- It has the correct column names

## Next Steps

After everything works:
- Test clicking on planets
- Test drag & drop to graveyard
- Add "Create Partner" button
- Implement multi-solar system zoom

You're all set! 🚀
