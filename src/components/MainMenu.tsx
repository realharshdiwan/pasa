import { useEffect, useState } from 'react'

interface MainMenuProps {
  onSelectLocal: () => void
  onSelectOnline: () => void
  onlineEnabled: boolean
}

export default function MainMenu({ onSelectLocal, onSelectOnline, onlineEnabled }: MainMenuProps) {
  const [visible, setVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  return (
    <div className="menu-root">
      <div className="menu-vignette" />

      <div className="menu-particles" aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => (
          <div
            key={i}
            className="menu-particle"
            style={{
              left: `${(i * 5.8) % 100}%`,
              animationDuration: `${10 + (i % 5) * 1.5}s`,
              animationDelay: `${(i * 0.7) % 6}s`,
              width: `${3 + (i % 3)}px`,
              height: `${3 + (i % 3)}px`,
            }}
          />
        ))}
      </div>

      <div className={`menu-content ${visible ? 'menu-content--visible' : ''}`}>
        <h1 className="menu-title">
          <span className="menu-title-text">Pasa</span>
          <span className="menu-title-shimmer" aria-hidden="true" />
        </h1>

        <p className="menu-subtitle">the ancient game of four kings</p>

        <div className="menu-divider" />

        <nav className="menu-buttons">
          <button
            type="button"
            onClick={onSelectLocal}
            className="menu-btn menu-btn--primary"
          >
            Local Game
          </button>
          <button
            type="button"
            onClick={onlineEnabled ? onSelectOnline : undefined}
            className={`menu-btn menu-btn--secondary ${!onlineEnabled ? 'menu-btn--disabled' : ''}`}
            disabled={!onlineEnabled}
          >
            Online Multiplayer
            {!onlineEnabled && <span className="menu-btn-hint">(requires setup)</span>}
          </button>

          {deferredPrompt && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="mt-2 text-xs font-semibold text-amber-300 hover:text-amber-200 transition flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-amber-500/50 bg-amber-950/40 shadow-lg active:scale-95"
            >
              📲 Install Pasa on Phone / Desktop
            </button>
          )}
        </nav>

        <p className="menu-tagline">four armies. one die.</p>
      </div>
    </div>
  )
}
