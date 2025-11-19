# Relationship War Room (RWR) - Development Guide

## Project Overview
- Gamified dating CRM for friend groups with solar system visualization (User = Sun, Dates = Planets)
- Stack: Next.js + React Flow + Supabase + Tailwind CSS + Zustand
- Theme: Cyber War Room (Dark mode, neon accents, tactical HUD)

## Key Documents
- **PRD.md**: Full product requirements, features, tech stack, phasing roadmap
- **Design Requirements Doc.md**: Visual identity, color palette, animations, micro-interactions

## Core Features
- Infinite canvas with gravity-based node positioning (React Flow + D3-Force)
- Simp Index calculation: `(Money + Hours*20) / Intimacy Score`
- Fog of War: Blur photos by default, reveal on hover
- Decay system: Nodes rust after 14+ days without updates
- XP/Leveling with peer validation (2 friends must verify actions)
- Sticky notes/roasts, graveyard zone for breakups

## Design System
- Colors: Deep Void `#05050A`, Holo-Cyan `#00F0FF`, Simp Red `#FF2A2A`, Lust Pink `#FF007F`, Toxic Green `#39FF14`
- Fonts: Rajdhani (headers), JetBrains Mono (stats), Inter (body)
- Animations: Framer Motion with spring physics (stiffness: 300, damping: 30)

## Development Workflow
- Test changes thoroughly before committing
- Commit after each major feature/change with descriptive messages
- Keep privacy constraints: group isolation, blur-by-default for images
- Never Use emojis in the code, keep it professional and clean

## Activity Log
- 2025-11-19: Project initialized with frontend/backend structure
