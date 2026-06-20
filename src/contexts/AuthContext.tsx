import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { User, AuthError } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export interface AuthState {
  user: User | null
  loading: boolean
  configured: boolean
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

function makeConfigError(message: string): AuthError {
  const err = { message, name: 'ConfigError', code: 'CONFIG_ERROR', status: 0, __isAuthError: true, toJSON: () => ({ message }) }
  return err as unknown as AuthError
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const configured = isSupabaseConfigured()
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    if (!configured) {
      const t = setTimeout(() => {
        if (mountedRef.current) setLoading(false)
      }, 0)
      return () => { mountedRef.current = false; clearTimeout(t) }
    }

    const timeout = setTimeout(() => {
      if (mountedRef.current) setLoading(false)
    }, 3000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      clearTimeout(timeout)
      if (mountedRef.current) {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout)
      if (mountedRef.current) {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    }).catch(() => {
      clearTimeout(timeout)
      if (mountedRef.current) setLoading(false)
    })

    return () => {
      mountedRef.current = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [configured])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!configured) return { error: makeConfigError('Supabase not configured') }
    return supabase.auth.signUp({ email, password })
  }, [configured])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!configured) return { error: makeConfigError('Supabase not configured') }
    return supabase.auth.signInWithPassword({ email, password })
  }, [configured])

  const signInWithGoogle = useCallback(async () => {
    if (!configured) return { error: makeConfigError('Supabase not configured') }
    return supabase.auth.signInWithOAuth({ provider: 'google' })
  }, [configured])

  const signOut = useCallback(async () => {
    if (!configured) return
    await supabase.auth.signOut()
  }, [configured])

  return (
    <AuthContext.Provider value={{ user, loading, configured, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
