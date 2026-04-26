import { createPiece } from './pieces'
import type {
  Board,
  GameMode,
  GameState,
  Piece,
  Player,
  PlayerColor,
  Position,
  Square,
} from './types'

export const BOARD_SIZE = 8

const TURN_ORDER: PlayerColor[] = ['red', 'blue', 'yellow', 'green']
const BACK_RANK_ORDER = ['ratha', 'ashva', 'gaja', 'raja'] as const

export interface PositionedPiece {
  piece: Piece
  position: Position
}

export function isPositionInBounds(position: Position): boolean {
  return (
    Number.isInteger(position.row) &&
    Number.isInteger(position.col) &&
    position.row >= 0 &&
    position.row < BOARD_SIZE &&
    position.col >= 0 &&
    position.col < BOARD_SIZE
  )
}

export function createEmptyBoard(): Board {
  const board: Board = []

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    const boardRow: Square[] = []

    for (let col = 0; col < BOARD_SIZE; col += 1) {
      boardRow.push({
        position: { row, col },
        piece: null,
      })
    }

    board.push(boardRow)
  }

  return board
}

export function cloneBoard(board: Board): Board {
  return board.map((row: Square[]) =>
    row.map((square: Square) => ({
      position: { ...square.position },
      piece: square.piece ? { ...square.piece } : null,
    })),
  )
}

export function getSquareAt(board: Board, position: Position): Square | null {
  if (!isPositionInBounds(position)) {
    return null
  }

  return board[position.row][position.col]
}

export function getPieceAt(board: Board, position: Position): Piece | null {
  const square = getSquareAt(board, position)
  return square?.piece ?? null
}

export function setPieceAt(
  board: Board,
  position: Position,
  piece: Piece | null,
): Board {
  if (!isPositionInBounds(position)) {
    throw new Error(
      `Cannot set piece outside board bounds at row=${position.row}, col=${position.col}.`,
    )
  }

  const nextBoard = cloneBoard(board)
  nextBoard[position.row][position.col].piece = piece ? { ...piece } : null
  return nextBoard
}

export function findControlledPieces(
  board: Board,
  controlledBy: PlayerColor,
): PositionedPiece[] {
  const results: PositionedPiece[] = []

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const piece = board[row][col].piece
      if (piece && piece.controlledBy === controlledBy) {
        results.push({
          piece: { ...piece },
          position: { row, col },
        })
      }
    }
  }

  return results
}

export function findPiecePositionById(
  board: Board,
  pieceId: string,
): Position | null {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col].piece?.id === pieceId) {
        return { row, col }
      }
    }
  }

  return null
}

function placeInitialPiece(
  board: Board,
  color: PlayerColor,
  type: 'raja' | 'ratha' | 'gaja' | 'ashva' | 'padati',
  row: number,
  col: number,
  index?: number,
): void {
  const id =
    type === 'padati' && typeof index === 'number'
      ? `${color}-${type}-${index}`
      : `${color}-${type}`

  board[row][col].piece = createPiece(id, type, color)
}

function placeInitialBackRankPieces(board: Board): void {
  for (let col = 0; col < BACK_RANK_ORDER.length; col += 1) {
    placeInitialPiece(board, 'red', BACK_RANK_ORDER[col], 0, col)
  }

  for (let row = 0; row < BACK_RANK_ORDER.length; row += 1) {
    placeInitialPiece(board, 'blue', BACK_RANK_ORDER[row], row, 7)
  }

  for (let offset = 0; offset < BACK_RANK_ORDER.length; offset += 1) {
    placeInitialPiece(board, 'yellow', BACK_RANK_ORDER[offset], 7, 7 - offset)
  }

  for (let offset = 0; offset < BACK_RANK_ORDER.length; offset += 1) {
    placeInitialPiece(board, 'green', BACK_RANK_ORDER[offset], 7 - offset, 0)
  }
}

function placeInitialPawns(board: Board): void {
  for (let col = 0; col < 4; col += 1) {
    placeInitialPiece(board, 'red', 'padati', 1, col, col + 1)
  }

  for (let row = 0; row < 4; row += 1) {
    placeInitialPiece(board, 'blue', 'padati', row, 6, row + 1)
  }

  for (let offset = 0; offset < 4; offset += 1) {
    placeInitialPiece(board, 'yellow', 'padati', 6, 7 - offset, offset + 1)
  }

  for (let offset = 0; offset < 4; offset += 1) {
    placeInitialPiece(board, 'green', 'padati', 7 - offset, 1, offset + 1)
  }
}

export function createInitialBoard(): Board {
  const board = createEmptyBoard()
  placeInitialBackRankPieces(board)
  placeInitialPawns(board)
  return board
}

export function createInitialPlayers(): Record<PlayerColor, Player> {
  return {
    red: { color: 'red', isEliminated: false, points: 0, placement: null },
    blue: { color: 'blue', isEliminated: false, points: 0, placement: null },
    yellow: { color: 'yellow', isEliminated: false, points: 0, placement: null },
    green: { color: 'green', isEliminated: false, points: 0, placement: null },
  }
}

export function createInitialGameState(gameMode: GameMode = 'freeforall'): GameState {
  return {
    board: createInitialBoard(),
    players: createInitialPlayers(),
    currentTurn: 'red',
    currentRoll: null,
    movesSinceLastCapture: 0,
    turnOrder: [...TURN_ORDER],
    gameMode,
    phase: 'playing',
    moveHistory: [],
    placementCounter: 4,
  }
}
