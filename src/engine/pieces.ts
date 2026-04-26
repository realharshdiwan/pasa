import type { GameMode, Piece, PieceType, PlayerColor } from './types'

const TEAM_BY_COLOR: Record<PlayerColor, 'sun' | 'moon'> = {
  red: 'sun',
  yellow: 'sun',
  blue: 'moon',
  green: 'moon',
}

export const BACK_RANK_PIECE_ORDER = ['ratha', 'ashva', 'gaja', 'raja'] as const

export const PIECE_CAPTURE_POINTS: Record<Exclude<PieceType, 'raja'>, number> = {
  ratha: 4,
  gaja: 3,
  ashva: 3,
  padati: 1,
}

export function createPiece(
  id: string,
  type: PieceType,
  color: PlayerColor,
  controlledBy: PlayerColor = color,
): Piece {
  return {
    id,
    type,
    color,
    controlledBy,
  }
}

export function getCapturePointsForPiece(pieceType: PieceType): number {
  if (pieceType === 'raja') {
    return 0
  }

  return PIECE_CAPTURE_POINTS[pieceType]
}

export function arePlayersAllied(
  left: PlayerColor,
  right: PlayerColor,
  gameMode: GameMode,
): boolean {
  if (left === right) {
    return true
  }

  if (gameMode === 'freeforall') {
    return false
  }

  return TEAM_BY_COLOR[left] === TEAM_BY_COLOR[right]
}

export function canControllerCaptureTarget(
  attackerController: PlayerColor,
  targetController: PlayerColor,
  gameMode: GameMode,
): boolean {
  return !arePlayersAllied(attackerController, targetController, gameMode)
}
