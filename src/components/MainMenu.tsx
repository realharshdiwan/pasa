import { useAuth } from '../contexts/useAuth'

interface MainMenuProps {
  onSelectLocal: () => void
  onSelectOnline: () => void
  fadingOut?: boolean
}

export default function MainMenu({ onSelectLocal, onSelectOnline, fadingOut }: MainMenuProps) {
  const { configured } = useAuth()

  return (
    <div
      className={`menu-overlay absolute inset-0 z-30 flex flex-col items-center justify-center ${fadingOut ? 'menu-overlay-fade-out' : ''}`}
    >
      {/* Content sits above the board */}
      <div className="relative z-10 flex flex-col items-center select-none px-4">
        {/* Title */}
        <div className="gold-title-wrapper">
          <h1 className="gold-title text-6xl font-serif font-bold tracking-wider md:text-7xl">
            Pasa
          </h1>
        </div>

        {/* Subtitle */}
        <p
          className="mt-3 text-sm tracking-widest uppercase"
          style={{ color: '#c6a27a' }}
        >
          the ancient game of four kings
        </p>

        {/* Space for the board (rendered by parent behind this overlay) */}
        <div className="h-64 md:h-72" />

        {/* Ornate divider */}
        <div className="ornate-line mx-auto mb-8 w-40" />

        {/* Buttons */}
        <div className="flex flex-col items-center gap-5">
          <button
            type="button"
            onClick={onSelectLocal}
            className="menu-button text-xl tracking-wide"
          >
            Local Game
          </button>
          <button
            type="button"
            onClick={onSelectOnline}
            disabled={!configured}
            className="menu-button text-lg tracking-wide opacity-50"
          >
            Online Multiplayer
          </button>
          <button
            type="button"
            disabled
            className="menu-button cursor-default text-base tracking-wide opacity-30"
          >
            Settings
          </button>
        </div>

        {/* Bottom tagline */}
        <p
          className="mt-14 text-xs tracking-widest uppercase"
          style={{ color: '#8c6b45' }}
        >
          four armies. one die.
        </p>
      </div>
    </div>
  )
}
