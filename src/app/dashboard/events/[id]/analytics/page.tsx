'use client';

import { useState, useEffect, useMemo } from 'react';
import { EventLayout, EventContextValue } from '@/components/layout/EventLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart
} from 'recharts';
import { 
  Users, Gift, Trophy, Clock, TrendingUp, Activity, 
  CheckCircle2, UserCheck, Award, Calendar, BarChart3, CreditCard, RefreshCw
} from 'lucide-react';
import { format, subHours, isAfter, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceChart } from '@/components/analytics/AttendanceChart';
import { ParticipantPaymentReport } from '@/components/payment/ParticipantPaymentReport';
import { RefundManagement } from '@/components/payment/RefundManagement';
import type { Database } from '@/integrations/supabase/types';

type Participant = Database['public']['Tables']['participants']['Row'];
type Winner = Database['public']['Tables']['winners']['Row'];
type Prize = Database['public']['Tables']['prizes']['Row'];

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
];

type ParticipantWithDetails = Participant;
interface WinnerWithDetails extends Winner {
  participant?: Participant | null;
  prize?: Prize | null;
}

function EventAnalyticsContent({ event }: EventContextValue) {
  const [participants, setParticipants] = useState<ParticipantWithDetails[]>([]);
  const [winners, setWinners] = useState<WinnerWithDetails[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [participantsRes, winnersRes, prizesRes] = await Promise.all([
        supabase.from('participants').select('*').eq('event_id', event.id),
        supabase.from('winners').select('*, participant:participants(*), prize:prizes(*)').eq('event_id', event.id),
        supabase.from('prizes').select('*').eq('event_id', event.id)
      ]);

      setParticipants(participantsRes.data || []);
      setWinners(winnersRes.data || []);
      setPrizes(prizesRes.data || []);
      setLoading(false);
    };

    fetchData();
  }, [event.id]);

  // Participant Status Distribution
  const participantStatusData = useMemo(() => {
    const registered = participants.filter(p => p.status === 'registered').length;
    const checkedIn = participants.filter(p => p.status === 'checked_in').length;
    const won = participants.filter(p => p.status === 'won').length;

    return [
      { name: 'Terdaftar', value: registered, color: CHART_COLORS[0] },
      { name: 'Check-in', value: checkedIn, color: CHART_COLORS[1] },
      { name: 'Menang', value: won, color: CHART_COLORS[2] }
    ].filter(item => item.value > 0);
  }, [participants]);

  // Prize Category Distribution
  const prizeCategoryData = useMemo(() => {
    const categories = {
      hiburan: { name: 'Hiburan', total: 0, used: 0 },
      utama: { name: 'Utama', total: 0, used: 0 },
      grand_prize: { name: 'Grand Prize', total: 0, used: 0 }
    };

    prizes.forEach(prize => {
      categories[prize.category].total += prize.quantity;
      categories[prize.category].used += prize.quantity - prize.remaining_quantity;
    });

    return Object.values(categories).map((cat, index) => ({
      ...cat,
      remaining: cat.total - cat.used,
      color: CHART_COLORS[index]
    }));
  }, [prizes]);

  // Winner Timeline (last 24 hours grouped by hour)
  const winnerTimelineData = useMemo(() => {
    const now = new Date();
    const hours: Record<string, number> = {};

    // Initialize last 24 hours
    for (let i = 23; i >= 0; i--) {
      const hour = subHours(now, i);
      const key = format(hour, 'HH:00');
      hours[key] = 0;
    }

    // Count winners per hour
    winners.forEach(winner => {
      const winnerDate = parseISO(winner.drawn_at);
      if (isAfter(winnerDate, subHours(now, 24))) {
        const key = format(winnerDate, 'HH:00');
        if (hours[key] !== undefined) {
          hours[key]++;
        }
      }
    });

    return Object.entries(hours).map(([hour, count]) => ({
      hour,
      pemenang: count
    }));
  }, [winners]);

  // Check-in timeline
  const checkinTimelineData = useMemo(() => {
    const now = new Date();
    const hours: Record<string, number> = {};

    for (let i = 23; i >= 0; i--) {
      const hour = subHours(now, i);
      const key = format(hour, 'HH:00');
      hours[key] = 0;
    }

    participants.forEach(participant => {
      if (participant.checked_in_at) {
        const checkinDate = parseISO(participant.checked_in_at);
        if (isAfter(checkinDate, subHours(now, 24))) {
          const key = format(checkinDate, 'HH:00');
          if (hours[key] !== undefined) {
            hours[key]++;
          }
        }
      }
    });

    return Object.entries(hours).map(([hour, count]) => ({
      hour,
      checkin: count
    }));
  }, [participants]);

  // Animation Usage Stats
  const animationData = useMemo(() => {
    const animations: Record<string, number> = {
      spin_wheel: 0,
      slot_machine: 0,
      card_reveal: 0,
      random_number: 0
    };

    const labels: Record<string, string> = {
      spin_wheel: 'Spin Wheel',
      slot_machine: 'Slot Machine',
      card_reveal: 'Card Reveal',
      random_number: 'Random Number'
    };

    winners.forEach(winner => {
      if (animations[winner.animation_used] !== undefined) {
        animations[winner.animation_used]++;
      }
    });

    return Object.entries(animations).map(([key, value], index) => ({
      name: labels[key],
      value,
      color: CHART_COLORS[index]
    })).filter(item => item.value > 0);
  }, [winners]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalParticipants = participants.length;
    const checkedIn = participants.filter(p => p.status === 'checked_in' || p.status === 'won').length;
    const totalPrizes = prizes.reduce((acc, p) => acc + p.quantity, 0);
    const usedPrizes = prizes.reduce((acc, p) => acc + (p.quantity - p.remaining_quantity), 0);
    const checkinRate = totalParticipants > 0 ? (checkedIn / totalParticipants) * 100 : 0;
    const prizeDistributionRate = totalPrizes > 0 ? (usedPrizes / totalPrizes) * 100 : 0;

    return {
      totalParticipants,
      checkedIn,
      totalWinners: winners.length,
      totalPrizes,
      usedPrizes,
      remainingPrizes: totalPrizes - usedPrizes,
      checkinRate,
      prizeDistributionRate
    };
  }, [participants, winners, prizes]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="animate-pulse text-muted-foreground">Memuat data analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Statistik undian dan engagement peserta</p>
        </div>
      </div>

      {/* Key Metrics - Colorful Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Total Peserta - Primary/Teal */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary-foreground/90">
              <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary-foreground" />
              </div>
              Total Peserta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalParticipants}</p>
            <p className="text-sm text-primary-foreground/80">
              {stats.checkedIn} sudah check-in
            </p>
          </CardContent>
        </Card>

        {/* Check-in Rate - Blue */}
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-100">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-white" />
              </div>
              Check-in Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.checkinRate.toFixed(1)}%</p>
            <Progress value={stats.checkinRate} className="mt-2 h-2 bg-white/20" />
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
            <p className="text-3xl font-bold">{stats.totalWinners}</p>
            <p className="text-sm text-amber-100">dari {stats.usedPrizes} hadiah</p>
          </CardContent>
        </Card>

        {/* Distribusi Hadiah - Emerald/Green */}
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-100">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Gift className="h-4 w-4 text-white" />
              </div>
              Distribusi Hadiah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.prizeDistributionRate.toFixed(1)}%</p>
            <Progress value={stats.prizeDistributionRate} className="mt-2 h-2 bg-white/20" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different analytics views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
          <TabsTrigger value="participants">Peserta</TabsTrigger>
          <TabsTrigger value="prizes">Hadiah</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          {event.is_paid_event && (
            <>
              <TabsTrigger value="payments">
                <CreditCard className="h-4 w-4 mr-1" />
                Pembayaran
              </TabsTrigger>
              <TabsTrigger value="refunds">
                <RefreshCw className="h-4 w-4 mr-1" />
                Refund
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Participant Status Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Status Peserta
                </CardTitle>
              </CardHeader>
              <CardContent>
                {participantStatusData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={participantStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {participantStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <p>Belum ada data peserta</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Animation Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Penggunaan Animasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {animationData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={animationData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" name="Penggunaan">
                          {animationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <p>Belum ada undian dilakukan</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceChart 
            participants={participants} 
            title="Laporan Kehadiran"
          />
        </TabsContent>

        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Check-in Timeline (24 Jam Terakhir)
              </CardTitle>
              <CardDescription>Jumlah check-in per jam</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={checkinTimelineData}>
                    <defs>
                      <linearGradient id="colorCheckin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="checkin"
                      name="Check-in"
                      stroke="hsl(var(--chart-1))"
                      fill="url(#colorCheckin)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prizes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Prize Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  Distribusi Kategori Hadiah
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prizeCategoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="used" name="Terpakai" stackId="a" fill="hsl(var(--chart-1))" />
                      <Bar dataKey="remaining" name="Tersisa" stackId="a" fill="hsl(var(--chart-2))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Prize Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Statistik per Kategori
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {prizeCategoryData.map((category, index) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: CHART_COLORS[index] }} 
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {category.used} / {category.total}
                      </span>
                    </div>
                    <Progress 
                      value={category.total > 0 ? (category.used / category.total) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Pemenang Timeline (24 Jam Terakhir)
              </CardTitle>
              <CardDescription>Jumlah pemenang per jam</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={winnerTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="pemenang"
                      name="Pemenang"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-2))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {event.is_paid_event && (
          <>
            <TabsContent value="payments">
              <ParticipantPaymentReport eventId={event.id} />
            </TabsContent>
            <TabsContent value="refunds">
              <RefundManagement eventId={event.id} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

export default function EventAnalytics() {
  return (
    <EventLayout>
      {(context) => <EventAnalyticsContent {...context} />}
    </EventLayout>
  );
}
