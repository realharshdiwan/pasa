import {
  createEmptyBoard,
  createInitialBoard,
  createInitialGameState,
  findControlledPieces,
  getPieceAt,
  setPieceAt,
} from './board'
import { getBotMove, getHintMove } from './ai'
import { getPieceTypeForDieFace, rollDie } from './die'
import {
  captureRajaAndTransferArmies,
  checkLoneRaja,
  checkNoCaptureTimeout,
  transferControlledPieces,
} from './elimination'
import {
  type CandidateMove,
  applyMoveToBoard,
  getLegalMovesForPiece,
  getLegalMovesForRoll,
  getTurnMoveOptions,
} from './moves'
import {
  arePlayersAllied,
  createPiece,
  getCapturePointsForPiece,
} from './pieces'
import { awardCapturePoints, computePlacements } from './scoring'
import type { Board, Piece, PlayerColor, Position } from './types'
import { describe, expect, it } from 'vitest'

function withPiece(board: Board, position: Position, piece: Piece): Board {
  return setPieceAt(board, position, piece)
}

function hasMoveTo(
  moves: { to: Position; captured: Piece | null }[],
  row: number,
  col: number,
): boolean {
  return moves.some((move) => move.to.row === row && move.to.col === col)
}

function moveKey(move: CandidateMove): string {
  return `${move.piece.id}:${move.from.row},${move.from.col}->${move.to.row},${move.to.col}`
}

describe('board setup and utilities', () => {
  it('creates the initial board with expected cornerstone pieces', () => {
    const board = createInitialBoard()

    expect(getPieceAt(board, { row: 0, col: 3 })?.type).toBe('raja')
    expect(getPieceAt(board, { row: 3, col: 7 })?.type).toBe('raja')
    expect(getPieceAt(board, { row: 7, col: 4 })?.type).toBe('raja')
    expect(getPieceAt(board, { row: 4, col: 0 })?.type).toBe('raja')
    expect(getPieceAt(board, { row: 1, col: 0 })?.type).toBe('padati')
    expect(getPieceAt(board, { row: 0, col: 6 })?.type).toBe('padati')
  })

  it('finds pieces by current controller', () => {
    const board = createInitialBoard()
    const redPieces = findControlledPieces(board, 'red')
    expect(redPieces).toHaveLength(8)
  })

  it('creates an initial game state ready to play', () => {
    const state = createInitialGameState()
    expect(state.currentTurn).toBe('red')
    expect(state.phase).toBe('playing')
    expect(state.turnOrder).toEqual(['red', 'blue', 'yellow', 'green'])
  })
})

describe('pieces and die rules', () => {
  it('maps die faces to piece types per rules', () => {
    expect(getPieceTypeForDieFace(2)).toBe('ashva')
    expect(getPieceTypeForDieFace(3)).toBe('gaja')
    expect(getPieceTypeForDieFace(4)).toBe('ratha')
    expect(getPieceTypeForDieFace(5)).toBe('padati')
  })

  it('rolls all four die faces deterministically with injected random values', () => {
    expect(rollDie(() => 0)).toBe(2)
    expect(rollDie(() => 0.26)).toBe(3)
    expect(rollDie(() => 0.51)).toBe(4)
    expect(rollDie(() => 0.76)).toBe(5)
    expect(rollDie(() => 1)).toBe(5)
  })

  it('returns capture points and alliance status correctly', () => {
    expect(getCapturePointsForPiece('raja')).toBe(0)
    expect(getCapturePointsForPiece('ratha')).toBe(4)
    expect(arePlayersAllied('red', 'yellow', 'teams')).toBe(true)
    expect(arePlayersAllied('red', 'blue', 'teams')).toBe(false)
    expect(arePlayersAllied('red', 'yellow', 'freeforall')).toBe(false)
  })
})

describe('move generation and application', () => {
  it('generates ratha moves with blocking and capture constraints', () => {
    let board = createEmptyBoard()
    board = withPiece(board, { row: 3, col: 3 }, createPiece('red-ratha', 'ratha', 'red'))
    board = withPiece(
      board,
      { row: 3, col: 5 },
      createPiece('red-padati-1', 'padati', 'red'),
    )
    board = withPiece(
      board,
      { row: 1, col: 3 },
      createPiece('blue-padati-1', 'padati', 'blue'),
    )

    const moves = getLegalMovesForPiece(board, { row: 3, col: 3 }, 'red', 'freeforall')
    expect(hasMoveTo(moves, 2, 3)).toBe(true)
    expect(hasMoveTo(moves, 1, 3)).toBe(true)
    expect(hasMoveTo(moves, 0, 3)).toBe(false)
    expect(hasMoveTo(moves, 3, 5)).toBe(false)
  })

  it('generates jumping moves for gaja and ashva', () => {
    let board = createEmptyBoard()
    board = withPiece(board, { row: 3, col: 3 }, createPiece('red-gaja', 'gaja', 'red'))
    board = withPiece(board, { row: 5, col: 5 }, createPiece('red-padati-2', 'padati', 'red'))
    board = withPiece(
      board,
      { row: 1, col: 1 },
      createPiece('blue-padati-2', 'padati', 'blue'),
    )
    board = withPiece(board, { row: 4, col: 4 }, createPiece('red-ashva', 'ashva', 'red'))

    const gajaMoves = getLegalMovesForPiece(board, { row: 3, col: 3 }, 'red', 'freeforall')
    expect(hasMoveTo(gajaMoves, 1, 1)).toBe(true)
    expect(hasMoveTo(gajaMoves, 5, 5)).toBe(false)

    const ashvaMoves = getLegalMovesForPiece(board, { row: 4, col: 4 }, 'red', 'freeforall')
    expect(hasMoveTo(ashvaMoves, 6, 5)).toBe(true)
    expect(hasMoveTo(ashvaMoves, 3, 2)).toBe(true)
  })

  it('generates padati directional movement and captures', () => {
    let board = createEmptyBoard()
    board = withPiece(board, { row: 1, col: 1 }, createPiece('red-padati-1', 'padati', 'red'))
    board = withPiece(
      board,
      { row: 2, col: 2 },
      createPiece('blue-padati-3', 'padati', 'blue'),
    )
    board = withPiece(
      board,
      { row: 2, col: 0 },
      createPiece('green-padati-1', 'padati', 'green'),
    )
    board = withPiece(board, { row: 2, col: 1 }, createPiece('red-padati-2', 'padati', 'red'))

    const redMoves = getLegalMovesForPiece(board, { row: 1, col: 1 }, 'red', 'freeforall')
    expect(hasMoveTo(redMoves, 2, 1)).toBe(false)
    expect(hasMoveTo(redMoves, 2, 2)).toBe(true)
    expect(hasMoveTo(redMoves, 2, 0)).toBe(true)

    let blueBoard = createEmptyBoard()
    blueBoard = withPiece(
      blueBoard,
      { row: 4, col: 4 },
      createPiece('blue-padati-4', 'padati', 'blue'),
    )
    const blueMoves = getLegalMovesForPiece(
      blueBoard,
      { row: 4, col: 4 },
      'blue',
      'freeforall',
    )
    expect(hasMoveTo(blueMoves, 4, 3)).toBe(true)
  })

  it('prevents raja from moving into attacked squares', () => {
    let board = createEmptyBoard()
    board = withPiece(board, { row: 0, col: 0 }, createPiece('red-raja', 'raja', 'red'))
    board = withPiece(board, { row: 0, col: 7 }, createPiece('blue-ratha', 'ratha', 'blue'))

    const rajaMoves = getLegalMovesForPiece(board, { row: 0, col: 0 }, 'red', 'freeforall')
    expect(hasMoveTo(rajaMoves, 0, 1)).toBe(false)
    expect(hasMoveTo(rajaMoves, 1, 1)).toBe(true)
  })

  it('filters legal moves by die roll and identifies forfeits', () => {
    let board = createEmptyBoard()
    board = withPiece(board, { row: 2, col: 2 }, createPiece('red-ratha', 'ratha', 'red'))
    board = withPiece(board, { row: 7, col: 0 }, createPiece('red-padati-3', 'padati', 'red'))

    const rollMoves = getLegalMovesForRoll(board, 'red', 4, 'freeforall')
    expect(rollMoves.length).toBeGreaterThan(0)
    expect(rollMoves.every((move) => move.piece.type === 'ratha')).toBe(true)

    const options = getTurnMoveOptions(board, 'red', 5, 'freeforall')
    expect(options.rolledPieceMoves).toHaveLength(0)
    expect(options.rajaOverrideMoves).toHaveLength(0)
    expect(options.mustForfeit).toBe(true)
  })

  it('applies moves and promotes padati to ratha on back rank', () => {
    let board = createEmptyBoard()
    board = withPiece(board, { row: 6, col: 0 }, createPiece('red-padati-4', 'padati', 'red'))

    const result = applyMoveToBoard(board, {
      piece: createPiece('red-padati-4', 'padati', 'red'),
      from: { row: 6, col: 0 },
      to: { row: 7, col: 0 },
      captured: null,
    })

    expect(result.didPromote).toBe(true)
    expect(result.movedPiece.type).toBe('ratha')
    expect(getPieceAt(result.board, { row: 7, col: 0 })?.type).toBe('ratha')
  })
})

describe('scoring, placement, and elimination', () => {
  it('awards capture points based on captured piece type', () => {
    const state = createInitialGameState()
    const nextPlayers = awardCapturePoints(
      state.players,
      'red',
      createPiece('blue-ratha', 'ratha', 'blue'),
    )
    expect(nextPlayers.red.points).toBe(4)
  })

  it('computes final placements from points and elimination-order tiebreaker', () => {
    const state = createInitialGameState()
    const players = {
      ...state.players,
      red: { ...state.players.red, isEliminated: false, points: 7 },
      blue: { ...state.players.blue, isEliminated: true, points: 5 },
      yellow: { ...state.players.yellow, isEliminated: true, points: 5 },
      green: { ...state.players.green, isEliminated: true, points: 2 },
    }

    const placements = computePlacements(players, ['green', 'blue', 'yellow'])
    expect(placements.red).toBe(1)
    expect(placements.yellow).toBe(2)
    expect(placements.blue).toBe(3)
    expect(placements.green).toBe(4)
  })

  it('transfers controlled pieces and updates elimination state', () => {
    let board = createEmptyBoard()
    board = withPiece(board, { row: 3, col: 3 }, createPiece('blue-ratha', 'ratha', 'blue'))
    board = withPiece(board, { row: 4, col: 4 }, createPiece('red-raja', 'raja', 'red'))

    const transferred = transferControlledPieces(board, 'blue', 'red')
    expect(getPieceAt(transferred, { row: 3, col: 3 })?.controlledBy).toBe('red')

    const state = createInitialGameState()
    const eliminatedState = captureRajaAndTransferArmies(
      {
        ...state,
        board: transferred,
      },
      'red',
      'blue',
    )

    expect(eliminatedState.players.blue.isEliminated).toBe(true)
    expect(eliminatedState.turnOrder.includes('blue')).toBe(false)
    expect(eliminatedState.phase).toBe('playing')
  })

  it('finishes the game when only one player remains', () => {
    const state = createInitialGameState()
    const players = {
      ...state.players,
      yellow: { ...state.players.yellow, isEliminated: true },
      green: { ...state.players.green, isEliminated: true },
    }

    const endState = captureRajaAndTransferArmies(
      {
        ...state,
        players,
        turnOrder: ['red', 'blue'] as PlayerColor[],
      },
      'red',
      'blue',
    )

    expect(endState.phase).toBe('finished')
    expect(endState.players.red.placement).toBe(1)
  })

  it('assigns all four placements when the game fully ends', () => {
    const initialState = createInitialGameState()

    const afterBlueOut = captureRajaAndTransferArmies(initialState, 'red', 'blue')
    const afterYellowOut = captureRajaAndTransferArmies(afterBlueOut, 'red', 'yellow')
    const finalState = captureRajaAndTransferArmies(afterYellowOut, 'red', 'green')

    expect(finalState.phase).toBe('finished')

    const placements = [
      finalState.players.red.placement,
      finalState.players.blue.placement,
      finalState.players.yellow.placement,
      finalState.players.green.placement,
    ]

    expect(placements.every((placement: number | null) => placement !== null)).toBe(true)
    expect(new Set(placements)).toEqual(new Set([1, 2, 3, 4]))
  })

  it('eliminates current player when only a lone raja remains', () => {
    let board = createEmptyBoard()
    board = withPiece(board, { row: 0, col: 3 }, createPiece('red-raja', 'raja', 'red'))
    board = withPiece(board, { row: 3, col: 7 }, createPiece('blue-raja', 'raja', 'blue'))
    board = withPiece(
      board,
      { row: 2, col: 7 },
      createPiece('blue-padati-1', 'padati', 'blue'),
    )
    board = withPiece(board, { row: 7, col: 4 }, createPiece('yellow-raja', 'raja', 'yellow'))
    board = withPiece(board, { row: 4, col: 0 }, createPiece('green-raja', 'raja', 'green'))

    const state = {
      ...createInitialGameState(),
      board,
      currentTurn: 'red' as const,
      turnOrder: ['red', 'blue', 'yellow', 'green'] as PlayerColor[],
    }

    const nextState = checkLoneRaja(state)

    expect(nextState.players.red.isEliminated).toBe(true)
    expect(nextState.players.red.placement).toBe(4)
    expect(getPieceAt(nextState.board, { row: 0, col: 3 })).toBeNull()
    expect(nextState.turnOrder).toEqual(['blue', 'yellow', 'green'])
    expect(nextState.currentTurn).toBe('blue')
    expect(nextState.phase).toBe('playing')
  })

  it('ends game by points after 20 moves without a capture', () => {
    const state = createInitialGameState()
    const timeoutState = checkNoCaptureTimeout({
      ...state,
      movesSinceLastCapture: 20,
      players: {
        ...state.players,
        red: { ...state.players.red, points: 6 },
        blue: { ...state.players.blue, points: 10 },
        yellow: { ...state.players.yellow, points: 3 },
        green: { ...state.players.green, points: 1 },
      },
    })

    expect(timeoutState.phase).toBe('finished')
    expect(timeoutState.players.blue.placement).toBe(1)
    expect(timeoutState.players.red.placement).toBe(2)
    expect(timeoutState.players.yellow.placement).toBe(3)
    expect(timeoutState.players.green.placement).toBe(4)
  })
})

describe('ai move selection', () => {
  it('returns only legal moves for all difficulties and for hint move', () => {
    const state = {
      ...createInitialGameState(),
      currentRoll: 5 as const,
    }

    const options = getTurnMoveOptions(
      state.board,
      state.currentTurn,
      state.currentRoll,
      state.gameMode,
    )
    const legalKeys = new Set<string>(
      [...options.rolledPieceMoves, ...options.rajaOverrideMoves].map(moveKey),
    )

    const easyMove = getBotMove(state, 'easy')
    const mediumMove = getBotMove(state, 'medium')
    const hardMove = getBotMove(state, 'hard')
    const hintMove = getHintMove(state)

    expect(easyMove).not.toBeNull()
    expect(mediumMove).not.toBeNull()
    expect(hardMove).not.toBeNull()
    expect(hintMove).not.toBeNull()

    if (!easyMove || !mediumMove || !hardMove || !hintMove) {
      throw new Error('Expected non-null moves for all bot levels and hint.')
    }

    expect(legalKeys.has(moveKey(easyMove))).toBe(true)
    expect(legalKeys.has(moveKey(mediumMove))).toBe(true)
    expect(legalKeys.has(moveKey(hardMove))).toBe(true)
    expect(legalKeys.has(moveKey(hintMove))).toBe(true)
  })

  it('never returns null on hard when legal moves exist', () => {
    const state = {
      ...createInitialGameState(),
      currentRoll: 4 as const,
    }

    const options = getTurnMoveOptions(
      state.board,
      state.currentTurn,
      state.currentRoll,
      state.gameMode,
    )
    expect(options.mustForfeit).toBe(false)

    const hardMove = getBotMove(state, 'hard')
    expect(hardMove).not.toBeNull()
  })

  it('returns null only when no legal moves are available', () => {
    const emptyBoardState = {
      ...createInitialGameState(),
      board: createEmptyBoard(),
      currentRoll: 2 as const,
    }

    const options = getTurnMoveOptions(
      emptyBoardState.board,
      emptyBoardState.currentTurn,
      emptyBoardState.currentRoll,
      emptyBoardState.gameMode,
    )
    expect(options.mustForfeit).toBe(true)

    expect(getBotMove(emptyBoardState, 'easy')).toBeNull()
    expect(getBotMove(emptyBoardState, 'medium')).toBeNull()
    expect(getBotMove(emptyBoardState, 'hard')).toBeNull()
    expect(getHintMove(emptyBoardState)).toBeNull()
  })
})
