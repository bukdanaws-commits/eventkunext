'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  Shield, 
  Ban,
  CheckCircle,
  XCircle,
  MapPin,
  Clock,
  Activity,
  FileText,
  Trophy,
  Users,
  CreditCard,
  Eye,
  Send,
  ShieldOff,
  FileCode
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Organization {
  id: string;
  name: string;
}

interface UserRole {
  id: string;
  role: string;
  organization_id: string | null;
}

interface Event {
  id: string;
  name: string;
  event_date: string;
  status: string;
  tier: string;
  participant_count?: number;
}

interface LoginLog {
  id: string;
  login_at: string;
  ip_address: string | null;
  city: string | null;
  country: string | null;
  user_agent: string | null;
}

interface AuditLog {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  created_at: string;
  details: unknown;
}

interface Payment {
  id: string;
  amount: number;
  tier: string;
  payment_status: string;
  created_at: string;
  event_name?: string;
}

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockInfo, setBlockInfo] = useState<{ reason: string; blocked_at: string } | null>(null);
  
  // Email dialog states
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // Block/Unblock dialog states
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [processingBlock, setProcessingBlock] = useState(false);
  
  // Role edit dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [processingRole, setProcessingRole] = useState(false);

  const availableRoles = [
    { value: 'admin', label: 'Admin', description: 'Full access to all features' },
    { value: 'owner', label: 'Owner', description: 'Owner of organization' },
    { value: 'staff', label: 'Staff', description: 'Limited access to organization' },
  ];

  // Email templates
  const emailTemplates = [
    {
      id: 'welcome',
      name: 'Selamat Datang',
      subject: 'Selamat Datang di Lucky Draw Platform!',
      message: `Halo {name},

Selamat datang di Lucky Draw Platform! Kami sangat senang Anda bergabung dengan kami.

Dengan platform ini, Anda dapat:
- Membuat dan mengelola event undian
- Menambahkan peserta dengan mudah
- Melakukan pengundian dengan animasi menarik
- Mengirim notifikasi ke pemenang secara otomatis

Jika ada pertanyaan, jangan ragu untuk menghubungi tim support kami.

Salam hangat,
Tim Lucky Draw Platform`
    },
    {
      id: 'reminder',
      name: 'Reminder Event',
      subject: 'Reminder: Event Anda Segera Dimulai',
      message: `Halo {name},

Ini adalah reminder bahwa event Anda akan segera dimulai. Pastikan semua persiapan sudah selesai:

✅ Data peserta sudah lengkap
✅ Hadiah sudah dikonfigurasi
✅ Tim Anda sudah siap

Jika ada kendala, hubungi tim support kami segera.

Salam,
Tim Lucky Draw Platform`
    },
    {
      id: 'payment_reminder',
      name: 'Reminder Pembayaran',
      subject: 'Reminder: Pembayaran Event Anda',
      message: `Halo {name},

Kami ingin mengingatkan bahwa pembayaran untuk event Anda masih belum diselesaikan.

Segera lakukan pembayaran untuk mengaktifkan event Anda dan menikmati semua fitur yang tersedia.

Jika sudah melakukan pembayaran, abaikan email ini.

Terima kasih,
Tim Lucky Draw Platform`
    },
    {
      id: 'support',
      name: 'Tindak Lanjut Support',
      subject: 'Tindak Lanjut Permintaan Support Anda',
      message: `Halo {name},

Terima kasih telah menghubungi tim support kami.

Kami telah menerima permintaan Anda dan sedang menindaklanjutinya. Tim kami akan segera menghubungi Anda dengan update terbaru.

Jika ada informasi tambahan yang ingin disampaikan, silakan balas email ini.

Salam,
Tim Support Lucky Draw Platform`
    },
    {
      id: 'account_issue',
      name: 'Masalah Akun',
      subject: 'Informasi Mengenai Akun Anda',
      message: `Halo {name},

Kami menghubungi Anda terkait akun Anda di Lucky Draw Platform.

[Jelaskan masalah atau informasi di sini]

Jika ada pertanyaan, jangan ragu untuk menghubungi kami.

Terima kasih,
Tim Lucky Draw Platform`
    }
  ];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      const userName = profile?.full_name || 'User';
      setEmailSubject(template.subject);
      setEmailMessage(template.message.replace(/{name}/g, userName));
    }
  };

  const fetchUserData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch organization
      if (profileData.organization_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.organization_id)
          .single();
        setOrganization(orgData);
      }

      // Fetch user roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);
      setRoles(rolesData || []);

      // Check if blocked
      const { data: blockedData } = await supabase
        .from('blocked_users')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (blockedData) {
        setIsBlocked(true);
        setBlockInfo({
          reason: blockedData.reason,
          blocked_at: blockedData.blocked_at,
        });
      }

      // Fetch events for this user's organization
      if (profileData.organization_id) {
        const { data: eventsData } = await supabase
          .from('events')
          .select('id, name, event_date, status, tier')
          .eq('organization_id', profileData.organization_id)
          .order('created_at', { ascending: false })
          .limit(20);

        // Get participant counts for each event
        const eventsWithCounts = await Promise.all(
          (eventsData || []).map(async (event) => {
            const { count } = await supabase
              .from('participants')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id);
            return { ...event, participant_count: count || 0 };
          })
        );
        setEvents(eventsWithCounts);

        // Fetch payments
        const { data: paymentsData } = await supabase
          .from('event_payments')
          .select('id, amount, tier, payment_status, created_at, event_id')
          .eq('organization_id', profileData.organization_id)
          .order('created_at', { ascending: false })
          .limit(20);

        // Get event names for payments
        const paymentsWithNames = await Promise.all(
          (paymentsData || []).map(async (payment) => {
            const { data: eventData } = await supabase
              .from('events')
              .select('name')
              .eq('id', payment.event_id)
              .single();
            return { ...payment, event_name: eventData?.name || 'Unknown Event' };
          })
        );
        setPayments(paymentsWithNames);
      }

      // Fetch login logs
      const { data: loginLogsData } = await supabase
        .from('login_logs')
        .select('*')
        .eq('user_id', userId)
        .order('login_at', { ascending: false })
        .limit(20);
      setLoginLogs(loginLogsData || []);

      // Fetch audit logs (actions performed by this admin)
      const { data: auditLogsData } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .eq('admin_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      setAuditLogs(auditLogsData || []);

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat data user',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'Active', variant: 'default' },
      draft: { label: 'Draft', variant: 'secondary' },
      completed: { label: 'Completed', variant: 'outline' },
      cancelled: { label: 'Cancelled', variant: 'destructive' },
      pending_payment: { label: 'Pending Payment', variant: 'secondary' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; className: string }> = {
      admin: { label: 'Admin', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      owner: { label: 'Owner', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
      staff: { label: 'Staff', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    };
    const config = roleMap[role] || { label: role, className: 'bg-muted text-muted-foreground' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      paid: { label: 'Paid', variant: 'default' },
      pending: { label: 'Pending', variant: 'secondary' },
      failed: { label: 'Failed', variant: 'destructive' },
      expired: { label: 'Expired', variant: 'outline' },
      refunded: { label: 'Refunded', variant: 'outline' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSendEmail = async () => {
    if (!profile?.email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'User tidak memiliki email',
      });
      return;
    }

    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Subject dan pesan harus diisi',
      });
      return;
    }

    setSendingEmail(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('send-broadcast-email', {
        body: {
          emailList: [profile.email],
          subject: emailSubject,
          message: emailMessage,
          segment: 'individual',
          createdBy: user?.id,
        },
      });

      if (error) throw error;

      toast({
        title: 'Email Terkirim',
        description: `Email berhasil dikirim ke ${profile.email}`,
      });
      
      setEmailDialogOpen(false);
      setEmailSubject('');
      setEmailMessage('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal mengirim email',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleBlockUser = async () => {
    if (!userId || !blockReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Alasan blokir harus diisi',
      });
      return;
    }

    setProcessingBlock(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          user_id: userId,
          reason: blockReason,
          blocked_by: user?.id || '',
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: 'User Diblokir',
        description: 'User berhasil diblokir',
      });
      
      setIsBlocked(true);
      setBlockInfo({
        reason: blockReason,
        blocked_at: new Date().toISOString(),
      });
      setBlockDialogOpen(false);
      setBlockReason('');
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memblokir user',
      });
    } finally {
      setProcessingBlock(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!userId) return;

    setProcessingBlock(true);
    try {
      const { error } = await supabase
        .from('blocked_users')
        .update({ 
          is_active: false,
          unblocked_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      toast({
        title: 'User Dibuka Blokirnya',
        description: 'User berhasil dibuka blokirnya',
      });
      
      setIsBlocked(false);
      setBlockInfo(null);
      setUnblockDialogOpen(false);
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal membuka blokir user',
      });
    } finally {
      setProcessingBlock(false);
    }
  };

  const handleAddRole = async (roleValue: string) => {
    if (!userId || !profile?.organization_id) return;

    setProcessingRole(true);
    try {
      // Check if role already exists
      const existingRole = roles.find(r => r.role === roleValue);
      if (existingRole) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'User sudah memiliki role ini',
        });
        return;
      }

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: roleValue as 'admin' | 'owner' | 'staff',
          organization_id: profile.organization_id,
        });

      if (error) throw error;

      toast({
        title: 'Role Ditambahkan',
        description: `Role ${roleValue} berhasil ditambahkan`,
      });
      
      // Refresh roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);
      setRoles(rolesData || []);
      
      setRoleDialogOpen(false);
      setSelectedRole('');
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menambahkan role',
      });
    } finally {
      setProcessingRole(false);
    }
  };

  const handleRemoveRole = async (roleId: string, roleName: string) => {
    if (!userId) return;

    // Prevent removing the last role
    if (roles.length <= 1) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'User harus memiliki minimal satu role',
      });
      return;
    }

    setProcessingRole(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: 'Role Dihapus',
        description: `Role ${roleName} berhasil dihapus`,
      });
      
      // Update local state
      setRoles(roles.filter(r => r.id !== roleId));
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menghapus role',
      });
    } finally {
      setProcessingRole(false);
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

  if (!profile) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-muted-foreground">User tidak ditemukan</p>
          <Button onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Users
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/admin/users')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Detail User</h1>
              <p className="text-muted-foreground mt-1">Informasi lengkap dan aktivitas user</p>
            </div>
          </div>
          <div className="flex gap-2">
            {profile?.email && (
              <Button 
                variant="outline" 
                onClick={() => setEmailDialogOpen(true)}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Kirim Email
              </Button>
            )}
            {isBlocked ? (
              <Button 
                variant="outline" 
                onClick={() => setUnblockDialogOpen(true)}
                className="gap-2"
              >
                <ShieldOff className="h-4 w-4" />
                Buka Blokir
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                onClick={() => setBlockDialogOpen(true)}
                className="gap-2"
              >
                <Ban className="h-4 w-4" />
                Blokir User
              </Button>
            )}
            {isBlocked ? (
              <Badge variant="destructive" className="gap-1 py-1 px-3">
                <Ban className="h-4 w-4" />
                Blocked
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 py-1 px-3 text-green-600 border-green-300 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4" />
                Active
              </Badge>
            )}
          </div>
        </div>

        {/* Block User Dialog */}
        <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Ban className="h-5 w-5" />
                Blokir User
              </DialogTitle>
              <DialogDescription>
                Anda akan memblokir {profile?.full_name || 'user ini'}. User yang diblokir tidak dapat mengakses platform.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="block-reason">Alasan Blokir</Label>
                <Textarea
                  id="block-reason"
                  placeholder="Masukkan alasan mengapa user ini diblokir..."
                  rows={3}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBlockDialogOpen(false)}
                disabled={processingBlock}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleBlockUser}
                disabled={processingBlock || !blockReason.trim()}
              >
                {processingBlock ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memblokir...
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Blokir User
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unblock User Dialog */}
        <Dialog open={unblockDialogOpen} onOpenChange={setUnblockDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldOff className="h-5 w-5" />
                Buka Blokir User
              </DialogTitle>
              <DialogDescription>
                Anda akan membuka blokir {profile?.full_name || 'user ini'}. User akan dapat mengakses platform kembali.
              </DialogDescription>
            </DialogHeader>
            {blockInfo && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p><strong>Alasan diblokir:</strong> {blockInfo.reason}</p>
                <p className="text-muted-foreground mt-1">
                  Diblokir pada: {format(new Date(blockInfo.blocked_at), 'dd MMM yyyy, HH:mm', { locale: localeId })}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUnblockDialogOpen(false)}
                disabled={processingBlock}
              >
                Batal
              </Button>
              <Button
                onClick={handleUnblockUser}
                disabled={processingBlock}
              >
                {processingBlock ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <ShieldOff className="h-4 w-4 mr-2" />
                    Buka Blokir
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Kelola Role User
              </DialogTitle>
              <DialogDescription>
                Tambah atau hapus role untuk {profile?.full_name || 'user ini'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Current Roles */}
              <div className="space-y-2">
                <Label>Role Saat Ini</Label>
                <div className="flex flex-wrap gap-2">
                  {roles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Tidak ada role</p>
                  ) : (
                    roles.map((role) => (
                      <Badge 
                        key={role.id} 
                        variant="secondary" 
                        className="flex items-center gap-1 pr-1"
                      >
                        {role.role}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                          onClick={() => handleRemoveRole(role.id, role.role)}
                          disabled={processingRole || roles.length <= 1}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Add New Role */}
              <div className="space-y-2">
                <Label>Tambah Role Baru</Label>
                <div className="flex gap-2">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Pilih role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles
                        .filter(r => !roles.some(ur => ur.role === r.value))
                        .map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex flex-col">
                              <span>{role.label}</span>
                              <span className="text-xs text-muted-foreground">{role.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => selectedRole && handleAddRole(selectedRole)}
                    disabled={!selectedRole || processingRole}
                  >
                    {processingRole ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Tambah'
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Email Dialog */}
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Kirim Email ke User
              </DialogTitle>
              <DialogDescription>
                Kirim email langsung ke {profile?.full_name || 'user'} ({profile?.email})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email-template" className="flex items-center gap-2">
                  <FileCode className="h-3 w-3" />
                  Template (Opsional)
                </Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih template email..." />
                  </SelectTrigger>
                  <SelectContent>
                    {emailTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  placeholder="Masukkan subject email..."
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-message">Pesan</Label>
                <Textarea
                  id="email-message"
                  placeholder="Tulis pesan email Anda di sini..."
                  rows={8}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEmailDialogOpen(false)}
                disabled={sendingEmail}
              >
                Batal
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailSubject.trim() || !emailMessage.trim()}
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Kirim Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Info Card */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nama Lengkap</p>
                  <p className="font-medium">{profile.full_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </p>
                  <p className="font-medium">{profile.email || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Telepon
                  </p>
                  <p className="font-medium">{profile.phone || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building className="h-3 w-3" /> Organization
                  </p>
                  <p className="font-medium">{organization?.name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Bergabung
                  </p>
                  <p className="font-medium">
                    {format(new Date(profile.created_at), 'dd MMMM yyyy, HH:mm', { locale: localeId })}
                  </p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Roles
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setRoleDialogOpen(true)}
                      className="h-6 px-2 text-xs"
                    >
                      Edit Roles
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {roles.map((role) => (
                      <span key={role.id}>{getRoleBadge(role.role)}</span>
                    ))}
                  </div>
                </div>
              </div>

              {isBlocked && blockInfo && (
                <>
                  <Separator />
                  <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                    <p className="font-medium text-destructive mb-2">User Diblokir</p>
                    <p className="text-sm text-muted-foreground">Alasan: {blockInfo.reason}</p>
                    <p className="text-sm text-muted-foreground">
                      Diblokir pada: {format(new Date(blockInfo.blocked_at), 'dd MMM yyyy, HH:mm', { locale: localeId })}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Statistik
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Total Events</span>
                </div>
                <span className="font-bold text-lg">{events.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Total Participants</span>
                </div>
                <span className="font-bold text-lg">
                  {events.reduce((sum, e) => sum + (e.participant_count || 0), 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Total Payments</span>
                </div>
                <span className="font-bold text-lg">{payments.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Login History</span>
                </div>
                <span className="font-bold text-lg">{loginLogs.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for detailed info */}
        <Tabs defaultValue="events" className="space-y-4">
          <TabsList>
            <TabsTrigger value="events" className="gap-2">
              <FileText className="h-4 w-4" />
              Events ({events.length})
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Payments ({payments.length})
            </TabsTrigger>
            <TabsTrigger value="logins" className="gap-2">
              <Clock className="h-4 w-4" />
              Login History ({loginLogs.length})
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <Activity className="h-4 w-4" />
              Audit Log ({auditLogs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Events</CardTitle>
                <CardDescription>Daftar event yang dibuat oleh user ini</CardDescription>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Belum ada event</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Event</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Peserta</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.name}</TableCell>
                          <TableCell>
                            {format(new Date(event.event_date), 'dd MMM yyyy', { locale: localeId })}
                          </TableCell>
                          <TableCell>{getStatusBadge(event.status)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{event.tier}</Badge>
                          </TableCell>
                          <TableCell>{event.participant_count}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/events/${event.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Riwayat pembayaran event</CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Belum ada pembayaran</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.event_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{payment.tier}</Badge>
                          </TableCell>
                          <TableCell>
                            Rp {payment.amount.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell>{getPaymentStatusBadge(payment.payment_status)}</TableCell>
                          <TableCell>
                            {format(new Date(payment.created_at), 'dd MMM yyyy, HH:mm', { locale: localeId })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logins">
            <Card>
              <CardHeader>
                <CardTitle>Login History</CardTitle>
                <CardDescription>Riwayat login user</CardDescription>
              </CardHeader>
              <CardContent>
                {loginLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Belum ada riwayat login</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Waktu</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Lokasi</TableHead>
                        <TableHead>Device</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loginLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {format(new Date(log.login_at), 'dd MMM yyyy, HH:mm:ss', { locale: localeId })}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{log.ip_address || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {[log.city, log.country].filter(Boolean).join(', ') || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                            {log.user_agent || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>Aktivitas admin yang dilakukan user ini</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Belum ada aktivitas audit</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm', { locale: localeId })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {log.target_type}
                              {log.target_id && (
                                <span className="text-muted-foreground ml-1">
                                  ({log.target_id.slice(0, 8)}...)
                                </span>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            {log.details ? (
                              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
