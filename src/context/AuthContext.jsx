import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // Track current user ID in a ref so we can skip setUser calls
  // when the token refreshes but the user hasn't actually changed.
  // Without this, every TOKEN_REFRESHED event causes a re-render cascade
  // that briefly unmounts ProtectedRoute children and looks like a page refresh.
  const currentUserIdRef = useRef(undefined)

  useEffect(() => {
    // Register the listener FIRST so we never miss an INITIAL_SESSION event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // SIGNED_OUT or no session → clear user.
      // All other events (INITIAL_SESSION, TOKEN_REFRESHED, etc.) → keep session user.
      const newUser = (event === 'SIGNED_OUT' || !session) ? null : session.user
      const newId = newUser?.id ?? null
      // Only update React state when the actual user identity changes.
      // This prevents re-render cascades from TOKEN_REFRESHED events which
      // fire with the same user identity but a freshly-issued token object.
      if (newId !== currentUserIdRef.current) {
        currentUserIdRef.current = newId
        setUser(newUser)
      }
    })

    // getSession covers the race where INITIAL_SESSION fired before we subscribed.
    // We only call setUser here if onAuthStateChange hasn't already done so
    // (i.e. currentUserIdRef is still the sentinel value `undefined`).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (currentUserIdRef.current === undefined) {
        const u = session?.user ?? null
        currentUserIdRef.current = u?.id ?? null
        setUser(u)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
