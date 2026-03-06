'use client';

import { EventLayout, EventContextValue } from '@/components/layout/EventLayout';
import { ParticipantsTab } from '@/components/participants/ParticipantsTab';

function EventParticipantsContent({ event, refetchEvent }: EventContextValue) {
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

export default function EventParticipants() {
  return (
    <EventLayout>
      {(context) => <EventParticipantsContent {...context} />}
    </EventLayout>
  );
}
