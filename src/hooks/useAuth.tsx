'use client'

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import type { Json } from '@/integrations/supabase/types'

interface UserProfile {
  id: string
  user_id: string
  organization_id: string | null
  full_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  isConfigured: boolean
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updateProfile: (data: { full_name?: string; phone?: string; avatar_url?: string }) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const isConfigured = isSupabaseConfigured()

  const fetchProfile = useCallback(async (userId: string) => {
    if (!isConfigured) return null
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }
      
      setProfile(data as UserProfile)
      return data
    } catch (err) {
      console.error('Error fetching profile:', err)
      return null
    }
  }, [isConfigured])

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id)
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        
        if (newSession?.user) {
          await fetchProfile(newSession.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [isConfigured, fetchProfile])

  const signUp = async (email: string, password: string, fullName?: string) => {
    if (!isConfigured) {
      return { error: new Error('Supabase is not configured') as AuthError }
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0]
        }
      }
    })

    return { error }
  }

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: new Error('Supabase is not configured') as AuthError }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    return { error }
  }

  const signOut = async () => {
    if (!isConfigured) return
    
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  const resetPassword = async (email: string) => {
    if (!isConfigured) {
      return { error: new Error('Supabase is not configured') as AuthError }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    return { error }
  }

  const updateProfile = async (data: { full_name?: string; phone?: string; avatar_url?: string }) => {
    if (!isConfigured || !user) {
      return { error: new Error('Not authenticated') }
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error

      await fetchProfile(user.id)
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isConfigured,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for checking if user is authenticated
export function useRequireAuth(redirectUrl = '/auth') {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      // In a real app, you'd use router.push(redirectUrl)
      window.location.href = redirectUrl
    }
  }, [user, loading, redirectUrl])

  const isRedirecting = !loading && !user

  return { user, loading: loading || isRedirecting }
}

// Hook for checking admin role
export function useAdmin() {
  const { user, profile, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user || !profile) {
        setIsAdmin(false)
        return
      }

      try {
        const { data } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        })
        setIsAdmin(data === true)
      } catch {
        setIsAdmin(false)
      }
    }

    if (!loading) {
      checkAdmin()
    }
  }, [user, profile, loading])

  return { isAdmin, loading }
}
