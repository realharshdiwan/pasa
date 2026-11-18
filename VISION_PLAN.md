# VISION_PLAN.md — Pasa (The 4-Player Strategy Board Game)

> **Core Philosophy:** "Four Armies. One Die. Shifting Power."  
> Transforming the ancient Indian ancestor of chess (*Chaturaji*) into a high-energy, juicy, mobile-first casual strategy game inspired by the aesthetic polish of Supercell titles (*Clash Royale*, *Brawl Stars*).

---

## 1. Executive Vision & Identity

### 1.1 The Market Opportunity
* **Chess is too rigid:** Memorized openings and deterministic play intimidate casual and social players.
* **Ludo is too mindless:** 100% luck with minimal deep decision-making.
* **Pasa is the Golden Middle:**
  * **The Die (*Pāśa*):** Dictates which piece type must move each turn, destroying opening book memorization.
  * **The Strategy:** Positioning, King safety, tactical sacrifice, and king-hunting.
  * **The Drama:** Capturing a Raja transfers that entire surviving army under your control. Power shifts dynamically in seconds.

### 1.2 Target Experience: "Clash-Style" Visual & Audio Juice
Instead of a dry, academic, rustic museum simulation, Pasa is a vibrant royal arena:
* **Chunky, Tactile UI:** Beveled 3D-effect pill buttons, embossed gold borders, rich drop shadows, responsive press states (`active:scale-95`).
* **Living Commander Avatars:** Four corner cards featuring expressive 2D/3D avatars that react dynamically (smiling on captures, trembling when King is checked/threatened, celebrating on army inheritance).
* **VFX & Haptic Juice:**
  * Floating `+4` gold score numbers on capture with particle burst.
  * Screen-shake when an Elephant (Gaja) stomps down.
  * 3D dice shaker rattle with physics-based roll.
* **Audio Landscape:** Deep Indian war drums (dhol), metallic sword clangs, crisp wooden piece placement, and triumphant conch shell/horn fanfare on Raja capture.

---

## 2. Architecture & Tech Stack

```
                          ┌─────────────────────────────┐
                          │    Pasa Application Core    │
                          └──────────────┬──────────────┘
                                         │
        ┌────────────────────────────────┼──────────────────────────────┐
        ▼                                ▼                              ▼
┌──────────────────┐           ┌───────────────────┐          ┌───────────────────┐
│  src/engine/     │           │  UI & Presentation│          │  Platform Layer   │
│  Pure TypeScript │           │  React 19 + Vite  │          │  Mobile & Deploy  │
│  Zero UI Imports │           │  Tailwind CSS 3   │          │  Vercel (Web/PWA) │
│  22 Unit Tests   │           │  Zustand 5 Store  │          │  Capacitor (App)  │
│  Board, AI, Die  │           │  Konva / Three.js │          │  Supabase (Online)│
└──────────────────┘           └───────────────────┘          └───────────────────┘
```

### 2.1 Headless Core Rules (Sacred)
The directory `src/engine/` contains the mathematically tested rules of Chaturaji according to H.J.R. Murray (1913) and Pavle Bidev.
* **Pieces:** Raja (King), Ratha (Chariot), Gaja (Elephant — 2-diagonal jump), Ashva (Horse — L-jump), Padati (Pawn — directional step & diagonal capture).
* **Die Faces:** 2 = Ashva, 3 = Gaja, 4 = Ratha, 5 = Padati.
* **Raja Override:** A Raja may move on *any* die roll.
* **Army Inheritance:** Capturing an enemy Raja immediately transfers command of their remaining army to the captor.
* **Placements:** 1st through 4th place ranked by survival order and capture points. 20-move no-capture tiebreak timeout.

---

## 3. The 3-Phase Execution Roadmap

### Phase 1: Streamline & Unblock (Immediate)
* [x] Fix trapped AuthScreen navigation with prominent back/cancel controls.
* [x] Responsive viewport scaling: board scales gracefully to `< 50vh` on mobile/portrait so controls never scroll offscreen.
* [x] Pre-game Battle Setup Lobby (`LocalLobbyModal.tsx`) allowing player color selection, 2v2 Alliance mode, AI difficulty, and timers.
* [x] Prevent accidental match abandonment with an exit confirmation modal.
* [x] Purge conflicting markdown plans and legacy bloat.

### Phase 2: Mobile-First "Clash-Style" HUD & Polish
* [x] **Streamlined HUD Top Bar:** Built `GameHeader.tsx` consolidating scattered buttons into a floating battle header with live pulsing Turn Pill.
* [x] **Bot Dice Roll Animation & Readable Pacing:** Bots now roll the die visibly with physics bounce and rolling sound, display the landed piece face prominently, and pause 1200ms before moving.
* [x] **Progressive Web App (PWA):** Web App Manifest, offline service worker, iOS mobile web-app tags, and install prompt for one-tap home screen installation on iOS and Android.
* [ ] **4-Player Living Avatar Cards:** Dynamic player frames showing commander color, current points, captured pieces, and status badges.
* [ ] **Juicy Floating Numbers & VFX:** Animated score pops on capture (`+1`, `+2`, `+3`, `+4`, `+5`), gold flash, and capture sound fx.
* [ ] **Physical Die Roll Feel:** Rework the die roll component into an interactive dice cup with bouncing physics and clear landing face.

### Phase 3: Visual Ascension (3D Board / Capacitor Native App)
* [ ] **3D / 2.5D Isometric Board Transition:** Introduce Three.js / React Three Fiber for dynamic piece lighting and camera tilt, while maintaining 2D fallback.
* [ ] **Capacitor Mobile Packaging:** Wrap the Vite app into native iOS (Xcode) and Android (Android Studio) projects for App Store & Google Play distribution.
* [ ] **Online Matchmaking & ELO Rank Ladder:** Rank progression from *Padati* (Novice) to *Samrat* (Emperor).
