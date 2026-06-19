import { useEffect } from 'react'
import { playLoreRevealSound } from '../utils/sound'

interface LoreProps {
  onClose: () => void
}

export default function Lore({ onClose }: LoreProps) {
  useEffect(() => {
    playLoreRevealSound()
  }, [])

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-xl border border-stone-500/50 bg-stone-900/95 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-stone-100">The History of Chaturaji</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-stone-400 transition hover:bg-stone-700 hover:text-stone-200"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm leading-relaxed text-stone-300">
          <p>
            <strong className="text-stone-100">Chaturaji</strong> — meaning "four kings" in
            Sanskrit — is one of the oldest known board games, predating modern chess by
            centuries. It emerged in India during the early medieval period, likely between
            the 7th and 10th centuries CE.
          </p>

          <p>
            Unlike chess, which evolved into a two-player deterministic game, Chaturaji
            preserved the chaos of its🎲 <em>pasa</em> — the die. The die is not a
            concession to randomness. It is the game's defining innovation. Every turn,
            fate decides which piece you command. Strategy emerges from adapting to
            constraint.
          </p>

          <p>
            The game was played across the Indian subcontinent and influenced the
            development of Shatranj (the precursor to modern chess). When Arab scholars
            translated Indian chess texts, they encountered Chaturaji as a variant — four
            players, four armies, one die.
          </p>

          <p>
            H.J.R. Murray, in his landmark <em>A History of Chess</em> (1913), documented
            Chaturaji as a distinct game with its own ruleset. The four-player format, the
            die mechanic, and the army transfer system on Raja capture were all recorded in
            medieval Indian texts.
          </p>

          <p>
            <strong className="text-stone-100">Pasa</strong> — the Sanskrit word for die —
            gives this game its soul. The die is everything. It is the heartbeat of the
            game, the source of its drama, and the reason four friends can sit around a
            board and never know who will win.
          </p>

          <p className="border-l-2 border-amber-600 pl-3 text-xs text-stone-400">
            Primary sources: Murray, H.J.R. <em>A History of Chess</em> (1913); Bidev,
            Pavle. <em>Indian Chess</em>.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-md bg-amber-600 px-4 py-2 font-semibold text-stone-950 transition hover:bg-amber-500"
        >
          Return to Game
        </button>
      </div>
    </div>
  )
}
