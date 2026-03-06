'use client';

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AttendanceData {
  name: string;
  hadir: number;
  tidakHadir: number;
  total: number;
}

interface AttendanceChartProps {
  data: AttendanceData[];
  title?: string;
  description?: string;
  className?: string;
}

export function AttendanceChart({
  data,
  title = 'Grafik Kehadiran',
  description = 'Statistik kehadiran peserta',
  className,
}: AttendanceChartProps) {
  const totalHadir = data.reduce((sum, item) => sum + item.hadir, 0);
  const totalTidakHadir = data.reduce((sum, item) => sum + item.tidakHadir, 0);
  const totalPeserta = totalHadir + totalTidakHadir;
  const percentageHadir = totalPeserta > 0 ? ((totalHadir / totalPeserta) * 100).toFixed(1) : '0';

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description} • {percentageHadir}% hadir ({totalHadir}/{totalPeserta})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar
                dataKey="hadir"
                name="Hadir"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="tidakHadir"
                name="Tidak Hadir"
                fill="hsl(var(--chart-2))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Komponen ringkasan kehadiran
interface AttendanceSummaryProps {
  total: number;
  hadir: number;
  belumCheckin: number;
  className?: string;
}

export function AttendanceSummary({
  total,
  hadir,
  belumCheckin,
  className,
}: AttendanceSummaryProps) {
  const percentage = total > 0 ? ((hadir / total) * 100).toFixed(1) : '0';

  return (
    <div className={cn('grid grid-cols-3 gap-4', className)}>
      <div className="rounded-lg border bg-card p-4 text-center">
        <p className="text-2xl font-bold">{total}</p>
        <p className="text-xs text-muted-foreground">Total Peserta</p>
      </div>
      <div className="rounded-lg border bg-card p-4 text-center">
        <p className="text-2xl font-bold text-green-600">{hadir}</p>
        <p className="text-xs text-muted-foreground">Sudah Check-in</p>
      </div>
      <div className="rounded-lg border bg-card p-4 text-center">
        <p className="text-2xl font-bold text-yellow-600">{belumCheckin}</p>
        <p className="text-xs text-muted-foreground">Belum Check-in</p>
      </div>
    </div>
  );
}
