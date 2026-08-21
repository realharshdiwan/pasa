# Pasa — Full Audit & Roadmap

*Generated from codebase review, UI/UX analysis, and game design evaluation.*
*Last updated: 2026-08-21*

---

## Project Summary

**Pasa** is a 4-player strategy board game based on Chaturaji — the ancient Indian ancestor of chess. Built with React 19 + TypeScript + Vite, rendered via Konva.js, state managed with Zustand, styled with Tailwind CSS. Deployed on Vercel.

### Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + Vite 8 + TypeScript (strict) |
| Board rendering | Konva.js via react-konva |
| State | Zustand 5 |
| Styling | Tailwind CSS 3 |
| Backend | Supabase (online multiplayer) |
| Deployment | Vercel |

### Codebase Architecture

```
src/
├── engine/          ← 9 pure TS files (sacred, zero UI imports)
│   ├── types.ts     ← Core types (PlayerColor, Piece, GameState, Move)
│   ├── board.ts     ← Board creation, utilities, initial state
│   ├── moves.ts     ← Legal move generation for all 5 piece types
│   ├── die.ts       ← Die roll + face→piece mapping
│   ├── scoring.ts   ← Capture points, placement computation
│   ├── elimination.ts ← Raja capture, army transfer, timeout
│   ├── ai.ts        ← 3 difficulty levels + hint system (513 lines)
│   ├── pieces.ts    ← Piece definitions, alliance logic
│   └── engine.test.ts ← 22 tests (Vitest)
├── components/      ← 13 React components
├── store/
│   ├── gameStore.ts       ← Zustand (local game state)
│   └── multiplayerStore.ts ← Zustand (online multiplayer)
├── utils/
│   ├── cosmetics.ts  ← Themes, progression, localStorage
│   ├── format.ts     ← Position notation, color names
│   └── sound.ts      ← Web Audio effects
├── contexts/
│   ├── AuthContext.tsx ← Supabase auth
│   └── useAuth.ts
├── lib/
│   └── supabase.ts   ← Client config
├── constants/
│   └── colors.ts     ← Player hex colors
└── App.tsx           ← Root, mode selection, bot orchestration, timer
```

### Dependencies

| Package | Purpose |
|---------|---------|
| React 19 + Vite 8 | Framework + build |
| Konva.js + react-konva | Canvas board rendering |
| Zustand 5 | State management |
| Tailwind CSS 3 | UI styling |
| @supabase/supabase-js | Online multiplayer backend |
| @vercel/analytics | Usage tracking |
| Vitest + @testing-library/react | Testing |

---

## Game Mechanics (Core)

- **4 players** (Red, Blue, Yellow, Green), each with **8 pieces** in their corner of an 8x8 board
- **5 piece types:** Raja (King), Ratha (Chariot), Gaja (Elephant — jumps 2 diagonal), Ashva (Horse/Knight), Padati (Pawn)
- **The Die (Pasa)** is the defining mechanic — roll determines which piece type you *must* move. Raja can override on any turn
- **Die faces:** 2=Ashva, 3=Gaja, 4=Ratha, 5=Padati
- **Raja capture = elimination** — captor inherits all enemy pieces (controlledBy changes, original color preserved)
- **Full 1st-4th placement** every match based on last Raja standing + capture points
- **Alliance mode** (optional): Fixed teams (Red+Yellow vs Blue+Green) with Alliance Break endgame
- **20-move no-capture timeout** ends the game by points

---

## What's Built (Phases 1-5)

| Phase | Status | Key Deliverables |
|-------|--------|------------------|
| **1. Engine** | Done | Pure TS in `src/engine/` — 9 files, 22 unit tests |
| **2. Playable Board** | Done | Konva.js 4-player board, die, pass turn, scoring, game over |
| **3. AI Opponents** | Done | 3 difficulty levels (easy/medium/hard), hint system |
| **4. Polish** | Done | Animations, sound, tutorial, lore, move history, replay, themes, cosmetics |
| **5. Online Multiplayer** | In Progress | Supabase Realtime + Auth + Room system (code complete, needs testing) |
| **6. Rating System** | Planned | Rank ladder (Padati → Samrat) |
| **7. 3D Rewrite** | Planned | Three.js/r3f with procedural models + GSAP animations |
| **8. Mobile** | Far future | React Native port |

### Feature Status

| Feature | Phase | Status |
|---------|-------|--------|
| Headless engine + 22 tests | 1 | Done |
| 4-player pass-and-play (browser) | 2 | Done |
| Die mechanic + constraint | 2 | Done |
| Pass Turn (always after roll) | 2 | Done |
| Placement system (1st–4th) | 2 | Done |
| King elimination + army transfer | 2 | Done |
| Alliance mode toggle | 2 | Done |
| Game over overlay | 2 | Done |
| Shared constants + utils | 2 | Done |
| AI opponents (3 bots) | 3 | Done |
| 3 difficulty levels | 3 | Done |
| Move hints | 3 | Done |
| Conquered piece colour change | 3 | Done |
| Movement animations | 4 | Done |
| Kill animation | 4 | Done |
| Sound design | 4 | Done |
| Interactive tutorial | 4 | Done |
| Historical lore screen | 4 | Done |
| Move history panel (live) | 4 | Done |
| Game replay viewer (post-game) | 4 | Done |
| Auto die roll toggle | 4 | Done |
| Timer options (lobby setting) | 4 | Done |
| Controller badge on pieces | 4 | Done |
| Cosmetic progression | 4 | Done |
| Board/piece/die themes | 4 | Done |
| Sanskrit/English toggle | 4 | Done |
| Online multiplayer (friends) | 5 | In Progress |
| Alliance Break mechanic | 5 | Not built |
| Random team pairing | 5 | Not built |
| Rating system + rank tiers | 6 | Not built |
| Mobile app | 7 | Not built |

---

## 1. Things That Need Improvement

### Critical (Blocks App Store Quality)

| # | Issue | Where |
|---|-------|-------|
| 1 | **No App Store metadata** — no app icon, splash screen, or iOS-specific UI patterns | Global |
| 2 | **Web-only** — React SPA won't run as a native app. Needs Capacitor/Ionic wrapper or React Native rewrite | Architecture |
| 3 | **No match history / statistics** — `wins` count tracked but never surfaced to the player | `cosmetics.ts` |
| 4 | **No ELO / ranking system** — the single biggest retention gap | Not built |
| 5 | **Die roll animation doesn't land on the result** — last cycled face ≠ actual roll | `DieRoll.tsx` |
| 6 | **GameOver has no close button** — can't review final board state | `GameOver.tsx` |
| 7 | **ReplayViewer board hardcoded at 400px** — breaks on mobile | `ReplayViewer.tsx:226` |
| 8 | **`DieFaceDisplay` duplicated** between `DieRoll.tsx` and `DieRollOnline.tsx` | Both files |
| 9 | **MoveHistory shows only 6 moves, no scroll** — lose context mid-game | `MoveHistory.tsx` |
| 10 | **Die roll result not shown in move history** — critical for Chaturaji | `MoveHistory.tsx` |

### High Priority (UX Polish)

| # | Issue | Where |
|---|-------|-------|
| 11 | **No "copy room code" button** in lobby | `Lobby.tsx` |
| 12 | **No keyboard navigation** in Tutorial (arrow keys, Escape) | `Tutorial.tsx` |
| 13 | **No animation between tutorial steps** — instant jump feels rough | `Tutorial.tsx` |
| 14 | **TurnIndicator has no animation on turn change** — just swaps color | `TurnIndicator.tsx` |
| 15 | **No score change animation** — points jump silently | `DieRoll.tsx` |
| 16 | **Settings toggles have no ARIA roles** — accessibility fail | `Settings.tsx` |
| 17 | **No live preview when changing themes** — must close settings to see effect | `Settings.tsx` |
| 18 | **Lobby has hardcoded hex colors** instead of using `PLAYER_COLORS` constant | `Lobby.tsx:213` |
| 19 | **No error feedback** when online die roll fails (network error) | `DieRollOnline.tsx` |
| 20 | **No invalid-click feedback** — clicking non-legal squares does nothing | `Board.tsx` |

### Medium Priority (Game Feel)

| # | Issue | Where |
|---|-------|-------|
| 21 | **No elimination splash** — when a Raja is captured, no announcement appears | Game flow |
| 22 | **No victory celebration** — no confetti, crown, or fanfare | `GameOver.tsx` |
| 23 | **"Play Again" in online mode leaves the room** — misleading label | `OnlineGame.tsx` |
| 24 | **No stats in GameOver** — no move count, capture count, time played | `GameOver.tsx` |
| 25 | **Lore has a stray dice emoji** `🎲` breaking the scholarly tone | `Lore.tsx:38` |
| 26 | **12-step tutorial is overwhelming** — most games have 3-5 steps | `Tutorial.tsx` |
| 27 | **No board coordinate labels** (rank/file notation) | `Board.tsx` |
| 28 | **Sound is all procedural oscillators** — thin, beepy, no sampled audio | `sound.ts` |
| 29 | **No background ambient/music layer** — dead silence between moves | Global |
| 30 | **No online timer** — games can stall indefinitely | `DieRollOnline.tsx` |

---

## 2. UI/UX Gap vs. Supercell-Quality Games

### What Supercell Does That Pasa Doesn't

| Supercell Pattern | How It Works | Pasa Status |
|-------------------|-------------|-------------|
| **Screen transitions** | Smooth slides/fades between every screen, never instant | Instant swaps, no transitions |
| **Particle effects** | Confetti on wins, sparks on captures, dust on movement | Only screen shake + red flash |
| **Haptic feedback** | Phone vibrates on captures, die rolls, wins | No vibration API usage |
| **Sound layering** | Multiple simultaneous sounds with reverb/delay | Single oscillator per sound |
| **One-hand mobile UX** | All critical actions reachable with thumb in bottom 40% of screen | Board is top-heavy, die panel on side |
| **Tap targets** | Minimum 44px touch targets everywhere | Some buttons are `text-sm` (too small) |
| **Onboarding flow** | Play-first, learn-while-playing (3 steps then auto-play) | 12-step text tutorial before playing |
| **Emotes / social** | Quick emote wheel during gameplay | None |
| **Chest/reward timing** | "Come back in 3 hours" creates habitual returns | Progression ends at 20 games |
| **Victory screen** | Trophies fly in, XP bar fills, chests unlock, multiple reward layers | Single static overlay |
| **Match intro** | Both players shown, "VS" screen, anticipation build | Instant game start |
| **Loading states** | Branded loading screens with tips | Raw "Loading..." text |

### Specific UX Problems

**1. The Main Menu is a Dead-End Card**
The current `GameModeSelector` is a plain centered card with 2 buttons. It has no personality, no life, no visual hook. `MENU_VISION.md` describes exactly this (living board, gold dust particles, shimmer title) but **it's not implemented**. The current menu is a functional stub.

**2. No Game Flow / Progression Screen**
Between "click Local Game" and "playing" there's no setup screen — no difficulty selection, no mode confirmation, no player color choice, no "VS" animation. The game just starts. This robs the player of anticipation.

**3. The Board is a Flat Canvas**
Konva renders a 2D board with no depth, no shadows, no texture. Supercell games use isometric perspective, drop shadows, ambient occlusion, and material feel.

**4. Mobile Layout is an Afterthought**
The two-column layout (`lg:flex-row`) means on phones everything stacks vertically — board on top, die/history below. The board gets ~60% of screen height, leaving tiny die/history panels. No bottom sheet pattern, no swipe gestures, no thumb-zone optimization.

**5. No State Feedback**
When you capture a piece, the points number changes silently. No "+4" floating up from the scoreboard. No highlight pulse on the updated number. No sound that escalates with point magnitude.

**6. The Die is a Side Panel, Not a Centerpiece**
The die is the game's most dramatic element — "fate decides which piece you command." But it's buried in a sidebar panel. It should be center-stage with a dramatic reveal animation, camera focus, and audio buildup.

---

## 3. Game Logic & Addictiveness Analysis

### What Already Creates "One More Game"

| Mechanic | Why It Works |
|----------|-------------|
| **Die roll randomness** | Variable reward every turn — same psychology as gacha/loot boxes |
| **Army transfer on Raja capture** | Dramatic power shift — the underdog can suddenly become dominant |
| **4-player rankings (1st-4th)** | Even 2nd/3rd feels like "almost" — drives retry motivation |
| **No-capture timeout** | Prevents stale games, keeps pressure on |
| **3 AI difficulties** | "Can I beat Hard?" creates a skill progression ladder |
| **Hint system** | Teaches without punishing — reduces frustration |
| **Timer pressure** | Per-move 30s creates urgency and prevents analysis paralysis |

### What's Missing for Addictiveness

#### A. No Session-to-Session Retention

| Missing Mechanic | Impact | Priority |
|------------------|--------|----------|
| **ELO / Ranked Ladder** | Players need a visible skill metric to chase | Critical |
| **Daily Challenges** | Creates a reason to return *today specifically* | Critical |
| **Match History & Stats** | Gives players an identity | Critical |
| **Seasonal Resets** | Progression ends at 20 games | High |
| **Win Streak Tracking** | "3 in a row!" notification | High |

#### B. No Dopamine Escalation

| Moment | Current Feel | What It Should Feel Like |
|--------|-------------|------------------------|
| **Die roll** | 600ms cycling faces, then result | Dramatic build-up, slow-down, reveal with audio crescendo |
| **Capturing a Padati** | Same as any move | Satisfying *clink*, "+1" floats up |
| **Capturing a Ratha** | Same as any move | Bigger sound, "+4" floats, brief highlight |
| **Capturing a Raja** | Screen shake + red flash | Screen shake + flash + elimination splash + army transfer animation + dramatic audio |
| **Being eliminated** | Silent, continue watching | "ELIMINATED — 4th Place" dramatic overlay with stats |
| **Winning** | Static overlay with placements | Confetti, trophy animation, stats reveal, "Play Again" button pulses |
| **Unlocking a cosmetic** | Nothing happens | Dedicated unlock screen with reveal animation |

#### C. No Social / Competitive Hooks

| Missing | Why It Matters |
|---------|---------------|
| **Rematch button** | After an online game, players want to run it back immediately |
| **Emotes / quick chat** | "Nice move!", "Well played!" — creates social bonding |
| **Leaderboard** | "I'm #47 in India" — creates competitive identity |
| **Spectating** | Watch friends' games — creates community |
| **Game sharing** | Share replay links — organic growth |
| **Friend list** | "X is online, let's play" — the strongest retention hook |

#### D. No Content Variety

| Potential Mode | Why It's Addictive |
|----------------|-------------------|
| **1v1 mode** | Faster games, more accessible, lower commitment |
| **Puzzle mode** | Daily puzzle = daily return |
| **Blitz mode** (15s per move) | Fast games = more games per session |
| **Historical scenarios** | Educational + replay value |
| **Custom rules** | Community-created content |

#### E. The Progression Cliff

```
Games:  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21+
Unlocks:         ↑  ↑     ↑        ↑        ↑        ↑        ↑     ↑  NOTHING
         Parch Bone Geo  Rose  Jade  Stone  Min  Clay  Ivory
```

After game 20, the progression is **completely flat**. No new unlocks, no challenges, no rankings. The player has no reason to return. This is the single biggest retention killer.

### The Fix: Layered Retention System

```
Layer 1: Cosmetics (current, needs expansion)
  → Add win-based cosmetics (rare/legendary tiers)
  → Add seasonal cosmetics
  → Add achievement badges

Layer 2: Ranking (not built)
  → ELO-based with visible tiers
  → Seasonal resets
  → Leaderboards

Layer 3: Daily/Weekly (not built)
  → Daily challenge puzzle
  → Weekly quest ("Win 5 games as Green")
  → Streak bonuses

Layer 4: Social (partially built)
  → Friends list
  → Rematch
  → Emotes
  → Spectating
  → Game sharing

Layer 5: Content (not built)
  → 1v1 mode
  → Blitz mode
  → Puzzle mode
  → Historical scenarios
```

---

## 4. Prioritized Roadmap

### Phase A: UI/UX Overhaul (Before Launch)

1. Implement the **MENU_VISION.md** (living board, particles, gold title)
2. Add **screen transitions** (fade/slide between all views)
3. Fix **die roll animation** to land on actual result
4. Add **score change animations** (+N floating, pulse)
5. Add **elimination splash** ("Red ELIMINATED — 4th Place")
6. Add **victory celebration** (confetti, trophy, stats)
7. Make **ReplayViewer responsive**
8. Extract shared **DieFaceDisplay** component
9. Add **scrollable MoveHistory** with die results
10. Add **close button to GameOver**
11. Mobile-first layout (bottom sheet for die/history)
12. Replace oscillator sounds with richer synthesis

### Phase B: Retention Systems (Post-Launch)

1. **Match history + statistics** (wins, captures, streaks)
2. **ELO ranking with tiers** (the #1 retention driver)
3. **Daily challenges**
4. **Win-streak tracking**
5. **Rematch button**
6. **Expanded cosmetic progression** (win-based unlocks, seasonal)

### Phase C: Social & Content

1. **Emotes / quick chat**
2. **Friends list**
3. **Leaderboards**
4. **1v1 mode**
5. **Puzzle mode**
6. **Blitz mode**

---

## 5. Component-Level Audit

### Board.tsx
- Piece icons are loaded eagerly into a module-level cache
- `PieceIconSVG` is dead code when images are loaded (~150 lines invisible)
- No coordinate labels (rank/file) on the board
- No visual feedback on invalid clicks
- No scroll prevention on mobile
- `pieceRadius` not responsive to very small screens

### DieRoll.tsx
- Roll animation does not show the actual result landing
- No dice rolling sound sync
- No animation when points change
- Forfeit message uses emoji (inconsistent tone)
- Timer fonts not tabular (layout shift between 1:05 vs 12:05)

### GameOver.tsx
- No close/dismiss button — can't review final board
- "Unassigned" shown for empty player slots in <4 player games
- No confetti, no fanfare, no winner highlight
- No statistics shown (move count, capture count, time played)

### Tutorial.tsx
- 12 steps is overwhelming — most games have 3-5
- No keyboard navigation (arrow keys, Escape)
- No animation between steps
- No image/diagram support — all text, no visual aids
- References features before user has seen them

### Lore.tsx
- Stray dice emoji `🎲` breaks scholarly tone
- "Return to Game" text misleading if accessed before game
- No scroll container safety net

### MoveHistory.tsx
- Only 6 moves visible with no scroll
- No highlighting of the most recent move
- No click-to-navigate to board state
- Key generation is fragile
- No capture highlighting

### Settings.tsx
- Toggles lack ARIA roles (`role="switch"`, `aria-checked`)
- No visual feedback on theme change (must close settings to see)
- Lock emoji is informal — should be SVG icon
- Timer input has no keyboard validation
- No "Reset to Defaults" button
- No scroll container on small screens

### TurnIndicator.tsx
- No animation on turn change — just swaps color
- No player avatar or icon
- Redundant with `DieRoll.tsx` header

### ReplayViewer.tsx
- Board hardcoded to 400px — not responsive
- Board state recomputation on every step change (slow for 200+ moves)
- Army transfer logic duplicated from engine
- No animation between steps
- No die roll result shown in move list
- "Start" button label ambiguous
- No auto-play feature

### AuthScreen.tsx
- No password strength indicator
- No "Forgot Password" link
- Google button has no Google logo/branding
- No auto-focus on email field

### Lobby.tsx
- Hardcoded hex colors instead of `PLAYER_COLORS` constant
- No "copy room code" button
- No kicking/banning mechanism
- Loading states use "..." instead of spinners
- Sign out button is tiny (`text-xs`)

### OnlineGame.tsx
- No mobile layout consideration (4 header buttons overflow)
- Settings modal shows mode toggle button (should be hidden in online)
- "Play Again" in GameOver calls `handleLeave` (exits room)
- No latency indicator

### DieRollOnline.tsx
- Massive code duplication with `DieRoll.tsx`
- No timer in online mode — games can stall
- Roll animation does not sync with server result
- No error handling on network failure

---

## 6. Key Files Reference

| File | Lines | Purpose |
|------|-------|---------|
| `src/engine/types.ts` | 57 | Core type definitions |
| `src/engine/board.ts` | 208 | Board creation and utilities |
| `src/engine/moves.ts` | 521 | Legal move generation |
| `src/engine/die.ts` | 22 | Die mechanics |
| `src/engine/scoring.ts` | 97 | Points and placement |
| `src/engine/elimination.ts` | 250 | Raja capture, army transfer |
| `src/engine/ai.ts` | 513 | AI (easy/medium/hard) + hints |
| `src/engine/pieces.ts` | 63 | Piece definitions, alliances |
| `src/engine/engine.test.ts` | 438 | 22 unit tests |
| `src/components/Board.tsx` | ~500 | Konva.js board rendering |
| `src/components/DieRoll.tsx` | ~350 | Die display, scoreboard |
| `src/components/GameOver.tsx` | ~100 | End-game overlay |
| `src/components/Tutorial.tsx` | ~200 | 12-step tutorial |
| `src/components/Settings.tsx` | ~350 | Settings panel |
| `src/components/MoveHistory.tsx` | ~80 | Move history panel |
| `src/components/ReplayViewer.tsx` | ~350 | Post-game replay |
| `src/store/gameStore.ts` | 473 | Zustand local game state |
| `src/store/multiplayerStore.ts` | 557 | Zustand online multiplayer |
| `src/utils/cosmetics.ts` | ~300 | Themes, progression |
| `src/utils/sound.ts` | ~150 | Web Audio effects |
| `src/App.tsx` | 333 | Root component |

---

*This document should be updated as changes are implemented.*
