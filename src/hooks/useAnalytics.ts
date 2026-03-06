'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'

interface EventStatistics {
  totalParticipants: number
  checkedIn: number
  notCheckedIn: number
  winners: number
  checkInRate: number
  totalPrizes: number
  drawnPrizes: number
  remainingPrizes: number
}

interface ChartData {
  name: string
  value: number
}

interface HourlyCheckIn {
  hour: string
  count: number
}

interface EventAnalyticsState {
  stats: EventStatistics | null
  statusDistribution: ChartData[]
  hourlyCheckIns: HourlyCheckIn[]
  prizeDistribution: ChartData[]
  loading: boolean
  error: string | null
}

export function useEventAnalytics(eventId: string | null) {
  const { isConfigured } = useAuth()
  const [state, setState] = useState<EventAnalyticsState>({
    stats: null,
    statusDistribution: [],
    hourlyCheckIns: [],
    prizeDistribution: [],
    loading: true,
    error: null
  })

  const fetchAnalytics = useCallback(async () => {
    if (!isSupabaseConfigured || !eventId) {
      setState(prev => ({ ...prev, loading: false }))
      return
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      // Fetch participant stats
      const { data: participants, error: participantsError } = await supabase
        .from('participants')
        .select('status, checked_in_at')
        .eq('event_id', eventId)

      if (participantsError) throw participantsError

      // Fetch prize stats
      const { data: prizes, error: prizesError } = await supabase
        .from('prizes')
        .select('quantity, remaining_quantity, category')
        .eq('event_id', eventId)

      if (prizesError) throw prizesError

      // Calculate participant stats
      const totalParticipants = participants?.length || 0
      const checkedIn = participants?.filter(p => p.status === 'checked_in' || p.status === 'won').length || 0
      const winners = participants?.filter(p => p.status === 'won').length || 0
      const notCheckedIn = totalParticipants - checkedIn
      const checkInRate = totalParticipants > 0 ? (checkedIn / totalParticipants) * 100 : 0

      // Status distribution for chart
      const statusDistribution: ChartData[] = [
        { name: 'Terdaftar', value: participants?.filter(p => p.status === 'registered').length || 0 },
        { name: 'Check-in', value: participants?.filter(p => p.status === 'checked_in').length || 0 },
        { name: 'Menang', value: winners }
      ]

      // Hourly check-ins distribution
      const checkInsByHour: Record<string, number> = {}
      participants?.forEach(p => {
        if (p.checked_in_at) {
          const hour = new Date(p.checked_in_at).getHours()
          const hourStr = `${hour.toString().padStart(2, '0')}:00`
          checkInsByHour[hourStr] = (checkInsByHour[hourStr] || 0) + 1
        }
      })
      
      const hourlyCheckIns: HourlyCheckIn[] = Object.entries(checkInsByHour)
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour.localeCompare(b.hour))

      // Prize stats
      const totalPrizes = prizes?.reduce((sum, p) => sum + p.quantity, 0) || 0
      const remainingPrizes = prizes?.reduce((sum, p) => sum + (p.remaining_quantity || 0), 0) || 0
      const drawnPrizes = totalPrizes - remainingPrizes

      // Prize distribution for chart
      const prizeDistribution: ChartData[] = [
        { name: 'Hiburan', value: prizes?.filter(p => p.category === 'hiburan').reduce((sum, p) => sum + p.quantity, 0) || 0 },
        { name: 'Utama', value: prizes?.filter(p => p.category === 'utama').reduce((sum, p) => sum + p.quantity, 0) || 0 },
        { name: 'Grand Prize', value: prizes?.filter(p => p.category === 'grand_prize').reduce((sum, p) => sum + p.quantity, 0) || 0 }
      ]

      setState({
        stats: {
          totalParticipants,
          checkedIn,
          notCheckedIn,
          winners,
          checkInRate,
          totalPrizes,
          drawnPrizes,
          remainingPrizes
        },
        statusDistribution,
        hourlyCheckIns,
        prizeDistribution,
        loading: false,
        error: null
      })
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch analytics'
      }))
    }
  }, [eventId])

  // Real-time updates
  useEffect(() => {
    if (!isSupabaseConfigured || !eventId) return

    const channel = supabase
      .channel(`analytics-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `event_id=eq.${eventId}`
        },
        () => fetchAnalytics()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'winners',
          filter: `event_id=eq.${eventId}`
        },
        () => fetchAnalytics()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, fetchAnalytics])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    ...state,
    refetch: fetchAnalytics
  }
}

// Hook for admin dashboard analytics across all events
export function useAdminAnalytics() {
  const { isConfigured } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState({
    totalEvents: 0,
    totalParticipants: 0,
    totalOrganizations: 0,
    totalRevenue: 0,
    eventsByStatus: [] as ChartData[],
    participantsByMonth: [] as ChartData[],
    revenueByMonth: [] as ChartData[]
  })

  const fetchAnalytics = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch events count
      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })

      // Fetch participants count
      const { count: totalParticipants } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })

      // Fetch organizations count
      const { count: totalOrganizations } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })

      // Fetch total revenue (from paid event_payments)
      const { data: payments } = await supabase
        .from('event_payments')
        .select('total_amount')
        .eq('payment_status', 'paid')

      const totalRevenue = payments?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0

      // Events by status
      const { data: eventsByStatus } = await supabase
        .from('events')
        .select('status')

      const statusCounts: Record<string, number> = {}
      eventsByStatus?.forEach(e => {
        statusCounts[e.status] = (statusCounts[e.status] || 0) + 1
      })

      const eventsByStatusChart: ChartData[] = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value
      }))

      setData({
        totalEvents: totalEvents || 0,
        totalParticipants: totalParticipants || 0,
        totalOrganizations: totalOrganizations || 0,
        totalRevenue,
        eventsByStatus: eventsByStatusChart,
        participantsByMonth: [],
        revenueByMonth: []
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics
  }
}
