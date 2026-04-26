import { useEffect, useRef, useState } from 'react'
import { getHintMove } from '../engine/ai'
import type { CandidateMove } from '../engine/moves'
import type { PlayerColor } from '../engine/types'
import { useGameStore } from '../store/gameStore'
import { capitalizeColor } from '../utils/format'

const ROLL_LABELS = {
  2: 'Ashva (Horse)',
  3: 'Gaja (Elephant)',
  4: 'Ratha (Chariot)',
  5: 'Padati (Foot Soldier)',
} as const

const PLAYER_ORDER: PlayerColor[] = ['red', 'blue', 'yellow', 'green']

export default function DieRoll() {
  const gameState = useGameStore((state) => state.gameState)
  const phase = useGameStore((state) => state.gameState.phase)
  const currentTurn = useGameStore((state) => state.gameState.currentTurn)
  const currentRoll = useGameStore((state) => state.gameState.currentRoll)
  const players = useGameStore((state) => state.gameState.players)
  const humanPlayer = useGameStore((state) => state.humanPlayer)
  const rollDie = useGameStore((state) => state.rollDie)
  const passTurn = useGameStore((state) => state.passTurn)
  const setHintMove = useGameStore((state) => state.setHintMove)

  const [showForfeitMessage, setShowForfeitMessage] = useState(false)
  const [localHintMove, setLocalHintMove] = useState<CandidateMove | null>(null)
  const timeoutRef = useRef<number | null>(null)

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

  const handleRollDie = (): void => {
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
  }

  const isRollDisabled =
    phase !== 'playing' || currentRoll !== null

  const showPassTurnButton = currentRoll !== null
  const showHintButton =
    phase === 'playing' && currentTurn === humanPlayer && currentRoll !== null

  const handleShowHint = (): void => {
    const hint = getHintMove(gameState)
    setLocalHintMove(hint)
    setHintMove(hint)
  }

  return (
    <aside className="rounded-xl border border-stone-600/60 bg-stone-800/70 p-4 text-stone-100 shadow-lg backdrop-blur-sm">
      <h2 className="text-lg font-semibold">Turn: {capitalizeColor(currentTurn)}</h2>

      <button
        type="button"
        onClick={handleRollDie}
        disabled={isRollDisabled}
        className="mt-3 w-full rounded-md bg-amber-600 px-4 py-2 font-semibold text-stone-950 transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        Roll Die
      </button>

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
            onClick={passTurn}
            className="mt-2 w-full rounded-md border border-stone-400/50 bg-stone-700 px-4 py-2 font-medium text-stone-100 transition hover:bg-stone-600"
          >
            Pass Turn
          </button>
          <p className="mt-1 text-center text-xs text-stone-300">
            Skip this turn — or move your Raja instead
          </p>
        </>
      ) : null}

      <div className="mt-3 min-h-6 text-sm font-medium text-amber-200">
        {currentRoll !== null
          ? `Rolled ${currentRoll}: ${ROLL_LABELS[currentRoll]}`
          : null}
      </div>

      <div className="mt-1 min-h-6 text-sm font-semibold text-rose-300">
        {showForfeitMessage ? 'No legal moves — turn forfeited' : null}
      </div>

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
