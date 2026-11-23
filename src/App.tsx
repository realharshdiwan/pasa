import { useCallback, useEffect, useRef, useState } from 'react'
import AuthScreen from './components/AuthScreen'
import Board from './components/Board'
import DieRoll from './components/DieRoll'
import GameOver from './components/GameOver'
import GameHeader from './components/GameHeader'
import Lobby from './components/Lobby'
import LocalLobbyModal from './components/LocalLobbyModal'
import Lore from './components/Lore'
import MainMenu from './components/MainMenu'
import MoveHistory from './components/MoveHistory'
import OnlineGame from './components/OnlineGame'
import PlayerCards from './components/PlayerCards'
import Settings from './components/Settings'
import Tutorial from './components/Tutorial'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/useAuth'
import {
  playEliminationSound,
  playDieRollSound,
  playDieResultSound,
  playElephantStompSound,
  playRajaCaptureSound,
} from './utils/sound'
import type { DieFace, GameMode, PlayerColor } from './engine/types'
import { useGameStore } from './store/gameStore'
import { useMultiplayerStore } from './store/multiplayerStore'
import { recordGame } from './utils/cosmetics'
import { PLAYER_COLORS } from './constants/colors'

type AppView = 'menu' | 'local' | 'online-auth' | 'online-lobby' | 'online-game'

const PLAYER_LABELS: Record<PlayerColor, string> = {
  red: 'Red',
  blue: 'Blue',
  yellow: 'Yellow',
  green: 'Green',
}

function LocalGame({ onBack }: { onBack: () => void }) {
  const [currentMode, setCurrentMode] = useState<GameMode>('freeforall')
  const [showTutorial, setShowTutorial] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showLore, setShowLore] = useState(false)
  const [showRajaFlash, setShowRajaFlash] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [showGameOver, setShowGameOver] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [eliminationSplash, setEliminationSplash] = useState<{ color: PlayerColor; placement: number } | null>(null)
  const phase = useGameStore((state) => state.gameState.phase)
  const players = useGameStore((state) => state.gameState.players)
  const moveHistory = useGameStore((state) => state.gameState.moveHistory)
  const humanPlayer = useGameStore((state) => state.humanPlayer)
  const autoDieRoll = useGameStore((state) => state.autoDieRoll)
  const currentTurn = useGameStore((state) => state.gameState.currentTurn)
  const currentRoll = useGameStore((state) => state.gameState.currentRoll)
  const timerMode = useGameStore((state) => state.timerMode)
  const prevMoveLenRef = useRef(0)
  const flashTimerRef = useRef<number | null>(null)
  const shakeTimerRef = useRef<number | null>(null)
  const elimTimerRef = useRef<number | null>(null)
  const prevPhaseRef = useRef(phase)
  const prevEliminatedRef = useRef<Set<PlayerColor>>(new Set())

  useEffect(() => {
    const currentPhase = useGameStore.getState().gameState.phase
    if (currentPhase !== 'playing') {
      useGameStore.getState().initGame('freeforall')
    }
  }, [])

  useEffect(() => {
    if (prevPhaseRef.current === 'playing' && phase === 'finished') {
      const state = useGameStore.getState()
      const humanColor = state.humanPlayer
      const winner = Object.entries(state.gameState.players)
        .filter(([, p]) => !p.isEliminated)
        .map(([color]) => color)
      const won = winner.includes(humanColor)
      recordGame(won)
      setShowGameOver(true)
    }
    prevPhaseRef.current = phase
  }, [phase])

  useEffect(() => {
    const currentEliminated = new Set(
      Object.entries(players)
        .filter(([, p]) => p.isEliminated)
        .map(([c]) => c as PlayerColor)
    )

    for (const color of currentEliminated) {
      if (!prevEliminatedRef.current.has(color) && players[color].placement !== null) {
        if (color !== humanPlayer) {
          playEliminationSound()
          const placement = players[color].placement!
          elimTimerRef.current = window.setTimeout(() => {
            setEliminationSplash({ color, placement })
          }, 0)
          const hideTimer = window.setTimeout(() => {
            setEliminationSplash(null)
          }, 2200)
          return () => {
            window.clearTimeout(hideTimer)
            if (elimTimerRef.current !== null) {
              window.clearTimeout(elimTimerRef.current)
            }
          }
        }
      }
    }

    prevEliminatedRef.current = currentEliminated

    return () => {
      if (elimTimerRef.current !== null) {
        window.clearTimeout(elimTimerRef.current)
      }
    }
  }, [players, humanPlayer])

  useEffect(() => {
    if (moveHistory.length === 0) {
      prevMoveLenRef.current = 0
      return
    }

    if (moveHistory.length <= prevMoveLenRef.current) {
      return
    }

    prevMoveLenRef.current = moveHistory.length
    const lastEntry = moveHistory[moveHistory.length - 1]

    if (lastEntry.captured?.type === 'raja') {
      playRajaCaptureSound()
      requestAnimationFrame(() => {
        setShowRajaFlash(true)
        setShaking(true)
      })

      flashTimerRef.current = window.setTimeout(() => {
        setShowRajaFlash(false)
      }, 1200)
      shakeTimerRef.current = window.setTimeout(() => {
        setShaking(false)
      }, 500)
    } else if (lastEntry.piece.type === 'gaja') {
      playElephantStompSound()
      requestAnimationFrame(() => {
        setShaking(true)
      })
      shakeTimerRef.current = window.setTimeout(() => {
        setShaking(false)
      }, 380)
    }

    return () => {
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current)
      }
      if (shakeTimerRef.current !== null) {
        window.clearTimeout(shakeTimerRef.current)
      }
    }
  }, [moveHistory])

  useEffect(() => {
    if (phase !== 'playing') {
      return
    }

    if (currentTurn === humanPlayer) {
      if (autoDieRoll && currentRoll === null) {
        if (useGameStore.getState().isRolling) return
        const timeoutId = window.setTimeout(() => {
          useGameStore.getState().setIsRolling(true, 2)
          playDieRollSound()
          let cycle = 0
          const faces: DieFace[] = [2, 3, 4, 5]
          const interval = window.setInterval(() => {
            cycle++
            useGameStore.getState().setIsRolling(true, faces[cycle % 4])
            if (cycle >= 8) {
              window.clearInterval(interval)
              useGameStore.getState().rollDie()
              const rolled = useGameStore.getState().gameState.currentRoll
              if (rolled !== null) {
                useGameStore.getState().setIsRolling(false, rolled)
                playDieResultSound()
              } else {
                useGameStore.getState().setIsRolling(false)
              }
            }
          }, 75)
        }, 500)
        return () => window.clearTimeout(timeoutId)
      }
      return
    }

    const state = useGameStore.getState().gameState
    if (state.currentRoll === null) {
      if (useGameStore.getState().isRolling) return

      const rollTimeout = window.setTimeout(() => {
        useGameStore.getState().setIsRolling(true, 2)
        playDieRollSound()

        let cycle = 0
        const faces: DieFace[] = [2, 3, 4, 5]
        const interval = window.setInterval(() => {
          cycle++
          useGameStore.getState().setIsRolling(true, faces[cycle % 4])
          if (cycle >= 8) {
            window.clearInterval(interval)
            useGameStore.getState().rollDie()
            const rolled = useGameStore.getState().gameState.currentRoll
            if (rolled !== null) {
              useGameStore.getState().setIsRolling(false, rolled)
              playDieResultSound()
            } else {
              useGameStore.getState().setIsRolling(false)
            }
          }
        }, 75)
      }, 600)
      return () => window.clearTimeout(rollTimeout)
    }

    const moveTimeout = window.setTimeout(() => {
      useGameStore.getState().triggerBotMoveIfNeeded()
    }, 1200)

    return () => {
      window.clearTimeout(moveTimeout)
    }
  }, [currentTurn, phase, humanPlayer, autoDieRoll, currentRoll])

  useEffect(() => {
    if (phase !== 'playing' || timerMode === 'none') {
      return
    }

    const intervalId = window.setInterval(() => {
      useGameStore.getState().tickTimers()
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [phase, timerMode])

  const handlePlayAgain = useCallback((): void => {
    setShowGameOver(false)
    useGameStore.getState().initGame(currentMode)
  }, [currentMode])

  const handleModeToggle = useCallback((): void => {
    const nextMode: GameMode = currentMode === 'freeforall' ? 'teams' : 'freeforall'
    const confirmed = window.confirm('This will restart the game. Continue?')
    if (!confirmed) {
      return
    }

    setCurrentMode(nextMode)
    useGameStore.getState().initGame(nextMode)
  }, [currentMode])

  const handleMenuClick = useCallback(() => {
    if (phase === 'playing') {
      setShowExitConfirm(true)
    } else {
      onBack()
    }
  }, [phase, onBack])

  return (
    <div className="screen-enter min-h-screen bg-stone-900 text-stone-100">
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-3 p-3 sm:p-4 lg:p-6">
        <GameHeader
          onOpenSettings={() => setShowSettings(true)}
          onOpenTutorial={() => setShowTutorial(true)}
          onOpenLore={() => setShowLore(true)}
          onExitMatch={handleMenuClick}
        />

        <div className="flex flex-1 flex-col items-center lg:items-start gap-4 lg:flex-row">
          <section className={`relative flex flex-1 w-full items-center justify-center rounded-xl border border-stone-700/70 bg-stone-800/40 p-2 sm:p-3 ${shaking ? 'screen-shake elephant-rumble' : ''}`}>
            <div className="relative aspect-square w-full max-w-[min(92vw,50vh)] lg:max-w-[74vh]">
              <Board />
              {showRajaFlash ? (
                <div className="crown-burst pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/40 via-red-600/35 to-amber-600/50 backdrop-blur-[2px]">
                  <span className="text-5xl sm:text-6xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] animate-bounce">👑</span>
                  <span className="mt-2 text-xs sm:text-sm font-black uppercase tracking-widest text-amber-200 drop-shadow">
                    Raja Conquered!
                  </span>
                  <span className="text-[10px] font-bold text-white/90">
                    Army Commanded
                  </span>
                </div>
              ) : null}
              {eliminationSplash ? (
                <div className="elimination-splash pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                  <div
                    className="rounded-xl px-8 py-5 text-center shadow-2xl"
                    style={{ backgroundColor: `${PLAYER_COLORS[eliminationSplash.color]}dd` }}
                  >
                    <p className="text-2xl font-bold text-white">
                      {PLAYER_LABELS[eliminationSplash.color]} Eliminated
                    </p>
                    <p className="mt-1 text-lg text-white/80">
                      {eliminationSplash.placement === 4 ? '4th Place' :
                       eliminationSplash.placement === 3 ? '3rd Place' :
                       eliminationSplash.placement === 2 ? '2nd Place' : ''}
                    </p>
                  </div>
                </div>
              ) : null}
              {phase === 'finished' && showGameOver ? (
                <GameOver
                  players={players}
                  moveHistory={moveHistory}
                  onPlayAgain={() => { setShowGameOver(false); handlePlayAgain() }}
                  onClose={() => setShowGameOver(false)}
                />
              ) : null}
              {showTutorial ? (
                <Tutorial onClose={() => setShowTutorial(false)} />
              ) : null}
              {showSettings ? (
                <Settings
                  currentMode={currentMode}
                  onModeToggle={handleModeToggle}
                  onClose={() => setShowSettings(false)}
                />
              ) : null}
              {showLore ? (
                <Lore onClose={() => setShowLore(false)} />
              ) : null}
            </div>
          </section>

          <section className="flex w-full flex-col gap-3 lg:w-80">
            <PlayerCards />
            <DieRoll />
            <MoveHistory />
          </section>
        </div>
      </main>

      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-stone-600 bg-stone-900 p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-900/40 text-red-400 mb-3 text-xl font-bold">
              !
            </div>
            <h3 className="text-lg font-bold text-stone-100">Leave Match?</h3>
            <p className="mt-2 text-sm text-stone-400">
              Your active battle progress will be lost.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="rounded-xl border border-stone-600 bg-stone-800 px-4 py-2.5 text-sm font-medium text-stone-200 hover:bg-stone-700 transition"
              >
                Keep Playing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false)
                  onBack()
                }}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-500 shadow-md transition"
              >
                Abandon Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OnlineFlow({ onBack }: { onBack: () => void }) {
  const { user, loading, configured } = useAuth()
  const onlinePhase = useMultiplayerStore((s) => s.onlinePhase)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-900 text-stone-100">
        <p>Loading...</p>
      </div>
    )
  }

  if (!configured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-900 p-4">
        <div className="w-full max-w-sm rounded-xl border border-stone-500/50 bg-stone-900/95 p-6 shadow-2xl text-center">
          <h2 className="text-xl font-bold text-stone-100">Online Multiplayer</h2>
          <p className="mt-3 text-sm text-stone-400">
            Online multiplayer requires a Supabase project. Set the
            {' '}<code className="text-amber-300">VITE_SUPABASE_URL</code> and
            {' '}<code className="text-amber-300">VITE_SUPABASE_ANON_KEY</code> environment
            variables to enable this feature.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-5 w-full rounded-md border border-stone-500/50 bg-stone-700 px-4 py-2 font-medium text-stone-100 transition hover:bg-stone-600"
          >
            Back to Main Menu
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen onAuthenticated={() => {}} onBack={onBack} />
  }

  if (onlinePhase === 'playing') {
    return <OnlineGame />
  }

  return <Lobby onGameStart={() => {}} onBack={onBack} />
}

function AppShell() {
  const [view, setView] = useState<AppView>('menu')
  const [showSetupModal, setShowSetupModal] = useState(false)
  const { configured } = useAuth()

  return (
    <>
      {view === 'menu' ? (
        <MainMenu
          onSelectLocal={() => setShowSetupModal(true)}
          onSelectOnline={() => setView('online-auth')}
          onlineEnabled={configured}
        />
      ) : view === 'local' ? (
        <LocalGame onBack={() => setView('menu')} />
      ) : (
        <OnlineFlow onBack={() => setView('menu')} />
      )}

      {showSetupModal && (
        <LocalLobbyModal
          onStartGame={(config) => {
            useGameStore.getState().setHumanPlayer(config.playerColor)
            useGameStore.getState().setBotDifficulty(config.difficulty)
            useGameStore.getState().setTimerMode(config.timer)
            useGameStore.getState().initGame(config.mode)
            setShowSetupModal(false)
            setView('local')
          }}
          onCancel={() => setShowSetupModal(false)}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
