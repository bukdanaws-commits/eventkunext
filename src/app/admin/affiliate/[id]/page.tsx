'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
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
  Loader2,
  ArrowLeft,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  CreditCard,
  TrendingUp,
  Users,
  Calendar,
  Send,
  AlertCircle,
  Download,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AffiliateBadges from '@/components/affiliate/AffiliateBadges';
import AffiliateAnalyticsChart from '@/components/affiliate/AffiliateAnalyticsChart';

interface AffiliateProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Commission {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  payout_reference: string | null;
  referee_name: string | null;
  event_name: string | null;
  payment_amount: number | null;
}

interface ReferralStats {
  total_clicks: number;
  total_signups: number;
  total_conversions: number;
  code: string;
  custom_code: string | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
    case 'confirmed':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 gap-1"><CheckCircle className="h-3 w-3" /> Confirmed</Badge>;
    case 'paid':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 gap-1"><DollarSign className="h-3 w-3" /> Dibayar</Badge>;
    case 'cancelled':
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Dibatalkan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function AdminAffiliateDetail() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchAffiliateData();
    }
  }, [userId]);

  const fetchAffiliateData = async () => {
    setLoading(true);

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, phone, avatar_url, created_at')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch bank info (separate table for security)
      const { data: bankInfo } = await supabase
        .from('user_bank_info')
        .select('bank_name, bank_account_number, bank_account_holder')
        .eq('user_id', userId)
        .single();

      // Fetch user email
      const { data: userData } = await supabase.auth.admin.getUserById(userId!);

      setProfile({
        user_id: profileData.user_id,
        full_name: profileData.full_name,
        phone: profileData.phone,
        avatar_url: profileData.avatar_url,
        created_at: profileData.created_at,
        email: userData?.user?.email || null,
        bank_name: bankInfo?.bank_name || null,
        bank_account_number: bankInfo?.bank_account_number || null,
        bank_account_holder: bankInfo?.bank_account_holder || null,
      });

      // Fetch referral stats
      const { data: referralData } = await supabase
        .from('referral_codes')
        .select('total_clicks, total_signups, total_conversions, code, custom_code')
        .eq('user_id', userId)
        .single();

      setReferralStats(referralData);

      // Fetch commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commissions')
        .select('*')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (commissionsError) throw commissionsError;

      // Enrich commissions
      const enrichedCommissions = await Promise.all(
        (commissionsData || []).map(async (commission) => {
          // Get referee profile
          const { data: refereeProfile } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('user_id', commission.referee_id)
            .single();

          // Get payment and event details
          const { data: paymentData } = await supabase
            .from('event_payments')
            .select('total_amount, events(name)')
            .eq('id', commission.payment_id)
            .single();

          return {
            ...commission,
            referee_name: refereeProfile?.full_name || null,
            event_name: (paymentData?.events as any)?.name || null,
            payment_amount: paymentData?.total_amount || null,
          };
        })
      );

      setCommissions(enrichedCommissions);
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat data affiliate',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendBankReminder = async () => {
    if (!profile?.email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Email affiliate tidak tersedia',
      });
      return;
    }

    setSendingReminder(true);

    try {
      const { error } = await supabase.functions.invoke('send-bank-reminder', {
        body: {
          userId: userId,
          email: profile.email,
          name: profile.full_name || profile.email,
          totalCommission: stats.totalPending + stats.totalConfirmed,
        },
      });

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Email reminder telah dikirim',
      });
    } catch (error) {
      console.error('Error sending bank reminder:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal mengirim email reminder',
      });
    } finally {
      setSendingReminder(false);
    }
  };

  // Calculate stats
  const stats = {
    totalPending: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0),
    totalConfirmed: commissions.filter(c => c.status === 'confirmed').reduce((sum, c) => sum + c.amount, 0),
    totalPaid: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0),
    totalEarnings: commissions.filter(c => c.status !== 'cancelled').reduce((sum, c) => sum + c.amount, 0),
    commissionCount: commissions.length,
    conversionRate: referralStats ? 
      (referralStats.total_conversions / (referralStats.total_signups || 1) * 100).toFixed(1) : '0',
  };

  const hasBankInfo = profile?.bank_name && profile?.bank_account_number && profile?.bank_account_holder;
  const hasReadyPayout = stats.totalConfirmed >= 500000;
  const showBankReminder = hasReadyPayout && !hasBankInfo;

  const exportToExcel = () => {
    const affiliateName = profile?.full_name || profile?.email || 'affiliate';
    const data = commissions.map(c => ({
      'Tanggal': format(new Date(c.created_at), 'dd MMM yyyy HH:mm', { locale: id }),
      'Referee': c.referee_name || '-',
      'Event': c.event_name || '-',
      'Pembayaran': c.payment_amount ? formatCurrency(c.payment_amount) : '-',
      'Komisi': formatCurrency(c.amount),
      'Status': c.status,
      'Tanggal Bayar': c.paid_at ? format(new Date(c.paid_at), 'dd MMM yyyy', { locale: id }) : '-',
      'Referensi': c.payout_reference || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Commissions');
    XLSX.writeFile(wb, `laporan-komisi-${affiliateName.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    
    toast({ title: 'Export berhasil', description: 'File Excel telah diunduh' });
  };

  const exportToPDF = () => {
    const affiliateName = profile?.full_name || profile?.email || 'affiliate';
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text('Laporan Komisi Affiliate', 14, 22);
    doc.setFontSize(12);
    doc.text(`Nama: ${affiliateName}`, 14, 32);
    doc.text(`Email: ${profile?.email || '-'}`, 14, 40);
    doc.text(`Tanggal: ${format(new Date(), 'dd MMMM yyyy', { locale: id })}`, 14, 48);
    
    // Summary
    doc.setFontSize(10);
    doc.text(`Total Penghasilan: ${formatCurrency(stats.totalEarnings)}`, 14, 58);
    doc.text(`Siap Dicairkan: ${formatCurrency(stats.totalConfirmed)}`, 14, 65);
    doc.text(`Sudah Dibayar: ${formatCurrency(stats.totalPaid)}`, 14, 72);
    
    // Table
    autoTable(doc, {
      startY: 80,
      head: [['Tanggal', 'Referee', 'Event', 'Komisi', 'Status', 'Tgl Bayar']],
      body: commissions.map(c => [
        format(new Date(c.created_at), 'dd/MM/yy'),
        c.referee_name || '-',
        c.event_name || '-',
        formatCurrency(c.amount),
        c.status,
        c.paid_at ? format(new Date(c.paid_at), 'dd/MM/yy') : '-',
      ]),
    });
    
    doc.save(`laporan-komisi-${affiliateName.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast({ title: 'Export berhasil', description: 'File PDF telah diunduh' });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!profile) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Affiliate tidak ditemukan</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/commissions')}>
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/admin/commissions')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Detail Affiliate</h1>
              <p className="text-muted-foreground mt-1">{profile.full_name || profile.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" onClick={exportToPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            {showBankReminder && (
              <Button onClick={handleSendBankReminder} disabled={sendingReminder}>
                {sendingReminder ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Kirim Reminder Bank
              </Button>
            )}
          </div>
        </div>

        {/* Bank Reminder Alert */}
        {showBankReminder && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Data Rekening Belum Lengkap
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Affiliate ini memiliki komisi {formatCurrency(stats.totalConfirmed)} yang siap dicairkan, 
                    tetapi belum melengkapi data rekening bank.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile & Stats Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profil Affiliate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.email || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Bergabung: {format(new Date(profile.created_at), 'dd MMM yyyy', { locale: id })}</span>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Informasi Bank
                </h4>
                {hasBankInfo ? (
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Bank:</span> {profile.bank_name}</p>
                    <p><span className="text-muted-foreground">No. Rekening:</span> {profile.bank_account_number}</p>
                    <p><span className="text-muted-foreground">Atas Nama:</span> {profile.bank_account_holder}</p>
                  </div>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" /> Belum Lengkap
                  </Badge>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Kode Referral</h4>
                {referralStats && (
                  <div className="space-y-2">
                    <code className="bg-muted px-3 py-1.5 rounded text-sm font-mono block">
                      {referralStats.custom_code || referralStats.code}
                    </code>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Penghasilan</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Dari {stats.commissionCount} transaksi
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Siap Dicairkan</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalConfirmed)}</div>
                <p className="text-xs text-muted-foreground mt-1">Status: Confirmed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sudah Dibayar</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</div>
                <p className="text-xs text-muted-foreground mt-1">Total pembayaran</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.conversionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {referralStats?.total_conversions || 0} dari {referralStats?.total_signups || 0} signup
                </p>
              </CardContent>
            </Card>

            {/* Referral Stats */}
            {referralStats && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Klik</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{referralStats.total_clicks.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">Klik link referral</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Signup</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{referralStats.total_signups.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">User mendaftar</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Badges & Achievements */}
        <AffiliateBadges
          totalConversions={referralStats?.total_conversions || 0}
          totalCommission={stats.totalEarnings}
        />

        {/* Analytics Charts */}
        <AffiliateAnalyticsChart commissions={commissions} />

        {/* Commissions Tab */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Komisi</CardTitle>
            <CardDescription>Semua transaksi komisi affiliate ini</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">Semua</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                <TabsTrigger value="paid">Dibayar</TabsTrigger>
              </TabsList>

              {['all', 'pending', 'confirmed', 'paid'].map((status) => (
                <TabsContent key={status} value={status}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Referee</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead className="text-right">Pembayaran</TableHead>
                        <TableHead className="text-right">Komisi</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Dibayar</TableHead>
                        <TableHead>Referensi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions
                        .filter(c => status === 'all' || c.status === status)
                        .map((commission) => (
                          <TableRow key={commission.id}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(commission.created_at), 'dd MMM yyyy', { locale: id })}
                            </TableCell>
                            <TableCell>{commission.referee_name || '-'}</TableCell>
                            <TableCell>{commission.event_name || '-'}</TableCell>
                            <TableCell className="text-right">
                              {commission.payment_amount ? formatCurrency(commission.payment_amount) : '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(commission.amount)}
                            </TableCell>
                            <TableCell>{getStatusBadge(commission.status)}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {commission.paid_at
                                ? format(new Date(commission.paid_at), 'dd MMM yyyy', { locale: id })
                                : '-'}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {commission.payout_reference || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      {commissions.filter(c => status === 'all' || c.status === status).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            Tidak ada data komisi
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
