# RULES.md — Pasa

**Pasa** is the Sanskrit word for the die at the heart of this game.
This file is the authoritative ruleset for this implementation.

Primary source: Murray, H.J.R. *A History of Chess* (1913).
Secondary source: Bidev, Pavle. *Indian Chess*.

Where sources conflict or are ambiguous, a **[DESIGN DECISION]** note marks the chosen interpretation. Do not deviate from these without updating this file first.

---

## Overview

Pasa (historically: Chaturaji — "four kings") is a 4-player strategy game played on an 8×8 board using a die. Each player commands an army of 8 pieces. The die determines which piece type must be moved each turn. The goal is to be the last Raja standing while accumulating the most points through captures.

---

## Players & Armies

4 players, each assigned a colour and starting corner:

| Player | Colour | Starting Corner | Pawn Direction |
|--------|--------|-----------------|----------------|
| 1 | Red | Bottom-left | Up (↑) |
| 2 | Blue | Bottom-right | Left (←) |
| 3 | Yellow | Top-right | Down (↓) |
| 4 | Green | Top-left | Right (→) |

Turn order: clockwise — Red → Blue → Yellow → Green → repeat.

---

## Board Setup

Each player occupies a 2×4 block in their corner.

**Red (bottom-left):**
```
Back rank (row 1): a1=Ratha  b1=Ashva  c1=Gaja  d1=Raja
Pawns    (row 2): a2=Padati b2=Padati c2=Padati d2=Padati
```

**Blue (bottom-right):**
```
Back rank (col h): h1=Ratha  h2=Ashva  h3=Gaja  h4=Raja
Pawns    (col g):  g1=Padati g2=Padati g3=Padati g4=Padati
```

**Yellow (top-right):**
```
Back rank (row 8): h8=Ratha  g8=Ashva  f8=Gaja  e8=Raja
Pawns    (row 7):  h7=Padati g7=Padati f7=Padati e7=Padati
```

**Green (top-left):**
```
Back rank (col a): a8=Ratha  a7=Ashva  a6=Gaja  a5=Raja
Pawns    (col b):  b8=Padati b7=Padati b6=Padati b5=Padati
```

---

## Pieces

Each player has 8 pieces:

| Piece | Sanskrit | Count | Capture Points |
|-------|----------|-------|----------------|
| King | Raja | 1 | — (see Elimination) |
| Chariot | Ratha | 1 | 4 |
| Elephant | Gaja | 1 | 3 |
| Horse | Ashva | 1 | 3 |
| Foot soldier | Padati | 4 | 1 each |

Points are scored when you **capture** an opponent's piece. The Raja has no capture point value — capturing it triggers elimination.

---

## The Die

A 4-sided die (pasa) with faces: **2, 3, 4, 5**.

Each face maps to a piece type the active player **must** move:

| Roll | Piece to Move |
|------|--------------|
| 2 | Ashva (Horse) |
| 3 | Gaja (Elephant) |
| 4 | Ratha (Chariot) |
| 5 | Padati (Foot soldier) |

**[DESIGN DECISION]** The Raja has no dedicated die face. The Raja may be moved freely on any turn in place of the rolled piece — but only if the player chooses to. It is never forced by the die.

**[DESIGN DECISION]** Die face → piece mapping follows Murray. The 5 = Padati interpretation is used over 5 = Raja.

---

## Turn Options

After rolling, the active player always has three options:
1. Move a piece of the rolled type (by clicking the board)
2. Move their Raja instead — the Raja override (always available)
3. Pass Turn entirely — forfeit the turn, advance to next player

**[DESIGN DECISION]** If the rolled die face produces no legal move for any piece of that type AND the player does not use the Raja override AND the player does not pass: this state cannot occur — Pass Turn is always visible after a roll.

**[DESIGN DECISION]** Auto die roll is available as a settings toggle. When enabled, the die rolls automatically 0.8 seconds after a turn begins. Default: off.

---

## Piece Movement Rules

### Raja (King)
- Moves **one square** in any direction: orthogonal or diagonal.
- Cannot move into a square attacked by any opponent.
- No castling.

### Ratha (Chariot)
- Moves **any number of squares** orthogonally (horizontally or vertically).
- Cannot jump over pieces.
- Captures by landing on an occupied enemy square.

### Gaja (Elephant)
- Moves **exactly 2 squares diagonally**.
- **Can jump over** the intermediate square.
- Always lands on the opposite colour square from where it started.
- **[DESIGN DECISION]** The Gaja is permanently restricted to squares of one colour for the entire game — this historical quirk is preserved faithfully. Not modernised to Rook or Bishop movement.

### Ashva (Horse)
- Moves in an **L-shape**: 2 squares orthogonally then 1 square perpendicular.
- **Can jump over** any pieces in between.
- Identical to a chess Knight.

### Padati (Foot soldier)
- Moves **one square forward** relative to its player's starting side.
- Captures **one square diagonally forward** only.
- Cannot capture straight ahead. Cannot move backward.

**Promotion:**
**[DESIGN DECISION]** A Padati reaching the opponent's back rank directly opposite its starting side promotes immediately to a **Ratha**. The promoted piece is placed on that square and remains under the promoting player's control.

---

## Capturing

- A piece captures by moving onto a square occupied by an opponent's piece.
- The captured piece is removed from the board.
- The capturing player gains that piece's point value immediately.
- You cannot capture your own pieces.
- In Alliance mode, you cannot capture a teammate's pieces — until Alliance Break is triggered (see below).

---

## Elimination

When a player's **Raja is captured:**

1. That player is **immediately eliminated** and takes no further turns.
2. **[DESIGN DECISION]** All of the eliminated player's remaining pieces transfer to the **capturing player**, who now controls both armies. The capturing player moves pieces from both armies (still die-constrained each turn).
3. **[DESIGN DECISION]** Captured/transferred pieces **change colour visually** to the capturing player's colour. A small badge/ring showing the original owner's colour is retained for identification. This reflects actual control state clearly during mid-game.

The game ends when only **one Raja** remains on the board — OR when Alliance Break resolution completes (see Alliance Mode).

---

## Placement & Scoring

**[DESIGN DECISION]** Every match produces a full ranking — 1st through 4th. There is no binary win/lose.

**Placement is determined as follows:**

| Place | Condition |
|-------|-----------|
| 1st | Last Raja standing (or winner of Alliance Break showdown) |
| 2nd | Highest capture points among eliminated players |
| 3rd | Second highest capture points |
| 4th | Lowest capture points (first eliminated) |

Points are tracked live and visible to all players at all times. Gaining an eliminated player's pieces does not add their point values to your score — only future captures using those pieces do.

**Tiebreaker:** Player who survived longer takes the higher placement.

---

## Alliance Mode (Optional Toggle)

Default: **Free-for-All** (every player for themselves).

Optional: **Alliance Mode** with two sub-options:

### Fixed Teams
- Red + Yellow vs. Blue + Green
- Default pairing when Alliance Mode is enabled

### Random Teams
**[DESIGN DECISION]** An optional toggle within Alliance Mode. Teams are assigned randomly at game start. Adds fairness variance but removes early cooperative strategy since players don't know pairings in advance. Available as a toggle, not the default.

### Alliance Rules
- Teammates cannot capture each other's pieces — until Alliance Break.
- If a teammate's Raja is captured by an opponent, that opponent gains the pieces. Alliances do not protect against elimination.
- A team loses when both players are eliminated.

### Alliance Break — Endgame Resolution
**[DESIGN DECISION]** When both enemy Rajas are eliminated and two teammates remain, the game pauses and triggers the Alliance Break:

1. Both remaining players are asked: *"Fight for sole dominance?"*
2. **Both agree** → game continues as free-for-all between the two. Last Raja standing wins (1st place). The other finishes 2nd.
3. **They disagree** → player with more capture points wins (1st). Other finishes 2nd.
4. **Tied on points** → the player who eliminated the last enemy Raja wins (1st).

This ensures Alliance Mode always produces a single winner and prevents the game ending in an unsatisfying draw between teammates.

---

## Timer (Optional)

**[DESIGN DECISION]** Timer is an optional game lobby setting with two modes:

- **Per-move timer:** 30 seconds per move. If exceeded, turn is passed automatically.
- **Total time:** 6 minutes per player (chess clock style). If a player's time runs out, they are eliminated.

Default: no timer. Both modes available as lobby options. Implemented in Phase 4.

---

## Move History

**[DESIGN DECISION]** A move history panel displays the last 5–6 moves in plain language during the game. Example: *"Red Ashva captured Blue Padati."* Full move history is available in the post-game replay viewer. This is tracked via `moveHistory` in game state from Phase 1.

---

## What Is NOT Included

- **Check / checkmate** — the Raja is captured directly like any other piece.
- **En passant** — not part of the historical ruleset.
- **Stalemate** — Pass Turn is always available after a roll.

---

## Summary of All Design Decisions

| Decision | Choice Made | Alternative Considered |
|----------|-------------|----------------------|
| Die face 5 | Padati | Raja |
| Raja movement | Optional on any turn | Only on roll of 5 |
| No legal move | Pass Turn always available | Forfeit only when no moves |
| Eliminated player's pieces | Go to captor | Removed from board |
| Conquered piece colour | Changes to captor's colour + origin badge | Keeps original colour |
| Pawn promotion | Becomes Ratha | Becomes original piece |
| Win condition | Last Raja standing | Highest points |
| Placement | Full 1st–4th ranking | Binary win/lose |
| Alliance pairing | Fixed teams default, random optional | Random only |
| Alliance Break | Points decide if disagreement | No endgame resolution |
| Alliance Break showdown | Both must agree to fight | Forced fight |
| Timer | Optional lobby setting | Always on |
| Auto die roll | Optional settings toggle, default off | Always auto |
| Gaja movement | Historical diagonal jump (2 squares) | Modern Rook/Bishop |

---

*This file must be included in all AI prompting sessions involving game logic.*
*Do not modify rules mid-implementation without updating this file first.*
