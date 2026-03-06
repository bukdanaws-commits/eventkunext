'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Mail, CheckCircle, XCircle, Eye, Send, BarChart3, FlaskConical, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';

interface BroadcastEmail {
  id: string;
  subject: string;
  content: string;
  segment: string;
  total_recipients: number;
  delivered_count: number;
  opened_count: number;
  failed_count: number;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  is_ab_test: boolean;
  subject_variant_a: string | null;
  subject_variant_b: string | null;
  variant_a_opened: number;
  variant_b_opened: number;
  variant_a_sent: number;
  variant_b_sent: number;
}

export default function AdminEmailAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [broadcasts, setBroadcasts] = useState<BroadcastEmail[]>([]);
  const [stats, setStats] = useState({
    totalSent: 0,
    totalDelivered: 0,
    totalOpened: 0,
    totalFailed: 0,
    avgDeliveryRate: 0,
    avgOpenRate: 0,
  });

  useEffect(() => {
    fetchBroadcasts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('broadcast-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'broadcast_emails',
        },
        () => {
          fetchBroadcasts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchBroadcasts() {
    try {
      const { data, error } = await supabase
        .from('broadcast_emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBroadcasts(data || []);

      // Calculate stats
      const totalSent = data?.reduce((sum, b) => sum + b.total_recipients, 0) || 0;
      const totalDelivered = data?.reduce((sum, b) => sum + b.delivered_count, 0) || 0;
      const totalOpened = data?.reduce((sum, b) => sum + b.opened_count, 0) || 0;
      const totalFailed = data?.reduce((sum, b) => sum + b.failed_count, 0) || 0;

      setStats({
        totalSent,
        totalDelivered,
        totalOpened,
        totalFailed,
        avgDeliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
        avgOpenRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
      });
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Terkirim</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Terjadwal</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">Gagal</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Email Analytics</h1>
          <p className="text-muted-foreground mt-1">Monitor delivery rate dan open rate dari broadcast email</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Terkirim</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total email dikirim</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgDeliveryRate.toFixed(1)}%</div>
              <Progress value={stats.avgDeliveryRate} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">{stats.totalDelivered.toLocaleString()} delivered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgOpenRate.toFixed(1)}%</div>
              <Progress value={stats.avgOpenRate} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">{stats.totalOpened.toLocaleString()} opened</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.totalFailed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Email gagal terkirim</p>
            </CardContent>
          </Card>
        </div>

        {/* Broadcast History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Broadcast History
            </CardTitle>
            <CardDescription>Detail statistik setiap broadcast email</CardDescription>
          </CardHeader>
          <CardContent>
            {broadcasts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Belum Ada Broadcast</h3>
                <p className="text-muted-foreground">Kirim broadcast pertama dari halaman Broadcast Email</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {broadcasts.map((broadcast) => {
                    const deliveryRate = broadcast.total_recipients > 0
                      ? (broadcast.delivered_count / broadcast.total_recipients) * 100
                      : 0;
                    const openRate = broadcast.delivered_count > 0
                      ? (broadcast.opened_count / broadcast.delivered_count) * 100
                      : 0;

                    return (
                      <Card key={broadcast.id} className="border">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {getStatusBadge(broadcast.status)}
                                <Badge variant="outline">{broadcast.segment}</Badge>
                                {broadcast.is_ab_test && (
                                  <Badge variant="secondary" className="gap-1">
                                    <FlaskConical className="h-3 w-3" />
                                    A/B Test
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-semibold text-foreground truncate">{broadcast.subject}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {broadcast.sent_at 
                                  ? `Terkirim: ${format(new Date(broadcast.sent_at), 'dd MMM yyyy, HH:mm', { locale: localeId })}`
                                  : broadcast.scheduled_at
                                  ? `Dijadwalkan: ${format(new Date(broadcast.scheduled_at), 'dd MMM yyyy, HH:mm', { locale: localeId })}`
                                  : `Dibuat: ${format(new Date(broadcast.created_at), 'dd MMM yyyy, HH:mm', { locale: localeId })}`
                                }
                              </p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/dashboard/admin/broadcast/tracking?id=${broadcast.id}`)}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Detail
                            </Button>
                          </div>

                          {/* A/B Test Results */}
                          {broadcast.is_ab_test && (
                            <div className="grid md:grid-cols-2 gap-3 mb-4 p-3 rounded-lg bg-muted/30">
                              <div className="flex items-center justify-between p-2 rounded border bg-blue-50 dark:bg-blue-900/20">
                                <div>
                                  <Badge className="mb-1 bg-blue-100 text-blue-700">Variant A</Badge>
                                  <p className="text-xs truncate max-w-[150px]">{broadcast.subject_variant_a}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-blue-600">
                                    {broadcast.variant_a_sent > 0 ? ((broadcast.variant_a_opened / broadcast.variant_a_sent) * 100).toFixed(0) : 0}%
                                  </div>
                                  <p className="text-xs text-muted-foreground">{broadcast.variant_a_opened}/{broadcast.variant_a_sent}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded border bg-purple-50 dark:bg-purple-900/20">
                                <div>
                                  <Badge variant="secondary" className="mb-1">Variant B</Badge>
                                  <p className="text-xs truncate max-w-[150px]">{broadcast.subject_variant_b}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-purple-600">
                                    {broadcast.variant_b_sent > 0 ? ((broadcast.variant_b_opened / broadcast.variant_b_sent) * 100).toFixed(0) : 0}%
                                  </div>
                                  <p className="text-xs text-muted-foreground">{broadcast.variant_b_opened}/{broadcast.variant_b_sent}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 rounded-lg bg-muted/50">
                              <div className="text-2xl font-bold">{broadcast.total_recipients}</div>
                              <div className="text-xs text-muted-foreground">Total Penerima</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                              <div className="text-2xl font-bold text-green-600">{broadcast.delivered_count}</div>
                              <div className="text-xs text-muted-foreground">Delivered ({deliveryRate.toFixed(0)}%)</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                              <div className="text-2xl font-bold text-blue-600">{broadcast.opened_count}</div>
                              <div className="text-xs text-muted-foreground">Opened ({openRate.toFixed(0)}%)</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                              <div className="text-2xl font-bold text-red-600">{broadcast.failed_count}</div>
                              <div className="text-xs text-muted-foreground">Failed</div>
                            </div>
                          </div>

                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Delivery Rate</span>
                              <span className="font-medium">{deliveryRate.toFixed(1)}%</span>
                            </div>
                            <Progress value={deliveryRate} className="h-2" />
                            
                            <div className="flex items-center justify-between text-sm mt-3">
                              <span className="text-muted-foreground">Open Rate</span>
                              <span className="font-medium">{openRate.toFixed(1)}%</span>
                            </div>
                            <Progress value={openRate} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
