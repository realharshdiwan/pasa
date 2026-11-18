import { useCallback, useEffect, useRef, useState } from 'react'
import { getHintMove } from '../engine/ai'
import type { CandidateMove } from '../engine/moves'
import type { DieFace, PlayerColor } from '../engine/types'
import { useGameStore } from '../store/gameStore'
import { capitalizeColor } from '../utils/format'
import { playDieRollSound, playDieResultSound, playPassTurnSound } from '../utils/sound'
import DieFaceDisplay from './DieFaceDisplay'
import {
  DIE_FACES,
  PLAYER_ORDER,
  ROLL_LABELS_SANSKRIT,
  ROLL_LABELS_ENGLISH,
  ROLL_ANIMATION_MS,
  ROLL_CYCLE_MS,
} from './dieConstants'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
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
  const isRolling = useGameStore((state) => state.isRolling)
  const rollingFace = useGameStore((state) => state.rollingFace)
  const setIsRolling = useGameStore((state) => state.setIsRolling)
  const rollDie = useGameStore((state) => state.rollDie)
  const passTurn = useGameStore((state) => state.passTurn)
  const setHintMove = useGameStore((state) => state.setHintMove)

  const [showForfeitMessage, setShowForfeitMessage] = useState(false)
  const [localHintMove, setLocalHintMove] = useState<CandidateMove | null>(null)
  const [lastPointsChange, setLastPointsChange] = useState<Record<PlayerColor, number>>({
    red: 0, blue: 0, yellow: 0, green: 0,
  })
  const timeoutRef = useRef<number | null>(null)
  const cycleRef = useRef<number | null>(null)
  const prevPointsRef = useRef<Record<PlayerColor, number>>({
    red: 0, blue: 0, yellow: 0, green: 0,
  })

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

  useEffect(() => {
    const changes: Record<PlayerColor, number> = { red: 0, blue: 0, yellow: 0, green: 0 }
    let hasChange = false
    for (const color of PLAYER_ORDER) {
      const diff = players[color].points - prevPointsRef.current[color]
      if (diff > 0) {
        changes[color] = diff
        hasChange = true
      }
    }
    if (hasChange) {
      setLastPointsChange(changes)
      const timer = window.setTimeout(() => {
        setLastPointsChange({ red: 0, blue: 0, yellow: 0, green: 0 })
      }, 800)
      prevPointsRef.current = {
        red: players.red.points,
        blue: players.blue.points,
        yellow: players.yellow.points,
        green: players.green.points,
      }
      return () => window.clearTimeout(timer)
    }
    prevPointsRef.current = {
      red: players.red.points,
      blue: players.blue.points,
      yellow: players.yellow.points,
      green: players.green.points,
    }
  }, [players])

  const handleRollDie = useCallback((): void => {
    if (isRolling) {
      return
    }

    setIsRolling(true, 2)
    playDieRollSound()

    let cycleCount = 0
    const totalCycles = Math.floor(ROLL_ANIMATION_MS / ROLL_CYCLE_MS)
    const slowdownStart = Math.floor(totalCycles * 0.65)

    cycleRef.current = window.setInterval(() => {
      cycleCount += 1
      setIsRolling(true, DIE_FACES[cycleCount % DIE_FACES.length])

      const isSlowPhase = cycleCount >= slowdownStart
      const intervalMs = isSlowPhase ? ROLL_CYCLE_MS + 50 : ROLL_CYCLE_MS

      if (cycleCount >= totalCycles) {
        if (cycleRef.current !== null) {
          window.clearInterval(cycleRef.current)
          cycleRef.current = null
        }

        const previousTurn = currentTurn
        rollDie()

        const nextGameState = useGameStore.getState().gameState
        const rolledValue = nextGameState.currentRoll
        if (rolledValue !== null) {
          setIsRolling(false, rolledValue)
          playDieResultSound()
        } else {
          setIsRolling(false)
        }

        const didForfeitTurn =
          nextGameState.phase === 'playing' &&
          nextGameState.currentRoll === null &&
          nextGameState.currentTurn !== previousTurn

        if (didForfeitTurn) {
          setShowForfeitMessage(true)
        }
        return
      }

      if (isSlowPhase && cycleRef.current !== null) {
        window.clearInterval(cycleRef.current)
        cycleRef.current = window.setInterval(() => {
          cycleCount += 1
          setIsRolling(true, DIE_FACES[cycleCount % DIE_FACES.length])

          if (cycleCount >= totalCycles) {
            if (cycleRef.current !== null) {
              window.clearInterval(cycleRef.current)
              cycleRef.current = null
            }

            const previousTurn = currentTurn
            rollDie()

            const nextGameState = useGameStore.getState().gameState
            const rolledValue = nextGameState.currentRoll
            if (rolledValue !== null) {
              setIsRolling(false, rolledValue)
              playDieResultSound()
            } else {
              setIsRolling(false)
            }

            const didForfeitTurn =
              nextGameState.phase === 'playing' &&
              nextGameState.currentRoll === null &&
              nextGameState.currentTurn !== previousTurn

            if (didForfeitTurn) {
              setShowForfeitMessage(true)
            }
          }
        }, intervalMs)
      }
    }, ROLL_CYCLE_MS)
  }, [currentTurn, isRolling, rollDie, setIsRolling])

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
    <aside className="rounded-2xl border border-stone-700/60 bg-stone-900/80 p-4 text-stone-100 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-300">
          Battle Command
        </h2>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow-sm"
          style={{ backgroundColor: currentTurn === 'red' ? '#c0392b' : currentTurn === 'blue' ? '#2980b9' : currentTurn === 'yellow' ? '#f39c12' : '#27ae60' }}
        >
          {capitalizeColor(currentTurn)}
        </span>
      </div>

      {isRolling ? (
        <div className="mt-4 flex flex-col items-center gap-2 animate-bounce">
          <DieFaceDisplay face={rollingFace} size={64} theme={dieTheme} />
          <span className="text-sm font-bold text-amber-300">
            {isBotTurn ? `${capitalizeColor(currentTurn)} Bot is rolling...` : 'Rolling Pasa...'}
          </span>
        </div>
      ) : currentRoll !== null ? (
        <div className="mt-4 flex flex-col items-center gap-2 animate-fade-in">
          <DieFaceDisplay face={currentRoll} size={68} theme={dieTheme} />
          <span className="text-sm font-bold text-amber-300">
            {isBotTurn
              ? `${capitalizeColor(currentTurn)} rolled ${currentRoll}: ${rollLabels[currentRoll]}`
              : `Rolled ${currentRoll}: ${rollLabels[currentRoll]}`}
          </span>
          {isBotTurn && (
            <span className="text-xs text-stone-400 animate-pulse">Choosing target square...</span>
          )}
        </div>
      ) : isBotTurn ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-700 bg-stone-800/80 shadow-inner">
            <span className="text-lg font-bold text-amber-400 animate-pulse">🎲</span>
          </div>
          <span className="text-xs font-medium text-stone-400">{capitalizeColor(currentTurn)} Bot preparing roll...</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleRollDie}
          disabled={isRollDisabled}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3.5 text-base font-extrabold text-stone-950 shadow-lg hover:from-amber-400 hover:to-amber-500 active:scale-95 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          🎲 Roll Pasa
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
            const change = lastPointsChange[color]
            return (
              <li
                key={color}
                className={`relative flex items-center justify-between rounded px-2 py-1 ${
                  isEliminated ? 'bg-stone-700/40 text-stone-400' : 'bg-stone-700/70'
                }`}
              >
                <span>
                  {capitalizeColor(color)}
                  {isEliminated ? ' ✕' : ''}
                </span>
                <span className="flex items-center gap-1">
                  {change > 0 && (
                    <span className="score-float absolute right-2 -top-1 text-xs font-bold text-amber-400">
                      +{change}
                    </span>
                  )}
                  <span className={change > 0 ? 'score-pulse font-semibold' : 'font-semibold'}>
                    {player.points}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
