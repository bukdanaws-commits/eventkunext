'use client';

import { use, useState, useEffect } from 'react';
import { ParticipantsTab } from '@/components/participants/ParticipantsTab';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type EventTier = Database['public']['Enums']['event_tier'];
type EventStatus = Database['public']['Enums']['event_status'];

interface Event {
  id: string;
  name: string;
  tier: EventTier;
  status: EventStatus;
  form_addon_purchased: boolean | null;
}

export default function EventParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      const { data } = await supabase
        .from('events')
        .select('id, name, tier, status, form_addon_purchased')
        .eq('id', id)
        .single();

      if (data) {
        setEvent(data as Event);
      }
      setLoading(false);
    }

    fetchEvent();
  }, [id]);

  const refetchEvent = async () => {
    const { data } = await supabase
      .from('events')
      .select('id, name, tier, status, form_addon_purchased')
      .eq('id', id)
      .single();
    if (data) setEvent(data as Event);
  };

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
        <h1 className="text-3xl font-bold">Peserta</h1>
        <p className="text-muted-foreground">Kelola peserta undian</p>
      </div>

      <ParticipantsTab
        eventId={event.id}
        eventTier={event.tier}
        eventName={event.name}
        eventStatus={event.status}
        formAddonPurchased={event.form_addon_purchased || false}
        onFormAddonPurchased={refetchEvent}
      />
    </div>
  );
}
