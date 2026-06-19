import { useCallback, useMemo, useState } from 'react'
import { Circle, Group, Layer, Line, Rect, RegularPolygon, Stage } from 'react-konva'
import { PLAYER_COLORS } from '../constants/colors'
import * as boardEngine from '../engine/board'
import * as movesEngine from '../engine/moves'
import type { Board, Move, Piece, PieceType, PlayerColor } from '../engine/types'
import { useGameStore } from '../store/gameStore'
import { BOARD_THEME_COLORS } from '../utils/cosmetics'

const BOARD_DIMENSION = 8
const HIGHLIGHT_SQUARE = 'rgba(255, 200, 0, 0.4)'

const PIECE_ROTATIONS: Record<PlayerColor, number> = {
  red: 0,
  blue: 90,
  yellow: 180,
  green: -90,
}

function toDisplayRow(row: number): number {
  return BOARD_DIMENSION - 1 - row
}

interface ReplayBoardProps {
  board: Board
  highlightMove?: Move | null
  size: number
  boardTheme: string
}

function ReplayBoard({ board, highlightMove, size, boardTheme }: ReplayBoardProps) {
  const squareSize = size / BOARD_DIMENSION
  const pieceRadius = squareSize * 0.34
  const themeColors = BOARD_THEME_COLORS[boardTheme as keyof typeof BOARD_THEME_COLORS] ?? BOARD_THEME_COLORS.classic

  return (
    <Stage width={size} height={size}>
      <Layer>
        {Array.from({ length: BOARD_DIMENSION }, (_, row) =>
          Array.from({ length: BOARD_DIMENSION }, (_, col) => {
            const isLight = (row + col) % 2 === 0
            const y = toDisplayRow(row) * squareSize
            const isFrom = highlightMove && highlightMove.from.row === row && highlightMove.from.col === col
            const isTo = highlightMove && highlightMove.to.row === row && highlightMove.to.col === col

            return (
              <Group key={`sq-${row}-${col}`}>
                <Rect
                  x={col * squareSize}
                  y={y}
                  width={squareSize}
                  height={squareSize}
                  fill={isLight ? themeColors.light : themeColors.dark}
                />
                {isFrom || isTo ? (
                  <Rect
                    x={col * squareSize}
                    y={y}
                    width={squareSize}
                    height={squareSize}
                    fill={HIGHLIGHT_SQUARE}
                    listening={false}
                  />
                ) : null}
              </Group>
            )
          })
        )}
        {board.flatMap((row, rowIdx) =>
          row.map((square, colIdx) => {
            if (!square.piece) {
              return null
            }
            const piece = square.piece
            return (
              <ReplayPieceNode
                key={piece.id}
                piece={piece}
                centerX={colIdx * squareSize + squareSize / 2}
                centerY={toDisplayRow(rowIdx) * squareSize + squareSize / 2}
                radius={pieceRadius}
              />
            )
          })
        )}
      </Layer>
    </Stage>
  )
}

function ReplayPieceNode({ piece, centerX, centerY, radius }: { piece: Piece; centerX: number; centerY: number; radius: number }) {
  const s = radius * 0.7

  return (
    <Group
      x={centerX}
      y={centerY}
      rotation={PIECE_ROTATIONS[piece.color]}
      listening={false}
    >
      <Circle
        radius={radius}
        fill={PLAYER_COLORS[piece.controlledBy]}
        stroke="rgba(0, 0, 0, 0.35)"
        strokeWidth={Math.max(1, radius * 0.08)}
      />
      {piece.controlledBy !== piece.color ? (
        <Circle
          x={radius * 0.45}
          y={-radius * 0.45}
          radius={radius * 0.28}
          fill={PLAYER_COLORS[piece.color]}
          stroke="rgba(255, 255, 255, 0.85)"
          strokeWidth={Math.max(1, radius * 0.05)}
        />
      ) : null}
      <ReplayPieceIcon type={piece.type} size={s} color={piece.controlledBy} />
    </Group>
  )
}

function ReplayPieceIcon({ type, size, color }: { type: PieceType; size: number; color: PlayerColor }) {
  const white = '#FFFFFF'

  switch (type) {
    case 'raja':
      return (
        <Group>
          <RegularPolygon sides={5} radius={size * 0.55} fill={white} />
          <Circle y={-size * 0.55} radius={size * 0.18} fill={white} />
        </Group>
      )
    case 'ratha':
      return (
        <Group>
          <Rect x={-size * 0.28} y={-size * 0.5} width={size * 0.56} height={size * 0.65} fill={white} />
          <Rect x={-size * 0.38} y={-size * 0.6} width={size * 0.12} height={size * 0.2} fill={white} />
          <Rect x={-size * 0.06} y={-size * 0.6} width={size * 0.12} height={size * 0.2} fill={white} />
          <Rect x={size * 0.26} y={-size * 0.6} width={size * 0.12} height={size * 0.2} fill={white} />
        </Group>
      )
    case 'gaja':
      return (
        <Group>
          <Circle y={-size * 0.1} radius={size * 0.35} fill={white} />
          <Line points={[0, size * 0.05, 0, size * 0.45]} stroke={white} strokeWidth={size * 0.14} lineCap="round" />
          <Line points={[0, size * 0.45, -size * 0.12, size * 0.35]} stroke={white} strokeWidth={size * 0.1} lineCap="round" />
        </Group>
      )
    case 'ashva':
      return (
        <Group>
          <Line
            points={[
              -size * 0.1, size * 0.4,
              -size * 0.05, -size * 0.05,
              size * 0.05, -size * 0.35,
              size * 0.2, -size * 0.45,
              size * 0.25, -size * 0.3,
              size * 0.1, -size * 0.15,
              size * 0.15, size * 0.1,
              size * 0.05, size * 0.4,
            ]}
            closed
            fill={white}
          />
          <Circle x={size * 0.12} y={-size * 0.32} radius={size * 0.06} fill={PLAYER_COLORS[color]} />
        </Group>
      )
    case 'padati':
      return (
        <Group>
          <Circle y={-size * 0.15} radius={size * 0.22} fill={white} />
          <Rect x={-size * 0.18} y={size * 0.05} width={size * 0.36} height={size * 0.35} fill={white} />
        </Group>
      )
  }
}

const PIECE_NAMES: Record<PieceType, string> = {
  raja: 'Raja',
  ratha: 'Ratha',
  gaja: 'Gaja',
  ashva: 'Ashva',
  padati: 'Padati',
}

function formatMove(move: Move): string {
  const pieceName = PIECE_NAMES[move.piece.type]
  if (move.captured) {
    const targetName = PIECE_NAMES[move.captured.type]
    return `${move.player} ${pieceName} captured ${move.captured.controlledBy} ${targetName}`
  }
  if (move.usedRajaOverride) {
    return `${move.player} used Raja override`
  }
  return `${move.player} ${pieceName} moved`
}

interface ReplayViewerProps {
  moves: Move[]
  onClose: () => void
}

export default function ReplayViewer({ moves, onClose }: ReplayViewerProps) {
  const [stepIndex, setStepIndex] = useState(moves.length)
  const boardTheme = useGameStore((state) => state.boardTheme)

  const boardAtStep = useMemo(() => {
    let board = boardEngine.createInitialBoard()
    for (let i = 0; i < stepIndex; i += 1) {
      const move = moves[i]
      const applied = movesEngine.applyMoveToBoard(board, move)
      board = applied.board

      if (applied.captured?.type === 'raja') {
        board = boardEngine.cloneBoard(board)
        const capturedPiece = applied.captured
        for (let r = 0; r < BOARD_DIMENSION; r += 1) {
          for (let c = 0; c < BOARD_DIMENSION; c += 1) {
            const p = board[r][c].piece
            if (p && p.controlledBy === capturedPiece.controlledBy) {
              board[r][c] = { ...board[r][c], piece: { ...p, controlledBy: move.player } }
            }
          }
        }
      }
    }
    return board
  }, [stepIndex, moves])

  const currentMove = stepIndex > 0 ? moves[stepIndex - 1] : null

  const handlePrev = useCallback((): void => {
    setStepIndex((prev) => Math.max(0, prev - 1))
  }, [])

  const handleNext = useCallback((): void => {
    setStepIndex((prev) => Math.min(moves.length, prev + 1))
  }, [moves.length])

  const handleFirst = useCallback((): void => {
    setStepIndex(0)
  }, [])

  const handleLast = useCallback((): void => {
    setStepIndex(moves.length)
  }, [moves.length])

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4">
      <div className="flex w-full max-w-4xl flex-col gap-4 lg:flex-row">
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-lg font-bold text-stone-100">Game Replay</h2>
          <ReplayBoard board={boardAtStep} highlightMove={currentMove} size={400} boardTheme={boardTheme} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFirst}
              disabled={stepIndex === 0}
              className="rounded bg-stone-700 px-3 py-1 text-sm text-stone-100 transition hover:bg-stone-600 disabled:opacity-40"
            >
              Start
            </button>
            <button
              type="button"
              onClick={handlePrev}
              disabled={stepIndex === 0}
              className="rounded bg-stone-700 px-3 py-1 text-sm text-stone-100 transition hover:bg-stone-600 disabled:opacity-40"
            >
              Back
            </button>
            <span className="min-w-[5rem] text-center text-sm text-stone-300">
              {stepIndex} / {moves.length}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={stepIndex === moves.length}
              className="rounded bg-stone-700 px-3 py-1 text-sm text-stone-100 transition hover:bg-stone-600 disabled:opacity-40"
            >
              Forward
            </button>
            <button
              type="button"
              onClick={handleLast}
              disabled={stepIndex === moves.length}
              className="rounded bg-stone-700 px-3 py-1 text-sm text-stone-100 transition hover:bg-stone-600 disabled:opacity-40"
            >
              End
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 overflow-hidden">
          <h3 className="text-sm font-semibold uppercase text-stone-300">Moves</h3>
          <div className="flex-1 overflow-y-auto rounded-lg bg-stone-800/60 p-2">
            {moves.map((move, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStepIndex(i + 1)}
                className={`w-full rounded px-2 py-1 text-left text-sm transition ${
                  stepIndex === i + 1
                    ? 'bg-amber-600/30 text-amber-200'
                    : 'text-stone-300 hover:bg-stone-700/50'
                }`}
              >
                <span className="font-mono text-xs text-stone-500">{i + 1}.</span>{' '}
                {formatMove(move)}
                {move.usedRajaOverride ? ' (override)' : ''}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-md bg-amber-600 px-4 py-2 font-semibold text-stone-950 transition hover:bg-amber-500"
          >
            Close Replay
          </button>
        </div>
      </div>
    </div>
  )
}
