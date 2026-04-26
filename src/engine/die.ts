import type { DieFace, PieceType } from './types'

export const DIE_FACES: readonly DieFace[] = [2, 3, 4, 5]

export const DIE_FACE_TO_PIECE: Record<DieFace, Exclude<PieceType, 'raja'>> = {
  2: 'ashva',
  3: 'gaja',
  4: 'ratha',
  5: 'padati',
}

export function getPieceTypeForDieFace(
  dieFace: DieFace,
): Exclude<PieceType, 'raja'> {
  return DIE_FACE_TO_PIECE[dieFace]
}

export function rollDie(randomFn: () => number = Math.random): DieFace {
  const faceIndex = Math.floor(randomFn() * DIE_FACES.length)
  const normalizedIndex = Math.min(Math.max(faceIndex, 0), DIE_FACES.length - 1)
  return DIE_FACES[normalizedIndex]
}
