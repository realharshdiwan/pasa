# AGENT_INSTRUCTIONS.md — Master Context & Engineering Directives for Pasa

> **Note for AI Agents & Engineers:**  
> Read this document completely before modifying or generating code. This file contains the complete domain context, architectural constraints, design vision, and development roadmap for **Pasa**.

---

## 1. Project Identity & Vision

### 1.1 What is Pasa?
**Pasa** is a modern, high-energy, mobile-first casual strategy web/PWA game based on **Chaturaji** (the ancient Indian 4-player ancestor of chess, circa 6th–11th century CE).

* **The Arena:** 8×8 grid with traditional uncheckered *Ashtāpada* cross markings (squares c3, c6, f3, f6, and four corner squares).
* **Four Armies:**
  * **Red** (South / Player 1)
  * **Green** (West / Player 2)
  * **Yellow** (North / Player 3)
  * **Blue** (East / Player 4)
* **The Die (*Pāśa*):** Rolled each turn. Dictates which piece type is allowed to move:
  * **2** = Ashva (Horse / Knight — L-jump)
  * **3** = Gaja (Elephant — 2-square diagonal jump, leaps over pieces)
  * **4** = Ratha (Chariot / Boat — orthogonal line mover)
  * **5** = Padati (Pawn / Infantry — 1 step forward, 1 step diagonal forward capture; promotes to Chariot on enemy back rank)
* **Raja Override (Sacred Rule):** A Raja (King) can move on **any die roll** (1 square any direction).
* **Army Inheritance (The Core Drama):** Capturing an enemy Raja immediately transfers command of their entire remaining army to the captor. Power shifts dynamically in seconds!
* **Victory:** Free-for-all or 2v2 (Red+Yellow vs Green+Blue). Placements (1st to 4th) determined by survival order and capture points. 20-move no-capture tiebreaker timeout.

### 1.2 Target Aesthetic: "Clash-Style" Polish
We reject dry, academic, rustic museum simulations. The aesthetic target is inspired by Supercell titles (**Clash Royale**, **Brawl Stars**):
* **Tactile, Juicy UI:** Beveled 3D-effect pill buttons, embossed gold borders, rich drop shadows, responsive press states (`active:scale-95`).
* **Living Commander Avatars:** Expressive player frames with active turn glow rings, score badges, and dynamic status tags (*"Fallen"*, *"Commanded by Red"*).
* **VFX & Haptics:** Floating `+N` gold score popups on capture, screen-shake on Elephant stomps, dice cup rattle, and audio fanfare on King capture.
* **Mobile-First Portrait:** Playable one-handed on mobile screens within `100dvh` without scrolling.

---

## 2. Technical Stack & Repository Architecture

```
                          ┌─────────────────────────────┐
                          │         Pasa (Vite)         │
                          └──────────────┬──────────────┘
                                         │
        ┌────────────────────────────────┼──────────────────────────────┐
        ▼                                ▼                              ▼
┌──────────────────┐           ┌───────────────────┐          ┌───────────────────┐
│   src/engine/    │           │  UI & Presentation│          │  Platform & State │
│  Pure TypeScript │           │  React 19 + Vite  │          │  Zustand 5 Stores │
│  Zero UI Imports │           │  Tailwind CSS 3   │          │  PWA (sw.js)      │
│  22 Unit Tests   │           │  Konva (2D Board) │          │  Supabase Online  │
│  Board, AI, Die  │           │  Vector SVGs      │          │  Vercel Hosting   │
└──────────────────┘           └───────────────────┘          └───────────────────┘
```

### 2.1 Directory Map
* `src/engine/`: **Headless pure TypeScript game rules.**
  * `ai.ts`: Heuristic bot move evaluation with 3 difficulties (`easy`, `medium`, `hard`) + hint generator.
  * `board.ts`: Board state, piece placement, Ashtāpada markings, board helpers.
  * `die.ts`: 4-sided die logic (faces 2, 3, 4, 5) and roll helpers.
  * `elimination.ts`: King capture, army inheritance, lone-king elimination.
  * `moves.ts`: Legal move generation, path validation, jumping rules, pawn promotion.
  * `scoring.ts`: Capture point values (Pawn=1, Knight=2, Elephant=3, Chariot=4, King=5) & tiebreakers.
  * `types.ts`: Core type contracts (`GameState`, `Piece`, `DieFace`, `PlayerColor`, `Move`).
  * `engine.test.ts`: 22 unit tests ensuring mathematical correctness.
* `src/store/`:
  * `gameStore.ts`: Local single-player / bot game state (Zustand).
  * `multiplayerStore.ts`: Online Supabase multiplayer room and move state.
* `src/components/`:
  * `GameHeader.tsx`: Floating battle header with pulsing Turn Pill, audio toggle, and modals.
  * `Board.tsx`: Konva-based interactive 8×8 board with SVG piece rendering.
  * `DieRoll.tsx`: Die rolling HUD, visual bot roll indicator, roll triggers.
  * `LocalLobbyModal.tsx`: Pre-game configuration modal (color pick, mode, bot difficulty).
  * `MainMenu.tsx`: Main menu with animated particles and PWA install prompt button.
  * `GameOver.tsx`: Victory celebration screen with stats and replay launcher.
  * `Settings.tsx`: Cosmetic theme selector (board & die themes).
  * `Tutorial.tsx` & `Lore.tsx`: How to play and historical background modals.
* `public/`:
  * `manifest.json`: Web App Manifest for mobile installation (standalone, portrait).
  * `sw.js`: Service worker for offline asset caching.
  * `pasa-icon.svg`: App launcher icon.

---

## 3. Strict Engineering Directives for Agents

1. **NEVER touch `src/engine/` with UI dependencies:**
   * `src/engine/` must remain 100% pure TypeScript. Do not import React, DOM, Konva, or CSS into the engine.
   * All 22 tests (`npm run test:run`) must pass at all times.
2. **Strict TypeScript & ESLint Cleanliness:**
   * Vercel builds run `tsc -b && vite build`. Any unused variable (`TS6133`) or missing type will break deployment.
   * ESLint is configured with React 19 compiler rules (`npm run lint`).
   * Avoid calling synchronous `setState` inside `useEffect` bodies (use callbacks, timeouts, or state sync).
   * Do not use `Math.random()` directly in render functions or JSX (must be pure).
3. **Single Authoritative Turn Indicator:**
   * Never render multiple turn banners. `GameHeader.tsx` is the authoritative source for whose turn it is.
   * Do not re-add old banner components like `TurnIndicator.tsx` to `LocalGame`.
4. **Mobile-First Height Budget:**
   * On mobile screens (`< 768px`), the board is constrained by `max-w-[min(92vw,50vh)]`.
   * The entire screen must fit within `100dvh` without vertical body scrolling.
5. **No Artificial Cosmetic Paywalls / Locks:**
   * All board themes and dice themes are unlocked by default. Do not introduce fake "Play 20 games to unlock" locks.
6. **Vector Asset Quality:**
   * Pieces use crisp vector SVGs from `src/assets/pieces/` (`raja.svg`, `ratha.svg`, `gaja.svg`, `ashva.svg`, `padati.svg`). Never use fallback geometric line drawing.
7. **Sandbox Execution Notice (Mac):**
   * Sandboxed shells block `.git/index.lock` and `node` executions.
   * Always execute git commands and npm build/test tasks with `BypassSandbox: true`.

---

## 4. Current Roadmap & Next Steps

### Completed
- [x] Phase 1: Navigation unblocked, exit confirmation modal, responsive board scaling.
- [x] Phase 1: Bloat purged, crude canvas fallbacks removed, SVGs only.
- [x] Phase 1: PWA manifest, service worker, and mobile install prompt.
- [x] Phase 2: Consolidated battle top bar (`GameHeader.tsx`) with animated Turn Pill.
- [x] Phase 2: Bot dice roll animation with physical bounce and 1200ms hold for readability.
- [x] Zero-warning ESLint and zero-error TypeScript build verified.

### Next Priorities (Phase 2 & Phase 3)
1. **Living 4-Player Commander Cards (`PlayerCards.tsx`):**
   * Replace plain text score list in `DieRoll.tsx` with 4 stylized commander cards.
   * Features: Active player glowing border, captured piece tray, points pill, eliminated state, army inheritance badge (*"Commanded by Red"*).
2. **Juicy Floating Score VFX (`ScoreFloat`):**
   * When a player captures a piece, float a gold `+N` badge upward with particle sparks and audio chime.
3. **Physical 3D/CSS Dice Cup Shaker:**
   * Turn the die area into an interactive tactile shaker cup that rattles on click and drops the die onto the table.
4. **Capacitor Mobile Packaging (Phase 3):**
   * Add `@capacitor/core` and `@capacitor/cli` for native iOS (Xcode) and Android APK builds.
5. **Online Multiplayer Polish:**
   * Polish Supabase matchmaking and reconnect flows for real-time multiplayer.

---

## 5. Verification Commands
Before concluding any task or pushing to GitHub, run:
```bash
# 1. Run unit tests
npm run test:run

# 2. Run linter
npm run lint

# 3. Verify production build
npm run build
```
All three commands must exit with code `0`.
