'use client';

import { EventLayout, EventContextValue } from '@/components/layout/EventLayout';
import { DrawTab } from '@/components/draw/DrawTab';
import { useRealtimeWinners } from '@/hooks/useRealtimeWinners';

function EventDrawContent({ event }: EventContextValue) {
  // Enable realtime notifications for new winners
  useRealtimeWinners({ eventId: event.id });

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

export default function EventDraw() {
  return (
    <EventLayout>
      {(context) => <EventDrawContent {...context} />}
    </EventLayout>
  );
}
