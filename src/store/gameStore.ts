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
import type { BoardTheme, DieTheme, PieceTheme } from '../utils/cosmetics'

export type TimerMode = 'none' | 'per-move' | 'total'

const DEFAULT_PER_MOVE_SECONDS = 30
const DEFAULT_TOTAL_SECONDS = 360

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
  lastMove: Move | null
  selectedSquare: Position | null
  legalMovesForSelected: CandidateMove[]
  hintMove: CandidateMove | null
  botDifficulty: Difficulty
  humanPlayer: PlayerColor
  autoDieRoll: boolean
  sanskritNames: boolean
  timerMode: TimerMode
  perMoveSeconds: number
  totalSeconds: number
  timeLeft: Record<PlayerColor, number>
  moveTimeLeft: number
  boardTheme: BoardTheme
  pieceTheme: PieceTheme
  dieTheme: DieTheme
  initGame: (gameMode?: GameMode) => void
  setBotDifficulty: (difficulty: Difficulty) => void
  setHintMove: (move: CandidateMove | null) => void
  setAutoDieRoll: (enabled: boolean) => void
  setSanskritNames: (enabled: boolean) => void
  setTimerMode: (mode: TimerMode) => void
  setPerMoveSeconds: (seconds: number) => void
  setTotalSeconds: (seconds: number) => void
  setBoardTheme: (theme: BoardTheme) => void
  setPieceTheme: (theme: PieceTheme) => void
  setDieTheme: (theme: DieTheme) => void
  tickTimers: () => void
  selectSquare: (position: Position) => void
  rollDie: () => void
  passTurn: () => void
  applyMove: (move: CandidateMove) => void
  triggerBotMoveIfNeeded: () => void
  deselectSquare: () => void
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  gameState: boardEngine.createInitialGameState(),
  lastMove: null,
  selectedSquare: null,
  legalMovesForSelected: [],
  hintMove: null,
  botDifficulty: 'medium',
  humanPlayer: 'red',
  autoDieRoll: false,
  sanskritNames: true,
  timerMode: 'none',
  perMoveSeconds: DEFAULT_PER_MOVE_SECONDS,
  totalSeconds: DEFAULT_TOTAL_SECONDS,
  timeLeft: { red: DEFAULT_TOTAL_SECONDS, blue: DEFAULT_TOTAL_SECONDS, yellow: DEFAULT_TOTAL_SECONDS, green: DEFAULT_TOTAL_SECONDS },
  moveTimeLeft: DEFAULT_PER_MOVE_SECONDS,
  boardTheme: 'classic',
  pieceTheme: 'classic',
  dieTheme: 'classic',

  initGame: (gameMode: GameMode = 'freeforall'): void => {
    const state = get()
    set({
      gameState: boardEngine.createInitialGameState(gameMode),
      lastMove: null,
      selectedSquare: null,
      legalMovesForSelected: [],
      hintMove: null,
      timeLeft: {
        red: state.totalSeconds,
        blue: state.totalSeconds,
        yellow: state.totalSeconds,
        green: state.totalSeconds,
      },
      moveTimeLeft: state.perMoveSeconds,
    })
  },

  setBotDifficulty: (difficulty: Difficulty): void => {
    set({ botDifficulty: difficulty })
  },

  setHintMove: (move: CandidateMove | null): void => {
    set({ hintMove: move })
  },

  setAutoDieRoll: (enabled: boolean): void => {
    set({ autoDieRoll: enabled })
  },

  setSanskritNames: (enabled: boolean): void => {
    set({ sanskritNames: enabled })
  },

  setTimerMode: (mode: TimerMode): void => {
    set({ timerMode: mode })
  },

  setPerMoveSeconds: (seconds: number): void => {
    set({ perMoveSeconds: seconds })
  },

  setTotalSeconds: (seconds: number): void => {
    set({ totalSeconds: seconds })
  },

  setBoardTheme: (theme: BoardTheme): void => {
    set({ boardTheme: theme })
  },

  setPieceTheme: (theme: PieceTheme): void => {
    set({ pieceTheme: theme })
  },

  setDieTheme: (theme: DieTheme): void => {
    set({ dieTheme: theme })
  },

  tickTimers: (): void => {
    const { gameState, timerMode, perMoveSeconds } = get()
    if (gameState.phase !== 'playing' || timerMode === 'none') {
      return
    }

    const currentTurn = gameState.currentTurn

    if (timerMode === 'per-move') {
      const newMoveTime = get().moveTimeLeft - 1
      if (newMoveTime <= 0) {
        get().passTurn()
        set({ moveTimeLeft: perMoveSeconds })
        return
      }
      set({ moveTimeLeft: newMoveTime })
      return
    }

    if (timerMode === 'total') {
      const newTimeLeft = { ...get().timeLeft }
      newTimeLeft[currentTurn] -= 1

      if (newTimeLeft[currentTurn] <= 0) {
        const eliminated: PlayerColor[] = []
        for (const color of Object.keys(newTimeLeft) as PlayerColor[]) {
          if (newTimeLeft[color] <= 0 && !gameState.players[color].isEliminated) {
            eliminated.push(color)
          }
        }

        let nextGameState = gameState
        for (const color of eliminated) {
          nextGameState = {
            ...nextGameState,
            players: {
              ...nextGameState.players,
              [color]: { ...nextGameState.players[color], isEliminated: true },
            },
            turnOrder: nextGameState.turnOrder.filter((c: PlayerColor) => c !== color),
          }
        }

        if (nextGameState.turnOrder.length <= 1 && nextGameState.phase === 'playing') {
          nextGameState = { ...nextGameState, phase: 'finished' as const }
        }

        set({
          gameState: nextGameState,
          timeLeft: newTimeLeft,
          selectedSquare: null,
          legalMovesForSelected: [],
        })
        return
      }

      set({ timeLeft: newTimeLeft })
    }
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
      moveTimeLeft: get().perMoveSeconds,
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
      lastMove: createMoveRecord(gameState, move, gameState.currentRoll),
      selectedSquare: null,
      legalMovesForSelected: [],
      hintMove: null,
      moveTimeLeft: get().perMoveSeconds,
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
