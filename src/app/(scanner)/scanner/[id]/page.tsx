'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeParticipants } from '@/hooks/useRealtimeParticipants';
import { useCheckinNotifications } from '@/hooks/useCheckinNotifications';
import { QRCheckinScanner } from '@/components/checkin/QRCheckinScanner';
import { ParticipantSearch } from '@/components/checkin/ParticipantSearch';
import { AttendanceChart } from '@/components/analytics/AttendanceChart';
import { BenefitRedemptionScanner } from '@/components/tickets/BenefitRedemptionScanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, Users, UserCheck, Clock, QrCode, BarChart3, 
  LogOut, RefreshCw, CheckCircle2, Search, Volume2, VolumeX, Gift
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

export default function ScannerCheckin() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
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
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('scanner-sound-enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // Persist sound preference
  useEffect(() => {
    localStorage.setItem('scanner-sound-enabled', String(soundEnabled));
  }, [soundEnabled]);

  const { participants, stats, refetch } = useRealtimeParticipants(id || '');

  // Enable real-time check-in notifications with sound
  useCheckinNotifications({ eventId: id || '', enabled: true, soundEnabled });

  // Check if user is authorized scanner
  useEffect(() => {
    const checkAuthorization = async () => {
      if (!user || !id) return;

      // Check if user is scanner for this event
      const { data: scanner } = await supabase
        .from('event_scanners')
        .select('id, is_active')
        .eq('event_id', id)
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
          .eq('id', id)
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
  }, [user, id]);

  // Fetch event info
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;

      const { data: eventData } = await supabase
        .from('events')
        .select('id, name, event_date, qr_checkin_enabled, is_paid_event')
        .eq('id', id)
        .single();

      if (eventData) {
        setEvent(eventData);
      }

      setLoading(false);
    };

    fetchEvent();
  }, [id]);

  // Fetch recent checkins
  useEffect(() => {
    const fetchRecentCheckins = async () => {
      if (!id) return;

      const { data } = await supabase
        .from('participants')
        .select('id, name, ticket_number, checked_in_at')
        .eq('event_id', id)
        .eq('status', 'checked_in')
        .order('checked_in_at', { ascending: false })
        .limit(10);

      if (data) {
        setRecentCheckins(data.filter(p => p.checked_in_at));
      }
    };

    fetchRecentCheckins();
  }, [id]);

  const handleCheckin = () => {
    refetch();
    // Re-fetch recent checkins
    const fetchRecentCheckins = async () => {
      if (!id) return;

      const { data } = await supabase
        .from('participants')
        .select('id, name, ticket_number, checked_in_at')
        .eq('event_id', id)
        .eq('status', 'checked_in')
        .order('checked_in_at', { ascending: false })
        .limit(10);

      if (data) {
        setRecentCheckins(data.filter(p => p.checked_in_at));
      }
    };
    fetchRecentCheckins();
  };

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
                      variant={soundEnabled ? "ghost" : "ghost"} 
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
          <TabsList className={`grid w-full ${event.is_paid_event ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">Scan</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Cari</span>
            </TabsTrigger>
            {event.is_paid_event && (
              <TabsTrigger value="benefits" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                <span className="hidden sm:inline">Benefit</span>
              </TabsTrigger>
            )}
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
            <QRCheckinScanner eventId={id!} onCheckin={handleCheckin} />
          </TabsContent>

          <TabsContent value="search">
            <ParticipantSearch eventId={id!} onCheckin={handleCheckin} />
          </TabsContent>

          {event.is_paid_event && (
            <TabsContent value="benefits">
              <BenefitRedemptionScanner eventId={id!} />
            </TabsContent>
          )}

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
