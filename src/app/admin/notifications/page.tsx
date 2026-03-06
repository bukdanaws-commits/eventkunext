'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Bell, Send, History, Users, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  target_segment: string;
  sent_count: number;
  created_at: string;
}

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  created_at: string;
}

export default function AdminNotifications() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [subscriptions, setSubscriptions] = useState<PushSubscription[]>([]);
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [targetSegment, setTargetSegment] = useState('all');

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('admin-notifications-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_notifications' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchData() {
    try {
      const [notificationsRes, subscriptionsRes] = await Promise.all([
        supabase
          .from('admin_notifications')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('push_subscriptions')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (notificationsRes.error) throw notificationsRes.error;
      if (subscriptionsRes.error) throw subscriptionsRes.error;

      setNotifications(notificationsRes.data || []);
      setSubscriptions(subscriptionsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendNotification() {
    if (!title.trim() || !message.trim()) {
      toast.error('Judul dan pesan harus diisi');
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title,
          message,
          type,
          targetSegment,
          createdBy: user?.id,
        },
      });

      if (error) throw error;

      toast.success(`Notifikasi terkirim ke ${data.sentCount} subscriber`);
      setTitle('');
      setMessage('');
      setType('info');
      setTargetSegment('all');
      fetchData();
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(error.message || 'Gagal mengirim notifikasi');
    } finally {
      setSending(false);
    }
  }

  const getTypeBadge = (notificationType: string) => {
    switch (notificationType) {
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"><Info className="h-3 w-3 mr-1" />Info</Badge>;
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
          <h1 className="text-3xl font-bold text-foreground">Push Notifications</h1>
          <p className="text-muted-foreground mt-1">Kelola dan kirim push notification ke admin</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriptions.length}</div>
              <p className="text-xs text-muted-foreground">User yang subscribe push</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifikasi Terkirim</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
              <p className="text-xs text-muted-foreground">Total notifikasi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengiriman</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notifications.reduce((sum, n) => sum + n.sent_count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Push terkirim</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="send" className="space-y-4">
          <TabsList>
            <TabsTrigger value="send">Kirim Notifikasi</TabsTrigger>
            <TabsTrigger value="history">Riwayat</TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          </TabsList>

          <TabsContent value="send">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Kirim Push Notification
                </CardTitle>
                <CardDescription>Kirim notifikasi ke semua admin atau segment tertentu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipe Notifikasi</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="segment">Target Segment</Label>
                    <Select value={targetSegment} onValueChange={setTargetSegment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih segment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Admin</SelectItem>
                        <SelectItem value="owners">Owner Saja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Judul</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Judul notifikasi"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Pesan</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Isi pesan notifikasi..."
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleSendNotification}
                  disabled={sending || !title.trim() || !message.trim()}
                  className="w-full"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Kirim Notifikasi
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Riwayat Notifikasi
                </CardTitle>
                <CardDescription>Daftar notifikasi yang sudah dikirim</CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Belum Ada Notifikasi</h3>
                    <p className="text-muted-foreground">Kirim notifikasi pertama dari tab "Kirim Notifikasi"</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <Card key={notification.id} className="border">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getTypeBadge(notification.type)}
                                <Badge variant="outline">{notification.target_segment}</Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(notification.created_at), 'dd MMM yyyy, HH:mm', { locale: localeId })}
                              </span>
                            </div>
                            <h4 className="font-semibold text-foreground">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>Terkirim ke {notification.sent_count} subscriber</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscribers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Push Subscribers
                </CardTitle>
                <CardDescription>Daftar user yang subscribe push notification</CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Belum Ada Subscriber</h3>
                    <p className="text-muted-foreground">User perlu mengaktifkan push notification di browser mereka</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {subscriptions.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="font-medium text-sm">{sub.user_id}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-md">
                              {sub.endpoint}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(sub.created_at), 'dd MMM yyyy', { locale: localeId })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
