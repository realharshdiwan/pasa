# Pasa 3D Rewrite — Future Phase Plan

*This plan is for a future phase after the 2D game launches successfully. Do not start until 2D v1 is live and validated.*

---

## Vision

Replace the Konva.js 2D canvas rendering with Three.js (react-three-fiber) for a full 3D board game with animated character-like pieces, attack sequences, death effects, and a 3D rolling die. Clash Royale-inspired visual polish while keeping all game rules identical.

**Approach:** Procedural geometry first (no external 3D models), fixed isometric camera, full animation suite (move, attack, death, raja capture effects, die roll). Replace with polished GLTF models in a follow-up if the 3D version ships.

**Estimated effort:** 3-4 weeks full-time, ~12 implementation steps.

---

## Prerequisites

- 2D v1 launched on Vercel and validated by real players
- All 22 engine tests passing
- Phase 4 (Polish + Onboarding) 100% complete
- User feedback collected on 2D version

---

## Architecture Overview

```
UNCHANGED (0%):
  src/engine/        ← Pure TS game logic (22 tests)
  src/store/         ← Zustand state (only add 3D animation state)
  src/utils/         ← Sound, format, cosmetics
  src/constants/     ← Colors

REWRITTEN (100%):
  src/components/Board.tsx     ← Konva → react-three-fiber Canvas
  src/components/DieRoll.tsx   ← 2D die → 3D animated die

NEW FILES:
  src/components/3d/           ← All 3D components
```

---

## New Dependencies

| Package | Purpose | Bundle impact |
|---------|---------|---------------|
| `three` | 3D engine | ~150KB gzipped |
| `@react-three/fiber` | React renderer for Three.js | ~40KB |
| `@react-three/drei` | Helpers (OrbitControls, Text, Float, etc.) | ~60KB (tree-shakeable) |
| `gsap` | Animation timelines for move/attack/kill | ~30KB |
| `@types/three` | TypeScript types | dev only |

**Total bundle increase: ~280KB gzipped** (current: 168KB → ~450KB)

**Remove:** `konva`, `react-konva` (~80KB saved)

---

## 3D Scene Architecture

```
Scene.tsx                    ← Root: Canvas, lights, camera, controls
├── GameBoard.tsx            ← 8x8 board with raised tiles
├── Piece3D.tsx              ← Individual 3D piece (one per piece on board)
│   ├── ProceduralGeometry   ← Built from primitives (no external models)
│   ├── IdleAnimation        ← useFrame breathing/bobbing loop
│   └── StateIndicator       ← Glow ring for selected, highlight for legal moves
├── Die3D.tsx                ← 3D die with roll animation
├── Effects.tsx              ← Particles, capture flash, raja death explosion
├── Camera.tsx               ← Fixed isometric view with smooth transitions
└── Interaction.tsx          ← Raycasting, hover highlights, click handling
```

---

## Procedural 3D Models (No External Assets)

Since Chaturaji has unique piece types (not standard chess), procedural geometry is the right call. Each piece built from Three.js primitives:

### Raja (King)
- **Base:** CylinderGeometry(0.3, 0.35, 0.1, 16) — wide disc base
- **Body:** CylinderGeometry(0.15, 0.25, 0.6, 8) — tapered column
- **Crown:** ConeGeometry(0.2, 0.3, 5) — pentagonal crown (5 sides = Chaturaji)
- **Finial:** SphereGeometry(0.06, 8, 8) — sphere on top
- **Total height:** ~1.0 units

### Ratha (Chariot)
- **Base:** BoxGeometry(0.5, 0.1, 0.6) — flat platform
- **Body:** BoxGeometry(0.4, 0.3, 0.45) — box cabin
- **Wheels:** 4x CylinderGeometry(0.08, 0.08, 0.05, 12) rotated 90° on Z
- **Pole:** CylinderGeometry(0.03, 0.03, 0.3, 6) — front protrusion

### Gaja (Elephant)
- **Body:** SphereGeometry(0.28, 12, 10) — scaled Y slightly
- **Head:** SphereGeometry(0.18, 10, 8) — positioned forward+up
- **Trunk:** CylinderGeometry(0.04, 0.06, 0.35, 8) — curved via vertex displacement or CatmullRomCurve3 tube
- **Ears:** 2x PlaneGeometry(0.15, 0.12) — thin flaps, slightly angled
- **Tusks:** 2x CylinderGeometry(0.015, 0.01, 0.12, 6) — small white cones

### Ashva (Horse)
- **Body:** LatheGeometry from horse-profile points — unique silhouette
- **Alternative:** CylinderGeometry body + SphereGeometry head + BoxGeometry ears + thin cylinder legs
- **Mane:** Series of small BoxGeometry strips along the neck ridge

### Padati (Foot Soldier)
- **Base:** CylinderGeometry(0.2, 0.25, 0.08, 12) — disc
- **Body:** CylinderGeometry(0.1, 0.12, 0.3, 8) — thin column
- **Head:** SphereGeometry(0.1, 8, 8) — simple sphere

### Material per piece:
```tsx
<meshStandardMaterial
  color={PLAYER_COLORS[piece.controlledBy]}
  metalness={0.3}
  roughness={0.6}
/>
```

**Conquered pieces:** When `controlledBy !== color`, add a small origin-color ring (TorusGeometry) at the base + change main material color.

---

## Animation System

**Tool: GSAP + useFrame hybrid**

| Animation | Trigger | Implementation |
|-----------|---------|---------------|
| **Idle bob** | Always | `useFrame` sine wave on Y position |
| **Move** | `lastMove` changes | GSAP timeline: lift → arc → land (0.4s) |
| **Attack** | Move with `captured` | GSAP: lunge forward → snap back (0.3s) |
| **Death** | Capture happens | GSAP: shrink + rotate + fade out (0.5s) |
| **Raja capture** | Raja killed | GSAP: explosion particles + screen flash + camera shake |
| **Die roll** | `rollDie()` | GSAP: tumble rotation + bounce settle (0.8s) |
| **Selection glow** | `selectedSquare` | Shader pulse or emissive material toggle |
| **Legal move dots** | `legalMovesForSelected` | Small glowing spheres on valid squares |

### Move Animation Detail
```typescript
function animateMove(meshRef, from: Position, to: Position) {
  const tl = gsap.timeline()
  tl.to(meshRef.current.position, {
    y: 1.5,  // lift
    duration: 0.15,
    ease: 'power2.out'
  })
  tl.to(meshRef.current.position, {
    x: toX,
    z: toZ,
    duration: 0.25,
    ease: 'power2.inOut'
  })
  tl.to(meshRef.current.position, {
    y: 0,  // land
    duration: 0.1,
    ease: 'bounce.out'
  })
}
```

### Attack Sequence (when move has `captured`):
1. Attacker lunges toward captured piece (0.15s)
2. Quick snap-back (0.1s)
3. Captured piece death sequence triggers simultaneously

### Death Sequence:
1. Captured piece scales down to 0 (0.3s, ease: `power3.in`)
2. Rotates 180° on Y axis during shrink
3. Fades opacity to 0
4. Piece removed from scene

### Raja Death (special):
1. All above death effects
2. **Particle burst:** 20-30 small sphere meshes explode outward, fade over 0.5s
3. **Screen flash:** Red overlay div (reuse existing `raja-flash` CSS)
4. **Camera shake:** GSAP shakes camera position ±0.1 for 0.4s

**Animation state machine per piece:**
```
idle → moving → idle
idle → attacking → idle
idle → dying → (removed from scene)
```

GSAP timelines managed via refs, triggered by watching Zustand state.

---

## Interaction (Raycasting)

Replace Konva's `onClick` with Three.js raycasting:

1. Each board tile gets a transparent `<mesh>` with `onClick` handler
2. `@react-three/drei`'s `<Html>` or custom raycaster for hover detection
3. Legal move highlights = small glowing spheres or semi-transparent tile overlays
4. Selection = emissive glow ring around piece base

```tsx
// Invisible overlay on each tile for raycasting
<mesh position={[x, 0.08, z]} onClick={() => handleTileClick(row, col)}>
  <boxGeometry args={[0.98, 0.02, 0.98]} />
  <meshBasicMaterial transparent opacity={0} />
</mesh>
```

**Highlight system:**
- **Selected tile:** Semi-transparent yellow plane (opacity 0.35)
- **Legal moves:** Small green spheres (radius 0.08) centered on valid tiles
- **Hint from/to:** Blue semi-transparent planes

---

## 3D Die

### Die geometry:
- BoxGeometry(0.5, 0.5, 0.5) with beveled edges
- Each face shows dots via texture or small sphere geometry on face
- 4 faces for values 2-5 (skip 1 and 6 — not used in Chaturaji)

### Roll animation:
1. Die spawns above board (y: 3)
2. GSAP tumble: random rotations on all 3 axes (0.6s)
3. Bounce: 2-3 small bounces settling to final rotation (0.3s)
4. Final rotation maps to rolled face value

### Die themes:
- Classic: white material, dark dots
- Bone: ivory material, brown dots
- Jade: green material, white dots
- Clay: terracotta material, dark dots

---

## Camera Setup

**Fixed isometric camera** (no orbit — board game shouldn't rotate freely):

```tsx
<Canvas camera={{ position: [8, 10, 8], fov: 35 }}>
```

- Fixed angle looking down at ~45°
- No orbit controls (cleaner UX for a board game)
- Optional: subtle camera drift on raja capture (shake effect)
- Responsive: adjust FOV or position on resize

---

## Effects

### Capture particle burst:
```tsx
function CaptureParticles({ position, color }) {
  // 12 small spheres that fly outward and fade
  // Each sphere: random direction vector, GSAP animate position + opacity
}
```

### Raja death explosion:
```tsx
function RajaDeathEffect({ position }) {
  // 30 particles, larger spread, longer duration
  // Red/orange color, scale animation
}
```

### Board selection glow:
- Emissive material property toggle on selected piece
- Pulsing ring (TorusGeometry) around selected tile

---

## Performance Considerations

| Technique | What it optimizes |
|-----------|-------------------|
| **InstancedMesh** | Same-type pieces share geometry (5 draw calls instead of 32) |
| **Frustum culling** | Three.js default — off-screen objects not rendered |
| **LOD (Level of Detail)** | Simplified geometry when zoomed out |
| **Shadow map size** | Reduce to 1024 on mobile |
| **Particle pooling** | Reuse particle meshes instead of creating/destroying |
| **useFrame throttling** | Skip non-essential updates on low FPS |

---

## Implementation Steps

| Step | What | Depends on | Est. Time |
|------|------|------------|-----------|
| 1 | Install three, r3f, drei, gsap. Remove konva, react-konva. | Nothing | 0.5 day |
| 2 | Create `Scene.tsx` — Canvas, lights, camera | Step 1 | 0.5 day |
| 3 | Create `GameBoard.tsx` — 64 tiles with materials | Step 2 | 1 day |
| 4 | Create `Piece3D.tsx` — procedural geometry for all 5 types | Step 3 | 2 days |
| 5 | Wire interaction — raycasting, piece selection, legal move display | Step 4 | 1.5 days |
| 6 | Add move animation — GSAP timeline on `lastMove` change | Step 5 | 1 day |
| 7 | Add attack + death animations | Step 6 | 1.5 days |
| 8 | Create `Die3D.tsx` — 3D die with roll animation | Step 7 | 1 day |
| 9 | Add raja capture effects (particles, screen shake, flash) | Step 8 | 1.5 days |
| 10 | Performance pass — instancing, LOD, frustum culling | Step 9 | 1 day |
| 11 | Update Board.tsx to use 3D scene instead of Konva | Step 10 | 0.5 day |
| 12 | Remove all Konva code, run tests, build, lint | Step 11 | 0.5 day |
| **Total** | | | **~12 days** |

---

## Files Summary

| File | Action | Lines (est.) |
|------|--------|-------------|
| `package.json` | Modify | 2 |
| `src/components/Board.tsx` | Rewrite | ~60 (down from 505) |
| `src/components/DieRoll.tsx` | Minor update | ~10 changes |
| `src/components/3d/Scene.tsx` | New | ~80 |
| `src/components/3d/GameBoard.tsx` | New | ~100 |
| `src/components/3d/Piece3D.tsx` | New | ~250 |
| `src/components/3d/Die3D.tsx` | New | ~120 |
| `src/components/3d/Interaction.tsx` | New | ~80 |
| `src/components/3d/BoardHighlights.tsx` | New | ~60 |
| `src/components/3d/Effects.tsx` | New | ~100 |
| `src/components/3d/useAnimation.ts` | New | ~150 |
| **Total new code** | | **~1000 lines** |

**Engine files touched:** 0
**Store changes:** Minimal (add animation-related state if needed)
**Test changes:** 0 (all 22 existing tests remain)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Procedural models look bad | Medium | High | Invest in material quality (PBR), add edge outlines |
| Animation feels janky | Medium | High | Test on low-end devices early, use GSAP's proven easing |
| Mobile performance | High | Medium | Limit particles, reduce shadow quality, test on real devices |
| Scope creep | High | High | Stick to plan, ship MVP first, polish later |
| Learning curve (Three.js) | Medium | Low | r3f + drei abstracts most of raw Three.js |

---

## What Stays Identical

- Game rules and logic (`src/engine/`)
- Zustand store state shape (`src/store/gameStore.ts`)
- Sound effects (`src/utils/sound.ts`)
- Cosmetics system (`src/utils/cosmetics.ts`)
- Settings, Tutorial, Lore, MoveHistory, GameOver, TurnIndicator components
- Player colors (`src/constants/colors.ts`)
- Build tooling (Vite, TypeScript, ESLint, Vitest)

This is a pure rendering-layer swap. The game plays identically — it just looks 3D.

---

## Migration Strategy

**Do NOT replace in place.** Build in a branch, swap when stable.

1. Create branch `feature/3d-rendering`
2. Complete all 12 steps on the branch
3. Test full game flow (start → play → timer → game over → replay)
4. Performance benchmark on mobile
5. Merge to main only when 3D version is verified stable

---

## Future: External 3D Models

After the procedural version ships, consider upgrading to hand-crafted GLTF models:

- **Source:** Sketchfab CC-Attribution models (low-poly chess sets available)
- **Adaptation:** Chaturaji has unique piece types — may need Blender editing
- **Cost:** Free (CC) to $50 per model (commercial license)
- **When:** Only if the 3D version gets positive player feedback

Free resources:
- Sketchfab: "Low Poly Chess Set" by therealscav (CC Attribution)
- OpenGameArt: "Low Poly Chess Set v2" (CC-BY-4.0)
- Mixamo: Free character animations for rigged models

---

*Created: 2026-06-19*
*Status: Planning — do not start until 2D v1 launches successfully*
