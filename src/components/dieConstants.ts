import type { DieFace, PieceType, PlayerColor } from '../engine/types'

export const PIECE_NAMES: Record<PieceType, string> = {
  raja: 'Raja',
  ratha: 'Ratha',
  gaja: 'Gaja',
  ashva: 'Ashva',
  padati: 'Padati',
}

export const DIE_FACES: DieFace[] = [2, 3, 4, 5]

export const PLAYER_ORDER: PlayerColor[] = ['red', 'blue', 'yellow', 'green']

export const ROLL_LABELS_SANSKRIT: Record<DieFace, string> = {
  2: 'Ashva',
  3: 'Gaja',
  4: 'Ratha',
  5: 'Padati',
}

export const ROLL_LABELS_ENGLISH: Record<DieFace, string> = {
  2: 'Horse',
  3: 'Elephant',
  4: 'Chariot',
  5: 'Foot Soldier',
}

export const ROLL_ANIMATION_MS = 800
export const ROLL_CYCLE_MS = 80

export const DIE_DOT_POSITIONS: Record<DieFace, [number, number][]> = {
  2: [
    [0.25, 0.25],
    [0.75, 0.75],
  ],
  3: [
    [0.25, 0.25],
    [0.5, 0.5],
    [0.75, 0.75],
  ],
  4: [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.75, 0.75],
  ],
  5: [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.5, 0.5],
    [0.25, 0.75],
    [0.75, 0.75],
  ],
}
