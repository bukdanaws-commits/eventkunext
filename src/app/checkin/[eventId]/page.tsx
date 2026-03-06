'use client';

import { useEffect, useState, useCallback, useReducer } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { QRCheckinScanner } from '@/components/checkin/QRCheckinScanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Users, UserCheck, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface EventInfo {
  id: string;
  name: string;
  event_date: string;
  qr_checkin_enabled: boolean;
}

interface CheckinStats {
  total: number;
  checkedIn: number;
}

// Force re-render reducer
const reducer = (state: number) => state + 1;

export default function QRCheckin() {
  const params = useParams();
  const eventId = params.eventId as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [, forceUpdate] = useReducer(reducer, 0);
  
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [stats, setStats] = useState<CheckinStats>({ total: 0, checkedIn: 0 });
  const [loading, setLoading] = useState(() => !user && authLoading);
  const [recentCheckins, setRecentCheckins] = useState<Array<{
    id: string;
    name: string;
    ticket_number: string;
    checked_in_at: string;
  }>>([]);

  const fetchData = useCallback(async () => {
    if (!eventId) return;

    const { data: eventData } = await supabase
      .from('events')
      .select('id, name, event_date, qr_checkin_enabled')
      .eq('id', eventId)
      .single();

    if (eventData) {
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

    setStats({
      total: totalCount || 0,
      checkedIn: checkedInCount || 0
    });

    // Fetch recent checkins
    const { data: recentData } = await supabase
      .from('participants')
      .select('id, name, ticket_number, checked_in_at')
      .eq('event_id', eventId)
      .eq('status', 'checked_in')
      .order('checked_in_at', { ascending: false })
      .limit(5);

    if (recentData) {
      setRecentCheckins(recentData.filter(p => p.checked_in_at));
    }

    setLoading(false);
    forceUpdate();
  }, [eventId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Initial data fetch
  useEffect(() => {
    let mounted = true;
    
    const initFetch = async () => {
      if (eventId && user && mounted) {
        await fetchData();
      }
    };
    
    initFetch();
    
    return () => {
      mounted = false;
    };
  }, [eventId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/events/${eventId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">QR Check-in</h1>
            <p className="text-muted-foreground">{event.name}</p>
          </div>
          <Badge variant={event.qr_checkin_enabled ? 'default' : 'secondary'}>
            {event.qr_checkin_enabled ? 'Aktif' : 'Tidak Aktif'}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Peserta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Sudah Check-in
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
              <p className="text-sm text-muted-foreground">{checkinPercentage}% dari total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Belum Check-in
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">{stats.total - stats.checkedIn}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Scanner */}
          <QRCheckinScanner eventId={eventId} onCheckin={fetchData} />

          {/* Recent Checkins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Check-in Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentCheckins.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada peserta yang check-in
                </p>
              ) : (
                <div className="space-y-3">
                  {recentCheckins.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{participant.name}</p>
                        <p className="text-sm text-muted-foreground">#{participant.ticket_number}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(participant.checked_in_at), 'HH:mm', { locale: localeId })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
