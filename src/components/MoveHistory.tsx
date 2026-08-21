import { useEffect, useMemo, useRef } from 'react'
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

function describeMove(move: Move): string {
  const pieceName = PIECE_NAMES[move.piece.type]
  const from = positionToNotation(move.from.row, move.from.col)
  const to = positionToNotation(move.to.row, move.to.col)

  if (move.usedRajaOverride) {
    if (move.captured) {
      const targetName = PIECE_NAMES[move.captured.type]
      return `Raja captured ${capitalizeColor(move.captured.controlledBy)} ${targetName} at ${to}`
    }
    return `Raja moved from ${from} to ${to}`
  }

  if (move.captured) {
    const targetName = PIECE_NAMES[move.captured.type]
    return `${pieceName} captured ${capitalizeColor(move.captured.controlledBy)} ${targetName} at ${to}`
  }

  return `${pieceName} moved from ${from} to ${to}`
}

export default function MoveHistory() {
  const moveHistory = useGameStore((state) => state.gameState.moveHistory)
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(moveHistory.length)

  useEffect(() => {
    if (moveHistory.length > prevLengthRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    prevLengthRef.current = moveHistory.length
  }, [moveHistory.length])

  const recentMoves = useMemo(() => {
    return [...moveHistory].reverse()
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
      <div
        ref={scrollRef}
        className="mt-2 max-h-[12rem] overflow-y-auto rounded-lg bg-stone-900/40 pr-1 scrollbar-thin scrollbar-thumb-stone-600"
      >
        <ul className="space-y-0.5">
          {recentMoves.map((move: Move, index: number) => (
            <li
              key={`${move.player}-${move.from.row}-${move.from.col}-${move.to.row}-${move.to.col}-${index}`}
              className="flex items-start gap-1.5 rounded px-1.5 py-0.5 text-sm text-stone-200 hover:bg-stone-700/30"
            >
              <span className="inline-flex shrink-0 items-center justify-center rounded bg-stone-700/60 px-1 py-0.5 text-xs font-bold text-stone-200">
                {move.roll}
              </span>
              <span className="min-w-0">
                <span className="font-semibold" style={{ color: `var(--tw-text-opacity)` }}>
                  {capitalizeColor(move.player)}
                </span>{' '}
                {describeMove(move)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
