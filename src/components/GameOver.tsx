import { PLAYER_COLORS } from '../constants/colors'
import type { Player, PlayerColor } from '../engine/types'
import { capitalizeColor } from '../utils/format'

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

interface GameOverProps {
  players: Record<PlayerColor, Player>
  onPlayAgain: () => void
}

export default function GameOver({ players, onPlayAgain }: GameOverProps) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-stone-500/50 bg-stone-900/95 p-5 shadow-2xl">
        <h2 className="text-center text-2xl font-bold text-stone-100">Game Over</h2>

        <ol className="mt-4 space-y-2">
          {([1, 2, 3, 4] as const).map((placement) => {
            const entry = findPlayerByPlacement(players, placement)

            if (!entry) {
              return (
                <li
                  key={placement}
                  className={`rounded-md border px-3 py-2 ${PLACEMENT_COLORS[placement]}`}
                >
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>{PLACEMENT_LABELS[placement]}</span>
                    <span>Unassigned</span>
                  </div>
                  <div className="mt-0.5 text-right text-xs font-medium">0 pts</div>
                </li>
              )
            }

            return (
              <li
                key={placement}
                className={`rounded-md border px-3 py-2 ${PLACEMENT_COLORS[placement]}`}
              >
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{PLACEMENT_LABELS[placement]}</span>
                  <span>{capitalizeColor(entry.color)}</span>
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
          onClick={onPlayAgain}
          className="mt-5 w-full rounded-md bg-amber-600 px-4 py-2 font-semibold text-stone-950 transition hover:bg-amber-500"
        >
          Play Again
        </button>
      </div>
    </div>
  )
}
