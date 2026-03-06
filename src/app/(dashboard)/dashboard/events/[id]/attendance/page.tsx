'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Users, UserCheck, Clock, Search, RefreshCw, Volume2, VolumeX,
  TrendingUp, Activity, CheckCircle2, XCircle, Wifi, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { EventLayout } from '@/components/layout/EventLayout';
import type { Database } from '@/integrations/supabase/types';

type Participant = Database['public']['Tables']['participants']['Row'];

interface ParticipantStats {
  total: number;
  checkedIn: number;
  pending: number;
  checkinRate: number;
}

interface Event {
  id: string;
  name: string;
}

export default function EventAttendancePage() {
  const params = useParams();
  const id = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventLoading, setEventLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const { playCheckinSound } = useSoundEffects();

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name')
        .eq('id', id)
        .single();

      if (!error && data) {
        setEvent(data);
      }
      setEventLoading(false);
    };

    fetchEvent();
  }, [id]);

  // Calculate stats
  const stats: ParticipantStats = useMemo(() => {
    const total = participants.length;
    const checkedIn = participants.filter(p =>
      p.status === 'checked_in' || p.status === 'won'
    ).length;
    const pending = total - checkedIn;
    const checkinRate = total > 0 ? (checkedIn / total) * 100 : 0;

    return { total, checkedIn, pending, checkinRate };
  }, [participants]);

  // Filter checked-in participants
  const checkedInParticipants = useMemo(() => {
    return participants
      .filter(p => p.status === 'checked_in' || p.status === 'won')
      .filter(p => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(query) ||
          p.ticket_number.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query) ||
          p.phone?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const dateA = a.checked_in_at ? new Date(a.checked_in_at).getTime() : 0;
        const dateB = b.checked_in_at ? new Date(b.checked_in_at).getTime() : 0;
        return dateB - dateA; // Most recent first
      });
  }, [participants, searchQuery]);

  // Fetch initial data
  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('event_id', id)
        .order('checked_in_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast.error('Gagal memuat data peserta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (event) {
      fetchParticipants();
    }
  }, [event]);

  // Real-time subscription
  useEffect(() => {
    if (!event) return;

    const channel = supabase
      .channel(`attendance-monitor-${event.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `event_id=eq.${event.id}`
        },
        (payload) => {
          console.log('Realtime update:', payload);

          if (payload.eventType === 'INSERT') {
            setParticipants(prev => [payload.new as Participant, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const newRecord = payload.new as Participant;
            const oldRecord = payload.old as Participant;

            // Check if this is a check-in event
            if (newRecord.status === 'checked_in' && oldRecord.status !== 'checked_in') {
              if (soundEnabled) {
                playCheckinSound();
              }
              toast.success(
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="font-medium">{newRecord.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Check-in berhasil • #{newRecord.ticket_number}
                    </p>
                  </div>
                </div>,
                { duration: 4000 }
              );
            }

            setParticipants(prev =>
              prev.map(p => p.id === newRecord.id ? newRecord : p)
            );
          } else if (payload.eventType === 'DELETE') {
            setParticipants(prev =>
              prev.filter(p => p.id !== (payload.old as Participant).id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event, soundEnabled, playCheckinSound]);

  // Recent check-ins (last 10)
  const recentCheckins = checkedInParticipants.slice(0, 10);

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Event tidak ditemukan</p>
      </div>
    );
  }

  return (
    <EventLayout event={event}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Activity className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Live Attendance Monitor</h1>
              <p className="text-muted-foreground">Pantau kehadiran peserta secara real-time</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-1">
              <Wifi className={`h-3 w-3 ${isConnected ? 'text-green-400' : ''}`} />
              {isConnected ? 'Live' : 'Connecting...'}
            </Badge>

            {/* Sound Toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="sound-toggle"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
              <Label htmlFor="sound-toggle" className="flex items-center gap-1 cursor-pointer">
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Label>
            </div>

            <Button variant="outline" size="sm" onClick={fetchParticipants} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Total Peserta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-500" />
                Sudah Check-in
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.checkedIn}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Belum Check-in
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Check-in Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.checkinRate.toFixed(1)}%</p>
              <Progress value={stats.checkinRate} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Check-ins - Live Feed */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500 animate-pulse" />
                Check-in Terbaru
              </CardTitle>
              <CardDescription>10 peserta terakhir yang check-in</CardDescription>
            </CardHeader>
            <CardContent>
              {recentCheckins.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mb-3 opacity-50" />
                  <p>Belum ada check-in</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {recentCheckins.map((participant, index) => (
                      <div
                        key={participant.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                          index === 0 ? 'bg-green-500/10 border-green-500/30 animate-pulse' : 'bg-muted/30'
                        }`}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{participant.name}</p>
                          <p className="text-xs text-muted-foreground">
                            #{participant.ticket_number}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {participant.checked_in_at
                              ? formatDistanceToNow(parseISO(participant.checked_in_at), {
                                  addSuffix: true,
                                  locale: localeId
                                })
                              : '-'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* All Checked-in Participants */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    Daftar Kehadiran
                  </CardTitle>
                  <CardDescription>
                    {checkedInParticipants.length} peserta sudah check-in
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama, tiket, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : checkedInParticipants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users className="h-16 w-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">
                    {searchQuery ? 'Tidak ada hasil' : 'Belum ada yang check-in'}
                  </p>
                  <p className="text-sm">
                    {searchQuery
                      ? 'Coba kata kunci lain'
                      : 'Data akan muncul secara real-time saat peserta check-in'}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {checkedInParticipants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                          {participant.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 grid gap-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{participant.name}</p>
                            <Badge variant="outline" className="text-xs">
                              #{participant.ticket_number}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {participant.email && (
                              <span className="truncate">{participant.email}</span>
                            )}
                            {participant.phone && (
                              <span>{participant.phone}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant="default" className="bg-green-500 text-white">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Hadir
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {participant.checked_in_at
                              ? format(parseISO(participant.checked_in_at), 'HH:mm', { locale: localeId })
                              : '-'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </EventLayout>
  );
}
