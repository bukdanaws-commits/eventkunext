'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Calendar, Clock, Send, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface ScheduledBroadcast {
  id: string;
  subject: string;
  content: string;
  segment: string;
  recipient_ids: string[];
  scheduled_for: string;
  status: string;
  processed_at: string | null;
  created_at: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
}

export default function AdminScheduledBroadcast() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedules, setSchedules] = useState<ScheduledBroadcast[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [userCount, setUserCount] = useState(0);

  // Form states
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [segment, setSegment] = useState<'all' | 'paid' | 'free'>('all');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchUserCount();
  }, [segment]);

  async function fetchData() {
    try {
      const [schedulesRes, templatesRes] = await Promise.all([
        supabase
          .from('scheduled_broadcasts')
          .select('*')
          .order('scheduled_for', { ascending: true }),
        supabase
          .from('email_templates')
          .select('id, name, subject, content')
          .order('name'),
      ]);

      if (schedulesRes.error) throw schedulesRes.error;
      if (templatesRes.error) throw templatesRes.error;

      setSchedules(schedulesRes.data || []);
      setTemplates(templatesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserCount() {
    try {
      let query = supabase.from('user_profiles').select('user_id, organization_id');
      
      if (segment === 'paid' || segment === 'free') {
        const { data: paidOrgs } = await supabase
          .from('event_payments')
          .select('organization_id')
          .eq('payment_status', 'paid')
          .not('tier', 'eq', 'free');

        const paidOrgIds = new Set(paidOrgs?.map(p => p.organization_id) || []);

        const { data: users } = await query;
        const filteredUsers = segment === 'paid'
          ? users?.filter(u => u.organization_id && paidOrgIds.has(u.organization_id))
          : users?.filter(u => !u.organization_id || !paidOrgIds.has(u.organization_id));
        
        setUserCount(filteredUsers?.length || 0);
      } else {
        const { count } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });
        setUserCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching user count:', error);
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setContent(template.content);
    }
  };

  const handleSchedule = async () => {
    if (!subject.trim() || !content.trim() || !scheduledDate || !scheduledTime) {
      toast({ variant: 'destructive', title: 'Error', description: 'Semua field harus diisi' });
      return;
    }

    const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledFor <= new Date()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Waktu jadwal harus di masa depan' });
      return;
    }

    setSaving(true);
    try {
      // Get user IDs based on segment
      const { data: users } = await supabase
        .from('user_profiles')
        .select('user_id, organization_id');

      let recipientIds = users?.map(u => u.user_id) || [];

      if (segment === 'paid' || segment === 'free') {
        const { data: paidOrgs } = await supabase
          .from('event_payments')
          .select('organization_id')
          .eq('payment_status', 'paid')
          .not('tier', 'eq', 'free');

        const paidOrgIds = new Set(paidOrgs?.map(p => p.organization_id) || []);
        
        if (segment === 'paid') {
          recipientIds = users?.filter(u => u.organization_id && paidOrgIds.has(u.organization_id)).map(u => u.user_id) || [];
        } else {
          recipientIds = users?.filter(u => !u.organization_id || !paidOrgIds.has(u.organization_id)).map(u => u.user_id) || [];
        }
      }

      const { error } = await supabase
        .from('scheduled_broadcasts')
        .insert({
          subject,
          content,
          segment,
          recipient_ids: recipientIds,
          scheduled_for: scheduledFor.toISOString(),
          created_by: user?.id,
        });

      if (error) throw error;

      toast({ title: 'Broadcast dijadwalkan', description: `Akan dikirim pada ${format(scheduledFor, 'dd MMM yyyy, HH:mm', { locale: localeId })}` });
      
      // Reset form
      setSubject('');
      setContent('');
      setScheduledDate('');
      setScheduledTime('');
      setSelectedTemplate('');
      fetchData();
    } catch (error: any) {
      console.error('Error scheduling broadcast:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Batalkan jadwal broadcast ini?')) return;

    try {
      const { error } = await supabase
        .from('scheduled_broadcasts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Jadwal dibatalkan' });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const getStatusBadge = (status: string, scheduledFor: string) => {
    const isOverdue = new Date(scheduledFor) < new Date() && status === 'scheduled';
    
    if (isOverdue) {
      return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">Menunggu Proses</Badge>;
    }
    
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Terjadwal</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">Memproses</Badge>;
      case 'sent':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Terkirim</Badge>;
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
          <h1 className="text-3xl font-bold text-foreground">Scheduled Broadcast</h1>
          <p className="text-muted-foreground mt-1">Jadwalkan email broadcast untuk waktu tertentu</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Schedule Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Buat Jadwal Baru
              </CardTitle>
              <CardDescription>Jadwalkan broadcast untuk dikirim otomatis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {templates.length > 0 && (
                <div className="space-y-2">
                  <Label>Gunakan Template</Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih template (opsional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  placeholder="Subject email..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Tulis isi email..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Segment Penerima</Label>
                <Select value={segment} onValueChange={(v: 'all' | 'paid' | 'free') => setSegment(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Users</SelectItem>
                    <SelectItem value="paid">Paid Users</SelectItem>
                    <SelectItem value="free">Free Users</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Akan dikirim ke {userCount} users</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Waktu</Label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    <p className="font-medium">Catatan</p>
                    <p>Broadcast terjadwal akan diproses oleh sistem pada waktu yang ditentukan.</p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleSchedule}
                disabled={saving || !subject.trim() || !content.trim() || !scheduledDate || !scheduledTime}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menjadwalkan...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Jadwalkan Broadcast
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Scheduled List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Jadwal Aktif
              </CardTitle>
              <CardDescription>Broadcast yang dijadwalkan</CardDescription>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Belum Ada Jadwal</h3>
                  <p className="text-muted-foreground">Buat jadwal broadcast pertama</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {schedules.map((schedule) => (
                      <Card key={schedule.id} className="border">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(schedule.status, schedule.scheduled_for)}
                              <Badge variant="outline">{schedule.segment}</Badge>
                            </div>
                            {schedule.status === 'scheduled' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(schedule.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                          <h4 className="font-semibold text-foreground">{schedule.subject}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {schedule.content}
                          </p>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(schedule.scheduled_for), 'dd MMM yyyy, HH:mm', { locale: localeId })}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {schedule.recipient_ids.length} penerima
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
