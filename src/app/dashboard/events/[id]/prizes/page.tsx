'use client';

import { EventLayout, EventContextValue } from '@/components/layout/EventLayout';
import { PrizesTab } from '@/components/prizes/PrizesTab';

function EventPrizesContent({ event }: EventContextValue) {
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

export default function EventPrizes() {
  return (
    <EventLayout>
      {(context) => <EventPrizesContent {...context} />}
    </EventLayout>
  );
}
