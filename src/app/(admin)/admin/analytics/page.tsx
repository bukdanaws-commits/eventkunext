'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, BarChart3, TrendingUp, Users, Calendar, DollarSign } from 'lucide-react'

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(() => !user || authLoading)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

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
        <div>
          <h1 className="text-3xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground mt-1">Analisis performa platform secara menyeluruh</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp 0</div>
              <div className="text-sm text-emerald-100 mt-1">+0% dari bulan lalu</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-blue-100 mt-1">+0% dari bulan lalu</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-purple-100 mt-1">+0% dari bulan lalu</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-100">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <div className="text-sm text-amber-100 mt-1">Events aktif / Total events</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Pendapatan 6 bulan terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 opacity-20" />
                <span className="ml-2">Data akan muncul setelah ada transaksi</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Events Created</CardTitle>
              <CardDescription>Event baru per bulan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <Calendar className="h-12 w-12 opacity-20" />
                <span className="ml-2">Data akan muncul setelah ada event</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Pertumbuhan user baru per bulan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <Users className="h-12 w-12 opacity-20" />
              <span className="ml-2">Data akan muncul setelah ada user terdaftar</span>
            </div>
          </CardContent>
        </Card>

        {/* Tier Distribution */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Tier Distribution</CardTitle>
              <CardDescription>Distribusi events berdasarkan tier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Statistik cepat platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground">Avg Revenue per Event</div>
                  <div className="text-xl font-bold mt-1">Rp 0</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground">Avg Events per User</div>
                  <div className="text-xl font-bold mt-1">0</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground">Paid Events</div>
                  <div className="text-xl font-bold mt-1">0</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground">Free Events</div>
                  <div className="text-xl font-bold mt-1">0</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
