import { useAuth } from '../contexts/useAuth'

interface MainMenuProps {
  onSelectLocal: () => void
  onSelectOnline: () => void
}

export default function MainMenu({ onSelectLocal, onSelectOnline }: MainMenuProps) {
  const { configured } = useAuth()

  return (
    <div className="menu-bg flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="mb-10 text-center select-none">
          <div className="menu-die mx-auto mb-4">
            <svg viewBox="0 0 48 48" className="h-16 w-16" fill="none">
              <rect x="4" y="4" width="40" height="40" rx="8" stroke="currentColor" strokeWidth="3" className="text-amber-500/80" />
              <circle cx="16" cy="16" r="3" fill="currentColor" className="text-amber-400" />
              <circle cx="32" cy="16" r="3" fill="currentColor" className="text-amber-400" />
              <circle cx="16" cy="32" r="3" fill="currentColor" className="text-amber-400" />
              <circle cx="32" cy="32" r="3" fill="currentColor" className="text-amber-400" />
            </svg>
          </div>
          <h1 className="menu-title text-5xl font-black tracking-tight text-stone-100">
            Pasa
          </h1>
          <p className="menu-subtitle mt-2 text-sm tracking-wide text-stone-400">
            Chaturaji — the ancient game of four kings
          </p>
        </div>

        {/* Mode Cards */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={onSelectLocal}
            className="menu-card group w-full rounded-2xl border border-stone-600/40 bg-gradient-to-br from-stone-800/80 to-stone-900/90 p-5 text-left shadow-xl transition-all duration-200 hover:border-amber-500/30 hover:shadow-amber-900/20 hover:shadow-2xl hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 transition-colors group-hover:bg-amber-500/25">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-stone-100">Local Game</h2>
                <p className="mt-1 text-sm text-stone-400">
                  Pass and play on one device against AI opponents
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center rounded-full bg-stone-700/60 px-2.5 py-0.5 text-xs text-stone-300">3 AI levels</span>
                  <span className="inline-flex items-center rounded-full bg-stone-700/60 px-2.5 py-0.5 text-xs text-stone-300">Free-for-all</span>
                  <span className="inline-flex items-center rounded-full bg-stone-700/60 px-2.5 py-0.5 text-xs text-stone-300">Teams</span>
                </div>
              </div>
              <svg viewBox="0 0 20 20" className="mt-1 h-5 w-5 shrink-0 text-stone-500 transition-colors group-hover:text-amber-400" fill="currentColor">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </div>
          </button>

          <button
            type="button"
            onClick={onSelectOnline}
            disabled={!configured}
            className={`menu-card group w-full rounded-2xl border p-5 text-left shadow-xl transition-all duration-200 ${
              configured
                ? 'border-stone-600/40 bg-gradient-to-br from-stone-800/80 to-stone-900/90 hover:border-amber-500/30 hover:shadow-amber-900/20 hover:shadow-2xl hover:-translate-y-0.5'
                : 'cursor-not-allowed border-stone-700/30 bg-stone-900/60'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
                configured
                  ? 'bg-amber-500/15 text-amber-400 group-hover:bg-amber-500/25'
                  : 'bg-stone-700/30 text-stone-500'
              }`}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-stone-100">Online Multiplayer</h2>
                  {!configured && (
                    <span className="rounded-full bg-stone-700 px-2 py-0.5 text-xs text-stone-400">Setup required</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-stone-400">
                  {configured
                    ? 'Create a room and share the code with friends'
                    : 'Requires Supabase — add env vars to enable'}
                </p>
                {configured && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-stone-700/60 px-2.5 py-0.5 text-xs text-stone-300">Room codes</span>
                    <span className="inline-flex items-center rounded-full bg-stone-700/60 px-2.5 py-0.5 text-xs text-stone-300">Real-time</span>
                    <span className="inline-flex items-center rounded-full bg-stone-700/60 px-2.5 py-0.5 text-xs text-stone-300">2-4 players</span>
                  </div>
                )}
              </div>
              {configured && (
                <svg viewBox="0 0 20 20" className="mt-1 h-5 w-5 shrink-0 text-stone-500 transition-colors group-hover:text-amber-400" fill="currentColor">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs text-stone-600">
            4 players · 1 die · inherited armies
          </p>
        </div>
      </div>
    </div>
  )
}
