'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface SessionErrorAlertProps {
  error: { message: string; code?: string } | null
  isRefreshing: boolean
  onRefresh: () => Promise<void>
  onDismiss: () => void
}

export function SessionErrorAlert({ error, isRefreshing, onRefresh, onDismiss }: SessionErrorAlertProps) {
  if (!error) return null

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error.message}</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Refresh
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
