'use client'

import { useState, useCallback } from 'react'

interface SessionError {
  message: string
  code?: string
}

export function useSessionRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sessionError, setSessionError] = useState<SessionError | null>(null)

  const refreshSession = useCallback(async () => {
    setIsRefreshing(true)
    try {
      // Simulate session refresh
      await new Promise(resolve => setTimeout(resolve, 500))
      setSessionError(null)
    } catch (error) {
      setSessionError({
        message: 'Failed to refresh session',
        code: 'SESSION_REFRESH_ERROR'
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  const clearSessionError = useCallback(() => {
    setSessionError(null)
  }, [])

  const handleApiError = useCallback((error: unknown) => {
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setSessionError({
          message: 'Session expired. Please refresh or login again.',
          code: 'SESSION_EXPIRED'
        })
      }
    }
  }, [])

  return {
    isRefreshing,
    sessionError,
    refreshSession,
    clearSessionError,
    handleApiError,
  }
}
