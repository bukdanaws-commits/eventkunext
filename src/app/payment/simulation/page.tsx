'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  CreditCard,
  Loader2,
  RefreshCw,
  Copy,
  ArrowLeft,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';

interface PaymentRecord {
  id: string;
  midtrans_order_id: string;
  payment_status: string;
  total_amount: number;
  tier: string;
  created_at: string;
  updated_at: string;
  events?: {
    name: string;
  };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const TEST_CARDS = [
  { name: 'Success', number: '4811 1111 1111 1114', cvv: '123', exp: '01/25', scenario: 'success' },
  { name: 'Challenge by FDS', number: '4511 1111 1111 1117', cvv: '123', exp: '01/25', scenario: 'challenge' },
  { name: 'Denied by Bank', number: '4111 1111 1111 1111', cvv: '123', exp: '01/25', scenario: 'denied' },
  { name: 'Pending', number: '4211 1111 1111 1110', cvv: '123', exp: '01/25', scenario: 'pending' },
];

export default function PaymentSimulation() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollingPaymentId, setPollingPaymentId] = useState<string | null>(null);
  const [simulatingWebhook, setSimulatingWebhook] = useState<string | null>(null);

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from('event_payments')
      .select('*, events(name)')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching payments:', error);
      return;
    }

    setPayments(data as PaymentRecord[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();

    // Set up realtime subscription for payment updates
    const channel = supabase
      .channel('payment-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'event_payments'
        },
        (payload) => {
          console.log('Payment updated:', payload);
          setPayments(prev => 
            prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p)
          );
          toast.success('Status pembayaran diperbarui!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Polling function for specific payment
  const startPolling = async (paymentId: string, orderId: string) => {
    setPollingPaymentId(paymentId);
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max

    const poll = async () => {
      attempts++;
      
      const { data, error } = await supabase
        .from('event_payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error) {
        console.error('Polling error:', error);
        setPollingPaymentId(null);
        return;
      }

      setPayments(prev => 
        prev.map(p => p.id === paymentId ? { ...p, ...data } : p)
      );

      if (data.payment_status !== 'pending' || attempts >= maxAttempts) {
        setPollingPaymentId(null);
        if (data.payment_status !== 'pending') {
          toast.success(`Status pembayaran: ${data.payment_status.toUpperCase()}`);
        }
      } else {
        setTimeout(poll, 2000);
      }
    };

    poll();
  };

  // Simulate webhook call for testing
  const simulateWebhook = async (orderId: string, status: 'settlement' | 'pending' | 'deny' | 'expire') => {
    setSimulatingWebhook(orderId);
    
    try {
      const { data, error } = await supabase.functions.invoke('simulate-payment-webhook', {
        body: { 
          order_id: orderId,
          transaction_status: status
        }
      });

      if (error) throw error;

      toast.success(`Webhook ${status} berhasil disimulasikan!`);
      fetchPayments();
    } catch (error) {
      console.error('Error simulating webhook:', error);
      toast.error('Gagal simulasi webhook. Pastikan edge function sudah di-deploy.');
    } finally {
      setSimulatingWebhook(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Disalin ke clipboard!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case 'expired':
        return <Badge className="bg-muted text-muted-foreground"><AlertTriangle className="w-3 h-3 mr-1" /> Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Simulasi Pembayaran Midtrans</h1>
            <p className="text-muted-foreground">Mode Sandbox - Untuk testing saja</p>
          </div>
          <Badge variant="outline" className="ml-auto bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
            SANDBOX MODE
          </Badge>
        </div>

        {/* Test Cards Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Kartu Test Sandbox
            </CardTitle>
            <CardDescription>
              Gunakan kartu-kartu berikut untuk testing di environment sandbox Midtrans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {TEST_CARDS.map((card) => (
                <div 
                  key={card.number}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{card.name}</span>
                    <Badge variant={
                      card.scenario === 'success' ? 'default' :
                      card.scenario === 'pending' ? 'secondary' : 'destructive'
                    }>
                      {card.scenario}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Number:</span>
                      <div className="flex items-center gap-1">
                        <code className="bg-muted px-2 py-0.5 rounded text-xs">{card.number}</code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(card.number.replace(/\s/g, ''))}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">CVV:</span>
                      <code className="bg-muted px-2 py-0.5 rounded text-xs">{card.cvv}</code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Exp:</span>
                      <code className="bg-muted px-2 py-0.5 rounded text-xs">{card.exp}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments with Polling */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Pembayaran Terbaru
                </CardTitle>
                <CardDescription>
                  Klik tombol refresh untuk polling status atau gunakan tombol simulasi webhook
                </CardDescription>
              </div>
              <Button variant="outline" onClick={fetchPayments}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada pembayaran</p>
                <p className="text-sm">Buat pembayaran baru dari halaman upgrade event</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div 
                    key={payment.id}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{payment.events?.name || 'Unknown Event'}</span>
                          {getStatusBadge(payment.payment_status)}
                          {pollingPaymentId === payment.id && (
                            <Badge variant="outline" className="animate-pulse">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Polling...
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <code className="bg-muted px-2 py-0.5 rounded text-xs">
                            {payment.midtrans_order_id}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5"
                            onClick={() => copyToClipboard(payment.midtrans_order_id || '')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Tier:</span>{' '}
                          <span className="uppercase font-medium">{payment.tier}</span>
                          {' • '}
                          <span className="font-medium">{formatCurrency(payment.total_amount)}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {/* Polling Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pollingPaymentId === payment.id}
                          onClick={() => startPolling(payment.id, payment.midtrans_order_id || '')}
                        >
                          {pollingPaymentId === payment.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-1" />
                          )}
                          Poll Status
                        </Button>

                        <Separator orientation="vertical" className="h-8 hidden md:block" />

                        {/* Webhook Simulation Buttons */}
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:bg-green-500/10"
                            disabled={!!simulatingWebhook}
                            onClick={() => simulateWebhook(payment.midtrans_order_id || '', 'settlement')}
                          >
                            {simulatingWebhook === payment.midtrans_order_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-yellow-600 hover:bg-yellow-500/10"
                            disabled={!!simulatingWebhook}
                            onClick={() => simulateWebhook(payment.midtrans_order_id || '', 'pending')}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            disabled={!!simulatingWebhook}
                            onClick={() => simulateWebhook(payment.midtrans_order_id || '', 'deny')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-muted-foreground hover:bg-muted"
                            disabled={!!simulatingWebhook}
                            onClick={() => simulateWebhook(payment.midtrans_order_id || '', 'expire')}
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Cara Penggunaan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">1. Testing dengan Kartu Sandbox</h4>
                <p className="text-sm text-muted-foreground">
                  Gunakan nomor kartu di atas saat melakukan pembayaran di popup Midtrans Snap.
                  Setiap kartu akan menghasilkan skenario yang berbeda.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">2. Real-time Status dengan Polling</h4>
                <p className="text-sm text-muted-foreground">
                  Klik "Poll Status" untuk mengecek status pembayaran secara berkala (setiap 2 detik).
                  Polling akan berhenti otomatis setelah status berubah atau 60 detik.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">3. Simulasi Webhook</h4>
                <p className="text-sm text-muted-foreground">
                  Gunakan tombol warna untuk mensimulasikan callback webhook Midtrans:
                  Hijau = Success, Kuning = Pending, Merah = Denied, Abu = Expired.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">4. Realtime Updates</h4>
                <p className="text-sm text-muted-foreground">
                  Status akan diperbarui otomatis jika ada perubahan di database
                  (melalui Supabase Realtime subscription).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
