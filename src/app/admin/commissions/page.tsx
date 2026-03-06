'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Search,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  RefreshCcw,
  Send,
  Banknote,
  TrendingUp,
  Users,
  Eye,
  Mail,
  AlertTriangle,
  BarChart3,
  Trophy,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { SessionErrorAlert } from '@/components/admin/SessionErrorAlert';
import { format, startOfMonth, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAdminAuditLog } from '@/hooks/useAdminAuditLog';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Commission {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  payout_reference: string | null;
  referrer_id: string;
  referee_id: string;
  payment_id: string;
}

interface CommissionWithDetails extends Commission {
  referrer_name: string | null;
  referrer_email: string | null;
  referrer_bank_name: string | null;
  referrer_bank_account: string | null;
  referrer_bank_holder: string | null;
  referee_name: string | null;
  payment_amount: number | null;
  event_name: string | null;
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

const MINIMUM_PAYOUT = 500000;

export default function AdminCommissions() {
  const { toast } = useToast();
  const { logAction } = useAdminAuditLog();
  const router = useRouter();
  const { isRefreshing, sessionError, clearSessionError, refreshSession, handleApiError } = useSessionRefresh();
  
  const [commissions, setCommissions] = useState<CommissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  
  // Dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'confirm' | 'pay' | 'cancel' | 'batch_pay' | 'bulk_reminder';
    commissionId?: string;
  }>({ open: false, type: 'confirm' });
  
  const [payoutDialog, setPayoutDialog] = useState<{
    open: boolean;
    commissionId: string;
    referrerName: string;
    amount: number;
    bankInfo: { name: string | null; account: string | null; holder: string | null };
  } | null>(null);
  
  const [payoutReference, setPayoutReference] = useState('');
  const [bulkReminderLoading, setBulkReminderLoading] = useState(false);

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    setLoading(true);
    
    try {
      // Fetch all commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (commissionsError) throw commissionsError;
      
      // Enrich with user and payment details
      const enrichedCommissions: CommissionWithDetails[] = await Promise.all(
        (commissionsData || []).map(async (commission) => {
          // Get referrer profile
          const { data: referrerProfile } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('user_id', commission.referrer_id)
            .single();

          // Get referrer bank info (separate table for security)
          const { data: referrerBankInfo } = await supabase
            .from('user_bank_info')
            .select('bank_name, bank_account_number, bank_account_holder')
            .eq('user_id', commission.referrer_id)
            .single();
          
          // Get referrer email
          const { data: referrerAuth } = await supabase.auth.admin.getUserById(commission.referrer_id);
          
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
            referrer_name: referrerProfile?.full_name || null,
            referrer_email: referrerAuth?.user?.email || null,
            referrer_bank_name: referrerBankInfo?.bank_name || null,
            referrer_bank_account: referrerBankInfo?.bank_account_number || null,
            referrer_bank_holder: referrerBankInfo?.bank_account_holder || null,
            referee_name: refereeProfile?.full_name || null,
            payment_amount: paymentData?.total_amount || null,
            event_name: (paymentData?.events as any)?.name || null,
          };
        })
      );
      
      setCommissions(enrichedCommissions);
    } catch (error) {
      console.error('Error fetching commissions:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat data komisi',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (commissionId: string, newStatus: string) => {
    setActionLoading(true);
    
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
        updateData.payout_reference = payoutReference || null;
      }
      
      const { error } = await supabase
        .from('commissions')
        .update(updateData)
        .eq('id', commissionId);
      
      if (error) throw error;
      
      await logAction({
        action: 'commission_paid',
        targetType: 'commission',
        targetId: commissionId,
        details: {
          new_status: newStatus,
          payout_reference: payoutReference || null,
        },
      });
      
      // Send email notification if paid
      if (newStatus === 'paid') {
        const commission = commissions.find(c => c.id === commissionId);
        if (commission?.referrer_email) {
          try {
            await supabase.functions.invoke('send-commission-email', {
              body: {
                email: commission.referrer_email,
                name: commission.referrer_name || commission.referrer_email,
                amount: commission.amount,
                type: 'paid',
                payoutReference: payoutReference,
                bankName: commission.referrer_bank_name,
                bankAccount: commission.referrer_bank_account,
              },
            });
          } catch (emailError) {
            console.error('Failed to send commission email:', emailError);
          }
        }
      }
      
      // Send push notification, in-app notification, and email if confirmed
      if (newStatus === 'confirmed') {
        const commission = commissions.find(c => c.id === commissionId);
        if (commission) {
          // In-app notification
          try {
            await supabase.from('affiliate_notifications').insert({
              user_id: commission.referrer_id,
              title: 'Komisi Dikonfirmasi! 🎉',
              message: `Komisi ${formatCurrency(commission.amount)} dari ${commission.event_name || 'Referral'} sudah dikonfirmasi.`,
              type: 'commission',
              link: '/dashboard/referral',
            });
          } catch (notifError) {
            console.error('Failed to create in-app notification:', notifError);
          }

          // Push notification
          try {
            await supabase.functions.invoke('send-commission-notification', {
              body: {
                userId: commission.referrer_id,
                commissionId: commission.id,
                amount: commission.amount,
                eventName: commission.event_name || 'Referral',
              },
            });
          } catch (pushError) {
            console.error('Failed to send push notification:', pushError);
          }

          // Email notification
          if (commission.referrer_email) {
            try {
              await supabase.functions.invoke('send-commission-email', {
                body: {
                  email: commission.referrer_email,
                  name: commission.referrer_name || commission.referrer_email,
                  amount: commission.amount,
                  type: 'confirmed',
                  eventName: commission.event_name || 'Referral',
                },
              });
            } catch (emailError) {
              console.error('Failed to send confirmation email:', emailError);
            }
          }
        }
      }

      // Send in-app notification for paid status
      if (newStatus === 'paid') {
        const commission = commissions.find(c => c.id === commissionId);
        if (commission) {
          try {
            await supabase.from('affiliate_notifications').insert({
              user_id: commission.referrer_id,
              title: 'Komisi Dibayarkan! 💰',
              message: `Komisi ${formatCurrency(commission.amount)} sudah ditransfer ke rekening Anda. Ref: ${payoutReference || '-'}`,
              type: 'success',
              link: '/dashboard/referral',
            });
          } catch (notifError) {
            console.error('Failed to create in-app notification:', notifError);
          }
        }
      }
      
      toast({
        title: 'Berhasil',
        description: `Status komisi berhasil diubah ke ${newStatus}`,
      });
      
      setPayoutReference('');
      setPayoutDialog(null);
      setConfirmDialog({ open: false, type: 'confirm' });
      fetchCommissions();
    } catch (error) {
      console.error('Error updating commission:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal mengubah status komisi',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchPayout = async () => {
    setActionLoading(true);
    
    try {
      const selectedCommissions = commissions.filter(c => selectedIds.has(c.id) && c.status === 'confirmed');
      
      for (const commission of selectedCommissions) {
        await supabase
          .from('commissions')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payout_reference: `BATCH-${Date.now()}`,
          })
          .eq('id', commission.id);
        
        // Send email
        if (commission.referrer_email) {
          try {
            await supabase.functions.invoke('send-commission-email', {
              body: {
                email: commission.referrer_email,
                name: commission.referrer_name || commission.referrer_email,
                amount: commission.amount,
                payoutReference: `BATCH-${Date.now()}`,
                bankName: commission.referrer_bank_name,
                bankAccount: commission.referrer_bank_account,
              },
            });
          } catch (emailError) {
            console.error('Failed to send commission email:', emailError);
          }
        }
      }
      
      await logAction({
        action: 'commission_paid',
        targetType: 'commission',
        details: {
          batch_count: selectedCommissions.length,
          total_amount: selectedCommissions.reduce((sum, c) => sum + c.amount, 0),
        },
      });
      
      toast({
        title: 'Berhasil',
        description: `${selectedCommissions.length} komisi berhasil dibayarkan`,
      });
      
      setSelectedIds(new Set());
      setConfirmDialog({ open: false, type: 'confirm' });
      fetchCommissions();
    } catch (error) {
      console.error('Error in batch payout:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal melakukan batch payout',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkBankReminder = async () => {
    setBulkReminderLoading(true);
    
    try {
      const results = { success: 0, failed: 0 };
      
      for (const affiliate of affiliatesNeedingBankReminder) {
        if (!affiliate.referrerEmail) {
          results.failed++;
          continue;
        }
        
        try {
          await supabase.functions.invoke('send-bank-reminder', {
            body: {
              userId: affiliate.referrerId,
              email: affiliate.referrerEmail,
              name: affiliate.referrerName,
              totalCommission: affiliate.total,
            },
          });
          results.success++;
        } catch (error) {
          console.error('Error sending reminder to:', affiliate.referrerEmail, error);
          results.failed++;
        }
      }
      
      await logAction({
        action: 'bulk_bank_reminder',
        targetType: 'commission',
        details: {
          total_sent: results.success,
          total_failed: results.failed,
        },
      });
      
      toast({
        title: 'Bulk Reminder Selesai',
        description: `${results.success} email berhasil dikirim${results.failed > 0 ? `, ${results.failed} gagal` : ''}`,
      });
      
      setConfirmDialog({ open: false, type: 'confirm' });
    } catch (error) {
      console.error('Error in bulk reminder:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal mengirim bulk reminder',
      });
    } finally {
      setBulkReminderLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCommissions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCommissions.map(c => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const filteredCommissions = commissions.filter(c => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesSearch = 
      searchQuery === '' ||
      c.referrer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.referrer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.event_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const exportToExcel = () => {
    const data = filteredCommissions.map(c => ({
      'Tanggal': format(new Date(c.created_at), 'dd MMM yyyy HH:mm', { locale: id }),
      'Referrer': c.referrer_name || c.referrer_email || '-',
      'Email': c.referrer_email || '-',
      'Referee': c.referee_name || '-',
      'Event': c.event_name || '-',
      'Pembayaran': c.payment_amount ? formatCurrency(c.payment_amount) : '-',
      'Komisi': formatCurrency(c.amount),
      'Status': c.status,
      'Tanggal Bayar': c.paid_at ? format(new Date(c.paid_at), 'dd MMM yyyy', { locale: id }) : '-',
      'Referensi': c.payout_reference || '-',
      'Bank': c.referrer_bank_name || '-',
      'No Rekening': c.referrer_bank_account || '-',
      'Nama Rekening': c.referrer_bank_holder || '-',
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Commissions');
    XLSX.writeFile(wb, `commissions-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    
    toast({ title: 'Export berhasil', description: 'File Excel telah diunduh' });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Laporan Komisi Affiliate', 14, 22);
    doc.setFontSize(10);
    doc.text(`Tanggal: ${format(new Date(), 'dd MMMM yyyy', { locale: id })}`, 14, 30);
    
    autoTable(doc, {
      startY: 35,
      head: [['Referrer', 'Event', 'Komisi', 'Status', 'Tgl Bayar', 'Referensi']],
      body: filteredCommissions.map(c => [
        c.referrer_name || c.referrer_email || '-',
        c.event_name || '-',
        formatCurrency(c.amount),
        c.status,
        c.paid_at ? format(new Date(c.paid_at), 'dd/MM/yy') : '-',
        c.payout_reference || '-',
      ]),
    });
    
    doc.save(`commissions-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast({ title: 'Export berhasil', description: 'File PDF telah diunduh' });
  };

  // Calculate stats
  const totalPending = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + c.amount, 0);
  const totalConfirmed = commissions
    .filter(c => c.status === 'confirmed')
    .reduce((sum, c) => sum + c.amount, 0);
  const totalPaid = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);
  const uniqueReferrers = new Set(commissions.map(c => c.referrer_id)).size;

  // Get eligible batch payouts
  const getEligibleBatchPayouts = () => {
    const referrerTotals: Record<string, { total: number; commissions: CommissionWithDetails[] }> = {};
    
    commissions
      .filter(c => c.status === 'confirmed')
      .forEach(c => {
        if (!referrerTotals[c.referrer_id]) {
          referrerTotals[c.referrer_id] = { total: 0, commissions: [] };
        }
        referrerTotals[c.referrer_id].total += c.amount;
        referrerTotals[c.referrer_id].commissions.push(c);
      });
    
    return Object.entries(referrerTotals)
      .filter(([_, data]) => data.total >= MINIMUM_PAYOUT)
      .map(([referrerId, data]) => ({
        referrerId,
        referrerName: data.commissions[0]?.referrer_name || data.commissions[0]?.referrer_email || 'Unknown',
        referrerEmail: data.commissions[0]?.referrer_email || null,
        hasBankInfo: !!(data.commissions[0]?.referrer_bank_name && data.commissions[0]?.referrer_bank_account),
        total: data.total,
        count: data.commissions.length,
        commissionIds: data.commissions.map(c => c.id),
      }));
  };

  const eligibleBatchPayouts = getEligibleBatchPayouts();
  
  // Get affiliates needing bank reminder (eligible payout but no bank info)
  const affiliatesNeedingBankReminder = eligibleBatchPayouts.filter(p => !p.hasBankInfo);

  // Generate monthly chart data (last 6 months)
  const getMonthlyChartData = () => {
    const months: { month: string; pending: number; confirmed: number; paid: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthLabel = format(monthDate, 'MMM yy', { locale: id });
      
      const monthCommissions = commissions.filter(c => {
        const commissionDate = new Date(c.created_at);
        return commissionDate.getMonth() === monthStart.getMonth() && 
               commissionDate.getFullYear() === monthStart.getFullYear();
      });
      
      months.push({
        month: monthLabel,
        pending: monthCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0),
        confirmed: monthCommissions.filter(c => c.status === 'confirmed').reduce((sum, c) => sum + c.amount, 0),
        paid: monthCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0),
      });
    }
    
    return months;
  };

  const monthlyChartData = getMonthlyChartData();

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manajemen Komisi</h1>
            <p className="text-muted-foreground mt-1">Kelola komisi affiliate dan pembayaran</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchCommissions}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" onClick={exportToPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            {affiliatesNeedingBankReminder.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setConfirmDialog({ open: true, type: 'bulk_reminder' })}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Bulk Bank Reminder ({affiliatesNeedingBankReminder.length})
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => router.push('/admin/affiliates/leaderboard')}
              className="gap-2"
            >
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalPending)}</div>
              <p className="text-xs text-muted-foreground">
                {commissions.filter(c => c.status === 'pending').length} transaksi
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalConfirmed)}</div>
              <p className="text-xs text-muted-foreground">
                {commissions.filter(c => c.status === 'confirmed').length} siap bayar
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Dibayar</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
              <p className="text-xs text-muted-foreground">
                {commissions.filter(c => c.status === 'paid').length} transaksi
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Affiliate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueReferrers}</div>
              <p className="text-xs text-muted-foreground">referrer aktif</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performa Komisi Bulanan
            </CardTitle>
            <CardDescription>Statistik komisi 6 bulan terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis 
                    className="text-xs"
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelClassName="font-medium"
                  />
                  <Legend />
                  <Bar dataKey="pending" name="Pending" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="confirmed" name="Confirmed" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="paid" name="Dibayar" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Affiliates Needing Bank Reminder Alert */}
        {affiliatesNeedingBankReminder.length > 0 && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5" />
                Affiliate Perlu Melengkapi Data Bank
              </CardTitle>
              <CardDescription>
                {affiliatesNeedingBankReminder.length} affiliate memiliki komisi siap cair tapi belum lengkapi data rekening
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {affiliatesNeedingBankReminder.map((affiliate) => (
                  <Badge key={affiliate.referrerId} variant="secondary" className="gap-1 py-1.5">
                    {affiliate.referrerName} - {formatCurrency(affiliate.total)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Eligible Batch Payouts */}
        {eligibleBatchPayouts.length > 0 && (
          <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Banknote className="h-5 w-5" />
                Siap Dicairkan
              </CardTitle>
              <CardDescription>
                Referrer berikut memiliki saldo komisi ≥ {formatCurrency(MINIMUM_PAYOUT)} dan siap dicairkan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {eligibleBatchPayouts.map((payout) => (
                  <div key={payout.referrerId} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <div>
                      <p className="font-medium">{payout.referrerName}</p>
                      <p className="text-sm text-muted-foreground">{payout.count} komisi</p>
                    </div>
                    <div className="text-right flex flex-col gap-1">
                      <p className="font-bold text-green-600">{formatCurrency(payout.total)}</p>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/affiliates/${payout.referrerId}`)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedIds(new Set(payout.commissionIds));
                            setConfirmDialog({ open: true, type: 'batch_pay' });
                          }}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Bayar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Komisi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Cari referrer atau event..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="paid">Dibayar</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-4 mb-4 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">{selectedIds.size} dipilih</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const selected = filteredCommissions.filter(c => selectedIds.has(c.id) && c.status === 'pending');
                    selected.forEach(c => handleUpdateStatus(c.id, 'confirmed'));
                  }}
                  disabled={actionLoading}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Confirm Selected
                </Button>
                <Button
                  size="sm"
                  onClick={() => setConfirmDialog({ open: true, type: 'batch_pay' })}
                  disabled={actionLoading}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Pay Selected
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    const selected = filteredCommissions.filter(c => selectedIds.has(c.id));
                    selected.forEach(c => handleUpdateStatus(c.id, 'cancelled'));
                  }}
                  disabled={actionLoading}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Cancel Selected
                </Button>
              </div>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.size === filteredCommissions.length && filteredCommissions.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Pembayaran</TableHead>
                    <TableHead>Komisi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Tidak ada data komisi
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCommissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(commission.id)}
                            onCheckedChange={() => toggleSelect(commission.id)}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(commission.created_at), 'dd MMM yyyy', { locale: id })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium">{commission.referrer_name || '-'}</p>
                              <p className="text-xs text-muted-foreground">{commission.referrer_email}</p>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => router.push(`/admin/affiliates/${commission.referrer_id}`)}
                              title="Lihat detail affiliate"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {commission.event_name || '-'}
                        </TableCell>
                        <TableCell>
                          {commission.payment_amount ? formatCurrency(commission.payment_amount) : '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(commission.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(commission.status)}</TableCell>
                        <TableCell>
                          {commission.referrer_bank_name ? (
                            <div className="text-xs">
                              <p>{commission.referrer_bank_name}</p>
                              <p className="text-muted-foreground">{commission.referrer_bank_account}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Belum diisi</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {commission.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setConfirmDialog({ open: true, type: 'confirm', commissionId: commission.id })}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setConfirmDialog({ open: true, type: 'cancel', commissionId: commission.id })}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            {commission.status === 'confirmed' && (
                              <Button
                                size="sm"
                                onClick={() => setPayoutDialog({
                                  open: true,
                                  commissionId: commission.id,
                                  referrerName: commission.referrer_name || commission.referrer_email || 'Unknown',
                                  amount: commission.amount,
                                  bankInfo: {
                                    name: commission.referrer_bank_name,
                                    account: commission.referrer_bank_account,
                                    holder: commission.referrer_bank_holder,
                                  },
                                })}
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Bayar
                              </Button>
                            )}
                            {commission.status === 'paid' && commission.payout_reference && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {commission.payout_reference}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === 'confirm' && 'Konfirmasi Komisi'}
              {confirmDialog.type === 'cancel' && 'Batalkan Komisi'}
              {confirmDialog.type === 'batch_pay' && 'Batch Payout'}
              {confirmDialog.type === 'bulk_reminder' && 'Kirim Bulk Bank Reminder'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === 'confirm' && 'Apakah Anda yakin ingin mengkonfirmasi komisi ini?'}
              {confirmDialog.type === 'cancel' && 'Apakah Anda yakin ingin membatalkan komisi ini?'}
              {confirmDialog.type === 'batch_pay' && `Apakah Anda yakin ingin membayar ${selectedIds.size} komisi yang dipilih?`}
              {confirmDialog.type === 'bulk_reminder' && (
                <div className="space-y-2 text-left">
                  <p>Kirim email reminder ke {affiliatesNeedingBankReminder.length} affiliate yang:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Memiliki komisi siap dicairkan (≥ {formatCurrency(MINIMUM_PAYOUT)})</li>
                    <li>Belum melengkapi data rekening bank</li>
                  </ul>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog.type === 'confirm' && confirmDialog.commissionId) {
                  handleUpdateStatus(confirmDialog.commissionId, 'confirmed');
                } else if (confirmDialog.type === 'cancel' && confirmDialog.commissionId) {
                  handleUpdateStatus(confirmDialog.commissionId, 'cancelled');
                } else if (confirmDialog.type === 'batch_pay') {
                  handleBatchPayout();
                } else if (confirmDialog.type === 'bulk_reminder') {
                  handleBulkBankReminder();
                }
              }}
              disabled={actionLoading || bulkReminderLoading}
            >
              {(actionLoading || bulkReminderLoading) ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ya, Lanjutkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payout Dialog */}
      <Dialog open={!!payoutDialog} onOpenChange={() => setPayoutDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proses Pembayaran Komisi</DialogTitle>
            <DialogDescription>
              Masukkan nomor referensi transfer untuk {payoutDialog?.referrerName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jumlah:</span>
                <span className="font-bold text-green-600">{payoutDialog ? formatCurrency(payoutDialog.amount) : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank:</span>
                <span>{payoutDialog?.bankInfo.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">No. Rekening:</span>
                <span className="font-mono">{payoutDialog?.bankInfo.account || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama:</span>
                <span>{payoutDialog?.bankInfo.holder || '-'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout_reference">Nomor Referensi Transfer</Label>
              <Input
                id="payout_reference"
                placeholder="Masukkan nomor referensi dari bank"
                value={payoutReference}
                onChange={(e) => setPayoutReference(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialog(null)}>
              Batal
            </Button>
            <Button
              onClick={() => payoutDialog && handleUpdateStatus(payoutDialog.commissionId, 'paid')}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Konfirmasi Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
