'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'
import { useAuth } from './useAuth'

type Event = Database['public']['Tables']['events']['Row']
type EventInsert = Database['public']['Tables']['events']['Insert']
type EventUpdate = Database['public']['Tables']['events']['Update']
type EventPayment = Database['public']['Tables']['event_payments']['Row']
type PricingTier = Database['public']['Tables']['pricing_tiers']['Row']

interface EventWithDetails extends Event {
  participants_count?: number
  prizes_count?: number
  winners_count?: number
  organization?: {
    id: string
    name: string
  }
}

interface EventsState {
  events: EventWithDetails[]
  loading: boolean
  error: string | null
}

export function useEvents() {
  const { user, profile, isConfigured } = useAuth()
  const [state, setState] = useState<EventsState>({
    events: [],
    loading: true,
    error: null
  })
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])

  // Fetch pricing tiers
  const fetchPricingTiers = useCallback(async () => {
    if (!isConfigured) return

    try {
      const { data, error } = await supabase
        .from('pricing_tiers')
        .select('*')
        .order('price', { ascending: true })

      if (error) throw error
      setPricingTiers(data as PricingTier[])
    } catch (err) {
      console.error('Error fetching pricing tiers:', err)
    }
  }, [isConfigured])

  // Fetch events
  const fetchEvents = useCallback(async () => {
    if (!isConfigured || !profile?.organization_id) {
      setState(prev => ({ ...prev, loading: false }))
      return
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      // Fetch events with counts
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          *,
          participants(count),
          prizes(count),
          winners(count)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform the data
      const transformedEvents: EventWithDetails[] = (events || []).map(event => ({
        ...event,
        participants_count: (event.participants as unknown as { count: number }[])?.[0]?.count || 0,
        prizes_count: (event.prizes as unknown as { count: number }[])?.[0]?.count || 0,
        winners_count: (event.winners as unknown as { count: number }[])?.[0]?.count || 0
      }))

      setState({
        events: transformedEvents,
        loading: false,
        error: null
      })
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch events'
      }))
    }
  }, [isConfigured, profile?.organization_id])

  // Create event
  const createEvent = useCallback(async (data: EventInsert): Promise<{ data: Event | null; error: Error | null }> => {
    if (!isConfigured || !profile?.organization_id) {
      return { data: null, error: new Error('Not configured or not authenticated') }
    }

    try {
      const { data: newEvent, error } = await supabase
        .from('events')
        .insert({
          ...data,
          organization_id: profile.organization_id,
          created_by: user?.id
        })
        .select()
        .single()

      if (error) throw error

      await fetchEvents()
      return { data: newEvent as Event, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }, [isConfigured, profile?.organization_id, user?.id, fetchEvents])

  // Update event
  const updateEvent = useCallback(async (id: string, data: EventUpdate): Promise<{ error: Error | null }> => {
    if (!isConfigured) {
      return { error: new Error('Not configured') }
    }

    try {
      const { error } = await supabase
        .from('events')
        .update(data)
        .eq('id', id)

      if (error) throw error

      await fetchEvents()
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }, [isConfigured, fetchEvents])

  // Delete event
  const deleteEvent = useCallback(async (id: string): Promise<{ error: Error | null }> => {
    if (!isConfigured) {
      return { error: new Error('Not configured') }
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchEvents()
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }, [isConfigured, fetchEvents])

  // Get single event
  const getEvent = useCallback(async (id: string): Promise<{ data: EventWithDetails | null; error: Error | null }> => {
    if (!isConfigured) {
      return { data: null, error: new Error('Not configured') }
    }

    try {
      const { data: event, error } = await supabase
        .from('events')
        .select(`
          *,
          participants(count),
          prizes(count),
          winners(count)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      const transformedEvent: EventWithDetails = {
        ...event,
        participants_count: (event.participants as unknown as { count: number }[])?.[0]?.count || 0,
        prizes_count: (event.prizes as unknown as { count: number }[])?.[0]?.count || 0,
        winners_count: (event.winners as unknown as { count: number }[])?.[0]?.count || 0
      }

      return { data: transformedEvent, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }, [isConfigured])

  // Create payment for event
  const createPayment = useCallback(async (eventId: string, tier: string): Promise<{ data: EventPayment | null; error: Error | null }> => {
    if (!isConfigured || !profile?.organization_id) {
      return { data: null, error: new Error('Not configured or not authenticated') }
    }

    try {
      // Get pricing for tier
      const tierData = pricingTiers.find(t => t.tier === tier)
      if (!tierData) {
        return { data: null, error: new Error('Invalid tier') }
      }

      const { data: payment, error } = await supabase
        .from('event_payments')
        .insert({
          event_id: eventId,
          organization_id: profile.organization_id,
          tier: tier as Database['public']['Enums']['event_tier'],
          amount: tierData.price,
          total_amount: tierData.price,
          payment_status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      return { data: payment as EventPayment, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }, [isConfigured, profile?.organization_id, pricingTiers])

  // Subscribe to realtime updates
  useEffect(() => {
    if (!isConfigured || !profile?.organization_id) return

    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `organization_id=eq.${profile.organization_id}`
        },
        () => {
          fetchEvents()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isConfigured, profile?.organization_id, fetchEvents])

  // Initial fetch
  useEffect(() => {
    fetchPricingTiers()
    fetchEvents()
  }, [fetchPricingTiers, fetchEvents])

  return {
    ...state,
    pricingTiers,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEvent,
    createPayment,
    isConfigured
  }
}

// Hook for single event with real-time updates
export function useEvent(eventId: string) {
  const [event, setEvent] = useState<EventWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isConfigured, profile } = useAuth()

  const fetchEvent = useCallback(async () => {
    if (!isConfigured || !eventId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('events')
        .select(`
          *,
          participants(count),
          prizes(count),
          winners(count)
        `)
        .eq('id', eventId)
        .single()

      if (fetchError) throw fetchError

      const transformedEvent: EventWithDetails = {
        ...data,
        participants_count: (data.participants as unknown as { count: number }[])?.[0]?.count || 0,
        prizes_count: (data.prizes as unknown as { count: number }[])?.[0]?.count || 0,
        winners_count: (data.winners as unknown as { count: number }[])?.[0]?.count || 0
      }

      setEvent(transformedEvent)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch event')
    } finally {
      setLoading(false)
    }
  }, [isConfigured, eventId])

  // Real-time subscription
  useEffect(() => {
    if (!isConfigured || !eventId) return

    const channel = supabase
      .channel(`event-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`
        },
        (payload) => {
          setEvent(prev => prev ? { ...prev, ...payload.new as Event } : null)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isConfigured, eventId])

  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  return { event, loading, error, refetch: fetchEvent }
}
