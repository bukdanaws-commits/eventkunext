'use client';

import { useState, useEffect, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Users, Gift, Trophy, Calendar, MapPin, Edit, Play, Sparkles, UserPlus, Plus, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { UpgradeTierDialog } from '@/components/payment/UpgradeTierDialog';
import { RealtimeStatsCards } from '@/components/dashboard/RealtimeStatsCards';
import { useCheckinNotifications } from '@/hooks/useCheckinNotifications';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type EventStatus = Database['public']['Enums']['event_status'];
type EventTier = Database['public']['Enums']['event_tier'];

interface PricingTier {
  id: string;
  tier: EventTier;
  name: string;
  price: number;
  max_participants: number;
  max_hiburan: number;
  max_utama: number;
  max_grand_prize: number;
  form_addon_price: number;
}

interface Event {
  id: string;
  name: string;
  status: EventStatus;
  tier: EventTier;
  event_date: string;
  event_time: string | null;
  location: string | null;
  description: string | null;
}

const statusConfig: Record<EventStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  pending_payment: { label: 'Menunggu Pembayaran', variant: 'outline' },
  active: { label: 'Aktif', variant: 'default' },
  completed: { label: 'Selesai', variant: 'secondary' },
  cancelled: { label: 'Dibatalkan', variant: 'destructive' }
};

const tierLabels: Record<EventTier, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise'
};

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

export default function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [tierInfo, setTierInfo] = useState<PricingTier | null>(null);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [prizesCount, setPrizesCount] = useState(0);
  const [winnersCount, setWinnersCount] = useState(0);
  const [prizeStats, setPrizeStats] = useState<{ category: string; label: string; total: number; used: number }[]>([]);
  const [winnerStats, setWinnerStats] = useState<{ category: string; label: string; count: number }[]>([]);
  const [recentWinners, setRecentWinners] = useState<any[]>([]);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);

  // Enable real-time check-in notifications
  useCheckinNotifications({ eventId: id, enabled: event?.status === 'active' });

  useEffect(() => {
    async function fetchData() {
      // Fetch event
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventData) {
        setEvent(eventData as Event);

        // Fetch tier info
        const { data: tierData } = await supabase
          .from('pricing_tiers')
          .select('*')
          .eq('tier', eventData.tier)
          .single();

        if (tierData) {
          setTierInfo(tierData as PricingTier);
        }
      }

      // Fetch counts
      const { count: pCount } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id);
      setParticipantsCount(pCount || 0);

      const { count: prCount } = await supabase
        .from('prizes')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id);
      setPrizesCount(prCount || 0);

      const { count: wCount } = await supabase
        .from('winners')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id);
      setWinnersCount(wCount || 0);

      // Fetch prize stats
      const { data: prizesData } = await supabase
        .from('prizes')
        .select('category, quantity')
        .eq('event_id', id);

      const { data: winnersData } = await supabase
        .from('winners')
        .select('prize_id, prizes(category)')
        .eq('event_id', id);

      const categoryLabels: Record<string, string> = {
        hiburan: 'Hiburan',
        utama: 'Utama',
        grand_prize: 'Grand Prize'
      };

      const stats = ['hiburan', 'utama', 'grand_prize'].map(category => {
        const total = prizesData?.filter(p => p.category === category).reduce((acc, p) => acc + (p.quantity || 1), 0) || 0;
        const used = winnersData?.filter((w: any) => w.prizes?.category === category).length || 0;
        return { category, label: categoryLabels[category], total, used };
      });
      setPrizeStats(stats);

      const wStats = ['hiburan', 'utama', 'grand_prize'].map(category => {
        const count = winnersData?.filter((w: any) => w.prizes?.category === category).length || 0;
        return { category, label: categoryLabels[category], count };
      });
      setWinnerStats(wStats);

      // Fetch recent winners
      const { data: recentWinnersData } = await supabase
        .from('winners')
        .select('id, drawn_at, participants(name), prizes(name, category)')
        .eq('event_id', id)
        .order('drawn_at', { ascending: false })
        .limit(5);
      setRecentWinners(recentWinnersData || []);

      // Fetch pricing tiers
      const { data: tiersData } = await supabase
        .from('pricing_tiers')
        .select('*')
        .order('price', { ascending: true });
      setPricingTiers((tiersData as PricingTier[]) || []);

      setLoading(false);
    }

    fetchData();
  }, [id]);

  const refetchEvent = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    if (data) setEvent(data as Event);
  };

  const categoryLabels: Record<string, string> = {
    hiburan: 'Hiburan',
    utama: 'Utama',
    grand_prize: 'Grand Prize'
  };

  const formatLimit = (limit: number) => limit === -1 ? 'Unlimited' : limit;

  const chartData = winnerStats.map((stat, index) => ({
    name: stat.label,
    value: stat.count,
    color: CHART_COLORS[index]
  })).filter(item => item.value > 0);

  const totalWinners = winnerStats.reduce((acc, stat) => acc + stat.count, 0);

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

  const statusInfo = statusConfig[event.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 p-6 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold">{event.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusInfo.variant} className="text-sm px-3 py-1">
              {statusInfo.label}
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {tierLabels[event.tier]}
            </Badge>
            {event.event_date && (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(event.event_date), 'dd MMM yyyy', { locale: localeId })}
              </Badge>
            )}
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {event.tier !== 'enterprise' && (
            <Button
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
              onClick={() => setUpgradeDialogOpen(true)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade Tier
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push(`/dashboard/events/${id}/settings`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          {event.status === 'active' && (
            <Button onClick={() => router.push(`/dashboard/events/${id}/draw`)}>
              <Play className="mr-2 h-4 w-4" />
              Mulai Undian
            </Button>
          )}
        </div>
      </div>

      {/* Upgrade Dialog */}
      <UpgradeTierDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        event={event}
        pricingTiers={pricingTiers}
        onSuccess={() => {
          setUpgradeDialogOpen(false);
          refetchEvent();
        }}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/events/${id}/participants`)}
              className="flex-1 min-w-[140px]"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Tambah Peserta
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/events/${id}/prizes`)}
              className="flex-1 min-w-[140px]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Hadiah
            </Button>
            <Button
              onClick={() => router.push(`/dashboard/events/${id}/draw`)}
              className="flex-1 min-w-[140px]"
              disabled={event.status !== 'active'}
            >
              <Play className="mr-2 h-4 w-4" />
              Mulai Undian
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Stats */}
      <RealtimeStatsCards eventId={event.id} />

      <div className="grid gap-4 md:grid-cols-4">
        {/* Total Hadiah - Primary/Teal */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary-foreground/90">
              <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Gift className="h-4 w-4 text-primary-foreground" />
              </div>
              Total Hadiah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{prizesCount}</p>
            <p className="text-sm text-primary-foreground/80">Hadiah tersedia</p>
          </CardContent>
        </Card>

        {/* Total Pemenang - Amber/Orange */}
        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-100">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              Total Pemenang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{winnersCount}</p>
            <p className="text-sm text-amber-100">Sudah diundi</p>
          </CardContent>
        </Card>

        {/* Tanggal Event - Blue */}
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-100">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              Tanggal Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {format(new Date(event.event_date), 'dd MMM yyyy', { locale: localeId })}
            </p>
            {event.event_time && (
              <p className="text-sm text-blue-100">
                {event.event_time.slice(0, 5)} WIB
              </p>
            )}
          </CardContent>
        </Card>

        {/* Kapasitas - Emerald/Green */}
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-100">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              Kapasitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{participantsCount}</p>
            <p className="text-sm text-emerald-100">
              dari {tierInfo ? formatLimit(tierInfo.max_participants) : '-'} peserta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Stats Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Winners Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Pemenang per Kategori
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalWinners > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Belum ada pemenang</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prize Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Statistik Hadiah
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {prizeStats.map((stat, index) => {
              const percentage = stat.total > 0 ? (stat.used / stat.total) * 100 : 0;
              return (
                <div key={stat.category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index] }}
                      />
                      <span className="font-medium">{stat.label}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {stat.used} / {stat.total}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
            {prizeStats.every(stat => stat.total === 0) && (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Gift className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Belum ada hadiah</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Winners */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Pemenang Terakhir
          </CardTitle>
          {winnersCount > 5 && (
            <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/events/${id}/winners`)}>
              Lihat Semua
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {recentWinners.length > 0 ? (
            <div className="space-y-3">
              {recentWinners.map((winner) => (
                <div key={winner.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{winner.participants?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{winner.prizes?.name || 'Unknown Prize'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {winner.prizes?.category ? categoryLabels[winner.prizes.category] : '-'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(winner.drawn_at), 'dd MMM, HH:mm', { locale: localeId })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[100px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Belum ada pemenang</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      {event.description && (
        <Card>
          <CardHeader>
            <CardTitle>Deskripsi Event</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{event.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
