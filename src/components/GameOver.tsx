import { useEffect, useMemo, useState } from 'react'
import { PLAYER_COLORS } from '../constants/colors'
import type { Move, Player, PlayerColor } from '../engine/types'
import { capitalizeColor } from '../utils/format'
import { playGameOverSound } from '../utils/sound'
import ReplayViewer from './ReplayViewer'

const PLAYER_ORDER = Object.keys(PLAYER_COLORS) as PlayerColor[]

const PLACEMENT_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
  4: '4th',
}

const PLACEMENT_COLORS: Record<1 | 2 | 3 | 4, string> = {
  1: 'border-yellow-300/60 bg-yellow-500/10 text-yellow-200',
  2: 'border-slate-300/60 bg-slate-300/10 text-slate-200',
  3: 'border-amber-500/60 bg-amber-600/10 text-amber-300',
  4: 'border-stone-400/60 bg-stone-600/10 text-stone-300',
}

const CONFETTI_COLORS = ['#f2c14e', '#d4a843', '#ffecb3', '#C0392B', '#2980B9', '#27AE60', '#F39C12']

function findPlayerByPlacement(
  players: Record<PlayerColor, Player>,
  placement: 1 | 2 | 3 | 4,
): { color: PlayerColor; player: Player } | null {
  for (const color of PLAYER_ORDER) {
    const player = players[color]
    if (player.placement === placement) {
      return { color, player }
    }
  }
  return null
}

function computeStats(moveHistory: Move[]) {
  const totalMoves = moveHistory.length
  const captures = moveHistory.filter((m) => m.captured !== null)
  const rajaCaptures = captures.filter((m) => m.captured?.type === 'raja')
  const pieceCaptures: Partial<Record<PlayerColor, number>> = {}

  for (const color of PLAYER_ORDER) {
    pieceCaptures[color] = captures.filter((m) => m.player === color).length
  }

  const playerWithMostCaptures = Object.entries(pieceCaptures)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))[0]

  return {
    totalMoves,
    totalCaptures: captures.length,
    rajaCaptures: rajaCaptures.length,
    topCapturer: playerWithMostCaptures?.[0] as PlayerColor | undefined,
    topCapturerCount: playerWithMostCaptures?.[1] ?? 0,
  }
}

const CONFETTI_PIECES = Array.from({ length: 30 }, (_, i) => {
  const pseudoRand1 = ((i * 9301 + 49297) % 233280) / 233280
  const pseudoRand2 = ((i * 12345 + 67891) % 233280) / 233280
  return {
    id: i,
    left: `${(i * 3.33 + pseudoRand1 * 5) % 100}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: `${(pseudoRand1 * 1.5).toFixed(2)}s`,
    duration: `${(2 + pseudoRand2 * 2).toFixed(2)}s`,
    rotation: Math.floor(pseudoRand1 * 360),
    size: Math.floor(6 + pseudoRand2 * 6),
    isRound: i % 2 === 0,
  }
})

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-30" aria-hidden="true">
      {CONFETTI_PIECES.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            borderRadius: p.isRound ? '50%' : '2px',
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  )
}

interface GameOverProps {
  players: Record<PlayerColor, Player>
  moveHistory: Move[]
  onPlayAgain: () => void
  onClose?: () => void
}

export default function GameOver({ players, moveHistory, onPlayAgain, onClose }: GameOverProps) {
  const [showReplay, setShowReplay] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const stats = useMemo(() => computeStats(moveHistory), [moveHistory])
  const winner = findPlayerByPlacement(players, 1)

  useEffect(() => {
    playGameOverSound()
  }, [])

  if (showReplay) {
    return (
      <ReplayViewer
        moves={moveHistory}
        onClose={() => setShowReplay(false)}
      />
    )
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
      {winner && <Confetti />}

      <div className="relative w-full max-w-md rounded-xl border border-stone-500/50 bg-stone-900/95 p-5 shadow-2xl">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-md p-1 text-stone-400 transition hover:bg-stone-700 hover:text-stone-200"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        <div className="text-center">
          {winner ? (
            <>
              <div className="trophy-bounce inline-block text-5xl mb-2">&#127942;</div>
              <h2 className="text-2xl font-bold text-yellow-200">
                {capitalizeColor(winner.color)} Wins!
              </h2>
            </>
          ) : (
            <h2 className="text-2xl font-bold text-stone-100">Game Over</h2>
          )}
        </div>

        <ol className="mt-4 space-y-2">
          {([1, 2, 3, 4] as const).map((placement) => {
            const entry = findPlayerByPlacement(players, placement)

            if (!entry) {
              return null
            }

            return (
              <li
                key={placement}
                className={`rounded-md border px-3 py-2 ${PLACEMENT_COLORS[placement]}`}
              >
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{PLACEMENT_LABELS[placement]}</span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: PLAYER_COLORS[entry.color] }}
                    />
                    {capitalizeColor(entry.color)}
                  </span>
                </div>
                <div className="mt-0.5 text-right text-xs font-medium">
                  {entry.player.points} pts
                </div>
              </li>
            )
          })}
        </ol>

        <button
          type="button"
          onClick={() => setShowStats(!showStats)}
          className="mt-3 w-full rounded-md border border-stone-500/40 bg-stone-800/60 px-3 py-1.5 text-xs font-medium text-stone-400 transition hover:bg-stone-700/60 hover:text-stone-200"
        >
          {showStats ? 'Hide Stats' : 'Show Stats'}
        </button>

        {showStats && (
          <div className="mt-3 rounded-lg border border-stone-600/40 bg-stone-800/50 p-3 text-xs text-stone-300 space-y-1">
            <div className="flex justify-between">
              <span>Total moves</span>
              <span className="font-semibold text-stone-100">{stats.totalMoves}</span>
            </div>
            <div className="flex justify-between">
              <span>Total captures</span>
              <span className="font-semibold text-stone-100">{stats.totalCaptures}</span>
            </div>
            <div className="flex justify-between">
              <span>Rajas captured</span>
              <span className="font-semibold text-stone-100">{stats.rajaCaptures}</span>
            </div>
            {stats.topCapturer && stats.topCapturerCount > 0 && (
              <div className="flex justify-between">
                <span>Most captures</span>
                <span className="font-semibold text-stone-100">
                  {capitalizeColor(stats.topCapturer)} ({stats.topCapturerCount})
                </span>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onPlayAgain}
          className="mt-4 w-full rounded-md bg-amber-600 px-4 py-2.5 font-semibold text-stone-950 transition hover:bg-amber-500"
        >
          Play Again
        </button>

        {moveHistory.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowReplay(true)}
            className="mt-2 w-full rounded-md border border-stone-500/50 bg-stone-700 px-4 py-2 font-medium text-stone-100 transition hover:bg-stone-600"
          >
            View Replay
          </button>
        ) : null}
      </div>
    </div>
  )
}
