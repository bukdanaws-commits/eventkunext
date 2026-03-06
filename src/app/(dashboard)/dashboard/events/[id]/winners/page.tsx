'use client';

import { use, useState, useEffect } from 'react';
import { WinnersTab } from '@/components/winners/WinnersTab';
import { useRealtimeWinners } from '@/hooks/useRealtimeWinners';
import { supabase } from '@/integrations/supabase/client';

interface Event {
  id: string;
  name: string;
}

export default function EventWinnersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  // Enable realtime notifications for new winners
  useRealtimeWinners({ eventId: id });

  useEffect(() => {
    async function fetchEvent() {
      const { data } = await supabase
        .from('events')
        .select('id, name')
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
        <h1 className="text-3xl font-bold">Pemenang</h1>
        <p className="text-muted-foreground">Daftar semua pemenang undian</p>
      </div>

      <WinnersTab eventId={event.id} eventName={event.name} />
    </div>
  );
}
