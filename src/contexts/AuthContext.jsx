import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../config/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, metadata = {}) => {
    try {
      console.log('🔵 Sign up attempt:', { email: email.trim().toLowerCase() })
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/`,
        },
      })
      
      console.log('🔵 Sign up response:', { 
        hasData: !!data, 
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        hasError: !!error 
      })
      
      if (error) {
        console.error('🔴 Sign up error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          fullError: error
        })
        
        // Try to get more details from the error
        if (error.message) {
          console.error('Error message:', error.message)
        }
        if (error.status) {
          console.error('Error status:', error.status)
        }
        
        return { data: null, error }
      }
      
      console.log('✅ Sign up successful')
      return { data, error: null }
    } catch (err) {
      console.error('🔴 Sign up exception:', err)
      return { data: null, error: err }
    }
  }

  const signIn = async (email, password) => {
    try {
      console.log('Attempting sign in with email:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      
      if (error) {
        console.error('Sign in error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          fullError: error
        })
        return { data: null, error }
      }
      
      console.log('Sign in successful:', data)
      return { data, error: null }
    } catch (err) {
      console.error('Sign in exception:', err)
      return { data: null, error: err }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

