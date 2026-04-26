import { getCapturePointsForPiece } from './pieces'
import type { Piece, Player, PlayerColor } from './types'

const PLAYER_COLORS: PlayerColor[] = ['red', 'blue', 'yellow', 'green']

export function clonePlayers(
  players: Record<PlayerColor, Player>,
): Record<PlayerColor, Player> {
  return {
    red: { ...players.red },
    blue: { ...players.blue },
    yellow: { ...players.yellow },
    green: { ...players.green },
  }
}

export function awardCapturePoints(
  players: Record<PlayerColor, Player>,
  captor: PlayerColor,
  capturedPiece: Piece | null,
): Record<PlayerColor, Player> {
  const nextPlayers = clonePlayers(players)
  if (!capturedPiece) {
    return nextPlayers
  }

  const gainedPoints = getCapturePointsForPiece(capturedPiece.type)
  nextPlayers[captor].points += gainedPoints
  return nextPlayers
}

export function rankEliminatedPlayers(
  players: Record<PlayerColor, Player>,
  eliminationOrder: PlayerColor[],
): PlayerColor[] {
  const eliminationIndex = new Map<PlayerColor, number>()
  eliminationOrder.forEach((color: PlayerColor, index: number) => {
    eliminationIndex.set(color, index)
  })

  const eliminatedColors = PLAYER_COLORS.filter(
    (color: PlayerColor) => players[color].isEliminated,
  )

  return eliminatedColors.sort((left: PlayerColor, right: PlayerColor) => {
    const pointDifference = players[right].points - players[left].points
    if (pointDifference !== 0) {
      return pointDifference
    }

    const leftOrder = eliminationIndex.get(left) ?? -1
    const rightOrder = eliminationIndex.get(right) ?? -1
    return rightOrder - leftOrder
  })
}

export function computePlacements(
  players: Record<PlayerColor, Player>,
  eliminationOrder: PlayerColor[],
): Record<PlayerColor, number | null> {
  const placements: Record<PlayerColor, number | null> = {
    red: null,
    blue: null,
    yellow: null,
    green: null,
  }

  const survivors = PLAYER_COLORS.filter(
    (color: PlayerColor) => !players[color].isEliminated,
  )

  if (survivors.length !== 1) {
    return placements
  }

  placements[survivors[0]] = 1
  const rankedEliminated = rankEliminatedPlayers(players, eliminationOrder)

  rankedEliminated.forEach((color: PlayerColor, index: number) => {
    placements[color] = index + 2
  })

  return placements
}

export function applyPlacements(
  players: Record<PlayerColor, Player>,
  placements: Record<PlayerColor, number | null>,
): Record<PlayerColor, Player> {
  const nextPlayers = clonePlayers(players)

  for (const color of PLAYER_COLORS) {
    nextPlayers[color].placement = placements[color]
  }

  return nextPlayers
}
