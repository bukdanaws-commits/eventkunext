'use client';

import { useEffect, useState, useCallback, useRef, use } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SpinWheel } from '@/components/draw/SpinWheel';
import { SlotMachine } from '@/components/draw/SlotMachine';
import { CardReveal } from '@/components/draw/CardReveal';
import { RandomNumber } from '@/components/draw/RandomNumber';
import { CountdownTimer } from '@/components/draw/CountdownTimer';
import { ConnectionStatusBadge } from '@/components/draw/ConnectionStatusBadge';
import { useRealtimeStatus, type ConnectionStatus } from '@/hooks/useRealtimeStatus';
import { Loader2, Trophy, Users, Gift, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Database } from '@/integrations/supabase/types';

type Prize = Database['public']['Tables']['prizes']['Row'];
type Participant = Database['public']['Tables']['participants']['Row'];
type DrawAnimation = Database['public']['Enums']['draw_animation'];
type PrizeCategory = Database['public']['Enums']['prize_category'];

interface DrawState {
  status: 'idle' | 'countdown' | 'animating' | 'result';
  animation: DrawAnimation;
  winner: Participant | null;
  prize: Prize | null;
  participants: Participant[];
  stats: {
    eligibleParticipants: number;
    availablePrizes: number;
    totalWinners: number;
  };
}

const categoryLabels: Record<PrizeCategory, string> = {
  hiburan: 'Hiburan',
  utama: 'Utama',
  grand_prize: 'Grand Prize'
};

const categoryColors: Record<PrizeCategory, string> = {
  grand_prize: 'from-amber-500 to-yellow-400',
  utama: 'from-blue-500 to-cyan-400',
  hiburan: 'from-green-500 to-emerald-400'
};

export default function EventDrawDisplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const [event, setEvent] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawState, setDrawState] = useState<DrawState>({
    status: 'idle',
    animation: 'spin_wheel',
    winner: null,
    prize: null,
    participants: [],
    stats: {
      eligibleParticipants: 0,
      availablePrizes: 0,
      totalWinners: 0
    }
  });

  // Ref for anti-stuck timeout
  const countdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle incoming draw state changes
  const handleStateChange = useCallback((state: DrawState) => {
    console.log('[Display] ========== STATE CHANGE ==========');
    console.log('[Display] Status:', state.status);
    console.log('[Display] Animation:', state.animation);
    console.log('[Display] Participants count:', state.participants?.length || 0);
    console.log('[Display] Winner:', state.winner ? `${state.winner.name} (${state.winner.ticket_number})` : 'none');
    console.log('[Display] Prize:', state.prize?.name || 'none');
    console.log('[Display] ===================================');

    // Clear any existing timeout when new state arrives
    if (countdownTimeoutRef.current) {
      clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
    }

    setDrawState(state);

    // Set anti-stuck fallback when countdown starts
    if (state.status === 'countdown') {
      console.log('[Display] Countdown started, setting anti-stuck timeout (30s)');
      countdownTimeoutRef.current = setTimeout(() => {
        console.log('[Display] Anti-stuck: No new state received after 30s, returning to idle');
        setDrawState(prev => ({
          ...prev,
          status: 'idle'
        }));
      }, 30000);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (countdownTimeoutRef.current) {
        clearTimeout(countdownTimeoutRef.current);
      }
    };
  }, []);

  // Realtime connection status
  const { connectionStatus, reconnect, requestState } = useRealtimeStatus({
    channelName: `draw-display-${eventId}`,
    onStateChange: handleStateChange,
  });

  // Request current state when connection is established
  useEffect(() => {
    if (connectionStatus === 'connected') {
      console.log('[Display] Connected, requesting current state...');
      const timeout = setTimeout(() => {
        requestState();
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [connectionStatus, requestState]);

  // Fetch event details
  useEffect(() => {
    if (!eventId) return;

    const fetchEvent = async () => {
      const { data } = await supabase
        .from('events')
        .select('name')
        .eq('id', eventId)
        .single();

      if (data) {
        setEvent(data);
      }
      setLoading(false);
    };

    fetchEvent();
  }, [eventId]);

  const handleAnimationComplete = () => {
    // Animation complete is handled by the operator
  };

  const renderAnimation = () => {
    const participantsToUse = drawState.participants.length > 0
      ? drawState.participants
      : drawState.winner
        ? [drawState.winner]
        : [];

    if (participantsToUse.length === 0) {
      console.log('[Display] No participants available for animation');
      return null;
    }

    console.log('[Display] Rendering animation:', drawState.animation, 'with', participantsToUse.length, 'participants, winner:', drawState.winner?.name);

    const animationProps = {
      participants: participantsToUse,
      winner: drawState.winner,
      onComplete: handleAnimationComplete,
      isSpinning: drawState.status === 'animating'
    };

    switch (drawState.animation) {
      case 'spin_wheel':
        return <SpinWheel {...animationProps} />;
      case 'slot_machine':
        return <SlotMachine {...animationProps} />;
      case 'card_reveal':
        return <CardReveal {...animationProps} />;
      case 'random_number':
        return <RandomNumber {...animationProps} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Countdown Timer */}
      <CountdownTimer
        duration={3}
        onComplete={() => {}}
        isActive={drawState.status === 'countdown'}
      />

      {/* Header */}
      <div className="py-6 px-8 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{event?.name}</h1>
            <p className="text-muted-foreground">Undian Doorprize</p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="h-4 w-4" />
                <span>Eligible</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{drawState.stats.eligibleParticipants}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Gift className="h-4 w-4" />
                <span>Hadiah</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{drawState.stats.availablePrizes}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Trophy className="h-4 w-4" />
                <span>Pemenang</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{drawState.stats.totalWinners}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        {(drawState.status === 'idle' || drawState.status === 'countdown') && !drawState.winner && (
          <div className="text-center space-y-6">
            <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Trophy className="h-16 w-16 text-primary" />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-2">
                {drawState.status === 'countdown' ? 'Bersiap...' : 'Menunggu Undian'}
              </h2>
              <p className="text-xl text-muted-foreground">
                {drawState.status === 'countdown'
                  ? 'Undian akan segera dimulai'
                  : 'Layar ini akan otomatis menampilkan proses undian'
                }
              </p>
            </div>
          </div>
        )}

        {(drawState.status === 'animating') && (
          <div className="w-full max-w-4xl">
            {/* Prize Info */}
            {drawState.prize && (
              <div className="text-center mb-8">
                <Badge
                  className={`text-lg px-4 py-2 bg-gradient-to-r ${categoryColors[drawState.prize.category]} text-white border-0`}
                >
                  {categoryLabels[drawState.prize.category]}
                </Badge>
                <h2 className="text-3xl font-bold text-foreground mt-4">{drawState.prize.name}</h2>
              </div>
            )}

            {/* Animation */}
            <div className="flex justify-center">
              {renderAnimation() || (
                <div className="text-center space-y-4">
                  <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                  <p className="text-xl text-muted-foreground">Memuat animasi...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {drawState.status === 'result' && drawState.winner && drawState.prize && (
          <div className="text-center space-y-8 animate-fade-in">
            {/* Winner Card */}
            <Card className="max-w-2xl mx-auto overflow-hidden border-2 border-primary/50 bg-gradient-to-br from-background to-primary/5">
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* Prize Badge */}
                  <Badge
                    className={`text-lg px-4 py-2 bg-gradient-to-r ${categoryColors[drawState.prize.category]} text-white border-0`}
                  >
                    {categoryLabels[drawState.prize.category]}
                  </Badge>

                  {/* Prize Image */}
                  {drawState.prize.image_url && (
                    <div className="flex justify-center">
                      <img
                        src={drawState.prize.image_url}
                        alt={drawState.prize.name}
                        className="w-40 h-40 object-cover rounded-xl shadow-lg"
                      />
                    </div>
                  )}

                  {/* Prize Name */}
                  <h2 className="text-3xl font-bold text-foreground">
                    {drawState.prize.name}
                  </h2>

                  <div className="border-t border-border pt-6">
                    {/* Winner Info */}
                    <p className="text-muted-foreground text-lg mb-2">Pemenang</p>
                    <h3 className="text-5xl font-bold text-primary mb-4">
                      {drawState.winner.name}
                    </h3>
                    <div className="flex items-center justify-center gap-4 text-muted-foreground">
                      <span className="text-xl">#{drawState.winner.ticket_number}</span>
                      {drawState.winner.phone && <span>•</span>}
                      {drawState.winner.phone && <span>{drawState.winner.phone}</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Celebration Text */}
            <div className="text-2xl text-muted-foreground animate-pulse">
              🎉 Selamat kepada pemenang! 🎉
            </div>
          </div>
        )}
      </div>

      {/* Footer with Connection Status */}
      <div className="py-4 border-t border-border/50">
        <div className="flex items-center justify-center gap-4">
          <p className="text-sm text-muted-foreground">Display Mode</p>
          <ConnectionStatusBadge status={connectionStatus} onReconnect={reconnect} />
        </div>
      </div>
    </div>
  );
}
