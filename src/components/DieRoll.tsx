import { useCallback, useEffect, useRef, useState } from 'react'
import { getHintMove } from '../engine/ai'
import type { CandidateMove } from '../engine/moves'
import type { DieFace, PlayerColor } from '../engine/types'
import { useGameStore } from '../store/gameStore'
import { DIE_THEME_COLORS } from '../utils/cosmetics'
import { capitalizeColor } from '../utils/format'
import { playDieRollSound, playPassTurnSound } from '../utils/sound'

const ROLL_LABELS_SANSKRIT = {
  2: 'Ashva',
  3: 'Gaja',
  4: 'Ratha',
  5: 'Padati',
} as const

const ROLL_LABELS_ENGLISH = {
  2: 'Horse',
  3: 'Elephant',
  4: 'Chariot',
  5: 'Foot Soldier',
} as const

const DIE_FACES: DieFace[] = [2, 3, 4, 5]

const PLAYER_ORDER: PlayerColor[] = ['red', 'blue', 'yellow', 'green']

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const ROLL_ANIMATION_MS = 600
const ROLL_CYCLE_MS = 100

const DIE_DOT_POSITIONS: Record<DieFace, [number, number][]> = {
  2: [
    [0.25, 0.25],
    [0.75, 0.75],
  ],
  3: [
    [0.25, 0.25],
    [0.5, 0.5],
    [0.75, 0.75],
  ],
  4: [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.75, 0.75],
  ],
  5: [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.5, 0.5],
    [0.25, 0.75],
    [0.75, 0.75],
  ],
}

interface DieFaceProps {
  face: DieFace
  size: number
}

function DieFaceDisplay({ face, size, theme }: DieFaceProps & { theme: string }) {
  const dots = DIE_DOT_POSITIONS[face]
  const dotRadius = size * 0.1
  const padding = size * 0.15
  const colors = DIE_THEME_COLORS[theme as keyof typeof DIE_THEME_COLORS] || DIE_THEME_COLORS.classic

  return (
    <div
      className="flex items-center justify-center rounded-lg border-2"
      style={{ width: size, height: size, backgroundColor: colors.bg, borderColor: colors.border }}
    >
      <div className="relative" style={{ width: size - padding * 2, height: size - padding * 2 }}>
        {dots.map(([x, y], i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: dotRadius * 2,
              height: dotRadius * 2,
              left: `calc(${x * 100}% - ${dotRadius}px)`,
              top: `calc(${y * 100}% - ${dotRadius}px)`,
              backgroundColor: colors.dots,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function DieRoll() {
  const gameState = useGameStore((state) => state.gameState)
  const phase = useGameStore((state) => state.gameState.phase)
  const currentTurn = useGameStore((state) => state.gameState.currentTurn)
  const currentRoll = useGameStore((state) => state.gameState.currentRoll)
  const players = useGameStore((state) => state.gameState.players)
  const humanPlayer = useGameStore((state) => state.humanPlayer)
  const sanskritNames = useGameStore((state) => state.sanskritNames)
  const timerMode = useGameStore((state) => state.timerMode)
  const moveTimeLeft = useGameStore((state) => state.moveTimeLeft)
  const timeLeft = useGameStore((state) => state.timeLeft)
  const dieTheme = useGameStore((state) => state.dieTheme)
  const rollDie = useGameStore((state) => state.rollDie)
  const passTurn = useGameStore((state) => state.passTurn)
  const setHintMove = useGameStore((state) => state.setHintMove)

  const [showForfeitMessage, setShowForfeitMessage] = useState(false)
  const [localHintMove, setLocalHintMove] = useState<CandidateMove | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const [rollingFace, setRollingFace] = useState<DieFace>(2)
  const timeoutRef = useRef<number | null>(null)
  const cycleRef = useRef<number | null>(null)

  useEffect(() => {
    if (!showForfeitMessage) {
      return
    }

    timeoutRef.current = window.setTimeout(() => {
      setShowForfeitMessage(false)
    }, 1500)

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [showForfeitMessage])

  useEffect(() => {
    return () => {
      if (cycleRef.current !== null) {
        window.clearInterval(cycleRef.current)
      }
    }
  }, [])

  const handleRollDie = useCallback((): void => {
    if (isRolling) {
      return
    }

    setIsRolling(true)
    playDieRollSound()
    let cycleCount = 0
    const maxCycles = Math.floor(ROLL_ANIMATION_MS / ROLL_CYCLE_MS)

    cycleRef.current = window.setInterval(() => {
      cycleCount += 1
      setRollingFace(DIE_FACES[cycleCount % DIE_FACES.length])

      if (cycleCount >= maxCycles) {
        if (cycleRef.current !== null) {
          window.clearInterval(cycleRef.current)
          cycleRef.current = null
        }

        const previousTurn = currentTurn
        rollDie()

        const nextGameState = useGameStore.getState().gameState
        const didForfeitTurn =
          nextGameState.phase === 'playing' &&
          nextGameState.currentRoll === null &&
          nextGameState.currentTurn !== previousTurn

        if (didForfeitTurn) {
          setShowForfeitMessage(true)
        }

        setIsRolling(false)
      }
    }, ROLL_CYCLE_MS)
  }, [currentTurn, isRolling, rollDie])

  const isHumanTurn = currentTurn === humanPlayer
  const isRollDisabled = phase !== 'playing' || currentRoll !== null || !isHumanTurn
  const showPassTurnButton = currentRoll !== null && isHumanTurn
  const showHintButton = phase === 'playing' && isHumanTurn && currentRoll !== null
  const isBotTurn = phase === 'playing' && !isHumanTurn

  const handleShowHint = useCallback((): void => {
    const hint = getHintMove(gameState)
    setLocalHintMove(hint)
    setHintMove(hint)
  }, [gameState, setHintMove])

  const rollLabels = sanskritNames ? ROLL_LABELS_SANSKRIT : ROLL_LABELS_ENGLISH

  return (
    <aside className="rounded-xl border border-stone-600/60 bg-stone-800/70 p-4 text-stone-100 shadow-lg backdrop-blur-sm">
      <h2 className="text-lg font-semibold">Turn: {capitalizeColor(currentTurn)}</h2>

      {isRolling ? (
        <div className="mt-3 flex flex-col items-center gap-2">
          <DieFaceDisplay face={rollingFace} size={64} theme={dieTheme} />
          <span className="text-sm text-amber-300">Rolling...</span>
        </div>
      ) : isBotTurn ? (
        <div className="mt-3 flex flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-stone-500 bg-stone-700">
            <span className="text-lg font-bold text-stone-300">...</span>
          </div>
          <span className="text-sm text-stone-400">{capitalizeColor(currentTurn)} is thinking...</span>
        </div>
      ) : currentRoll !== null ? (
        <div className="mt-3 flex flex-col items-center gap-2">
          <DieFaceDisplay face={currentRoll} size={64} theme={dieTheme} />
          <span className="text-sm font-medium text-amber-200">
            Rolled {currentRoll}: {rollLabels[currentRoll]}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleRollDie}
          disabled={isRollDisabled}
          className="mt-3 w-full rounded-md bg-amber-600 px-4 py-3 text-lg font-semibold text-stone-950 transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Roll Die
        </button>
      )}

      {showHintButton ? (
        <button
          type="button"
          onClick={handleShowHint}
          className="mt-2 w-full rounded-md border border-blue-400/50 bg-blue-900/30 px-4 py-2 font-medium text-blue-100 transition hover:bg-blue-800/40"
        >
          {localHintMove ? 'Refresh Hint' : 'Show Hint'}
        </button>
      ) : null}

      {showPassTurnButton ? (
        <>
          <button
            type="button"
            onClick={() => { playPassTurnSound(); passTurn() }}
            className="mt-2 w-full rounded-md border border-stone-400/50 bg-stone-700 px-4 py-2 font-medium text-stone-100 transition hover:bg-stone-600"
          >
            Pass Turn
          </button>
          <p className="mt-1 text-center text-xs text-stone-300">
            Skip this turn — or move your Raja instead
          </p>
        </>
      ) : null}

      <div className="mt-1 min-h-6 text-sm font-semibold text-rose-300">
        {showForfeitMessage ? 'No legal moves — turn forfeited' : null}
      </div>

      {timerMode === 'per-move' && isHumanTurn ? (
        <div className={`mt-2 text-center text-lg font-bold ${moveTimeLeft <= 10 ? 'text-red-400' : 'text-stone-200'}`}>
          {formatTime(moveTimeLeft)}
        </div>
      ) : null}

      {timerMode === 'total' ? (
        <div className="mt-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-300">
            Time
          </h3>
          <ul className="mt-2 space-y-1 text-sm">
            {PLAYER_ORDER.map((color: PlayerColor) => {
              const remaining = timeLeft[color]
              const isLow = remaining <= 60
              return (
                <li key={color} className={`flex items-center justify-between rounded px-2 py-1 ${isLow ? 'bg-red-900/30 text-red-300' : 'bg-stone-700/70 text-stone-200'}`}>
                  <span>{capitalizeColor(color)}</span>
                  <span className="font-mono font-semibold">{formatTime(remaining)}</span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      <div className="mt-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-300">
          Points
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm">
          {PLAYER_ORDER.map((color: PlayerColor) => {
            const player = players[color]
            const isEliminated = player.isEliminated
            return (
              <li
                key={color}
                className={`flex items-center justify-between rounded px-2 py-1 ${
                  isEliminated ? 'bg-stone-700/40 text-stone-400' : 'bg-stone-700/70'
                }`}
              >
                <span>
                  {capitalizeColor(color)}
                  {isEliminated ? ' ✕' : ''}
                </span>
                <span className="font-semibold">{player.points}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
