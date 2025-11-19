Product Requirement Document (PRD)

Product Name: Relationship War Room (RWR)
Version: 1.1
Status: Draft
Date: November 18, 2025

1. Executive Summary

Relationship War Room (RWR) is a collaborative, gamified web application that acts as a "CRM for dating" within a closed friend group. It visualizes the dating lives of its members on an infinite, real-time interactive board.

The platform combines the visual utility of a mind-map tool (like Miro) with the mechanics of a strategy game (Fog of War, XP leveling, Resource Management) to turn dating turmoil into social entertainment and analytical data.

2. Core User Flows

The Field Agent (Mobile Input): A user is on a date or just finished one. They open the mobile view to quickly log stats (Expense: $50, Vibe: Weird).

The War Room (Desktop/Tablet View): The friend group gathers on the main canvas. They see the user's node update in real-time, view the "Simp Index" calculation, check the "Fog of War" blurred photos, and place bets on the relationship's longevity.

3. Functional Requirements

3.1. The Infinite Canvas (The "Solar System")

Visual Metaphor: A solar system where the User is the Sun and dating partners are Planets.

Tech: React Flow (XyFlow) + D3-Force.

Gravity Logic:

Center Node (Sun): The User. Size increases based on User Level (XP).

Satellite Nodes (Planets): Dating partners.

Distance: Visual distance from the Sun is determined by the Intimacy Score. High intimacy = Close orbit. Low intimacy = Distant orbit.

Repulsion: Planet nodes must repel each other to prevent visual overlap.

Constraint: Friends within the same group cannot date each other (Systems are mutually exclusive to prevent graph breaking).

3.2. Node Properties & States

Each "Partner Node" must track:

Status: Talking, Dating, It's Complicated, Exclusive, Graveyard (Breakup).

Decay State (The Rust System):

If last_update > 14 days: Apply CSS Filter: Sepia/Grayscale.

If last_update > 30 days: Apply Spiderweb Overlay.

Action: Friends can "Poke" a decaying node to force the user to update or archive it.

Privacy (Fog of War):

Newly added media (photos/screenshots) are blurred by default (filter: blur(10px)).

Interaction: Hovering over the media temporarily removes the blur for the viewer (simulating "Click to Reveal").

3.3. The "Stats Engine"

The app automatically calculates derived metrics based on raw inputs.

Metric

Formula/Logic

Visual Indicator

Simp Index

(Total $$ Spent + (Hours Invested * 20)) / (Intimacy Score [1-10])

If > 500: Node border pulses Red.

Money Per Nut (ROI)

Total $$ Spent / Intimacy Events Count

Displayed in Financial Ledger tooltip.

Ghost Rate

(Times Ghosted / Total Partners) * 100

Percentage displayed on User Profile.

Attractiveness

Average of Friend Group Ratings (Votes 1-10).

Progress Bar (Red to Green gradient).

3.4. Gamification & XP

User Leveling: Users gain XP for "Successful Dating Actions" (e.g., Second Date, Going Exclusive, Clean Breakup).

Peer Validation: XP is ONLY awarded if 2 other group members "Verify" the action (prevents lying).

Reward: Leveling up increases the visual size of the User's "Sun" node.

Fantasy Draft (Seasonal):

Admin Trigger: Admin starts "Cuffing Season Draft."

Wager System: Users receive 1000 "Love Coins." They can bet on specific nodes moving to "Exclusive" status.

Payout: Successful bets yield XP boost.

3.5. Social & Interaction

Stickies/Roasts: Friends can drag sticky notes onto the canvas near specific nodes (e.g., "🚩 He wears skepticism shoes").

The Graveyard: A designated zone at the bottom of the canvas. Dragging a node here triggers a "Tombstone" animation. Clicking the tombstone reveals the "Cause of Death" (e.g., "Ghosted," "Cheated," "Boring").

4. Data & Privacy Architecture

4.1. Data Schema (Supabase/PostgreSQL)

Users: id, username, avatar_url, current_xp, level

Groups: id, name, invite_code

Partners (Nodes):

id, user_id, nickname (REAL NAMES BANNED in UI prompt), status

financial_total, time_total, intimacy_score

created_at, last_updated_at (for Decay logic)

Assets: id, node_id, url, type (image/screenshot), is_blurred (bool)

4.2. Privacy Constraints

Group Isolation: Data is strictly siloed. Group A cannot see Group B's board.

Blur Default: All uploaded images default to is_blurred: true to prevent accidental public exposure of private dating life.

5. Technical Stack Recommendations

Component

Technology

Reasoning

Framework

Next.js (React)

Robust routing, easy API integration, server-side rendering for speed.

State Mgmt

Zustand

Lightweight state management for the complex board data.

Canvas Engine

React Flow (XyFlow)

Best-in-class library for node-based interactive UIs.

Physics

D3-Force

Handles the "Orbit" and "Gravity" math automatically.

Backend

Supabase

Provides Realtime subscriptions (Sockets) out of the box for live updates.

Styling

Tailwind CSS

Rapid UI development, easy implementation of "Blur" filters.

6. UI/UX Guidelines

Theme: "Cyber-War Room." Dark mode default.

Palette: Deep space blues/blacks background. Neon indicators (Green = Success, Pink = Lust/New, Red = Danger/High Simp Score).

Typography: Monospace fonts for data/stats (like a terminal), Clean Sans-serif for chat/roasts.

Mobile Experience: NOT a canvas. A card-based "Feed" for quick data entry. Canvas is "View Only" on mobile (or restricted interaction).

7. Phasing / Roadmap

Phase 1: The MVP (The Board)

User Auth & Group Creation.

Basic Solar System visualization (React Flow).

Adding/Deleting Partner Nodes.

Basic Stats (Money, Time).

Phase 2: The Social Layer

Real-time updates (Supabase Realtime).

Fog of War (Blur) logic.

Roasting (Sticky notes).

Decay System (Visual rust).

Phase 3: The Game Layer

XP & Leveling System.

Simp Index calculations.

Fantasy Draft mode.

8. Success Metrics & KPIs

Engagement: Average time spent on "War Room" canvas per session.

Stickiness: Daily Active Users (DAU) vs Monthly Active Users (MAU) within a group.

Input Frequency: Average number of updates (Expense logs/Status changes) per week per active dater.

Viral Coefficient: Number of invite codes used per existing user.