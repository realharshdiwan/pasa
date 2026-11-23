# PATH_AHEAD.md — Master Vision & Sequential Roadmap for Pasa

> **Guiding Principle:** "Four Armies. One Die. Shifting Power."  
> Transforming Chaturaji into a juicy, high-energy, mobile-first casual strategy game inspired by the polish of Supercell titles (*Clash Royale*, *Brawl Stars*), backed by an authoritative, zero-trust real-time engine.

---

## 1. The Core Vision (Never Drift From This)

1. **Not a Dry Museum Simulation:**
   - Avoid flat, dull, rustic grey boxes or academic chess aesthetics.
   - Pasa is a vibrant royal battlefield: tactile 3D buttons, embossed gold borders, living commander avatars, dynamic turn glow rings, floating gold score VFX, and deep audio feedback.
2. **Mobile Portrait First (`100dvh`):**
   - The majority of players play on phones. The board and all battle controls must fit within `100dvh` without vertical scrolling.
   - Board size budget: `max-w-[min(92vw,50vh)]` on portrait mobile screens.
3. **Pure Engine Isolation (Sacred Rule):**
   - `src/engine/` must remain 100% pure TypeScript with zero DOM/React/Konva imports.
   - All rules, scoring, AI heuristics, deterministic PRNG (`Mulberry32`), and room networking state machines live here.
   - Always keep all unit tests passing (`npm run test:run`).
4. **Zero-Friction Multiplayer with 15s AI Takeover:**
   - Never force a signup wall for casual play. Instant 1-click play backfilled with server-side AI bots.
   - When a human disconnects, start a 15s grace timer and seamlessly switch the seat to server AI without killing the match for the other 3 players.

---

## 2. Milestone Progress Tracker

### ✅ Phase 1: Streamline, Anti-Bloat & Mobile PWA (Completed)
- [x] Viewport constrained to `100dvh` with responsive board scaling (`max-w-[min(92vw,50vh)]`).
- [x] Unblocked navigation (AuthScreen back/cancel buttons, battle exit confirmation modal).
- [x] Pre-game battle setup lobby (`LocalLobbyModal.tsx`) with color pick, 2v2 teams, and AI difficulty.
- [x] Bloat purged: 1800+ lines of dead plans removed, crude canvas line drawing replaced with crisp vector SVGs.
- [x] Mobile PWA installable on iOS (Safari home screen) and Android (one-tap install prompt).

### ✅ Phase 2A: Living HUD & Deterministic Core (Completed)
- [x] Streamlined HUD top bar (`GameHeader.tsx`) with animated pulsing turn pill and audio toggle.
- [x] Bot dice roll animation with physical bounce and 1200ms hold for readability.
- [x] 4-Player Living Commander Cards (`PlayerCards.tsx`) with turn glow rings, score pills, active piece counters, and crown inheritance banners.
- [x] Tactile 3D dice shaker cup button (`DieRoll.tsx`) with Raja override reminder.
- [x] Deterministic 32-bit PRNG (`Mulberry32` in `src/engine/rng.ts`).
- [x] Strict wire protocol (`src/engine/protocol.ts`) with monotonic sequence numbers.
- [x] Authoritative room engine with 15s disconnect grace timer and hot-swappable AI fallback (`src/engine/room.ts`).
- [x] 30/30 unit tests passing, zero ESLint warnings, clean Vercel production build.

---

## 3. The Sequential Path Ahead

### 🎯 Milestone 1: Tactical Board Juice & Animations (CURRENT)
- [ ] **Piece Lift & Drop Feel:** Tapping a selected piece gives it a lifted state (`scale: 1.15`, dynamic shadow) so it feels like physically lifting a wooden/ivory piece.
- [ ] **Elephant Stomp Rumble:** Screen-shake and deep drum rumble when an Elephant (*Gaja*) stomps down after a 2-diagonal jump.
- [ ] **King Capture Royal Fanfare:** Triumphant conch horn fanfare and screen flash when an enemy Raja is captured and their army changes color.
- [ ] **Readable Bot Move Trails:** Golden move trail line + pulsing glow on `from` and `to` squares so players easily follow fast moves.
- [ ] **Valid Move Target Pulsing:** Interactive pulsing indicator on squares where a piece can legally land.

### 🚀 Milestone 2: Live Instant Queue Multiplayer (PartyKit / WebSockets)
- [ ] Wire up `src/engine/room.ts` to a live PartyKit / WebSocket room server.
- [ ] **1-Click "Play Live Match":** Instant matchmaking queue with zero login wall.
- [ ] **3-Second Bot Backfill:** Automatically fills empty seats with server AI bots if 4 players aren't queued within 3 seconds.
- [ ] **Share Match Link:** 4-digit room code (`pasa.game/room/ABCD`) to invite friends from their phones.
- [ ] **Netcode HUD:** Corner indicator showing live RTT ping in ms, server tick, and player connection status.

### 📱 Milestone 3: Capacitor Native Mobile App (iOS App Store & Google Play)
- [ ] Install `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`.
- [ ] Add `@capacitor/haptics` for physical vibrations on phone when rolling dice or capturing pieces.
- [ ] Lock screen to portrait mode with full-screen edge-to-edge layout (`safe-area-inset`).
- [ ] Generate native Xcode and Android Studio projects ready for store submission.

### 👑 Milestone 4: 2.5D Isometric / 3D Board Transition
- [ ] Three.js / React Three Fiber layer for an angled isometric table with dynamic directional lighting and piece drop physics.
- [ ] Keep 2D Konva board as an instant low-end toggle for accessibility.
