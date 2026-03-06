'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Loader2, ArrowLeft, Download, Mail, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded' | 'loading';

interface ParticipantPaymentData {
  id: string;
  participant_id: string;
  event_id: string;
  amount: number;
  payment_status: string;
  midtrans_order_id: string;
  paid_at: string | null;
  participants?: {
    id: string;
    name: string;
    email: string;
    ticket_number: string;
  };
  events?: {
    id: string;
    name: string;
    event_date: string;
    location: string;
  };
  ticket_tiers?: {
    id: string;
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

export default function ParticipantPaymentStatusPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [payment, setPayment] = useState<ParticipantPaymentData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const orderId = searchParams.get('order_id');
  const transactionStatus = searchParams.get('transaction_status');

  useEffect(() => {
    const fetchPayment = async () => {
      if (!orderId) {
        setStatus('failed');
        return;
      }

      // In a real app, this would fetch from an API
      // For demo, we'll just show a placeholder
      setStatus('pending');
      setPayment({
        id: 'demo-payment',
        participant_id: 'demo-participant',
        event_id: 'demo-event',
        amount: 100000,
        payment_status: 'pending',
        midtrans_order_id: orderId,
        paid_at: null,
        participants: {
          id: 'demo-participant',
          name: 'Demo User',
          email: 'demo@example.com',
          ticket_number: 'TKT-DEMO001',
        },
        events: {
          id: 'demo-event',
          name: 'Demo Event',
          event_date: new Date().toISOString(),
          location: 'Jakarta',
        },
        ticket_tiers: {
          id: 'demo-tier',
          name: 'Regular',
        },
      });
    };

    fetchPayment();
  }, [orderId, transactionStatus]);

  const handleDownloadQR = async () => {
    if (!qrDataUrl || !payment?.participants?.ticket_number) return;

    const link = document.createElement('a');
    link.download = `ticket-${payment.participants.ticket_number}.png`;
    link.href = qrDataUrl;
    link.click();

    toast({
      title: 'QR Code Diunduh',
      description: 'Simpan QR Code ini untuk check-in di event',
    });
  };

  const handleSendEmail = async () => {
    if (!payment?.participant_id) return;

    setSendingEmail(true);
    try {
      // In a real app, this would call an API
      toast({
        title: 'Email Terkirim',
        description: 'Konfirmasi tiket telah dikirim ke email Anda',
      });
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: 'Gagal Mengirim Email',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setSendingEmail(false);
    }
  };

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
      case 'refunded':
        return 'Pembayaran Direfund';
      case 'loading':
        return 'Memuat...';
      default:
        return 'Pembayaran Gagal';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'paid':
        return 'Terima kasih! Tiket Anda sudah aktif. Simpan QR Code di bawah untuk check-in.';
      case 'pending':
        return 'Pembayaran Anda sedang diproses. Silakan selesaikan pembayaran sesuai instruksi.';
      case 'expired':
        return 'Waktu pembayaran telah habis. Silakan daftar ulang untuk mendapatkan tiket.';
      case 'refunded':
        return 'Pembayaran Anda telah direfund. Dana akan dikembalikan dalam 3-7 hari kerja.';
      case 'loading':
        return 'Memuat status pembayaran...';
      default:
        return 'Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.';
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
            <>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Event</span>
                  <span className="font-medium">{payment.events?.name || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nama</span>
                  <span>{payment.participants?.name || '-'}</span>
                </div>
                {payment.ticket_tiers && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tipe Tiket</span>
                    <span>{payment.ticket_tiers.name}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(payment.amount)}</span>
                </div>
              </div>

              {/* QR Code Section - Only show if paid */}
              {status === 'paid' && payment.participants?.ticket_number && (
                <div className="bg-background border rounded-lg p-4 text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Ticket className="h-5 w-5" />
                    <span className="font-semibold">Tiket Anda</span>
                  </div>

                  <div className="font-mono text-xl font-bold text-foreground">
                    {payment.participants.ticket_number}
                  </div>

                  {qrDataUrl && (
                    <div className="flex justify-center">
                      <img 
                        src={qrDataUrl} 
                        alt="Ticket QR Code" 
                        className="w-48 h-48 border rounded-lg"
                      />
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">
                    Tunjukkan QR Code ini saat check-in di event
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex flex-col gap-2">
            {status === 'paid' && qrDataUrl && (
              <>
                <Button onClick={handleDownloadQR} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="w-full"
                >
                  {sendingEmail ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Kirim ke Email
                </Button>
              </>
            )}
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/ticket-status">
                <Ticket className="mr-2 h-4 w-4" />
                Cek Status Tiket
              </Link>
            </Button>

            <Button variant="ghost" asChild className="w-full">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Beranda
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
