'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'
import { useAuth } from './useAuth'

type Prize = Database['public']['Tables']['prizes']['Row']
type PrizeInsert = Database['public']['Tables']['prizes']['Insert']
type PrizeUpdate = Database['public']['Tables']['prizes']['Update']
type Winner = Database['public']['Tables']['winners']['Row']
type WinnerInsert = Database['public']['Tables']['winners']['Insert']

interface PrizeWithStats extends Prize {
  drawn_count?: number
  remaining_count?: number
}

interface WinnersState {
  winners: (Winner & { participant?: Prize; prize?: Prize })[]
  loading: boolean
  error: string | null
}

export function usePrizes(eventId: string | null) {
  const { isConfigured } = useAuth()
  const [prizes, setPrizes] = useState<PrizeWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrizes = useCallback(async () => {
    if (!isConfigured || !eventId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch prizes with winner counts
      const { data, error: fetchError } = await supabase
        .from('prizes')
        .select(`
          *,
          winners(count)
        `)
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true })
        .order('category', { ascending: true })

      if (fetchError) throw fetchError

      const transformedData: PrizeWithStats[] = (data || []).map(prize => {
        const drawnCount = (prize.winners as unknown as { count: number }[])?.[0]?.count || 0
        return {
          ...prize,
          drawn_count: drawnCount,
          remaining_count: prize.quantity - drawnCount
        }
      })

      setPrizes(transformedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prizes')
    } finally {
      setLoading(false)
    }
  }, [isConfigured, eventId])

  const createPrize = useCallback(async (data: PrizeInsert): Promise<{ data: Prize | null; error: Error | null }> => {
    if (!isConfigured) {
      return { data: null, error: new Error('Not configured') }
    }

    try {
      const { data: newPrize, error } = await supabase
        .from('prizes')
        .insert({
          ...data,
          remaining_quantity: data.quantity
        })
        .select()
        .single()

      if (error) throw error

      await fetchPrizes()
      return { data: newPrize as Prize, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }, [isConfigured, fetchPrizes])

  const updatePrize = useCallback(async (id: string, data: PrizeUpdate): Promise<{ error: Error | null }> => {
    if (!isConfigured) {
      return { error: new Error('Not configured') }
    }

    try {
      const { error } = await supabase
        .from('prizes')
        .update(data)
        .eq('id', id)

      if (error) throw error

      await fetchPrizes()
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }, [isConfigured, fetchPrizes])

  const deletePrize = useCallback(async (id: string): Promise<{ error: Error | null }> => {
    if (!isConfigured) {
      return { error: new Error('Not configured') }
    }

    try {
      const { error } = await supabase
        .from('prizes')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchPrizes()
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }, [isConfigured, fetchPrizes])

  // Get prizes by category
  const getPrizesByCategory = useCallback((category: Database['public']['Enums']['prize_category']) => {
    return prizes.filter(p => p.category === category && p.remaining_quantity > 0)
  }, [prizes])

  // Get random prize
  const getRandomPrize = useCallback((category?: Database['public']['Enums']['prize_category']): PrizeWithStats | null => {
    const availablePrizes = category
      ? prizes.filter(p => p.category === category && p.remaining_quantity > 0)
      : prizes.filter(p => p.remaining_quantity > 0)

    if (availablePrizes.length === 0) return null

    // Weighted random selection based on remaining quantity
    const totalRemaining = availablePrizes.reduce((sum, p) => sum + (p.remaining_quantity || 0), 0)
    let random = Math.random() * totalRemaining

    for (const prize of availablePrizes) {
      random -= (prize.remaining_quantity || 0)
      if (random <= 0) {
        return prize
      }
    }

    return availablePrizes[0]
  }, [prizes])

  // Stats
  const stats = {
    total: prizes.length,
    totalQuantity: prizes.reduce((sum, p) => sum + p.quantity, 0),
    drawn: prizes.reduce((sum, p) => sum + (p.drawn_count || 0), 0),
    remaining: prizes.reduce((sum, p) => sum + (p.remaining_count || 0), 0),
    hiburan: prizes.filter(p => p.category === 'hiburan'),
    utama: prizes.filter(p => p.category === 'utama'),
    grandPrize: prizes.filter(p => p.category === 'grand_prize')
  }

  // Real-time subscription
  useEffect(() => {
    if (!isConfigured || !eventId) return

    const channel = supabase
      .channel(`prizes-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prizes',
          filter: `event_id=eq.${eventId}`
        },
        () => {
          fetchPrizes()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isConfigured, eventId, fetchPrizes])

  useEffect(() => {
    fetchPrizes()
  }, [fetchPrizes])

  return {
    prizes,
    loading,
    error,
    stats,
    fetchPrizes,
    createPrize,
    updatePrize,
    deletePrize,
    getPrizesByCategory,
    getRandomPrize
  }
}

export function useWinners(eventId: string | null) {
  const { isConfigured, user } = useAuth()
  const [state, setState] = useState<WinnersState>({
    winners: [],
    loading: true,
    error: null
  })

  const fetchWinners = useCallback(async () => {
    if (!isConfigured || !eventId) {
      setState(prev => ({ ...prev, loading: false }))
      return
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data, error } = await supabase
        .from('winners')
        .select(`
          *,
          participants(*),
          prizes(*)
        `)
        .eq('event_id', eventId)
        .order('drawn_at', { ascending: false })

      if (error) throw error

      setState({
        winners: (data || []).map(w => ({
          ...w,
          participant: w.participants as unknown as Prize,
          prize: w.prizes as unknown as Prize
        })),
        loading: false,
        error: null
      })
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch winners'
      }))
    }
  }, [isConfigured, eventId])

  const createWinner = useCallback(async (
    participantId: string,
    prizeId: string,
    animationUsed: Database['public']['Enums']['draw_animation']
  ): Promise<{ data: Winner | null; error: Error | null }> => {
    if (!isConfigured || !eventId) {
      return { data: null, error: new Error('Not configured or no event') }
    }

    try {
      // Start transaction
      // 1. Create winner record
      const { data: winner, error: winnerError } = await supabase
        .from('winners')
        .insert({
          event_id: eventId,
          participant_id: participantId,
          prize_id: prizeId,
          animation_used: animationUsed
        })
        .select()
        .single()

      if (winnerError) throw winnerError

      // 2. Update participant status
      const { error: participantError } = await supabase
        .from('participants')
        .update({ status: 'won' })
        .eq('id', participantId)

      if (participantError) throw participantError

      // 3. Update prize remaining quantity
      const { error: prizeError } = await supabase.rpc('decrement_prize_quantity', {
        prize_id: prizeId
      })

      // If RPC doesn't exist, update manually
      if (prizeError) {
        const { data: prize } = await supabase
          .from('prizes')
          .select('remaining_quantity')
          .eq('id', prizeId)
          .single()

        if (prize) {
          await supabase
            .from('prizes')
            .update({ remaining_quantity: Math.max(0, prize.remaining_quantity - 1) })
            .eq('id', prizeId)
        }
      }

      // 4. Create audit log
      if (user?.id) {
        await supabase
          .from('prize_audit_logs')
          .insert({
            prize_id: prizeId,
            event_id: eventId,
            user_id: user.id,
            action: 'drawn',
            changes: { participant_id: participantId, winner_id: winner.id }
          })
      }

      await fetchWinners()
      return { data: winner as Winner, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }, [isConfigured, eventId, user?.id, fetchWinners])

  const markEmailSent = useCallback(async (winnerId: string): Promise<{ error: Error | null }> => {
    if (!isConfigured) {
      return { error: new Error('Not configured') }
    }

    try {
      const { error } = await supabase
        .from('winners')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString()
        })
        .eq('id', winnerId)

      if (error) throw error

      await fetchWinners()
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }, [isConfigured, fetchWinners])

  const deleteWinner = useCallback(async (winnerId: string, participantId: string): Promise<{ error: Error | null }> => {
    if (!isConfigured) {
      return { error: new Error('Not configured') }
    }

    try {
      // Delete winner record
      const { error: deleteError } = await supabase
        .from('winners')
        .delete()
        .eq('id', winnerId)

      if (deleteError) throw deleteError

      // Reset participant status
      const { error: participantError } = await supabase
        .from('participants')
        .update({ status: 'checked_in' })
        .eq('id', participantId)

      if (participantError) throw participantError

      await fetchWinners()
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }, [isConfigured, fetchWinners])

  // Export winners to CSV
  const exportToCSV = useCallback((): string => {
    const headers = ['No', 'Name', 'Email', 'Phone', 'Prize', 'Category', 'Drawn At']
    const rows = state.winners.map((w, index) => [
      index + 1,
      (w.participant as any)?.name || '',
      (w.participant as any)?.email || '',
      (w.participant as any)?.phone || '',
      (w.prize as any)?.name || '',
      (w.prize as any)?.category || '',
      new Date(w.drawn_at).toLocaleString()
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return csv
  }, [state.winners])

  // Stats
  const stats = {
    total: state.winners.length,
    byCategory: {
      hiburan: state.winners.filter(w => (w.prize as any)?.category === 'hiburan').length,
      utama: state.winners.filter(w => (w.prize as any)?.category === 'utama').length,
      grand_prize: state.winners.filter(w => (w.prize as any)?.category === 'grand_prize').length
    },
    emailSent: state.winners.filter(w => w.email_sent).length,
    emailPending: state.winners.filter(w => !w.email_sent).length
  }

  // Real-time subscription
  useEffect(() => {
    if (!isConfigured || !eventId) return

    const channel = supabase
      .channel(`winners-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'winners',
          filter: `event_id=eq.${eventId}`
        },
        () => {
          fetchWinners()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isConfigured, eventId, fetchWinners])

  useEffect(() => {
    fetchWinners()
  }, [fetchWinners])

  return {
    ...state,
    stats,
    fetchWinners,
    createWinner,
    markEmailSent,
    deleteWinner,
    exportToCSV
  }
}
