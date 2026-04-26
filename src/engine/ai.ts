import { getPieceAt } from './board'
import { captureRajaAndTransferArmies } from './elimination'
import {
  applyMoveToBoard,
  getTurnMoveOptions,
} from './moves'
import type { CandidateMove } from './moves'
import { getCapturePointsForPiece } from './pieces'
import { awardCapturePoints } from './scoring'
import type { DieFace, GameState, Piece, PlayerColor, Position } from './types'

export type Difficulty = 'easy' | 'medium' | 'hard'

const DIE_FACES: DieFace[] = [2, 3, 4, 5]
const PLAYER_COLORS: PlayerColor[] = ['red', 'blue', 'yellow', 'green']
const HARD_MAX_OPPONENT_RESPONSES = 8

interface SimulatedOutcome {
  nextState: GameState
  immediateCapturePoints: number
  capturedRaja: boolean
  armyInheritanceValue: number
}

interface MoveEvaluation {
  move: CandidateMove
  score: number
}

interface EvalContext {
  immediateCapturePoints: number
  capturedRaja: boolean
  armyInheritanceValue: number
}

export function getBotMove(
  gameState: GameState,
  difficulty: Difficulty,
): CandidateMove | null {
  const legalMoves = getAllLegalTurnMoves(gameState)
  if (legalMoves.length === 0) {
    return null
  }

  switch (difficulty) {
    case 'easy':
      return pickEasyMove(gameState, legalMoves)
    case 'medium':
      return pickMediumMove(gameState, legalMoves)
    case 'hard':
      return pickHardMove(gameState, legalMoves)
  }
}

export function getHintMove(gameState: GameState): CandidateMove | null {
  const legalMoves = getAllLegalTurnMoves(gameState)
  if (legalMoves.length === 0) {
    return null
  }

  return pickHardMove(gameState, legalMoves)
}

function getAllLegalTurnMoves(gameState: GameState): CandidateMove[] {
  if (gameState.phase !== 'playing' || gameState.currentRoll === null) {
    return []
  }

  const options = getTurnMoveOptions(
    gameState.board,
    gameState.currentTurn,
    gameState.currentRoll,
    gameState.gameMode,
  )

  return [...options.rolledPieceMoves, ...options.rajaOverrideMoves]
}

function pickEasyMove(
  gameState: GameState,
  legalMoves: CandidateMove[],
): CandidateMove {
  const perspective = gameState.currentTurn
  const scoredMoves = legalMoves.map((move: CandidateMove) =>
    evaluateMove(gameState, move, perspective),
  )

  scoredMoves.sort((left: MoveEvaluation, right: MoveEvaluation) => right.score - left.score)

  const topPoolSize = Math.min(3, scoredMoves.length)
  const topIndex = Math.floor(Math.random() * topPoolSize)
  return scoredMoves[topIndex].move
}

function pickMediumMove(
  gameState: GameState,
  legalMoves: CandidateMove[],
): CandidateMove {
  const perspective = gameState.currentTurn
  const scoredMoves = legalMoves.map((move: CandidateMove) => {
    const evaluated = evaluateMove(gameState, move, perspective)
    const outcome = simulateMove(gameState, move)
    const threatPenalty = estimateRajaThreatPenalty(outcome.nextState, perspective)

    return {
      move,
      score: evaluated.score - threatPenalty,
    }
  })

  scoredMoves.sort((left: MoveEvaluation, right: MoveEvaluation) => right.score - left.score)
  return scoredMoves[0].move
}

function pickHardMove(
  gameState: GameState,
  legalMoves: CandidateMove[],
): CandidateMove {
  const perspective = gameState.currentTurn
  const orderedMoves = legalMoves
    .map((move: CandidateMove) => evaluateMove(gameState, move, perspective))
    .sort((left: MoveEvaluation, right: MoveEvaluation) => right.score - left.score)

  let bestMove: CandidateMove = orderedMoves[0].move
  let bestScore = Number.NEGATIVE_INFINITY

  for (const candidate of orderedMoves) {
    const outcome = simulateMove(gameState, candidate.move)
    const ownContext: EvalContext = {
      immediateCapturePoints: outcome.immediateCapturePoints,
      capturedRaja: outcome.capturedRaja,
      armyInheritanceValue: outcome.armyInheritanceValue,
    }

    const immediateScore = evaluateState(outcome.nextState, perspective, ownContext)
    const responseScore = evaluateBestOpponentResponseForSelfishPlay(
      outcome.nextState,
      perspective,
    )
    const combinedScore = immediateScore * 0.55 + responseScore * 0.45

    if (combinedScore > bestScore) {
      bestScore = combinedScore
      bestMove = candidate.move
    }
  }

  return bestMove
}

function evaluateBestOpponentResponseForSelfishPlay(
  stateAfterOurMove: GameState,
  ourPerspective: PlayerColor,
): number {
  if (stateAfterOurMove.phase !== 'playing') {
    return evaluateState(stateAfterOurMove, ourPerspective)
  }

  const opponent = stateAfterOurMove.currentTurn
  const opponentMoveCandidates = getResponseCandidatesForAllRolls(stateAfterOurMove)

  if (opponentMoveCandidates.length === 0) {
    return evaluateState(stateAfterOurMove, ourPerspective)
  }

  let bestOpponentUtility = Number.NEGATIVE_INFINITY
  let ourScoreAtBestOpponentUtility = Number.NEGATIVE_INFINITY

  for (const responseMove of opponentMoveCandidates) {
    const outcome = simulateMove(stateAfterOurMove, responseMove)
    const responseContext: EvalContext = {
      immediateCapturePoints: outcome.immediateCapturePoints,
      capturedRaja: outcome.capturedRaja,
      armyInheritanceValue: outcome.armyInheritanceValue,
    }
    const opponentUtility = evaluateState(outcome.nextState, opponent, responseContext)

    if (opponentUtility > bestOpponentUtility) {
      bestOpponentUtility = opponentUtility
      ourScoreAtBestOpponentUtility = evaluateState(
        outcome.nextState,
        ourPerspective,
        responseContext,
      )
    }
  }

  return ourScoreAtBestOpponentUtility
}

function getResponseCandidatesForAllRolls(state: GameState): CandidateMove[] {
  const deduped = new Map<string, CandidateMove>()

  for (const dieFace of DIE_FACES) {
    const options = getTurnMoveOptions(
      state.board,
      state.currentTurn,
      dieFace,
      state.gameMode,
    )

    for (const move of [...options.rolledPieceMoves, ...options.rajaOverrideMoves]) {
      deduped.set(getMoveKey(move), move)
    }
  }

  const candidates = [...deduped.values()]

  const preScored = candidates
    .map((move: CandidateMove) => ({
      move,
      score: quickCaptureScore(move),
    }))
    .sort((left: MoveEvaluation, right: MoveEvaluation) => right.score - left.score)

  return preScored
    .slice(0, HARD_MAX_OPPONENT_RESPONSES)
    .map((entry: MoveEvaluation) => entry.move)
}

function quickCaptureScore(move: CandidateMove): number {
  const capturePoints = move.captured ? getCapturePointsForPiece(move.captured.type) : 0
  const rajaBonus = move.captured?.type === 'raja' ? 1000 : 0
  return capturePoints + rajaBonus
}

function evaluateMove(
  gameState: GameState,
  move: CandidateMove,
  perspective: PlayerColor,
): MoveEvaluation {
  const outcome = simulateMove(gameState, move)
  const context: EvalContext = {
    immediateCapturePoints: outcome.immediateCapturePoints,
    capturedRaja: outcome.capturedRaja,
    armyInheritanceValue: outcome.armyInheritanceValue,
  }

  return {
    move,
    score: evaluateState(outcome.nextState, perspective, context),
  }
}

function simulateMove(gameState: GameState, move: CandidateMove): SimulatedOutcome {
  const appliedMove = applyMoveToBoard(gameState.board, move)
  const immediateCapturePoints = appliedMove.captured
    ? getCapturePointsForPiece(appliedMove.captured.type)
    : 0

  const playersAfterCapture = awardCapturePoints(
    gameState.players,
    gameState.currentTurn,
    appliedMove.captured,
  )

  let nextState: GameState = {
    ...gameState,
    board: appliedMove.board,
    players: playersAfterCapture,
    currentRoll: null,
  }

  let armyInheritanceValue = 0
  let capturedRaja = false

  if (appliedMove.captured?.type === 'raja') {
    capturedRaja = true
    const eliminatedPlayer = appliedMove.captured.controlledBy
    armyInheritanceValue = estimateArmyInheritanceValue(
      appliedMove.board,
      eliminatedPlayer,
    )

    nextState = captureRajaAndTransferArmies(
      nextState,
      gameState.currentTurn,
      eliminatedPlayer,
    )
  }

  if (nextState.phase === 'playing') {
    nextState = {
      ...nextState,
      currentTurn: getNextTurn(nextState.turnOrder, nextState.currentTurn),
    }
  }

  return {
    nextState,
    immediateCapturePoints,
    capturedRaja,
    armyInheritanceValue,
  }
}

function getNextTurn(
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

function evaluateState(
  gameState: GameState,
  perspective: PlayerColor,
  context: EvalContext = {
    immediateCapturePoints: 0,
    capturedRaja: false,
    armyInheritanceValue: 0,
  },
): number {
  if (gameState.players[perspective].isEliminated) {
    return -100_000
  }

  if (gameState.phase === 'finished') {
    const placement = gameState.players[perspective].placement
    if (placement === 1) {
      return 100_000
    }

    return -10_000 * (placement ?? 4)
  }

  const ownPoints = gameState.players[perspective].points
  const highestOpponentPoints = Math.max(
    ...PLAYER_COLORS.filter((color: PlayerColor) => color !== perspective).map(
      (color: PlayerColor) => gameState.players[color].points,
    ),
  )

  const ownMaterial = getControlledArmyValue(gameState.board, perspective)
  const highestOpponentMaterial = Math.max(
    ...PLAYER_COLORS.filter((color: PlayerColor) => color !== perspective).map(
      (color: PlayerColor) => getControlledArmyValue(gameState.board, color),
    ),
  )

  const mobility = estimateMobility(gameState, perspective)
  const rajaSafety = evaluateRajaSafety(gameState, perspective)

  let score = 0
  score += (ownPoints - highestOpponentPoints) * 18
  score += ownMaterial * 10
  score -= highestOpponentMaterial * 7
  score += mobility * 2
  score += rajaSafety
  score += context.immediateCapturePoints * 26

  if (context.capturedRaja) {
    score += 1_400
    score += context.armyInheritanceValue * 95
  }

  return score
}

function estimateRajaThreatPenalty(
  gameState: GameState,
  perspective: PlayerColor,
): number {
  if (gameState.phase !== 'playing') {
    return 0
  }

  const rajaPosition = findRajaPosition(gameState.board, perspective)
  if (!rajaPosition) {
    return 10_000
  }

  const nextPlayer = gameState.currentTurn
  for (const dieFace of DIE_FACES) {
    const options = getTurnMoveOptions(
      gameState.board,
      nextPlayer,
      dieFace,
      gameState.gameMode,
    )

    for (const move of [...options.rolledPieceMoves, ...options.rajaOverrideMoves]) {
      if (move.to.row === rajaPosition.row && move.to.col === rajaPosition.col) {
        return 600
      }
    }
  }

  return 0
}

function evaluateRajaSafety(gameState: GameState, perspective: PlayerColor): number {
  const rajaPosition = findRajaPosition(gameState.board, perspective)
  if (!rajaPosition) {
    return -20_000
  }

  for (const opponent of PLAYER_COLORS) {
    if (opponent === perspective || gameState.players[opponent].isEliminated) {
      continue
    }

    for (const dieFace of DIE_FACES) {
      const options = getTurnMoveOptions(
        gameState.board,
        opponent,
        dieFace,
        gameState.gameMode,
      )

      for (const move of [...options.rolledPieceMoves, ...options.rajaOverrideMoves]) {
        if (move.to.row === rajaPosition.row && move.to.col === rajaPosition.col) {
          return -350
        }
      }
    }
  }

  return 60
}

function estimateMobility(gameState: GameState, perspective: PlayerColor): number {
  let totalMoves = 0

  for (const dieFace of DIE_FACES) {
    const options = getTurnMoveOptions(
      gameState.board,
      perspective,
      dieFace,
      gameState.gameMode,
    )
    totalMoves += options.rolledPieceMoves.length + options.rajaOverrideMoves.length
  }

  return totalMoves / DIE_FACES.length
}

function getControlledArmyValue(
  board: GameState['board'],
  controller: PlayerColor,
): number {
  let total = 0

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const piece = board[row][col].piece
      if (!piece || piece.controlledBy !== controller) {
        continue
      }

      total += getPieceStaticValue(piece)
    }
  }

  return total
}

function getPieceStaticValue(piece: Piece): number {
  if (piece.type === 'raja') {
    return 20
  }

  return getCapturePointsForPiece(piece.type)
}

function estimateArmyInheritanceValue(
  board: GameState['board'],
  eliminatedController: PlayerColor,
): number {
  let total = 0

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const piece = board[row][col].piece
      if (!piece || piece.controlledBy !== eliminatedController) {
        continue
      }

      total += getCapturePointsForPiece(piece.type)
    }
  }

  return total
}

function findRajaPosition(
  board: GameState['board'],
  controller: PlayerColor,
): Position | null {
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const piece = getPieceAt(board, { row, col })
      if (piece && piece.controlledBy === controller && piece.type === 'raja') {
        return { row, col }
      }
    }
  }

  return null
}

function getMoveKey(move: CandidateMove): string {
  return `${move.piece.id}:${move.from.row},${move.from.col}->${move.to.row},${move.to.col}`
}
