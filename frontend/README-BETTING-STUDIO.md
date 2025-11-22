# Betting Studio (Wettstudio)

## Overview
The Betting Studio is a gamified betting system where friend group members can place bets on each other's dating outcomes. Features include dynamic odds, peer-selected bet masters, custom and system-generated bets.

## Features

### 1. Bet Master System
- **Democratic Election**: When a group is created, members vote for a "Bet Master"
- **Role**: The Bet Master acts as a referee/arbiter who confirms and resolves bets
- **Majority Vote**: Winner needs >50% of group votes
- **Powers**: Only the Bet Master can resolve bets and distribute winnings

### 2. Betting Currency
- Each user starts with **$1000** betting currency
- Currency is tracked separately from XP
- Used exclusively for placing wagers in the betting studio

### 3. Bet Types

#### System-Generated Bets (Weekly)
- 3 bets auto-generated each week
- Based on group member activities and stats
- Examples:
  - "Will [User] go on a first date this week?"
  - "Will [User] reach a new intimacy level?"
  - "Will [User] spend over $100 on dates?"

#### Custom Bets
- Any member can create custom bets
- Target a specific user
- Set custom deadline
- Categories: first_date, kiss, sex, relationship, breakup, money_spent, response_time

### 4. Dynamic Odds System
Odds are calculated based on user's historical data:

#### High Experience (>10 events in category)
- Odds for success: 1.2x (low payout, high confidence)
- Odds for failure: 4.0x (high payout, low confidence)
- Confidence Score: 80%

#### Medium Experience (5-10 events)
- Odds for success: 2.0x
- Odds for failure: 2.5x
- Confidence Score: 60%

#### Low Experience (<5 events)
- Odds for success: 3.5x (high payout, low confidence)
- Odds for failure: 1.3x (low payout, high confidence)
- Confidence Score: 40%

### 5. Betting Flow

1. **Bet Creation**: User or system creates a bet
2. **Odds Calculation**: System calculates odds based on target user's stats
3. **Wagering**: Members place wagers (Yes/No) with their currency
4. **Bet Locking**: Bet automatically locks when deadline approaches
5. **Resolution**: Bet Master reviews outcome and resolves the bet
6. **Payout**: Winners receive their potential payout automatically

### 6. Bet Categories
- `first_date`: Will they go on a first date?
- `kiss`: Will they kiss someone?
- `sex`: Will they reach intimacy?
- `relationship`: Will they enter a relationship?
- `breakup`: Will they break up?
- `response_time`: Response time predictions
- `money_spent`: Spending amount predictions
- `custom`: Anything else

## Database Schema

### Tables Created
1. **group_bet_master**: Tracks elected bet master per group
2. **bet_master_votes**: Individual votes for bet master candidates
3. **bets**: All bets (system and custom)
4. **bet_odds**: Dynamic odds for each user/bet combination
5. **wagers**: Individual bets placed by users
6. **bet_transactions**: Transaction log for all currency movements
7. **weekly_system_bets**: Tracks which weekly bets have been generated

### Key Functions
- `calculate_bet_odds(user_id, category)`: Calculates odds based on user stats
- `resolve_bet(bet_id, resolved_by, winning_outcome, notes)`: Resolves bet and pays out winners
- `place_wager(bet_id, user_id, amount, prediction, odds)`: Places a wager with balance validation

## Setup Instructions

### 1. Run Database Migration
```bash
# Execute the betting studio SQL schema
psql -U your_username -d your_database -f DATABASE-BETTING-STUDIO.sql
```

Or via Supabase dashboard:
1. Go to SQL Editor
2. Copy contents of `DATABASE-BETTING-STUDIO.sql`
3. Execute the query

### 2. Verify Tables Created
Check that these tables exist:
- `group_bet_master`
- `bet_master_votes`
- `bets`
- `bet_odds`
- `wagers`
- `bet_transactions`
- `weekly_system_bets`

### 3. Verify User Currency
All existing users should now have a `bet_currency` column:
```sql
SELECT id, username, bet_currency FROM users;
```

Default: 1000 for all users

### 4. Test Bet Master Voting
1. Open the app
2. Click "BETTING STUDIO" button (next to Graveyard)
3. Vote for a bet master
4. Once majority is reached, bet master is elected

### 5. Test Betting Flow
1. As bet master, create a custom bet
2. As regular user, place a wager
3. As bet master, resolve the bet after deadline
4. Check that winners received payouts

## UI Components

### BettingStudioTab
Main component with all betting features:
- User balance display
- Active bets list
- Bet master voting interface
- Bet creation form
- User wagers history

### BettingStudioPanel
Modal panel that opens when clicking the "BETTING STUDIO" button:
- Full-screen overlay
- Renders BettingStudioTab
- Golden glow theme matching the button

### DashboardHeader
Updated with new "BETTING STUDIO" button:
- Positioned next to Graveyard button
- Animated golden sparkles
- Trophy icon

## Security & Privacy

### Row Level Security (RLS)
All tables have RLS enabled with policies:
- Users can only view bets in groups they're members of
- Users can only place wagers in their own groups
- Only bet masters can resolve bets in their group
- Transaction logs are private to each user

### Balance Validation
- `place_wager()` function checks user balance before allowing bet
- Prevents overdrafts
- Atomic transactions ensure consistency

## Future Enhancements

### Potential Features
1. **Leaderboards**: Track top earners per week/month
2. **Bet Categories Based on Tags**: Use partner tags for smarter bets
3. **ML-Generated Bets**: Use pattern recognition for system bets
4. **Bet Pools**: Multiple users can contribute to same side of bet
5. **Live Odds**: Odds change based on wagering activity
6. **Anti-Gambling Features**: Daily limits, cooldowns, responsible gambling tools
7. **House Edge**: Small fee on each bet for group treasury
8. **Achievements**: Unlock badges for betting milestones
9. **Bet Challenges**: Direct challenges between users
10. **Insurance Bets**: Hedge against other bets

### Technical TODOs
- [ ] Implement bet creation UI form
- [ ] Add bet detail modal with full info
- [ ] Create bet resolution interface for bet master
- [ ] Build leaderboard component
- [ ] Add real-time updates for live betting
- [ ] Implement bet notifications
- [ ] Add transaction history view
- [ ] Create betting analytics dashboard

## Troubleshooting

### Common Issues

#### "Bet Master Not Showing"
- Ensure all group members have voted
- Check `bet_master_votes` table
- Verify majority (>50%) has been reached

#### "Cannot Place Wager"
- Check user balance in `users.bet_currency`
- Verify bet is still in "open" status
- Ensure user is a group member

#### "Bet Not Resolving"
- Only bet master can resolve bets
- Verify user is the elected bet master
- Check bet status is not already "resolved"

#### "Odds Not Calculating"
- Check if user has timeline events in database
- Verify `calculate_bet_odds()` function exists
- Check function permissions

## API Reference

### Service Functions (bettingService.ts)

```typescript
// Bet Master
getBetMaster(groupId: string): Promise<BetMaster | null>
voteForBetMaster(groupId: string, candidateId: string): Promise<BetMasterVote>
electBetMaster(groupId: string, userId: string): Promise<BetMaster>

// Bets
getBets(groupId: string): Promise<Bet[]>
getBet(betId: string): Promise<Bet | null>
createBet(params: CreateBetParams): Promise<Bet>
lockBet(betId: string): Promise<Bet>
resolveBet(betId: string, winningOutcome: any, notes?: string): Promise<void>

// Odds
getBetOdds(betId: string): Promise<BetOdds[]>
calculateAndStoreBetOdds(betId: string, userId: string, category: BetCategory): Promise<BetOdds>

// Wagers
getWagers(betId: string): Promise<Wager[]>
getUserWagers(userId: string): Promise<Wager[]>
placeWager(betId: string, amount: number, prediction: any, odds: number): Promise<Wager>

// Currency
getUserBalance(userId: string): Promise<number>
getUserTransactions(userId: string, limit?: number): Promise<BetTransaction[]>

// Weekly Bets
generateWeeklyBets(groupId: string): Promise<Bet[]>
```

## Design System

### Colors
- Primary: `yellow-400` (Golden)
- Accent: `holo-cyan` (Details)
- Success: `toxic-green` (Won bets)
- Danger: `simp-red` (Lost bets)

### Typography
- Headers: `font-display` (Rajdhani)
- Monospace: `font-mono` (JetBrains Mono)
- Body: Default (Inter)

### Animations
- Button hover: Scale 1.05
- Button tap: Scale 0.95
- Glow: Pulsing opacity + scale
- Spring physics: stiffness 300, damping 30

## Credits
Built for the Relationship War Room (RWR) dating CRM system.
