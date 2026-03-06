'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, RefreshCw, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Download, CheckCheck, Building2, Image as ImageIcon, ExternalLink, Ban, Timer, BarChart3, FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuditLog } from '@/hooks/useAdminAuditLog';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { SessionErrorAlert } from '@/components/admin/SessionErrorAlert';
import { PaymentMonitoringDashboard } from '@/components/admin/PaymentMonitoringDashboard';
import { PaymentAnalytics } from '@/components/admin/PaymentAnalytics';
import { FormAddonMonitoring } from '@/components/admin/FormAddonMonitoring';
import { RetryPaymentDialog } from '@/components/payment/RetryPaymentDialog';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface Payment {
  id: string;
  amount: number;
  total_amount: number;
  discount_amount: number;
  payment_status: string;
  payment_method: string | null;
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  created_at: string;
  paid_at: string | null;
  midtrans_order_id: string | null;
  midtrans_transaction_id: string | null;
  referral_code: string | null;
  event_id: string;
  organization_id: string;
  form_addon_purchased: boolean;
  proof_url: string | null;
  expires_at: string | null;
}

interface PaymentWithDetails extends Payment {
  event_name?: string;
  organization_name?: string;
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
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
    case 'paid':
      return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 gap-1"><CheckCircle className="h-3 w-3" />Paid</Badge>;
    case 'failed':
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
    case 'expired':
      return <Badge variant="outline" className="gap-1 text-muted-foreground"><AlertCircle className="h-3 w-3" />Expired</Badge>;
    case 'refunded':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1"><RefreshCw className="h-3 w-3" />Refunded</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getTierBadge(tier: string) {
  const colors: Record<string, string> = {
    free: 'bg-slate-100 text-slate-800',
    basic: 'bg-blue-100 text-blue-800',
    pro: 'bg-purple-100 text-purple-800',
    enterprise: 'bg-amber-100 text-amber-800',
  };
  return <Badge className={(colors[tier] || 'bg-slate-100 text-slate-800') + ' hover:' + colors[tier]}>{tier.toUpperCase()}</Badge>;
}

export default function AdminPayments() {
  const { toast } = useToast();
  const { logAction } = useAdminAuditLog();
  const { isRefreshing, sessionError, clearSessionError, refreshSession, handleApiError } = useSessionRefresh();
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithDetails | null>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    setLoading(true);
    
    try {
      const { data: paymentsData, error } = await supabase
        .from('event_payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedPayments: PaymentWithDetails[] = await Promise.all(
        (paymentsData || []).map(async (payment) => {
          const { data: event } = await supabase
            .from('events')
            .select('name')
            .eq('id', payment.event_id)
            .maybeSingle();

          const { data: org } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', payment.organization_id)
            .maybeSingle();

          return {
            ...payment,
            event_name: event?.name || 'Unknown Event',
            organization_name: org?.name || 'Unknown Organization',
          };
        })
      );

      setPayments(enrichedPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat data pembayaran',
      });
    } finally {
      setLoading(false);
    }
  }

  const handleRefund = async () => {
    if (!selectedPayment) return;

    setProcessing(true);
    
    try {
      const { error } = await supabase
        .from('event_payments')
        .update({ payment_status: 'refunded' })
        .eq('id', selectedPayment.id);

      if (error) throw error;

      await supabase
        .from('events')
        .update({ status: 'pending_payment', tier: 'free' })
        .eq('id', selectedPayment.event_id);

      await logAction({
        action: 'refund_processed',
        targetType: 'payment',
        targetId: selectedPayment.id,
        details: {
          event_id: selectedPayment.event_id,
          event_name: selectedPayment.event_name,
          amount: selectedPayment.total_amount,
          tier: selectedPayment.tier,
          midtrans_order_id: selectedPayment.midtrans_order_id,
        },
      });

      setPayments(prev =>
        prev.map(p => p.id === selectedPayment.id ? { ...p, payment_status: 'refunded' } : p)
      );

      toast({
        title: 'Refund Berhasil',
        description: 'Pembayaran berhasil di-refund',
      });

      setRefundDialogOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memproses refund',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyManualPayment = async () => {
    if (!selectedPayment) return;

    setProcessing(true);
    
    try {
      const { error } = await supabase
        .from('event_payments')
        .update({ 
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', selectedPayment.id);

      if (error) throw error;

      await supabase
        .from('events')
        .update({ 
          status: 'active', 
          tier: selectedPayment.tier,
          form_addon_purchased: selectedPayment.form_addon_purchased || false,
        })
        .eq('id', selectedPayment.event_id);

      await logAction({
        action: 'manual_payment_verified',
        targetType: 'payment',
        targetId: selectedPayment.id,
        details: {
          event_id: selectedPayment.event_id,
          event_name: selectedPayment.event_name,
          amount: selectedPayment.total_amount,
          tier: selectedPayment.tier,
          order_id: selectedPayment.midtrans_order_id,
        },
      });

      try {
        const { error: emailError } = await supabase.functions.invoke('send-payment-status-email', {
          body: { paymentId: selectedPayment.id, status: 'approved' }
        });
        
        if (emailError) {
          console.error('Error sending payment status email:', emailError);
        } else {
          console.log('Payment approval email sent successfully');
        }
      } catch (emailErr) {
        console.error('Error invoking send-payment-status-email:', emailErr);
      }

      setPayments(prev =>
        prev.map(p => p.id === selectedPayment.id ? { ...p, payment_status: 'paid', paid_at: new Date().toISOString() } : p)
      );

      toast({
        title: 'Verifikasi Berhasil',
        description: 'Pembayaran manual berhasil diverifikasi dan email notifikasi telah dikirim',
      });

      setVerifyDialogOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memverifikasi pembayaran',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectManualPayment = async () => {
    if (!selectedPayment) return;

    setProcessing(true);
    
    try {
      const { error } = await supabase
        .from('event_payments')
        .update({ 
          payment_status: 'failed',
          rejection_reason: rejectionReason || null,
          rejected_at: new Date().toISOString(),
        })
        .eq('id', selectedPayment.id);

      if (error) throw error;

      await supabase
        .from('events')
        .update({ status: 'pending_payment' })
        .eq('id', selectedPayment.event_id);

      await logAction({
        action: 'manual_payment_rejected',
        targetType: 'payment',
        targetId: selectedPayment.id,
        details: {
          event_id: selectedPayment.event_id,
          event_name: selectedPayment.event_name,
          amount: selectedPayment.total_amount,
          tier: selectedPayment.tier,
          order_id: selectedPayment.midtrans_order_id,
          rejection_reason: rejectionReason,
        },
      });

      try {
        const { error: emailError } = await supabase.functions.invoke('send-payment-status-email', {
          body: { 
            paymentId: selectedPayment.id,
            status: 'rejected',
            rejectionReason: rejectionReason || 'Pembayaran tidak dapat diverifikasi',
          }
        });
        
        if (emailError) {
          console.error('Error sending rejection email:', emailError);
        } else {
          console.log('Rejection email sent successfully');
        }
      } catch (emailErr) {
        console.error('Error invoking send-payment-status-email:', emailErr);
      }

      setPayments(prev =>
        prev.map(p => p.id === selectedPayment.id ? { ...p, payment_status: 'failed' } : p)
      );

      toast({
        title: 'Pembayaran Ditolak',
        description: 'Pembayaran manual ditolak dan notifikasi telah dikirim ke user',
      });

      setRejectDialogOpen(false);
      setSelectedPayment(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menolak pembayaran',
      });
    } finally {
      setProcessing(false);
    }
  };

  const exportToExcel = () => {
    const exportData = filteredPayments.map(p => ({
      'Order ID': p.midtrans_order_id || '-',
      'Event': p.event_name,
      'Organization': p.organization_name,
      'Tier': p.tier,
      'Amount': p.total_amount,
      'Status': p.payment_status,
      'Payment Method': p.payment_method || '-',
      'Referral Code': p.referral_code || '-',
      'Created': format(new Date(p.created_at), 'dd MMM yyyy HH:mm', { locale: localeId }),
      'Paid At': p.paid_at ? format(new Date(p.paid_at), 'dd MMM yyyy HH:mm', { locale: localeId }) : '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');
    XLSX.writeFile(wb, 'payments_' + format(new Date(), 'yyyyMMdd') + '.xlsx');

    toast({
      title: 'Export Berhasil',
      description: 'File Excel berhasil diunduh',
    });
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = searchQuery === '' ||
      payment.event_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.organization_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.midtrans_order_id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || payment.payment_status === statusFilter;
    const matchesTier = tierFilter === 'all' || payment.tier === tierFilter;
    const matchesMethod = methodFilter === 'all' || 
      (methodFilter === 'manual' && payment.payment_method === 'manual_transfer') ||
      (methodFilter === 'midtrans' && payment.payment_method !== 'manual_transfer');

    return matchesSearch && matchesStatus && matchesTier && matchesMethod;
  });

  const totalPaid = payments.filter(p => p.payment_status === 'paid').reduce((sum, p) => sum + p.total_amount, 0);
  const totalPending = payments.filter(p => p.payment_status === 'pending').reduce((sum, p) => sum + p.total_amount, 0);
  const totalRefunded = payments.filter(p => p.payment_status === 'refunded').reduce((sum, p) => sum + p.total_amount, 0);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payment Management</h1>
            <p className="text-muted-foreground mt-1">Kelola semua pembayaran (Midtrans & Manual Transfer)</p>
          </div>
          <Button onClick={exportToExcel} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">Semua Pembayaran</TabsTrigger>
            <TabsTrigger value="monitoring" className="gap-2">
              <Timer className="h-4 w-4" />
              Monitoring Real-time
            </TabsTrigger>
            <TabsTrigger value="form-addon" className="gap-2">
              <FileText className="h-4 w-4" />
              Form Addon
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring" className="mt-6">
            <PaymentMonitoringDashboard />
          </TabsContent>

          <TabsContent value="form-addon" className="mt-6">
            <FormAddonMonitoring />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <PaymentAnalytics />
          </TabsContent>

          <TabsContent value="all" className="mt-6 space-y-6">

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalPaid)}</div>
              <div className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                {payments.filter(p => p.payment_status === 'paid').length} transaksi
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency(totalPending)}</div>
              <div className="text-sm text-amber-600/80 dark:text-amber-400/80">
                {payments.filter(p => p.payment_status === 'pending').length} transaksi
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950 border-red-200 dark:border-red-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">Refunded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(totalRefunded)}</div>
              <div className="text-sm text-red-600/80 dark:text-red-400/80">
                {payments.filter(p => p.payment_status === 'refunded').length} transaksi
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari order ID, event, atau organization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Metode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Metode</SelectItem>
                  <SelectItem value="midtrans">Midtrans</SelectItem>
                  <SelectItem value="manual">Manual Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tier</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchPayments} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Bukti</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Tidak ada pembayaran ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">
                        {payment.midtrans_order_id || '-'}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">{payment.event_name}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{payment.organization_name}</TableCell>
                      <TableCell>{getTierBadge(payment.tier)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(payment.total_amount)}</TableCell>
                      <TableCell>{getStatusBadge(payment.payment_status)}</TableCell>
                      <TableCell className="text-xs">
                        {payment.payment_method === 'manual_transfer' ? (
                          <Badge variant="outline" className="gap-1">
                            <Building2 className="h-3 w-3" /> Manual
                          </Badge>
                        ) : (
                          payment.payment_method || '-'
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(payment.created_at), 'dd MMM yyyy', { locale: localeId })}
                      </TableCell>
                      <TableCell>
                        {payment.payment_method === 'manual_transfer' && payment.proof_url && (
                          <a href={payment.proof_url} target="_blank" rel="noopener noreferrer" className="inline-block mb-1">
                            <img 
                              src={payment.proof_url} 
                              alt="Bukti" 
                              className="h-8 w-8 rounded object-cover border hover:opacity-80 transition-opacity"
                            />
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="space-x-1">
                        {payment.payment_status === 'pending' && payment.payment_method === 'manual_transfer' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setVerifyDialogOpen(true);
                              }}
                            >
                              <CheckCheck className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setRejectDialogOpen(true);
                              }}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {(payment.payment_status === 'failed' || payment.payment_status === 'expired') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setRetryDialogOpen(true);
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Retry
                          </Button>
                        )}
                        {payment.payment_status === 'paid' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setRefundDialogOpen(true);
                            }}
                          >
                            Refund
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Refund</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin melakukan refund untuk pembayaran ini?
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-muted-foreground">Order ID:</div>
                  <div className="font-mono">{selectedPayment.midtrans_order_id}</div>
                  <div className="text-muted-foreground">Event:</div>
                  <div>{selectedPayment.event_name}</div>
                  <div className="text-muted-foreground">Amount:</div>
                  <div className="font-bold text-red-600">{formatCurrency(selectedPayment.total_amount)}</div>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Perhatian:</strong> Refund akan mengubah status event kembali ke pending dan tier ke free.
                    Proses refund ke customer harus dilakukan secara manual melalui dashboard Midtrans.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
                Batal
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleRefund}
                disabled={processing}
              >
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Proses Refund
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verifikasi Pembayaran Manual</DialogTitle>
              <DialogDescription>
                Pastikan Anda sudah menerima transfer sebelum memverifikasi pembayaran ini.
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-muted-foreground">Order ID:</div>
                  <div className="font-mono">{selectedPayment.midtrans_order_id}</div>
                  <div className="text-muted-foreground">Event:</div>
                  <div>{selectedPayment.event_name}</div>
                  <div className="text-muted-foreground">Tier:</div>
                  <div>{selectedPayment.tier.toUpperCase()}</div>
                  <div className="text-muted-foreground">Amount:</div>
                  <div className="font-bold text-green-600">{formatCurrency(selectedPayment.total_amount)}</div>
                  {selectedPayment.expires_at && (
                    <>
                      <div className="text-muted-foreground">Batas Waktu:</div>
                      <div className="text-amber-600">
                        {format(new Date(selectedPayment.expires_at), 'dd MMM yyyy HH:mm', { locale: localeId })}
                      </div>
                    </>
                  )}
                </div>
                
                {selectedPayment.proof_url ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Bukti Transfer</span>
                    </div>
                    <div className="relative rounded-lg overflow-hidden border">
                      <img 
                        src={selectedPayment.proof_url} 
                        alt="Bukti Transfer" 
                        className="w-full max-h-[300px] object-contain bg-muted"
                      />
                      <a 
                        href={selectedPayment.proof_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 p-2 bg-background/80 rounded-lg hover:bg-background transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-800 dark:text-amber-200">
                        Bukti transfer belum diupload oleh user
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    <strong>Info:</strong> Setelah diverifikasi, event akan otomatis diupgrade ke tier {selectedPayment.tier.toUpperCase()}.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
                Batal
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleVerifyManualPayment}
                disabled={processing}
              >
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verifikasi Pembayaran
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Ban className="h-5 w-5" />
                Tolak Pembayaran Manual
              </DialogTitle>
              <DialogDescription>
                Pembayaran akan ditolak dan user akan mendapat notifikasi email.
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-muted-foreground">Order ID:</div>
                  <div className="font-mono">{selectedPayment.midtrans_order_id}</div>
                  <div className="text-muted-foreground">Event:</div>
                  <div>{selectedPayment.event_name}</div>
                  <div className="text-muted-foreground">Tier:</div>
                  <div>{selectedPayment.tier.toUpperCase()}</div>
                  <div className="text-muted-foreground">Amount:</div>
                  <div className="font-bold">{formatCurrency(selectedPayment.total_amount)}</div>
                </div>
                
                {selectedPayment.proof_url && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Bukti Transfer</span>
                    </div>
                    <div className="relative rounded-lg overflow-hidden border">
                      <img 
                        src={selectedPayment.proof_url} 
                        alt="Bukti Transfer" 
                        className="w-full max-h-[200px] object-contain bg-muted"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">Alasan Penolakan</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Contoh: Jumlah transfer tidak sesuai, bukti tidak valid, dll."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>Perhatian:</strong> Pembayaran akan ditandai sebagai gagal dan user perlu melakukan pembayaran ulang.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason('');
              }}>
                Batal
              </Button>
              <Button 
                variant="destructive"
                onClick={handleRejectManualPayment}
                disabled={processing}
              >
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tolak Pembayaran
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {selectedPayment && (
          <RetryPaymentDialog
            open={retryDialogOpen}
            onOpenChange={setRetryDialogOpen}
            paymentId={selectedPayment.id}
            eventName={selectedPayment.event_name || 'Unknown Event'}
            paymentMethod={selectedPayment.payment_method}
            onSuccess={fetchPayments}
          />
        )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
