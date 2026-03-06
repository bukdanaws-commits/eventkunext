'use client';

import { useState, useMemo, useEffect } from 'react';
import { EventLayout, EventContextValue } from '@/components/layout/EventLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { 
  Search, 
  CreditCard, 
  Check, 
  X, 
  Loader2, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Users, 
  RefreshCw,
  FileImage,
  Eye,
  Bell,
  Upload
} from 'lucide-react';
import { RefundManagement } from '@/components/payment/RefundManagement';
import { PaymentProofDialog } from '@/components/payment/PaymentProofDialog';
import { ExportPaymentsDialog } from '@/components/payment/ExportPaymentsDialog';
import { PaymentStatsDashboard } from '@/components/payment/PaymentStatsDashboard';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';

interface ParticipantPayment {
  id: string;
  amount: number;
  payment_status: string;
  payment_method: string | null;
  midtrans_order_id: string | null;
  expires_at: string | null;
  paid_at: string | null;
  created_at: string;
  proof_url: string | null;
  proof_uploaded_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  participants: {
    name: string;
    email: string | null;
    ticket_number: string;
    phone: string | null;
  };
  ticket_tiers: {
    name: string;
  } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'hsl(var(--chart-3))',
  paid: 'hsl(var(--chart-2))',
  failed: 'hsl(var(--chart-1))',
  expired: 'hsl(var(--muted-foreground))',
  refunded: 'hsl(var(--chart-4))',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getStatusBadge(status: string, hasProof?: boolean, isRejected?: boolean) {
  if (isRejected) {
    return <Badge variant="destructive"><X className="mr-1 h-3 w-3" /> Ditolak</Badge>;
  }
  if (status === 'pending' && hasProof) {
    return <Badge className="bg-blue-500"><FileImage className="mr-1 h-3 w-3" /> Ada Bukti</Badge>;
  }
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="mr-1 h-3 w-3" /> Menunggu</Badge>;
    case 'paid':
      return <Badge className="bg-green-500"><Check className="mr-1 h-3 w-3" /> Lunas</Badge>;
    case 'failed':
      return <Badge variant="destructive"><X className="mr-1 h-3 w-3" /> Gagal</Badge>;
    case 'expired':
      return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> Expired</Badge>;
    case 'refunded':
      return <Badge variant="outline" className="text-purple-600 border-purple-600"><RefreshCw className="mr-1 h-3 w-3" /> Refunded</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function EventPaymentsContent({ event }: EventContextValue) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<ParticipantPayment | null>(null);
  const [actionType, setActionType] = useState<'verify' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [selectedProofParticipant, setSelectedProofParticipant] = useState<string>('');
  const [newProofCount, setNewProofCount] = useState(0);

  // Fetch participant payments for this event
  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ['event-payments', event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('participant_payments')
        .select(`
          *,
          participants(name, email, ticket_number, phone),
          ticket_tiers(name)
        `)
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ParticipantPayment[];
    },
  });

  // Realtime subscription for new proof uploads
  useEffect(() => {
    const channel = supabase
      .channel(`event-payments-${event.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'participant_payments',
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          const newPayment = payload.new as any;
          const oldPayment = payload.old as any;
          
          // Check if proof was just uploaded
          if (newPayment.proof_url && !oldPayment.proof_url) {
            setNewProofCount(prev => prev + 1);
            toast({
              title: 'Bukti Baru Diupload',
              description: 'Ada peserta yang mengupload bukti pembayaran',
            });
            refetch();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id, refetch, toast]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!payments) return { total: 0, paid: 0, pending: 0, revenue: 0, conversionRate: 0, withProof: 0 };

    const total = payments.length;
    const paid = payments.filter(p => p.payment_status === 'paid').length;
    const pending = payments.filter(p => p.payment_status === 'pending').length;
    const withProof = payments.filter(p => p.proof_url && p.payment_status === 'pending' && !p.rejected_at).length;
    const revenue = payments
      .filter(p => p.payment_status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    const conversionRate = total > 0 ? (paid / total) * 100 : 0;

    return { total, paid, pending, revenue, conversionRate, withProof };
  }, [payments]);

  // Prepare chart data
  const statusChartData = useMemo(() => {
    if (!payments) return [];
    const counts: Record<string, number> = {};
    payments.forEach(p => {
      counts[p.payment_status] = (counts[p.payment_status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: STATUS_COLORS[status] || 'hsl(var(--muted-foreground))',
    }));
  }, [payments]);

  const dailyRevenueData = useMemo(() => {
    if (!payments) return [];
    const dailyData: Record<string, number> = {};
    payments
      .filter(p => p.payment_status === 'paid' && p.paid_at)
      .forEach(p => {
        const date = format(new Date(p.paid_at!), 'dd MMM', { locale: localeId });
        dailyData[date] = (dailyData[date] || 0) + p.amount;
      });
    return Object.entries(dailyData).map(([date, amount]) => ({
      date,
      amount,
    }));
  }, [payments]);

  const tierRevenueData = useMemo(() => {
    if (!payments) return [];
    const tierData: Record<string, number> = {};
    payments
      .filter(p => p.payment_status === 'paid')
      .forEach(p => {
        const tierName = p.ticket_tiers?.name || 'Unknown';
        tierData[tierName] = (tierData[tierName] || 0) + p.amount;
      });
    return Object.entries(tierData).map(([tier, revenue]) => ({
      tier,
      revenue,
    }));
  }, [payments]);

  // Filter payments
  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    return payments.filter(payment => {
      const matchesSearch = 
        payment.participants?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.participants?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.participants?.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.midtrans_order_id?.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter === 'all') {
        matchesStatus = true;
      } else if (statusFilter === 'with_proof') {
        matchesStatus = !!payment.proof_url && payment.payment_status === 'pending' && !payment.rejected_at;
      } else if (statusFilter === 'rejected') {
        matchesStatus = !!payment.rejected_at;
      } else {
        matchesStatus = payment.payment_status === statusFilter;
      }
      
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchQuery, statusFilter]);

  const handleViewProof = (payment: ParticipantPayment) => {
    setSelectedProofUrl(payment.proof_url);
    setSelectedProofParticipant(payment.participants?.name || '');
    setProofDialogOpen(true);
    setNewProofCount(0);
  };

  // Verify manual payment mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('participant_payments')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          payment_method: 'manual_transfer',
        })
        .eq('id', paymentId);

      if (error) throw error;

      // Also update participant payment status
      const payment = payments?.find(p => p.id === paymentId);
      if (payment) {
        await supabase
          .from('participants')
          .update({ payment_status: 'paid' })
          .eq('ticket_number', payment.participants.ticket_number);
      }
    },
    onSuccess: () => {
      toast({ title: 'Pembayaran Diverifikasi', description: 'Status pembayaran telah diubah menjadi lunas' });
      queryClient.invalidateQueries({ queryKey: ['event-payments', event.id] });
      setSelectedPayment(null);
      setActionType(null);
    },
    onError: (error: any) => {
      toast({ title: 'Gagal Verifikasi', description: error.message, variant: 'destructive' });
    },
  });

  // Reject payment mutation
  const rejectPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason: string }) => {
      const { error } = await supabase
        .from('participant_payments')
        .update({
          payment_status: 'pending',
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', paymentId);

      if (error) throw error;

      // Also update participant payment status
      const payment = payments?.find(p => p.id === paymentId);
      if (payment) {
        await supabase
          .from('participants')
          .update({ payment_status: 'rejected' })
          .eq('ticket_number', payment.participants.ticket_number);
      }

      // Send rejection email notification
      try {
        await supabase.functions.invoke('send-proof-rejection-email', {
          body: {
            paymentId,
            rejectionReason: reason,
          },
        });
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
        // Don't throw - email failure shouldn't block the rejection
      }
    },
    onSuccess: () => {
      toast({ title: 'Pembayaran Ditolak', description: 'Peserta akan menerima notifikasi email' });
      queryClient.invalidateQueries({ queryKey: ['event-payments', event.id] });
      setSelectedPayment(null);
      setActionType(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast({ title: 'Gagal Menolak', description: error.message, variant: 'destructive' });
    },
  });

  const handleAction = (payment: ParticipantPayment, action: 'verify' | 'reject') => {
    setSelectedPayment(payment);
    setActionType(action);
  };

  const handleConfirmAction = () => {
    if (!selectedPayment || !actionType) return;

    if (actionType === 'verify') {
      verifyPaymentMutation.mutate(selectedPayment.id);
    } else {
      if (!rejectionReason.trim()) {
        toast({ title: 'Alasan Diperlukan', description: 'Mohon berikan alasan penolakan', variant: 'destructive' });
        return;
      }
      rejectPaymentMutation.mutate({ paymentId: selectedPayment.id, reason: rejectionReason });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pembayaran Tiket</h1>
          <p className="text-muted-foreground">Kelola pembayaran peserta event Anda</p>
        </div>
        <ExportPaymentsDialog eventId={event.id} eventName={event.name} />
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payments">Daftar Pembayaran</TabsTrigger>
          <TabsTrigger value="refunds">Refund</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Payments List Tab */}
        <TabsContent value="payments" className="space-y-4">
          {/* Stats Cards - Colorful */}
          <div className="grid gap-4 md:grid-cols-4">
            {/* Total Revenue - Emerald/Green */}
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-100">
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(stats.revenue)}</p>
                <p className="text-sm text-emerald-100">{stats.paid} pembayaran lunas</p>
              </CardContent>
            </Card>

            {/* Menunggu Pembayaran - Amber/Orange */}
            <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-100">
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  Menunggu Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-amber-100">Peserta pending</p>
              </CardContent>
            </Card>

            {/* Conversion Rate - Blue */}
            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-100">
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                <p className="text-sm text-blue-100">Paid dari total</p>
              </CardContent>
            </Card>

            {/* Total Transaksi - Primary/Teal */}
            <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary-foreground/90">
                  <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary-foreground" />
                  </div>
                  Total Transaksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-primary-foreground/80">Semua status</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama, email, tiket, atau order ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="with_proof">
                      <span className="flex items-center gap-2">
                        <FileImage className="h-3 w-3" /> Ada Bukti ({stats.withProof})
                      </span>
                    </SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card>
            <CardContent className="pt-6">
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada pembayaran</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Peserta</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.participants?.name}</div>
                            <div className="text-sm text-muted-foreground">{payment.participants?.email}</div>
                            <div className="text-xs text-muted-foreground font-mono">{payment.participants?.ticket_number}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.ticket_tiers?.name || 'Default'}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.payment_status, !!payment.proof_url, !!payment.rejected_at)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.midtrans_order_id || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(payment.created_at), 'dd MMM yyyy', { locale: localeId })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(payment.created_at), 'HH:mm', { locale: localeId })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {payment.proof_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewProof(payment)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {payment.payment_status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleAction(payment, 'verify')}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleAction(payment, 'reject')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {payment.payment_status === 'paid' && (
                              <span className="text-sm text-green-600">
                                {payment.paid_at && format(new Date(payment.paid_at), 'dd/MM HH:mm', { locale: localeId })}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Refunds Tab */}
        <TabsContent value="refunds">
          <RefundManagement eventId={event.id} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <PaymentStatsDashboard eventId={event.id} />
        </TabsContent>
      </Tabs>

      {/* Confirm Action Dialog */}
      <Dialog open={!!selectedPayment && !!actionType} onOpenChange={() => { setSelectedPayment(null); setActionType(null); setRejectionReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'verify' ? 'Verifikasi Pembayaran' : 'Tolak Pembayaran'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'verify' 
                ? 'Pastikan pembayaran telah diterima sebelum memverifikasi.'
                : 'Berikan alasan penolakan untuk peserta.'}
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Peserta</span>
                  <span className="font-medium">{selectedPayment.participants?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tiket</span>
                  <span className="font-mono">{selectedPayment.participants?.ticket_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tier</span>
                  <span>{selectedPayment.ticket_tiers?.name || 'Default'}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Jumlah</span>
                  <span>{formatCurrency(selectedPayment.amount)}</span>
                </div>
              </div>

              {actionType === 'reject' && (
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">Alasan Penolakan *</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Jelaskan alasan penolakan..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setSelectedPayment(null); setActionType(null); setRejectionReason(''); }}
              disabled={verifyPaymentMutation.isPending || rejectPaymentMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant={actionType === 'verify' ? 'default' : 'destructive'}
              onClick={handleConfirmAction}
              disabled={verifyPaymentMutation.isPending || rejectPaymentMutation.isPending}
            >
              {(verifyPaymentMutation.isPending || rejectPaymentMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {actionType === 'verify' ? 'Verifikasi Pembayaran' : 'Tolak Pembayaran'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Proof Dialog */}
      <PaymentProofDialog
        open={proofDialogOpen}
        onOpenChange={setProofDialogOpen}
        proofUrl={selectedProofUrl}
        participantName={selectedProofParticipant}
      />
    </div>
  );
}

export default function EventPayments() {
  return (
    <EventLayout>
      {(context) => <EventPaymentsContent {...context} />}
    </EventLayout>
  );
}
