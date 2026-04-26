# Pasa — App Plan

*Pasa: Sanskrit for the die. The die is everything.*

---

## Vision

A beautifully crafted browser game that revives Chaturaji — one of history's most dramatic strategy games. Four players, a die, inherited armies, and the chaos of shifting power. Not a museum piece. A living game that respects its source while feeling crafted and modern. Built solo with AI tools, passion project first.

---

## The Game

4 players. 8 pieces each. One die. The die tells you which piece you must move. Capture your opponents' Rajas and inherit their armies. Last Raja standing wins — but placement (1st through 4th) is determined by capture points, so every move matters even after elimination. Optional alliance mode: Red+Yellow vs. Blue+Green.

Full rules: see `RULES.md`.

---

## Platform Strategy

**Web first. Mobile later, if ever.**

Pasa is a 4-player game. Getting 4 people to download an app is hard. Sending a link is easy. A browser-first approach removes the single biggest friction point for the game to actually be played. No App Store approval delays. Deploy instantly to Vercel. Share a URL the moment something works.

The engine (pure TypeScript) is platform-agnostic. Only the UI changes between web and mobile. Web first costs nothing in terms of rework on the hardest parts.

Mobile is v3 territory — only if the web version earns it.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | React + Vite | Fast setup, AI tools excel at it, huge ecosystem |
| Board rendering | Konva.js (react-konva) | Canvas-based, smooth, React-friendly, handles 4-player board well |
| State | Zustand | Simple, minimal, AI tools handle it cleanly |
| Styling | Tailwind CSS | For UI around the board — menus, scoreboard, turn indicator |
| Deployment | Vercel | Free, instant deploys from GitHub, shareable URL immediately |
| Backend (v2+) | Supabase | Free tier, real-time multiplayer, auth — when online play arrives |

---

## Retention Design — Final Approach

Three layers, introduced in sequence. No token staking, no virtual economy.

**Layer 1 — Placement (v1, base rules)**
Every match produces a full 1st–4th ranking based on last Raja standing + capture points. Points matter every single turn — even eliminated players fight for placement. Zero added complexity, changes everything about motivation.

**Layer 2 — Cosmetic Progression (v1)**
Play games → earn progression points → unlock cosmetics. No purchases, no economy, no real or virtual money. Pure unlockables earned through play. The audience for this game will grind for a carved sandalwood board skin. Unlockables:
- Board textures (parchment, rosewood, stone, ivory)
- Piece styles (geometric, carved, illustrated manuscript)
- Die designs (bone, jade, clay)
- Historical lore entries (brief, beautiful context about the game's origins)

**Layer 3 — Rating System (v2, needs online multiplayer)**
Thematic rank ladder — not Bronze/Gold/Diamond but a progression through the ancient military hierarchy:

*Padati → Ashva → Gaja → Ratha → Raja → Samrat*

Rating adjusts after every ranked match based on placement vs. expected placement given opponent ratings. Casual mode (no rating impact) always available alongside Ranked mode.

**What was decided against:**
Token staking and virtual coin economies were considered and rejected. They change the psychology of the game — players stop playing to win beautifully and start playing to not lose coins. The audience this game is built for will walk away from that signal. The game is the product. The economy is not.

---

## Build Phases

### Phase 1 — Headless Engine (Weeks 1–3)
*Goal: All game logic in pure TypeScript. Zero UI.*

- Board data structure (8×8 grid, piece objects, 4 player colours)
- All piece movement rules per `RULES.md`
- Legal move generation per player + die roll
- Die mechanic (roll → piece type constraint)
- Points tracking + placement logic (1st–4th)
- King elimination + army transfer
- Tested via unit tests / console only

**Critical:** Keep engine entirely inside `src/engine/`. No UI imports ever enter this folder. The engine is a pure function library — given a game state and an action, return a new game state.

**AI workflow:** Start every engine session by pasting `RULES.md` into context. Ask Claude to implement one piece type at a time. Test each before moving to the next.

---

### Phase 2 — Playable Board (Weeks 4–6)
*Goal: 4 humans can play pass-and-play in a browser.*

- 4-sided board in Konva.js (pieces rotated per player orientation)
- Piece selection + legal move highlighting
- Die roll UI — animated, satisfying
- Turn indicator (clear whose turn, what they rolled)
- Live points + placement scoreboard
- King elimination handling + visual feedback
- Basic piece art — SVG or clean geometric shapes

**Design direction:** Warm manuscript aesthetic. Aged parchment board. Hand-drawn-feeling piece icons. Subtle ink/grain texture overlay. Pieces inspired by Chandragupta-era ivory carvings — carved, not designed. Sanskrit piece names by default, English toggle in settings. This should feel like a found artifact, not a chess app clone. The aesthetic is what makes people share screenshots before they understand the rules.

---

### Phase 3 — AI Opponents (Weeks 7–10)
*Goal: Play solo against 3 bots.*

- Bot logic for 3 AI players filling empty seats
- Evaluation function tuned for Chaturaji's point structure — not chess heuristics
- 3 difficulty levels (shallow to deep search)
- Hint system — highlight the player's best available move

**Note:** Chaturaji AI is not standard minimax. 4-player, points-based, die-constrained, with inherited armies. Each bot plays selfishly (maximise own points and survival). Ask Claude specifically about multi-player game tree search — it is a genuinely different problem from 2-player chess AI.

---

### Phase 4 — Polish + Onboarding (Weeks 11–13)
*Goal: Something you'd proudly share with strangers.*

- Smooth piece movement animations (Konva tweens)
- Die roll animation with sound
- Sound design — bamboo flute accents, tabla on captures, subtle ambient drone
- Interactive tutorial — teaches by doing, not walls of text
- Historical context screen — brief, beautiful lore
- Alliance mode toggle (Free-for-All / Fixed Teams)
- Board + piece + die cosmetic themes (first unlockables)
- Cosmetic progression system (play → earn → unlock)
- Game replay / move history viewer
- Settings: Sanskrit/English toggle, sound on/off, theme picker

---

### Phase 5 — Online Multiplayer (Post v1, ~Month 6–7)
*Goal: Play with friends remotely via a shared link.*

- Room system — create a game, share a URL, friends join
- Real-time sync via Supabase Realtime
- Async option — take your turn, others notified by email/notification
- Simple auth — email or Google login via Supabase
- No public matchmaking yet — friends-only rooms to start

---

### Phase 6 — Rating System (Post v2)
*Goal: Long-term competitive incentive.*

- Ranked mode — opt-in alongside casual mode
- Placement-based rating (adjusts on 1st–4th finish vs. expected)
- Thematic rank tiers: Padati → Ashva → Gaja → Ratha → Raja → Samrat
- Seasonal resets
- Rank visible on profile, in lobbies

---

### Phase 7 — Mobile (If It Makes Sense)
*Goal: Native iOS + Android.*

- React Native port of the UI
- Engine unchanged — already pure TypeScript
- Konva replaced with React Native Skia
- Evaluate only if web version has real users and genuine demand

---

## Feature List

| Feature | Phase |
|---------|-------|
| 4-player pass-and-play (browser) | 2 |
| Die mechanic | 2 |
| Placement system (1st–4th) | 2 |
| King elimination + army transfer | 2 |
| Alliance mode toggle | 2 |
| AI opponents (3 bots, 3 difficulties) | 3 |
| Move hints | 3 |
| Animations + sound design | 4 |
| Interactive tutorial | 4 |
| Historical lore screen | 4 |
| Cosmetic progression (play to unlock) | 4 |
| Board / piece / die themes | 4 |
| Sanskrit / English toggle | 4 |
| Game replay / move history | 4 |
| Online multiplayer (friends via link) | 5 |
| Async multiplayer | 5 |
| Rating system + rank tiers | 6 |
| Mobile app | 7 |

---

## Using AI Tools Effectively

**Claude** — Architecture, engine logic, rule ambiguity, reviewing your approach. Always paste `RULES.md` before any game logic session.

**Codex / GitHub Copilot** — In-editor autocomplete. Boilerplate, UI components, unit tests.

**Gemini** — Historical research. Compare sources on Chaturaji rules, synthesise consensus vs. dispute.

**Midjourney / Recraft** — Visual identity. Piece artwork, board textures, die designs. Nail the aesthetic before writing rendering code.

**v0 / Bolt** — Scaffold UI components quickly (menus, modals, scoreboards) then drop into the project.

---

## Suggested Folder Structure

```
pasa/
├── RULES.md                  ← ruleset bible, paste into every AI session
├── src/
│   ├── engine/               ← pure TS, zero UI imports
│   │   ├── board.ts
│   │   ├── pieces.ts
│   │   ├── moves.ts
│   │   ├── die.ts
│   │   ├── scoring.ts
│   │   ├── elimination.ts
│   │   └── engine.test.ts
│   ├── components/           ← React + Konva UI
│   │   ├── Board.tsx
│   │   ├── Piece.tsx
│   │   ├── DieRoll.tsx
│   │   ├── Scoreboard.tsx
│   │   └── TurnIndicator.tsx
│   ├── store/                ← Zustand
│   │   └── gameStore.ts
│   └── App.tsx
```

---

## Honest Timeline

| Milestone | Realistic ETA |
|-----------|--------------|
| Engine done, headless | Week 3 |
| Playable in browser, 4-player | Week 6 |
| AI opponents working | Week 10 |
| Polished v1 live on web | ~Month 4 |
| Online multiplayer (v2) | ~Month 6–7 |
| Rating system (v3) | ~Month 9 |
| Mobile (if ever) | TBD |

Assumes ~10 hrs/week, heavy AI tool usage, deployed on Vercel throughout.

---

## Resources

- *A History of Chess* — H.J.R. Murray (1913) — canonical source
- *Indian Chess* — Pavle Bidev — alternative interpretations
- Board Game Geek: Chaturaji — community rules discussion
- react-konva docs — konvajs.org/docs/react
- Supabase docs — supabase.com/docs
- Sanskrit piece names: Raja, Ratha, Gaja, Ashva, Padati

---

*Write RULES.md first. Build the engine second. Touch the UI third. Ship to Vercel fourth.*
