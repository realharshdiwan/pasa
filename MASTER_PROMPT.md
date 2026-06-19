# Pasa — Master Prompt
*Paste this entire file at the start of every new AI coding session.*
*For game logic sessions, also paste RULES.md after this.*

---

## What We Are Building

**Pasa** is a browser-based 4-player strategy board game based on Chaturaji — an ancient Indian game and ancestor of chess. The name Pasa is Sanskrit for "die" — the die is the defining mechanic.

4 players each command 8 pieces. A die roll determines which piece type must be moved each turn. Capture opponents' Rajas to eliminate them and inherit their armies. Last Raja standing wins. Every match produces a full 1st–4th placement ranking based on last Raja standing + capture points accumulated.

This is a passion project built solo using AI tools. Code quality and correctness matter more than speed.

---

## Tech Stack — Non-Negotiable

- **Framework:** React 19 + Vite + TypeScript (strict mode)
- **Board rendering:** Konva.js via react-konva
- **State management:** Zustand
- **Styling:** Tailwind CSS (for UI around the board only — menus, scoreboard, turn indicator)
- **Deployment:** Vercel
- **Backend:** None yet (Supabase in a future phase for online multiplayer)

Do not suggest alternatives to this stack. Do not introduce additional libraries without asking.

---

## Architecture Rules — Always Follow These

### The engine is sacred
All game logic lives in `src/engine/`. This folder contains pure TypeScript only. Zero React imports. Zero Konva imports. Zero UI concerns of any kind. The engine is a pure function library: given a game state + an action, return a new game state.

If I ask you to add game logic somewhere outside `src/engine/`, refuse and suggest the correct location.

### Folder structure
```
pasa/
├── RULES.md
├── MASTER_PROMPT.md
├── src/
│   ├── engine/
│   │   ├── types.ts          ← all shared types and interfaces
│   │   ├── board.ts          ← board creation and utilities
│   │   ├── pieces.ts         ← piece definitions and point values
│   │   ├── moves.ts          ← legal move generation
│   │   ├── die.ts            ← die roll and piece type mapping
│   │   ├── scoring.ts        ← point tracking and placement
│   │   ├── elimination.ts    ← Raja capture and army transfer
│   │   ├── ai.ts             ← bot AI (easy/medium/hard) + hint system
│   │   └── engine.test.ts    ← unit tests (22 tests passing)
│   ├── components/
│   │   ├── Board.tsx         ← Konva.js 8×8 board + SVG piece icons + animation
│   │   ├── DieRoll.tsx       ← die face display, rolling animation, scoreboard, timer
│   │   ├── GameOver.tsx      ← end-game overlay with placements
│   │   ├── Lore.tsx          ← historical Chaturaji context
│   │   ├── MoveHistory.tsx   ← live move history panel (last 6 moves)
│   │   ├── Settings.tsx      ← consolidated settings (difficulty, timer, sound, etc.)
│   │   ├── Tutorial.tsx      ← interactive learn-to-play guide (12 steps)
│   │   └── TurnIndicator.tsx ← current turn colored banner
│   ├── constants/
│   │   └── colors.ts         ← player color hex values
│   ├── store/
│   │   └── gameStore.ts      ← Zustand store (game state, timer, settings, bot logic)
│   ├── utils/
│   │   ├── cosmetics.ts       ← theme definitions, progression, localStorage persistence
│   │   ├── format.ts          ← capitalizeColor, positionToNotation
│   │   └── sound.ts           ← Web Audio sound effects (move, capture, raja, die, game over)
│   └── App.tsx               ← root component, bot orchestration, timer tick, Raja flash
```

### TypeScript strict mode
Always use strict TypeScript. No `any`. No implicit types. Every function must have explicit parameter types and return types.

### Testing
Every engine function must have unit tests in `engine.test.ts`. Tests use Vitest (comes with Vite). When you write a function, write its tests immediately after.

---

## Core Types (Start Here)

These types are the foundation. All engine code is built on them.

```typescript
// src/engine/types.ts

export type PlayerColor = 'red' | 'blue' | 'yellow' | 'green';

export type PieceType = 'raja' | 'ratha' | 'gaja' | 'ashva' | 'padati';

export type DieFace = 2 | 3 | 4 | 5;

export interface Position {
  row: number; // 0–7, 0 = bottom
  col: number; // 0–7, 0 = left
}

export interface Piece {
  id: string;             // unique e.g. 'red-raja', 'blue-padati-1'
  type: PieceType;
  color: PlayerColor;     // original owner color
  controlledBy: PlayerColor; // current controller (changes on elimination)
}

export interface Square {
  position: Position;
  piece: Piece | null;
}

export type Board = Square[][];  // [row][col], 8x8

export interface Player {
  color: PlayerColor;
  isEliminated: boolean;
  points: number;
  placement: number | null; // 1–4, null until placed
}

export type GameMode = 'freeforall' | 'teams';
export type GamePhase = 'setup' | 'playing' | 'finished';

export interface GameState {
  board: Board;
  players: Record<PlayerColor, Player>;
  currentTurn: PlayerColor;
  currentRoll: DieFace | null;
  turnOrder: PlayerColor[];      // clockwise, excludes eliminated players
  gameMode: GameMode;
  phase: GamePhase;
  moveHistory: Move[];
  placementCounter: number;      // tracks 2nd, 3rd, 4th placement order
}

export interface Move {
  player: PlayerColor;
  piece: Piece;
  from: Position;
  to: Position;
  captured: Piece | null;
  roll: DieFace;
  usedRajaOverride: boolean;     // true if player moved Raja ignoring roll
}
```

---

## Die Rules

| Roll | Piece Type |
|------|-----------|
| 2 | ashva |
| 3 | gaja |
| 4 | ratha |
| 5 | padati |

The Raja has no die face. The player may always choose to move their Raja instead of the rolled piece type — this is an override, never forced.

If no legal move exists for the rolled piece type AND the player does not use the Raja override: the player forfeits their turn.

---

## Player Starting Positions

```
Red   (bottom-left):  back rank row 0, cols 0–3. Raja at [0][3]. Pawns row 1.
Blue  (bottom-right): back rank col 7, rows 0–3. Raja at [3][7]. Pawns col 6.
Yellow(top-right):    back rank row 7, cols 4–7. Raja at [7][4]. Pawns row 6.
Green (top-left):     back rank col 0, rows 4–7. Raja at [4][0]. Pawns col 1.
```

Back rank piece order per player (from corner outward):
Ratha → Ashva → Gaja → Raja

Pawn direction per player:
- Red: increasing row (up)
- Blue: decreasing col (left)
- Yellow: decreasing row (down)
- Green: increasing col (right)

---

## Elimination Rule

When a Raja is captured:
1. That player is eliminated immediately.
2. ALL their remaining pieces on the board transfer to the capturing player.
3. `piece.controlledBy` updates to the capturing player's color.
4. `piece.color` stays as the original owner — this matters for team mode.
5. The capturing player now moves those pieces on their turns (still die-constrained).

---

## Placement Rule

1st: last Raja standing.
2nd–4th: determined by total capture points at time of elimination, descending.
Tiebreaker: player who survived longer takes the higher placement.

---

## Session Instructions

When I start a session saying **"Phase 1 — Engine"**:
- Work only in `src/engine/`
- Write pure TypeScript
- Write tests for every function
- Do not touch any UI files

When I start a session saying **"Phase 2 — Board UI"**:
- Work in `src/components/`
- Use react-konva for board rendering
- Import from engine via clean interfaces only
- Do not write game logic in components

When I say **"Review this against RULES.md"**:
- Check the code or logic I provide against the rules
- Flag any discrepancy, even small ones

When I say **"Explain before implementing"**:
- Describe your approach in plain English first
- Wait for my approval before writing code

---

## What Not To Do

- Do not use `any` in TypeScript
- Do not put game logic in React components or Zustand store
- Do not import React/Konva/Zustand into `src/engine/`
- Do not suggest libraries not in the tech stack without asking
- Do not implement features beyond the current phase
- Do not skip writing tests for engine functions
- Do not use chess rules — this is not chess. Always refer to RULES.md

---

## First Task — Project Setup

When I say **"Begin setup"**, do the following in order:

1. Scaffold with Vite:
```bash
npm create vite@latest pasa -- --template react-ts
cd pasa
```

2. Install dependencies:
```bash
npm install konva react-konva zustand
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react
npx tailwindcss init -p
```

3. Configure Tailwind in `tailwind.config.js`:
```js
content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]
```

4. Add to `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

5. Configure Vitest in `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

6. Enable strict TypeScript in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

7. Create the folder structure:
```bash
mkdir -p src/engine src/components src/store
touch src/engine/types.ts
touch src/engine/board.ts
touch src/engine/pieces.ts
touch src/engine/moves.ts
touch src/engine/die.ts
touch src/engine/scoring.ts
touch src/engine/elimination.ts
touch src/engine/engine.test.ts
touch src/store/gameStore.ts
```

8. Copy the types from the Core Types section above into `src/engine/types.ts`.

9. Clear `src/App.tsx` to a blank shell:
```tsx
export default function App() {
  return <div className="min-h-screen bg-stone-900" />
}
```

10. Add to `package.json` scripts:
```json
"test": "vitest",
"test:run": "vitest run"
```

Setup is complete. Confirm and we move to Phase 1 — Engine.

---

*Always read this file before writing any code.*
*For game logic: also read RULES.md.*
*Current phase: Phase 5 — Online Multiplayer (in progress)*

### Phase 5 Progress — 🚧 IN PROGRESS
- ✅ Supabase JS client installed + configured (`src/lib/supabase.ts`)
- ✅ Database schema migration (`supabase/migrations/001_initial_schema.sql`)
  - Tables: rooms, room_players, moves, game_states
  - RLS policies for all tables
  - Realtime enabled on moves table
- ✅ Auth system (`src/contexts/AuthContext.tsx`, `src/contexts/useAuth.ts`)
  - Email/password signup + login
  - Google OAuth login
  - Graceful fallback when Supabase not configured
- ✅ Multiplayer store (`src/store/multiplayerStore.ts`)
  - Create/join/leave room
  - Real-time subscription via Supabase channels
  - Online move/roll/pass with game state sync
  - Room player management
- ✅ UI components:
  - `AuthScreen.tsx` — Login/signup with email + Google
  - `Lobby.tsx` — Room creation, code entry, waiting room with ready system
  - `OnlineGame.tsx` — Online game wrapper
  - `DieRollOnline.tsx` — Online die roll component
- ✅ Game mode selector (local vs online) in `App.tsx`
- ✅ Graceful Supabase-not-configured fallback
- ⏳ End-to-end testing with Supabase project
- ⏳ Alliance Break mechanic (deferred to later)
- ⏳ Bot support in online mode (human-vs-human only for now)

### Phase 4 Progress — ✅ COMPLETE
- ✅ Movement animations (Konva tweens)
- ✅ Kill animation (Raja capture flash + shake)
- ✅ Sound design (Web Audio: move, capture, raja, die, game over)
- ✅ Interactive tutorial (12-step Learn to Play)
- ✅ Historical lore screen
- ✅ Move history panel (live, last 6 moves)
- ✅ Auto die roll toggle (0.8s delay, default off)
- ✅ Timer options (per-move 30s / total 6min, configurable)
- ✅ Settings panel consolidation (difficulty, mode, timer, sound, Sanskrit toggle)
- ✅ Sanskrit/English piece name toggle
- ✅ SVG piece icons (distinct chess-like shapes)
- ✅ Die face visual display with dot patterns
- ✅ Bot die roll visibility (roll shown before move)
- ✅ Game replay viewer (post-game)
- ✅ Cosmetic progression (play → earn → unlock, localStorage persistence)
- ✅ Board/piece/die themes (5 board + 3 piece + 4 die themes)
- ✅ Theme selector UI in Settings with unlock indicators
- ✅ 22 tests passing, build clean, ESLint clean
