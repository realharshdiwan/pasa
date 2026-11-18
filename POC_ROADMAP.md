# POC_ROADMAP.md — Proof of Concept & Implementation Specifications

> **Guideline for Agents & Contributors:**  
> This document defines the exact UI components, layout breakpoints, and interaction rules required to overhaul Pasa into a modern mobile-first strategy game. Follow these specs to maintain a unified visual and UX standard.

---

## 1. Screen Layout & Viewport Specifications

### 1.1 Mobile-First Viewport Rules (Portrait: `< 768px`)
* **Total Height Constraint:** The entire play area must fit within `100dvh` (Dynamic Viewport Height) without vertical scrolling.
* **Vertical Budget:**
  * **Top Bar (HUD Header):** `48px` to `56px` height.
  * **Battlefield (Board):** `aspect-square`, constrained by `max-h-[min(88vw, 48vh)]`.
  * **Action Area (Die Roll & Quick Actions):** `110px` to `140px` height.
  * **Player Score HUD:** Integrated into 4 compact corner chips around the board or a clean 2×2 row below.

### 1.2 Desktop / Tablet Viewport Rules (`>= 1024px`)
* Two-column layout (`flex-row`):
  * **Left Column:** Board centered with dynamic ambient background glow (`max-w-[74vh]`).
  * **Right Column:** Stylized Commander Cards, 3D/Physical Die Shaker, Quick Action Bar, and Collapsible Move History (`w-80` to `w-96`).

---

## 2. Component Overhaul Specifications

### 2.1 The Top Bar (`GameHeader.tsx`)
Replaces the 4 cluttered grey buttons (`Menu`, `Settings`, `Learn to Play`, `About`) and the full-screen rectangular `TurnIndicator` bar.

* **Left:** Game Logo (`Pasa`) + Active Mode Badge (`FFA` or `2v2`).
* **Center:** Animated Turn Pill:
  * Shows current player's color and army name (*"Your Turn — Red"* or *"Green Bot Thinking..."*).
  * Smooth pulsing glow when it is the human player's turn.
* **Right Action Icons:**
  * 🔊 **Sound Toggle:** 1-tap mute/unmute audio.
  * ❓ **Guide Modal:** Opens concise tutorial/rules.
  * ⚙️ **Settings Menu:** Clean drawer for Sanskrit names, board theme, and surrender/exit.

### 2.2 The 4-Player Commander HUD (`PlayerCards.tsx`)
Replaces plain text lists with four stylized commander status blocks:
* **Commander Portrait/Icon:** Distinctive color ring corresponding to Red, Blue, Yellow, or Green.
* **Score Pill:** Current capture points with high-contrast badge.
* **Status Badges:**
  * Active turn border highlight.
  * Eliminated badge (`✕ Fallen`) when Raja is captured.
  * Captor badge (*"Commanded by Red"*) when army is inherited.
* **Floating Score Popups (`score-float`):**
  * When points increase: `+4` in vibrant gold scales up and fades out upward with Ka-Ching chime sound.

### 2.3 The Action Area (`DieRollHUD.tsx`)
Replaces the flat utilitarian card with an engaging game control center:
* **Die Cup / Rolling Area:**
  * Idle: Large inviting button *"Roll Pasa"* with glowing borders and 3D bounce.
  * Rolling: Animated dice face shake / tumble cycle with rolling sound for both human and bots.
  * Landed: Clear 3D/stylized face highlighting the active piece type (Ashva, Gaja, Ratha, Padati), holding for 1200ms on bot turns for player readability.
* **Tactical Overrides:**
  * Clear badge indicating *"Raja can move on any roll"*.
  * *"Pass Turn"* button only appears when the roll has concluded and no valid moves exist (or to intentionally skip).

### 2.4 Mobile PWA Specifications (`vite-plugin-pwa`)
* **Manifest Settings:**
  * `name`: "Pasa — The Four Kings"
  * `short_name`: "Pasa"
  * `start_url`: "/"
  * `display`: "standalone"
  * `orientation`: "portrait"
  * `theme_color`: "#1c1917" (stone-900)
  * `background_color`: "#0c0a09" (stone-950)
* **Mobile Head Tags:**
  * `apple-mobile-web-app-capable`: "yes"
  * `apple-mobile-web-app-status-bar-style`: "black-translucent"
  * `viewport`: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"

---

## 3. Code Cleanliness & Anti-Bloat Directives

1. **No Fake Cosmetic Grind:**
   * Remove artificial locked cosmetics (`🔒 Play 20 games to unlock Ivory board`). All polished themes should be accessible to the player directly.
2. **Pure Vector / WebGL Piece Rendering:**
   * Eliminate crude fallback canvas geometric line drawing in `Board.tsx`. Always render high-resolution SVG assets or 3D models.
3. **No Redundant Turn Displays:**
   * Never show multiple turn indicators on the same screen (e.g. top banner + sidebar heading). The header turn pill is the single authoritative source.
4. **Decoupled Architecture:**
   * Keep `src/engine/` 100% pure TypeScript with zero UI or DOM dependencies.
   * All state transitions pass through `src/store/gameStore.ts`.
