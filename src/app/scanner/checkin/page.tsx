'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { QRCheckinScanner } from '@/components/checkin/QRCheckinScanner';
import { ParticipantSearch } from '@/components/checkin/ParticipantSearch';
import { AttendanceChart } from '@/components/analytics/AttendanceChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, Users, UserCheck, Clock, QrCode, BarChart3, 
  LogOut, RefreshCw, CheckCircle2, Search, Volume2, VolumeX
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface EventInfo {
  id: string;
  name: string;
  event_date: string;
  qr_checkin_enabled: boolean;
  is_paid_event: boolean | null;
}

interface RealtimeStats {
  total: number;
  checkedIn: number;
}

export default function ScannerCheckin() {
  const params = useParams();
  const eventId = params.eventId as string;
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [recentCheckins, setRecentCheckins] = useState<Array<{
    id: string;
    name: string;
    ticket_number: string;
    checked_in_at: string;
  }>>([]);
  const [stats, setStats] = useState<RealtimeStats>({ total: 0, checkedIn: 0 });
  const [participants, setParticipants] = useState<any[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('scanner-sound-enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // Play checkin sound
  const playCheckinSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.error('Failed to play sound:', e);
    }
  }, [soundEnabled]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!eventId) return;

    const { count: totalCount } = await supabase
      .from('participants')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId);

    const { count: checkedInCount } = await supabase
      .from('participants')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'checked_in');

    setStats({
      total: totalCount || 0,
      checkedIn: checkedInCount || 0
    });
  }, [eventId]);

  // Fetch recent checkins
  const fetchRecentCheckins = useCallback(async () => {
    if (!eventId) return;

    const { data } = await supabase
      .from('participants')
      .select('id, name, ticket_number, checked_in_at')
      .eq('event_id', eventId)
      .eq('status', 'checked_in')
      .order('checked_in_at', { ascending: false })
      .limit(10);

    if (data) {
      setRecentCheckins(data.filter(p => p.checked_in_at));
    }
  }, [eventId]);

  // Persist sound preference
  useEffect(() => {
    localStorage.setItem('scanner-sound-enabled', String(soundEnabled));
  }, [soundEnabled]);

  // Check if user is authorized scanner
  useEffect(() => {
    const checkAuthorization = async () => {
      if (!user || !eventId) return;

      // Check if user is scanner for this event
      const { data: scanner } = await supabase
        .from('event_scanners')
        .select('id, is_active')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (scanner) {
        setIsAuthorized(true);
      } else {
        // Check if user is event owner
        const { data: eventData } = await supabase
          .from('events')
          .select('id, organization_id')
          .eq('id', eventId)
          .single();

        if (eventData) {
          const { data: userRole } = await supabase
            .from('user_roles')
            .select('id')
            .eq('organization_id', eventData.organization_id)
            .eq('user_id', user.id)
            .single();

          setIsAuthorized(!!userRole);
        }
      }
    };

    checkAuthorization();
  }, [user, eventId]);

  // Fetch event info and set up real-time subscriptions
  useEffect(() => {
    if (!eventId) return;

    let mounted = true;

    const fetchInitialData = async () => {
      // Fetch event data
      const { data: eventData } = await supabase
        .from('events')
        .select('id, name, event_date, qr_checkin_enabled, is_paid_event')
        .eq('id', eventId)
        .single();

      if (eventData && mounted) {
        setEvent(eventData);
      }

      // Fetch stats
      const { count: totalCount } = await supabase
        .from('participants')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId);

      const { count: checkedInCount } = await supabase
        .from('participants')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'checked_in');

      if (mounted) {
        setStats({
          total: totalCount || 0,
          checkedIn: checkedInCount || 0
        });
      }

      // Fetch recent checkins
      const { data: recentData } = await supabase
        .from('participants')
        .select('id, name, ticket_number, checked_in_at')
        .eq('event_id', eventId)
        .eq('status', 'checked_in')
        .order('checked_in_at', { ascending: false })
        .limit(10);

      if (recentData && mounted) {
        setRecentCheckins(recentData.filter(p => p.checked_in_at));
      }

      if (mounted) {
        setLoading(false);
      }
    };

    fetchInitialData();

    // Set up real-time subscription
    const channel = supabase
      .channel(`scanner-checkins-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'participants',
          filter: `event_id=eq.${eventId}`
        },
        async (payload) => {
          if (payload.new.status === 'checked_in' && payload.old.status !== 'checked_in') {
            // New check-in detected
            playCheckinSound();
            // Re-fetch data when new check-in happens
            fetchInitialData();
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [eventId, playCheckinSound]);

  const handleCheckin = useCallback(() => {
    fetchStats();
    fetchRecentCheckins();
  }, [fetchStats, fetchRecentCheckins]);

  const handleLogout = async () => {
    await signOut();
    router.push('/auth');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.push('/auth');
    return null;
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <div className="rounded-full bg-destructive/10 p-4 w-fit mx-auto mb-4">
              <QrCode className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
            <p className="text-muted-foreground mb-4">
              Anda tidak memiliki akses sebagai scanner untuk event ini.
            </p>
            <Button onClick={() => router.push('/auth')} variant="outline">
              Kembali ke Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const checkinPercentage = stats.total > 0 
    ? Math.round((stats.checkedIn / stats.total) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-sm md:text-base truncate max-w-[200px] md:max-w-none">
                  {event.name}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(event.event_date), 'dd MMM yyyy', { locale: localeId })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={soundEnabled ? "text-primary" : "text-muted-foreground"}
                    >
                      {soundEnabled ? (
                        <Volume2 className="h-4 w-4" />
                      ) : (
                        <VolumeX className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="ghost" size="icon" onClick={handleCheckin}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3 px-3 text-center">
              <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/50">
            <CardContent className="pt-4 pb-3 px-3 text-center">
              <UserCheck className="h-5 w-5 mx-auto text-green-500 mb-1" />
              <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
              <p className="text-xs text-muted-foreground">Check-in</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3 px-3 text-center">
              <Clock className="h-5 w-5 mx-auto text-amber-500 mb-1" />
              <p className="text-2xl font-bold text-amber-600">{stats.total - stats.checkedIn}</p>
              <p className="text-xs text-muted-foreground">Belum</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress Check-in</span>
              <span className="text-sm font-bold">{checkinPercentage}%</span>
            </div>
            <Progress value={checkinPercentage} className="h-3" />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="scan" className="space-y-4">
          <TabsList className={`grid w-full ${event.is_paid_event ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">Scan</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Cari</span>
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Terbaru</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Statistik</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4">
            <QRCheckinScanner eventId={eventId} onCheckin={handleCheckin} />
          </TabsContent>

          <TabsContent value="search">
            <ParticipantSearch eventId={eventId} onCheckin={handleCheckin} />
          </TabsContent>

          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-5 w-5" />
                  Check-in Terakhir
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentCheckins.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada peserta yang check-in
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentCheckins.map((participant, index) => (
                      <div 
                        key={participant.id} 
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-6">
                            {index + 1}.
                          </span>
                          <div>
                            <p className="font-medium text-sm">{participant.name}</p>
                            <p className="text-xs text-muted-foreground">
                              #{participant.ticket_number}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {format(new Date(participant.checked_in_at), 'HH:mm')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <AttendanceChart participants={participants} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
