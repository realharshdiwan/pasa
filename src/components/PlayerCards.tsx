import { useEffect, useRef, useState } from 'react'
import type { Board, PlayerColor } from '../engine/types'
import { useGameStore } from '../store/gameStore'
import { PLAYER_COLORS } from '../constants/colors'
import { capitalizeColor } from '../utils/format'

function getArmyController(board: Board, color: PlayerColor): PlayerColor | null {
  for (const row of board) {
    for (const square of row) {
      if (square.piece && square.piece.color === color && square.piece.controlledBy !== color) {
        return square.piece.controlledBy
      }
    }
  }
  return null
}

const PLAYER_ORDER: PlayerColor[] = ['red', 'blue', 'yellow', 'green']

const COLOR_ACCENTS: Record<PlayerColor, { ring: string; glow: string; badge: string; text: string; bg: string }> = {
  red: {
    ring: 'border-red-500',
    glow: 'shadow-[0_0_16px_rgba(239,68,68,0.45)]',
    badge: 'bg-red-500/20 text-red-300 border-red-500/40',
    text: 'text-red-400',
    bg: 'from-red-950/40 to-stone-900',
  },
  blue: {
    ring: 'border-sky-500',
    glow: 'shadow-[0_0_16px_rgba(56,189,248,0.45)]',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    text: 'text-sky-400',
    bg: 'from-sky-950/40 to-stone-900',
  },
  yellow: {
    ring: 'border-amber-400',
    glow: 'shadow-[0_0_16px_rgba(251,191,36,0.45)]',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    text: 'text-amber-400',
    bg: 'from-amber-950/40 to-stone-900',
  },
  green: {
    ring: 'border-emerald-500',
    glow: 'shadow-[0_0_16px_rgba(52,211,153,0.45)]',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    text: 'text-emerald-400',
    bg: 'from-emerald-950/40 to-stone-900',
  },
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function PlayerCards() {
  const players = useGameStore((state) => state.gameState.players)
  const currentTurn = useGameStore((state) => state.gameState.currentTurn)
  const board = useGameStore((state) => state.gameState.board)
  const humanPlayer = useGameStore((state) => state.humanPlayer)
  const gameMode = useGameStore((state) => state.gameState.gameMode)
  const timerMode = useGameStore((state) => state.timerMode)
  const timeLeft = useGameStore((state) => state.timeLeft)

  const [lastPointsChange, setLastPointsChange] = useState<Record<PlayerColor, number>>({
    red: 0,
    blue: 0,
    yellow: 0,
    green: 0,
  })

  const prevPointsRef = useRef<Record<PlayerColor, number>>({
    red: players.red.points,
    blue: players.blue.points,
    yellow: players.yellow.points,
    green: players.green.points,
  })

  // Detect score changes for floating +N score pops
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
      const showTimer = window.setTimeout(() => {
        setLastPointsChange(changes)
      }, 0)
      const clearTimer = window.setTimeout(() => {
        setLastPointsChange({ red: 0, blue: 0, yellow: 0, green: 0 })
      }, 900)

      prevPointsRef.current = {
        red: players.red.points,
        blue: players.blue.points,
        yellow: players.yellow.points,
        green: players.green.points,
      }

      return () => {
        window.clearTimeout(showTimer)
        window.clearTimeout(clearTimer)
      }
    }

    prevPointsRef.current = {
      red: players.red.points,
      blue: players.blue.points,
      yellow: players.yellow.points,
      green: players.green.points,
    }
  }, [players])

  // Count active pieces on the board for each army
  const pieceCounts: Record<PlayerColor, number> = { red: 0, blue: 0, yellow: 0, green: 0 }
  for (const row of board) {
    for (const square of row) {
      if (square.piece) {
        pieceCounts[square.piece.color]++
      }
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
      {PLAYER_ORDER.map((color) => {
        const player = players[color]
        const isCurrentTurn = currentTurn === color
        const isHuman = humanPlayer === color
        const isEliminated = player.isEliminated
        const accent = COLOR_ACCENTS[color]
        const change = lastPointsChange[color]
        const remainingTime = timeLeft[color]

        // Check if army is inherited by someone else
        const inheritedBy = getArmyController(board, color)

        return (
          <div
            key={color}
            className={`relative flex flex-col justify-between rounded-xl border p-2.5 transition-all duration-200 ${
              isEliminated
                ? 'border-stone-800 bg-stone-900/60 opacity-60'
                : isCurrentTurn
                ? `bg-gradient-to-br ${accent.bg} ${accent.ring} ${accent.glow} scale-[1.02]`
                : 'border-stone-700/60 bg-stone-900/80 hover:border-stone-600'
            }`}
          >
            {/* Top row: Color avatar & role badge */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow"
                  style={{ backgroundColor: PLAYER_COLORS[color] }}
                >
                  {color[0].toUpperCase()}
                </span>
                <span className={`text-xs font-bold capitalize ${isEliminated ? 'text-stone-400 line-through' : 'text-stone-200'}`}>
                  {capitalizeColor(color)}
                </span>
              </div>

              {/* Badges: YOU / BOT / FALLEN */}
              {isEliminated ? (
                <span className="rounded border border-stone-700 bg-stone-800 px-1.5 py-0.5 text-[9px] font-semibold text-stone-400">
                  Fallen
                </span>
              ) : isHuman ? (
                <span className="rounded border border-amber-500/40 bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-amber-300">
                  YOU
                </span>
              ) : (
                <span className="rounded border border-stone-700/60 bg-stone-800/80 px-1.5 py-0.5 text-[9px] font-medium text-stone-400">
                  BOT
                </span>
              )}
            </div>

            {/* Army inheritance banner if captured */}
            {inheritedBy && (
              <p className="mt-1 text-[9px] font-medium text-amber-300/90 truncate">
                Crown: {capitalizeColor(inheritedBy)}
              </p>
            )}

            {/* Bottom row: Score pill & Army size */}
            <div className="mt-2 flex items-center justify-between pt-1 border-t border-stone-800/80">
              {/* Score with floating gold animation */}
              <div className="relative flex items-center gap-1">
                <span className="text-[10px] text-stone-400">PTS</span>
                <span className={`font-mono text-sm font-bold ${change > 0 ? 'score-pulse text-amber-300' : 'text-amber-400'}`}>
                  {player.points}
                </span>

                {change > 0 && (
                  <span className="score-float absolute -top-4 left-6 text-xs font-black text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    +{change}
                  </span>
                )}
              </div>

              {/* Active pieces count */}
              <div className="flex items-center gap-1 text-[10px] text-stone-400">
                <span>⚔️</span>
                <span className="font-mono">{pieceCounts[color]}</span>
              </div>
            </div>

            {/* Total timer indicator if active */}
            {timerMode === 'total' && !isEliminated && (
              <div className={`mt-1 text-right text-[10px] font-mono ${remainingTime <= 60 ? 'text-red-400 font-bold animate-pulse' : 'text-stone-400'}`}>
                ⏱ {formatTime(remainingTime)}
              </div>
            )}

            {/* 2v2 Team badge */}
            {gameMode === 'teams' && (
              <span className="absolute bottom-1 right-1 text-[8px] uppercase tracking-wider text-stone-400">
                {color === 'red' || color === 'yellow' ? 'Team 1' : 'Team 2'}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
