'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Ticket, Calendar, MapPin, Clock, Download, ArrowLeft, Mail, Phone, CreditCard, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import QRCode from "qrcode";
import { useEffect, useRef } from "react";
import { PaymentProofUpload } from "@/components/payment/PaymentProofUpload";

interface PaymentInfo {
  id: string;
  amount: number;
  payment_status: string;
  proof_url: string | null;
  proof_uploaded_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  paid_at: string | null;
}

interface TicketInfo {
  id: string;
  ticket_number: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  checked_in_at: string | null;
  payment_status: string | null;
  event: {
    id: string;
    name: string;
    event_date: string;
    event_time: string | null;
    location: string | null;
    is_paid_event: boolean | null;
  };
  payment?: PaymentInfo | null;
}

const TicketStatus = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [searchType, setSearchType] = useState<"email" | "phone">("email");
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<TicketInfo[]>([]);
  const [searched, setSearched] = useState(false);
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchValue.trim()) {
      toast({
        title: "Error",
        description: searchType === "email" ? "Masukkan alamat email" : "Masukkan nomor telepon",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const query = supabase
        .from("participants")
        .select(`
          id,
          ticket_number,
          name,
          email,
          phone,
          status,
          checked_in_at,
          payment_status,
          event:events!inner(
            id,
            name,
            event_date,
            event_time,
            location,
            is_paid_event
          )
        `)
        .eq(searchType, searchValue.trim());

      const { data, error } = await query;

      if (error) throw error;

      // Fetch payment info for each ticket
      const ticketsWithPayment = await Promise.all(
        (data || []).map(async (ticket: any) => {
          if (ticket.event?.is_paid_event) {
            const { data: paymentData } = await supabase
              .from("participant_payments")
              .select("id, amount, payment_status, proof_url, proof_uploaded_at, rejected_at, rejection_reason, paid_at")
              .eq("participant_id", ticket.id)
              .maybeSingle();
            
            return { ...ticket, payment: paymentData };
          }
          return { ...ticket, payment: null };
        })
      );

      setTickets(ticketsWithPayment as TicketInfo[]);
    } catch (error) {
      console.error("Error searching tickets:", error);
      toast({
        title: "Error",
        description: "Gagal mencari tiket. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, checkedInAt: string | null) => {
    switch (status) {
      case "checked_in":
        return <Badge className="bg-green-500">Sudah Check-in</Badge>;
      case "won":
        return <Badge className="bg-yellow-500">Pemenang</Badge>;
      default:
        return <Badge variant="secondary">Terdaftar</Badge>;
    }
  };

  const getPaymentStatusBadge = (payment: PaymentInfo | null | undefined) => {
    if (!payment) return null;
    
    if (payment.payment_status === 'paid') {
      return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Lunas</Badge>;
    }
    if (payment.rejected_at) {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Ditolak</Badge>;
    }
    if (payment.proof_url) {
      return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" /> Menunggu Verifikasi</Badge>;
    }
    return <Badge variant="outline" className="text-amber-600 border-amber-600"><AlertCircle className="h-3 w-3 mr-1" /> Belum Bayar</Badge>;
  };

  const handleRefreshTickets = () => {
    if (searchValue) {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSearch(fakeEvent);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Ticket className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Cek Status Tiket</CardTitle>
            <CardDescription>
              Masukkan email atau nomor telepon yang digunakan saat pendaftaran
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <Tabs value={searchType} onValueChange={(v) => setSearchType(v as "email" | "phone")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telepon
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="email" className="mt-4">
                  <Input
                    type="email"
                    placeholder="contoh@email.com"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </TabsContent>
                <TabsContent value="phone" className="mt-4">
                  <Input
                    type="tel"
                    placeholder="08123456789"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </TabsContent>
              </Tabs>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  "Mencari..."
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Cari Tiket
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {searched && (
          <div className="mt-6 space-y-4">
            {tickets.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Tidak ditemukan tiket dengan {searchType === "email" ? "email" : "nomor telepon"} tersebut.</p>
                  <p className="text-sm mt-2">Pastikan Anda memasukkan data yang benar.</p>
                </CardContent>
              </Card>
            ) : (
              tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  canvasRef={(el) => {
                    canvasRefs.current[ticket.id] = el;
                  }}
                  getStatusBadge={getStatusBadge}
                  getPaymentStatusBadge={getPaymentStatusBadge}
                  onRefresh={handleRefreshTickets}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface TicketCardProps {
  ticket: TicketInfo;
  canvasRef: (el: HTMLCanvasElement | null) => void;
  getStatusBadge: (status: string, checkedInAt: string | null) => JSX.Element;
  getPaymentStatusBadge: (payment: PaymentInfo | null | undefined) => JSX.Element | null;
  onRefresh: () => void;
}

const TicketCard = ({ ticket, canvasRef, getStatusBadge, getPaymentStatusBadge, onRefresh }: TicketCardProps) => {
  const router = useRouter();
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const internalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (internalCanvasRef.current) {
      const qrData = JSON.stringify({
        type: "checkin",
        ticketNumber: ticket.ticket_number,
        participantId: ticket.id,
        eventId: ticket.event.id,
      });

      QRCode.toCanvas(internalCanvasRef.current, qrData, {
        width: 180,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
    }
  }, [ticket]);

  const handleDownloadQR = () => {
    if (!internalCanvasRef.current) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 500;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const qrX = (canvas.width - 180) / 2;
    ctx.drawImage(internalCanvasRef.current, qrX, 30, 180, 180);

    ctx.fillStyle = "#000000";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(ticket.name, canvas.width / 2, 240);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#666666";
    ctx.fillText(`Tiket: ${ticket.ticket_number}`, canvas.width / 2, 270);

    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "#000000";
    ctx.fillText(ticket.event.name, canvas.width / 2, 310);

    ctx.font = "12px Arial";
    ctx.fillStyle = "#666666";
    const eventDate = format(new Date(ticket.event.event_date), "dd MMMM yyyy", { locale: id });
    ctx.fillText(eventDate, canvas.width / 2, 335);

    if (ticket.event.location) {
      ctx.fillText(ticket.event.location, canvas.width / 2, 355);
    }

    const link = document.createElement("a");
    link.download = `tiket-${ticket.ticket_number}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const goToParticipantDashboard = () => {
    router.push(`/participant-dashboard?ticket=${ticket.ticket_number}&email=${encodeURIComponent(ticket.email || '')}`);
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center">
            <canvas
              ref={(el) => {
                internalCanvasRef.current = el;
                canvasRef(el);
              }}
              className="rounded-lg border"
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleDownloadQR}
            >
              <Download className="h-4 w-4 mr-2" />
              Download QR
            </Button>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-semibold text-lg">{ticket.name}</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  {ticket.ticket_number}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {getStatusBadge(ticket.status, ticket.checked_in_at)}
                {ticket.event?.is_paid_event && getPaymentStatusBadge(ticket.payment)}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-primary">{ticket.event.name}</h4>
              
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                {format(new Date(ticket.event.event_date), "EEEE, dd MMMM yyyy", { locale: id })}
              </div>

              {ticket.event.event_time && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  {ticket.event.event_time}
                </div>
              )}

              {ticket.event.location && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  {ticket.event.location}
                </div>
              )}
            </div>

            {ticket.checked_in_at && (
              <p className="text-sm text-green-600">
                Check-in pada: {format(new Date(ticket.checked_in_at), "dd MMM yyyy, HH:mm", { locale: id })}
              </p>
            )}

            {/* Link to Participant Dashboard */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToParticipantDashboard}
              className="w-full md:w-auto"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Buka Dashboard Peserta
            </Button>
          </div>
        </div>

        {/* Payment Section for Paid Events */}
        {ticket.event?.is_paid_event && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="font-medium">Pembayaran</span>
              </div>
              {ticket.payment && (
                <span className="font-semibold">{formatCurrency(ticket.payment.amount)}</span>
              )}
            </div>

            {/* No Payment Record Yet - Show instructions */}
            {!ticket.payment && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium text-amber-600">Menunggu Pembayaran</p>
                    <p className="text-sm text-muted-foreground">
                      Data pembayaran Anda belum tersedia. Silakan hubungi penyelenggara event untuk informasi pembayaran atau gunakan Dashboard Peserta untuk detail lebih lanjut.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToParticipantDashboard}
                      className="mt-2"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Buka Dashboard Peserta
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Status Info */}
            {ticket.payment?.payment_status === 'paid' && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-green-600">Pembayaran Lunas</p>
                    {ticket.payment.paid_at && (
                      <p className="text-sm text-muted-foreground">
                        Dibayar pada: {format(new Date(ticket.payment.paid_at), "dd MMM yyyy, HH:mm", { locale: id })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Waiting for Verification */}
            {ticket.payment?.payment_status === 'pending' && ticket.payment.proof_url && !ticket.payment.rejected_at && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-blue-600">Menunggu Verifikasi</p>
                    <p className="text-sm text-muted-foreground">
                      Bukti transfer Anda sedang diverifikasi oleh penyelenggara
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Payment - Need to Upload Proof */}
            {ticket.payment && ticket.payment.payment_status !== 'paid' && !ticket.payment.proof_url && !ticket.payment.rejected_at && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-amber-600">Belum Bayar</p>
                    <p className="text-sm text-muted-foreground">
                      Silakan transfer ke rekening penyelenggara dan upload bukti transfer di bawah ini
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Payment Proof Section */}
            {ticket.payment && ticket.payment.payment_status !== 'paid' && (
              <>
                <Button
                  variant={showPaymentSection ? "secondary" : "default"}
                  size="sm"
                  onClick={() => setShowPaymentSection(!showPaymentSection)}
                  className="w-full"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {showPaymentSection ? 'Sembunyikan' : (ticket.payment.proof_url && !ticket.payment.rejected_at ? 'Lihat Bukti Transfer' : 'Upload Bukti Transfer')}
                </Button>

                {showPaymentSection && (
                  <PaymentProofUpload
                    paymentId={ticket.payment.id}
                    ticketNumber={ticket.ticket_number}
                    email={ticket.email || ''}
                    existingProofUrl={ticket.payment.proof_url}
                    isRejected={!!ticket.payment.rejected_at}
                    rejectionReason={ticket.payment.rejection_reason}
                    onUploadSuccess={onRefresh}
                  />
                )}
              </>
            )}

            {/* Dashboard Peserta Button - Always visible for paid events */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToParticipantDashboard}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Buka Dashboard Peserta
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TicketStatus;
