# Relationship War Room - Frontend

## Quick Start

### Development
```bash
npm install
npm run dev
```

Visit http://localhost:4000

### Build
```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Main solar system view
│   ├── dashboard/         # Group selection
│   └── login/             # Authentication
├── components/
│   ├── canvas/            # Solar system visualization
│   │   ├── SolarSystem.tsx    # Main canvas orchestrator
│   │   ├── SunNode.tsx        # User node
│   │   ├── PlanetNode.tsx     # Partner node
│   │   └── graveyard/         # Graveyard system
│   ├── dashboard/         # Modals & panels
│   │   ├── PartnerDetailModal.tsx
│   │   ├── UserStatsModal.tsx
│   │   ├── DashboardHeader.tsx
│   │   └── tabs/          # All feature tabs
│   ├── ui/                # Reusable UI components
│   └── auth/              # Authentication
├── services/              # Business logic
│   ├── xpService.ts       # XP/leveling system
│   ├── bettingService.ts  # Betting Studio
│   ├── achievementService.ts
│   └── peerValidationService.ts
├── hooks/                 # React hooks
│   ├── useLoadData.ts     # Main data loader
│   └── useXP.ts           # XP/achievement hook
├── store/                 # Zustand state management
│   └── useStore.ts
├── types/                 # TypeScript types
├── lib/                   # Utilities
│   ├── supabase.ts        # Supabase client
│   └── utils.ts           # Helper functions
└── contexts/              # React contexts
    └── AuthContext.tsx

ENABLE-RLS-FINAL.sql       # Production RLS setup
```

## Core Features

### Solar System Visualization
- Multi-user solar system (each user = sun with planets)
- React Flow + D3-like physics for orbital animation
- Drag & drop to graveyard
- Decay system (nodes rust after 14+ days)
- Fog of War (blur photos by default)

### Partner Tracking
- Simp Index: `(Money + Hours*20) / Intimacy Score`
- Status tracking (Talking, Dating, Exclusive, etc.)
- Financial & time investment tracking
- Intimacy score (0-10)

### Graveyard System
- Drag partners to graveyard zone
- Cause of death selection
- Tombstone visualization
- Revival system

### XP & Leveling
- Earn XP for relationship milestones
- Level system (Level = floor(XP / 1000) + 1)
- Achievement system
- Peer validation (2 friends must verify)
- Activity streaks

### Betting Studio
- Democratic bet master election
- System-generated weekly bets
- Custom bet creation
- Dynamic odds based on user stats
- Betting currency system
- Settlement tracking

### Intel Tab
- Group notes/roasts with voting
- Red flag reporting
- Peer ratings
- Upvote/downvote system

### Timeline
- Date logging
- Expense tracking with categories
- Red flag events
- Intimacy changes
- Status changes

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Visualization:** React Flow + D3-Force
- **Database:** Supabase (PostgreSQL)
- **State:** Zustand
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **UI Components:** Radix UI

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Database Setup

The database schema is already applied. For production RLS setup:

```bash
# Run in Supabase SQL Editor
cat ENABLE-RLS-FINAL.sql
```

## Development Workflow

1. **Start dev server:** `npm run dev`
2. **Make changes** to components/services
3. **Test features** in browser
4. **Run build:** `npm run build` (verify no errors)
5. **Commit changes**

## Key Files

- **SolarSystem.tsx** (912 lines) - Main canvas logic
- **xpService.ts** (689 lines) - XP system
- **bettingService.ts** (609 lines) - Betting system
- **useStore.ts** (251 lines) - Global state

## Testing

```bash
# TypeScript check
npx tsc --noEmit

# Build check
npm run build

# Start production
npm start
```

## Troubleshooting

### "No planets showing"
- Check browser console (F12)
- Verify group is selected in dashboard
- Check localStorage has `selectedGroupId`

### "Database errors"
- Verify `.env.local` credentials
- Check Supabase project is active
- Review RLS policies if enabled

### "Build errors"
- Clear `.next` folder
- Delete `node_modules` and reinstall
- Check TypeScript errors: `npx tsc --noEmit`

## Documentation

See root documentation for detailed information:
- **CLAUDE.md** - Project instructions
- **PRD.md** - Product requirements
- **Design Requirements Doc.md** - Design system

## License

Private project
