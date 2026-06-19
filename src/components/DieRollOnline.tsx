import { useCallback, useState } from 'react'
import type { DieFace, PlayerColor } from '../engine/types'
import { useMultiplayerStore } from '../store/multiplayerStore'
import { DIE_THEME_COLORS } from '../utils/cosmetics'
import { capitalizeColor } from '../utils/format'
import { playDieRollSound, playPassTurnSound } from '../utils/sound'

const ROLL_LABELS_SANSKRIT: Record<number, string> = {
  2: 'Ashva',
  3: 'Gaja',
  4: 'Ratha',
  5: 'Padati',
}

const ROLL_LABELS_ENGLISH: Record<number, string> = {
  2: 'Horse',
  3: 'Elephant',
  4: 'Chariot',
  5: 'Foot Soldier',
}

const DIE_FACES: DieFace[] = [2, 3, 4, 5]
const PLAYER_ORDER: PlayerColor[] = ['red', 'blue', 'yellow', 'green']
const ROLL_ANIMATION_MS = 600
const ROLL_CYCLE_MS = 100

const DIE_DOT_POSITIONS: Record<DieFace, [number, number][]> = {
  2: [[0.25, 0.25], [0.75, 0.75]],
  3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
  5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
}

function DieFaceDisplay({ face, size, theme }: { face: DieFace; size: number; theme: string }) {
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

export default function DieRollOnline() {
  const gameState = useMultiplayerStore((s) => s.gameState)
  const myColor = useMultiplayerStore((s) => s.myColor)
  const dieTheme = useMultiplayerStore((s) => s.dieTheme)
  const rollOnlineDie = useMultiplayerStore((s) => s.rollOnlineDie)
  const passOnlineTurn = useMultiplayerStore((s) => s.passOnlineTurn)

  const [isRolling, setIsRolling] = useState(false)
  const [rollingFace, setRollingFace] = useState<DieFace>(2)

  const currentTurn = gameState?.currentTurn ?? 'red'
  const currentRoll = gameState?.currentRoll ?? null
  const players = gameState?.players
  const phase = gameState?.phase ?? 'setup'
  const sanskritNames = useMultiplayerStore((s) => s.sanskritNames)

  const isMyTurn = currentTurn === myColor
  const isRollDisabled = phase !== 'playing' || currentRoll !== null || !isMyTurn

  const handleRollDie = useCallback(async () => {
    if (isRolling || isRollDisabled) return

    setIsRolling(true)
    playDieRollSound()
    let cycleCount = 0
    const maxCycles = Math.floor(ROLL_ANIMATION_MS / ROLL_CYCLE_MS)

    const intervalId = window.setInterval(() => {
      cycleCount += 1
      setRollingFace(DIE_FACES[cycleCount % DIE_FACES.length])

      if (cycleCount >= maxCycles) {
        window.clearInterval(intervalId)
        rollOnlineDie()
        setIsRolling(false)
      }
    }, ROLL_CYCLE_MS)
  }, [isRolling, isRollDisabled, rollOnlineDie])

  const handlePassTurn = useCallback(() => {
    playPassTurnSound()
    passOnlineTurn()
  }, [passOnlineTurn])

  const rollLabels = sanskritNames ? ROLL_LABELS_SANSKRIT : ROLL_LABELS_ENGLISH

  return (
    <aside className="rounded-xl border border-stone-600/60 bg-stone-800/70 p-4 text-stone-100 shadow-lg backdrop-blur-sm">
      <h2 className="text-lg font-semibold">
        Turn: {capitalizeColor(currentTurn)}
        {isMyTurn ? ' (You)' : ''}
      </h2>

      {isRolling ? (
        <div className="mt-3 flex flex-col items-center gap-2">
          <DieFaceDisplay face={rollingFace} size={64} theme={dieTheme} />
          <span className="text-sm text-amber-300">Rolling...</span>
        </div>
      ) : !isMyTurn && phase === 'playing' ? (
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

      {currentRoll !== null && isMyTurn ? (
        <>
          <button
            type="button"
            onClick={handlePassTurn}
            className="mt-2 w-full rounded-md border border-stone-400/50 bg-stone-700 px-4 py-2 font-medium text-stone-100 transition hover:bg-stone-600"
          >
            Pass Turn
          </button>
          <p className="mt-1 text-center text-xs text-stone-300">
            Skip this turn — or move your Raja instead
          </p>
        </>
      ) : null}

      {players ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-300">
            Points
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {PLAYER_ORDER.map((color: PlayerColor) => {
              const player = players[color]
              if (!player) return null
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
                    {color === myColor ? ' (You)' : ''}
                    {isEliminated ? ' ✕' : ''}
                  </span>
                  <span className="font-semibold">{player.points}</span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </aside>
  )
}
