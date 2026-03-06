'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefundRequestDialog } from '@/components/payment/RefundRequestDialog';
import { PaymentProofUpload } from '@/components/payment/PaymentProofUpload';
import { 
  Ticket, Calendar, MapPin, Clock, CreditCard, 
  CheckCircle2, XCircle, Loader2, AlertCircle, LogOut,
  QrCode, User, Mail, Phone, History, RotateCcw,
  Download, FileDown, Upload
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

interface ParticipantData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  ticket_number: string;
  status: string;
  payment_status: string;
  checked_in_at: string | null;
  tier_id: string | null;
  event: {
    id: string;
    name: string;
    event_date: string;
    event_time: string | null;
    location: string | null;
    ticket_price: number;
    is_paid_event: boolean;
  };
  tier?: {
    id: string;
    name: string;
    price: number;
  };
  payment?: {
    id: string;
    amount: number;
    payment_status: string;
    snap_token: string | null;
    paid_at: string | null;
    created_at: string;
    payment_method: string | null;
    proof_url: string | null;
    proof_uploaded_at: string | null;
    rejected_at: string | null;
    rejection_reason: string | null;
  };
}

interface PaymentHistory {
  id: string;
  amount: number;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
  paid_at: string | null;
  proof_url: string | null;
  proof_uploaded_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  tier?: {
    name: string;
  };
}

interface RefundRequest {
  id: string;
  amount: number;
  reason: string;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

// Simple QR Code component
function SimpleQRCode({ value, size = 200 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });
    }
  }, [value, size]);

  return <canvas ref={canvasRef} />;
}

export default function ParticipantDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState<ParticipantData | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [ticketNumber, setTicketNumber] = useState('');
  const [email, setEmail] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ticket');

  // Check if coming from URL params
  useEffect(() => {
    const ticket = searchParams.get('ticket');
    const emailParam = searchParams.get('email');
    
    if (ticket && emailParam) {
      setTicketNumber(ticket);
      setEmail(emailParam);
      handleVerify(ticket, emailParam);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const handleVerify = async (ticket?: string, emailAddr?: string) => {
    const ticketToUse = ticket || ticketNumber;
    const emailToUse = emailAddr || email;

    if (!ticketToUse.trim() || !emailToUse.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Masukkan nomor tiket dan email'
      });
      return;
    }

    setVerifying(true);
    try {
      // Find participant by ticket number and email
      const { data: participantData, error } = await supabase
        .from('participants')
        .select(`
          id, name, email, phone, ticket_number, status, payment_status, checked_in_at, tier_id,
          event:events (
            id, name, event_date, event_time, location, ticket_price, is_paid_event
          ),
          tier:ticket_tiers (
            id, name, price
          )
        `)
        .eq('ticket_number', ticketToUse.toUpperCase())
        .eq('email', emailToUse.toLowerCase())
        .single();

      if (error || !participantData) {
        toast({
          variant: 'destructive',
          title: 'Tidak Ditemukan',
          description: 'Tiket dengan nomor dan email tersebut tidak ditemukan'
        });
        setLoading(false);
        return;
      }

      // Get payment info if paid event
      let paymentInfo = null;
      let payments: PaymentHistory[] = [];
      if (participantData.event?.is_paid_event) {
        // Get latest payment
        const { data: payment } = await supabase
          .from('participant_payments')
          .select(`
            id, amount, payment_status, snap_token, paid_at, created_at, payment_method,
            proof_url, proof_uploaded_at, rejected_at, rejection_reason,
            tier:ticket_tiers (name)
          `)
          .eq('participant_id', participantData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        paymentInfo = payment;

        // Get all payment history
        const { data: paymentHistoryData } = await supabase
          .from('participant_payments')
          .select(`
            id, amount, payment_status, payment_method, created_at, paid_at,
            proof_url, proof_uploaded_at, rejected_at, rejection_reason,
            tier:ticket_tiers (name)
          `)
          .eq('participant_id', participantData.id)
          .order('created_at', { ascending: false });
        
        payments = paymentHistoryData || [];
      }

      // Get refund requests
      const { data: refunds } = await supabase
        .from('refund_requests')
        .select('id, amount, reason, status, requested_at, reviewed_at, rejection_reason')
        .eq('participant_id', participantData.id)
        .order('requested_at', { ascending: false });

      setParticipant({
        ...participantData,
        event: participantData.event as any,
        tier: participantData.tier as any,
        payment: paymentInfo || undefined
      });
      setPaymentHistory(payments);
      setRefundRequests(refunds || []);
      setVerified(true);
    } catch (error) {
      console.error('Error verifying participant:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memverifikasi tiket'
      });
    } finally {
      setVerifying(false);
      setLoading(false);
    }
  };

  const handlePayNow = () => {
    if (!participant?.payment?.snap_token) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Token pembayaran tidak tersedia'
      });
      return;
    }

    // Open Midtrans Snap popup
    (window as any).snap?.pay(participant.payment.snap_token, {
      onSuccess: () => {
        toast({
          title: 'Pembayaran Berhasil',
          description: 'Tiket Anda sudah aktif!'
        });
        handleVerify();
      },
      onPending: () => {
        toast({
          title: 'Menunggu Pembayaran',
          description: 'Silakan selesaikan pembayaran Anda'
        });
      },
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Pembayaran Gagal',
          description: 'Silakan coba lagi'
        });
      },
      onClose: () => {
        handleVerify();
      }
    });
  };

  const handleLogout = () => {
    setParticipant(null);
    setVerified(false);
    setTicketNumber('');
    setEmail('');
    setPaymentHistory([]);
    setRefundRequests([]);
    router.push('/participant-dashboard');
  };

  const getPaymentStatusBadge = (status: string, hasProof?: boolean, isRejected?: boolean) => {
    if (isRejected) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Ditolak</Badge>;
    }
    if (status === 'pending' && hasProof) {
      return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" /> Menunggu Verifikasi</Badge>;
    }
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Lunas</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-500 text-white"><Clock className="h-3 w-3 mr-1" /> Menunggu</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Gagal</Badge>;
      case 'expired':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Kadaluarsa</Badge>;
      case 'refunded':
        return <Badge variant="outline"><RotateCcw className="h-3 w-3 mr-1" /> Refunded</Badge>;
      case 'not_required':
        return <Badge variant="secondary"><CheckCircle2 className="h-3 w-3 mr-1" /> Gratis</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRefundStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-500 text-white"><Clock className="h-3 w-3 mr-1" /> Menunggu</Badge>;
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Disetujui</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Ditolak</Badge>;
      case 'processed':
        return <Badge className="bg-blue-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Diproses</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleDownloadPDF = async () => {
    if (!participant) return;

    try {
      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(participant.ticket_number, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;

      // Background gradient simulation with rectangles
      pdf.setFillColor(99, 102, 241);
      pdf.rect(0, 0, pageWidth, 40, 'F');

      // Title
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('E-TICKET', pageWidth / 2, 20, { align: 'center' });
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(participant.event.name, pageWidth / 2, 30, { align: 'center' });

      // Reset text color
      pdf.setTextColor(0, 0, 0);

      // QR Code
      const qrSize = 50;
      const qrX = (pageWidth - qrSize) / 2;
      pdf.addImage(qrDataUrl, 'PNG', qrX, 50, qrSize, qrSize);

      // Ticket Number
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(participant.ticket_number, pageWidth / 2, 110, { align: 'center' });

      // Divider line
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(margin, 120, pageWidth - margin, 120);

      // Event Details Section
      let yPos = 130;
      const labelX = margin;
      const valueX = margin + 35;

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('PESERTA', labelX, yPos);
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(participant.name, valueX, yPos);

      yPos += 12;
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('TANGGAL', labelX, yPos);
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(format(new Date(participant.event.event_date), 'dd MMMM yyyy', { locale: localeId }), valueX, yPos);

      if (participant.event.event_time) {
        yPos += 12;
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont('helvetica', 'normal');
        pdf.text('WAKTU', labelX, yPos);
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(participant.event.event_time, valueX, yPos);
      }

      if (participant.event.location) {
        yPos += 12;
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont('helvetica', 'normal');
        pdf.text('LOKASI', labelX, yPos);
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        const locationLines = pdf.splitTextToSize(participant.event.location, pageWidth - valueX - margin);
        pdf.text(locationLines, valueX, yPos);
        yPos += (locationLines.length - 1) * 5;
      }

      if (participant.tier) {
        yPos += 12;
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont('helvetica', 'normal');
        pdf.text('TIER', labelX, yPos);
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(participant.tier.name, valueX, yPos);
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Tunjukkan tiket ini saat check-in di lokasi event', pageWidth / 2, pageHeight - 15, { align: 'center' });
      pdf.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Download PDF
      pdf.save(`ticket-${participant.ticket_number}.pdf`);

      toast({
        title: 'PDF Berhasil Diunduh',
        description: 'Tiket PDF Anda telah berhasil diunduh'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal Mengunduh',
        description: 'Terjadi kesalahan saat mengunduh PDF'
      });
    }
  };

  const canRequestRefund = () => {
    if (!participant?.payment) return false;
    if (participant.payment.payment_status !== 'paid') return false;
    // Check if there's already a pending refund request
    const hasPendingRefund = refundRequests.some(r => r.status === 'pending');
    return !hasPendingRefund;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Login form
  if (!verified || !participant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Dashboard Peserta</CardTitle>
            <CardDescription>
              Masukkan nomor tiket dan email untuk melihat status tiket, history pembayaran, dan mengajukan refund
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ticket">Nomor Tiket</Label>
              <Input
                id="ticket"
                placeholder="TKT-XXXXXX"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleVerify()}
              disabled={verifying}
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                'Masuk Dashboard'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaid = participant.event.is_paid_event;
  const paymentComplete = !isPaid || participant.payment?.payment_status === 'paid';
  const isCheckedIn = participant.status === 'checked_in';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Ticket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">Dashboard Peserta</h1>
              <p className="text-xs text-muted-foreground">{participant.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Keluar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isPaid ? 'grid-cols-4' : 'grid-cols-2'}`}>
            <TabsTrigger value="ticket" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              <span className="hidden sm:inline">Tiket</span>
            </TabsTrigger>
            {isPaid && (
              <TabsTrigger value="upload" className="flex items-center gap-2 relative">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Pembayaran</span>
                {participant.payment?.payment_status === 'pending' && !participant.payment?.proof_url && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-amber-500 rounded-full" />
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Riwayat</span>
            </TabsTrigger>
            <TabsTrigger value="refunds" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Refund</span>
            </TabsTrigger>
          </TabsList>

          {/* Ticket Tab */}
          <TabsContent value="ticket" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Event Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{participant.event.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(participant.event.event_date), 'EEEE, dd MMMM yyyy', { locale: localeId })}
                    </span>
                  </div>
                  {participant.event.event_time && (
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{participant.event.event_time}</span>
                    </div>
                  )}
                  {participant.event.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{participant.event.location}</span>
                    </div>
                  )}
                  {participant.tier && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tier Tiket</span>
                        <Badge variant="secondary">{participant.tier.name}</Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Participant Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informasi Peserta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{participant.name}</span>
                  </div>
                  {participant.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{participant.email}</span>
                    </div>
                  )}
                  {participant.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{participant.phone}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status Check-in</span>
                    {isCheckedIn ? (
                      <Badge className="bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Sudah Check-in
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Belum Check-in</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Status (for paid events) */}
              {isPaid && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CreditCard className="h-5 w-5" />
                      Status Pembayaran
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          {getPaymentStatusBadge(participant.payment?.payment_status || 'pending')}
                        </div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(participant.payment?.amount || participant.event.ticket_price)}
                        </div>
                        {participant.payment?.paid_at && (
                          <p className="text-xs text-muted-foreground">
                            Dibayar pada: {format(new Date(participant.payment.paid_at), 'dd MMM yyyy HH:mm', { locale: localeId })}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {participant.payment?.payment_status === 'pending' && participant.payment?.snap_token && (
                          <Button onClick={handlePayNow} size="lg">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Bayar Sekarang
                          </Button>
                        )}
                        {canRequestRefund() && (
                          <Button variant="outline" onClick={() => setRefundDialogOpen(true)}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Ajukan Refund
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* QR Ticket (only show if payment complete or free event) */}
              {paymentComplete && (
                <Card className="md:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <QrCode className="h-5 w-5" />
                        Tiket QR Anda
                      </CardTitle>
                      <CardDescription>
                        Tunjukkan QR code ini saat check-in di lokasi event
                      </CardDescription>
                    </div>
                    <Button onClick={() => handleDownloadPDF()} variant="outline" size="sm">
                      <FileDown className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className="bg-white p-4 rounded-lg shadow-inner">
                      <SimpleQRCode value={participant.ticket_number} size={200} />
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-2xl font-mono font-bold">{participant.ticket_number}</p>
                      <p className="text-sm text-muted-foreground mt-1">{participant.name}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pending Payment Notice */}
              {isPaid && participant.payment?.payment_status === 'pending' && (
                <Card className="md:col-span-2 border-amber-500/50 bg-amber-500/5">
                  <CardContent className="py-6">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
                      <div>
                        <h3 className="font-semibold text-amber-600">Menunggu Pembayaran</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Tiket QR akan tersedia setelah pembayaran selesai. Silakan klik tombol "Bayar Sekarang" untuk menyelesaikan pembayaran.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Upload Bukti Pembayaran Tab */}
          {isPaid && (
            <TabsContent value="upload" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Bukti Pembayaran
                  </CardTitle>
                  <CardDescription>
                    {participant.payment?.proof_url 
                      ? 'Bukti pembayaran Anda sedang menunggu verifikasi'
                      : 'Upload bukti transfer untuk verifikasi pembayaran'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Payment Info */}
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Jumlah</span>
                        <p className="font-bold text-lg">{formatCurrency(participant.payment?.amount || participant.event.ticket_price)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status</span>
                        <div className="mt-1">
                          {getPaymentStatusBadge(
                            participant.payment?.payment_status || 'pending',
                            !!participant.payment?.proof_url,
                            !!participant.payment?.rejected_at
                          )}
                        </div>
                      </div>
                      {participant.tier && (
                        <div>
                          <span className="text-muted-foreground">Tier</span>
                          <p className="font-medium">{participant.tier.name}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Component */}
                  {participant.payment && participant.payment.payment_status !== 'paid' && (
                    <PaymentProofUpload
                      paymentId={participant.payment.id}
                      ticketNumber={participant.ticket_number}
                      email={participant.email || ''}
                      existingProofUrl={participant.payment.proof_url}
                      isRejected={!!participant.payment.rejected_at}
                      rejectionReason={participant.payment.rejection_reason}
                      onUploadSuccess={() => handleVerify()}
                    />
                  )}

                  {/* Success Message */}
                  {participant.payment?.payment_status === 'paid' && (
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium text-green-600">Pembayaran Terverifikasi</p>
                          <p className="text-sm text-muted-foreground">
                            Dibayar pada: {participant.payment.paid_at && format(new Date(participant.payment.paid_at), 'dd MMM yyyy HH:mm', { locale: localeId })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Waiting for Upload */}
                  {participant.payment?.payment_status === 'pending' && !participant.payment?.proof_url && !participant.payment?.snap_token && (
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-600">Menunggu Bukti Transfer</p>
                          <p className="text-sm text-muted-foreground">
                            Silakan upload bukti transfer Anda setelah melakukan pembayaran
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Waiting for Verification */}
                  {participant.payment?.payment_status === 'pending' && participant.payment?.proof_url && !participant.payment?.rejected_at && (
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-600">Menunggu Verifikasi</p>
                          <p className="text-sm text-muted-foreground">
                            Bukti transfer Anda sedang diverifikasi oleh penyelenggara event
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Riwayat Pembayaran
                </CardTitle>
                <CardDescription>
                  Daftar semua transaksi pembayaran tiket Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada riwayat pembayaran</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>Jumlah</TableHead>
                          <TableHead>Metode</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentHistory.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              <div className="text-sm">
                                {format(new Date(payment.created_at), 'dd MMM yyyy', { locale: localeId })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(payment.created_at), 'HH:mm')}
                              </div>
                            </TableCell>
                            <TableCell>
                              {payment.tier?.name || '-'}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell>
                              {payment.payment_method || '-'}
                            </TableCell>
                            <TableCell>
                              {getPaymentStatusBadge(
                                payment.payment_status,
                                !!payment.proof_url,
                                !!payment.rejected_at
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Refunds Tab */}
          <TabsContent value="refunds" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5" />
                    Permintaan Refund
                  </CardTitle>
                  <CardDescription>
                    Daftar permintaan refund Anda
                  </CardDescription>
                </div>
                {canRequestRefund() && (
                  <Button onClick={() => setRefundDialogOpen(true)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Ajukan Refund
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {refundRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada permintaan refund</p>
                    {canRequestRefund() && (
                      <Button variant="link" className="mt-2" onClick={() => setRefundDialogOpen(true)}>
                        Ajukan Refund Sekarang
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {refundRequests.map((refund) => (
                      <Card key={refund.id} className="border">
                        <CardContent className="py-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{formatCurrency(refund.amount)}</span>
                                {getRefundStatusBadge(refund.status)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Diajukan: {format(new Date(refund.requested_at), 'dd MMM yyyy HH:mm', { locale: localeId })}
                              </p>
                              <p className="text-sm">
                                <span className="text-muted-foreground">Alasan:</span> {refund.reason}
                              </p>
                              {refund.rejection_reason && (
                                <p className="text-sm text-destructive">
                                  <span className="font-medium">Alasan Ditolak:</span> {refund.rejection_reason}
                                </p>
                              )}
                              {refund.reviewed_at && (
                                <p className="text-xs text-muted-foreground">
                                  Diproses: {format(new Date(refund.reviewed_at), 'dd MMM yyyy HH:mm', { locale: localeId })}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Refund Request Dialog */}
      {participant.payment && (
        <RefundRequestDialog
          open={refundDialogOpen}
          onOpenChange={setRefundDialogOpen}
          paymentId={participant.payment.id}
          participantId={participant.id}
          eventId={participant.event.id}
          amount={participant.payment.amount}
          onSuccess={() => handleVerify()}
        />
      )}
    </div>
  );
}
