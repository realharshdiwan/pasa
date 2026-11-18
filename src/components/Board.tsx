import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { Circle, Group, Image as KonvaImage, Layer, Rect, Stage } from 'react-konva'
import Konva from 'konva'
import { PLAYER_COLORS } from '../constants/colors'
import * as movesEngine from '../engine/moves'
import type { CandidateMove } from '../engine/moves'
import type { Piece, PieceType, PlayerColor, Position } from '../engine/types'
import { useGameStore } from '../store/gameStore'
import { BOARD_THEME_COLORS } from '../utils/cosmetics'
import { playCaptureSound, playMoveSound, playRajaCaptureSound } from '../utils/sound'
import rajaImg from '../assets/pieces/raja.svg'
import rathaImg from '../assets/pieces/ratha.svg'
import gajaImg from '../assets/pieces/gaja.svg'
import ashvaImg from '../assets/pieces/ashva.svg'
import padatiImg from '../assets/pieces/padati.svg'

const PIECE_IMAGES: Record<PieceType, string> = {
  raja: rajaImg,
  ratha: rathaImg,
  gaja: gajaImg,
  ashva: ashvaImg,
  padati: padatiImg,
}

const pieceImageCache = new Map<PieceType, HTMLImageElement>()
const pieceImagePromises = new Map<PieceType, Promise<HTMLImageElement>>()

function loadPieceImage(type: PieceType): HTMLImageElement | null {
  return pieceImageCache.get(type) ?? null
}

function ensurePieceImagesLoaded(): void {
  for (const [type, src] of Object.entries(PIECE_IMAGES) as [PieceType, string][]) {
    if (pieceImageCache.has(type) || pieceImagePromises.has(type)) continue
    const promise = new Promise<HTMLImageElement>((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        pieceImageCache.set(type, img)
        resolve(img)
      }
      img.src = src
    })
    pieceImagePromises.set(type, promise)
  }
}

ensurePieceImagesLoaded()

const BOARD_DIMENSION = 8
const SELECTED_HIGHLIGHT = 'rgba(255, 255, 0, 0.4)'
const LEGAL_MOVE_HIGHLIGHT = 'rgba(0, 200, 0, 0.35)'
const HINT_FROM_HIGHLIGHT = 'rgba(0, 100, 255, 0.4)'
const HINT_TO_HIGHLIGHT = 'rgba(0, 100, 255, 0.25)'
const ANIMATION_DURATION = 0.2

const PIECE_ROTATIONS: Record<PlayerColor, number> = {
  red: 0,
  blue: 90,
  yellow: 180,
  green: -90,
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
  const lastMove = useGameStore((state) => state.lastMove)
  const boardTheme = useGameStore((state) => state.boardTheme)
  const pieceTheme = useGameStore((state) => state.pieceTheme)
  const selectSquare = useGameStore((state) => state.selectSquare)
  const applyMove = useGameStore((state) => state.applyMove)

  const [imagesReady, setImagesReady] = useState(() => {
    return (['raja', 'ratha', 'gaja', 'ashva', 'padati'] as PieceType[]).every((t) => pieceImageCache.has(t))
  })

  const containerRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<Konva.Stage | null>(null)
  const [boardSize, setBoardSize] = useState<number>(640)
  const prevMoveHistoryLenRef = useRef<number>(0)
  const animatingRef = useRef(false)
  const moveHistoryLen = useGameStore((state) => state.gameState.moveHistory.length)

  useEffect(() => {
    if (imagesReady) return
    Promise.all([...pieceImagePromises.values()]).then(() => setImagesReady(true))
  }, [imagesReady])

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

  useLayoutEffect(() => {
    if (moveHistoryLen === 0) {
      prevMoveHistoryLenRef.current = 0
      return
    }

    if (moveHistoryLen <= prevMoveHistoryLenRef.current) {
      return
    }

    prevMoveHistoryLenRef.current = moveHistoryLen

    if (!lastMove || !stageRef.current) {
      return
    }

    const sqSize = boardSize / BOARD_DIMENSION
    const fromX = lastMove.from.col * sqSize + sqSize / 2
    const fromY = toDisplayRow(lastMove.from.row) * sqSize + sqSize / 2
    const toX = lastMove.to.col * sqSize + sqSize / 2
    const toY = toDisplayRow(lastMove.to.row) * sqSize + sqSize / 2

    const pieceNode = stageRef.current.findOne(`#${lastMove.piece.id}`)
    if (!pieceNode) {
      return
    }

    animatingRef.current = true
    pieceNode.position({ x: fromX, y: fromY })

    pieceNode.to({
      x: toX,
      y: toY,
      duration: ANIMATION_DURATION,
      easing: Konva.Easings.EaseOut,
      onFinish: () => {
        animatingRef.current = false
      },
    })
  }, [moveHistoryLen, lastMove, boardSize])

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
      if (animatingRef.current) {
        return
      }

      const legalMove = legalMoveMap.get(positionKey(position))
      if (legalMove) {
        if (legalMove.captured?.type === 'raja') {
          playRajaCaptureSound()
        } else if (legalMove.captured) {
          playCaptureSound()
        } else {
          playMoveSound()
        }
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
            theme={pieceTheme}
            imagesReady={imagesReady}
          />,
        )
      }
    }

    return nodes
  }, [board, currentRoll, currentTurn, gameMode, pieceRadius, squareSize, pieceTheme, imagesReady])

  const squareNodes = useMemo(() => {
    const nodes: ReactElement[] = []
    const themeColors = BOARD_THEME_COLORS[boardTheme]

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
              fill={isLight ? themeColors.light : themeColors.dark}
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
  }, [handleSquareClick, hintMove, legalMoveMap, selectedSquare, squareSize, boardTheme])

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center"
    >
      <Stage
        ref={stageRef}
        width={boardSize}
        height={boardSize}
        pixelRatio={window.devicePixelRatio || 1}
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
  theme: 'classic' | 'geometric' | 'minimal'
  imagesReady: boolean
}

function PieceNode({ piece, centerX, centerY, radius, opacity, theme: _theme, imagesReady }: PieceNodeProps) {
  const img = imagesReady ? loadPieceImage(piece.type) : null

  return (
    <Group
      id={piece.id}
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
      {img ? (
        <KonvaImage
          image={img}
          x={-radius}
          y={-radius}
          width={radius * 2}
          height={radius * 2}
        />
      ) : null}
    </Group>
  )
}
