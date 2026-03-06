'use client'

interface AuditLogEntry {
  action: string
  targetType: string
  targetId?: string
  details?: Record<string, unknown>
}

export function useAdminAuditLog() {
  const logAction = async (entry: AuditLogEntry) => {
    // In a real app, this would send to an API
    console.log('Audit Log:', {
      ...entry,
      timestamp: new Date().toISOString(),
    })
  }

  return { logAction }
}
