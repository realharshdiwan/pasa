export type PlayerColor = 'red' | 'blue' | 'yellow' | 'green'

export type PieceType = 'raja' | 'ratha' | 'gaja' | 'ashva' | 'padati'

export type DieFace = 2 | 3 | 4 | 5

export interface Position {
  row: number // 0–7, 0 = bottom
  col: number // 0–7, 0 = left
}

export interface Piece {
  id: string // unique e.g. 'red-raja', 'blue-padati-1'
  type: PieceType
  color: PlayerColor // original owner color
  controlledBy: PlayerColor // current controller (changes on elimination)
}

export interface Square {
  position: Position
  piece: Piece | null
}

export type Board = Square[][] // [row][col], 8x8

export interface Player {
  color: PlayerColor
  isEliminated: boolean
  points: number
  placement: number | null // 1–4, null until placed
}

export type GameMode = 'freeforall' | 'teams'
export type GamePhase = 'setup' | 'playing' | 'finished'

export interface GameState {
  board: Board
  players: Record<PlayerColor, Player>
  currentTurn: PlayerColor
  currentRoll: DieFace | null
  movesSinceLastCapture: number
  turnOrder: PlayerColor[] // clockwise, excludes eliminated players
  gameMode: GameMode
  phase: GamePhase
  moveHistory: Move[]
  placementCounter: number // tracks 2nd, 3rd, 4th placement order
}

export interface Move {
  player: PlayerColor
  piece: Piece
  from: Position
  to: Position
  captured: Piece | null
  roll: DieFace
  usedRajaOverride: boolean // true if player moved Raja ignoring roll
}
