'use client';

import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, Users, Calendar, Repeat } from 'lucide-react';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { SessionErrorAlert } from '@/components/admin/SessionErrorAlert';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  LineChart,
  Line,
  Legend,
  ComposedChart
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays, subWeeks, startOfWeek, endOfWeek, eachWeekOfInterval, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface CohortData {
  cohort: string;
  users: number;
  week0: number;
  week1: number;
  week2: number;
  week3: number;
  week4: number;
}

interface RetentionData {
  period: string;
  totalUsers: number;
  activeUsers: number;
  retentionRate: number;
}

interface UserActivityData {
  date: string;
  newUsers: number;
  activeUsers: number;
  churned: number;
}

interface RevenueGrowthData {
  month: string;
  revenue: number;
  mrr: number;
  growthRate: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminAnalytics() {
  const { isRefreshing, sessionError, clearSessionError, refreshSession, handleApiError } = useSessionRefresh();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');
  const [cohortData, setCohortData] = useState<CohortData[]>([]);
  const [retentionData, setRetentionData] = useState<RetentionData[]>([]);
  const [userActivityData, setUserActivityData] = useState<UserActivityData[]>([]);
  const [revenueGrowthData, setRevenueGrowthData] = useState<RevenueGrowthData[]>([]);
  const [metrics, setMetrics] = useState({
    avgRetention: 0,
    avgLTV: 0,
    churnRate: 0,
    mrrGrowth: 0,
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  async function fetchAnalyticsData() {
    setLoading(true);
    
    try {
      const now = new Date();
      const monthsToFetch = timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : 12;
      
      // Fetch user profiles for cohort analysis
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id, user_id, created_at')
        .order('created_at', { ascending: true });

      // Fetch events to track user activity
      const { data: events } = await supabase
        .from('events')
        .select('id, created_by, created_at, organization_id')
        .order('created_at', { ascending: true });

      // Fetch payments for revenue metrics
      const { data: payments } = await supabase
        .from('event_payments')
        .select('id, total_amount, created_at, paid_at, payment_status, organization_id')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: true });

      // Generate cohort data
      const cohorts: CohortData[] = [];
      for (let i = monthsToFetch - 1; i >= 0; i--) {
        const cohortStart = startOfMonth(subMonths(now, i));
        const cohortEnd = endOfMonth(subMonths(now, i));
        const cohortLabel = format(cohortStart, 'MMM yyyy', { locale: localeId });
        
        // Users who signed up in this cohort
        const cohortUsers = users?.filter(u => {
          const createdAt = new Date(u.created_at);
          return createdAt >= cohortStart && createdAt <= cohortEnd;
        }) || [];

        // Track retention by week
        const weekRetention = [0, 0, 0, 0, 0];
        const cohortUserIds = new Set(cohortUsers.map(u => u.user_id));
        
        if (cohortUsers.length > 0) {
          weekRetention[0] = 100; // Week 0 is always 100%
          
          for (let week = 1; week <= 4; week++) {
            const weekStart = new Date(cohortEnd.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(cohortEnd.getTime() + week * 7 * 24 * 60 * 60 * 1000);
            
            const activeInWeek = events?.filter(e => {
              if (!e.created_by) return false;
              const eventDate = new Date(e.created_at);
              return cohortUserIds.has(e.created_by) && eventDate >= weekStart && eventDate <= weekEnd;
            }).length || 0;
            
            weekRetention[week] = Math.min(100, Math.round((activeInWeek / cohortUsers.length) * 100));
          }
        }

        cohorts.push({
          cohort: cohortLabel,
          users: cohortUsers.length,
          week0: weekRetention[0],
          week1: weekRetention[1],
          week2: weekRetention[2],
          week3: weekRetention[3],
          week4: weekRetention[4],
        });
      }
      setCohortData(cohorts);

      // Generate monthly retention data
      const retentionStats: RetentionData[] = [];
      for (let i = monthsToFetch - 1; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(subMonths(now, i));
        const prevMonthStart = startOfMonth(subMonths(now, i + 1));
        const prevMonthEnd = endOfMonth(subMonths(now, i + 1));
        
        const totalUsersInMonth = users?.filter(u => 
          new Date(u.created_at) <= monthEnd
        ).length || 0;
        
        // Active users = users who created events in this month
        const activeUserIds = new Set(
          events?.filter(e => {
            const eventDate = new Date(e.created_at);
            return eventDate >= monthStart && eventDate <= monthEnd;
          }).map(e => e.created_by).filter(Boolean)
        );
        
        const activeUsers = activeUserIds.size;
        const retentionRate = totalUsersInMonth > 0 ? (activeUsers / totalUsersInMonth) * 100 : 0;
        
        retentionStats.push({
          period: format(monthStart, 'MMM', { locale: localeId }),
          totalUsers: totalUsersInMonth,
          activeUsers,
          retentionRate: Math.round(retentionRate * 10) / 10,
        });
      }
      setRetentionData(retentionStats);

      // Generate user activity timeline
      const activityData: UserActivityData[] = [];
      for (let i = monthsToFetch - 1; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(subMonths(now, i));
        
        const newUsersCount = users?.filter(u => {
          const createdAt = new Date(u.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        }).length || 0;
        
        const activeUserIds = new Set(
          events?.filter(e => {
            const eventDate = new Date(e.created_at);
            return eventDate >= monthStart && eventDate <= monthEnd;
          }).map(e => e.created_by).filter(Boolean)
        );
        
        const totalBefore = users?.filter(u => new Date(u.created_at) < monthStart).length || 0;
        const churnedEstimate = Math.max(0, totalBefore - activeUserIds.size);
        
        activityData.push({
          date: format(monthStart, 'MMM', { locale: localeId }),
          newUsers: newUsersCount,
          activeUsers: activeUserIds.size,
          churned: Math.round(churnedEstimate * 0.1), // Estimated churn
        });
      }
      setUserActivityData(activityData);

      // Generate revenue growth data
      const revenueData: RevenueGrowthData[] = [];
      let previousRevenue = 0;
      
      for (let i = monthsToFetch - 1; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(subMonths(now, i));
        
        const monthRevenue = payments?.filter(p => {
          const paidAt = p.paid_at ? new Date(p.paid_at) : new Date(p.created_at);
          return paidAt >= monthStart && paidAt <= monthEnd;
        }).reduce((sum, p) => sum + p.total_amount, 0) || 0;
        
        const growthRate = previousRevenue > 0 ? ((monthRevenue - previousRevenue) / previousRevenue) * 100 : 0;
        
        revenueData.push({
          month: format(monthStart, 'MMM', { locale: localeId }),
          revenue: monthRevenue,
          mrr: monthRevenue, // Simplified MRR
          growthRate: Math.round(growthRate * 10) / 10,
        });
        
        previousRevenue = monthRevenue;
      }
      setRevenueGrowthData(revenueData);

      // Calculate summary metrics
      const avgRetention = retentionStats.reduce((sum, r) => sum + r.retentionRate, 0) / retentionStats.length;
      const totalRevenue = payments?.reduce((sum, p) => sum + p.total_amount, 0) || 0;
      const totalUsers = users?.length || 1;
      const avgLTV = totalRevenue / totalUsers;
      const lastMonthRetention = retentionStats[retentionStats.length - 1]?.retentionRate || 0;
      const churnRate = 100 - lastMonthRetention;
      const lastGrowth = revenueData[revenueData.length - 1]?.growthRate || 0;

      setMetrics({
        avgRetention: Math.round(avgRetention * 10) / 10,
        avgLTV: Math.round(avgLTV),
        churnRate: Math.round(churnRate * 10) / 10,
        mrrGrowth: lastGrowth,
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  }

  const cohortHeatmapColors = (value: number) => {
    if (value >= 80) return 'bg-emerald-500 text-white';
    if (value >= 60) return 'bg-emerald-400 text-white';
    if (value >= 40) return 'bg-emerald-300 text-emerald-900';
    if (value >= 20) return 'bg-emerald-200 text-emerald-900';
    if (value > 0) return 'bg-emerald-100 text-emerald-900';
    return 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Advanced Analytics</h1>
            <p className="text-muted-foreground mt-1">Cohort analysis, retention metrics, dan growth insights</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">3 Bulan</SelectItem>
              <SelectItem value="6months">6 Bulan</SelectItem>
              <SelectItem value="12months">12 Bulan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Avg Retention Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgRetention}%</div>
              <div className="flex items-center gap-1 mt-1">
                <Repeat className="h-4 w-4 text-blue-200" />
                <span className="text-sm text-blue-100">Active users ratio</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100">Avg LTV</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.avgLTV)}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-4 w-4 text-emerald-200" />
                <span className="text-sm text-emerald-100">Per user lifetime</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-500 to-pink-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-rose-100">Churn Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.churnRate}%</div>
              <div className="flex items-center gap-1 mt-1">
                <Users className="h-4 w-4 text-rose-200" />
                <span className="text-sm text-rose-100">Monthly churn</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-violet-100">MRR Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.mrrGrowth >= 0 ? '+' : ''}{metrics.mrrGrowth}%</div>
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="h-4 w-4 text-violet-200" />
                <span className="text-sm text-violet-100">Month over month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="cohort" className="space-y-4">
          <TabsList className="bg-purple-100 dark:bg-purple-900">
            <TabsTrigger value="cohort" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Cohort Analysis
            </TabsTrigger>
            <TabsTrigger value="retention" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Retention
            </TabsTrigger>
            <TabsTrigger value="growth" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Growth
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              User Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cohort">
            <Card>
              <CardHeader>
                <CardTitle>Cohort Retention Heatmap</CardTitle>
                <CardDescription>
                  Persentase user yang tetap aktif setiap minggu setelah signup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left p-2 font-medium text-muted-foreground">Cohort</th>
                        <th className="text-center p-2 font-medium text-muted-foreground">Users</th>
                        <th className="text-center p-2 font-medium text-muted-foreground">Week 0</th>
                        <th className="text-center p-2 font-medium text-muted-foreground">Week 1</th>
                        <th className="text-center p-2 font-medium text-muted-foreground">Week 2</th>
                        <th className="text-center p-2 font-medium text-muted-foreground">Week 3</th>
                        <th className="text-center p-2 font-medium text-muted-foreground">Week 4</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cohortData.map((cohort) => (
                        <tr key={cohort.cohort}>
                          <td className="p-2 font-medium">{cohort.cohort}</td>
                          <td className="text-center p-2">{cohort.users}</td>
                          <td className="p-1">
                            <div className={`text-center p-2 rounded ${cohortHeatmapColors(cohort.week0)}`}>
                              {cohort.week0}%
                            </div>
                          </td>
                          <td className="p-1">
                            <div className={`text-center p-2 rounded ${cohortHeatmapColors(cohort.week1)}`}>
                              {cohort.week1}%
                            </div>
                          </td>
                          <td className="p-1">
                            <div className={`text-center p-2 rounded ${cohortHeatmapColors(cohort.week2)}`}>
                              {cohort.week2}%
                            </div>
                          </td>
                          <td className="p-1">
                            <div className={`text-center p-2 rounded ${cohortHeatmapColors(cohort.week3)}`}>
                              {cohort.week3}%
                            </div>
                          </td>
                          <td className="p-1">
                            <div className={`text-center p-2 rounded ${cohortHeatmapColors(cohort.week4)}`}>
                              {cohort.week4}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                  <span>Rendah</span>
                  <div className="flex gap-1">
                    <div className="w-6 h-4 rounded bg-emerald-100" />
                    <div className="w-6 h-4 rounded bg-emerald-200" />
                    <div className="w-6 h-4 rounded bg-emerald-300" />
                    <div className="w-6 h-4 rounded bg-emerald-400" />
                    <div className="w-6 h-4 rounded bg-emerald-500" />
                  </div>
                  <span>Tinggi</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retention">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Retention Rate</CardTitle>
                  <CardDescription>Persentase user aktif per bulan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={retentionData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="period" className="text-xs" />
                        <YAxis yAxisId="left" className="text-xs" />
                        <YAxis yAxisId="right" orientation="right" className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="totalUsers" name="Total Users" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="activeUsers" name="Active Users" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="retentionRate" name="Retention %" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Retention Trend</CardTitle>
                  <CardDescription>Tren retention rate dari waktu ke waktu</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={retentionData}>
                        <defs>
                          <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="period" className="text-xs" />
                        <YAxis className="text-xs" domain={[0, 100]} />
                        <Tooltip
                          formatter={(value: number) => [`${value}%`, 'Retention Rate']}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="retentionRate"
                          stroke="#8b5cf6"
                          fillOpacity={1}
                          fill="url(#colorRetention)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="growth">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Growth</CardTitle>
                  <CardDescription>Pertumbuhan revenue bulanan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={revenueGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis yAxisId="left" className="text-xs" tickFormatter={(v) => `${(v/1000000).toFixed(0)}jt`} />
                        <YAxis yAxisId="right" orientation="right" className="text-xs" />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            name === 'growthRate' ? `${value}%` : formatCurrency(value),
                            name === 'growthRate' ? 'Growth Rate' : 'Revenue'
                          ]}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="growthRate" name="Growth %" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>MRR Trend</CardTitle>
                  <CardDescription>Monthly Recurring Revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueGrowthData}>
                        <defs>
                          <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(v) => `${(v/1000000).toFixed(0)}jt`} />
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value), 'MRR']}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="mrr"
                          stroke="#10b981"
                          fillOpacity={1}
                          fill="url(#colorMRR)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>User Activity Over Time</CardTitle>
                <CardDescription>New users, active users, dan churned users per bulan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userActivityData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="newUsers" name="New Users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="activeUsers" name="Active Users" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="churned" name="Churned" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
