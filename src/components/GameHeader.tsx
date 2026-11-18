import { useState } from 'react'
import { PLAYER_COLORS } from '../constants/colors'
import { useGameStore } from '../store/gameStore'
import { capitalizeColor } from '../utils/format'
import { getMuted, setMuted } from '../utils/sound'

interface GameHeaderProps {
  onOpenSettings: () => void
  onOpenTutorial: () => void
  onOpenLore: () => void
  onExitMatch: () => void
}

export default function GameHeader({
  onOpenSettings,
  onOpenTutorial,
  onOpenLore,
  onExitMatch,
}: GameHeaderProps) {
  const currentTurn = useGameStore((state) => state.gameState.currentTurn)
  const humanPlayer = useGameStore((state) => state.humanPlayer)
  const gameMode = useGameStore((state) => state.gameState.gameMode)
  const [isMuted, setIsMuted] = useState(() => getMuted())

  const isHumanTurn = currentTurn === humanPlayer
  const turnColor = PLAYER_COLORS[currentTurn]

  const toggleSound = () => {
    const next = !getMuted()
    setMuted(next)
    setIsMuted(next)
  }

  return (
    <header className="flex w-full items-center justify-between rounded-2xl border border-stone-700/60 bg-stone-900/80 px-4 py-2.5 shadow-xl backdrop-blur-md">
      {/* Brand & Mode */}
      <div className="flex items-center gap-2.5">
        <span className="font-extrabold tracking-wider text-base sm:text-lg text-amber-400">
          PASA
        </span>
        <span className="rounded-full border border-stone-600 bg-stone-800 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-stone-300">
          {gameMode === 'teams' ? '2v2 Teams' : 'Solo FFA'}
        </span>
      </div>

      {/* Center: Dynamic Turn Pill */}
      <div className="flex items-center">
        <div
          className={`flex items-center gap-2 rounded-full px-3.5 py-1 text-xs sm:text-sm font-bold text-white shadow-md transition-all duration-300 ${
            isHumanTurn
              ? 'ring-2 ring-amber-400/80 shadow-amber-500/20 animate-pulse'
              : 'opacity-90'
          }`}
          style={{ backgroundColor: turnColor }}
        >
          <span className="inline-block h-2 w-2 rounded-full bg-white shadow-sm" />
          <span>
            {isHumanTurn
              ? `Your Turn (${capitalizeColor(currentTurn)})`
              : `${capitalizeColor(currentTurn)} Bot`}
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={toggleSound}
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          className="rounded-lg p-2 text-stone-300 hover:bg-stone-800 hover:text-stone-100 transition"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        <button
          type="button"
          onClick={onOpenTutorial}
          title="Learn to Play"
          className="rounded-lg p-2 text-stone-300 hover:bg-stone-800 hover:text-stone-100 transition text-sm font-semibold"
        >
          📖
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          title="Settings"
          className="rounded-lg p-2 text-stone-300 hover:bg-stone-800 hover:text-stone-100 transition text-sm font-semibold"
        >
          ⚙️
        </button>

        <button
          type="button"
          onClick={onOpenLore}
          title="Game Lore"
          className="hidden sm:inline-flex rounded-lg px-2.5 py-1 text-xs font-medium text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition"
        >
          Lore
        </button>

        <button
          type="button"
          onClick={onExitMatch}
          title="Exit to Menu"
          className="ml-1 rounded-lg border border-red-500/40 bg-red-950/30 px-2.5 py-1 text-xs font-semibold text-red-300 hover:bg-red-900/50 hover:text-red-100 transition"
        >
          Leave
        </button>
      </div>
    </header>
  )
}
