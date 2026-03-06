'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { SessionErrorAlert } from '@/components/admin/SessionErrorAlert';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Trophy, 
  Search, 
  Download, 
  Loader2, 
  Calendar,
  Gift,
  Users,
  Mail,
  MailX,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  Send,
  ListChecks
} from 'lucide-react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

type PrizeCategory = 'hiburan' | 'utama' | 'grand_prize';

interface Winner {
  id: string;
  drawn_at: string;
  email_sent: boolean;
  email_sent_at: string | null;
  animation_used: string;
  participant: {
    id: string;
    name: string;
    email: string | null;
    ticket_number: string;
  };
  prize: {
    id: string;
    name: string;
    category: PrizeCategory;
  };
  event: {
    id: string;
    name: string;
    event_date: string;
  };
}

const categoryLabels: Record<PrizeCategory, string> = {
  hiburan: 'Hiburan',
  utama: 'Utama',
  grand_prize: 'Grand Prize',
};

const categoryColors: Record<PrizeCategory, string> = {
  hiburan: 'bg-secondary text-secondary-foreground',
  utama: 'bg-primary/10 text-primary',
  grand_prize: 'bg-amber-500/10 text-amber-600',
};

const ITEMS_PER_PAGE = 20;

export default function AdminWinners() {
  const { isRefreshing, sessionError, clearSessionError, refreshSession, handleApiError } = useSessionRefresh();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [emailFilter, setEmailFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Bulk selection states
  const [selectedWinnerIds, setSelectedWinnerIds] = useState<Set<string>>(new Set());
  const [bulkEmailLoading, setBulkEmailLoading] = useState(false);
  const [confirmEmailDialogOpen, setConfirmEmailDialogOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchWinners();
  }, [selectedEvent, selectedCategory, emailFilter, dateFrom, dateTo, currentPage]);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('id, name')
      .order('created_at', { ascending: false });

    if (data) {
      setEvents(data);
    }
  };

  const fetchWinners = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('winners')
        .select(`
          id,
          drawn_at,
          email_sent,
          email_sent_at,
          animation_used,
          participant:participants!inner(id, name, email, ticket_number),
          prize:prizes!inner(id, name, category),
          event:events!inner(id, name, event_date)
        `, { count: 'exact' });

      if (selectedEvent !== 'all') {
        query = query.eq('event_id', selectedEvent);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('prize.category', selectedCategory);
      }

      if (emailFilter === 'sent') {
        query = query.eq('email_sent', true);
      } else if (emailFilter === 'unsent') {
        query = query.eq('email_sent', false);
      }

      if (dateFrom) {
        query = query.gte('drawn_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('drawn_at', dateTo + 'T23:59:59');
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, count, error } = await query
        .order('drawn_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setWinners((data || []) as unknown as Winner[]);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast.error('Gagal memuat data pemenang: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredWinners = winners.filter(winner => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      winner.participant.name.toLowerCase().includes(searchLower) ||
      winner.participant.ticket_number.toLowerCase().includes(searchLower) ||
      winner.prize.name.toLowerCase().includes(searchLower) ||
      winner.event.name.toLowerCase().includes(searchLower)
    );
  });

  const exportToExcel = async () => {
    setExporting(true);
    try {
      // Fetch all winners for export
      let query = supabase
        .from('winners')
        .select(`
          id,
          drawn_at,
          email_sent,
          email_sent_at,
          animation_used,
          participant:participants!inner(id, name, email, ticket_number),
          prize:prizes!inner(id, name, category),
          event:events!inner(id, name, event_date)
        `);

      if (selectedEvent !== 'all') {
        query = query.eq('event_id', selectedEvent);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('prize.category', selectedCategory);
      }

      if (emailFilter === 'sent') {
        query = query.eq('email_sent', true);
      } else if (emailFilter === 'unsent') {
        query = query.eq('email_sent', false);
      }

      if (dateFrom) {
        query = query.gte('drawn_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('drawn_at', dateTo + 'T23:59:59');
      }

      const { data } = await query.order('drawn_at', { ascending: false });

      if (!data || data.length === 0) {
        toast.error('Tidak ada data untuk diexport');
        return;
      }

      const exportData = (data as unknown as Winner[]).map((w, index) => ({
        'No': index + 1,
        'Nama Pemenang': w.participant.name,
        'Email': w.participant.email || '-',
        'Nomor Tiket': w.participant.ticket_number,
        'Hadiah': w.prize.name,
        'Kategori': categoryLabels[w.prize.category],
        'Event': w.event.name,
        'Tanggal Event': format(new Date(w.event.event_date), 'd MMMM yyyy', { locale: id }),
        'Waktu Undian': format(new Date(w.drawn_at), 'd MMM yyyy HH:mm', { locale: id }),
        'Email Terkirim': w.email_sent ? 'Ya' : 'Tidak',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Winners');
      XLSX.writeFile(wb, `pemenang-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success('Data berhasil diexport');
    } catch (error: any) {
      toast.error('Gagal export: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      // Fetch all winners for export
      let query = supabase
        .from('winners')
        .select(`
          id,
          drawn_at,
          email_sent,
          email_sent_at,
          animation_used,
          participant:participants!inner(id, name, email, ticket_number),
          prize:prizes!inner(id, name, category),
          event:events!inner(id, name, event_date)
        `);

      if (selectedEvent !== 'all') {
        query = query.eq('event_id', selectedEvent);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('prize.category', selectedCategory);
      }

      if (emailFilter === 'sent') {
        query = query.eq('email_sent', true);
      } else if (emailFilter === 'unsent') {
        query = query.eq('email_sent', false);
      }

      if (dateFrom) {
        query = query.gte('drawn_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('drawn_at', dateTo + 'T23:59:59');
      }

      const { data } = await query.order('drawn_at', { ascending: false });

      if (!data || data.length === 0) {
        toast.error('Tidak ada data untuk diexport');
        return;
      }

      const winnersData = data as unknown as Winner[];
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.text('Daftar Pemenang', pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Diexport: ${format(new Date(), 'd MMMM yyyy HH:mm', { locale: id })}`, pageWidth / 2, 28, { align: 'center' });

      const headers = ['No', 'Nama', 'Tiket', 'Hadiah', 'Kategori', 'Event', 'Waktu Undian'];
      const colWidths = [10, 50, 30, 50, 25, 60, 40];
      let y = 40;

      // Header
      doc.setFillColor(59, 130, 246);
      doc.rect(10, y - 5, pageWidth - 20, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      let x = 15;
      headers.forEach((h, i) => {
        doc.text(h, x, y);
        x += colWidths[i];
      });

      y += 8;
      doc.setTextColor(0, 0, 0);

      winnersData.forEach((w, index) => {
        if (y > 190) {
          doc.addPage();
          y = 20;
          
          // Header on new page
          doc.setFillColor(59, 130, 246);
          doc.rect(10, y - 5, pageWidth - 20, 8, 'F');
          doc.setTextColor(255, 255, 255);
          x = 15;
          headers.forEach((h, i) => {
            doc.text(h, x, y);
            x += colWidths[i];
          });
          y += 8;
          doc.setTextColor(0, 0, 0);
        }

        x = 15;
        doc.setFontSize(8);
        doc.text(String(index + 1), x, y);
        x += colWidths[0];
        doc.text(w.participant.name.substring(0, 25), x, y);
        x += colWidths[1];
        doc.text(w.participant.ticket_number, x, y);
        x += colWidths[2];
        doc.text(w.prize.name.substring(0, 25), x, y);
        x += colWidths[3];
        doc.text(categoryLabels[w.prize.category], x, y);
        x += colWidths[4];
        doc.text(w.event.name.substring(0, 30), x, y);
        x += colWidths[5];
        doc.text(format(new Date(w.drawn_at), 'd MMM yyyy HH:mm'), x, y);

        y += 6;
      });

      doc.save(`pemenang-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF berhasil diexport');
    } catch (error: any) {
      toast.error('Gagal export: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Stats
  const emailSentCount = winners.filter(w => w.email_sent).length;
  const emailUnsentCount = winners.filter(w => !w.email_sent).length;

  // Bulk selection helpers
  const toggleSelectWinner = (winnerId: string) => {
    setSelectedWinnerIds(prev => {
      const next = new Set(prev);
      if (next.has(winnerId)) {
        next.delete(winnerId);
      } else {
        next.add(winnerId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedWinnerIds.size === filteredWinners.length) {
      setSelectedWinnerIds(new Set());
    } else {
      setSelectedWinnerIds(new Set(filteredWinners.map(w => w.id)));
    }
  };

  const isAllSelected = filteredWinners.length > 0 && selectedWinnerIds.size === filteredWinners.length;
  const isSomeSelected = selectedWinnerIds.size > 0;

  // Get selected winners that have email and haven't been sent
  const selectedWinnersForEmail = filteredWinners.filter(
    w => selectedWinnerIds.has(w.id) && w.participant.email && !w.email_sent
  );

  const handleBulkSendEmail = async () => {
    if (selectedWinnersForEmail.length === 0) {
      toast.error('Tidak ada pemenang yang bisa dikirim email');
      return;
    }

    setBulkEmailLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const winner of selectedWinnersForEmail) {
        try {
          const { error } = await supabase.functions.invoke('send-winner-email', {
            body: { winnerId: winner.id }
          });

          if (error) {
            failCount++;
            console.error(`Failed to send email to ${winner.participant.email}:`, error);
          } else {
            successCount++;
          }
        } catch (err) {
          failCount++;
          console.error(`Error sending email to ${winner.participant.email}:`, err);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} email berhasil dikirim`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} email gagal dikirim`);
      }

      setSelectedWinnerIds(new Set());
      setConfirmEmailDialogOpen(false);
      fetchWinners();
    } catch (error: any) {
      toast.error('Gagal mengirim email: ' + error.message);
    } finally {
      setBulkEmailLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Semua Pemenang</h1>
            <p className="text-muted-foreground">
              Kelola semua pemenang dari seluruh event
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={exporting}>
                {exporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportToExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pemenang</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Terkirim</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{emailSentCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Belum Dikirim</CardTitle>
              <MailX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{emailUnsentCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Event</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-6">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, tiket, hadiah..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedEvent} onValueChange={(v) => { setSelectedEvent(v); setCurrentPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Event</SelectItem>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setCurrentPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="grand_prize">Grand Prize</SelectItem>
                  <SelectItem value="utama">Utama</SelectItem>
                  <SelectItem value="hiburan">Hiburan</SelectItem>
                </SelectContent>
              </Select>
              <Select value={emailFilter} onValueChange={(v) => { setEmailFilter(v); setCurrentPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Status Email" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="sent">Terkirim</SelectItem>
                  <SelectItem value="unsent">Belum Dikirim</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                  className="w-full"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                placeholder="Sampai tanggal"
                className="w-40"
              />
              {(selectedEvent !== 'all' || selectedCategory !== 'all' || emailFilter !== 'all' || dateFrom || dateTo) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSelectedEvent('all');
                    setSelectedCategory('all');
                    setEmailFilter('all');
                    setDateFrom('');
                    setDateTo('');
                    setCurrentPage(1);
                  }}
                >
                  Reset Filter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {isSomeSelected && (
          <Card className="bg-muted/50">
            <CardContent className="py-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {selectedWinnerIds.size} pemenang dipilih
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setConfirmEmailDialogOpen(true)}
                    disabled={selectedWinnersForEmail.length === 0}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Kirim Email ({selectedWinnersForEmail.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedWinnerIds(new Set())}
                  >
                    Batal Pilih
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Winners Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredWinners.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Tidak ada pemenang ditemukan</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Pemenang</TableHead>
                      <TableHead>Tiket</TableHead>
                      <TableHead>Hadiah</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Waktu Undian</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWinners.map((winner) => (
                      <TableRow key={winner.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedWinnerIds.has(winner.id)}
                            onCheckedChange={() => toggleSelectWinner(winner.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{winner.participant.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {winner.participant.email || '-'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{winner.participant.ticket_number}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Gift className="h-4 w-4 text-muted-foreground" />
                            {winner.prize.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={categoryColors[winner.prize.category]}>
                            {categoryLabels[winner.prize.category]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link 
                            to={`/event/${winner.event.id}/dashboard`}
                            className="text-primary hover:underline"
                          >
                            {winner.event.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {format(new Date(winner.drawn_at), 'd MMM yyyy HH:mm', { locale: id })}
                        </TableCell>
                        <TableCell>
                          {winner.email_sent ? (
                            <Badge className="bg-green-500/10 text-green-600">
                              <Mail className="mr-1 h-3 w-3" />
                              Terkirim
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <MailX className="mr-1 h-3 w-3" />
                              Belum
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/event/${winner.event.id}/winners`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} dari {totalCount}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Sebelumnya
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm Bulk Email Dialog */}
      <AlertDialog open={confirmEmailDialogOpen} onOpenChange={setConfirmEmailDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kirim Email ke Pemenang</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan mengirim email notifikasi ke {selectedWinnersForEmail.length} pemenang yang belum menerima email dan memiliki alamat email.
              {selectedWinnerIds.size > selectedWinnersForEmail.length && (
                <span className="block mt-2 text-amber-600">
                  {selectedWinnerIds.size - selectedWinnersForEmail.length} pemenang dilewati (tidak ada email atau sudah dikirim).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkEmailLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkSendEmail}
              disabled={bulkEmailLoading || selectedWinnersForEmail.length === 0}
            >
              {bulkEmailLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Kirim Email
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
