'use client';

import { use, useState, useEffect } from 'react';
import { DrawTab } from '@/components/draw/DrawTab';
import { useRealtimeWinners } from '@/hooks/useRealtimeWinners';
import { supabase } from '@/integrations/supabase/client';

interface Event {
  id: string;
  name: string;
  checkin_required_for_draw: boolean | null;
  email_notification_enabled: boolean | null;
  public_viewer_slug: string | null;
}

export default function EventDrawPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  // Enable realtime notifications for new winners
  useRealtimeWinners({ eventId: id });

  useEffect(() => {
    async function fetchEvent() {
      const { data } = await supabase
        .from('events')
        .select('id, name, checkin_required_for_draw, email_notification_enabled, public_viewer_slug')
        .eq('id', id)
        .single();

      if (data) {
        setEvent(data as Event);
      }
      setLoading(false);
    }

    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Undian</h1>
        <p className="text-muted-foreground">Lakukan pengundian hadiah</p>
      </div>

      <DrawTab
        eventId={event.id}
        eventName={event.name}
        checkinRequiredForDraw={event.checkin_required_for_draw}
        emailNotificationEnabled={event.email_notification_enabled}
        publicViewerSlug={event.public_viewer_slug}
      />
    </div>
  );
}
