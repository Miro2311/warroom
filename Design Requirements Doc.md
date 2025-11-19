Design Concept: Relationship War Room (RWR)

Theme: Tactical Cyber-Space Command Center
Vibe: The Expanse meets Tinder meets EVE Online.

1. Visual Identity & Color Palette

The palette is designed to be high-contrast dark mode. We use "Semantic Neon" logic: colors indicate relationship health and danger levels.

The Void (Backgrounds)

Deep Void: #05050A (Main Canvas Background)

Grid Lines: #1A1A2E (Subtle tactical grid, opacity 20%)

Glass Panel: #11111F (with backdrop-filter: blur(12px) and border: 1px solid rgba(255,255,255,0.1))

The Signals (Accents)

Holo-Cyan (Primary UI): #00F0FF – Used for buttons, active states, and "healthy" orbit lines.

Simp Red (Danger/High Spend): #FF2A2A – Pulses when Simp Index > 500. Used for "Red Flag" icons.

Lust Pink (New/Romance): #FF007F – Used for "Fresh" nodes and intimate connections.

Toxic Green (Radioactive): #39FF14 – Used for the "Ick-o-meter" and roasts.

Rust/Decay: #C27842 – Used for nodes that haven't been updated in 14+ days.

Typography

Headers & HUD Elements: Rajdhani or Orbitron (Medium weight, uppercase, wide tracking).

Data & Stats: JetBrains Mono or Fira Code (Strictly monospace to feel like a terminal).

Body Text: Inter (Clean, legible sans-serif for chat and notes).

2. The Infinite Canvas (The War Room)

The user interaction happens on a living, breathing star map.

The Sun (The User)

Visual: A glowing, pulsating core. It is not a flat circle; it uses a CSS radial-gradient animation to simulate a burning star.

Leveling Effect:

Level 1 (Single): A dim, white dwarf star.

Level 10 (Playboy/Casanova): A raging blue giant with solar flares (particle effects).

The Planets (The Dates)

Visual: Glass spheres containing the user's avatar.

Orbit Lines: Instead of solid lines, use dashed "trajectory" lines that animate slowly towards the center.

Distance:

Close Orbit: Fast animation speed, thicker connection line.

Far Orbit: Slow animation, thin faint line.

The Graveyard (Bottom of Screen)

Visual: A "Black Hole" or "Wormhole" event horizon at the bottom of the canvas.

Interaction: Dragging a node here warps the node (scale down + spin) as it gets "sucked in."

3. UI Components & Gamification

The "Simp Index" Tachometer

Instead of a progress bar, use a Circular Gauge (Speedometer style).

0-200 (Safe): Blue glow.

200-500 (Caution): Yellow glow.

500+ (Simp Alert): The gauge turns Red, the needle jitters (vibrates), and a "WARNING" label flashes.

Fog of War (Privacy/Blur)

Effect: "Digital Glitch."

State: When a photo is hidden, it isn't just blurred gray. It is covered by a pixelated, shifting static noise (like a scrambled TV channel).

Reveal: Hovering plays a quick "decryption" animation (scanline moves down) revealing the photo.

The "Ick-o-meter"

Visual: A Geiger Counter style bar.

Animation: As the bar fills up, it emits small green particle bubbles (toxic waste).

4. Micro-Interactions & Physics

Magnetic Drag: When dragging a Sticky Note near a Planet Node, it should "snap" to the node with a haptic-style visual bump.

Data Entry: When typing a dollar amount for a date, the numbers should "roll" like a slot machine before settling.

Roasts: Posting a roast (Sticky Note) shouldn't just appear. It should "stamp" onto the board with an impact effect and a slight camera shake.

5. Mobile Experience (The Datapad)

Since the canvas is hard to use on mobile, the mobile UI mimics a Handheld Scanner.

Card Stack: Active partners appear as a stack of holographic cards.

Quick Actions: Swipe Right to "Log Date," Swipe Left to "Log Expense."

The Feed: A scrolling terminal log of group activity:

SYSTEM ALERT: Mike spent $200 on Gym Kyle.

SYSTEM ALERT: Sarah added a Red Flag to 'Hinge Boy'.

6. Animations Tech Spec

Library: Framer Motion.

Transition Type: type: "spring", stiffness: 300, damping: 30 (Bouncy, energetic feel).

Ambient Motion: All nodes should have a slight "breathing" float animation (up and down 5px) so the board never feels frozen.