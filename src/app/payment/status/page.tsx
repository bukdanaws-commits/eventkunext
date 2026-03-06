'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RetryPaymentDialog } from '@/components/payment/RetryPaymentDialog';

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded' | 'loading';

interface PaymentData {
  id: string;
  event_id: string;
  tier: string;
  total_amount: number;
  payment_status: PaymentStatus;
  midtrans_order_id: string;
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

export default function PaymentStatus() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);

  const orderId = searchParams.get('order_id');
  const transactionStatus = searchParams.get('transaction_status');

  useEffect(() => {
    const fetchPayment = async () => {
      if (!orderId) {
        setStatus('failed');
        return;
      }

      const { data, error } = await supabase
        .from('event_payments')
        .select('*, events(name)')
        .eq('midtrans_order_id', orderId)
        .single();

      if (error || !data) {
        console.error('Error fetching payment:', error);
        setStatus('failed');
        return;
      }

      setPayment(data as PaymentData);

      // Determine status from URL params or database
      if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
        setStatus('paid');
      } else if (transactionStatus === 'pending') {
        setStatus('pending');
      } else if (transactionStatus === 'deny' || transactionStatus === 'cancel') {
        setStatus('failed');
      } else if (transactionStatus === 'expire') {
        setStatus('expired');
      } else {
        // Fallback to database status
        setStatus(data.payment_status as PaymentStatus);
      }
    };

    fetchPayment();
  }, [orderId, transactionStatus]);

  const getStatusIcon = () => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'pending':
        return <Clock className="h-16 w-16 text-yellow-500" />;
      case 'loading':
        return <Loader2 className="h-16 w-16 text-muted-foreground animate-spin" />;
      default:
        return <XCircle className="h-16 w-16 text-destructive" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'paid':
        return 'Pembayaran Berhasil!';
      case 'pending':
        return 'Menunggu Pembayaran';
      case 'expired':
        return 'Pembayaran Kadaluarsa';
      case 'loading':
        return 'Memuat...';
      default:
        return 'Pembayaran Gagal';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'paid':
        return 'Terima kasih! Pembayaran Anda telah berhasil diproses dan event Anda sudah diupgrade.';
      case 'pending':
        return 'Pembayaran Anda sedang diproses. Silakan selesaikan pembayaran sesuai instruksi yang diberikan.';
      case 'expired':
        return 'Waktu pembayaran telah habis. Silakan buat transaksi baru jika Anda masih ingin upgrade.';
      case 'loading':
        return 'Memuat status pembayaran...';
      default:
        return 'Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi atau hubungi dukungan.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">{getStatusIcon()}</div>
          <CardTitle className="text-2xl">{getStatusTitle()}</CardTitle>
          <CardDescription>{getStatusDescription()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {payment && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono">{payment.midtrans_order_id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Event</span>
                <span>{payment.events?.name || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tier</span>
                <span className="uppercase">{payment.tier}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(payment.total_amount)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {/* Show retry button for failed or expired payments */}
            {payment && (status === 'failed' || status === 'expired') && (
              <Button 
                onClick={() => setRetryDialogOpen(true)} 
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Coba Bayar Ulang
              </Button>
            )}
            {payment?.event_id && status === 'paid' && (
              <Button asChild className="w-full">
                <Link href={`/dashboard/events/${payment.event_id}`}>
                  Lihat Event
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Retry Payment Dialog */}
      {payment && (
        <RetryPaymentDialog
          open={retryDialogOpen}
          onOpenChange={setRetryDialogOpen}
          paymentId={payment.id}
          eventName={payment.events?.name || 'Event'}
          paymentMethod={null}
          onSuccess={() => {
            toast({
              title: 'Pembayaran Berhasil Diperpanjang',
              description: 'Silakan lanjutkan pembayaran Anda',
            });
            // Reload payment data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
