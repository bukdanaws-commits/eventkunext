'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Gift, Trophy, TrendingUp, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  isLoading?: boolean;
}

function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  isLoading,
}: StatCardProps) {
  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {(description || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <span
                className={cn(
                  'text-xs flex items-center gap-0.5',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                <TrendingUp
                  className={cn('h-3 w-3', !trend.isPositive && 'rotate-180')}
                />
                {trend.value}%
              </span>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatsData {
  totalParticipants: number;
  checkedIn: number;
  totalPrizes: number;
  winnersDrawn: number;
}

interface RealtimeStatsCardsProps {
  eventId?: string;
  initialData?: StatsData;
  className?: string;
}

export function RealtimeStatsCards({
  eventId,
  initialData,
  className,
}: RealtimeStatsCardsProps) {
  const [stats, setStats] = useState<StatsData>(
    initialData || {
      totalParticipants: 0,
      checkedIn: 0,
      totalPrizes: 0,
      winnersDrawn: 0,
    }
  );
  const [isLoading, setIsLoading] = useState(!initialData);

  useEffect(() => {
    if (!eventId) return;

    // Simulasi fetch data - ganti dengan API call sebenarnya
    const fetchStats = async () => {
      try {
        // const response = await fetch(`/api/events/${eventId}/stats`);
        // const data = await response.json();
        // setStats(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setIsLoading(false);
      }
    };

    fetchStats();

    // Polling untuk update realtime (setiap 30 detik)
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [eventId]);

  const checkInPercentage =
    stats.totalParticipants > 0
      ? ((stats.checkedIn / stats.totalParticipants) * 100).toFixed(1)
      : '0';

  const winnerPercentage =
    stats.totalPrizes > 0
      ? ((stats.winnersDrawn / stats.totalPrizes) * 100).toFixed(1)
      : '0';

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      <StatCard
        title="Total Peserta"
        value={stats.totalParticipants.toLocaleString()}
        description="peserta terdaftar"
        icon={<Users />}
        isLoading={isLoading}
      />
      <StatCard
        title="Sudah Check-in"
        value={`${stats.checkedIn.toLocaleString()} (${checkInPercentage}%)`}
        description="peserta hadir"
        icon={<UserCheck />}
        trend={{ value: 12, isPositive: true }}
        isLoading={isLoading}
      />
      <StatCard
        title="Total Hadiah"
        value={stats.totalPrizes}
        description="hadiah tersedia"
        icon={<Gift />}
        isLoading={isLoading}
      />
      <StatCard
        title="Pemenang Diundi"
        value={`${stats.winnersDrawn} (${winnerPercentage}%)`}
        description="undian selesai"
        icon={<Trophy />}
        trend={{ value: 5, isPositive: true }}
        isLoading={isLoading}
      />
    </div>
  );
}

// Komponen untuk live activity indicator
export function LiveIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      <span>Live</span>
    </div>
  );
}
