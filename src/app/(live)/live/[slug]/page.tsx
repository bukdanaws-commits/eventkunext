'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Gift, Loader2, Calendar, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type PrizeCategory = Database['public']['Enums']['prize_category'];

const triggerConfetti = (category: PrizeCategory) => {
  const colors = {
    grand_prize: ['#FFD700', '#FFA500', '#FF6347'],
    utama: ['#4169E1', '#1E90FF', '#00CED1'],
    hiburan: ['#32CD32', '#00FA9A', '#7CFC00']
  };

  const particleCount = category === 'grand_prize' ? 200 : category === 'utama' ? 100 : 50;
  
  confetti({
    particleCount,
    spread: 70,
    origin: { y: 0.6 },
    colors: colors[category]
  });

  if (category === 'grand_prize') {
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors[category]
      });
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors[category]
      });
    }, 250);
  }
};

interface Winner {
  id: string;
  drawn_at: string;
  isNew?: boolean;
  participant: {
    name: string;
    ticket_number: string;
  } | null;
  prize: {
    name: string;
    category: PrizeCategory;
    image_url: string | null;
  } | null;
}

interface Event {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
}

const categoryLabels: Record<PrizeCategory, string> = {
  hiburan: 'Hiburan',
  utama: 'Utama',
  grand_prize: 'Grand Prize'
};

const categoryIcons: Record<PrizeCategory, React.ElementType> = {
  grand_prize: Award,
  utama: Trophy,
  hiburan: Gift
};

const categoryColors: Record<PrizeCategory, string> = {
  grand_prize: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  utama: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  hiburan: 'bg-green-500/10 text-green-600 border-green-500/20'
};

export default function PublicViewer() {
  const params = useParams();
  const slug = params.slug as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchEventAndWinners = async () => {
      setLoading(true);
      
      // Fetch event by slug
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, name, description, event_date, event_time, location')
        .eq('public_viewer_slug', slug)
        .single();

      if (eventError || !eventData) {
        setError('Event tidak ditemukan');
        setLoading(false);
        return;
      }

      setEvent(eventData);

      // Fetch winners for this event
      const { data: winnersData } = await supabase
        .from('winners')
        .select(`
          id,
          drawn_at,
          participant:participants(name, ticket_number),
          prize:prizes(name, category, image_url)
        `)
        .eq('event_id', eventData.id)
        .order('drawn_at', { ascending: false });

      if (winnersData) {
        setWinners(winnersData as Winner[]);
      }

      setLoading(false);
    };

    fetchEventAndWinners();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('public-winners')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'winners',
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the new winner with details
            const { data } = await supabase
              .from('winners')
              .select(`
                id,
                drawn_at,
                participant:participants(name, ticket_number),
                prize:prizes(name, category, image_url)
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              const newWinner = { ...data, isNew: true } as Winner;
              setWinners(prev => [newWinner, ...prev]);
              
              // Trigger confetti effect
              const category = data.prize?.category || 'hiburan';
              triggerConfetti(category as PrizeCategory);
              
              // Remove the isNew flag after animation completes
              setTimeout(() => {
                setWinners(prev => 
                  prev.map(w => w.id === newWinner.id ? { ...w, isNew: false } : w)
                );
              }, 2000);
            }
          } else if (payload.eventType === 'DELETE') {
            setWinners(prev => prev.filter(w => w.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Event Tidak Ditemukan</h2>
            <p className="text-muted-foreground">
              Link yang Anda akses tidak valid atau event tidak tersedia untuk publik.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupedWinners = winners.reduce((acc, winner) => {
    const category = winner.prize?.category || 'hiburan';
    if (!acc[category]) acc[category] = [];
    acc[category].push(winner);
    return acc;
  }, {} as Record<PrizeCategory, Winner[]>);

  const categoryOrder: PrizeCategory[] = ['grand_prize', 'utama', 'hiburan'];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
          {event.description && (
            <p className="text-primary-foreground/80 mb-4">{event.description}</p>
          )}
          <div className="flex items-center justify-center gap-4 text-sm text-primary-foreground/80">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(event.event_date), 'dd MMMM yyyy', { locale: localeId })}
              {event.event_time && ` • ${event.event_time}`}
            </div>
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {event.location}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-4 -mt-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">{winners.length}</span>
              <span className="text-muted-foreground">Pemenang</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Winners List */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {winners.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Belum Ada Pemenang</h2>
              <p className="text-muted-foreground">
                Undian belum dimulai. Silakan tunggu pengumuman pemenang.
              </p>
            </CardContent>
          </Card>
        ) : (
          categoryOrder.map(category => {
            const categoryWinners = groupedWinners[category];
            if (!categoryWinners || categoryWinners.length === 0) return null;

            const Icon = categoryIcons[category];

            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{categoryLabels[category]}</h2>
                  <Badge variant="secondary">{categoryWinners.length}</Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {categoryWinners.map((winner, index) => (
                    <Card 
                      key={winner.id} 
                      className={`overflow-hidden transition-all duration-500 ${
                        index === 0 && category === 'grand_prize' ? 'md:col-span-2 border-amber-500/50' : ''
                      } ${
                        winner.isNew 
                          ? 'animate-fade-in ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]' 
                          : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {winner.prize?.image_url ? (
                            <img
                              src={winner.prize.image_url}
                              alt={winner.prize.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                              <Icon className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold truncate">
                                  {winner.participant?.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  #{winner.participant?.ticket_number}
                                </p>
                              </div>
                              <Badge className={categoryColors[category]}>
                                {categoryLabels[category]}
                              </Badge>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm font-medium text-primary">
                                {winner.prize?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(winner.drawn_at), 'dd MMM yyyy HH:mm', { locale: localeId })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="py-8 text-center text-sm text-muted-foreground">
        <p>Hasil undian ditampilkan secara real-time</p>
      </div>
    </div>
  );
}
