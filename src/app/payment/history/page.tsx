'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Receipt, CreditCard, Calendar, ExternalLink, Download, FileSpreadsheet, Filter, X, Upload, Image, FileText, Eye, Building2, CheckCircle } from 'lucide-react';
import { PaymentCountdownTimer } from '@/components/payment/PaymentCountdownTimer';
import { PendingPaymentsCard } from '@/components/payment/PendingPaymentsCard';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';

interface Payment {
  id: string;
  event_id: string;
  tier: string;
  amount: number;
  discount_amount: number;
  total_amount: number;
  form_addon_purchased: boolean;
  form_addon_amount: number;
  payment_status: string;
  payment_method: string | null;
  midtrans_order_id: string | null;
  created_at: string;
  paid_at: string | null;
  referral_code: string | null;
  expires_at: string | null;
  proof_url: string | null;
  event?: {
    name: string;
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getTierDisplayName(tier: string): string {
  const tierNames: Record<string, string> = {
    free: 'Free',
    basic: 'Basic',
    pro: 'Professional',
    enterprise: 'Enterprise',
  };
  return tierNames[tier] || tier;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Berhasil</Badge>;
    case 'pending':
      return <Badge variant="secondary">Menunggu</Badge>;
    case 'failed':
      return <Badge variant="destructive">Gagal</Badge>;
    case 'expired':
      return <Badge variant="outline">Kadaluarsa</Badge>;
    case 'refunded':
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Refund</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function PaymentHistory() {
  const { user, loading: authLoading } = useAuth();
  const { organization, loading: profileLoading } = useUserProfile();
  const router = useRouter();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  // Upload proof states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Invoice preview states
  const [invoicePreviewOpen, setInvoicePreviewOpen] = useState(false);
  const [previewPayment, setPreviewPayment] = useState<Payment | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchPayments() {
      if (!organization?.id) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('event_payments')
        .select(`
          *,
          event:events(name)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
      } else {
        setPayments(data || []);
      }
      setLoading(false);
    }

    if (!profileLoading && organization?.id) {
      fetchPayments();
    }
  }, [organization?.id, profileLoading]);

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    // Status filter
    if (statusFilter !== 'all' && payment.payment_status !== statusFilter) {
      return false;
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      const paymentDate = parseISO(payment.created_at);
      const fromDate = dateFrom ? startOfDay(parseISO(dateFrom)) : null;
      const toDate = dateTo ? endOfDay(parseISO(dateTo)) : null;
      
      if (fromDate && toDate) {
        if (!isWithinInterval(paymentDate, { start: fromDate, end: toDate })) {
          return false;
        }
      } else if (fromDate && paymentDate < fromDate) {
        return false;
      } else if (toDate && paymentDate > toDate) {
        return false;
      }
    }
    
    return true;
  });

  const clearFilters = () => {
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = statusFilter !== 'all' || dateFrom || dateTo;

  // Upload proof handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Format tidak valid',
          description: 'Hanya file gambar yang diperbolehkan',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File terlalu besar',
          description: 'Maksimal ukuran file adalah 5MB',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadProof = async () => {
    if (!selectedFile || !selectedPayment) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${selectedPayment.id}-${Date.now()}.${fileExt}`;
      const filePath = `proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('event_payments')
        .update({ proof_url: publicUrl })
        .eq('id', selectedPayment.id);

      if (updateError) throw updateError;

      // Update local state
      setPayments(prev => prev.map(p => 
        p.id === selectedPayment.id ? { ...p, proof_url: publicUrl } : p
      ));

      toast({
        title: 'Berhasil',
        description: 'Bukti transfer berhasil diunggah',
      });

      setUploadDialogOpen(false);
      setSelectedFile(null);
      setSelectedPayment(null);
    } catch (error: any) {
      console.error('Error uploading proof:', error);
      toast({
        title: 'Gagal mengunggah',
        description: error.message || 'Terjadi kesalahan saat mengunggah bukti',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const openUploadDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setSelectedFile(null);
    setUploadDialogOpen(true);
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalPaid = payments
    .filter(p => p.payment_status === 'paid')
    .reduce((sum, p) => sum + p.total_amount, 0);

  const totalSaved = payments
    .filter(p => p.payment_status === 'paid')
    .reduce((sum, p) => sum + p.discount_amount, 0);

  const exportToExcel = () => {
    const exportData = filteredPayments.map(p => ({
      'Tanggal': format(new Date(p.created_at), 'dd MMM yyyy HH:mm', { locale: id }),
      'Event': p.event?.name || 'N/A',
      'Paket': getTierDisplayName(p.tier),
      'Harga Dasar': p.amount,
      'Form Add-on': p.form_addon_amount,
      'Diskon': p.discount_amount,
      'Total': p.total_amount,
      'Status': p.payment_status,
      'Metode Bayar': p.payment_method || '-',
      'Order ID': p.midtrans_order_id || '-',
      'Kode Referral': p.referral_code || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');
    XLSX.writeFile(wb, `payment_history_${format(new Date(), 'yyyyMMdd')}.xlsx`);

    toast({
      title: 'Export Berhasil',
      description: 'File Excel berhasil diunduh',
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Riwayat Pembayaran', 14, 22);
    doc.setFontSize(10);
    doc.text(`Tanggal: ${format(new Date(), 'dd MMMM yyyy', { locale: id })}`, 14, 30);
    doc.text(`Organisasi: ${organization?.name || '-'}`, 14, 36);

    const tableData = filteredPayments.map(p => [
      format(new Date(p.created_at), 'dd/MM/yy', { locale: id }),
      p.event?.name?.substring(0, 20) || 'N/A',
      getTierDisplayName(p.tier),
      formatCurrency(p.total_amount),
      p.payment_status,
    ]);

    autoTable(doc, {
      head: [['Tanggal', 'Event', 'Paket', 'Total', 'Status']],
      body: tableData,
      startY: 44,
    });

    // Summary
    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 44;
    doc.setFontSize(12);
    doc.text(`Total Pembayaran: ${formatCurrency(totalPaid)}`, 14, finalY + 10);
    doc.text(`Total Hemat: ${formatCurrency(totalSaved)}`, 14, finalY + 18);

    doc.save(`payment_history_${format(new Date(), 'yyyyMMdd')}.pdf`);

    toast({
      title: 'Export Berhasil',
      description: 'File PDF berhasil diunduh',
    });
  };

  const downloadInvoice = (payment: Payment) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header with branding
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Company name as logo text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('DoorPrize', 14, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Platform Undian Event Terpercaya', 14, 33);
    
    // Invoice title on right
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - 14, 28, { align: 'right' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Invoice info box
    doc.setFillColor(249, 250, 251);
    doc.rect(14, 50, pageWidth - 28, 30, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('No. Invoice:', 20, 60);
    doc.text('Tanggal:', 20, 68);
    doc.text('Status:', 20, 76);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`INV-${payment.midtrans_order_id || payment.id.substring(0, 8).toUpperCase()}`, 55, 60);
    doc.text(format(new Date(payment.paid_at || payment.created_at), 'dd MMMM yyyy', { locale: id }), 55, 68);
    
    doc.setTextColor(34, 197, 94);
    doc.setFont('helvetica', 'bold');
    doc.text('LUNAS', 55, 76);
    doc.setTextColor(0, 0, 0);
    
    // Bill to section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Ditagihkan kepada:', 14, 95);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(organization?.name || '-', 14, 103);
    
    // Table
    const tableData = [
      [
        `Upgrade Event: ${payment.event?.name || 'N/A'}`,
        `Paket ${getTierDisplayName(payment.tier)}`,
        formatCurrency(payment.amount),
      ],
    ];
    
    if (payment.form_addon_purchased && payment.form_addon_amount > 0) {
      tableData.push([
        'Add-on Form Builder',
        'Fitur tambahan',
        formatCurrency(payment.form_addon_amount),
      ]);
    }
    
    autoTable(doc, {
      head: [['Deskripsi', 'Keterangan', 'Jumlah']],
      body: tableData,
      startY: 115,
      theme: 'striped',
      headStyles: { 
        fillColor: [59, 130, 246],
        fontSize: 10,
        fontStyle: 'bold',
      },
      styles: { fontSize: 10 },
      columnStyles: {
        2: { halign: 'right' },
      },
    });
    
    // Summary
    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 150;
    
    doc.setFontSize(10);
    const summaryX = pageWidth - 80;
    
    doc.text('Subtotal:', summaryX, finalY + 12);
    doc.text(formatCurrency(payment.amount + payment.form_addon_amount), pageWidth - 14, finalY + 12, { align: 'right' });
    
    if (payment.discount_amount > 0) {
      doc.text(`Diskon (${payment.referral_code || 'Referral'}):`, summaryX, finalY + 20);
      doc.setTextColor(34, 197, 94);
      doc.text(`-${formatCurrency(payment.discount_amount)}`, pageWidth - 14, finalY + 20, { align: 'right' });
      doc.setTextColor(0, 0, 0);
    }
    
    // Total box
    const totalBoxY = finalY + (payment.discount_amount > 0 ? 26 : 18);
    doc.setFillColor(59, 130, 246);
    doc.rect(summaryX - 6, totalBoxY, pageWidth - summaryX + 6 - 8, 14, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', summaryX, totalBoxY + 10);
    doc.text(formatCurrency(payment.total_amount), pageWidth - 14, totalBoxY + 10, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    
    // Payment details
    const detailsY = totalBoxY + 30;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Detail Pembayaran:', 14, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Metode: ${payment.payment_method?.replace(/_/g, ' ').toUpperCase() || '-'}`, 14, detailsY + 8);
    if (payment.paid_at) {
      doc.text(`Tanggal Bayar: ${format(new Date(payment.paid_at), 'dd MMMM yyyy HH:mm', { locale: id })}`, 14, detailsY + 16);
    }
    
    // Footer
    doc.setFillColor(249, 250, 251);
    doc.rect(0, 270, pageWidth, 27, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text('Invoice ini digenerate secara otomatis oleh sistem DoorPrize.', pageWidth / 2, 280, { align: 'center' });
    doc.text('Sah tanpa tanda tangan. Hubungi support@doorprize.id untuk pertanyaan.', pageWidth / 2, 287, { align: 'center' });
    
    doc.save(`invoice_${payment.midtrans_order_id || payment.id.substring(0, 8)}.pdf`);
    
    toast({
      title: 'Invoice Diunduh',
      description: 'File invoice berhasil diunduh',
    });
  };

  const openInvoicePreview = (payment: Payment) => {
    setPreviewPayment(payment);
    setInvoicePreviewOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Riwayat Pembayaran</h1>
            <p className="text-muted-foreground">
              Lihat semua transaksi pembayaran yang pernah dilakukan
            </p>
          </div>
          {payments.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={exportToPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Filter</CardTitle>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="paid">Berhasil</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="expired">Kadaluarsa</SelectItem>
                    <SelectItem value="failed">Gagal</SelectItem>
                    <SelectItem value="refunded">Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dari Tanggal</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sampai Tanggal</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Stats */}
        {/* Pending Manual Payments Alert */}
        <PendingPaymentsCard 
          payments={payments}
          onUploadProof={openUploadDialog}
        />
        <div className="grid gap-4 md:grid-cols-3">
          {/* Total Transaksi - Primary/Teal */}
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary-foreground/90">Total Transaksi</CardTitle>
              <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{filteredPayments.length}</div>
              <p className="text-sm text-primary-foreground/80 mt-1">
                {filteredPayments.filter(p => p.payment_status === 'paid').length} berhasil
              </p>
            </CardContent>
          </Card>

          {/* Total Pembayaran - Blue */}
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Total Pembayaran</CardTitle>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalPaid)}</div>
              <p className="text-sm text-blue-100 mt-1">
                Semua pembayaran sukses
              </p>
            </CardContent>
          </Card>

          {/* Total Hemat - Emerald/Green */}
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100">Total Hemat</CardTitle>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalSaved)}</div>
              <p className="text-sm text-emerald-100 mt-1">
                Dari kode referral
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Transaksi</CardTitle>
            <CardDescription>
              {hasActiveFilters 
                ? `Menampilkan ${filteredPayments.length} dari ${payments.length} transaksi`
                : 'Semua transaksi pembayaran untuk upgrade event'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  {hasActiveFilters ? 'Tidak Ada Hasil' : 'Belum Ada Transaksi'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilters 
                    ? 'Tidak ada transaksi yang sesuai dengan filter'
                    : 'Anda belum melakukan transaksi pembayaran apapun'
                  }
                </p>
                {hasActiveFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Reset Filter
                  </Button>
                ) : (
                  <Button onClick={() => router.push('/dashboard')}>
                    Kelola Event
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Paket</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {format(new Date(payment.created_at), 'dd MMM yyyy', { locale: id })}
                          <span className="block text-xs text-muted-foreground">
                            {format(new Date(payment.created_at), 'HH:mm', { locale: id })}
                          </span>
                        </TableCell>
                        <TableCell>
                          {payment.event?.name || 'N/A'}
                          {payment.form_addon_purchased && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              +Form
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getTierDisplayName(payment.tier)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {formatCurrency(payment.total_amount)}
                          </span>
                          {payment.discount_amount > 0 && (
                            <span className="block text-xs text-green-600">
                              Hemat {formatCurrency(payment.discount_amount)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(payment.payment_status)}
                          {payment.payment_status === 'pending' && payment.expires_at && (
                            <PaymentCountdownTimer 
                              expiresAt={payment.expires_at} 
                              variant="inline"
                              className="mt-1"
                            />
                          )}
                        </TableCell>
                        <TableCell className="capitalize">
                          {payment.payment_method?.replace(/_/g, ' ') || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Show upload button for pending manual payments */}
                            {payment.payment_status === 'pending' && payment.payment_method === 'manual_transfer' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openUploadDialog(payment)}
                                title={payment.proof_url ? 'Ganti bukti transfer' : 'Upload bukti transfer'}
                              >
                                {payment.proof_url ? (
                                  <Image className="h-4 w-4" />
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {payment.payment_status === 'paid' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openInvoicePreview(payment)}
                                  title="Preview Invoice"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/events/${payment.event_id}`)}
                                  title="Lihat Event"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Proof Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Bukti Transfer</DialogTitle>
            <DialogDescription>
              {selectedPayment?.proof_url 
                ? 'Ganti bukti transfer yang sudah diunggah'
                : 'Unggah bukti transfer untuk pembayaran manual'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedPayment?.proof_url && (
              <div className="space-y-2">
                <Label>Bukti Saat Ini</Label>
                <img 
                  src={selectedPayment.proof_url} 
                  alt="Bukti transfer" 
                  className="w-full max-h-48 object-contain rounded-md border"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Bukti Transfer Baru</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
              />
              <p className="text-xs text-muted-foreground">
                Format: JPG, PNG, GIF. Maksimal 5MB
              </p>
            </div>

            {selectedFile && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <img 
                  src={URL.createObjectURL(selectedFile)} 
                  alt="Preview" 
                  className="w-full max-h-48 object-contain rounded-md border"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Batal
              </Button>
              <Button 
                onClick={handleUploadProof} 
                disabled={!selectedFile || uploading}
              >
                {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {uploading ? 'Mengunggah...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Preview Dialog */}
      <Dialog open={invoicePreviewOpen} onOpenChange={setInvoicePreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Preview Invoice
            </DialogTitle>
            <DialogDescription>
              Preview invoice sebelum mengunduh
            </DialogDescription>
          </DialogHeader>
          
          {previewPayment && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="bg-primary text-primary-foreground p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-6 w-6" />
                      <span className="text-xl font-bold">DoorPrize</span>
                    </div>
                    <p className="text-sm opacity-90 mt-1">Platform Undian Event Terpercaya</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold">INVOICE</h2>
                  </div>
                </div>
              </div>
              
              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">No. Invoice</p>
                  <p className="font-semibold">INV-{previewPayment.midtrans_order_id || previewPayment.id.substring(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-semibold">{format(new Date(previewPayment.paid_at || previewPayment.created_at), 'dd MMMM yyyy', { locale: id })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    LUNAS
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ditagihkan kepada</p>
                  <p className="font-semibold">{organization?.name || '-'}</p>
                </div>
              </div>
              
              {/* Items Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary">
                      <TableHead className="text-primary-foreground font-semibold">Deskripsi</TableHead>
                      <TableHead className="text-primary-foreground font-semibold">Keterangan</TableHead>
                      <TableHead className="text-primary-foreground font-semibold text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Upgrade Event: {previewPayment.event?.name || 'N/A'}</TableCell>
                      <TableCell>Paket {getTierDisplayName(previewPayment.tier)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(previewPayment.amount)}</TableCell>
                    </TableRow>
                    {previewPayment.form_addon_purchased && previewPayment.form_addon_amount > 0 && (
                      <TableRow>
                        <TableCell>Add-on Form Builder</TableCell>
                        <TableCell>Fitur tambahan</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(previewPayment.form_addon_amount)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Summary */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(previewPayment.amount + previewPayment.form_addon_amount)}</span>
                  </div>
                  {previewPayment.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Diskon ({previewPayment.referral_code || 'Referral'})</span>
                      <span>-{formatCurrency(previewPayment.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg bg-primary text-primary-foreground p-3 rounded-lg">
                    <span>TOTAL</span>
                    <span>{formatCurrency(previewPayment.total_amount)}</span>
                  </div>
                </div>
              </div>
              
              {/* Payment Details */}
              <div className="text-sm text-muted-foreground space-y-1 border-t pt-4">
                <p><strong>Metode Pembayaran:</strong> {previewPayment.payment_method?.replace(/_/g, ' ').toUpperCase() || '-'}</p>
                {previewPayment.paid_at && (
                  <p><strong>Tanggal Pembayaran:</strong> {format(new Date(previewPayment.paid_at), 'dd MMMM yyyy HH:mm', { locale: id })}</p>
                )}
              </div>
              
              {/* Footer */}
              <div className="text-center text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p>Invoice ini digenerate secara otomatis oleh sistem DoorPrize.</p>
                <p>Sah tanpa tanda tangan. Hubungi support@doorprize.id untuk pertanyaan.</p>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setInvoicePreviewOpen(false)}>
                  Tutup
                </Button>
                <Button onClick={() => {
                  downloadInvoice(previewPayment);
                  setInvoicePreviewOpen(false);
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
