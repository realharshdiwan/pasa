import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/useAuth'
import { useMultiplayerStore } from '../store/multiplayerStore'
import { capitalizeColor } from '../utils/format'

const PLAYER_COLORS = ['red', 'blue', 'yellow', 'green'] as const

interface LobbyProps {
  onGameStart: () => void
  onBack: () => void
}

export default function Lobby({ onGameStart, onBack }: LobbyProps) {
  const { user, signOut } = useAuth()
  const {
    currentRoom,
    roomPlayers,
    isHost,
    onlinePhase,
    connectionError,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    startGame,
  } = useMultiplayerStore()

  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [gameMode, setGameMode] = useState<'freeforall' | 'teams'>('freeforall')

  useEffect(() => {
    if (onlinePhase === 'playing') {
      onGameStart()
    }
  }, [onlinePhase, onGameStart])

  const handleCreateRoom = useCallback(async () => {
    if (!user) return
    setCreating(true)
    await createRoom(user.id, gameMode)
    setCreating(false)
  }, [user, createRoom, gameMode])

  const handleJoinRoom = useCallback(async () => {
    if (!user || !joinCode.trim()) return
    setJoining(true)
    const success = await joinRoom(joinCode.trim(), user.id)
    if (!success) {
      setJoining(false)
    }
  }, [user, joinCode, joinRoom])

  const handleToggleReady = useCallback(async () => {
    if (!user) return
    const me = roomPlayers.find((p) => p.user_id === user.id)
    if (me) {
      await setReady(user.id, !me.is_ready)
    }
  }, [user, roomPlayers, setReady])

  const handleStartGame = useCallback(async () => {
    await startGame()
  }, [startGame])

  const handleLeave = useCallback(async () => {
    await leaveRoom()
    onBack()
  }, [leaveRoom, onBack])

  const handleSignOut = useCallback(async () => {
    await signOut()
    onBack()
  }, [signOut, onBack])

  if (!user) return null

  if (!currentRoom) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-900 p-4">
        <div className="w-full max-w-sm rounded-xl border border-stone-500/50 bg-stone-900/95 p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-stone-100">Online Multiplayer</h2>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs text-stone-400 hover:text-stone-200"
            >
              Sign out
            </button>
          </div>

          <p className="mt-1 text-xs text-stone-500">Signed in as {user.email}</p>

          <div className="mt-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-300">
                Create Room
              </h3>
              <div className="mt-2 flex gap-2">
                <select
                  value={gameMode}
                  onChange={(e) => setGameMode(e.target.value as 'freeforall' | 'teams')}
                  className="flex-1 rounded-md border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-stone-100"
                >
                  <option value="freeforall">Free for All</option>
                  <option value="teams">Teams</option>
                </select>
                <button
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={creating}
                  className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-amber-500 disabled:opacity-50"
                >
                  {creating ? '...' : 'Create'}
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-600" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-stone-900 px-2 text-stone-500">or</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-300">
                Join Room
              </h3>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="flex-1 rounded-md border border-stone-600 bg-stone-800 px-3 py-2 text-sm uppercase text-stone-100 tracking-widest focus:border-amber-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleJoinRoom}
                  disabled={joining || joinCode.length < 6}
                  className="rounded-md border border-stone-500/50 bg-stone-700 px-4 py-2 text-sm font-medium text-stone-100 transition hover:bg-stone-600 disabled:opacity-50"
                >
                  {joining ? '...' : 'Join'}
                </button>
              </div>
            </div>

            {connectionError ? (
              <p className="text-xs text-red-400">{connectionError}</p>
            ) : null}

            <button
              type="button"
              onClick={onBack}
              className="w-full text-center text-xs text-stone-400 hover:text-stone-200"
            >
              Back to main menu
            </button>
          </div>
        </div>
      </div>
    )
  }

  const me = roomPlayers.find((p) => p.user_id === user.id)
  const allReady = roomPlayers.length >= 2 && roomPlayers.every((p) => p.is_ready)

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-900 p-4">
      <div className="w-full max-w-sm rounded-xl border border-stone-500/50 bg-stone-900/95 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-stone-100">Waiting Room</h2>
          <button
            type="button"
            onClick={handleLeave}
            className="text-xs text-stone-400 hover:text-stone-200"
          >
            Leave
          </button>
        </div>

        <div className="mt-3 rounded-lg bg-stone-800/60 p-3 text-center">
          <p className="text-xs text-stone-400">Room Code</p>
          <p className="mt-1 text-2xl font-bold tracking-widest text-amber-400">
            {currentRoom.code}
          </p>
          <p className="mt-1 text-xs text-stone-500">Share this code with friends</p>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-semibold text-stone-300">Players ({roomPlayers.length}/{currentRoom.max_players})</h3>
          <ul className="mt-2 space-y-1.5">
            {PLAYER_COLORS.map((color) => {
              const player = roomPlayers.find((p) => p.player_color === color)
              return (
                <li
                  key={color}
                  className={`flex items-center justify-between rounded px-3 py-2 text-sm ${
                    player
                      ? 'bg-stone-700/70 text-stone-100'
                      : 'bg-stone-800/40 text-stone-500'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: color === 'red' ? '#C0392B' : color === 'blue' ? '#2980B9' : color === 'yellow' ? '#F39C12' : '#27AE60' }}
                    />
                    {capitalizeColor(color)}
                    {player?.user_id === user.id ? ' (You)' : ''}
                  </span>
                  <span className={`text-xs ${player?.is_ready ? 'text-green-400' : 'text-stone-500'}`}>
                    {player ? (player.is_ready ? 'Ready' : 'Not ready') : 'Waiting...'}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleToggleReady}
            className={`flex-1 rounded-md px-4 py-2 font-medium transition ${
              me?.is_ready
                ? 'bg-green-600 text-white hover:bg-green-500'
                : 'bg-stone-700 text-stone-100 hover:bg-stone-600'
            }`}
          >
            {me?.is_ready ? 'Ready!' : 'Mark Ready'}
          </button>

          {isHost ? (
            <button
              type="button"
              onClick={handleStartGame}
              disabled={!allReady}
              className="flex-1 rounded-md bg-amber-600 px-4 py-2 font-semibold text-stone-950 transition hover:bg-amber-500 disabled:opacity-50"
            >
              Start Game
            </button>
          ) : null}
        </div>

        {isHost ? (
          <p className="mt-2 text-center text-xs text-stone-500">
            {allReady ? 'All players ready — start the game!' : 'Waiting for all players to be ready (min 2)'}
          </p>
        ) : (
          <p className="mt-2 text-center text-xs text-stone-500">
            Waiting for host to start the game...
          </p>
        )}

        {connectionError ? (
          <p className="mt-2 text-xs text-red-400">{connectionError}</p>
        ) : null}
      </div>
    </div>
  )
}
