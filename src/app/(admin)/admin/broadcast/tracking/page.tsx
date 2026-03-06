'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Mail, Eye, MapPin, Clock, Globe, Monitor, ArrowLeft, MousePointer, Link as LinkIcon, Trophy, Download, RefreshCw, Send } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface EmailTracking {
  id: string;
  broadcast_id: string;
  recipient_email: string;
  opened_at: string | null;
  open_count: number;
  user_agent: string | null;
  ip_address: string | null;
  variant: string | null;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

interface LinkClick {
  id: string;
  broadcast_id: string;
  tracking_id: string | null;
  recipient_email: string;
  original_url: string;
  clicked_at: string;
  ip_address: string | null;
  country: string | null;
  city: string | null;
}

interface BroadcastEmail {
  id: string;
  subject: string;
  is_ab_test: boolean;
  subject_variant_a: string | null;
  subject_variant_b: string | null;
  sent_at: string | null;
  winner_variant: string | null;
  winner_determined_at: string | null;
  determination_period_hours: number | null;
}

export default function AdminEmailTrackingDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const broadcastId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [broadcast, setBroadcast] = useState<BroadcastEmail | null>(null);
  const [trackingData, setTrackingData] = useState<EmailTracking[]>([]);
  const [linkClicks, setLinkClicks] = useState<LinkClick[]>([]);
  const [selectedTracking, setSelectedTracking] = useState<EmailTracking | null>(null);
  const [resending, setResending] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (broadcastId) {
      fetchData();

      const channel = supabase
        .channel('tracking-updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'email_tracking', filter: `broadcast_id=eq.${broadcastId}` },
          () => fetchData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'email_link_clicks', filter: `broadcast_id=eq.${broadcastId}` },
          () => fetchData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [broadcastId]);

  async function fetchData() {
    try {
      const [broadcastRes, trackingRes, clicksRes] = await Promise.all([
        supabase
          .from('broadcast_emails')
          .select('id, subject, is_ab_test, subject_variant_a, subject_variant_b, sent_at, winner_variant, winner_determined_at, determination_period_hours')
          .eq('id', broadcastId!)
          .single(),
        supabase
          .from('email_tracking')
          .select('*')
          .eq('broadcast_id', broadcastId!)
          .order('opened_at', { ascending: false, nullsFirst: false }),
        supabase
          .from('email_link_clicks')
          .select('*')
          .eq('broadcast_id', broadcastId!)
          .order('clicked_at', { ascending: false }),
      ]);

      if (broadcastRes.error) throw broadcastRes.error;
      if (trackingRes.error) throw trackingRes.error;

      setBroadcast(broadcastRes.data);
      setTrackingData(trackingRes.data || []);
      setLinkClicks(clicksRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const openedCount = trackingData.filter(t => t.opened_at).length;
  const totalCount = trackingData.length;
  const openRate = totalCount > 0 ? (openedCount / totalCount) * 100 : 0;
  
  const uniqueClickers = new Set(linkClicks.map(c => c.recipient_email)).size;
  const clickRate = totalCount > 0 ? (uniqueClickers / totalCount) * 100 : 0;

  const urlClickCounts = linkClicks.reduce((acc, click) => {
    acc[click.original_url] = (acc[click.original_url] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const locationStats = trackingData.reduce((acc, t) => {
    if (t.country) {
      const key = t.city ? `${t.city}, ${t.country}` : t.country;
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
    
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) { os = 'Android'; device = 'Mobile'; }
    else if (ua.includes('iPhone') || ua.includes('iPad')) { os = 'iOS'; device = 'Mobile'; }

    return { browser, os, device };
  };

  const unopenedRecipients = trackingData.filter(t => !t.opened_at);

  const exportToExcel = async (type: 'opens' | 'clicks') => {
    setExporting(true);
    try {
      let data: any[] = [];
      let filename = '';

      if (type === 'opens') {
        data = trackingData.map(t => ({
          'Email': t.recipient_email,
          'Status': t.opened_at ? 'Opened' : 'Not Opened',
          'Open Count': t.open_count,
          'Opened At': t.opened_at ? format(new Date(t.opened_at), 'dd/MM/yyyy HH:mm:ss') : '-',
          'Country': t.country || '-',
          'City': t.city || '-',
          'IP Address': t.ip_address || '-',
          'Variant': t.variant || '-',
        }));
        filename = `email-opens-${broadcast?.subject?.slice(0, 30) || 'export'}.xlsx`;
      } else {
        data = linkClicks.map(c => ({
          'Email': c.recipient_email,
          'URL Clicked': c.original_url,
          'Clicked At': format(new Date(c.clicked_at), 'dd/MM/yyyy HH:mm:ss'),
          'Country': c.country || '-',
          'City': c.city || '-',
          'IP Address': c.ip_address || '-',
        }));
        filename = `link-clicks-${broadcast?.subject?.slice(0, 30) || 'export'}.xlsx`;
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, type === 'opens' ? 'Email Opens' : 'Link Clicks');
      XLSX.writeFile(wb, filename);
      toast.success(`Data berhasil diexport ke ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal export data');
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = async (type: 'opens' | 'clicks') => {
    setExporting(true);
    try {
      let csv = '';
      let filename = '';

      if (type === 'opens') {
        csv = 'Email,Status,Open Count,Opened At,Country,City,IP Address,Variant\n';
        trackingData.forEach(t => {
          csv += `"${t.recipient_email}","${t.opened_at ? 'Opened' : 'Not Opened'}",${t.open_count},"${t.opened_at ? format(new Date(t.opened_at), 'dd/MM/yyyy HH:mm:ss') : '-'}","${t.country || '-'}","${t.city || '-'}","${t.ip_address || '-'}","${t.variant || '-'}"\n`;
        });
        filename = `email-opens-${broadcast?.subject?.slice(0, 30) || 'export'}.csv`;
      } else {
        csv = 'Email,URL Clicked,Clicked At,Country,City,IP Address\n';
        linkClicks.forEach(c => {
          csv += `"${c.recipient_email}","${c.original_url}","${format(new Date(c.clicked_at), 'dd/MM/yyyy HH:mm:ss')}","${c.country || '-'}","${c.city || '-'}","${c.ip_address || '-'}"\n`;
        });
        filename = `link-clicks-${broadcast?.subject?.slice(0, 30) || 'export'}.csv`;
      }

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Data berhasil diexport ke ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal export data');
    } finally {
      setExporting(false);
    }
  };

  const handleResendToUnopened = async () => {
    if (unopenedRecipients.length === 0) {
      toast.error('Tidak ada recipient yang belum membuka email');
      return;
    }

    setResending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-broadcast-email', {
        body: {
          emailList: unopenedRecipients.map(r => r.recipient_email),
          subject: `[Reminder] ${broadcast?.subject}`,
          message: `<p>Ini adalah pengingat untuk email sebelumnya.</p>`,
          isFollowUp: true,
          originalBroadcastId: broadcastId,
        },
      });

      if (error) throw error;
      toast.success(`Email follow-up berhasil dikirim ke ${unopenedRecipients.length} recipient`);
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('Gagal mengirim email follow-up');
    } finally {
      setResending(false);
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

  if (!broadcast) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Broadcast tidak ditemukan</h3>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/admin/broadcast/analytics')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/admin/broadcast/analytics')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Detail Email Tracking</h1>
              <p className="text-muted-foreground mt-1">{broadcast.subject}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={exporting}>
                  {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportToExcel('opens')}>
                  Export Opens (Excel)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToCSV('opens')}>
                  Export Opens (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToExcel('clicks')}>
                  Export Clicks (Excel)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToCSV('clicks')}>
                  Export Clicks (CSV)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary" disabled={resending || unopenedRecipients.length === 0}>
                  {resending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Resend ({unopenedRecipients.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Kirim Email Follow-up?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Email follow-up akan dikirim ke <strong>{unopenedRecipients.length}</strong> recipient yang belum membuka email asli.
                    <br /><br />
                    Subject: <strong>[Reminder] {broadcast.subject}</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResendToUnopened}>
                    <Send className="h-4 w-4 mr-2" />
                    Kirim Follow-up
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Opened</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{openedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{openRate.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Link Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{linkClicks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{clickRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        {broadcast.is_ab_test && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                A/B Test Results
                {broadcast.winner_variant && (
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    <Trophy className="h-3 w-3 mr-1" />
                    Winner: Variant {broadcast.winner_variant}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {broadcast.winner_determined_at 
                  ? `Winner ditentukan pada ${format(new Date(broadcast.winner_determined_at), 'dd MMM yyyy, HH:mm', { locale: localeId })}`
                  : `Winner akan ditentukan ${broadcast.determination_period_hours || 24} jam setelah pengiriman`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${broadcast.winner_variant === 'A' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>Variant A</Badge>
                    {broadcast.winner_variant === 'A' && (
                      <Trophy className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{broadcast.subject_variant_a}</p>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">
                      {trackingData.filter(t => t.variant === 'A' && t.opened_at).length}
                    </span>
                    <span className="text-muted-foreground"> / {trackingData.filter(t => t.variant === 'A').length} opened</span>
                  </div>
                </div>
                <div className={`p-4 rounded-lg border ${broadcast.winner_variant === 'B' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'bg-purple-50 dark:bg-purple-900/20'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">Variant B</Badge>
                    {broadcast.winner_variant === 'B' && (
                      <Trophy className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{broadcast.subject_variant_b}</p>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">
                      {trackingData.filter(t => t.variant === 'B' && t.opened_at).length}
                    </span>
                    <span className="text-muted-foreground"> / {trackingData.filter(t => t.variant === 'B').length} opened</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Lokasi Pembuka Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(locationStats).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(locationStats)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([location, count]) => (
                      <div key={location} className="flex items-center justify-between">
                        <span className="text-sm">{location}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Belum ada data lokasi</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-5 w-5 text-primary" />
                Link Click Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(urlClickCounts).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(urlClickCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([url, count]) => (
                      <div key={url} className="flex items-center justify-between gap-2">
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate flex-1"
                        >
                          <LinkIcon className="h-3 w-3 inline mr-1" />
                          {url}
                        </a>
                        <Badge variant="secondary">{count} clicks</Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Belum ada link yang diklik</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detail Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="opens">
              <TabsList>
                <TabsTrigger value="opens">
                  <Eye className="h-4 w-4 mr-2" />
                  Opens ({openedCount})
                </TabsTrigger>
                <TabsTrigger value="clicks">
                  <MousePointer className="h-4 w-4 mr-2" />
                  Clicks ({linkClicks.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="opens">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        {broadcast.is_ab_test && <TableHead>Variant</TableHead>}
                        <TableHead>Status</TableHead>
                        <TableHead>Opens</TableHead>
                        <TableHead>Last Opened</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trackingData.map((tracking) => {
                        const { browser, os, device } = parseUserAgent(tracking.user_agent);
                        return (
                          <TableRow key={tracking.id}>
                            <TableCell className="font-medium">{tracking.recipient_email}</TableCell>
                            {broadcast.is_ab_test && (
                              <TableCell>
                                <Badge variant={tracking.variant === 'A' ? 'default' : 'secondary'}>
                                  {tracking.variant || '-'}
                                </Badge>
                              </TableCell>
                            )}
                            <TableCell>
                              {tracking.opened_at ? (
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Opened
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Not Opened</Badge>
                              )}
                            </TableCell>
                            <TableCell>{tracking.open_count}</TableCell>
                            <TableCell>
                              {tracking.opened_at ? (
                                <div className="flex items-center gap-1 text-sm">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(tracking.opened_at), 'dd MMM, HH:mm', { locale: localeId })}
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              {tracking.city || tracking.country ? (
                                <div className="flex items-center gap-1 text-sm">
                                  <MapPin className="h-3 w-3" />
                                  {tracking.city ? `${tracking.city}, ${tracking.country}` : tracking.country}
                                </div>
                              ) : tracking.ip_address ? (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Globe className="h-3 w-3" />
                                  {tracking.ip_address}
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedTracking(tracking)}>
                                    Detail
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Tracking Detail</DialogTitle>
                                    <DialogDescription>{tracking.recipient_email}</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="p-3 rounded-lg bg-muted">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                          <Eye className="h-4 w-4" />
                                          Open Count
                                        </div>
                                        <div className="text-xl font-bold">{tracking.open_count}</div>
                                      </div>
                                      <div className="p-3 rounded-lg bg-muted">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                          <Clock className="h-4 w-4" />
                                          First Opened
                                        </div>
                                        <div className="text-sm font-medium">
                                          {tracking.opened_at 
                                            ? format(new Date(tracking.opened_at), 'dd MMM yyyy, HH:mm:ss', { locale: localeId })
                                            : 'Not opened'}
                                        </div>
                                      </div>
                                    </div>

                                    {(tracking.city || tracking.country) && (
                                      <div className="p-3 rounded-lg bg-muted">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                          <MapPin className="h-4 w-4" />
                                          Location
                                        </div>
                                        <div className="font-medium">
                                          {tracking.city ? `${tracking.city}, ${tracking.country}` : tracking.country}
                                        </div>
                                      </div>
                                    )}

                                    {tracking.user_agent && (
                                      <div className="p-3 rounded-lg bg-muted">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                          <Monitor className="h-4 w-4" />
                                          Device Info
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                          <div>
                                            <span className="text-muted-foreground">Browser:</span>
                                            <p className="font-medium">{browser}</p>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">OS:</span>
                                            <p className="font-medium">{os}</p>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">Device:</span>
                                            <p className="font-medium">{device}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {tracking.ip_address && (
                                      <div className="p-3 rounded-lg bg-muted">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                          <Globe className="h-4 w-4" />
                                          IP Address
                                        </div>
                                        <div className="font-medium">{tracking.ip_address}</div>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="clicks">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>URL Clicked</TableHead>
                        <TableHead>Clicked At</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {linkClicks.map((click) => (
                        <TableRow key={click.id}>
                          <TableCell className="font-medium">{click.recipient_email}</TableCell>
                          <TableCell>
                            <a 
                              href={click.original_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate block max-w-xs"
                            >
                              {click.original_url}
                            </a>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              {format(new Date(click.clicked_at), 'dd MMM, HH:mm', { locale: localeId })}
                            </div>
                          </TableCell>
                          <TableCell>
                            {click.city || click.country ? (
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3" />
                                {click.city ? `${click.city}, ${click.country}` : click.country}
                              </div>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {linkClicks.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            Belum ada link yang diklik
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
