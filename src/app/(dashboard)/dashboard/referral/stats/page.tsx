'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Users, DollarSign, Target, ArrowLeft } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

interface MonthlyData {
  month: string;
  signups: number;
  conversions: number;
  earnings: number;
}

interface Commission {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface Referral {
  id: string;
  created_at: string;
  converted_at: string | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function ReferralStatsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalSignups: 0,
    totalConversions: 0,
    totalEarnings: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;

      setLoading(true);

      // In a real app, this would fetch from an API
      // For demo, we'll generate placeholder data
      const months: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        months.push({
          month: format(monthDate, 'MMM yy', { locale: id }),
          signups: Math.floor(Math.random() * 10),
          conversions: Math.floor(Math.random() * 5),
          earnings: Math.floor(Math.random() * 500000),
        });
      }

      setMonthlyData(months);

      // Calculate totals
      const totalSignups = months.reduce((sum, m) => sum + m.signups, 0);
      const totalConversions = months.reduce((sum, m) => sum + m.conversions, 0);
      const totalEarnings = months.reduce((sum, m) => sum + m.earnings, 0);

      setTotalStats({
        totalSignups,
        totalConversions,
        totalEarnings,
        conversionRate: totalSignups > 0 ? (totalConversions / totalSignups) * 100 : 0,
      });

      setLoading(false);
    }

    if (!authLoading && user) {
      fetchStats();
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-card">
          <div className="h-16 flex items-center px-4 border-b">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
              <span>Prize Party</span>
            </Link>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/dashboard/billing" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              Billing
            </Link>
            <Link href="/dashboard/referral" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground">
              Referral
            </Link>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-background/95 backdrop-blur flex items-center px-4 md:px-6">
            <Link href="/dashboard/referral" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali</span>
            </Link>
            <h1 className="font-semibold ml-4">Statistik Referral</h1>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Statistik Referral</h1>
                <p className="text-muted-foreground">
                  Pantau performa referral Anda dengan grafik dan statistik
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Summary Stats */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Signup</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalStats.totalSignups}</div>
                        <p className="text-xs text-muted-foreground">Sepanjang waktu</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Konversi</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalStats.totalConversions}</div>
                        <p className="text-xs text-muted-foreground">Yang sudah bayar</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalStats.conversionRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">Signup ke konversi</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(totalStats.totalEarnings)}
                        </div>
                        <p className="text-xs text-muted-foreground">Sudah dibayarkan</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Signups & Conversions Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Signup & Konversi Bulanan</CardTitle>
                      <CardDescription>Performa referral 6 bulan terakhir</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                              dataKey="month"
                              tick={{ fontSize: 12 }}
                              className="text-muted-foreground"
                            />
                            <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                            />
                            <Legend />
                            <Bar
                              dataKey="signups"
                              name="Signup"
                              fill="hsl(var(--primary))"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="conversions"
                              name="Konversi"
                              fill="hsl(142 76% 36%)"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Earnings Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Pendapatan Bulanan</CardTitle>
                      <CardDescription>Komisi yang sudah dibayarkan per bulan</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                              dataKey="month"
                              tick={{ fontSize: 12 }}
                              className="text-muted-foreground"
                            />
                            <YAxis
                              tick={{ fontSize: 12 }}
                              className="text-muted-foreground"
                              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                              formatter={(value: number) => [formatCurrency(value), 'Pendapatan']}
                            />
                            <Line
                              type="monotone"
                              dataKey="earnings"
                              name="Pendapatan"
                              stroke="hsl(142 76% 36%)"
                              strokeWidth={3}
                              dot={{ fill: 'hsl(142 76% 36%)', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Monthly Breakdown Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Breakdown Bulanan</CardTitle>
                      <CardDescription>Detail performa per bulan</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="p-3 text-left font-medium">Bulan</th>
                              <th className="p-3 text-center font-medium">Signup</th>
                              <th className="p-3 text-center font-medium">Konversi</th>
                              <th className="p-3 text-center font-medium">Rate</th>
                              <th className="p-3 text-right font-medium">Pendapatan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monthlyData.map((data, index) => (
                              <tr key={index} className="border-b last:border-0">
                                <td className="p-3 font-medium">{data.month}</td>
                                <td className="p-3 text-center">{data.signups}</td>
                                <td className="p-3 text-center">{data.conversions}</td>
                                <td className="p-3 text-center">
                                  {data.signups > 0
                                    ? `${((data.conversions / data.signups) * 100).toFixed(0)}%`
                                    : '-'}
                                </td>
                                <td className="p-3 text-right font-medium text-green-600">
                                  {formatCurrency(data.earnings)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
