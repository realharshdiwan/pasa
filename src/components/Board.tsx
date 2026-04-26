import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { Circle, Group, Layer, Rect, Stage, Text } from 'react-konva'
import { PLAYER_COLORS } from '../constants/colors'
import * as movesEngine from '../engine/moves'
import type { CandidateMove } from '../engine/moves'
import type { Piece, PieceType, PlayerColor, Position } from '../engine/types'
import { useGameStore } from '../store/gameStore'

const BOARD_DIMENSION = 8
const LIGHT_SQUARE = '#F0D9B5'
const DARK_SQUARE = '#B58863'
const SELECTED_HIGHLIGHT = 'rgba(255, 255, 0, 0.4)'
const LEGAL_MOVE_HIGHLIGHT = 'rgba(0, 200, 0, 0.35)'
const HINT_FROM_HIGHLIGHT = 'rgba(0, 100, 255, 0.4)'
const HINT_TO_HIGHLIGHT = 'rgba(0, 100, 255, 0.25)'

const PIECE_ROTATIONS: Record<PlayerColor, number> = {
  red: 0,
  blue: 90,
  yellow: 180,
  green: -90,
}

const PIECE_LABELS: Record<PieceType, string> = {
  raja: 'K',
  ratha: 'R',
  gaja: 'G',
  ashva: 'A',
  padati: 'P',
}

function toDisplayRow(row: number): number {
  return BOARD_DIMENSION - 1 - row
}

function positionKey(position: Position): string {
  return `${position.row},${position.col}`
}

function arePositionsEqual(left: Position | null, right: Position): boolean {
  return left !== null && left.row === right.row && left.col === right.col
}

export default function Board() {
  const board = useGameStore((state) => state.gameState.board)
  const currentRoll = useGameStore((state) => state.gameState.currentRoll)
  const currentTurn = useGameStore((state) => state.gameState.currentTurn)
  const gameMode = useGameStore((state) => state.gameState.gameMode)
  const selectedSquare = useGameStore((state) => state.selectedSquare)
  const legalMovesForSelected = useGameStore((state) => state.legalMovesForSelected)
  const hintMove = useGameStore((state) => state.hintMove)
  const selectSquare = useGameStore((state) => state.selectSquare)
  const applyMove = useGameStore((state) => state.applyMove)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const [boardSize, setBoardSize] = useState<number>(640)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const updateBoardSize = (): void => {
      const width = container.clientWidth
      const height = container.clientHeight
      const fallback = Math.max(width, height)
      const nextSize = Math.min(width, height) || fallback || 640
      setBoardSize(nextSize)
    }

    const observer = new ResizeObserver(() => {
      updateBoardSize()
    })

    updateBoardSize()
    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [])

  const squareSize = boardSize / BOARD_DIMENSION
  const pieceRadius = squareSize * 0.34

  const legalMoveMap = useMemo(() => {
    const map = new Map<string, CandidateMove>()
    for (const move of legalMovesForSelected) {
      map.set(positionKey(move.to), move)
    }
    return map
  }, [legalMovesForSelected])

  const handleSquareClick = useCallback(
    (position: Position): void => {
      const legalMove = legalMoveMap.get(positionKey(position))
      if (legalMove) {
        applyMove(legalMove)
        return
      }

      selectSquare(position)
    },
    [applyMove, legalMoveMap, selectSquare],
  )

  const pieceNodes = useMemo(() => {
    const nodes: ReactElement[] = []
    const movableRolledPieceIds = new Set<string>()

    if (currentRoll !== null) {
      const rolledPieceMoves = movesEngine.getLegalMovesForRoll(
        board,
        currentTurn,
        currentRoll,
        gameMode,
      )

      for (const move of rolledPieceMoves) {
        movableRolledPieceIds.add(move.piece.id)
      }
    }

    for (let row = 0; row < BOARD_DIMENSION; row += 1) {
      for (let col = 0; col < BOARD_DIMENSION; col += 1) {
        const piece = board[row][col].piece
        if (!piece) {
          continue
        }

        const isCurrentPlayerPiece = piece.controlledBy === currentTurn
        const isRajaOverridePiece = isCurrentPlayerPiece && piece.type === 'raja'
        const canMoveByRoll = movableRolledPieceIds.has(piece.id)
        const shouldDimPiece =
          currentRoll !== null &&
          isCurrentPlayerPiece &&
          !isRajaOverridePiece &&
          !canMoveByRoll

        nodes.push(
          <PieceNode
            key={piece.id}
            piece={piece}
            centerX={col * squareSize + squareSize / 2}
            centerY={toDisplayRow(row) * squareSize + squareSize / 2}
            radius={pieceRadius}
            opacity={shouldDimPiece ? 0.35 : 1}
          />,
        )
      }
    }

    return nodes
  }, [
    board,
    currentRoll,
    currentTurn,
    gameMode,
    pieceRadius,
    squareSize,
  ])

  const squareNodes = useMemo(() => {
    const nodes: ReactElement[] = []

    for (let row = 0; row < BOARD_DIMENSION; row += 1) {
      for (let col = 0; col < BOARD_DIMENSION; col += 1) {
        const position: Position = { row, col }
        const y = toDisplayRow(row) * squareSize
        const isLight = (row + col) % 2 === 0
        const isSelected = arePositionsEqual(selectedSquare, position)
        const legalMove = legalMoveMap.get(positionKey(position))
        const isHintFrom = arePositionsEqual(hintMove?.from ?? null, position)
        const isHintTo = arePositionsEqual(hintMove?.to ?? null, position)

        nodes.push(
          <Group key={`square-${row}-${col}`}>
            <Rect
              x={col * squareSize}
              y={y}
              width={squareSize}
              height={squareSize}
              fill={isLight ? LIGHT_SQUARE : DARK_SQUARE}
              onClick={() => handleSquareClick(position)}
              onTap={() => handleSquareClick(position)}
            />
            {isSelected ? (
              <Rect
                x={col * squareSize}
                y={y}
                width={squareSize}
                height={squareSize}
                fill={SELECTED_HIGHLIGHT}
                listening={false}
              />
            ) : null}
            {legalMove ? (
              <Rect
                x={col * squareSize}
                y={y}
                width={squareSize}
                height={squareSize}
                fill={LEGAL_MOVE_HIGHLIGHT}
                listening={false}
              />
            ) : null}
            {isHintFrom ? (
              <Rect
                x={col * squareSize}
                y={y}
                width={squareSize}
                height={squareSize}
                fill={HINT_FROM_HIGHLIGHT}
                listening={false}
              />
            ) : null}
            {isHintTo ? (
              <Rect
                x={col * squareSize}
                y={y}
                width={squareSize}
                height={squareSize}
                fill={HINT_TO_HIGHLIGHT}
                listening={false}
              />
            ) : null}
          </Group>,
        )
      }
    }

    return nodes
  }, [handleSquareClick, hintMove, legalMoveMap, selectedSquare, squareSize])

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center"
    >
      <Stage
        width={boardSize}
        height={boardSize}
      >
        <Layer>
          {squareNodes}
          {pieceNodes}
        </Layer>
      </Stage>
    </div>
  )
}

interface PieceNodeProps {
  piece: Piece
  centerX: number
  centerY: number
  radius: number
  opacity: number
}

function PieceNode({ piece, centerX, centerY, radius, opacity }: PieceNodeProps) {
  const labelSize = Math.max(12, radius * 0.85)

  return (
    <Group
      x={centerX}
      y={centerY}
      rotation={PIECE_ROTATIONS[piece.color]}
      listening={false}
      opacity={opacity}
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
      <Text
        text={PIECE_LABELS[piece.type]}
        x={-radius}
        y={-labelSize * 0.62}
        width={radius * 2}
        align="center"
        fontSize={labelSize}
        fontStyle="bold"
        fill="#FFFFFF"
      />
    </Group>
  )
}
