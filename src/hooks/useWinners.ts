'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { Tables, TablesInsert, Enums } from '@/integrations/supabase/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Types
export type Winner = Tables<'winners'>
export type WinnerInsert = TablesInsert<'winners'>
export type DrawAnimation = Enums<'draw_animation'>

export interface WinnerWithDetails extends Winner {
  participant: Tables<'participants'>
  prize: Tables<'prizes'>
}

interface UseWinnersOptions {
  eventId: string
  realtime?: boolean
}

interface UseWinnersReturn {
  winners: WinnerWithDetails[]
  loading: boolean
  error: Error | null
  fetchWinners: () => Promise<void>
  createWinner: (data: WinnerInsert) => Promise<{ data: Winner | null; error: Error | null }>
  drawWinner: (prizeId: string, animationUsed: DrawAnimation) => Promise<{ data: Winner | null; error: Error | null }>
  sendWinnerEmail: (winnerId: string) => Promise<{ error: Error | null }>
  exportWinnersToCSV: () => string
  exportWinnersToExcel: () => string
  getWinnerById: (id: string) => Promise<WinnerWithDetails | null>
  refreshWinners: () => Promise<void>
  winnersCount: number
}

export function useWinners(options: UseWinnersOptions): UseWinnersReturn {
  const { eventId, realtime = false } = options
  const [winners, setWinners] = useState<WinnerWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  // Fetch winners with participant and prize details
  const fetchWinners = useCallback(async () => {
    if (!eventId) {
      setWinners([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('winners')
        .select(`
          *,
          participant:participants(id, name, email, phone, company, division, ticket_number, status),
          prize:prizes(id, name, category, description, image_url)
        `)
        .eq('event_id', eventId)
        .order('drawn_at', { ascending: false })

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setWinners(
        (data || []).map((w) => ({
          ...w,
          participant: w.participant as Tables<'participants'>,
          prize: w.prize as Tables<'prizes'>,
        })) as WinnerWithDetails[]
      )
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  // Create a winner (from draw)
  const createWinner = async (data: WinnerInsert) => {
    try {
      const { data: newWinner, error: createError } = await supabase
        .from('winners')
        .insert(data)
        .select()
        .single()

      if (createError) {
        return { data: null, error: new Error(createError.message) }
      }

      return { data: newWinner, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }

  // Draw a winner for a specific prize
  const drawWinner = async (prizeId: string, animationUsed: DrawAnimation) => {
    try {
      // 1. Get the prize and check remaining quantity
      const { data: prize, error: prizeError } = await supabase
        .from('prizes')
        .select('*')
        .eq('id', prizeId)
        .single()

      if (prizeError || !prize) {
        return { data: null, error: new Error('Prize not found') }
      }

      if (prize.remaining_quantity <= 0) {
        return { data: null, error: new Error('No prizes remaining for this item') }
      }

      // 2. Get the event to check check-in requirement
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('checkin_required_for_draw')
        .eq('id', eventId)
        .single()

      if (eventError || !event) {
        return { data: null, error: new Error('Event not found') }
      }

      // 3. Get eligible participants
      // - Not already won this specific prize
      // - If check-in required, must be checked in
      let eligibleQuery = supabase
        .from('participants')
        .select('id')
        .eq('event_id', eventId)

      if (event.checkin_required_for_draw) {
        eligibleQuery = eligibleQuery.eq('status', 'checked_in')
      }

      const { data: eligibleParticipants, error: eligibleError } = await eligibleQuery

      if (eligibleError) {
        return { data: null, error: new Error('Failed to get eligible participants') }
      }

      if (!eligibleParticipants || eligibleParticipants.length === 0) {
        return { data: null, error: new Error('No eligible participants available') }
      }

      // 4. Exclude participants who already won this specific prize
      const { data: existingWinners } = await supabase
        .from('winners')
        .select('participant_id')
        .eq('event_id', eventId)
        .eq('prize_id', prizeId)

      const existingWinnerIds = new Set((existingWinners || []).map((w) => w.participant_id))

      const availableParticipants = eligibleParticipants.filter(
        (p) => !existingWinnerIds.has(p.id)
      )

      if (availableParticipants.length === 0) {
        return { data: null, error: new Error('All eligible participants have already won this prize') }
      }

      // 5. Random selection
      const randomIndex = Math.floor(Math.random() * availableParticipants.length)
      const selectedParticipantId = availableParticipants[randomIndex].id

      // 6. Create the winner record
      const now = new Date().toISOString()
      const winnerData: WinnerInsert = {
        event_id: eventId,
        participant_id: selectedParticipantId,
        prize_id: prizeId,
        drawn_at: now,
        animation_used: animationUsed,
        email_sent: false,
      }

      const { data: newWinner, error: createError } = await supabase
        .from('winners')
        .insert(winnerData)
        .select(`
          *,
          participant:participants(id, name, email, phone, company, division, ticket_number, status),
          prize:prizes(id, name, category, description, image_url)
        `)
        .single()

      if (createError) {
        return { data: null, error: new Error(createError.message) }
      }

      // 7. Update prize remaining quantity
      await supabase
        .from('prizes')
        .update({
          remaining_quantity: prize.remaining_quantity - 1,
          updated_at: now,
        })
        .eq('id', prizeId)

      // 8. Update participant status to 'won'
      await supabase
        .from('participants')
        .update({
          status: 'won',
          updated_at: now,
        })
        .eq('id', selectedParticipantId)

      // 9. Optimistically add to local state
      const winnerWithDetails: WinnerWithDetails = {
        ...newWinner,
        participant: newWinner.participant as Tables<'participants'>,
        prize: newWinner.prize as Tables<'prizes'>,
      }
      
      setWinners((prev) => [winnerWithDetails, ...prev])

      return { data: newWinner, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }

  // Send winner notification email
  const sendWinnerEmail = async (winnerId: string) => {
    try {
      const { data: winner, error: fetchError } = await supabase
        .from('winners')
        .select(`
          *,
          participant:participants(id, name, email, ticket_number),
          prize:prizes(id, name),
          event:events(id, name, claim_instructions)
        `)
        .eq('id', winnerId)
        .single()

      if (fetchError || !winner) {
        return { error: new Error('Winner not found') }
      }

      // In a real app, this would call an API endpoint to send the email
      // For now, we'll just update the email_sent flag
      const { error: updateError } = await supabase
        .from('winners')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
        })
        .eq('id', winnerId)

      if (updateError) {
        return { error: new Error(updateError.message) }
      }

      // Optimistically update local state
      setWinners((prev) =>
        prev.map((w) =>
          w.id === winnerId ? { ...w, email_sent: true, email_sent_at: new Date().toISOString() } : w
        )
      )

      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  // Export winners to CSV
  const exportWinnersToCSV = (): string => {
    const headers = [
      'Drawn At',
      'Ticket Number',
      'Participant Name',
      'Email',
      'Phone',
      'Company',
      'Division',
      'Prize Name',
      'Prize Category',
      'Email Sent',
      'Email Sent At',
    ]

    const rows = winners.map((w) => [
      w.drawn_at,
      w.participant.ticket_number,
      w.participant.name,
      w.participant.email || '',
      w.participant.phone || '',
      w.participant.company || '',
      w.participant.division || '',
      w.prize.name,
      w.prize.category,
      w.email_sent ? 'Yes' : 'No',
      w.email_sent_at || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => {
          const cellStr = String(cell).replace(/"/g, '""')
          return cellStr.includes(',') || cellStr.includes('\n') ? `"${cellStr}"` : cellStr
        }).join(',')
      ),
    ].join('\n')

    return csvContent
  }

  // Export winners to Excel (TSV format)
  const exportWinnersToExcel = (): string => {
    const headers = [
      'Drawn At',
      'Ticket Number',
      'Participant Name',
      'Email',
      'Phone',
      'Company',
      'Division',
      'Prize Name',
      'Prize Category',
      'Email Sent',
      'Email Sent At',
    ]

    const rows = winners.map((w) => [
      w.drawn_at,
      w.participant.ticket_number,
      w.participant.name,
      w.participant.email || '',
      w.participant.phone || '',
      w.participant.company || '',
      w.participant.division || '',
      w.prize.name,
      w.prize.category,
      w.email_sent ? 'Yes' : 'No',
      w.email_sent_at || '',
    ])

    const tsvContent = [
      headers.join('\t'),
      ...rows.map((row) =>
        row.map((cell) => String(cell).replace(/\t/g, ' ')).join('\t')
      ),
    ].join('\n')

    return tsvContent
  }

  // Get winner by ID
  const getWinnerById = async (id: string): Promise<WinnerWithDetails | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('winners')
        .select(`
          *,
          participant:participants(id, name, email, phone, company, division, ticket_number, status),
          prize:prizes(id, name, category, description, image_url)
        `)
        .eq('id', id)
        .single()

      if (fetchError) {
        return null
      }

      return {
        ...data,
        participant: data.participant as Tables<'participants'>,
        prize: data.prize as Tables<'prizes'>,
      } as WinnerWithDetails
    } catch (err) {
      return null
    }
  }

  // Refresh winners
  const refreshWinners = async () => {
    await fetchWinners()
  }

  // Calculate count
  const winnersCount = winners.length

  // Initial fetch
  useEffect(() => {
    fetchWinners()
  }, [fetchWinners])

  // Real-time subscription
  useEffect(() => {
    if (!realtime || !eventId) return

    const channelName = `winners-${eventId}`
    const newChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'winners',
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          const newWinner = payload.new as Winner
          
          // Fetch full details for the new winner
          const { data } = await supabase
            .from('winners')
            .select(`
              *,
              participant:participants(id, name, email, phone, company, division, ticket_number, status),
              prize:prizes(id, name, category, description, image_url)
            `)
            .eq('id', newWinner.id)
            .single()

          if (data) {
            const winnerWithDetails: WinnerWithDetails = {
              ...data,
              participant: data.participant as Tables<'participants'>,
              prize: data.prize as Tables<'prizes'>,
            }
            
            setWinners((prev) => {
              if (prev.some((w) => w.id === winnerWithDetails.id)) return prev
              return [winnerWithDetails, ...prev]
            })
          }
        }
      )
      .subscribe()

    setChannel(newChannel)

    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel)
      }
    }
  }, [realtime, eventId])

  return {
    winners,
    loading,
    error,
    fetchWinners,
    createWinner,
    drawWinner,
    sendWinnerEmail,
    exportWinnersToCSV,
    exportWinnersToExcel,
    getWinnerById,
    refreshWinners,
    winnersCount,
  }
}

// Hook for a single winner
export function useWinner(winnerId: string | null) {
  const [winner, setWinner] = useState<WinnerWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchWinner = useCallback(async () => {
    if (!winnerId) {
      setWinner(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('winners')
        .select(`
          *,
          participant:participants(id, name, email, phone, company, division, ticket_number, status),
          prize:prizes(id, name, category, description, image_url)
        `)
        .eq('id', winnerId)
        .single()

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setWinner({
        ...data,
        participant: data.participant as Tables<'participants'>,
        prize: data.prize as Tables<'prizes'>,
      } as WinnerWithDetails)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [winnerId])

  useEffect(() => {
    fetchWinner()
  }, [fetchWinner])

  return {
    winner,
    loading,
    error,
    refreshWinner: fetchWinner,
  }
}

// Utility function to download winner export
export function downloadWinnersExport(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
