import { useCallback, useState } from 'react'
import { useAuth } from '../contexts/useAuth'

interface AuthScreenProps {
  onAuthenticated: () => void
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const { signIn, signUp, signInWithGoogle, configured } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password)

    setLoading(false)

    if (result.error) {
      setError(result.error.message)
    } else {
      onAuthenticated()
    }
  }, [mode, email, password, signIn, signUp, onAuthenticated])

  const handleGoogle = useCallback(async () => {
    setError(null)
    const result = await signInWithGoogle()
    if (result.error) {
      setError(result.error.message)
    }
  }, [signInWithGoogle])

  if (!configured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-900 p-4">
        <div className="w-full max-w-sm rounded-xl border border-stone-500/50 bg-stone-900/95 p-6 text-center shadow-2xl">
          <h2 className="text-xl font-bold text-stone-100">Online Multiplayer</h2>
          <p className="mt-4 text-sm text-stone-400">
            Supabase is not configured yet. Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables to enable online play.
          </p>
          <p className="mt-2 text-xs text-stone-500">
            See supabase/migrations/001_initial_schema.sql for the database setup.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-900 p-4">
      <div className="w-full max-w-sm rounded-xl border border-stone-500/50 bg-stone-900/95 p-6 shadow-2xl">
        <h2 className="text-center text-xl font-bold text-stone-100">
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label className="text-xs text-stone-400" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-stone-100 focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-stone-400" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-stone-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {error ? (
            <p className="text-xs text-red-400">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-amber-600 px-4 py-2 font-semibold text-stone-950 transition hover:bg-amber-500 disabled:opacity-50"
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-600" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-stone-900 px-2 text-stone-500">or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="w-full rounded-md border border-stone-500/50 bg-stone-700 px-4 py-2 font-medium text-stone-100 transition hover:bg-stone-600"
        >
          Continue with Google
        </button>

        <p className="mt-4 text-center text-xs text-stone-400">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null) }}
            className="text-amber-400 hover:underline"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
