'use client'

import { useState, useCallback } from 'react'

export type EventStatus = 'draft' | 'pending_payment' | 'active' | 'completed' | 'cancelled'
export type EventTier = 'free' | 'basic' | 'pro' | 'enterprise'

export interface Event {
  id: string
  name: string
  description?: string
  event_date: string
  event_time?: string
  location?: string
  tier: EventTier
  status: EventStatus
  cover_image_url?: string
  participants_count: number
  prizes_count: number
  winners_count: number
  created_at: string
  updated_at: string
}

export interface PricingTier {
  id: string
  tier: EventTier
  name: string
  price: number
  max_participants: number
  max_hiburan: number
  max_utama: number
  max_grand_prize: number
  form_addon_price: number
}

const STORAGE_KEY = 'eventku-events'

const defaultPricingTiers: PricingTier[] = [
  { id: '1', tier: 'free', name: 'Free', price: 0, max_participants: 30, max_hiburan: 1, max_utama: 1, max_grand_prize: 1, form_addon_price: 0 },
  { id: '2', tier: 'basic', name: 'Basic', price: 1000000, max_participants: 100, max_hiburan: 20, max_utama: 5, max_grand_prize: 1, form_addon_price: 300000 },
  { id: '3', tier: 'pro', name: 'Pro', price: 1500000, max_participants: 500, max_hiburan: 50, max_utama: 30, max_grand_prize: -1, form_addon_price: 500000 },
  { id: '4', tier: 'enterprise', name: 'Enterprise', price: 2000000, max_participants: -1, max_hiburan: -1, max_utama: -1, max_grand_prize: 1, form_addon_price: 750000 },
]

function getStoredEvents(): Event[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>(getStoredEvents)
  const [pricingTiers] = useState<PricingTier[]>(defaultPricingTiers)
  const [loading] = useState(false)

  const saveEvents = useCallback((newEvents: Event[]) => {
    setEvents(newEvents)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents))
  }, [])

  const createEvent = useCallback(async (data: {
    name: string
    description?: string | null
    event_date: string
    event_time?: string | null
    location?: string | null
    tier: EventTier
    cover_image_url?: string | null
  }): Promise<Event> => {
    const newEvent: Event = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description || undefined,
      event_date: data.event_date,
      event_time: data.event_time || undefined,
      location: data.location || undefined,
      tier: data.tier,
      status: 'draft',
      cover_image_url: data.cover_image_url || undefined,
      participants_count: 0,
      prizes_count: 0,
      winners_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    setEvents(prev => {
      const newEvents = [...prev, newEvent]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents))
      return newEvents
    })
    return newEvent
  }, [])

  const deleteEvent = useCallback(async (id: string) => {
    setEvents(prev => {
      const newEvents = prev.filter(e => e.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents))
      return newEvents
    })
  }, [])

  const updateEvent = useCallback(async (id: string, data: Partial<Event>) => {
    setEvents(prev => {
      const newEvents = prev.map(e => 
        e.id === id 
          ? { ...e, ...data, updated_at: new Date().toISOString() }
          : e
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents))
      return newEvents
    })
  }, [])

  const refetch = useCallback(() => {
    const stored = getStoredEvents()
    setEvents(stored)
  }, [])

  return {
    events,
    pricingTiers,
    loading,
    createEvent,
    deleteEvent,
    updateEvent,
    refetch,
  }
}
