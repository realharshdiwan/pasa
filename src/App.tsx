import { useCallback, useEffect, useRef, useState } from 'react'
import AuthScreen from './components/AuthScreen'
import Board from './components/Board'
import DieRoll from './components/DieRoll'
import GameOver from './components/GameOver'
import Lobby from './components/Lobby'
import Lore from './components/Lore'
import MainMenu from './components/MainMenu'
import MoveHistory from './components/MoveHistory'
import OnlineGame from './components/OnlineGame'
import Settings from './components/Settings'
import Tutorial from './components/Tutorial'
import TurnIndicator from './components/TurnIndicator'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/useAuth'
import type { GameMode } from './engine/types'
import { useGameStore } from './store/gameStore'
import { useMultiplayerStore } from './store/multiplayerStore'
import { recordGame } from './utils/cosmetics'

type AppView = 'menu' | 'local' | 'online-auth' | 'online-lobby' | 'online-game'

function LocalGame({ onBack }: { onBack: () => void }) {
  const [currentMode, setCurrentMode] = useState<GameMode>('freeforall')
  const [showTutorial, setShowTutorial] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showLore, setShowLore] = useState(false)
  const [showRajaFlash, setShowRajaFlash] = useState(false)
  const [shaking, setShaking] = useState(false)
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
  const prevPhaseRef = useRef(phase)

  useEffect(() => {
    if (prevPhaseRef.current === 'playing' && phase === 'finished') {
      const state = useGameStore.getState()
      const humanColor = state.humanPlayer
      const winner = Object.entries(state.gameState.players)
        .filter(([, p]) => !p.isEliminated)
        .map(([color]) => color)
      const won = winner.includes(humanColor)
      recordGame(won)
    }
    prevPhaseRef.current = phase
  }, [phase])

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
      requestAnimationFrame(() => {
        setShowRajaFlash(true)
        setShaking(true)
      })

      flashTimerRef.current = window.setTimeout(() => {
        setShowRajaFlash(false)
      }, 600)
      shakeTimerRef.current = window.setTimeout(() => {
        setShaking(false)
      }, 400)
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
        const timeoutId = window.setTimeout(() => {
          useGameStore.getState().rollDie()
        }, 800)
        return () => window.clearTimeout(timeoutId)
      }
      return
    }

    const state = useGameStore.getState().gameState
    if (state.currentRoll === null) {
      const rollTimeout = window.setTimeout(() => {
        useGameStore.getState().rollDie()
      }, 600)
      return () => window.clearTimeout(rollTimeout)
    }

    const moveTimeout = window.setTimeout(() => {
      useGameStore.getState().triggerBotMoveIfNeeded()
    }, 1000)

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

  return (
    <div className={`game-ui-fade-in absolute inset-0 z-20 ${shaking ? 'screen-shake' : ''}`}>
      {/* Raja capture flash overlay */}
      {showRajaFlash ? (
        <div className="raja-flash pointer-events-none absolute inset-0 z-50 bg-red-600/60" />
      ) : null}

      {/* Top controls bar */}
      <div className="absolute top-4 left-4 z-30 flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-stone-500/50 bg-stone-800/90 px-3 py-1.5 text-sm font-medium text-stone-300 backdrop-blur-sm transition hover:bg-stone-700"
        >
          Menu
        </button>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="rounded-md border border-stone-500/70 bg-stone-800/90 px-3 py-1.5 text-sm font-medium text-stone-100 backdrop-blur-sm transition hover:bg-stone-700"
        >
          Settings
        </button>
        <button
          type="button"
          onClick={() => setShowTutorial(true)}
          className="rounded-md border border-amber-500/50 bg-amber-900/30 px-3 py-1.5 text-sm font-medium text-amber-200 backdrop-blur-sm transition hover:bg-amber-800/40"
        >
          Learn to Play
        </button>
        <button
          type="button"
          onClick={() => setShowLore(true)}
          className="rounded-md border border-stone-500/50 bg-stone-800/90 px-3 py-1.5 text-sm font-medium text-stone-300 backdrop-blur-sm transition hover:bg-stone-700"
        >
          About
        </button>
      </div>

      {/* Turn indicator */}
      <div className="pointer-events-none absolute top-4 left-1/2 z-30 -translate-x-1/2">
        <TurnIndicator />
      </div>

      {/* Right panel: Die + Move History */}
      <div className="absolute right-4 top-1/2 z-30 w-72 -translate-y-1/2">
        <DieRoll />
        <div className="mt-4">
          <MoveHistory />
        </div>
      </div>

      {/* Overlays */}
      {phase === 'finished' ? (
        <GameOver
          players={players}
          moveHistory={moveHistory}
          onPlayAgain={handlePlayAgain}
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
  )
}

function OnlineFlow({ onBack }: { onBack: () => void }) {
  const { user, loading, configured } = useAuth()
  const onlinePhase = useMultiplayerStore((s) => s.onlinePhase)

  if (loading) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center">
        <p className="text-stone-400">Loading...</p>
      </div>
    )
  }

  if (!configured) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-xl border border-stone-500/50 bg-stone-900/95 p-6 text-center shadow-2xl backdrop-blur-sm">
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
    return (
      <div className="absolute inset-0 z-30">
        <AuthScreen onAuthenticated={() => {}} />
      </div>
    )
  }

  if (onlinePhase === 'playing') {
    return (
      <div className="absolute inset-0 z-20">
        <OnlineGame />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-30">
      <Lobby onGameStart={() => {}} onBack={onBack} />
    </div>
  )
}

export default function App() {
  const [view, setView] = useState<AppView>('menu')
  const [menuVisible, setMenuVisible] = useState(true)
  const [menuFadingOut, setMenuFadingOut] = useState(false)

  useEffect(() => {
    useGameStore.getState().initGame('freeforall')
  }, [])

  const handleSelectLocal = useCallback(() => {
    setMenuFadingOut(true)
    setTimeout(() => {
      setView('local')
      setMenuVisible(false)
    }, 800)
  }, [])

  const handleSelectOnline = useCallback(() => {
    setMenuFadingOut(true)
    setTimeout(() => {
      setView('online-auth')
      setMenuVisible(false)
    }, 800)
  }, [])

  const handleBackToMenu = useCallback(() => {
    useGameStore.getState().initGame('freeforall')
    setView('menu')
    setMenuVisible(true)
    setMenuFadingOut(false)
  }, [])

  const boardDecorative = view === 'menu'

  return (
    <AuthProvider>
      <div className="menu-scene relative min-h-screen overflow-hidden">
        {/* Vignette overlay */}
        <div className="menu-vignette pointer-events-none absolute inset-0 z-10" />

        {/* Ember particles */}
        <div className="pointer-events-none absolute inset-0 z-0">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="ember" />
          ))}
        </div>

        {/* Board — always mounted */}
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <div
            className={`transition-opacity duration-700 ${boardDecorative ? 'board-breathe' : ''}`}
            style={{
              width: boardDecorative ? 320 : '100%',
              height: boardDecorative ? 320 : '100%',
              opacity: boardDecorative ? 0.25 : 1,
              padding: boardDecorative ? 0 : '0',
            }}
          >
            <Board decorative={boardDecorative} />
          </div>
        </div>

        {/* Menu overlay */}
        {menuVisible ? (
          <MainMenu
            onSelectLocal={handleSelectLocal}
            onSelectOnline={handleSelectOnline}
            fadingOut={menuFadingOut}
          />
        ) : null}

        {/* Game UI layer */}
        {view === 'local' ? (
          <LocalGame onBack={handleBackToMenu} />
        ) : null}

        {/* Online flow */}
        {view.startsWith('online') ? (
          <OnlineFlow onBack={handleBackToMenu} />
        ) : null}
      </div>
    </AuthProvider>
  )
}
