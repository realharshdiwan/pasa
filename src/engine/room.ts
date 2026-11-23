import type {
  ClientIntent,
  MatchRoomConfig,
  RejectReason,
  SeatInfo,
  ServerEvent,
} from './protocol'
import type { DieFace, GameMode, GameState, Move, PlayerColor } from './types'
import { createInitialGameState } from './board'
import { getBotMove } from './ai'
import { applyMoveToBoard, getTurnMoveOptions, type CandidateMove } from './moves'
import { awardCapturePoints } from './scoring'
import { captureRajaAndTransferArmies, checkNoCaptureTimeout } from './elimination'
import { rollDieWithSeed } from './rng'

function getNextTurn(turnOrder: PlayerColor[], currentTurn: PlayerColor): PlayerColor {
  const currentIndex = turnOrder.indexOf(currentTurn)
  if (currentIndex === -1 || turnOrder.length === 0) {
    return currentTurn
  }
  return turnOrder[(currentIndex + 1) % turnOrder.length]
}

export function applyMoveToGameState(
  state: GameState,
  move: CandidateMove,
  roll: DieFace,
): { nextState: GameState; moveRecord: Move } {
  const usedRajaOverride = move.piece.type === 'raja'

  const moveRecord: Move = {
    player: state.currentTurn,
    piece: move.piece,
    from: move.from,
    to: move.to,
    captured: move.captured,
    roll,
    usedRajaOverride,
  }

  const appliedMove = applyMoveToBoard(state.board, move)
  const playersAfterCapture = awardCapturePoints(
    state.players,
    state.currentTurn,
    appliedMove.captured,
  )

  let nextState: GameState = {
    ...state,
    board: appliedMove.board,
    players: playersAfterCapture,
    currentRoll: null,
    movesSinceLastCapture: appliedMove.captured ? 0 : state.movesSinceLastCapture + 1,
    moveHistory: [...state.moveHistory, moveRecord],
  }

  if (appliedMove.captured?.type === 'raja') {
    nextState = captureRajaAndTransferArmies(
      nextState,
      state.currentTurn,
      appliedMove.captured.controlledBy,
    )
  }

  if (nextState.phase === 'playing') {
    nextState = {
      ...nextState,
      currentTurn: getNextTurn(nextState.turnOrder, nextState.currentTurn),
    }
  }

  nextState = checkNoCaptureTimeout(nextState)

  return { nextState, moveRecord }
}

export interface AuthoritativeRoom {
  config: MatchRoomConfig
  seq: number
  state: GameState
  seats: Record<PlayerColor, SeatInfo>
  processedActionIds: Set<string>
  createdAt: number
}

const PLAYER_ORDER: PlayerColor[] = ['red', 'blue', 'yellow', 'green']

/**
 * Creates a fresh authoritative room for Chaturaji.
 */
export function createAuthoritativeRoom(
  config: MatchRoomConfig,
  hostPlayerToken: string,
  hostDisplayName: string,
  hostColor: PlayerColor = 'red',
): AuthoritativeRoom {
  const seats: Record<PlayerColor, SeatInfo> = {
    red: { seatIndex: 0, color: 'red', controllerType: 'AI_BOT', status: 'CONNECTED', playerToken: null, displayName: 'Red Bot' },
    blue: { seatIndex: 1, color: 'blue', controllerType: 'AI_BOT', status: 'CONNECTED', playerToken: null, displayName: 'Blue Bot' },
    yellow: { seatIndex: 2, color: 'yellow', controllerType: 'AI_BOT', status: 'CONNECTED', playerToken: null, displayName: 'Yellow Bot' },
    green: { seatIndex: 3, color: 'green', controllerType: 'AI_BOT', status: 'CONNECTED', playerToken: null, displayName: 'Green Bot' },
  }

  // Assign host seat
  seats[hostColor] = {
    ...seats[hostColor],
    controllerType: 'HUMAN',
    status: 'CONNECTED',
    playerToken: hostPlayerToken,
    displayName: hostDisplayName,
  }

  return {
    config,
    seq: 1,
    state: createInitialGameState(config.gameMode),
    seats,
    processedActionIds: new Set<string>(),
    createdAt: Date.now(),
  }
}

/**
 * Creates an Instant Demo room with 1 human player and 3 AI seats.
 */
export function createInstantDemoRoom(
  playerToken: string,
  preferredColor: PlayerColor = 'red',
  gameMode: GameMode = 'freeforall',
): AuthoritativeRoom {
  const config: MatchRoomConfig = {
    roomId: `demo-${Math.random().toString(36).substring(2, 8)}`,
    matchSeed: (Date.now() ^ 0x5f3759df) >>> 0,
    gameMode,
    turnTimerSeconds: 30,
    gracePeriodSeconds: 15,
  }

  return createAuthoritativeRoom(config, playerToken, 'Commander (You)', preferredColor)
}

export interface IntentProcessingResult {
  room: AuthoritativeRoom
  events: ServerEvent[]
  rejectedReason?: RejectReason
}

/**
 * Process a client intent against the authoritative room state.
 * Validates turn order, sequence, move legality, and updates seq monotonically.
 */
export function processIntent(
  room: AuthoritativeRoom,
  playerToken: string,
  intent: ClientIntent,
  now: number = Date.now(),
): IntentProcessingResult {
  // 1. Identify player seat
  let playerSeatColor: PlayerColor | null = null
  for (const color of PLAYER_ORDER) {
    if (room.seats[color].playerToken === playerToken) {
      playerSeatColor = color
      break
    }
  }

  // Handle Join Room intent if not seated yet
  if (intent.type === 'JOIN_ROOM') {
    if (playerSeatColor !== null) {
      // Already seated, re-attach
      return {
        room: {
          ...room,
          seats: {
            ...room.seats,
            [playerSeatColor]: {
              ...room.seats[playerSeatColor],
              status: 'CONNECTED',
              controllerType: 'HUMAN',
              graceExpiresAt: undefined,
            },
          },
        },
        events: [
          {
            type: 'STATE_SNAPSHOT',
            seq: room.seq,
            serverTime: now,
            state: room.state,
            seats: room.seats,
          },
        ],
      }
    }

    // Find an open AI seat to take over
    const openColor = PLAYER_ORDER.find((c) => room.seats[c].playerToken === null)
    if (!openColor) {
      return {
        room,
        events: [
          {
            type: 'ACTION_REJECTED',
            clientActionId: 'join',
            reason: 'ROOM_FULL',
            authoritativeSeq: room.seq,
          },
        ],
        rejectedReason: 'ROOM_FULL',
      }
    }

    const nextSeats = {
      ...room.seats,
      [openColor]: {
        ...room.seats[openColor],
        controllerType: 'HUMAN' as const,
        status: 'CONNECTED' as const,
        playerToken,
        displayName: intent.displayName,
      },
    }

    const nextSeq = room.seq + 1
    return {
      room: { ...room, seq: nextSeq, seats: nextSeats },
      events: [
        {
          type: 'SEAT_STATUS_CHANGED',
          seq: nextSeq,
          color: openColor,
          status: 'CONNECTED',
          controllerType: 'HUMAN',
        },
        {
          type: 'STATE_SNAPSHOT',
          seq: nextSeq,
          serverTime: now,
          state: room.state,
          seats: nextSeats,
        },
      ],
    }
  }

  if (intent.type === 'PING') {
    return {
      room,
      events: [{ type: 'PONG', clientTimestamp: intent.clientTimestamp, serverTimestamp: now }],
    }
  }

  // For gameplay intents, verify active turn
  if (!playerSeatColor) {
    return {
      room,
      events: [
        {
          type: 'ACTION_REJECTED',
          clientActionId: (intent as { clientActionId?: string }).clientActionId ?? 'unknown',
          reason: 'NOT_YOUR_TURN',
          authoritativeSeq: room.seq,
        },
      ],
      rejectedReason: 'NOT_YOUR_TURN',
    }
  }

  // Idempotency check
  if ('clientActionId' in intent && room.processedActionIds.has(intent.clientActionId)) {
    return { room, events: [] }
  }

  const activeTurn = room.state.currentTurn
  if (playerSeatColor !== activeTurn) {
    return {
      room,
      events: [
        {
          type: 'ACTION_REJECTED',
          clientActionId: (intent as { clientActionId: string }).clientActionId,
          reason: 'NOT_YOUR_TURN',
          authoritativeSeq: room.seq,
        },
      ],
      rejectedReason: 'NOT_YOUR_TURN',
    }
  }

  // Handle ROLL_DICE intent
  if (intent.type === 'ROLL_DICE') {
    if (room.state.currentRoll !== null) {
      return {
        room,
        events: [
          {
            type: 'ACTION_REJECTED',
            clientActionId: intent.clientActionId,
            reason: 'INVALID_PHASE',
            authoritativeSeq: room.seq,
          },
        ],
        rejectedReason: 'INVALID_PHASE',
      }
    }

    // Server generates deterministic roll using matchSeed and seq
    const roll = rollDieWithSeed(room.config.matchSeed, room.seq)
    const nextState: GameState = {
      ...room.state,
      currentRoll: roll,
    }

    const nextSeq = room.seq + 1
    const nextProcessed = new Set(room.processedActionIds).add(intent.clientActionId)

    return {
      room: {
        ...room,
        seq: nextSeq,
        state: nextState,
        processedActionIds: nextProcessed,
      },
      events: [
        {
          type: 'ACTION_COMMITTED',
          seq: nextSeq,
          serverTickMs: now,
          action: { type: 'DICE_ROLLED', color: activeTurn, roll },
          statePatch: { currentRoll: roll },
        },
      ],
    }
  }

  // Handle MOVE_PIECE intent
  if (intent.type === 'MOVE_PIECE') {
    if (room.state.currentRoll === null) {
      return {
        room,
        events: [
          {
            type: 'ACTION_REJECTED',
            clientActionId: intent.clientActionId,
            reason: 'INVALID_PHASE',
            authoritativeSeq: room.seq,
          },
        ],
        rejectedReason: 'INVALID_PHASE',
      }
    }

    const turnOptions = getTurnMoveOptions(
      room.state.board,
      room.state.currentTurn,
      room.state.currentRoll,
      room.state.gameMode,
    )
    const allLegalMoves = [...turnOptions.rolledPieceMoves, ...turnOptions.rajaOverrideMoves]

    const matchingMove = allLegalMoves.find(
      (m: CandidateMove) =>
        m.from.row === intent.from.row &&
        m.from.col === intent.from.col &&
        m.to.row === intent.to.row &&
        m.to.col === intent.to.col,
    )

    if (!matchingMove) {
      return {
        room,
        events: [
          {
            type: 'ACTION_REJECTED',
            clientActionId: intent.clientActionId,
            reason: 'ILLEGAL_MOVE',
            authoritativeSeq: room.seq,
          },
        ],
        rejectedReason: 'ILLEGAL_MOVE',
      }
    }

    const { nextState, moveRecord } = applyMoveToGameState(
      room.state,
      matchingMove,
      room.state.currentRoll,
    )
    const nextSeq = room.seq + 1
    const nextProcessed = new Set(room.processedActionIds).add(intent.clientActionId)

    const events: ServerEvent[] = [
      {
        type: 'ACTION_COMMITTED',
        seq: nextSeq,
        serverTickMs: now,
        action: {
          type: 'PIECE_MOVED',
          move: moveRecord,
        },
        statePatch: nextState,
      },
    ]

    if (nextState.phase === 'finished') {
      events.push({
        type: 'MATCH_ENDED',
        seq: nextSeq,
        finalState: nextState,
        replayId: `replay-${room.config.roomId}`,
      })
    }

    return {
      room: {
        ...room,
        seq: nextSeq,
        state: nextState,
        processedActionIds: nextProcessed,
      },
      events,
    }
  }

  // Handle PASS_TURN intent
  if (intent.type === 'PASS_TURN') {
    // Pass is legal if player has no legal moves or chooses to forfeit turn
    const nextTurnOrder = room.state.turnOrder
    const currentIndex = nextTurnOrder.indexOf(activeTurn)
    const nextIndex = (currentIndex + 1) % nextTurnOrder.length
    const nextTurn = nextTurnOrder[nextIndex]

    const nextState: GameState = {
      ...room.state,
      currentTurn: nextTurn,
      currentRoll: null,
      movesSinceLastCapture: room.state.movesSinceLastCapture + 1,
    }

    const nextSeq = room.seq + 1
    return {
      room: {
        ...room,
        seq: nextSeq,
        state: nextState,
        processedActionIds: new Set(room.processedActionIds).add(intent.clientActionId),
      },
      events: [
        {
          type: 'ACTION_COMMITTED',
          seq: nextSeq,
          serverTickMs: now,
          action: { type: 'TURN_PASSED', color: activeTurn },
          statePatch: nextState,
        },
      ],
    }
  }

  return { room, events: [] }
}

/**
 * Handle a player socket disconnect.
 * Initiates the 15-second grace countdown without dropping the seat token.
 */
export function handleDisconnect(
  room: AuthoritativeRoom,
  color: PlayerColor,
  now: number = Date.now(),
): { room: AuthoritativeRoom; event: ServerEvent } {
  const graceExpiresAt = now + room.config.gracePeriodSeconds * 1000
  const nextSeats = {
    ...room.seats,
    [color]: {
      ...room.seats[color],
      status: 'GRACE_PERIOD' as const,
      graceExpiresAt,
    },
  }

  const nextSeq = room.seq + 1
  return {
    room: { ...room, seq: nextSeq, seats: nextSeats },
    event: {
      type: 'SEAT_STATUS_CHANGED',
      seq: nextSeq,
      color,
      status: 'GRACE_PERIOD',
      controllerType: room.seats[color].controllerType,
      graceExpiresAt,
    },
  }
}

/**
 * Checks for expired grace periods and switches seats to AI_TAKEOVER.
 */
export function checkGracePeriodExpirations(
  room: AuthoritativeRoom,
  now: number = Date.now(),
): { room: AuthoritativeRoom; events: ServerEvent[] } {
  let modified = false
  const nextSeats = { ...room.seats }
  const events: ServerEvent[] = []
  let nextSeq = room.seq

  for (const color of PLAYER_ORDER) {
    const seat = nextSeats[color]
    if (seat.status === 'GRACE_PERIOD' && seat.graceExpiresAt && now >= seat.graceExpiresAt) {
      modified = true
      nextSeq += 1
      nextSeats[color] = {
        ...seat,
        status: 'AI_TAKEOVER',
        controllerType: 'AI_FALLBACK',
        graceExpiresAt: undefined,
      }
      events.push({
        type: 'SEAT_STATUS_CHANGED',
        seq: nextSeq,
        color,
        status: 'AI_TAKEOVER',
        controllerType: 'AI_FALLBACK',
      })
    }
  }

  if (!modified) {
    return { room, events: [] }
  }

  return {
    room: { ...room, seq: nextSeq, seats: nextSeats },
    events,
  }
}

/**
 * Executes a server-side AI move for an AI_BOT or AI_FALLBACK seat.
 */
export function executeServerBotTurn(
  room: AuthoritativeRoom,
  now: number = Date.now(),
): IntentProcessingResult {
  const activeTurn = room.state.currentTurn
  const activeSeat = room.seats[activeTurn]

  if (activeSeat.controllerType === 'HUMAN') {
    return { room, events: [] }
  }

  // 1. If die not rolled yet, roll it
  if (room.state.currentRoll === null) {
    const roll = rollDieWithSeed(room.config.matchSeed, room.seq)
    const nextState: GameState = {
      ...room.state,
      currentRoll: roll,
    }
    const nextSeq = room.seq + 1
    return {
      room: { ...room, seq: nextSeq, state: nextState },
      events: [
        {
          type: 'ACTION_COMMITTED',
          seq: nextSeq,
          serverTickMs: now,
          action: { type: 'DICE_ROLLED', color: activeTurn, roll },
          statePatch: { currentRoll: roll },
        },
      ],
    }
  }

  // 2. Select AI move using the pure engine
  const botMove = getBotMove(room.state, 'medium')
  if (botMove) {
    const { nextState, moveRecord } = applyMoveToGameState(
      room.state,
      botMove,
      room.state.currentRoll,
    )
    const nextSeq = room.seq + 1
    return {
      room: { ...room, seq: nextSeq, state: nextState },
      events: [
        {
          type: 'ACTION_COMMITTED',
          seq: nextSeq,
          serverTickMs: now,
          action: {
            type: 'PIECE_MOVED',
            move: moveRecord,
          },
          statePatch: nextState,
        },
      ],
    }
  }

  // 3. If no legal moves exist, pass turn
  const nextTurnOrder = room.state.turnOrder
  const currentIndex = nextTurnOrder.indexOf(activeTurn)
  const nextIndex = (currentIndex + 1) % nextTurnOrder.length
  const nextTurn = nextTurnOrder[nextIndex]

  const nextState: GameState = {
    ...room.state,
    currentTurn: nextTurn,
    currentRoll: null,
    movesSinceLastCapture: room.state.movesSinceLastCapture + 1,
  }

  const nextSeq = room.seq + 1
  return {
    room: { ...room, seq: nextSeq, state: nextState },
    events: [
      {
        type: 'ACTION_COMMITTED',
        seq: nextSeq,
        serverTickMs: now,
        action: { type: 'TURN_PASSED', color: activeTurn },
        statePatch: nextState,
      },
    ],
  }
}
