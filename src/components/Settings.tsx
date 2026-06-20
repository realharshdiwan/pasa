import { useCallback, useMemo, useState } from 'react'
import type { Difficulty } from '../engine/ai'
import type { GameMode } from '../engine/types'
import { useGameStore } from '../store/gameStore'
import type { TimerMode } from '../store/gameStore'
import { BOARD_THEME_LABELS, BOARD_THEME_COLORS, DIE_THEME_LABELS, DIE_THEME_COLORS, PIECE_THEME_LABELS, getCosmetics } from '../utils/cosmetics'
import { getMuted, setMuted } from '../utils/sound'

interface SettingsProps {
  currentMode: GameMode
  onModeToggle: () => void
  onClose: () => void
}

export default function Settings({ currentMode, onModeToggle, onClose }: SettingsProps) {
  const botDifficulty = useGameStore((state) => state.botDifficulty)
  const setBotDifficulty = useGameStore((state) => state.setBotDifficulty)
  const autoDieRoll = useGameStore((state) => state.autoDieRoll)
  const setAutoDieRoll = useGameStore((state) => state.setAutoDieRoll)
  const sanskritNames = useGameStore((state) => state.sanskritNames)
  const setSanskritNames = useGameStore((state) => state.setSanskritNames)
  const timerMode = useGameStore((state) => state.timerMode)
  const setTimerMode = useGameStore((state) => state.setTimerMode)
  const perMoveSeconds = useGameStore((state) => state.perMoveSeconds)
  const setPerMoveSeconds = useGameStore((state) => state.setPerMoveSeconds)
  const totalSeconds = useGameStore((state) => state.totalSeconds)
  const setTotalSeconds = useGameStore((state) => state.setTotalSeconds)
  const boardTheme = useGameStore((state) => state.boardTheme)
  const setBoardTheme = useGameStore((state) => state.setBoardTheme)
  const pieceTheme = useGameStore((state) => state.pieceTheme)
  const setPieceTheme = useGameStore((state) => state.setPieceTheme)
  const dieTheme = useGameStore((state) => state.dieTheme)
  const setDieTheme = useGameStore((state) => state.setDieTheme)
  const [isMuted, setIsMuted] = useState(() => getMuted())

  const handleDifficultySelect = useCallback(
    (difficulty: Difficulty): void => {
      setBotDifficulty(difficulty)
    },
    [setBotDifficulty],
  )

  const handleAutoDieRollToggle = useCallback((): void => {
    setAutoDieRoll(!autoDieRoll)
  }, [autoDieRoll, setAutoDieRoll])

  const handleSoundToggle = useCallback((): void => {
    const next = !getMuted()
    setMuted(next)
    setIsMuted(next)
  }, [])

  const handleSanskritToggle = useCallback((): void => {
    setSanskritNames(!sanskritNames)
  }, [sanskritNames, setSanskritNames])

  const handleTimerModeChange = useCallback(
    (mode: TimerMode): void => {
      setTimerMode(mode)
    },
    [setTimerMode],
  )

  const handleModeToggle = useCallback((): void => {
    onModeToggle()
    onClose()
  }, [onModeToggle, onClose])

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl border border-stone-500/50 bg-stone-900/95 p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-stone-100">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-stone-400 transition hover:bg-stone-700 hover:text-stone-200"
          >
            Close
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-300">
              Bot Difficulty
            </h3>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map((difficulty: Difficulty) => (
                <button
                  key={difficulty}
                  type="button"
                  onClick={() => handleDifficultySelect(difficulty)}
                  className={`rounded-md px-2 py-1.5 text-sm font-medium transition ${
                    botDifficulty === difficulty
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-stone-700 text-stone-100 hover:bg-stone-600'
                  }`}
                >
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-300">
              Game Mode
            </h3>
            <button
              type="button"
              onClick={handleModeToggle}
              className="mt-2 w-full rounded-md border border-stone-500/50 bg-stone-700 px-3 py-2 text-sm font-medium text-stone-100 transition hover:bg-stone-600"
            >
              Switch to {currentMode === 'freeforall' ? 'Teams' : 'Free for All'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-stone-100">Auto Die Roll</h3>
              <p className="text-xs text-stone-400">Roll automatically on your turn</p>
            </div>
            <button
              type="button"
              onClick={handleAutoDieRollToggle}
              className={`relative h-6 w-11 rounded-full transition ${
                autoDieRoll ? 'bg-amber-500' : 'bg-stone-600'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  autoDieRoll ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-stone-100">Sound</h3>
              <p className="text-xs text-stone-400">Game sound effects</p>
            </div>
            <button
              type="button"
              onClick={handleSoundToggle}
              className="rounded-md border border-stone-500/50 bg-stone-700 px-3 py-1.5 text-sm font-medium text-stone-100 transition hover:bg-stone-600"
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-stone-100">Piece Names</h3>
              <p className="text-xs text-stone-400">
                {sanskritNames ? 'Sanskrit (Ashva, Gaja...)' : 'English (Horse, Elephant...)'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSanskritToggle}
              className={`relative h-6 w-11 rounded-full transition ${
                sanskritNames ? 'bg-amber-500' : 'bg-stone-600'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  sanskritNames ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-300">
              Timer
            </h3>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(['none', 'per-move', 'total'] as const).map((mode: TimerMode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleTimerModeChange(mode)}
                  className={`rounded-md px-2 py-1.5 text-sm font-medium transition ${
                    timerMode === mode
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-stone-700 text-stone-100 hover:bg-stone-600'
                  }`}
                >
                  {mode === 'none' ? 'Off' : mode === 'per-move' ? 'Per Move' : 'Total'}
                </button>
              ))}
            </div>
            {timerMode === 'per-move' ? (
              <div className="mt-2 flex items-center gap-2">
                <label className="text-xs text-stone-400" htmlFor="per-move-timer">
                  Seconds per move:
                </label>
                <input
                  id="per-move-timer"
                  type="number"
                  min={10}
                  max={120}
                  value={perMoveSeconds}
                  onChange={(e) => setPerMoveSeconds(Number(e.target.value))}
                  className="w-16 rounded bg-stone-700 px-2 py-1 text-sm text-stone-100"
                />
              </div>
            ) : null}
            {timerMode === 'total' ? (
              <div className="mt-2 flex items-center gap-2">
                <label className="text-xs text-stone-400" htmlFor="total-timer">
                  Minutes per player:
                </label>
                <input
                  id="total-timer"
                  type="number"
                  min={1}
                  max={30}
                  value={Math.floor(totalSeconds / 60)}
                  onChange={(e) => setTotalSeconds(Number(e.target.value) * 60)}
                  className="w-16 rounded bg-stone-700 px-2 py-1 text-sm text-stone-100"
                />
              </div>
            ) : null}
          </div>

          <ThemeSelector
            title="Board Style"
            options={['classic', 'parchment', 'rosewood', 'stone', 'ivory']}
            labels={BOARD_THEME_LABELS}
            colors={BOARD_THEME_COLORS}
            selected={boardTheme}
            onSelect={setBoardTheme}
          />

          <ThemeSelector
            title="Piece Style"
            options={['classic', 'geometric', 'minimal']}
            labels={PIECE_THEME_LABELS}
            selected={pieceTheme}
            onSelect={setPieceTheme}
          />

          <ThemeSelector
            title="Die Style"
            options={['classic', 'bone', 'jade', 'clay']}
            labels={DIE_THEME_LABELS}
            colors={DIE_THEME_COLORS}
            selected={dieTheme}
            onSelect={setDieTheme}
          />
        </div>
      </div>
    </div>
  )
}

interface ThemeSelectorProps<T extends string> {
  title: string
  options: readonly T[]
  labels: Record<T, string>
  colors?: Record<T, Record<string, string>>
  selected: T
  onSelect: (theme: T) => void
}

function ThemeSelector<T extends string>({ title, options, labels, colors, selected, onSelect }: ThemeSelectorProps<T>) {
  const cosmetics = useMemo(() => getCosmetics(), [])

  const isUnlocked = (theme: T): boolean => {
    if (title === 'Board Style') {
      return (cosmetics.unlockedBoardThemes as string[]).includes(theme)
    }
    if (title === 'Piece Style') {
      return (cosmetics.unlockedPieceThemes as string[]).includes(theme)
    }
    if (title === 'Die Style') {
      return (cosmetics.unlockedDieThemes as string[]).includes(theme)
    }
    return true
  }

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-300">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((theme) => {
          const unlocked = isUnlocked(theme)
          return (
            <button
              key={theme}
              type="button"
              onClick={() => unlocked && onSelect(theme)}
              disabled={!unlocked}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                selected === theme
                  ? 'bg-amber-500 text-stone-950'
                  : unlocked
                    ? 'bg-stone-700 text-stone-100 hover:bg-stone-600'
                    : 'cursor-not-allowed bg-stone-800 text-stone-500'
              }`}
            >
              {colors && colors[theme] ? (
                <span
                  className="inline-block h-3 w-3 rounded-full border"
                  style={{ backgroundColor: colors[theme].bg ?? colors[theme].light ?? '#888', borderColor: colors[theme].border ?? colors[theme].dark ?? '#666' }}
                />
              ) : null}
              {labels[theme]}
              {!unlocked ? (
                <span className="text-xs text-stone-400">🔒</span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
