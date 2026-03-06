'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { Shield, ShieldAlert, ShieldCheck, Users, TrendingUp, AlertTriangle } from "lucide-react";
import LoginMap from "@/components/admin/LoginMap";

const AdminSecurityStatsPage = () => {
  const [dateRange, setDateRange] = useState("7");

  const { data: loginStats, isLoading: isLoadingLoginStats } = useQuery({
    queryKey: ["login-stats", dateRange],
    queryFn: async () => {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      const endDate = endOfDay(new Date());

      const { data: logs, error } = await supabase
        .from("login_logs")
        .select("login_at, user_id")
        .gte("login_at", startDate.toISOString())
        .lte("login_at", endDate.toISOString())
        .order("login_at", { ascending: true });

      if (error) throw error;

      // Group by date
      const dailyStats: Record<string, { date: string; logins: number; uniqueUsers: Set<string> }> = {};
      
      for (let i = 0; i <= parseInt(dateRange); i++) {
        const date = format(subDays(new Date(), parseInt(dateRange) - i), "yyyy-MM-dd");
        dailyStats[date] = { date, logins: 0, uniqueUsers: new Set() };
      }

      logs?.forEach((log) => {
        const date = format(new Date(log.login_at), "yyyy-MM-dd");
        if (dailyStats[date]) {
          dailyStats[date].logins++;
          dailyStats[date].uniqueUsers.add(log.user_id);
        }
      });

      return Object.values(dailyStats).map((stat) => ({
        date: format(new Date(stat.date), "dd MMM", { locale: id }),
        fullDate: stat.date,
        logins: stat.logins,
        uniqueUsers: stat.uniqueUsers.size,
      }));
    },
  });

  const { data: attemptStats, isLoading: isLoadingAttemptStats } = useQuery({
    queryKey: ["attempt-stats", dateRange],
    queryFn: async () => {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      const endDate = endOfDay(new Date());

      const { data: attempts, error } = await supabase
        .from("login_attempts")
        .select("attempted_at, success, ip_address")
        .gte("attempted_at", startDate.toISOString())
        .lte("attempted_at", endDate.toISOString())
        .order("attempted_at", { ascending: true });

      if (error) throw error;

      // Group by date
      const dailyStats: Record<string, { date: string; failed: number; successful: number }> = {};
      
      for (let i = 0; i <= parseInt(dateRange); i++) {
        const date = format(subDays(new Date(), parseInt(dateRange) - i), "yyyy-MM-dd");
        dailyStats[date] = { date, failed: 0, successful: 0 };
      }

      attempts?.forEach((attempt) => {
        const date = format(new Date(attempt.attempted_at), "yyyy-MM-dd");
        if (dailyStats[date]) {
          if (attempt.success) {
            dailyStats[date].successful++;
          } else {
            dailyStats[date].failed++;
          }
        }
      });

      return Object.values(dailyStats).map((stat) => ({
        date: format(new Date(stat.date), "dd MMM", { locale: id }),
        fullDate: stat.date,
        failed: stat.failed,
        successful: stat.successful,
      }));
    },
  });

  const { data: blockedStats, isLoading: isLoadingBlockedStats } = useQuery({
    queryKey: ["blocked-stats"],
    queryFn: async () => {
      const { data: blocked, error } = await supabase
        .from("blocked_ips")
        .select("*");

      if (error) throw error;

      const active = blocked?.filter((b) => b.is_active).length || 0;
      const expired = blocked?.filter((b) => !b.is_active).length || 0;
      const autoBlocked = blocked?.filter((b) => b.reason.includes("auto-block")).length || 0;
      const manualBlocked = blocked?.filter((b) => !b.reason.includes("auto-block")).length || 0;

      return { active, expired, autoBlocked, manualBlocked, total: blocked?.length || 0 };
    },
  });

  const { data: summaryStats, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["security-summary", dateRange],
    queryFn: async () => {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      
      const [loginResult, attemptResult] = await Promise.all([
        supabase
          .from("login_logs")
          .select("user_id", { count: "exact" })
          .gte("login_at", startDate.toISOString()),
        supabase
          .from("login_attempts")
          .select("success", { count: "exact" })
          .gte("attempted_at", startDate.toISOString())
          .eq("success", false),
      ]);

      const uniqueUsers = new Set(loginResult.data?.map((l) => l.user_id) || []);

      return {
        totalLogins: loginResult.count || 0,
        uniqueUsers: uniqueUsers.size,
        failedAttempts: attemptResult.count || 0,
      };
    },
  });

  const chartConfig = {
    logins: { label: "Total Login", color: "hsl(var(--primary))" },
    uniqueUsers: { label: "User Unik", color: "hsl(var(--chart-2))" },
    failed: { label: "Gagal", color: "hsl(var(--destructive))" },
    successful: { label: "Berhasil", color: "hsl(var(--chart-2))" },
  };

  const pieData = blockedStats
    ? [
        { name: "Auto-block", value: blockedStats.autoBlocked, color: "hsl(var(--destructive))" },
        { name: "Manual", value: blockedStats.manualBlocked, color: "hsl(var(--primary))" },
      ]
    : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Statistik Keamanan</h1>
            <p className="text-muted-foreground">Monitor aktivitas login dan keamanan sistem</p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih rentang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Hari Terakhir</SelectItem>
              <SelectItem value="14">14 Hari Terakhir</SelectItem>
              <SelectItem value="30">30 Hari Terakhir</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Login</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{summaryStats?.totalLogins || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">dalam {dateRange} hari terakhir</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">User Aktif</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{summaryStats?.uniqueUsers || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">user unik login</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Login Gagal</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-destructive">{summaryStats?.failedAttempts || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">percobaan gagal</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">IP Diblokir</CardTitle>
              <ShieldAlert className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {isLoadingBlockedStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{blockedStats?.active || 0}</span>
                  <Badge variant="secondary" className="text-xs">aktif</Badge>
                </div>
              )}
              <p className="text-xs text-muted-foreground">dari total {blockedStats?.total || 0} blokir</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Login per Day Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Login per Hari
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingLoginStats ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={loginStats}>
                      <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="logins" fill="var(--color-logins)" radius={[4, 4, 0, 0]} name="Total Login" />
                      <Bar dataKey="uniqueUsers" fill="var(--color-uniqueUsers)" radius={[4, 4, 0, 0]} name="User Unik" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Login Attempts Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Percobaan Login
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAttemptStats ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attemptStats}>
                      <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="successful" stroke="var(--color-successful)" strokeWidth={2} dot={{ r: 4 }} name="Berhasil" />
                      <Line type="monotone" dataKey="failed" stroke="var(--color-failed)" strokeWidth={2} dot={{ r: 4 }} name="Gagal" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Blocked IPs Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Breakdown IP Diblokir
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBlockedStats ? (
                <Skeleton className="h-[300px] w-full" />
              ) : blockedStats?.total === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Belum ada IP yang diblokir
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="flex justify-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span className="text-sm">Auto-block ({blockedStats?.autoBlocked || 0})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm">Manual ({blockedStats?.manualBlocked || 0})</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Keamanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  <span>IP Aktif Diblokir</span>
                </div>
                <Badge variant={blockedStats?.active === 0 ? "secondary" : "destructive"}>
                  {blockedStats?.active || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span>Auto-block (Brute Force)</span>
                </div>
                <Badge variant="outline">{blockedStats?.autoBlocked || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <span>Manual Block</span>
                </div>
                <Badge variant="outline">{blockedStats?.manualBlocked || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Rata-rata Login/Hari</span>
                </div>
                <Badge variant="secondary">
                  {loginStats && loginStats.length > 0
                    ? Math.round(loginStats.reduce((sum, s) => sum + s.logins, 0) / loginStats.length)
                    : 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Login Map */}
        <LoginMap dateRange={parseInt(dateRange)} />
      </div>
    </AdminLayout>
  );
};

export default AdminSecurityStatsPage;
