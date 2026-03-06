'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Search, RefreshCw, Calendar as CalendarIcon, Users, UserCheck, Trophy, Download, ExternalLink, ChevronLeft, ChevronRight, Mail, Phone, ListChecks, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { SessionErrorAlert } from '@/components/admin/SessionErrorAlert';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

interface ParticipantWithEvent {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  division: string | null;
  status: string;
  ticket_number: string;
  checked_in_at: string | null;
  created_at: string;
  event_id: string;
  event_name?: string;
  event_date?: string;
  organization_name?: string;
}

interface Event {
  id: string;
  name: string;
  organization_id: string;
}

const ITEMS_PER_PAGE = 20;

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    registered: { label: 'Registered', variant: 'secondary' },
    checked_in: { label: 'Checked In', variant: 'default' },
    won: { label: 'Winner', variant: 'default' },
  };
  const config = statusMap[status] || { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function AdminParticipants() {
  const { toast } = useToast();
  const router = useRouter();
  const { isRefreshing, sessionError, clearSessionError, refreshSession, handleApiError } = useSessionRefresh();
  const [participants, setParticipants] = useState<ParticipantWithEvent[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => {
    fetchParticipants();
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('id, name, organization_id')
      .order('event_date', { ascending: false });
    
    if (!error && data) {
      setEvents(data);
    }
  }

  async function fetchParticipants() {
    setLoading(true);
    
    try {
      // Fetch all participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*')
        .order('created_at', { ascending: false });

      if (participantsError) throw participantsError;

      // Get event details for all participants
      const eventIds = [...new Set((participantsData || []).map(p => p.event_id))];
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, name, event_date, organization_id')
        .in('id', eventIds);
      
      const eventMap = new Map(eventsData?.map(e => [e.id, e]) || []);

      // Get organization names
      const orgIds = [...new Set((eventsData || []).map(e => e.organization_id))];
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds);
      
      const orgMap = new Map(orgsData?.map(o => [o.id, o.name]) || []);

      const enrichedParticipants: ParticipantWithEvent[] = (participantsData || []).map(participant => {
        const event = eventMap.get(participant.event_id);
        return {
          ...participant,
          event_name: event?.name || 'Unknown',
          event_date: event?.event_date,
          organization_name: event ? orgMap.get(event.organization_id) : 'Unknown',
        };
      });

      setParticipants(enrichedParticipants);
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat data peserta',
      });
    } finally {
      setLoading(false);
    }
  }

  const exportToExcel = () => {
    const exportData = filteredParticipants.map(p => ({
      'Name': p.name,
      'Email': p.email || '-',
      'Phone': p.phone || '-',
      'Company': p.company || '-',
      'Division': p.division || '-',
      'Ticket Number': p.ticket_number,
      'Status': p.status,
      'Event': p.event_name,
      'Event Date': p.event_date ? format(new Date(p.event_date), 'dd MMM yyyy', { locale: localeId }) : '-',
      'Organization': p.organization_name,
      'Checked In At': p.checked_in_at ? format(new Date(p.checked_in_at), 'dd MMM yyyy HH:mm', { locale: localeId }) : '-',
      'Registered At': format(new Date(p.created_at), 'dd MMM yyyy HH:mm', { locale: localeId }),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Participants');
    XLSX.writeFile(wb, `all_participants_${format(new Date(), 'yyyyMMdd')}.xlsx`);

    toast({
      title: 'Export Berhasil',
      description: 'File Excel berhasil diunduh',
    });
  };

  function clearFilters() {
    setSearchQuery('');
    setStatusFilter('all');
    setEventFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setCurrentPage(1);
  }

  const filteredParticipants = useMemo(() => {
    return participants.filter(participant => {
      const matchesSearch = searchQuery === '' ||
        participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        participant.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        participant.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        participant.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        participant.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        participant.event_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || participant.status === statusFilter;
      const matchesEvent = eventFilter === 'all' || participant.event_id === eventFilter;
      
      const createdDate = new Date(participant.created_at);
      const matchesDateFrom = !dateFrom || createdDate >= dateFrom;
      const matchesDateTo = !dateTo || createdDate <= dateTo;

      return matchesSearch && matchesStatus && matchesEvent && matchesDateFrom && matchesDateTo;
    });
  }, [participants, searchQuery, statusFilter, eventFilter, dateFrom, dateTo]);

  // Pagination logic
  const totalPages = Math.ceil(filteredParticipants.length / ITEMS_PER_PAGE);
  const paginatedParticipants = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredParticipants.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredParticipants, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [searchQuery, statusFilter, eventFilter, dateFrom, dateTo]);

  // Bulk selection functions
  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === paginatedParticipants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedParticipants.map(p => p.id)));
    }
  }

  async function handleBulkCheckIn() {
    if (selectedIds.size === 0) return;
    
    setBulkLoading(true);
    try {
      const { error } = await supabase
        .from('participants')
        .update({ 
          status: 'checked_in',
          checked_in_at: new Date().toISOString()
        })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: 'Bulk Check-In Berhasil',
        description: `${selectedIds.size} peserta berhasil di-check in`,
      });

      setSelectedIds(new Set());
      fetchParticipants();
    } catch (error) {
      console.error('Error bulk check-in:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal melakukan bulk check-in',
      });
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkResetCheckIn() {
    if (selectedIds.size === 0) return;
    
    setBulkLoading(true);
    try {
      const { error } = await supabase
        .from('participants')
        .update({ 
          status: 'registered',
          checked_in_at: null
        })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: 'Reset Check-In Berhasil',
        description: `${selectedIds.size} peserta berhasil di-reset`,
      });

      setSelectedIds(new Set());
      fetchParticipants();
    } catch (error) {
      console.error('Error reset check-in:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal melakukan reset check-in',
      });
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    
    setBulkLoading(true);
    try {
      // First delete any winners associated with these participants
      await supabase
        .from('winners')
        .delete()
        .in('participant_id', Array.from(selectedIds));

      // Then delete the participants
      const { error } = await supabase
        .from('participants')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: 'Bulk Delete Berhasil',
        description: `${selectedIds.size} peserta berhasil dihapus`,
      });

      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      fetchParticipants();
    } catch (error) {
      console.error('Error bulk delete:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menghapus peserta',
      });
    } finally {
      setBulkLoading(false);
    }
  }

  const isAllSelected = paginatedParticipants.length > 0 && selectedIds.size === paginatedParticipants.length;
  const isSomeSelected = selectedIds.size > 0;

  // Stats
  const totalRegistered = participants.filter(p => p.status === 'registered').length;
  const totalCheckedIn = participants.filter(p => p.status === 'checked_in').length;
  const totalWinners = participants.filter(p => p.status === 'won').length;

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || eventFilter !== 'all' || dateFrom || dateTo;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Participants</h1>
            <p className="text-muted-foreground mt-1">Monitor semua peserta dari semua event</p>
          </div>
          <Button onClick={exportToExcel} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{participants.length.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Registered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRegistered.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Checked In
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCheckedIn.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Winners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWinners.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, email, phone, ticket, company, atau event..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Event</SelectItem>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="won">Winner</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("gap-2", dateFrom && "text-foreground")}>
                    <CalendarIcon className="h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'dd MMM yy', { locale: localeId }) : 'Dari'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("gap-2", dateTo && "text-foreground")}>
                    <CalendarIcon className="h-4 w-4" />
                    {dateTo ? format(dateTo, 'dd MMM yy', { locale: localeId }) : 'Sampai'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                  Reset Filter
                </Button>
              )}

              <Button variant="outline" onClick={fetchParticipants} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            {/* Bulk Actions */}
            {isSomeSelected && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ListChecks className="h-4 w-4" />
                  <span>{selectedIds.size} peserta terpilih</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkCheckIn}
                    disabled={bulkLoading}
                    className="gap-1"
                  >
                    <UserCheck className="h-3 w-3" />
                    Check In
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkResetCheckIn}
                    disabled={bulkLoading}
                    className="gap-1"
                  >
                    Reset Check In
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setBulkDeleteOpen(true)}
                    disabled={bulkLoading}
                    className="gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Hapus
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedIds(new Set())}
                    disabled={bulkLoading}
                  >
                    Batal
                  </Button>
                </div>
                {bulkLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Participants Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedParticipants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Tidak ada peserta ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedParticipants.map((participant) => (
                    <TableRow key={participant.id} className={selectedIds.has(participant.id) ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(participant.id)}
                          onCheckedChange={() => toggleSelect(participant.id)}
                          aria-label={`Select ${participant.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{participant.name}</div>
                        {participant.division && (
                          <div className="text-xs text-muted-foreground">{participant.division}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {participant.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate max-w-[150px]">{participant.email}</span>
                            </div>
                          )}
                          {participant.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{participant.phone}</span>
                            </div>
                          )}
                          {!participant.email && !participant.phone && (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{participant.ticket_number}</code>
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate">
                        {participant.company || '-'}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => router.push(`/event/${participant.event_id}`)}
                          className="text-left hover:text-primary hover:underline flex items-center gap-1"
                        >
                          <span className="truncate max-w-[150px]">{participant.event_name}</span>
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </button>
                        {participant.event_date && (
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(participant.event_date), 'dd MMM yyyy', { locale: localeId })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(participant.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(participant.created_at), 'dd MMM yy', { locale: localeId })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => router.push(`/event/${participant.event_id}/participants`)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredParticipants.length)} dari {filteredParticipants.length} peserta
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus {selectedIds.size} Peserta?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini akan menghapus {selectedIds.size} peserta beserta data pemenang terkait.
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={bulkLoading}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                disabled={bulkLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {bulkLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  'Hapus Semua'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
