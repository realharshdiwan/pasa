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

## No Legal Move Rule

**[DESIGN DECISION]** If the rolled die face produces no legal move for any piece of that type (all blocked, captured, or none remain), the player **forfeits their turn**. They may not substitute a different piece type.

Exception: the player may always choose to move their Raja instead, regardless of the roll.

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
- **[DESIGN DECISION]** The Gaja is permanently restricted to squares of one colour for the entire game — this historical quirk is preserved faithfully.

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
- In Alliance mode, you cannot capture a teammate's pieces.

---

## Elimination

When a player's **Raja is captured:**

1. That player is **immediately eliminated** and takes no further turns.
2. **[DESIGN DECISION]** All of the eliminated player's remaining pieces transfer to the **capturing player**, who now controls both armies. The capturing player moves pieces from both armies (still die-constrained each turn). This creates the game's defining power shifts.

The game ends when only **one Raja** remains. That player finishes 1st.

---

## Placement & Scoring

**[DESIGN DECISION]** Every match produces a full ranking — 1st through 4th. There is no binary win/lose.

**Placement is determined as follows:**

| Place | Condition |
|-------|-----------|
| 1st | Last Raja standing |
| 2nd | Highest capture points among eliminated players |
| 3rd | Second highest capture points |
| 4th | Lowest capture points (first eliminated) |

This means capture points matter throughout the entire match — not just for the winner. A player eliminated early still fights for 2nd or 3rd by how aggressively they captured before going out.

**Scoring notes:**
- Points are tracked live and visible to all players at all times.
- Gaining an eliminated player's pieces does not add their point values to your score — only future captures made using those pieces do.
- In the event of a points tie for 2nd or 3rd: the player who survived longer takes the higher placement.

---

## Alliance Mode (Optional Toggle)

Default: **Free-for-All** (every player for themselves).

Optional: **Fixed Teams — Red + Yellow vs. Blue + Green**
- Teammates cannot capture each other's pieces.
- If a teammate's Raja is captured by an opponent, that opponent gains the pieces — alliances do not protect against elimination.
- A team loses when both players are eliminated.
- Win condition: last team with a surviving Raja wins.
- Points are tracked individually within teams. Team placement: 1st team vs. 2nd team, then individual points within each team for 1st/2nd and 3rd/4th.

**[DESIGN DECISION]** Alliance mode is an optional game toggle, not part of the base ruleset.

---

## What Is NOT Included

- **Check / checkmate** — the Raja is captured directly like any other piece.
- **En passant** — not part of the historical ruleset.
- **Stalemate** — if a player has no legal moves on their roll, they forfeit their turn.

---

## Summary of All Design Decisions

| Decision | Choice Made | Alternative Considered |
|----------|-------------|----------------------|
| Die face 5 | Padati | Raja |
| Raja movement | Optional on any turn | Only on roll of 5 |
| No legal move | Forfeit turn | Move any piece |
| Eliminated player's pieces | Go to captor | Removed from board |
| Pawn promotion | Becomes Ratha | Becomes original piece |
| Win condition | Last Raja standing | Highest points |
| Placement | Full 1st–4th ranking | Binary win/lose |
| Alliance mode | Optional toggle | Core rule |

---

*This file must be included in all AI prompting sessions involving game logic.*
*Do not modify rules mid-implementation without updating this file first.*
