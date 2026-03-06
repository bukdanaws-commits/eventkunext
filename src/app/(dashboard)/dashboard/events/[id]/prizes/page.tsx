'use client';

import { use, useState, useEffect } from 'react';
import { PrizesTab } from '@/components/prizes/PrizesTab';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type EventTier = Database['public']['Enums']['event_tier'];

interface Event {
  id: string;
  name: string;
  tier: EventTier;
}

export default function EventPrizesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      const { data } = await supabase
        .from('events')
        .select('id, name, tier')
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
        <h1 className="text-3xl font-bold">Hadiah</h1>
        <p className="text-muted-foreground">Kelola hadiah undian</p>
      </div>

      <PrizesTab eventId={event.id} eventTier={event.tier} eventName={event.name} />
    </div>
  );
}
