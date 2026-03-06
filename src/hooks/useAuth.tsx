'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  full_name?: string
  role?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('eventku-user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser)
  const [loading] = useState(false)
  const router = useRouter()

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      // Simulate authentication - in real app, this would call an API
      if (email && password.length >= 6) {
        const newUser: User = {
          id: crypto.randomUUID(),
          email,
          full_name: email.split('@')[0],
          role: 'owner'
        }
        setUser(newUser)
        localStorage.setItem('eventku-user', JSON.stringify(newUser))
        return { error: null }
      }
      return { error: new Error('Invalid credentials') }
    } catch (error) {
      return { error: error as Error }
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      // Simulate registration - in real app, this would call an API
      if (email && password.length >= 6) {
        const newUser: User = {
          id: crypto.randomUUID(),
          email,
          full_name: fullName || email.split('@')[0],
          role: 'owner'
        }
        setUser(newUser)
        localStorage.setItem('eventku-user', JSON.stringify(newUser))
        return { error: null }
      }
      return { error: new Error('Invalid registration data') }
    } catch (error) {
      return { error: error as Error }
    }
  }, [])

  const signOut = useCallback(async () => {
    setUser(null)
    localStorage.removeItem('eventku-user')
    router.push('/')
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
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
