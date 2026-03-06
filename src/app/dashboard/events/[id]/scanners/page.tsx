'use client';

import { useState, useEffect } from 'react';
import { EventLayout, EventContextValue } from '@/components/layout/EventLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, Plus, Trash2, UserCheck, Users, Download, FileText, RefreshCw, 
  FileDown, Upload, Search, Activity, Clock, CheckCircle2, XCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ImportScannersDialog } from '@/components/scanners/ImportScannersDialog';
import { ScannerActivityLog } from '@/components/scanners/ScannerActivityLog';

interface Scanner {
  id: string;
  email: string;
  full_name: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
}

interface ScannerCredential {
  fullName: string;
  email: string;
  password: string;
}

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

function EventScannersContent({ event }: EventContextValue) {
  const { user } = useAuth();
  const [scanners, setScanners] = useState<Scanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('scanners');

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalCheckins: 0
  });

  useEffect(() => {
    fetchScanners();
  }, [event.id]);

  const fetchScanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_scanners')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const scannerList = data || [];
      setScanners(scannerList);
      
      // Calculate stats
      const activeCount = scannerList.filter(s => s.is_active).length;
      setStats({
        total: scannerList.length,
        active: activeCount,
        inactive: scannerList.length - activeCount,
        totalCheckins: 0 // Will be updated from activity log
      });
    } catch (error: any) {
      console.error('Error fetching scanners:', error);
      toast.error('Gagal memuat data scanner');
    } finally {
      setLoading(false);
    }
  };

  const handleAddScanner = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !fullName || !password) {
      toast.error('Semua field wajib diisi');
      return;
    }

    if (password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    setSaving(true);
    try {
      const { data: createData, error: createError } = await supabase.functions.invoke('create-user', {
        body: { 
          email, 
          password, 
          full_name: fullName,
          user_metadata: { is_scanner: true }
        }
      });

      if (createError) throw createError;
      if (createData?.error) throw new Error(createData.error);

      const userId = createData.user?.id;
      if (!userId) throw new Error('Failed to create user');

      const { error: scannerError } = await supabase
        .from('event_scanners')
        .insert({
          event_id: event.id,
          user_id: userId,
          email,
          full_name: fullName,
          created_by: user?.id || '',
          is_active: true
        });

      if (scannerError) throw scannerError;

      toast.success('Scanner berhasil ditambahkan');
      
      // Generate PDF
      await generateScannerPDF({ fullName, email, password });
      
      setShowAddForm(false);
      setEmail('');
      setFullName('');
      setPassword('');
      fetchScanners();
    } catch (error: any) {
      console.error('Error adding scanner:', error);
      toast.error(error.message || 'Gagal menambahkan scanner');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (scanner: Scanner) => {
    try {
      const { error } = await supabase
        .from('event_scanners')
        .update({ is_active: !scanner.is_active })
        .eq('id', scanner.id);

      if (error) throw error;

      setScanners(prev => prev.map(s => 
        s.id === scanner.id ? { ...s, is_active: !s.is_active } : s
      ));
      toast.success(scanner.is_active ? 'Scanner dinonaktifkan' : 'Scanner diaktifkan');
    } catch (error: any) {
      console.error('Error toggling scanner:', error);
      toast.error('Gagal mengubah status scanner');
    }
  };

  const handleDeleteScanner = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase
        .from('event_scanners')
        .delete()
        .eq('id', deletingId);

      if (error) throw error;

      setScanners(prev => prev.filter(s => s.id !== deletingId));
      toast.success('Scanner berhasil dihapus');
    } catch (error: any) {
      console.error('Error deleting scanner:', error);
      toast.error('Gagal menghapus scanner');
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetPasswordAndDownload = async (scanner: Scanner) => {
    setResettingId(scanner.id);
    try {
      const newPassword = generatePassword();
      
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { 
          user_id: scanner.user_id,
          new_password: newPassword
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await generateScannerPDF({
        fullName: scanner.full_name,
        email: scanner.email,
        password: newPassword
      });
      toast.success('Password direset dan kartu PDF diunduh');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Gagal reset password');
    } finally {
      setResettingId(null);
    }
  };

  const generateScannerPDF = async (credential: ScannerCredential) => {
    try {
      const loginUrl = `${window.location.origin}/scanner-login`;
      const qrDataUrl = await QRCode.toDataURL(loginUrl, { width: 200, margin: 1 });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [100, 140]
      });
      
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, 100, 140, 'F');
      
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(1);
      pdf.rect(3, 3, 94, 134, 'S');
      
      pdf.setFillColor(59, 130, 246);
      pdf.rect(3, 3, 94, 18, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('KARTU AKSES SCANNER', 50, 12, { align: 'center' });
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      const eventText = event.name || 'Event';
      pdf.text(eventText.length > 30 ? eventText.substring(0, 30) + '...' : eventText, 50, 17, { align: 'center' });
      
      pdf.addImage(qrDataUrl, 'PNG', 25, 25, 50, 50);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SCAN QR UNTUK LOGIN', 50, 82, { align: 'center' });
      
      pdf.setDrawColor(200, 200, 200);
      pdf.line(10, 87, 90, 87);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Nama:', 10, 95);
      pdf.setFont('helvetica', 'normal');
      pdf.text(credential.fullName.length > 25 ? credential.fullName.substring(0, 25) + '...' : credential.fullName, 10, 100);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Email:', 10, 108);
      pdf.setFont('helvetica', 'normal');
      pdf.text(credential.email.length > 25 ? credential.email.substring(0, 25) + '...' : credential.email, 10, 113);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Password:', 10, 121);
      pdf.setFont('helvetica', 'normal');
      pdf.text(credential.password, 10, 126);
      
      pdf.setFontSize(6);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Simpan kartu ini dengan aman', 50, 134, { align: 'center' });
      
      const fileName = `scanner-${credential.fullName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Gagal membuat PDF');
    }
  };

  const handleBulkDownload = async () => {
    if (scanners.length === 0) {
      toast.error('Tidak ada scanner untuk diunduh');
      return;
    }

    setBulkDownloading(true);
    try {
      const loginUrl = `${window.location.origin}/scanner-login`;
      const qrDataUrl = await QRCode.toDataURL(loginUrl, { width: 200, margin: 1 });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const cardWidth = 90;
      const cardHeight = 120;
      const marginX = 15;
      const marginY = 15;
      const cols = 2;
      const rows = 2;
      
      const credentials: ScannerCredential[] = [];
      
      for (const scanner of scanners) {
        const newPassword = generatePassword();
        
        try {
          const { error } = await supabase.functions.invoke('reset-password', {
            body: { 
              user_id: scanner.user_id,
              new_password: newPassword
            }
          });
          
          if (error) throw error;
          
          credentials.push({
            fullName: scanner.full_name,
            email: scanner.email,
            password: newPassword
          });
        } catch (err) {
          console.error(`Failed to reset password for ${scanner.email}`, err);
          credentials.push({
            fullName: scanner.full_name,
            email: scanner.email,
            password: '[GAGAL RESET]'
          });
        }
      }
      
      for (let i = 0; i < credentials.length; i++) {
        const posOnPage = i % (cols * rows);
        const col = posOnPage % cols;
        const row = Math.floor(posOnPage / cols);
        
        if (i > 0 && posOnPage === 0) {
          pdf.addPage();
        }
        
        const x = marginX + col * (cardWidth + 10);
        const y = marginY + row * (cardHeight + 10);
        
        const cred = credentials[i];
        
        pdf.setDrawColor(59, 130, 246);
        pdf.setLineWidth(0.5);
        pdf.rect(x, y, cardWidth, cardHeight, 'S');
        
        pdf.setFillColor(59, 130, 246);
        pdf.rect(x, y, cardWidth, 14, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text('KARTU AKSES SCANNER', x + cardWidth/2, y + 6, { align: 'center' });
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'normal');
        const evtText = event.name || 'Event';
        pdf.text(evtText.length > 25 ? evtText.substring(0, 25) + '...' : evtText, x + cardWidth/2, y + 11, { align: 'center' });
        
        pdf.addImage(qrDataUrl, 'PNG', x + 25, y + 18, 40, 40);
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SCAN QR UNTUK LOGIN', x + cardWidth/2, y + 62, { align: 'center' });
        
        pdf.setDrawColor(200, 200, 200);
        pdf.line(x + 5, y + 66, x + cardWidth - 5, y + 66);
        
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Nama:', x + 5, y + 74);
        pdf.setFont('helvetica', 'normal');
        pdf.text(cred.fullName.length > 22 ? cred.fullName.substring(0, 22) + '...' : cred.fullName, x + 5, y + 80);
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('Email:', x + 5, y + 88);
        pdf.setFont('helvetica', 'normal');
        pdf.text(cred.email.length > 22 ? cred.email.substring(0, 22) + '...' : cred.email, x + 5, y + 94);
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('Password:', x + 5, y + 102);
        pdf.setFont('helvetica', 'normal');
        pdf.text(cred.password, x + 5, y + 108);
        
        pdf.setFontSize(5);
        pdf.setTextColor(128, 128, 128);
        pdf.text('Simpan kartu ini dengan aman', x + cardWidth/2, y + 116, { align: 'center' });
      }
      
      pdf.save(`scanner-cards-${event.name?.replace(/\s+/g, '-').toLowerCase() || 'event'}.pdf`);
      toast.success(`${credentials.length} kartu scanner berhasil diunduh`);
    } catch (error) {
      console.error('Error bulk download:', error);
      toast.error('Gagal membuat PDF bulk');
    } finally {
      setBulkDownloading(false);
    }
  };

  const handleExportList = () => {
    if (scanners.length === 0) {
      toast.error('Tidak ada data untuk diexport');
      return;
    }

    const exportData = scanners.map((s, index) => ({
      'No': index + 1,
      'Nama': s.full_name,
      'Email': s.email,
      'Status': s.is_active ? 'Aktif' : 'Nonaktif',
      'Tanggal Ditambahkan': format(new Date(s.created_at), 'dd MMM yyyy HH:mm', { locale: idLocale })
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Scanners');
    
    ws['!cols'] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 30 },
      { wch: 10 },
      { wch: 20 }
    ];

    XLSX.writeFile(wb, `scanners-${event.name?.replace(/\s+/g, '-').toLowerCase() || 'event'}.xlsx`);
    toast.success('Data scanner berhasil diexport');
  };

  const filteredScanners = scanners.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manajemen Scanner</h1>
        <p className="text-muted-foreground">Kelola user yang bertugas scan kehadiran peserta</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Scanner</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inactive}</p>
                <p className="text-sm text-muted-foreground">Nonaktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCheckins}</p>
                <p className="text-sm text-muted-foreground">Total Check-in</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="scanners" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Daftar Scanner
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scanners" className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari scanner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Scanner
              </Button>
              <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
              <Button variant="outline" onClick={handleExportList}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export
              </Button>
              {scanners.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={handleBulkDownload}
                  disabled={bulkDownloading}
                >
                  {bulkDownloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                  )}
                  Download Semua Kartu
                </Button>
              )}
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>Tambah Scanner Baru</CardTitle>
                <CardDescription>Buat akun scanner untuk check-in peserta</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddScanner} className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Nama Lengkap</Label>
                    <Input 
                      placeholder="Nama scanner"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="text"
                        placeholder="Min 6 karakter"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => setPassword(generatePassword())}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button type="submit" disabled={saving} className="flex-1">
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Simpan
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowAddForm(false);
                        setEmail('');
                        setFullName('');
                        setPassword('');
                      }}
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Scanner List */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredScanners.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Tidak ada scanner yang cocok' : 'Belum ada scanner'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ditambahkan</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredScanners.map((scanner) => (
                      <TableRow key={scanner.id}>
                        <TableCell className="font-medium">{scanner.full_name}</TableCell>
                        <TableCell>{scanner.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={scanner.is_active}
                              onCheckedChange={() => handleToggleActive(scanner)}
                            />
                            <Badge variant={scanner.is_active ? 'default' : 'secondary'}>
                              {scanner.is_active ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(scanner.created_at), 'dd MMM yyyy', { locale: idLocale })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResetPasswordAndDownload(scanner)}
                              disabled={resettingId === scanner.id}
                            >
                              {resettingId === scanner.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingId(scanner.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
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

        <TabsContent value="activity">
          <ScannerActivityLog 
            eventId={event.id} 
            scanners={scanners}
            onStatsUpdate={(totalCheckins) => setStats(prev => ({ ...prev, totalCheckins }))}
            eventName={event.name}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Scanner?</AlertDialogTitle>
            <AlertDialogDescription>
              Scanner akan dihapus dari event ini. User tetap ada di sistem tapi tidak bisa mengakses event ini lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteScanner} className="bg-destructive text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <ImportScannersDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        eventId={event.id}
        onSuccess={fetchScanners}
      />
    </div>
  );
}

export default function EventScanners() {
  return (
    <EventLayout>
      {(props) => <EventScannersContent {...props} />}
    </EventLayout>
  );
}
