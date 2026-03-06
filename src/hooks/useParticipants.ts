'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'
import { useAuth } from './useAuth'

type Participant = Database['public']['Tables']['participants']['Row']
type ParticipantInsert = Database['public']['Tables']['participants']['Insert']
type ParticipantUpdate = Database['public']['Tables']['participants']['Update']

interface ParticipantWithDetails extends Participant {
  ticket_tier?: {
    id: string
    name: string
    price: number
  }
  form_submission?: {
    data: Record<string, unknown>
  }
}

interface ParticipantsState {
  participants: ParticipantWithDetails[]
  loading: boolean
  error: string | null
  totalCount: number
}

export function useParticipants(eventId: string | null) {
  const { isConfigured } = useAuth()
  const [state, setState] = useState<ParticipantsState>({
    participants: [],
    loading: true,
    error: null,
    totalCount: 0
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 50

  const fetchParticipants = useCallback(async () => {
    if (!isConfigured || !eventId) {
      setState(prev => ({ ...prev, loading: false }))
      return
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      let query = supabase
        .from('participants')
        .select('*, ticket_tier:id_ticket_tiers(*), form_submissions(*)', { count: 'exact' })
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      // Search filter
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,ticket_number.ilike.%${searchQuery}%`)
      }

      // Status filter
      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      // Pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      setState({
        participants: (data || []) as ParticipantWithDetails[],
        loading: false,
        error: null,
        totalCount: count || 0
      })
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch participants'
      }))
    }
  }, [isConfigured, eventId, searchQuery, statusFilter, page])

  // Create participant
  const createParticipant = useCallback(async (data: ParticipantInsert): Promise<{ data: Participant | null; error: Error | null }> => {
    if (!isConfigured) {
      return { data: null, error: new Error('Not configured') }
    }

    try {
      // Generate ticket number
      const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`

      const { data: newParticipant, error } = await supabase
        .from('participants')
        .insert({
          ...data,
          ticket_number: data.ticket_number || ticketNumber
        })
        .select()
        .single()

      if (error) throw error

      await fetchParticipants()
      return { data: newParticipant as Participant, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }, [isConfigured, fetchParticipants])

  // Bulk create participants
  const bulkCreateParticipants = useCallback(async (participants: ParticipantInsert[]): Promise<{ success: number; errors: string[] }> => {
    if (!isConfigured) {
      return { success: 0, errors: ['Not configured'] }
    }

    const errors: string[] = []
    let success = 0

    for (const participant of participants) {
      try {
        const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
        
        const { error } = await supabase
          .from('participants')
          .insert({
            ...participant,
            ticket_number: ticketNumber
          })

        if (error) {
          errors.push(`${participant.name || participant.email}: ${error.message}`)
        } else {
          success++
        }
      } catch (err) {
        errors.push(`${participant.name || participant.email}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    await fetchParticipants()
    return { success, errors }
  }, [isConfigured, fetchParticipants])

  // Update participant (for check-in)
  const updateParticipant = useCallback(async (id: string, data: ParticipantUpdate): Promise<{ error: Error | null }> => {
    if (!isConfigured) {
      return { error: new Error('Not configured') }
    }

    try {
      const { error } = await supabase
        .from('participants')
        .update(data)
        .eq('id', id)

      if (error) throw error

      await fetchParticipants()
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }, [isConfigured, fetchParticipants])

  // Check-in participant
  const checkInParticipant = useCallback(async (id: string, checkedInBy: string): Promise<{ error: Error | null }> => {
    return updateParticipant(id, {
      status: 'checked_in',
      checked_in_at: new Date().toISOString(),
      checked_in_by: checkedInBy
    })
  }, [updateParticipant])

  // Check-in by ticket number
  const checkInByTicketNumber = useCallback(async (ticketNumber: string, checkedInBy: string): Promise<{ participant: ParticipantWithDetails | null; error: Error | null }> => {
    if (!isConfigured || !eventId) {
      return { participant: null, error: new Error('Not configured or no event') }
    }

    try {
      // Find participant
      const { data: participant, error: findError } = await supabase
        .from('participants')
        .select('*, ticket_tier:id_ticket_tiers(*)')
        .eq('event_id', eventId)
        .eq('ticket_number', ticketNumber)
        .single()

      if (findError || !participant) {
        return { participant: null, error: new Error('Participant not found') }
      }

      // Check if already checked in
      if (participant.status === 'checked_in') {
        return { participant: participant as ParticipantWithDetails, error: new Error('Already checked in') }
      }

      // Check if already won
      if (participant.status === 'won') {
        return { participant: participant as ParticipantWithDetails, error: new Error('This participant has already won a prize') }
      }

      // Update check-in
      const { error: updateError } = await supabase
        .from('participants')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString(),
          checked_in_by: checkedInBy
        })
        .eq('id', participant.id)

      if (updateError) throw updateError

      await fetchParticipants()
      return { participant: { ...participant, status: 'checked_in' } as ParticipantWithDetails, error: null }
    } catch (err) {
      return { participant: null, error: err as Error }
    }
  }, [isConfigured, eventId, fetchParticipants])

  // Delete participant
  const deleteParticipant = useCallback(async (id: string): Promise<{ error: Error | null }> => {
    if (!isConfigured) {
      return { error: new Error('Not configured') }
    }

    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchParticipants()
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }, [isConfigured, fetchParticipants])

  // Export participants to CSV
  const exportToCSV = useCallback((): string => {
    const headers = ['No', 'Name', 'Email', 'Phone', 'Company', 'Division', 'Ticket Number', 'Status', 'Check-in Time']
    const rows = state.participants.map((p, index) => [
      index + 1,
      p.name,
      p.email || '',
      p.phone || '',
      p.company || '',
      p.division || '',
      p.ticket_number,
      p.status,
      p.checked_in_at ? new Date(p.checked_in_at).toLocaleString() : ''
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return csv
  }, [state.participants])

  // Statistics
  const stats = {
    total: state.totalCount,
    registered: state.participants.filter(p => p.status === 'registered').length,
    checkedIn: state.participants.filter(p => p.status === 'checked_in').length,
    won: state.participants.filter(p => p.status === 'won').length
  }

  // Real-time subscription
  useEffect(() => {
    if (!isConfigured || !eventId) return

    const channel = supabase
      .channel(`participants-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `event_id=eq.${eventId}`
        },
        () => {
          fetchParticipants()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isConfigured, eventId, fetchParticipants])

  // Initial fetch
  useEffect(() => {
    fetchParticipants()
  }, [fetchParticipants])

  return {
    ...state,
    stats,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    pageSize,
    totalPages: Math.ceil(state.totalCount / pageSize),
    fetchParticipants,
    createParticipant,
    bulkCreateParticipants,
    updateParticipant,
    checkInParticipant,
    checkInByTicketNumber,
    deleteParticipant,
    exportToCSV
  }
}

// Hook for random participant selection (draw)
export function useRandomParticipant(eventId: string) {
  const { isConfigured } = useAuth()
  const [availableParticipants, setAvailableParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch participants eligible for draw (checked in, not won)
  const fetchAvailableParticipants = useCallback(async () => {
    if (!isConfigured || !eventId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'checked_in')

      if (error) throw error
      setAvailableParticipants(data || [])
    } catch (err) {
      console.error('Error fetching available participants:', err)
    } finally {
      setLoading(false)
    }
  }, [isConfigured, eventId])

  // Get random participant
  const getRandomParticipant = useCallback((): Participant | null => {
    if (availableParticipants.length === 0) return null
    const randomIndex = Math.floor(Math.random() * availableParticipants.length)
    return availableParticipants[randomIndex]
  }, [availableParticipants])

  // Remove participant from available list (after winning)
  const removeParticipant = useCallback((participantId: string) => {
    setAvailableParticipants(prev => prev.filter(p => p.id !== participantId))
  }, [])

  useEffect(() => {
    fetchAvailableParticipants()
  }, [fetchAvailableParticipants])

  return {
    availableParticipants,
    loading,
    fetchAvailableParticipants,
    getRandomParticipant,
    removeParticipant,
    count: availableParticipants.length
  }
}
