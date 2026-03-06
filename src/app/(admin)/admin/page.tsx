'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { useAuth } from '@/hooks/useAuth'
import { SessionErrorAlert } from '@/components/admin/SessionErrorAlert'
import { useSessionRefresh } from '@/hooks/useSessionRefresh'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Users, Calendar, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Download, UserPlus, RefreshCw, Wifi } from 'lucide-react'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { isRefreshing, sessionError, clearSessionError, refreshSession } = useSessionRefresh()
  const [loading, setLoading] = useState(() => !user || authLoading)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)

  const kpiData = {
    totalRevenue: 0,
    totalUsers: 0,
    totalEvents: 0,
    conversionRate: 0,
    revenueGrowth: 0,
    userGrowth: 0,
    eventGrowth: 0,
  }

  const monthlyData = []
  const tierDistribution = []

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    )
  }

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
            <h1 className="text-3xl font-bold">Dashboard Overview</h1>
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
            <Button variant="outline" size="icon" title="Refresh Data">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="default" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Tambah User
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                Revenue Trend
              </CardTitle>
              <CardDescription>Pendapatan 6 bulan terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Data akan muncul setelah ada transaksi</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-purple-500" />
                Events Created
              </CardTitle>
              <CardDescription>Event baru per bulan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Data akan muncul setelah ada event</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card>
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
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
