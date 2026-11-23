import type { DieFace, GameMode, GameState, Move, PlayerColor, Position } from './types'

export type SeatControllerType = 'HUMAN' | 'AI_FALLBACK' | 'AI_BOT'
export type SeatStatus = 'CONNECTED' | 'GRACE_PERIOD' | 'AI_TAKEOVER'

export interface SeatInfo {
  seatIndex: number
  color: PlayerColor
  controllerType: SeatControllerType
  status: SeatStatus
  playerToken: string | null
  displayName: string
  graceExpiresAt?: number
}

export type RejectReason =
  | 'NOT_YOUR_TURN'
  | 'INVALID_PHASE'
  | 'STALE_SEQUENCE'
  | 'ILLEGAL_MOVE'
  | 'SEAT_OCCUPIED'
  | 'ROOM_FULL'

export type ClientIntent =
  | { type: 'JOIN_ROOM'; roomId: string; playerToken: string; displayName: string }
  | { type: 'START_INSTANT_DEMO'; playerToken: string; aiDifficulty: 'easy' | 'medium' | 'hard'; preferredColor?: PlayerColor }
  | { type: 'ROLL_DICE'; clientActionId: string; expectedSeq: number }
  | { type: 'MOVE_PIECE'; clientActionId: string; expectedSeq: number; from: Position; to: Position }
  | { type: 'PASS_TURN'; clientActionId: string; expectedSeq: number }
  | { type: 'PING'; clientTimestamp: number }

export type ValidatedAction =
  | { type: 'DICE_ROLLED'; color: PlayerColor; roll: DieFace }
  | { type: 'PIECE_MOVED'; move: Move }
  | { type: 'TURN_PASSED'; color: PlayerColor }

export type ServerEvent =
  | { type: 'STATE_SNAPSHOT'; seq: number; serverTime: number; state: GameState; seats: Record<PlayerColor, SeatInfo> }
  | { type: 'ACTION_COMMITTED'; seq: number; serverTickMs: number; action: ValidatedAction; statePatch: Partial<GameState> }
  | { type: 'ACTION_REJECTED'; clientActionId: string; reason: RejectReason; authoritativeSeq: number }
  | { type: 'SEAT_STATUS_CHANGED'; seq: number; color: PlayerColor; status: SeatStatus; controllerType: SeatControllerType; graceExpiresAt?: number }
  | { type: 'MATCH_ENDED'; seq: number; finalState: GameState; replayId: string }
  | { type: 'PONG'; clientTimestamp: number; serverTimestamp: number }

export interface MatchRoomConfig {
  roomId: string
  matchSeed: number
  gameMode: GameMode
  turnTimerSeconds: number
  gracePeriodSeconds: number
}
