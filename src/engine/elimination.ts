import { cloneBoard } from './board'
import { clonePlayers } from './scoring'
import type { Board, GameState, Piece, PlayerColor } from './types'

const PLAYER_COLORS: PlayerColor[] = ['red', 'blue', 'yellow', 'green']

function getRemainingPlayers(state: GameState): PlayerColor[] {
  return PLAYER_COLORS.filter((color: PlayerColor) => !state.players[color].isEliminated)
}

function finalizeIfSingleRemaining(nextState: GameState): GameState {
  const remainingPlayers = getRemainingPlayers(nextState)
  if (remainingPlayers.length !== 1) {
    return nextState
  }

  const winner = remainingPlayers[0]
  const finishedPlayers = clonePlayers(nextState.players)
  finishedPlayers[winner] = { ...finishedPlayers[winner], placement: 1 }

  const usedPlacements = new Set<number>()
  for (const color of PLAYER_COLORS) {
    const placement = finishedPlayers[color].placement
    if (placement !== null) {
      usedPlacements.add(placement)
    }
  }

  const openPlacements = [1, 2, 3, 4].filter(
    (placement: number) => !usedPlacements.has(placement),
  )

  for (const color of PLAYER_COLORS) {
    if (finishedPlayers[color].placement !== null) {
      continue
    }

    const fallbackPlacement = openPlacements.shift() ?? 4
    finishedPlayers[color] = {
      ...finishedPlayers[color],
      placement: fallbackPlacement,
    }
  }

  return {
    ...nextState,
    phase: 'finished',
    players: finishedPlayers,
  }
}

function getNextTurnAfterCurrentRemoval(
  turnOrder: PlayerColor[],
  currentTurn: PlayerColor,
): PlayerColor {
  const filteredTurnOrder = turnOrder.filter(
    (color: PlayerColor) => color !== currentTurn,
  )

  if (filteredTurnOrder.length === 0) {
    return currentTurn
  }

  const currentIndex = turnOrder.indexOf(currentTurn)
  if (currentIndex < 0) {
    return filteredTurnOrder[0]
  }

  const nextIndex = currentIndex % filteredTurnOrder.length
  return filteredTurnOrder[nextIndex]
}

function getNextTurnWithCurrentPresent(
  turnOrder: PlayerColor[],
  currentTurn: PlayerColor,
): PlayerColor {
  if (turnOrder.length === 0) {
    return currentTurn
  }

  const currentIndex = turnOrder.indexOf(currentTurn)
  if (currentIndex < 0) {
    return turnOrder[0]
  }

  const nextIndex = (currentIndex + 1) % turnOrder.length
  return turnOrder[nextIndex]
}

export function transferControlledPieces(
  board: Board,
  fromController: PlayerColor,
  toController: PlayerColor,
): Board {
  const nextBoard = cloneBoard(board)

  for (let row = 0; row < nextBoard.length; row += 1) {
    for (let col = 0; col < nextBoard[row].length; col += 1) {
      const squarePiece = nextBoard[row][col].piece
      if (squarePiece && squarePiece.controlledBy === fromController) {
        const transferredPiece: Piece = {
          ...squarePiece,
          controlledBy: toController,
        }
        nextBoard[row][col].piece = transferredPiece
      }
    }
  }

  return nextBoard
}

export function captureRajaAndTransferArmies(
  state: GameState,
  captor: PlayerColor,
  eliminatedPlayer: PlayerColor,
): GameState {
  if (captor === eliminatedPlayer) {
    throw new Error('Capturing player and eliminated player cannot be the same.')
  }

  if (state.players[eliminatedPlayer].isEliminated) {
    return state
  }

  const nextPlayers = clonePlayers(state.players)
  const eliminatedPlacement = state.placementCounter
  nextPlayers[eliminatedPlayer] = {
    ...nextPlayers[eliminatedPlayer],
    isEliminated: true,
    placement: nextPlayers[eliminatedPlayer].placement ?? eliminatedPlacement,
  }

  const nextBoard = transferControlledPieces(state.board, eliminatedPlayer, captor)
  const nextTurnOrder = state.turnOrder.filter(
    (color: PlayerColor) => color !== eliminatedPlayer,
  )

  const nextState: GameState = {
    ...state,
    board: nextBoard,
    players: nextPlayers,
    turnOrder: nextTurnOrder,
    currentTurn: nextTurnOrder.includes(state.currentTurn)
      ? state.currentTurn
      : getNextTurnWithCurrentPresent(nextTurnOrder, state.currentTurn),
    placementCounter: Math.max(2, state.placementCounter - 1),
  }

  return finalizeIfSingleRemaining(nextState)
}

export function checkLoneRaja(state: GameState): GameState {
  if (state.phase !== 'playing') {
    return state
  }

  let rajaPosition: { row: number; col: number } | null = null
  let controlledPieceCount = 0

  for (let row = 0; row < state.board.length; row += 1) {
    for (let col = 0; col < state.board[row].length; col += 1) {
      const squarePiece = state.board[row][col].piece
      if (!squarePiece || squarePiece.controlledBy !== state.currentTurn) {
        continue
      }

      controlledPieceCount += 1
      if (squarePiece.type === 'raja') {
        rajaPosition = { row, col }
      }
    }
  }

  if (controlledPieceCount !== 1 || rajaPosition === null) {
    return state
  }

  const nextBoard = cloneBoard(state.board)
  nextBoard[rajaPosition.row][rajaPosition.col].piece = null

  const nextPlayers = clonePlayers(state.players)
  const eliminatedPlacement = state.placementCounter
  nextPlayers[state.currentTurn] = {
    ...nextPlayers[state.currentTurn],
    isEliminated: true,
    placement: nextPlayers[state.currentTurn].placement ?? eliminatedPlacement,
  }

  const nextTurnOrder = state.turnOrder.filter(
    (color: PlayerColor) => color !== state.currentTurn,
  )

  const nextState: GameState = {
    ...state,
    board: nextBoard,
    players: nextPlayers,
    turnOrder: nextTurnOrder,
    currentTurn: getNextTurnAfterCurrentRemoval(state.turnOrder, state.currentTurn),
    currentRoll: null,
    placementCounter: Math.max(2, state.placementCounter - 1),
  }

  return finalizeIfSingleRemaining(nextState)
}

export function checkNoCaptureTimeout(state: GameState): GameState {
  if (state.phase !== 'playing' || state.movesSinceLastCapture < 20) {
    return state
  }

  const rankedPlayers = PLAYER_COLORS
    .map((color: PlayerColor) => ({
      color,
      player: state.players[color],
    }))
    .sort((left, right) => {
      const pointDifference = right.player.points - left.player.points
      if (pointDifference !== 0) {
        return pointDifference
      }

      if (left.player.isEliminated !== right.player.isEliminated) {
        return left.player.isEliminated ? 1 : -1
      }

      const leftPlacement = left.player.placement ?? Number.MAX_SAFE_INTEGER
      const rightPlacement = right.player.placement ?? Number.MAX_SAFE_INTEGER
      if (leftPlacement !== rightPlacement) {
        return leftPlacement - rightPlacement
      }

      return PLAYER_COLORS.indexOf(left.color) - PLAYER_COLORS.indexOf(right.color)
    })

  const finishedPlayers = clonePlayers(state.players)
  rankedPlayers.forEach((entry, index: number) => {
    finishedPlayers[entry.color] = {
      ...finishedPlayers[entry.color],
      placement: index + 1,
    }
  })

  return {
    ...state,
    phase: 'finished',
    players: finishedPlayers,
    currentRoll: null,
  }
}
