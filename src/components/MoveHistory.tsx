import { useMemo } from 'react'
import type { Move, PieceType } from '../engine/types'
import { useGameStore } from '../store/gameStore'
import { capitalizeColor, positionToNotation } from '../utils/format'

const PIECE_NAMES: Record<PieceType, string> = {
  raja: 'Raja',
  ratha: 'Ratha',
  gaja: 'Gaja',
  ashva: 'Ashva',
  padati: 'Padati',
}

const MAX_VISIBLE_MOVES = 6

function describeMove(move: Move): string {
  const pieceName = PIECE_NAMES[move.piece.type]
  const from = positionToNotation(move.from.row, move.from.col)
  const to = positionToNotation(move.to.row, move.to.col)

  if (move.usedRajaOverride) {
    if (move.captured) {
      const targetName = PIECE_NAMES[move.captured.type]
      return `${capitalizeColor(move.player)} Raja captured ${capitalizeColor(move.captured.controlledBy)} ${targetName} at ${to}`
    }
    return `${capitalizeColor(move.player)} Raja moved from ${from} to ${to}`
  }

  if (move.captured) {
    const targetName = PIECE_NAMES[move.captured.type]
    return `${capitalizeColor(move.player)} ${pieceName} captured ${capitalizeColor(move.captured.controlledBy)} ${targetName} at ${to}`
  }

  return `${capitalizeColor(move.player)} ${pieceName} moved from ${from} to ${to}`
}

export default function MoveHistory() {
  const moveHistory = useGameStore((state) => state.gameState.moveHistory)

  const recentMoves = useMemo(() => {
    return moveHistory.slice(-MAX_VISIBLE_MOVES).reverse()
  }, [moveHistory])

  if (recentMoves.length === 0) {
    return (
      <div className="rounded-xl border border-stone-600/60 bg-stone-800/70 p-4 text-stone-100 shadow-lg backdrop-blur-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-300">
          Move History
        </h3>
        <p className="mt-2 text-sm text-stone-400 italic">No moves yet</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-stone-600/60 bg-stone-800/70 p-4 text-stone-100 shadow-lg backdrop-blur-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-300">
        Move History
      </h3>
      <ul className="mt-2 space-y-1">
        {recentMoves.map((move: Move, index: number) => (
          <li
            key={`${move.player}-${move.from.row}-${move.from.col}-${move.to.row}-${move.to.col}-${index}`}
            className="text-sm text-stone-200"
          >
            {describeMove(move)}
          </li>
        ))}
      </ul>
    </div>
  )
}
