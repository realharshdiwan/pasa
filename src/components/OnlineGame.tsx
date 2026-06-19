import { useCallback, useEffect, useRef, useState } from 'react'
import Board from './Board'
import DieRollOnline from './DieRollOnline'
import GameOver from './GameOver'
import Lore from './Lore'
import MoveHistory from './MoveHistory'
import Settings from './Settings'
import Tutorial from './Tutorial'
import TurnIndicator from './TurnIndicator'
import type { GameMode } from '../engine/types'
import { useMultiplayerStore } from '../store/multiplayerStore'

export default function OnlineGame() {
  const [showTutorial, setShowTutorial] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showLore, setShowLore] = useState(false)
  const [showRajaFlash, setShowRajaFlash] = useState(false)
  const [shaking, setShaking] = useState(false)
  const gameState = useMultiplayerStore((s) => s.gameState)
  const lastMove = useMultiplayerStore((s) => s.lastMove)
  const leaveRoom = useMultiplayerStore((s) => s.leaveRoom)
  const flashTimerRef = useRef<number | null>(null)
  const shakeTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!lastMove || lastMove.captured?.type !== 'raja') return

    requestAnimationFrame(() => {
      setShowRajaFlash(true)
      setShaking(true)
    })

    flashTimerRef.current = window.setTimeout(() => setShowRajaFlash(false), 600)
    shakeTimerRef.current = window.setTimeout(() => setShaking(false), 400)

    return () => {
      if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current)
      if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current)
    }
  }, [lastMove])

  const handleLeave = useCallback(async () => {
    await leaveRoom()
  }, [leaveRoom])

  if (!gameState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-900 text-stone-100">
        <p>Loading game...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 p-4 lg:p-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLeave}
            className="self-start rounded-md border border-red-500/50 bg-red-900/30 px-3 py-1.5 text-sm font-medium text-red-200 transition hover:bg-red-800/40"
          >
            Leave Game
          </button>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="self-start rounded-md border border-stone-500/70 bg-stone-800 px-3 py-1.5 text-sm font-medium text-stone-100 transition hover:bg-stone-700"
          >
            Settings
          </button>
          <button
            type="button"
            onClick={() => setShowTutorial(true)}
            className="self-start rounded-md border border-amber-500/50 bg-amber-900/30 px-3 py-1.5 text-sm font-medium text-amber-200 transition hover:bg-amber-800/40"
          >
            Learn to Play
          </button>
          <button
            type="button"
            onClick={() => setShowLore(true)}
            className="self-start rounded-md border border-stone-500/50 bg-stone-800 px-3 py-1.5 text-sm font-medium text-stone-300 transition hover:bg-stone-700"
          >
            About
          </button>
        </div>
        <TurnIndicator />

        <div className="flex flex-1 flex-col gap-4 lg:flex-row">
          <section className={`flex flex-1 items-center justify-center rounded-xl border border-stone-700/70 bg-stone-800/40 p-3 ${shaking ? 'screen-shake' : ''}`}>
            <div className="relative aspect-square w-full max-w-[78vh]">
              <Board />
              {showRajaFlash ? (
                <div className="raja-flash pointer-events-none absolute inset-0 z-10 rounded-xl bg-red-600/60" />
              ) : null}
              {gameState.phase === 'finished' ? (
                <GameOver
                  players={gameState.players}
                  moveHistory={gameState.moveHistory}
                  onPlayAgain={handleLeave}
                />
              ) : null}
              {showTutorial ? (
                <Tutorial onClose={() => setShowTutorial(false)} />
              ) : null}
              {showSettings ? (
                <Settings
                  currentMode={gameState.gameMode as GameMode}
                  onModeToggle={() => {}}
                  onClose={() => setShowSettings(false)}
                />
              ) : null}
              {showLore ? (
                <Lore onClose={() => setShowLore(false)} />
              ) : null}
            </div>
          </section>

          <section className="w-full lg:w-80">
            <DieRollOnline />
            <div className="mt-4">
              <MoveHistory />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
