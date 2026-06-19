import { useCallback, useState } from 'react'

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to Pasa',
    body: 'Pasa (Sanskrit for "die") is a 4-player strategy game from ancient India. It is the ancestor of chess. Four players, one die, inherited armies, and shifting power.',
  },
  {
    title: 'The Board',
    body: '4 players occupy the corners of an 8×8 board. Red (bottom-left), Blue (bottom-right), Yellow (top-right), Green (top-left). Each player commands 8 pieces.',
  },
  {
    title: 'The Die',
    body: 'Each turn begins with a die roll. The die has 4 faces: 2, 3, 4, 5. Each face maps to a piece type you must move:\n\n2 = Ashva (Horse)\n3 = Gaja (Elephant)\n4 = Ratha (Chariot)\n5 = Padati (Foot soldier)',
  },
  {
    title: 'Moving Pieces',
    body: 'After rolling, click a piece of the rolled type. Green highlights show legal moves. Click a green square to move.\n\n• Ashva: L-shaped knight moves\n• Gaja: exactly 2 squares diagonally (can jump)\n• Ratha: any number of squares orthogonally\n• Padati: one square forward, captures diagonally',
  },
  {
    title: 'The Raja Override',
    body: 'Your Raja (K) has no dedicated die face. But you may always choose to move your Raja instead of the rolled piece type. This is called the Raja Override — a strategic fallback on every turn.',
  },
  {
    title: 'Pass Turn',
    body: 'After rolling, you can always choose to Pass Turn instead of moving. This skips your turn and advances to the next player. Useful when no good moves exist.',
  },
  {
    title: 'Capturing & Points',
    body: 'Land on an opponent\'s piece to capture it. You earn points:\n\n• Ratha (Chariot) = 4 pts\n• Gaja (Elephant) = 3 pts\n• Ashva (Horse) = 3 pts\n• Padati (Foot soldier) = 1 pt\n• Raja = triggers elimination',
  },
  {
    title: 'Elimination & Army Transfer',
    body: 'When you capture an opponent\'s Raja, that player is eliminated. All their remaining pieces transfer to you — you now control two armies. The captured pieces change colour to yours, with a small badge showing the original owner.',
  },
  {
    title: 'Winning the Game',
    body: 'Last Raja standing wins (1st place). All other players are ranked by their capture points. Every match produces a full 1st through 4th placement.\n\nTip: Even if your Raja is captured, fight for placement — points matter!',
  },
  {
    title: 'Alliance Mode',
    body: 'Toggle between Free-for-All (every player for themselves) and Teams (Red+Yellow vs Blue+Green). In Teams mode, you cannot capture your teammate\'s pieces — until Alliance Break is triggered in the endgame.',
  },
  {
    title: 'Hints & Difficulty',
    body: 'Stuck? Use the "Show Hint" button — it suggests the best move using hard-difficulty AI analysis. You can also adjust bot difficulty between Easy, Medium, and Hard.',
  },
  {
    title: 'You\'re Ready!',
    body: 'Start a game and apply what you\'ve learned. The die will roll, pieces will move, and Rajas will fall. Good luck, strategist.',
  },
] as const

interface TutorialProps {
  onClose: () => void
}

export default function Tutorial({ onClose }: TutorialProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const step = TUTORIAL_STEPS[stepIndex]
  const isLast = stepIndex === TUTORIAL_STEPS.length - 1

  const handleNext = useCallback((): void => {
    if (isLast) {
      onClose()
      return
    }
    setStepIndex((prev) => prev + 1)
  }, [isLast, onClose])

  const handlePrev = useCallback((): void => {
    setStepIndex((prev) => Math.max(0, prev - 1))
  }, [])

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-xl border border-stone-500/50 bg-stone-900/95 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-stone-100">{step.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-stone-400 transition hover:bg-stone-700 hover:text-stone-200"
          >
            Skip
          </button>
        </div>

        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-stone-300">
          {step.body}
        </p>

        <div className="mt-2 flex items-center justify-center gap-1.5">
          {TUTORIAL_STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === stepIndex
                  ? 'w-4 bg-amber-500'
                  : i < stepIndex
                    ? 'w-1.5 bg-amber-700'
                    : 'w-1.5 bg-stone-600'
              }`}
            />
          ))}
        </div>

        <div className="mt-5 flex gap-3">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="flex-1 rounded-md border border-stone-500/50 bg-stone-700 px-4 py-2 font-medium text-stone-100 transition hover:bg-stone-600"
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 rounded-md bg-amber-600 px-4 py-2 font-semibold text-stone-950 transition hover:bg-amber-500"
          >
            {isLast ? 'Start Playing' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
