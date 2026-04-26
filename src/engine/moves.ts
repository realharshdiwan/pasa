import { getPieceAt, isPositionInBounds, setPieceAt } from './board'
import { getPieceTypeForDieFace } from './die'
import { arePlayersAllied, canControllerCaptureTarget } from './pieces'
import type {
  Board,
  DieFace,
  GameMode,
  Piece,
  PlayerColor,
  Position,
} from './types'

const ORTHOGONAL_DIRECTIONS: Position[] = [
  { row: 1, col: 0 },
  { row: -1, col: 0 },
  { row: 0, col: 1 },
  { row: 0, col: -1 },
]

const DIAGONAL_DIRECTIONS: Position[] = [
  { row: 1, col: 1 },
  { row: 1, col: -1 },
  { row: -1, col: 1 },
  { row: -1, col: -1 },
]

const RAJA_DIRECTIONS: Position[] = [...ORTHOGONAL_DIRECTIONS, ...DIAGONAL_DIRECTIONS]

const ASHVA_DELTAS: Position[] = [
  { row: 2, col: 1 },
  { row: 2, col: -1 },
  { row: -2, col: 1 },
  { row: -2, col: -1 },
  { row: 1, col: 2 },
  { row: 1, col: -2 },
  { row: -1, col: 2 },
  { row: -1, col: -2 },
]

const GAJA_DELTAS: Position[] = [
  { row: 2, col: 2 },
  { row: 2, col: -2 },
  { row: -2, col: 2 },
  { row: -2, col: -2 },
]

export interface CandidateMove {
  piece: Piece
  from: Position
  to: Position
  captured: Piece | null
}

export interface TurnMoveOptions {
  rolledPieceMoves: CandidateMove[]
  rajaOverrideMoves: CandidateMove[]
  mustForfeit: boolean
}

export interface AppliedMoveResult {
  board: Board
  movedPiece: Piece
  captured: Piece | null
  didPromote: boolean
}

function addDelta(position: Position, delta: Position): Position {
  return {
    row: position.row + delta.row,
    col: position.col + delta.col,
  }
}

function canEnterSquare(
  piece: Piece,
  targetPiece: Piece | null,
  gameMode: GameMode,
): boolean {
  if (!targetPiece) {
    return true
  }

  return canControllerCaptureTarget(
    piece.controlledBy,
    targetPiece.controlledBy,
    gameMode,
  )
}

function isOpponentOfController(
  sourceController: PlayerColor,
  comparedController: PlayerColor,
  gameMode: GameMode,
): boolean {
  return !arePlayersAllied(sourceController, comparedController, gameMode)
}

function getPadatiForwardDelta(color: PlayerColor): Position {
  switch (color) {
    case 'red':
      return { row: 1, col: 0 }
    case 'blue':
      return { row: 0, col: -1 }
    case 'yellow':
      return { row: -1, col: 0 }
    case 'green':
      return { row: 0, col: 1 }
  }
}

function getPadatiCaptureDeltas(color: PlayerColor): Position[] {
  switch (color) {
    case 'red':
      return [
        { row: 1, col: 1 },
        { row: 1, col: -1 },
      ]
    case 'blue':
      return [
        { row: 1, col: -1 },
        { row: -1, col: -1 },
      ]
    case 'yellow':
      return [
        { row: -1, col: 1 },
        { row: -1, col: -1 },
      ]
    case 'green':
      return [
        { row: 1, col: 1 },
        { row: -1, col: 1 },
      ]
  }
}

function isRajaMoveSafe(
  board: Board,
  piece: Piece,
  from: Position,
  to: Position,
  gameMode: GameMode,
): boolean {
  let simulatedBoard = setPieceAt(board, from, null)
  simulatedBoard = setPieceAt(simulatedBoard, to, piece)
  return !isPositionAttackedByOpponents(
    simulatedBoard,
    to,
    piece.controlledBy,
    gameMode,
  )
}

function appendSlidingMoves(
  board: Board,
  piece: Piece,
  from: Position,
  gameMode: GameMode,
  deltas: Position[],
): CandidateMove[] {
  const results: CandidateMove[] = []

  for (const delta of deltas) {
    let cursor = addDelta(from, delta)

    while (isPositionInBounds(cursor)) {
      const targetPiece = getPieceAt(board, cursor)

      if (!targetPiece) {
        results.push({
          piece,
          from: { ...from },
          to: { ...cursor },
          captured: null,
        })
        cursor = addDelta(cursor, delta)
        continue
      }

      if (canEnterSquare(piece, targetPiece, gameMode)) {
        results.push({
          piece,
          from: { ...from },
          to: { ...cursor },
          captured: targetPiece,
        })
      }

      break
    }
  }

  return results
}

function appendJumpMoves(
  board: Board,
  piece: Piece,
  from: Position,
  gameMode: GameMode,
  deltas: Position[],
): CandidateMove[] {
  const results: CandidateMove[] = []

  for (const delta of deltas) {
    const destination = addDelta(from, delta)
    if (!isPositionInBounds(destination)) {
      continue
    }

    const targetPiece = getPieceAt(board, destination)
    if (!canEnterSquare(piece, targetPiece, gameMode)) {
      continue
    }

    results.push({
      piece,
      from: { ...from },
      to: destination,
      captured: targetPiece,
    })
  }

  return results
}

function appendPadatiMoves(
  board: Board,
  piece: Piece,
  from: Position,
  gameMode: GameMode,
): CandidateMove[] {
  const results: CandidateMove[] = []
  const forward = addDelta(from, getPadatiForwardDelta(piece.color))

  if (isPositionInBounds(forward) && getPieceAt(board, forward) === null) {
    results.push({
      piece,
      from: { ...from },
      to: forward,
      captured: null,
    })
  }

  const captureDeltas = getPadatiCaptureDeltas(piece.color)
  for (const captureDelta of captureDeltas) {
    const destination = addDelta(from, captureDelta)
    if (!isPositionInBounds(destination)) {
      continue
    }

    const targetPiece = getPieceAt(board, destination)
    if (
      targetPiece &&
      canControllerCaptureTarget(piece.controlledBy, targetPiece.controlledBy, gameMode)
    ) {
      results.push({
        piece,
        from: { ...from },
        to: destination,
        captured: targetPiece,
      })
    }
  }

  return results
}

function appendRajaMoves(
  board: Board,
  piece: Piece,
  from: Position,
  gameMode: GameMode,
): CandidateMove[] {
  const results: CandidateMove[] = []

  for (const delta of RAJA_DIRECTIONS) {
    const destination = addDelta(from, delta)
    if (!isPositionInBounds(destination)) {
      continue
    }

    const targetPiece = getPieceAt(board, destination)
    if (!canEnterSquare(piece, targetPiece, gameMode)) {
      continue
    }

    if (!isRajaMoveSafe(board, piece, from, destination, gameMode)) {
      continue
    }

    results.push({
      piece,
      from: { ...from },
      to: destination,
      captured: targetPiece,
    })
  }

  return results
}

function isPathClearForRathaAttack(
  board: Board,
  from: Position,
  to: Position,
): boolean {
  if (from.row !== to.row && from.col !== to.col) {
    return false
  }

  if (from.row === to.row) {
    const step = to.col > from.col ? 1 : -1
    for (let col = from.col + step; col !== to.col; col += step) {
      if (board[from.row][col].piece) {
        return false
      }
    }
    return true
  }

  const step = to.row > from.row ? 1 : -1
  for (let row = from.row + step; row !== to.row; row += step) {
    if (board[row][from.col].piece) {
      return false
    }
  }
  return true
}

function doesPieceAttackSquare(
  board: Board,
  attacker: Piece,
  from: Position,
  target: Position,
): boolean {
  const deltaRow = target.row - from.row
  const deltaCol = target.col - from.col

  switch (attacker.type) {
    case 'raja':
      return Math.abs(deltaRow) <= 1 && Math.abs(deltaCol) <= 1 && !(deltaRow === 0 && deltaCol === 0)
    case 'ratha':
      return isPathClearForRathaAttack(board, from, target)
    case 'gaja':
      return Math.abs(deltaRow) === 2 && Math.abs(deltaCol) === 2
    case 'ashva': {
      const absRow = Math.abs(deltaRow)
      const absCol = Math.abs(deltaCol)
      return (absRow === 1 && absCol === 2) || (absRow === 2 && absCol === 1)
    }
    case 'padati': {
      const captureDeltas = getPadatiCaptureDeltas(attacker.color)
      return captureDeltas.some(
        (captureDelta: Position) =>
          from.row + captureDelta.row === target.row &&
          from.col + captureDelta.col === target.col,
      )
    }
  }
}

export function isPositionAttackedByOpponents(
  board: Board,
  position: Position,
  protectedController: PlayerColor,
  gameMode: GameMode,
): boolean {
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const attacker = board[row][col].piece
      if (!attacker) {
        continue
      }

      if (
        !isOpponentOfController(
          protectedController,
          attacker.controlledBy,
          gameMode,
        )
      ) {
        continue
      }

      if (doesPieceAttackSquare(board, attacker, { row, col }, position)) {
        return true
      }
    }
  }

  return false
}

export function getLegalMovesForPiece(
  board: Board,
  from: Position,
  currentPlayer: PlayerColor,
  gameMode: GameMode,
): CandidateMove[] {
  const piece = getPieceAt(board, from)
  if (!piece || piece.controlledBy !== currentPlayer) {
    return []
  }

  switch (piece.type) {
    case 'raja':
      return appendRajaMoves(board, piece, from, gameMode)
    case 'ratha':
      return appendSlidingMoves(board, piece, from, gameMode, ORTHOGONAL_DIRECTIONS)
    case 'gaja':
      return appendJumpMoves(board, piece, from, gameMode, GAJA_DELTAS)
    case 'ashva':
      return appendJumpMoves(board, piece, from, gameMode, ASHVA_DELTAS)
    case 'padati':
      return appendPadatiMoves(board, piece, from, gameMode)
  }
}

function collectPlayerMoves(
  board: Board,
  player: PlayerColor,
  gameMode: GameMode,
  pieceType: Piece['type'],
): CandidateMove[] {
  const results: CandidateMove[] = []

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const piece = board[row][col].piece
      if (!piece || piece.controlledBy !== player || piece.type !== pieceType) {
        continue
      }

      results.push(
        ...getLegalMovesForPiece(board, { row, col }, player, gameMode),
      )
    }
  }

  return results
}

export function getLegalMovesForRoll(
  board: Board,
  player: PlayerColor,
  dieFace: DieFace,
  gameMode: GameMode,
): CandidateMove[] {
  const requiredPieceType = getPieceTypeForDieFace(dieFace)
  return collectPlayerMoves(board, player, gameMode, requiredPieceType)
}

export function getLegalRajaOverrideMoves(
  board: Board,
  player: PlayerColor,
  gameMode: GameMode,
): CandidateMove[] {
  return collectPlayerMoves(board, player, gameMode, 'raja')
}

export function getTurnMoveOptions(
  board: Board,
  player: PlayerColor,
  dieFace: DieFace,
  gameMode: GameMode,
): TurnMoveOptions {
  const rolledPieceMoves = getLegalMovesForRoll(board, player, dieFace, gameMode)
  const rajaOverrideMoves = getLegalRajaOverrideMoves(board, player, gameMode)

  return {
    rolledPieceMoves,
    rajaOverrideMoves,
    mustForfeit: rolledPieceMoves.length === 0 && rajaOverrideMoves.length === 0,
  }
}

function shouldPromotePadati(piece: Piece, to: Position): boolean {
  if (piece.type !== 'padati') {
    return false
  }

  switch (piece.color) {
    case 'red':
      return to.row === 7
    case 'blue':
      return to.col === 0
    case 'yellow':
      return to.row === 0
    case 'green':
      return to.col === 7
  }
}

export function applyMoveToBoard(
  board: Board,
  move: CandidateMove,
): AppliedMoveResult {
  const movingPiece = getPieceAt(board, move.from)
  if (!movingPiece) {
    throw new Error(
      `Cannot apply move: no piece found at row=${move.from.row}, col=${move.from.col}.`,
    )
  }

  const captured = getPieceAt(board, move.to)

  let nextBoard = setPieceAt(board, move.from, null)

  const promotedPiece: Piece = shouldPromotePadati(movingPiece, move.to)
    ? { ...movingPiece, type: 'ratha' }
    : { ...movingPiece }

  nextBoard = setPieceAt(nextBoard, move.to, promotedPiece)

  return {
    board: nextBoard,
    movedPiece: promotedPiece,
    captured,
    didPromote: promotedPiece.type !== movingPiece.type,
  }
}
