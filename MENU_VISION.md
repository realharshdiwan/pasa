# Main Menu Vision — Royal Court

## Aesthetic
The main menu is a **living scene**, not a screen. The board is always visible,
breathing slowly behind a translucent overlay. Gold dust particles rise from the
bottom of the screen. The background is a dark radial gradient — parchment brown
at center, fading to deep black at the edges. A vignette darkens the corners.

The tone is ancient Indian manuscript. Warm golds, deep blacks, no neon, no flat
UI. Every element should feel like it was carved or printed on aged vellum.

## Layout (top to bottom)
1. **Title "Pasa"** — large serif font, gold gradient text (cream → gold → dark
   brown), with a slow shimmer sweep animation every ~5s.
2. **Subtitle** — "the ancient game of four kings" in muted gold, small
   uppercase tracking.
3. **Board** — visible behind the overlay, breathing gently (subtle scale pulse).
   When decorative, shown small (320×320) at 25% opacity. When interactive, full
   size at 100% opacity.
4. **Ornate divider** — thin horizontal line with gold gradient (transparent →
   gold → transparent).
5. **Buttons** — minimal text-only buttons, no borders or backgrounds. Gold text,
   hover adds a warm glow (text-shadow). Three options:
   - **Local Game** (primary, larger)
   - **Online Multiplayer** (secondary, dimmed if Supabase not configured)
   - **Settings** (placeholder, disabled, lowest opacity)
6. **Tagline** — "four armies. one die." at the very bottom, dark muted gold,
   barely visible.

## Transition to Game
Clicking "Local Game" triggers a **seamless transition** — no loading screen:
1. Menu overlay fades out (0.8s ease-out, pointer-events disabled during fade)
2. Board scales from 320px to full size and fades from 25% to 100% opacity
3. Game UI (die roll, move history, turn indicator, control buttons) fades in
   with a slight delay (0.6s ease-out, starts 0.3s after menu begins fading)

Clicking "Menu" during a game reverses the process: game UI fades out, board
shrinks back to decorative mode, menu overlay fades in. The game state resets.

## Particle System (CSS)
15 ember particles, each a small circle with radial gradient (gold center →
transparent edge) and box-shadow glow. Staggered across horizontal positions,
rising from bottom to top at varying speeds (10–16s durations, 0–6s delays).
Muted particle color palette:
- Center: `#f2c14e`
- Edge: `#d4af37`

Respects `prefers-reduced-motion: reduce` — particles hidden.

## Gold Title Effect
- Background gradient: `#cfc09f 27% → #ffecb3 40% → #3a2c0f 78%`
- Clipped to text via `background-clip: text`
- Wrapper has overflow hidden for the shimmer sweep
- Shimmer: a diagonal white band (30% opacity) sweeps left-to-right every 5s
- Subtle pulsing brightness animation (1.0 → 1.15)

## Board in Decorative Mode
- Uses `createInitialBoard()` — same initial position as a new game
- Rendered via `Board` component with `decorative` prop (no click handlers, no
  highlights, no legal moves)
- Container: 320×320px, 25% opacity, `board-breathe` class (subtle scale pulse
  1.0 ↔ 1.008 over 6s)
- When game starts, transitions to full size, 100% opacity, no breathing

## Board Theme Colors
Used by `BOARD_THEME_COLORS` in `src/utils/cosmetics.ts`:
| Theme    | Light Square      | Dark Square       |
|----------|-------------------|-------------------|
| classic  | `#d4c5a0`        | `#8b7355`        |
| royal    | `#e8dcc8`        | `#a08060`        |
| modern   | `#f0e6d0`        | `#706050`        |
| midnight | `#2a2a3a`        | `#1a1a2a`        |

## Piece Designs
### Classic Theme (default)
- Raja: filled pentagon + circle crown
- Ratha: filled rectangle + 3 small rectangles (chariot silhouette)
- Gaja: filled circle + thick line (elephant head + trunk)
- Ashva: filled polygon (horse silhouette) + small color dot
- Padati: filled circle + filled rectangle (soldier silhouette)

### Geometric Theme
- Outlines only (stroke, no fill), clean geometric shapes
- Same silhouette logic but transparent fills

### Minimal Theme
- Simple shapes: diamond (raja), rectangle (ratha), circle (gaja), triangle (ashva), dot (padati)

## Responsive Design
- Board uses `ResizeObserver` — fills available space
- Menu content: padding 1rem, text scales with viewport width
- Game UI: right panel (die + history) is 288px, collapses on small screens
- Buttons: text-based, naturally responsive
- Reduced motion: all CSS animations disabled

## File References
- `src/index.css` — All menu CSS (embers, gold text, vignette, dividers, breathing, buttons, fades)
- `src/App.tsx` — Layered architecture: board always mounted, menu overlay, game UI layer
- `src/components/MainMenu.tsx` — Menu overlay content (title, buttons, tagline)
- `src/components/Board.tsx` — Board with `decorative` prop support
- `src/utils/cosmetics.ts` — Theme definitions and progression system
