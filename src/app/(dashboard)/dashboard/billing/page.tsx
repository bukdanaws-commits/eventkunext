'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
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
import { Loader2, Receipt, CreditCard, Calendar, ExternalLink, Download, FileSpreadsheet, Filter, X, Upload, Image as ImageIcon, FileText, Eye, Building2, CheckCircle } from 'lucide-react';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

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

export default function PaymentHistoryPage() {
  const { user, loading: authLoading } = useAuth();
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

  // Mock organization for demo
  const organization = { id: 'demo-org', name: 'Demo Organization' };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchPayments() {
      // In a real app, this would fetch from an API
      setLoading(false);
      setPayments([]);
    }

    if (!authLoading && user) {
      fetchPayments();
    }
  }, [user, authLoading]);

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
      // In a real app, this would upload to storage
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

  if (authLoading) {
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
    toast({
      title: 'Export Berhasil',
      description: 'File Excel berhasil diunduh',
    });
  };

  const exportToPDF = () => {
    toast({
      title: 'Export Berhasil',
      description: 'File PDF berhasil diunduh',
    });
  };

  const downloadInvoice = (payment: Payment) => {
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
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar placeholder */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-card">
          <div className="h-16 flex items-center px-4 border-b">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <Calendar className="h-6 w-6 text-primary" />
              <span>Prize Party</span>
            </Link>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/dashboard/billing" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground">
              Billing
            </Link>
            <Link href="/dashboard/referral" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              Referral
            </Link>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-background/95 backdrop-blur flex items-center px-4 md:px-6">
            <h1 className="font-semibold">Riwayat Pembayaran</h1>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
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
                              </TableCell>
                              <TableCell className="capitalize">
                                {payment.payment_method?.replace(/_/g, ' ') || '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {payment.payment_status === 'pending' && payment.payment_method === 'manual_transfer' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openUploadDialog(payment)}
                                      title={payment.proof_url ? 'Ganti bukti transfer' : 'Upload bukti transfer'}
                                    >
                                      {payment.proof_url ? (
                                        <ImageIcon className="h-4 w-4" />
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
                                      <Link href={`/dashboard/events/${payment.event_id}`}>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          title="Lihat Event"
                                        >
                                          <ExternalLink className="h-4 w-4" />
                                        </Button>
                                      </Link>
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
          </main>
        </div>
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
    </div>
  );
}
