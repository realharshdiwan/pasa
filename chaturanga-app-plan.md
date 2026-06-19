# Pasa — App Plan

*Pasa: Sanskrit for the die. The die is everything.*

---

## Vision

A beautifully crafted browser game that revives Chaturaji — one of history's most dramatic strategy games. Four players, a die, inherited armies, and the chaos of shifting power. Not a museum piece. A living game that respects its source while feeling crafted and modern. Built solo with AI tools, passion project first.

---

## The Game

4 players. 8 pieces each. One die. The die tells you which piece you must move. Capture opponents' Rajas and inherit their armies — inherited pieces change colour to the captor's. Last Raja standing wins. Every match produces a full 1st–4th placement ranking based on last Raja standing + capture points. Optional alliance mode with endgame Alliance Break mechanic.

Full rules: see `RULES.md`.

---

## Platform Strategy

**Web first. Mobile later, if ever.**

Pasa is a 4-player game. Getting 4 people to download an app is hard. Sending a link is easy. Browser-first removes the biggest friction point. No App Store delays. Deploy to Vercel instantly.

Mobile is v3 territory — only if the web version earns it.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | React + Vite + TypeScript (strict) | Fast, AI tools excel, huge ecosystem |
| Board rendering | Konva.js (react-konva) | Canvas-based, smooth, React-friendly |
| State | Zustand | Simple, minimal, clean |
| Styling | Tailwind CSS | UI around board only |
| Deployment | Vercel | Free, instant deploys from GitHub |
| Backend (v2+) | Supabase | Real-time multiplayer, auth, when ready |

---

## Retention Design

Three layers, introduced in sequence. No token staking. No virtual economy.

**Layer 1 — Placement (v1, base rules)**
Full 1st–4th ranking per match. Points matter every turn — even eliminated players fight for placement.

**Layer 2 — Cosmetic Progression (v1)**
Play → earn progression points → unlock cosmetics. No purchases. Pure earned unlockables:
- Board textures (parchment, rosewood, stone, ivory)
- Piece styles (geometric, carved, illustrated manuscript)
- Die designs (bone, jade, clay)
- Historical lore entries

**Layer 3 — Rating System (v2, needs online multiplayer)**
Thematic rank ladder: *Padati → Ashva → Gaja → Ratha → Raja → Samrat*
Placement-based rating. Casual mode always available alongside Ranked.

---

## Build Phases

### Phase 1 — Headless Engine ✅ COMPLETE
16 unit tests passing. Board, pieces, moves, die, scoring, elimination all implemented in `src/engine/`.

### Phase 2 — Playable Board ✅ COMPLETE
- 4-sided Konva.js board with piece rotation per player
- Die roll UI + piece type constraint + dimming
- Pass Turn always available after rolling (Raja override or full forfeit)
- Points scoreboard + turn indicator
- Game over overlay with 1st–4th placement
- Alliance mode toggle (free-for-all / teams)
- Shared constants: `src/constants/colors.ts`, `src/utils/format.ts`

### Phase 3 — AI Opponents ✅ COMPLETE
*Goal: Play solo against 3 bots.*

- Bot logic for 3 AI players filling empty seats
- Evaluation function tuned for Chaturaji's point structure
- 3 difficulty levels (shallow to deep search)
- Hint system — highlight the player's best available move
- Conquered piece colour change (pieces shift to captor's colour + origin badge)

**Note:** Chaturaji AI is not standard minimax. 4-player, points-based, die-constrained, with inherited armies. Each bot plays selfishly. Consult Claude before designing the evaluation function.

### Phase 4 — Polish + Onboarding ✅ COMPLETE
*Goal: Something you'd proudly share with strangers.*

- Smooth piece movement animations (Konva tweens)
- Kill animation when Raja is captured (the dramatic moment)
- Die roll animation with sound
- Sound design — bamboo flute accents, tabla on captures, subtle ambient
- Interactive tutorial — teaches by doing
- Historical context screen — brief, beautiful lore
- Move history panel — last 5–6 moves in plain language ("Red Ashva captured Blue Padati")
- Full game replay / move history viewer (post-game)
- Auto die roll toggle (0.8sec delay, default off)
- Timer options: per-move (30sec) or total time (6min), lobby setting
- Controller badge on conquered pieces (origin colour ring)
- Board + piece + die cosmetic themes (earned via progression)
- Cosmetic progression system (play → earn → unlock)
- Sanskrit / English piece name toggle
- Settings panel consolidation

### Phase 5 — Online Multiplayer
*Goal: Play with friends remotely via shared link.*

- ✅ Room system — create game, share code, friends join
- ✅ Real-time sync via Supabase Realtime
- ✅ Simple auth — email + Google login via Supabase
- ⏳ Async option — take your turn, others notified (stretch)
- ⏳ Alliance Break mechanic UI (both players prompted when enemies eliminated)
- ⏳ Random team pairing option in Alliance Mode

### Phase 6 — Rating System
*Goal: Long-term competitive incentive.*

- Ranked mode (opt-in alongside casual)
- Placement-based rating adjustment
- Thematic tiers: Padati → Ashva → Gaja → Ratha → Raja → Samrat
- Seasonal resets

### Phase 7 — Mobile (If It Makes Sense)
- React Native port, engine unchanged
- Evaluate only if web has real users

---

## Feature List

| Feature | Phase | Status |
|---------|-------|--------|
| Headless engine + 16 tests | 1 | ✅ Done |
| 4-player pass-and-play (browser) | 2 | ✅ Done |
| Die mechanic + constraint | 2 | ✅ Done |
| Pass Turn (always after roll) | 2 | ✅ Done |
| Placement system (1st–4th) | 2 | ✅ Done |
| King elimination + army transfer | 2 | ✅ Done |
| Alliance mode toggle | 2 | ✅ Done |
| Game over overlay | 2 | ✅ Done |
| Shared constants + utils | 2 | ✅ Done |
| AI opponents (3 bots) | 3 | ✅ Done |
| 3 difficulty levels | 3 | ✅ Done |
| Move hints | 3 | ✅ Done |
| Conquered piece colour change | 3 | ✅ Done |
| Movement animations | 4 | ✅ Done |
| Kill animation | 4 | ✅ Done |
| Sound design | 4 | ✅ Done |
| Interactive tutorial | 4 | ✅ Done |
| Historical lore screen | 4 | ✅ Done |
| Move history panel (live) | 4 | ✅ Done |
| Game replay viewer (post-game) | 4 | ✅ Done |
| Auto die roll toggle | 4 | ✅ Done |
| Timer options (lobby setting) | 4 | ✅ Done |
| Controller badge on pieces | 4 | ✅ Done |
| Cosmetic progression | 4 | ✅ Done |
| Board/piece/die themes | 4 | ✅ Done |
| Sanskrit/English toggle | 4 | ✅ Done |
| Online multiplayer (friends) | 5 | 🚧 In Progress |
| Alliance Break mechanic | 5 | — |
| Random team pairing | 5 | — |
| Rating system + rank tiers | 6 | — |
| Mobile app | 7 | — |

---

## Folder Structure

```
pasa/
├── RULES.md
├── MASTER_PROMPT.md
├── src/
│   ├── engine/
│   │   ├── types.ts
│   │   ├── board.ts
│   │   ├── pieces.ts
│   │   ├── moves.ts
│   │   ├── die.ts
│   │   ├── scoring.ts
│   │   ├── elimination.ts
│   │   ├── ai.ts
│   │   └── engine.test.ts
│   ├── components/
│   │   ├── Board.tsx          ← Konva.js board + SVG piece icons + animation
│   │   ├── DieRoll.tsx        ← die face display, rolling animation, scoreboard
│   │   ├── GameOver.tsx       ← end-game overlay with placements
│   │   ├── Lore.tsx           ← historical Chaturaji context
│   │   ├── MoveHistory.tsx    ← live move history (last 6 moves)
│   │   ├── Settings.tsx       ← consolidated settings (difficulty, timer, sound, etc.)
│   │   ├── Tutorial.tsx       ← interactive learn-to-play guide
│   │   └── TurnIndicator.tsx  ← current turn colored banner
│   ├── constants/
│   │   └── colors.ts
│   ├── store/
│   │   └── gameStore.ts       ← Zustand store (game state, timer, settings)
│   ├── utils/
│   │   ├── cosmetics.ts        ← theme definitions, progression, localStorage persistence
│   │   ├── format.ts          ← capitalizeColor, positionToNotation
│   │   └── sound.ts           ← Web Audio sound effects
│   └── App.tsx                ← root component, bot orchestration, timer tick
```

---

## Using AI Tools

| Tool | Best For |
|------|---------|
| Claude browser | Architecture, hard decisions, reviewing approach |
| GPT-5.3-Codex (Copilot) | Primary coding — engine, UI, tests |
| Gemini 2.5 Pro (AI Studio) | Full codebase review, large context bugs |
| GPT-5 mini (Copilot) | Quick questions while coding |
| Kimi K2 Thinking (Nvidia NIM) | Hard reasoning — AI evaluation function |
| Cursor | Save for hardest sessions only |

**Always paste RULES.md + MASTER_PROMPT.md at the start of every AI coding session.**

---

## Honest Timeline

| Milestone | ETA |
|-----------|-----|
| ✅ Engine (headless) | Week 3 |
| ✅ Playable browser (4-player) | Week 6 |
| AI opponents | Week 10 |
| Polished v1 live | ~Month 4 |
| Online multiplayer (v2) | ~Month 6–7 |
| Rating system (v3) | ~Month 9 |
| Mobile (if ever) | TBD |

---

## Resources

- *A History of Chess* — H.J.R. Murray (1913)
- *Indian Chess* — Pavle Bidev
- Board Game Geek: Chaturaji
- react-konva — konvajs.org/docs/react
- Supabase — supabase.com/docs

---

*Write RULES.md first. Build the engine second. Touch the UI third. Ship to Vercel fourth.*
