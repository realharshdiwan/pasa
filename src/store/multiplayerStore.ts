import { create } from 'zustand'
import type { RealtimeChannel } from '@supabase/supabase-js'
import * as boardEngine from '../engine/board'
import * as eliminationEngine from '../engine/elimination'
import * as movesEngine from '../engine/moves'
import * as scoringEngine from '../engine/scoring'
import type { CandidateMove } from '../engine/moves'
import type {
  DieFace,
  GameMode,
  GameState,
  Move,
  PlayerColor,
  Position,
} from '../engine/types'
import { useGameStore } from './gameStore'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { BoardTheme, DieTheme, PieceTheme } from '../utils/cosmetics'

const PLAYER_COLORS: PlayerColor[] = ['red', 'blue', 'yellow', 'green']

function getNextTurn(turnOrder: PlayerColor[], currentTurn: PlayerColor): PlayerColor {
  if (turnOrder.length === 0) return currentTurn
  const idx = turnOrder.indexOf(currentTurn)
  if (idx < 0) return turnOrder[0]
  return turnOrder[(idx + 1) % turnOrder.length]
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function createMoveRecord(gameState: GameState, move: CandidateMove, roll: DieFace): Move {
  return {
    player: gameState.currentTurn,
    piece: move.piece,
    from: move.from,
    to: move.to,
    captured: move.captured,
    roll,
    usedRajaOverride: move.piece.type === 'raja',
  }
}

function processMove(state: GameState, move: Move): GameState {
  const appliedMove = movesEngine.applyMoveToBoard(state.board, {
    piece: move.piece,
    from: move.from,
    to: move.to,
    captured: move.captured,
  })

  const playersAfterCapture = scoringEngine.awardCapturePoints(
    state.players,
    move.player,
    appliedMove.captured,
  )

  let nextGameState: GameState = {
    ...state,
    board: appliedMove.board,
    players: playersAfterCapture,
    currentRoll: null,
    movesSinceLastCapture: appliedMove.captured
      ? 0
      : state.movesSinceLastCapture + 1,
    moveHistory: [...state.moveHistory, move],
  }

  if (appliedMove.captured?.type === 'raja') {
    nextGameState = eliminationEngine.captureRajaAndTransferArmies(
      nextGameState,
      move.player,
      appliedMove.captured.controlledBy,
    )
  }

  if (nextGameState.phase === 'playing') {
    nextGameState = {
      ...nextGameState,
      currentTurn: getNextTurn(nextGameState.turnOrder, nextGameState.currentTurn),
    }
  }

  nextGameState = eliminationEngine.checkNoCaptureTimeout(nextGameState)

  return nextGameState
}

function syncToGameStore(gameState: GameState, lastMove: Move | null): void {
  useGameStore.setState({ gameState, lastMove })
}

export interface Room {
  id: string
  code: string
  host_id: string
  game_mode: GameMode
  status: 'waiting' | 'playing' | 'finished'
  max_players: number
  created_at: string
}

export interface RoomPlayer {
  id: string
  room_id: string
  user_id: string
  player_color: PlayerColor
  is_ready: boolean
  display_name?: string
}

export interface MultiplayerState {
  currentRoom: Room | null
  roomPlayers: RoomPlayer[]
  isHost: boolean
  myColor: PlayerColor | null
  gameState: GameState | null
  lastMove: Move | null
  selectedSquare: Position | null
  legalMovesForSelected: CandidateMove[]
  hintMove: CandidateMove | null
  onlinePhase: 'idle' | 'lobby' | 'waiting' | 'playing'
  connectionError: string | null
  sanskritNames: boolean
  boardTheme: BoardTheme
  pieceTheme: PieceTheme
  dieTheme: DieTheme

  createRoom: (userId: string, gameMode: GameMode) => Promise<Room | null>
  joinRoom: (roomCode: string, userId: string) => Promise<boolean>
  leaveRoom: () => Promise<void>
  setReady: (userId: string, ready: boolean) => Promise<void>
  startGame: () => Promise<void>

  subscribeToRoom: (roomId: string) => void
  unsubscribeFromRoom: () => void

  selectSquare: (position: Position) => void
  applyOnlineMove: (move: CandidateMove) => Promise<void>
  rollOnlineDie: () => Promise<void>
  passOnlineTurn: () => Promise<void>

  receiveMove: (move: Move) => void
}

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  currentRoom: null,
  roomPlayers: [],
  isHost: false,
  myColor: null,
  gameState: null,
  lastMove: null,
  selectedSquare: null,
  legalMovesForSelected: [],
  hintMove: null,
  onlinePhase: 'idle',
  connectionError: null,
  sanskritNames: true,
  boardTheme: 'classic',
  pieceTheme: 'classic',
  dieTheme: 'classic',

  createRoom: async (userId: string, gameMode: GameMode): Promise<Room | null> => {
    if (!isSupabaseConfigured()) {
      set({ connectionError: 'Supabase not configured' })
      return null
    }

    const code = generateRoomCode()
    const { data: room, error } = await supabase
      .from('rooms')
      .insert({ code, host_id: userId, game_mode: gameMode })
      .select()
      .single()

    if (error || !room) {
      set({ connectionError: error?.message ?? 'Failed to create room' })
      return null
    }

    const { error: joinError } = await supabase
      .from('room_players')
      .insert({ room_id: room.id, user_id: userId, player_color: 'red' })

    if (joinError) {
      set({ connectionError: joinError.message })
      return null
    }

    set({
      currentRoom: room,
      isHost: true,
      myColor: 'red',
      onlinePhase: 'waiting',
    })

    get().subscribeToRoom(room.id)
    return room
  },

  joinRoom: async (roomCode: string, userId: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      set({ connectionError: 'Supabase not configured' })
      return false
    }

    const { data: room, error: fetchError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', roomCode.toUpperCase())
      .eq('status', 'waiting')
      .single()

    if (fetchError || !room) {
      set({ connectionError: 'Room not found or already started' })
      return false
    }

    const { data: existing } = await supabase
      .from('room_players')
      .select('player_color')
      .eq('room_id', room.id)

    if (existing && existing.length >= room.max_players) {
      set({ connectionError: 'Room is full' })
      return false
    }

    const takenColors = new Set((existing ?? []).map((p) => p.player_color))
    const availableColor = PLAYER_COLORS.find((c) => !takenColors.has(c))

    if (!availableColor) {
      set({ connectionError: 'No colors available' })
      return false
    }

    const { error: joinError } = await supabase
      .from('room_players')
      .insert({ room_id: room.id, user_id: userId, player_color: availableColor })

    if (joinError) {
      set({ connectionError: joinError.message })
      return false
    }

    set({
      currentRoom: room,
      isHost: room.host_id === userId,
      myColor: availableColor,
      onlinePhase: 'waiting',
    })

    get().subscribeToRoom(room.id)
    return true
  },

  leaveRoom: async (): Promise<void> => {
    get().unsubscribeFromRoom()
    set({
      currentRoom: null,
      roomPlayers: [],
      isHost: false,
      myColor: null,
      gameState: null,
      lastMove: null,
      selectedSquare: null,
      legalMovesForSelected: [],
      onlinePhase: 'idle',
      connectionError: null,
    })
  },

  setReady: async (userId: string, ready: boolean): Promise<void> => {
    const { currentRoom } = get()
    if (!currentRoom) return

    await supabase
      .from('room_players')
      .update({ is_ready: ready })
      .eq('room_id', currentRoom.id)
      .eq('user_id', userId)
  },

  startGame: async (): Promise<void> => {
    const { currentRoom, roomPlayers } = get()
    if (!currentRoom) return

    const allReady = roomPlayers.length >= 2 && roomPlayers.every((p) => p.is_ready)
    if (!allReady) {
      set({ connectionError: 'Not all players are ready' })
      return
    }

    const turnOrder = roomPlayers.map((p) => p.player_color)

    const initialGameState = boardEngine.createInitialGameState(currentRoom.game_mode)
    const customizedState: GameState = {
      ...initialGameState,
      turnOrder,
      currentTurn: turnOrder[0],
    }

    await supabase
      .from('rooms')
      .update({ status: 'playing' })
      .eq('id', currentRoom.id)

    await supabase
      .from('game_states')
      .upsert({ room_id: currentRoom.id, state: customizedState })

    set({
      gameState: customizedState,
      onlinePhase: 'playing',
    })

    syncToGameStore(customizedState, null)
  },

  subscribeToRoom: (roomId: string): void => {
    get().unsubscribeFromRoom()

    const channel: RealtimeChannel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'moves',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        const moveData = payload.new
        const capturedPiece = moveData.captured_piece_id
          ? {
              id: moveData.captured_piece_id as string,
              type: moveData.captured_piece_type as 'raja' | 'ratha' | 'gaja' | 'ashva' | 'padati',
              color: moveData.captured_controlled_by as PlayerColor,
              controlledBy: moveData.captured_controlled_by as PlayerColor,
            }
          : null
        const move: Move = {
          player: moveData.player_color as PlayerColor,
          piece: {
            id: moveData.piece_id,
            type: moveData.piece_type as Move['piece']['type'],
            color: moveData.player_color as PlayerColor,
            controlledBy: moveData.player_color as PlayerColor,
          },
          from: { row: moveData.from_row, col: moveData.from_col },
          to: { row: moveData.to_row, col: moveData.to_col },
          captured: capturedPiece,
          roll: moveData.roll as DieFace,
          usedRajaOverride: moveData.used_raja_override,
        }
        get().receiveMove(move)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_players',
        filter: `room_id=eq.${roomId}`,
      }, async () => {
        const { data } = await supabase
          .from('room_players')
          .select('*')
          .eq('room_id', roomId)
        if (data) {
          set({ roomPlayers: data as RoomPlayer[] })
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
      }, (payload) => {
        const room = payload.new as Room
        set({ currentRoom: room })
        if (room.status === 'playing' && get().onlinePhase !== 'playing') {
          set({ onlinePhase: 'playing' })
        }
      })
      .subscribe()

    ;(multiplayerStoreRef as { channel: RealtimeChannel | null }).channel = channel

    supabase
      .from('room_players')
      .select('*')
      .eq('room_id', roomId)
      .then(({ data }) => {
        if (data) {
          set({ roomPlayers: data as RoomPlayer[] })
        }
      })
  },

  unsubscribeFromRoom: (): void => {
    const ch = (multiplayerStoreRef as { channel: RealtimeChannel | null }).channel
    if (ch) {
      supabase.removeChannel(ch)
      ;(multiplayerStoreRef as { channel: RealtimeChannel | null }).channel = null
    }
  },

  selectSquare: (position: Position): void => {
    const { gameState, myColor } = get()
    if (!gameState || gameState.currentTurn !== myColor || gameState.currentRoll === null) {
      set({ selectedSquare: null, legalMovesForSelected: [] })
      return
    }

    const selectedPiece = boardEngine.getPieceAt(gameState.board, position)
    if (!selectedPiece || selectedPiece.controlledBy !== myColor) {
      set({ selectedSquare: null, legalMovesForSelected: [] })
      return
    }

    const rolledPieceMoves = movesEngine.getLegalMovesForRoll(
      gameState.board, myColor, gameState.currentRoll, gameState.gameMode,
    )
    const rajaOverrideMoves = movesEngine.getLegalRajaOverrideMoves(
      gameState.board, myColor, gameState.gameMode,
    )

    const candidateMoves = selectedPiece.type === 'raja' ? rajaOverrideMoves : rolledPieceMoves

    set({
      selectedSquare: position,
      legalMovesForSelected: candidateMoves.filter((m) =>
        m.from.row === position.row && m.from.col === position.col,
      ),
    })
  },

  applyOnlineMove: async (move: CandidateMove): Promise<void> => {
    const { currentRoom, gameState, myColor } = get()
    if (!currentRoom || !gameState || gameState.currentTurn !== myColor) return
    if (gameState.currentRoll === null) return

    const moveRecord = createMoveRecord(gameState, move, gameState.currentRoll)
    const nextGameState = processMove(gameState, moveRecord)

    await supabase.from('moves').insert({
      room_id: currentRoom.id,
      sequence_number: gameState.moveHistory.length,
      player_color: myColor,
      piece_id: move.piece.id,
      piece_type: move.piece.type,
      from_row: move.from.row,
      from_col: move.from.col,
      to_row: move.to.row,
      to_col: move.to.col,
      captured_piece_id: move.captured?.id ?? null,
      captured_piece_type: move.captured?.type ?? null,
      captured_controlled_by: move.captured?.controlledBy ?? null,
      roll: gameState.currentRoll,
      used_raja_override: move.piece.type === 'raja',
    })

    await supabase
      .from('game_states')
      .upsert({ room_id: currentRoom.id, state: nextGameState })

    set({
      gameState: nextGameState,
      lastMove: moveRecord,
      selectedSquare: null,
      legalMovesForSelected: [],
      hintMove: null,
    })

    syncToGameStore(nextGameState, moveRecord)
  },

  rollOnlineDie: async (): Promise<void> => {
    const { currentRoom, gameState, myColor } = get()
    if (!currentRoom || !gameState || gameState.currentTurn !== myColor) return

    const roll = (Math.floor(Math.random() * 4) + 2) as DieFace

    const nextGameState: GameState = {
      ...gameState,
      currentRoll: roll,
    }

    await supabase
      .from('game_states')
      .upsert({ room_id: currentRoom.id, state: nextGameState })

    set({ gameState: nextGameState })
    syncToGameStore(nextGameState, get().lastMove)
  },

  passOnlineTurn: async (): Promise<void> => {
    const { currentRoom, gameState, myColor } = get()
    if (!currentRoom || !gameState || gameState.currentTurn !== myColor) return

    const nextTurn = getNextTurn(gameState.turnOrder, gameState.currentTurn)
    const nextGameState: GameState = {
      ...gameState,
      currentTurn: nextTurn,
      currentRoll: null,
    }

    await supabase
      .from('game_states')
      .upsert({ room_id: currentRoom.id, state: nextGameState })

    set({ gameState: nextGameState })
    syncToGameStore(nextGameState, get().lastMove)
  },

  receiveMove: (move: Move): void => {
    const { gameState } = get()
    if (!gameState) return

    const nextGameState = processMove(gameState, move)

    set({
      gameState: nextGameState,
      lastMove: move,
      selectedSquare: null,
      legalMovesForSelected: [],
    })

    syncToGameStore(nextGameState, move)
  },
}))

const multiplayerStoreRef = { channel: null as RealtimeChannel | null }
