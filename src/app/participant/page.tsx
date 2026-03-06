'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Calendar, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface EventWithParticipantCount {
  id: string;
  name: string;
  event_date: string;
  tier: string;
  participantCount: number;
}

export default function Participants() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventWithParticipantCount[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchEvents() {
      if (!user) return;

      // Get user's organization
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.organization_id) {
        setLoading(false);
        return;
      }

      // Get all events for the organization
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (eventsData) {
        // Get participant counts for each event
        const eventsWithCounts = await Promise.all(
          eventsData.map(async (event) => {
            const { count } = await supabase
              .from('participants')
              .select('id', { count: 'exact', head: true })
              .eq('event_id', event.id);

            return {
              ...event,
              participantCount: count || 0,
            };
          })
        );

        setEvents(eventsWithCounts);
      }

      setLoading(false);
    }

    if (!authLoading && user) {
      fetchEvents();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Peserta</h1>
          <p className="text-muted-foreground">Kelola peserta dari semua event</p>
        </div>

        {events.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Belum ada event</h3>
              <p className="text-muted-foreground text-center mb-4">
                Buat event terlebih dahulu untuk mengelola peserta
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Buat Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-1">{event.name}</CardTitle>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {event.tier}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(event.event_date), 'dd MMM yyyy', { locale: localeId })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{event.participantCount}</span>
                      <span className="text-muted-foreground text-sm">peserta</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard/events/${event.id}/participants`)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Lihat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
