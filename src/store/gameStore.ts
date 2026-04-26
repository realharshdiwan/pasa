import { create } from 'zustand'
import { getBotMove } from '../engine/ai'
import type { Difficulty } from '../engine/ai'
import * as boardEngine from '../engine/board'
import * as dieEngine from '../engine/die'
import * as eliminationEngine from '../engine/elimination'
import * as movesEngine from '../engine/moves'
import * as scoringEngine from '../engine/scoring'
import type { CandidateMove } from '../engine/moves'
import type {
  GameMode,
  GameState,
  Move,
  PlayerColor,
  Position,
} from '../engine/types'

function arePositionsEqual(left: Position, right: Position): boolean {
  return left.row === right.row && left.col === right.col
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

function createMoveRecord(
  gameState: GameState,
  move: CandidateMove,
  roll: Move['roll'],
): Move {
  return {
    player: gameState.currentTurn,
    piece: move.piece,
    from: move.from,
    to: move.to,
    captured: move.captured,
    roll,
    usedRajaOverride: move.piece.type === 'raja',
  }
}

export interface GameStoreState {
  gameState: GameState
  selectedSquare: Position | null
  legalMovesForSelected: CandidateMove[]
  hintMove: CandidateMove | null
  botDifficulty: Difficulty
  humanPlayer: PlayerColor
  initGame: (gameMode?: GameMode) => void
  setBotDifficulty: (difficulty: Difficulty) => void
  setHintMove: (move: CandidateMove | null) => void
  selectSquare: (position: Position) => void
  rollDie: () => void
  passTurn: () => void
  applyMove: (move: CandidateMove) => void
  triggerBotMoveIfNeeded: () => void
  deselectSquare: () => void
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  gameState: boardEngine.createInitialGameState(),
  selectedSquare: null,
  legalMovesForSelected: [],
  hintMove: null,
  botDifficulty: 'medium',
  humanPlayer: 'red',

  initGame: (gameMode: GameMode = 'freeforall'): void => {
    set({
      gameState: boardEngine.createInitialGameState(gameMode),
      selectedSquare: null,
      legalMovesForSelected: [],
      hintMove: null,
    })
  },

  setBotDifficulty: (difficulty: Difficulty): void => {
    set({ botDifficulty: difficulty })
  },

  setHintMove: (move: CandidateMove | null): void => {
    set({ hintMove: move })
  },

  selectSquare: (position: Position): void => {
    const { gameState } = get()
    const selectedPiece = boardEngine.getPieceAt(gameState.board, position)

    if (
      !selectedPiece ||
      selectedPiece.controlledBy !== gameState.currentTurn ||
      gameState.currentRoll === null
    ) {
      set({
        selectedSquare: selectedPiece ? position : null,
        legalMovesForSelected: [],
      })
      return
    }

    const rolledPieceMoves = movesEngine.getLegalMovesForRoll(
      gameState.board,
      gameState.currentTurn,
      gameState.currentRoll,
      gameState.gameMode,
    )
    const rajaOverrideMoves = movesEngine.getLegalRajaOverrideMoves(
      gameState.board,
      gameState.currentTurn,
      gameState.gameMode,
    )

    const candidateMoves =
      selectedPiece.type === 'raja' ? rajaOverrideMoves : rolledPieceMoves

    set({
      selectedSquare: position,
      legalMovesForSelected: candidateMoves.filter((candidate: CandidateMove) =>
        arePositionsEqual(candidate.from, position),
      ),
    })
  },

  rollDie: (): void => {
    const { gameState } = get()
    if (gameState.phase !== 'playing') {
      return
    }

    let preparedState = gameState
    while (preparedState.phase === 'playing') {
      const nextState = eliminationEngine.checkLoneRaja(preparedState)
      if (nextState === preparedState) {
        break
      }
      preparedState = nextState
    }

    preparedState = eliminationEngine.checkNoCaptureTimeout(preparedState)

    if (preparedState !== gameState) {
      set({
        gameState: preparedState,
        selectedSquare: null,
        legalMovesForSelected: [],
      })
    }

    if (preparedState.phase !== 'playing') {
      return
    }

    const roll = dieEngine.rollDie()
    const tentativeState: GameState = { ...preparedState, currentRoll: roll }
    const moveOptions = movesEngine.getTurnMoveOptions(
      tentativeState.board,
      tentativeState.currentTurn,
      roll,
      tentativeState.gameMode,
    )

    if (moveOptions.mustForfeit) {
      set({
        gameState: {
          ...tentativeState,
          currentRoll: null,
          currentTurn: getNextTurn(
            tentativeState.turnOrder,
            tentativeState.currentTurn,
          ),
        },
        selectedSquare: null,
        legalMovesForSelected: [],
      })
      return
    }

    set({
      gameState: tentativeState,
      selectedSquare: null,
      legalMovesForSelected: [],
    })
  },

  passTurn: (): void => {
    const { gameState } = get()
    if (gameState.phase !== 'playing' || gameState.currentRoll === null) {
      return
    }

    set({
      gameState: {
        ...gameState,
        currentTurn: getNextTurn(gameState.turnOrder, gameState.currentTurn),
        currentRoll: null,
      },
      selectedSquare: null,
      legalMovesForSelected: [],
    })
  },

  applyMove: (move: CandidateMove): void => {
    const { gameState, legalMovesForSelected } = get()
    if (gameState.phase !== 'playing' || gameState.currentRoll === null) {
      return
    }

    const fallbackLegalMoves =
      legalMovesForSelected.length > 0
        ? legalMovesForSelected
        : [
            ...movesEngine.getLegalMovesForRoll(
              gameState.board,
              gameState.currentTurn,
              gameState.currentRoll,
              gameState.gameMode,
            ),
            ...movesEngine.getLegalRajaOverrideMoves(
              gameState.board,
              gameState.currentTurn,
              gameState.gameMode,
            ),
          ]

    const isMoveCurrentlyLegal = fallbackLegalMoves.some(
      (legalMove: CandidateMove) =>
        legalMove.piece.id === move.piece.id &&
        arePositionsEqual(legalMove.from, move.from) &&
        arePositionsEqual(legalMove.to, move.to),
    )
    if (!isMoveCurrentlyLegal) {
      return
    }

    const appliedMove = movesEngine.applyMoveToBoard(gameState.board, move)
    const playersAfterCapture = scoringEngine.awardCapturePoints(
      gameState.players,
      gameState.currentTurn,
      appliedMove.captured,
    )

    let nextGameState: GameState = {
      ...gameState,
      board: appliedMove.board,
      players: playersAfterCapture,
      currentRoll: null,
      movesSinceLastCapture: appliedMove.captured
        ? 0
        : gameState.movesSinceLastCapture + 1,
      moveHistory: [
        ...gameState.moveHistory,
        createMoveRecord(gameState, move, gameState.currentRoll),
      ],
    }

    if (appliedMove.captured?.type === 'raja') {
      nextGameState = eliminationEngine.captureRajaAndTransferArmies(
        nextGameState,
        gameState.currentTurn,
        appliedMove.captured.controlledBy,
      )
    }

    if (nextGameState.phase === 'playing') {
      nextGameState = {
        ...nextGameState,
        currentTurn: getNextTurn(
          nextGameState.turnOrder,
          nextGameState.currentTurn,
        ),
      }
    }

    nextGameState = eliminationEngine.checkNoCaptureTimeout(nextGameState)

    set({
      gameState: nextGameState,
      selectedSquare: null,
      legalMovesForSelected: [],
      hintMove: null,
    })
  },

  triggerBotMoveIfNeeded: (): void => {
    const { gameState, humanPlayer, botDifficulty } = get()
    if (gameState.phase !== 'playing' || gameState.currentTurn === humanPlayer) {
      return
    }

    let workingState = gameState
    if (workingState.currentRoll === null) {
      get().rollDie()
      workingState = get().gameState
    }

    if (
      workingState.phase !== 'playing' ||
      workingState.currentTurn === humanPlayer ||
      workingState.currentRoll === null
    ) {
      return
    }

    const botMove = getBotMove(workingState, botDifficulty)
    if (botMove) {
      get().applyMove(botMove)
      return
    }

    get().passTurn()
  },

  deselectSquare: (): void => {
    set({
      selectedSquare: null,
      legalMovesForSelected: [],
    })
  },
}))
