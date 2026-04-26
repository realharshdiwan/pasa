import { useCallback, useEffect, useState } from 'react'
import Board from './components/Board'
import DieRoll from './components/DieRoll'
import GameOver from './components/GameOver'
import TurnIndicator from './components/TurnIndicator'
import type { Difficulty } from './engine/ai'
import type { GameMode } from './engine/types'
import { useGameStore } from './store/gameStore'

export default function App() {
  const [currentMode, setCurrentMode] = useState<GameMode>('freeforall')
  const phase = useGameStore((state) => state.gameState.phase)
  const currentTurn = useGameStore((state) => state.gameState.currentTurn)
  const players = useGameStore((state) => state.gameState.players)
  const botDifficulty = useGameStore((state) => state.botDifficulty)
  const setBotDifficulty = useGameStore((state) => state.setBotDifficulty)

  useEffect(() => {
    useGameStore.getState().initGame('freeforall')
  }, [])

  useEffect(() => {
    if (phase !== 'playing') {
      return
    }

    if (currentTurn === useGameStore.getState().humanPlayer) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      useGameStore.getState().triggerBotMoveIfNeeded()
    }, 1200)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [currentTurn, phase])

  const handlePlayAgain = useCallback((): void => {
    useGameStore.getState().initGame(currentMode)
  }, [currentMode])

  const handleDifficultySelect = useCallback(
    (difficulty: Difficulty): void => {
      setBotDifficulty(difficulty)
    },
    [setBotDifficulty],
  )

  const handleModeToggle = useCallback((): void => {
    const nextMode: GameMode = currentMode === 'freeforall' ? 'teams' : 'freeforall'
    const confirmed = window.confirm('This will restart the game. Continue?')
    if (!confirmed) {
      return
    }

    setCurrentMode(nextMode)
    useGameStore.getState().initGame(nextMode)
  }, [currentMode])

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 p-4 lg:p-6">
        <button
          type="button"
          onClick={handleModeToggle}
          className="self-start rounded-md border border-stone-500/70 bg-stone-800 px-3 py-1.5 text-sm font-medium text-stone-100 transition hover:bg-stone-700"
        >
          Mode: {currentMode === 'freeforall' ? 'Free for All' : 'Teams'}
        </button>
        <TurnIndicator />

        <div className="flex flex-1 flex-col gap-4 lg:flex-row">
          <section className="flex flex-1 items-center justify-center rounded-xl border border-stone-700/70 bg-stone-800/40 p-3">
            <div className="relative aspect-square w-full max-w-[78vh]">
              <Board />
              {phase === 'finished' ? (
                <GameOver
                  players={players}
                  onPlayAgain={handlePlayAgain}
                />
              ) : null}
            </div>
          </section>

          <section className="w-full lg:w-80">
            <div className="mb-3 rounded-xl border border-stone-600/60 bg-stone-800/70 p-3 text-stone-100 shadow-lg backdrop-blur-sm">
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
            <DieRoll />
          </section>
        </div>
      </main>
    </div>
  )
}
