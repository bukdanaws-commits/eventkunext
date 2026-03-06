'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Loader2, Send, Users, Mail, AlertCircle, CheckCircle, FlaskConical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuditLog } from '@/hooks/useAdminAuditLog';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { SessionErrorAlert } from '@/components/admin/SessionErrorAlert';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  user_id: string;
  full_name: string | null;
  organization_id: string | null;
  email?: string;
}

interface BroadcastLog {
  id: string;
  subject: string;
  recipientCount: number;
  segment: string;
  sentAt: Date;
  status: 'sent' | 'failed';
  isAbTest?: boolean;
}

export default function AdminBroadcast() {
  const { toast } = useToast();
  const { logAction } = useAdminAuditLog();
  const { user } = useAuth();
  const { isRefreshing, sessionError, clearSessionError, refreshSession, handleApiError } = useSessionRefresh();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [broadcastLogs, setBroadcastLogs] = useState<BroadcastLog[]>([]);
  
  // Filter states
  const [segment, setSegment] = useState<'all' | 'free' | 'paid' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Email form
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  // A/B Testing
  const [isAbTest, setIsAbTest] = useState(false);
  const [subjectVariantA, setSubjectVariantA] = useState('');
  const [subjectVariantB, setSubjectVariantB] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [segment]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, organization_id')
        .order('created_at', { ascending: false });

      if (error) throw error;

      let filteredUsers = profiles || [];

      if (segment === 'paid') {
        const { data: paidOrgs } = await supabase
          .from('event_payments')
          .select('organization_id')
          .eq('payment_status', 'paid')
          .not('tier', 'eq', 'free');

        const paidOrgIds = new Set(paidOrgs?.map(p => p.organization_id) || []);
        filteredUsers = filteredUsers.filter(u => u.organization_id && paidOrgIds.has(u.organization_id));
      } else if (segment === 'free') {
        const { data: paidOrgs } = await supabase
          .from('event_payments')
          .select('organization_id')
          .eq('payment_status', 'paid')
          .not('tier', 'eq', 'free');

        const paidOrgIds = new Set(paidOrgs?.map(p => p.organization_id) || []);
        filteredUsers = filteredUsers.filter(u => !u.organization_id || !paidOrgIds.has(u.organization_id));
      }

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    return user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.user_id)));
    }
  };

  const sendBroadcast = async () => {
    if (isAbTest) {
      if (!subjectVariantA.trim() || !subjectVariantB.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Kedua variant subject harus diisi untuk A/B test' });
        return;
      }
    } else {
      if (!subject.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Subject tidak boleh kosong' });
        return;
      }
    }

    if (!message.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Message tidak boleh kosong' });
      return;
    }

    if (selectedUsers.size === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Pilih minimal 1 penerima' });
      return;
    }

    setSending(true);
    try {
      const selectedUserIds = Array.from(selectedUsers);
      
      const { error } = await supabase.functions.invoke('send-broadcast-email', {
        body: {
          userIds: selectedUserIds,
          subject: isAbTest ? subjectVariantA : subject,
          message,
          segment,
          createdBy: user?.id,
          isAbTest,
          subjectVariantA: isAbTest ? subjectVariantA : undefined,
          subjectVariantB: isAbTest ? subjectVariantB : undefined,
        },
      });

      if (error) throw error;

      await logAction({
        action: 'settings_updated',
        targetType: 'user',
        details: {
          type: 'broadcast_email',
          recipientCount: selectedUserIds.length,
          segment,
          subject: isAbTest ? `A/B Test: ${subjectVariantA} vs ${subjectVariantB}` : subject,
          isAbTest,
        },
      });

      setBroadcastLogs(prev => [{
        id: Date.now().toString(),
        subject: isAbTest ? `A/B: ${subjectVariantA.slice(0, 20)}...` : subject,
        recipientCount: selectedUserIds.length,
        segment,
        sentAt: new Date(),
        status: 'sent',
        isAbTest,
      }, ...prev]);

      toast({ 
        title: 'Broadcast berhasil dikirim', 
        description: `Email terkirim ke ${selectedUserIds.length} penerima${isAbTest ? ' (A/B Test)' : ''}` 
      });
      
      // Reset form
      setSubject('');
      setMessage('');
      setSubjectVariantA('');
      setSubjectVariantB('');
      setIsAbTest(false);
      setSelectedUsers(new Set());
    } catch (error: any) {
      console.error('Error sending broadcast:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal mengirim broadcast email' });
    } finally {
      setSending(false);
    }
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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Broadcast Email</h1>
          <p className="text-muted-foreground mt-1">Kirim email ke semua users atau segment tertentu</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recipient Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Pilih Penerima
              </CardTitle>
              <CardDescription>
                Filter dan pilih users yang akan menerima email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Segment</Label>
                  <Select value={segment} onValueChange={(v: any) => setSegment(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Users</SelectItem>
                      <SelectItem value="paid">Paid Users</SelectItem>
                      <SelectItem value="free">Free Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Cari</Label>
                  <Input
                    placeholder="Cari nama..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted">
                <span className="text-sm text-muted-foreground">
                  {filteredUsers.length} users ditemukan
                </span>
                <Badge variant="secondary">
                  {selectedUsers.size} dipilih
                </Badge>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  id="selectAll"
                  checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                  onCheckedChange={selectAll}
                />
                <Label htmlFor="selectAll" className="text-sm cursor-pointer">
                  Pilih Semua
                </Label>
              </div>

              <ScrollArea className="h-[300px] border rounded-lg">
                <div className="p-2 space-y-1">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.user_id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedUsers.has(user.user_id) 
                          ? 'bg-purple-100 dark:bg-purple-900/30' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleUser(user.user_id)}
                    >
                      <Checkbox
                        checked={selectedUsers.has(user.user_id)}
                        onCheckedChange={() => toggleUser(user.user_id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.full_name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          ID: {user.user_id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Email Composer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Compose Email
              </CardTitle>
              <CardDescription>
                Tulis subject dan isi pesan email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* A/B Testing Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-purple-600" />
                  <div>
                    <Label className="font-medium">A/B Testing</Label>
                    <p className="text-xs text-muted-foreground">Test dua subject berbeda</p>
                  </div>
                </div>
                <Switch checked={isAbTest} onCheckedChange={setIsAbTest} />
              </div>

              {isAbTest ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-700">A</Badge>
                      Subject Variant A
                    </Label>
                    <Input
                      placeholder="Subject email variant A..."
                      value={subjectVariantA}
                      onChange={(e) => setSubjectVariantA(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Badge variant="secondary">B</Badge>
                      Subject Variant B
                    </Label>
                    <Input
                      placeholder="Subject email variant B..."
                      value={subjectVariantB}
                      onChange={(e) => setSubjectVariantB(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    50% penerima akan mendapat variant A, 50% mendapat variant B
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    placeholder="Subject email..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Tulis pesan email..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    <p className="font-medium">Preview</p>
                    <p>Email akan dikirim ke {selectedUsers.size} penerima{isAbTest ? ' (A/B Test)' : ''}</p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={sendBroadcast}
                disabled={
                  sending || 
                  selectedUsers.size === 0 || 
                  !message.trim() ||
                  (isAbTest ? (!subjectVariantA.trim() || !subjectVariantB.trim()) : !subject.trim())
                }
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {isAbTest ? 'Kirim A/B Test' : 'Kirim Broadcast'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Broadcast History */}
        <Card>
          <CardHeader>
            <CardTitle>Broadcast History</CardTitle>
            <CardDescription>Riwayat email broadcast yang telah dikirim</CardDescription>
          </CardHeader>
          <CardContent>
            {broadcastLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada broadcast yang dikirim
              </div>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {broadcastLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {log.status === 'sent' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{log.subject}</p>
                            {log.isAbTest && (
                              <Badge variant="outline" className="text-xs">
                                <FlaskConical className="h-3 w-3 mr-1" />
                                A/B Test
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {log.recipientCount} penerima • {log.segment}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.sentAt.toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
