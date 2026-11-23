# MASTER PLAN: Option A (The Pragmatic Evolution)
## Pasa (Chaturaji) — Juicy Mobile-First Strategy & Authoritative Real-Time Architecture

> **Core Directive:**  
> Blend the high-engineering distributed systems principles of the Authoritative Multiplayer Engine (seeded deterministic PRNG, zero-trust validation, 15s AI takeover) with the vibrant, tactile "Clash-style" mobile UI/UX that makes the game a joy to play — **all while preserving our zero-cost, 100% reliable Vercel PWA pipeline**.

---

## 1. Architectural Blueprint

```
                                  ┌───────────────────────────────┐
                                  │      Client (React 19 + PWA)  │
                                  │      Mobile 100dvh Viewport   │
                                  └───────────────┬───────────────┘
                                                  │
                 ┌────────────────────────────────┼───────────────────────────────┐
                 ▼                                ▼                               ▼
      ┌──────────────────────┐        ┌──────────────────────┐        ┌──────────────────────┐
      │ Living HUD (Juice)   │        │   src/store/ (Zustand│        │   src/engine/        │
      │ • GameHeader pill    │        │ • Optimistic intent  │        │ • Pure TypeScript    │
      │ • 4 Commander Cards  │◄───────┤ • Local & Net state  ├───────►│ • Mulberry32 PRNG   │
      │ • Floating Score VFX │        │ • Turn clock timers  │        │ • 22+ Unit Tests     │
      │ • Tactile Dice Cup   │        │ • Audio & Haptic fx  │        │ • Rules & Validation │
      └──────────────────────┘        └───────────┬──────────┘        └───────────┬──────────┘
                                                  │                               │
                                                  ▼                               ▼
                                      ┌──────────────────────────────────────────────────────┐
                                      │ Authoritative Multiplayer (PartyKit / WebSocket)     │
                                      │ • Seeded Room State Machine (seq: 1..N)              │
                                      │ • Zero-Trust Validation via src/engine/              │
                                      │ • 15s Disconnect Grace Window + Instant AI Takeover  │
                                      │ • Instant Demo Queue (Zero Signup Friction)          │
                                      └──────────────────────────────────────────────────────┘
```

---

## 2. Phased Roadmap

### Phase 2A: Deterministic Engine Core & Wire Protocol
- **Seeded PRNG (`src/engine/rng.ts`)**:
  - Fast, self-contained 32-bit `Mulberry32` pseudo-random number generator.
  - Deterministic dice rolls via `rollDieWithRng(rng: SeededRNG): { face: DieFace, nextRng: SeededRNG }`.
  - Maintain backwards-compatible `rollDie()` for non-seeded calls.
- **Wire Protocol & Intent Types (`src/engine/protocol.ts`)**:
  - Define `ClientIntent` and `ServerEvent` contracts.
  - Define monotonic sequence number invariants (`seq: number`, `clientActionId: string`).
- **Engine Unit Tests**:
  - Add determinism test suites proving that identical initial seeds produce 100% identical roll sequences.

### Phase 2B: Visual & Tactile "Clash-Style" Overhaul
- **4-Player Living Commander Cards (`src/components/PlayerCards.tsx`)**:
  - Replace the plain text score cards with four high-polish commander status frames.
  - Active turn ring with glowing pulse in player's army color.
  - Captured piece tray with mini piece silhouettes.
  - Dynamic status tags: *"Active"*, *"Eliminated (Fallen)"*, *"Commanded by Red"* (army inheritance).
  - Compact responsive arrangement: 2x2 grid on mobile portrait, side rail on desktop.
- **Floating Score VFX (`src/components/ScoreFloat.tsx` or CSS Keyframes)**:
  - On piece capture: spawn floating `+N` gold score popups with bounce and fade.
  - Sound fx reinforcement (chime on points, dramatic fanfare on Raja capture).
  - Subtle board rumble/shake on heavy piece moves (Elephant/Gaja stomp).
- **Physical Tactile Die Cup Shaker (`src/components/DieRoll.tsx`)**:
  - Redesign the roll action into a chunky, tactile 3D-embossed dice shaker cup.
  - Physics wobble and roll animation on click.
  - Prominent landed piece badge with clear indication of valid move types.
  - Raja override reminder badge (*"Raja may move on any roll"*).

### Phase 2C: Authoritative Room Engine & AI Takeover
- **Room State Machine (`src/engine/room.ts`)**:
  - Single-threaded room actor logic: `initRoom`, `handleIntent(intent) -> { events, nextState }`.
  - Server-controlled 30s turn countdown timer.
  - **15-Second Disconnect Grace Period**: When a seat disconnects, start a 15s countdown. If expired, seat seamlessly flips `controllerType` to `AI_FALLBACK` using `src/engine/ai.ts`.
  - Reconnecting human with matching player token instantly reclaims the seat mid-turn.
- **Instant Demo Queue**:
  - 1-click "Play Instant Battle" with zero login wall, automatically backfilling empty seats with server AI bots.

### Phase 2D: Verification, Production Build & Vercel Deploy
- Run full unit tests (`npm run test:run`).
- Verify zero lint/compiler errors (`npm run lint && npm run build`).
- Push to GitHub `main` for instant live deployment on `chaturaji.vercel.app`.
