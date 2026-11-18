import { useState } from 'react'
import type { Difficulty } from '../engine/ai'
import type { GameMode, PlayerColor } from '../engine/types'
import { PLAYER_COLORS } from '../constants/colors'
import { capitalizeColor } from '../utils/format'
import type { TimerMode } from '../store/gameStore'

interface LocalLobbyModalProps {
  onStartGame: (config: {
    playerColor: PlayerColor
    mode: GameMode
    difficulty: Difficulty
    timer: TimerMode
  }) => void
  onCancel: () => void
}

const PLAYER_ROSTER: { color: PlayerColor; label: string; corner: string }[] = [
  { color: 'red', label: 'Red Army', corner: 'Bottom-Left (Starts 1st)' },
  { color: 'blue', label: 'Blue Army', corner: 'Bottom-Right (Plays 2nd)' },
  { color: 'yellow', label: 'Yellow Army', corner: 'Top-Right (Plays 3rd)' },
  { color: 'green', label: 'Green Army', corner: 'Top-Left (Plays 4th)' },
]

export default function LocalLobbyModal({ onStartGame, onCancel }: LocalLobbyModalProps) {
  const [selectedColor, setSelectedColor] = useState<PlayerColor>('red')
  const [mode, setMode] = useState<GameMode>('freeforall')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [timer, setTimer] = useState<TimerMode>('none')

  const handleStart = () => {
    onStartGame({
      playerColor: selectedColor,
      mode,
      difficulty,
      timer,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-stone-600/80 bg-stone-900/95 p-6 shadow-2xl text-stone-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-700/60 pb-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-amber-300">Battle Setup</h2>
            <p className="text-xs text-stone-400">Configure your match against AI commanders</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Pick Army */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-300">
              1. Choose Your Commander
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              {PLAYER_ROSTER.map((item) => {
                const isSelected = selectedColor === item.color
                return (
                  <button
                    key={item.color}
                    type="button"
                    onClick={() => setSelectedColor(item.color)}
                    className={`flex flex-col items-start rounded-xl p-3 text-left transition border-2 ${
                      isSelected
                        ? 'border-amber-400 bg-stone-800/90 shadow-md ring-2 ring-amber-400/20'
                        : 'border-stone-700/60 bg-stone-800/40 hover:bg-stone-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-full shadow"
                        style={{ backgroundColor: PLAYER_COLORS[item.color] }}
                      />
                      <span className="font-semibold text-sm">{capitalizeColor(item.color)}</span>
                      {isSelected && (
                        <span className="ml-auto text-[10px] font-bold text-amber-400 uppercase">You</span>
                      )}
                    </div>
                    <span className="mt-1 text-[11px] text-stone-400">{item.corner}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Game Mode */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-300">
              2. Game Mode
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMode('freeforall')}
                className={`rounded-xl p-3 text-left transition border-2 ${
                  mode === 'freeforall'
                    ? 'border-amber-400 bg-stone-800/90 shadow-md'
                    : 'border-stone-700/60 bg-stone-800/40 hover:bg-stone-800/70'
                }`}
              >
                <div className="font-semibold text-sm">Free For All</div>
                <div className="text-[11px] text-stone-400 mt-0.5">4-way royal war. Every Raja for themselves.</div>
              </button>

              <button
                type="button"
                onClick={() => setMode('teams')}
                className={`rounded-xl p-3 text-left transition border-2 ${
                  mode === 'teams'
                    ? 'border-amber-400 bg-stone-800/90 shadow-md'
                    : 'border-stone-700/60 bg-stone-800/40 hover:bg-stone-800/70'
                }`}
              >
                <div className="font-semibold text-sm">Alliance (2v2)</div>
                <div className="text-[11px] text-stone-400 mt-0.5">Red & Yellow vs Blue & Green. Shared victory.</div>
              </button>
            </div>
          </div>

          {/* Bot Difficulty */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-300">
              3. AI Commander Difficulty
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`rounded-lg py-2 px-3 text-xs font-semibold capitalize transition border ${
                    difficulty === level
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                      : 'border-stone-700 bg-stone-800/50 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  {level === 'easy' ? 'Easy (Apprentice)' : level === 'medium' ? 'Medium (Tactician)' : 'Hard (Grandmaster)'}
                </button>
              ))}
            </div>
          </div>

          {/* Turn Timer */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-300">
              4. Turn Timer
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'none', label: 'Casual (Off)' },
                  { id: 'per-move', label: '30s Blitz' },
                  { id: 'total', label: '6m Match' },
                ] as { id: TimerMode; label: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimer(t.id)}
                  className={`rounded-lg py-2 px-3 text-xs font-semibold transition border ${
                    timer === t.id
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                      : 'border-stone-700 bg-stone-800/50 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-stone-700/60 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-stone-400 hover:text-stone-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStart}
            className="rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-2.5 text-sm font-bold text-stone-950 shadow-lg hover:from-amber-500 hover:to-amber-400 active:scale-95 transition"
          >
            Enter Battle
          </button>
        </div>
      </div>
    </div>
  )
}
