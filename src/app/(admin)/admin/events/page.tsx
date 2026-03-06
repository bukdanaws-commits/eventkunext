'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Users, Gift, DollarSign, Eye, Download, Loader2, Search, RefreshCw } from 'lucide-react'

export default function AdminEventsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(() => !user || authLoading)
  const [searchQuery, setSearchQuery] = useState('')
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    } else if (user) {
      // Load events from localStorage
      const stored = localStorage.getItem('eventku-events')
      if (stored) {
        try {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Loading data from localStorage is a legitimate external system sync
          setEvents(JSON.parse(stored))
        } catch {
          // ignore
        }
      }
    }
  }, [user, authLoading, router])

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    )
  }

  const stats = {
    total: events.length,
    active: events.filter(e => e.status === 'active').length,
    participants: events.reduce((sum, e) => sum + (e.participants_count || 0), 0),
    prizes: events.reduce((sum, e) => sum + (e.prizes_count || 0), 0)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">All Events</h1>
            <p className="text-muted-foreground mt-1">Monitor semua events dari semua organizations</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Active Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.participants.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Total Prizes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.prizes.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari event, organization, atau lokasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {events.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Tidak ada event ditemukan
                </div>
              ) : (
                events.filter(e => 
                  searchQuery === '' || 
                  e.name.toLowerCase().includes(searchQuery.toLowerCase())
                ).map(event => (
                  <div key={event.id} className="p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/events/${event.id}`)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{event.name}</h3>
                        <p className="text-sm text-muted-foreground">{event.event_date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                          {event.status}
                        </Badge>
                        <Badge variant="outline">{event.tier}</Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
