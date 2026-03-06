'use client';

import { EventLayout, EventContextValue } from '@/components/layout/EventLayout';
import { WinnersTab } from '@/components/winners/WinnersTab';
import { useRealtimeWinners } from '@/hooks/useRealtimeWinners';

function EventWinnersContent({ event }: EventContextValue) {
  // Enable realtime notifications for new winners
  useRealtimeWinners({ eventId: event.id });

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

export default function EventWinners() {
  return (
    <EventLayout>
      {(context) => <EventWinnersContent {...context} />}
    </EventLayout>
  );
}
