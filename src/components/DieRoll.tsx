import { useCallback, useEffect, useRef, useState } from 'react'
import { getHintMove } from '../engine/ai'
import type { CandidateMove } from '../engine/moves'
import { useGameStore } from '../store/gameStore'
import { capitalizeColor } from '../utils/format'
import { playDieRollSound, playDieResultSound, playPassTurnSound } from '../utils/sound'
import DieFaceDisplay from './DieFaceDisplay'
import {
  DIE_FACES,
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
  const humanPlayer = useGameStore((state) => state.humanPlayer)
  const sanskritNames = useGameStore((state) => state.sanskritNames)
  const timerMode = useGameStore((state) => state.timerMode)
  const moveTimeLeft = useGameStore((state) => state.moveTimeLeft)
  const dieTheme = useGameStore((state) => state.dieTheme)
  const isRolling = useGameStore((state) => state.isRolling)
  const rollingFace = useGameStore((state) => state.rollingFace)
  const setIsRolling = useGameStore((state) => state.setIsRolling)
  const rollDie = useGameStore((state) => state.rollDie)
  const passTurn = useGameStore((state) => state.passTurn)
  const setHintMove = useGameStore((state) => state.setHintMove)

  const [showForfeitMessage, setShowForfeitMessage] = useState(false)
  const [localHintMove, setLocalHintMove] = useState<CandidateMove | null>(null)
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
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 px-4 py-3.5 text-base font-black uppercase tracking-wider text-stone-950 shadow-[0_5px_0_#92400e] transition hover:from-amber-300 hover:to-amber-500 active:translate-y-1 active:shadow-[0_1px_0_#92400e] disabled:cursor-not-allowed disabled:border-stone-700 disabled:from-stone-800 disabled:to-stone-800 disabled:text-stone-500 disabled:shadow-none"
        >
          <span className="text-xl">🎲</span>
          <span>Roll Pasa</span>
        </button>
      )}

      {/* Raja Override Reminder Pill */}
      {currentRoll !== null && isHumanTurn && (
        <div className="mt-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-center text-[11px] font-medium text-amber-200">
          👑 Raja (King) can move on <strong>any</strong> roll!
        </div>
      )}

      {showHintButton ? (
        <button
          type="button"
          onClick={handleShowHint}
          className="mt-2.5 w-full rounded-xl border border-sky-500/40 bg-sky-950/40 px-3 py-2 text-xs font-bold text-sky-200 shadow-sm transition hover:bg-sky-900/50 active:scale-95"
        >
          {localHintMove ? '💡 Refresh Tactical Hint' : '💡 Show Tactical Hint'}
        </button>
      ) : null}

      {showPassTurnButton ? (
        <div className="mt-2.5">
          <button
            type="button"
            onClick={() => { playPassTurnSound(); passTurn() }}
            className="w-full rounded-xl border border-stone-600 bg-stone-800 px-3 py-2 text-xs font-bold text-stone-200 shadow-sm transition hover:bg-stone-700 active:scale-95"
          >
            Pass Turn
          </button>
          <p className="mt-1 text-center text-[10px] text-stone-400">
            Forfeit turn if no valid piece can move
          </p>
        </div>
      ) : null}

      {showForfeitMessage && (
        <div className="mt-2 rounded-lg bg-rose-950/60 border border-rose-800/80 p-2 text-center text-xs font-bold text-rose-300 animate-pulse">
          No legal moves — turn forfeited!
        </div>
      )}

      {timerMode === 'per-move' && isHumanTurn && (
        <div className={`mt-3 text-center text-base font-extrabold ${moveTimeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-stone-300'}`}>
          ⏱ {formatTime(moveTimeLeft)}
        </div>
      )}
    </aside>
  )
}
