'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, Calendar, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Download, UserPlus, RefreshCw, Wifi } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuditLog } from '@/hooks/useAdminAuditLog';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { SessionErrorAlert } from '@/components/admin/SessionErrorAlert';
import * as XLSX from 'xlsx';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface KPIData {
  totalRevenue: number;
  totalUsers: number;
  totalEvents: number;
  conversionRate: number;
  revenueGrowth: number;
  userGrowth: number;
  eventGrowth: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  users: number;
  events: number;
}

interface TierDistribution {
  name: string;
  value: number;
  color: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const TIER_COLORS = {
  free: '#94a3b8',
  basic: '#3b82f6',
  pro: '#8b5cf6',
  enterprise: '#f59e0b',
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const { logAction } = useAdminAuditLog();
  const { isRefreshing, sessionError, clearSessionError, refreshSession, handleApiError } = useSessionRefresh();
  const [loading, setLoading] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [kpiData, setKpiData] = useState<KPIData>({
    totalRevenue: 0,
    totalUsers: 0,
    totalEvents: 0,
    conversionRate: 0,
    revenueGrowth: 0,
    userGrowth: 0,
    eventGrowth: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [tierDistribution, setTierDistribution] = useState<TierDistribution[]>([]);

  // Add User state
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<string>('owner');
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    fetchDashboardData();

    // Setup realtime subscription for user_profiles
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
        },
        () => {
          // Refresh data when user profiles change
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        () => {
          // Refresh data when events change
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_payments',
        },
        () => {
          // Refresh data when payments change
          fetchDashboardData();
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Email dan password wajib diisi',
      });
      return;
    }

    if (newUserPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Password minimal 6 karakter',
      });
      return;
    }

    setCreatingUser(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            email: newUserEmail,
            password: newUserPassword,
            fullName: newUserFullName,
            phone: newUserPhone,
            role: newUserRole,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal membuat user');
      }

      // Log audit action
      await logAction({
        action: 'user_created',
        targetType: 'user',
        targetId: result.user?.id,
        details: {
          email: newUserEmail,
          full_name: newUserFullName,
          role: newUserRole,
        },
      });

      toast({
        title: 'User Berhasil Dibuat',
        description: `User ${newUserEmail} berhasil ditambahkan`,
      });

      // Reset form and close dialog
      setAddUserDialogOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
      setNewUserPhone('');
      setNewUserRole('owner');

      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal membuat user',
      });
    } finally {
      setCreatingUser(false);
    }
  };

  async function fetchDashboardData() {
    setLoading(true);
    
    try {
      // Fetch total revenue from paid payments
      const { data: payments } = await supabase
        .from('event_payments')
        .select('total_amount, created_at, tier')
        .eq('payment_status', 'paid');

      const totalRevenue = payments?.reduce((sum, p) => sum + p.total_amount, 0) || 0;

      // Fetch total users
      const { count: userCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total events
      const { data: events, count: eventCount } = await supabase
        .from('events')
        .select('tier, status, created_at', { count: 'exact' });

      // Calculate conversion rate (paid events / total events)
      const paidEventsCount = events?.filter(e => e.status === 'active' || e.status === 'completed').length || 0;
      const conversionRate = eventCount ? (paidEventsCount / eventCount) * 100 : 0;

      // Calculate growth rates (comparing current month vs last month)
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      // Revenue growth
      const currentMonthRevenue = payments?.filter(p => 
        new Date(p.created_at) >= currentMonthStart
      ).reduce((sum, p) => sum + p.total_amount, 0) || 0;

      const lastMonthRevenue = payments?.filter(p => 
        new Date(p.created_at) >= lastMonthStart && new Date(p.created_at) <= lastMonthEnd
      ).reduce((sum, p) => sum + p.total_amount, 0) || 0;

      const revenueGrowth = lastMonthRevenue ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      // Fetch user profiles for growth calculation
      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('created_at');

      // Calculate user growth
      const currentMonthUsers = userProfiles?.filter(u => 
        new Date(u.created_at) >= currentMonthStart
      ).length || 0;

      const lastMonthUsers = userProfiles?.filter(u => 
        new Date(u.created_at) >= lastMonthStart && new Date(u.created_at) <= lastMonthEnd
      ).length || 0;

      const userGrowth = lastMonthUsers ? ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0;

      // Calculate event growth
      const currentMonthEvents = events?.filter(e => 
        new Date(e.created_at) >= currentMonthStart
      ).length || 0;

      const lastMonthEvents = events?.filter(e => 
        new Date(e.created_at) >= lastMonthStart && new Date(e.created_at) <= lastMonthEnd
      ).length || 0;

      const eventGrowth = lastMonthEvents ? ((currentMonthEvents - lastMonthEvents) / lastMonthEvents) * 100 : 0;

      // Generate monthly data for charts (last 6 months)
      const monthlyStats: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(subMonths(now, i));
        
        const monthRevenue = payments?.filter(p => {
          const date = new Date(p.created_at);
          return date >= monthStart && date <= monthEnd;
        }).reduce((sum, p) => sum + p.total_amount, 0) || 0;

        const monthEvents = events?.filter(e => {
          const date = new Date(e.created_at);
          return date >= monthStart && date <= monthEnd;
        }).length || 0;

        const monthUsers = userProfiles?.filter(u => {
          const date = new Date(u.created_at);
          return date >= monthStart && date <= monthEnd;
        }).length || 0;

        monthlyStats.push({
          month: format(monthStart, 'MMM', { locale: localeId }),
          revenue: monthRevenue,
          users: monthUsers,
          events: monthEvents,
        });
      }

      // Tier distribution
      const tierCounts = {
        free: events?.filter(e => e.tier === 'free').length || 0,
        basic: events?.filter(e => e.tier === 'basic').length || 0,
        pro: events?.filter(e => e.tier === 'pro').length || 0,
        enterprise: events?.filter(e => e.tier === 'enterprise').length || 0,
      };

      const tierDist: TierDistribution[] = [
        { name: 'Free', value: tierCounts.free, color: TIER_COLORS.free },
        { name: 'Basic', value: tierCounts.basic, color: TIER_COLORS.basic },
        { name: 'Pro', value: tierCounts.pro, color: TIER_COLORS.pro },
        { name: 'Enterprise', value: tierCounts.enterprise, color: TIER_COLORS.enterprise },
      ];

      setKpiData({
        totalRevenue,
        totalUsers: userCount || 0,
        totalEvents: eventCount || 0,
        conversionRate,
        revenueGrowth,
        userGrowth,
        eventGrowth,
      });
      setMonthlyData(monthlyStats);
      setTierDistribution(tierDist);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </AdminLayout>
    );
  }

  const exportDashboardData = () => {
    // Export monthly data
    const monthlyExport = monthlyData.map(m => ({
      'Bulan': m.month,
      'Revenue': m.revenue,
      'Users Baru': m.users,
      'Events Baru': m.events,
    }));

    // Export tier distribution
    const tierExport = tierDistribution.map(t => ({
      'Tier': t.name,
      'Jumlah Events': t.value,
    }));

    // Export KPI summary
    const kpiExport = [{
      'Metric': 'Total Revenue',
      'Value': kpiData.totalRevenue,
      'Growth': `${kpiData.revenueGrowth.toFixed(1)}%`,
    }, {
      'Metric': 'Total Users',
      'Value': kpiData.totalUsers,
      'Growth': `${kpiData.userGrowth.toFixed(1)}%`,
    }, {
      'Metric': 'Total Events',
      'Value': kpiData.totalEvents,
      'Growth': `${kpiData.eventGrowth.toFixed(1)}%`,
    }, {
      'Metric': 'Conversion Rate',
      'Value': `${kpiData.conversionRate.toFixed(1)}%`,
      'Growth': '-',
    }];

    const wb = XLSX.utils.book_new();
    
    const wsMonthly = XLSX.utils.json_to_sheet(monthlyExport);
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'Monthly Data');
    
    const wsTier = XLSX.utils.json_to_sheet(tierExport);
    XLSX.utils.book_append_sheet(wb, wsTier, 'Tier Distribution');
    
    const wsKPI = XLSX.utils.json_to_sheet(kpiExport);
    XLSX.utils.book_append_sheet(wb, wsKPI, 'KPI Summary');
    
    XLSX.writeFile(wb, `dashboard_report_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <SessionErrorAlert 
          error={sessionError} 
          isRefreshing={isRefreshing} 
          onRefresh={refreshSession}
          onDismiss={clearSessionError}
        />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">Monitor performa platform secara real-time</p>
              {isRealtimeConnected && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <Wifi className="h-3 w-3" />
                  Live
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => fetchDashboardData()} variant="outline" size="icon" title="Refresh Data">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setAddUserDialogOpen(true)} variant="default" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Tambah User
            </Button>
            <Button onClick={exportDashboardData} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue */}
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100">Total Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-emerald-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpiData.totalRevenue)}</div>
              <div className="flex items-center gap-1 mt-1">
                {kpiData.revenueGrowth >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-200" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-300" />
                )}
                <span className="text-sm text-emerald-100">
                  {kpiData.revenueGrowth >= 0 ? '+' : ''}{kpiData.revenueGrowth.toFixed(1)}% dari bulan lalu
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Total Users */}
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Total Users</CardTitle>
              <Users className="h-5 w-5 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.totalUsers.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-4 w-4 text-blue-200" />
                <span className="text-sm text-blue-100">+{kpiData.userGrowth.toFixed(1)}% dari bulan lalu</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Events */}
          <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Total Events</CardTitle>
              <Calendar className="h-5 w-5 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.totalEvents.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-4 w-4 text-purple-200" />
                <span className="text-sm text-purple-100">+{kpiData.eventGrowth.toFixed(1)}% dari bulan lalu</span>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-100">Conversion Rate</CardTitle>
              <TrendingUp className="h-5 w-5 text-amber-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.conversionRate.toFixed(1)}%</div>
              <div className="text-sm text-amber-100 mt-1">
                Events aktif / Total events
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                Revenue Trend
              </CardTitle>
              <CardDescription>Pendapatan 6 bulan terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis 
                      className="text-xs" 
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Events Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-purple-500" />
                Events Created
              </CardTitle>
              <CardDescription>Event baru per bulan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => [value, 'Events']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="events" 
                      fill="#8b5cf6" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              User Growth
            </CardTitle>
            <CardDescription>Pertumbuhan user baru per bulan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Users Baru']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Tier Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Tier Distribution</CardTitle>
              <CardDescription>Distribusi events berdasarkan tier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tierDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {tierDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {tierDistribution.map((tier) => (
                  <div key={tier.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tier.color }} />
                    <span className="text-sm text-muted-foreground">{tier.name}: {tier.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Statistik cepat platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-muted-foreground">Avg Revenue per Event</div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {formatCurrency(kpiData.totalEvents ? kpiData.totalRevenue / kpiData.totalEvents : 0)}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border border-purple-200 dark:border-purple-800">
                  <div className="text-sm text-muted-foreground">Avg Events per User</div>
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                    {kpiData.totalUsers ? (kpiData.totalEvents / kpiData.totalUsers).toFixed(2) : 0}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-sm text-muted-foreground">Paid Events</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {tierDistribution.filter(t => t.name !== 'Free').reduce((sum, t) => sum + t.value, 0)}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border border-amber-200 dark:border-amber-800">
                  <div className="text-sm text-muted-foreground">Free Events</div>
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {tierDistribution.find(t => t.name === 'Free')?.value || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add User Dialog */}
        <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
              <DialogDescription>
                Buat akun user baru dari sisi admin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-email">Email *</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="email@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Password *</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-fullname">Nama Lengkap</Label>
                <Input
                  id="new-fullname"
                  placeholder="Nama lengkap user"
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-phone">No. Telepon</Label>
                <Input
                  id="new-phone"
                  placeholder="08xxxxxxxxxx"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddUserDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleCreateUser} disabled={creatingUser}>
                {creatingUser ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Membuat...
                  </>
                ) : (
                  'Buat User'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
