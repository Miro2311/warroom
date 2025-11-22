# XP & Leveling System

## Overview

The XP (Experience Points) and Leveling System gamifies relationship tracking in the Relationship War Room. Users earn XP by actively maintaining their relationship data, reaching milestones, and participating in social features.

## How Leveling Works

- **Starting Level**: All users start at Level 1 with 0 XP
- **Level Formula**: `Level = floor(current_xp / 1000) + 1`
  - Level 1: 0-999 XP
  - Level 2: 1000-1999 XP
  - Level 3: 2000-2999 XP
  - And so on...
- **Visual Effect**: The Sun (User) node grows larger as you level up

## XP Categories & Earning Methods

### 1. Relationship Milestones (+50 to +150 XP)

Earn XP when relationships progress:

- **Talking → Dating**: +50 XP
- **Dating → Exclusive**: +150 XP
- **Clean Breakup** (Moving to Graveyard): +40 XP
- **Second Chance** (Reviving from Graveyard): +75 XP
- **It's Complicated** (Penalty): -30 XP

### 2. Data Consistency (+10 to +30 XP)

Reward for keeping data up-to-date:

- **Timeline Event Added**: +10 XP per event
- **Weekly Update Bonus**: +30 XP (requires 3+ events on different days in a week)
- **Decay Cleanup**: +20 XP (updating a rusted node)
- **Complete Profile**: +50 XP (Intimacy Score set + min 3 events)

### 3. Social Interactions (+5 to +15 XP)

Earn XP by engaging with the group:

- **Sticky Note/Roast Created**: +5 XP
- **Peer Validation**: +15 XP (validating another user's action)
- **Poke Decayed Node**: +8 XP
- **Red Flag Help**: +12 XP (helping identify red flags)

### 4. Performance-Based (+80 to +200 XP)

Rewards for healthy relationship management:

- **Low Simp Index**: +100 XP (keeping Simp Index under 100)
- **High Intimacy**: +80 XP (reaching intimacy score of 8+)
- **Balanced Dating**: +200 XP (3+ active partners, no Simp Index over 500)

### 5. Red Flag Management (+15 to +120 XP)

Awareness and action rewards:

- **Red Flag Documented**: +15 XP
- **Critical Red Flag Early Detection**: +60 XP
- **Toxic Relationship Ended**: +120 XP (ending relationship with critical red flags)

## Achievements

Achievements are special milestones that award bonus XP when unlocked:

### Relationship Achievements

- **First Steps** (+50 XP): Add your first partner
- **Player Status** (+200 XP): Reach 5 partners
- **Casanova** (+500 XP): Reach 10 partners
- **Commitment Issues Solved** (+150 XP): First exclusive relationship
- **Graveyard Reaper** (+100 XP): Move 5 partners to graveyard
- **Phoenix** (+200 XP): Successfully revive a relationship from graveyard

### Performance Achievements

- **Efficiency Expert** (+300 XP): Maintain Simp Index under 100 on 3 partners
- **Intimacy Champion** (+250 XP): Reach intimacy score of 10

### Activity Achievements

- **Data Enthusiast** (+200 XP): Log 50 timeline events
- **Weekly Warrior** (+150 XP): Earn weekly update bonus 4 times
- **Streak Legend** (+500 XP): Maintain 30-day activity streak
- **Red Flag Detector** (+150 XP): Document 10 red flags

### Social Achievements

- **Social Butterfly** (+100 XP): Create 20 sticky notes/roasts
- **The Validator** (+150 XP): Validate 10 peer actions

### Level Achievements

- **Veteran** (+1000 XP): Reach Level 10

## Peer Validation System (Future Feature)

Some high-value actions require validation from 2 group members:

1. User claims an action (e.g., "Going Exclusive")
2. Request appears in group's validation queue
3. 2 friends must approve before XP is awarded
4. Validators also earn +15 XP for participating

**Note**: Peer validation is implemented but not yet active in the UI.

## Viewing Your Progress

### Command Center (User Stats Modal)

Click the Sun (your user node) to open the Command Center:

- **Overview Tab**: XP progress bar, level, partner stats
- **XP History Tab**: Complete transaction log of earned XP
- **Achievements Tab**: View all unlocked achievements

### Level Up Animation

When you level up:

- Animated modal appears with celebration effects
- Shows new level and current XP progress
- Stars burst animation
- Modal auto-dismisses or click "Continue"

## Activity Streak System

- Track daily activity with the streak counter
- Earn bonuses for consistent updates
- Streak resets if you miss a day
- Visible in user profile (`streak_count` field)

## Tips for Maximizing XP

1. **Stay Active**: Add timeline events regularly for consistent +10 XP
2. **Complete Profiles**: Ensure each partner has intimacy score and multiple events
3. **Monitor Simp Index**: Keep it under 100 for monthly +100 XP bonuses
4. **Document Red Flags**: Early detection can save you from toxic relationships AND earn XP
5. **Be Social**: Help your friends by validating their actions
6. **Weekly Goals**: Aim for 3+ updates per week to earn the +30 XP bonus

## Database Schema

The XP system uses these tables:

- **xp_transactions**: Record of all XP gains/losses
- **achievements**: Unlocked achievements per user
- **peer_validations**: Validation requests (future feature)
- **users**: Extended with `streak_count`, `last_activity_date`, `total_xp_earned`

## Setup Instructions

1. **Run Database Migration**:
   ```bash
   # In Supabase SQL editor, run:
   # frontend/DATABASE-XP-SYSTEM.sql
   ```

2. **Verify Tables Created**:
   - xp_transactions
   - achievements
   - peer_validations
   - Check users table for new columns

3. **Test XP Earning**:
   - Add a timeline event → Should earn +10 XP
   - Change partner status → Should earn milestone XP
   - Check Sun node stats modal for XP history

## Technical Implementation

### Services

- **XPService** (`src/services/xpService.ts`): Core XP logic
- **AchievementService** (`src/services/achievementService.ts`): Achievement tracking
- **PeerValidationService** (`src/services/peerValidationService.ts`): Validation system

### Hooks

- **useXP** (`src/hooks/useXP.ts`): React hook for XP data

### Components

- **LevelUpModal**: Animated level up celebration
- **XPNotification**: Toast-style XP gain notifications (prepared, not integrated)
- **UserStatsModal**: Extended with XP History and Achievements tabs

### Integration Points

- **Store** (`useStore.ts`): `handleStatusChange()` awards XP for status changes
- **TimelineTab**: Awards XP when timeline events are created
- **moveToGraveyard**: Awards XP for clean breakups and toxic relationship endings

## Future Enhancements

- **Marketplace & Betting** (Phase 2): Bet on relationships, earn XP for wins
- **XP Notifications**: Toast notifications when XP is earned
- **Leaderboard**: Group-level XP rankings
- **Seasonal Challenges**: Limited-time XP multipliers
- **Custom Achievements**: Group admins can create custom achievements

## Troubleshooting

### XP Not Being Awarded

1. Check `currentGroupId` is set in store
2. Verify user is authenticated
3. Check browser console for errors
4. Ensure database migration ran successfully

### Level Not Updating

- Level updates happen via PostgreSQL function `add_xp_to_user`
- Check if `calculate_level` function exists in database
- User data refreshes after level up

### Achievements Not Unlocking

- Achievements check runs after major actions
- Manual trigger: `AchievementService.checkAchievements(userId, groupId)`
- Check achievement conditions in `achievementService.ts`

## Support

For issues or questions about the XP system:
1. Check console logs for errors
2. Verify database schema is up-to-date
3. Review XP transaction history in Command Center
