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
import { Loader2, Search, RefreshCw, Calendar as CalendarIcon, Users, Gift, DollarSign, Eye, Download, MoreHorizontal, Pencil, Trash2, Play, CheckCircle, XCircle, ListChecks, Trophy, ExternalLink, ChevronLeft, ChevronRight, Copy, FileText, Palette, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { SessionErrorAlert } from '@/components/admin/SessionErrorAlert';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { AdminCreateEventDialog } from '@/components/admin/AdminCreateEventDialog';
import { AdminEventDetailDialog } from '@/components/admin/AdminEventDetailDialog';
import { AdminEditEventDialog } from '@/components/admin/AdminEditEventDialog';
import { AdminDeleteEventDialog } from '@/components/admin/AdminDeleteEventDialog';
import { CertificateTemplateDialog } from '@/components/admin/CertificateTemplateDialog';
import { EventReportPDFDialog } from '@/components/admin/EventReportPDFDialog';
import { cn } from '@/lib/utils';

interface EventWithDetails {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  status: string;
  tier: string;
  location: string | null;
  created_at: string;
  organization_id: string;
  organization_name?: string;
  participant_count?: number;
  prize_count?: number;
  winner_count?: number;
  total_revenue?: number;
}

interface Organization {
  id: string;
  name: string;
}

const ITEMS_PER_PAGE = 15;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'Draft', variant: 'secondary' },
    pending_payment: { label: 'Pending Payment', variant: 'outline' },
    active: { label: 'Active', variant: 'default' },
    completed: { label: 'Completed', variant: 'secondary' },
    cancelled: { label: 'Cancelled', variant: 'destructive' },
  };
  const config = statusMap[status] || { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function getTierBadge(tier: string) {
  const tierMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    free: { label: 'FREE', variant: 'outline' },
    basic: { label: 'BASIC', variant: 'secondary' },
    pro: { label: 'PRO', variant: 'default' },
    enterprise: { label: 'ENTERPRISE', variant: 'default' },
  };
  const config = tierMap[tier] || { label: tier.toUpperCase(), variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function AdminEvents() {
  const { toast } = useToast();
  const router = useRouter();
  const { isRefreshing, sessionError, clearSessionError, refreshSession, handleApiError } = useSessionRefresh();
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  // Dialog states
  const [detailEventId, setDetailEventId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [deleteEventName, setDeleteEventName] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicateLoading, setDuplicateLoading] = useState<string | null>(null);
  
  // Certificate template dialog state
  const [templateEventId, setTemplateEventId] = useState<string | null>(null);
  const [templateEventName, setTemplateEventName] = useState('');
  const [templateOpen, setTemplateOpen] = useState(false);

  // Report PDF dialog state
  const [reportEventId, setReportEventId] = useState<string | null>(null);
  const [reportEventName, setReportEventName] = useState('');
  const [reportOpen, setReportOpen] = useState(false);

  // Bulk selection states
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchOrganizations();
  }, []);

  async function fetchOrganizations() {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name');
    
    if (!error && data) {
      setOrganizations(data);
    }
  }

  async function fetchEvents() {
    setLoading(true);
    
    try {
      // Fetch all events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      const eventIds = (eventsData || []).map(e => e.id);
      const orgIds = [...new Set((eventsData || []).map(e => e.organization_id))];

      // Fetch organizations, participants, prizes, winners, and payments in parallel
      const [orgsResult, participantsResult, prizesResult, winnersResult, paymentsResult] = await Promise.all([
        supabase.from('organizations').select('id, name').in('id', orgIds),
        supabase.from('participants').select('event_id'),
        supabase.from('prizes').select('event_id'),
        supabase.from('winners').select('event_id'),
        supabase.from('event_payments').select('event_id, total_amount').eq('payment_status', 'paid'),
      ]);

      const orgMap = new Map(orgsResult.data?.map(o => [o.id, o.name]) || []);

      // Count participants per event
      const participantCountMap = new Map<string, number>();
      participantsResult.data?.forEach(p => {
        participantCountMap.set(p.event_id, (participantCountMap.get(p.event_id) || 0) + 1);
      });

      // Count prizes per event
      const prizeCountMap = new Map<string, number>();
      prizesResult.data?.forEach(p => {
        prizeCountMap.set(p.event_id, (prizeCountMap.get(p.event_id) || 0) + 1);
      });

      // Count winners per event
      const winnerCountMap = new Map<string, number>();
      winnersResult.data?.forEach(w => {
        winnerCountMap.set(w.event_id, (winnerCountMap.get(w.event_id) || 0) + 1);
      });

      // Sum revenue per event
      const revenueMap = new Map<string, number>();
      paymentsResult.data?.forEach(p => {
        revenueMap.set(p.event_id, (revenueMap.get(p.event_id) || 0) + p.total_amount);
      });

      const enrichedEvents: EventWithDetails[] = (eventsData || []).map(event => ({
        ...event,
        organization_name: orgMap.get(event.organization_id) || 'Unknown',
        participant_count: participantCountMap.get(event.id) || 0,
        prize_count: prizeCountMap.get(event.id) || 0,
        winner_count: winnerCountMap.get(event.id) || 0,
        total_revenue: revenueMap.get(event.id) || 0,
      }));

      setEvents(enrichedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat data events',
      });
    } finally {
      setLoading(false);
    }
  }

  const exportToExcel = () => {
    const exportData = filteredEvents.map(e => ({
      'Event Name': e.name,
      'Organization': e.organization_name,
      'Date': format(new Date(e.event_date), 'dd MMM yyyy', { locale: localeId }),
      'Status': e.status,
      'Tier': e.tier,
      'Location': e.location || '-',
      'Participants': e.participant_count,
      'Prizes': e.prize_count,
      'Winners': e.winner_count,
      'Revenue': e.total_revenue,
      'Created': format(new Date(e.created_at), 'dd MMM yyyy', { locale: localeId }),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Events');
    XLSX.writeFile(wb, `all_events_${format(new Date(), 'yyyyMMdd')}.xlsx`);

    toast({
      title: 'Export Berhasil',
      description: 'File Excel berhasil diunduh',
    });
  };

  async function handleStatusChange(eventId: string, newStatus: 'draft' | 'pending_payment' | 'active' | 'completed' | 'cancelled') {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: 'Status Diperbarui',
        description: `Event berhasil diubah ke status ${newStatus}`,
      });

      fetchEvents();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memperbarui status event',
      });
    }
  }

  async function handleBulkStatusChange(newStatus: 'draft' | 'pending_payment' | 'active' | 'completed' | 'cancelled') {
    if (selectedEventIds.size === 0) return;
    
    setBulkLoading(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .in('id', Array.from(selectedEventIds));

      if (error) throw error;

      toast({
        title: 'Bulk Update Berhasil',
        description: `${selectedEventIds.size} event berhasil diubah ke status ${newStatus}`,
      });

      setSelectedEventIds(new Set());
      fetchEvents();
    } catch (error) {
      console.error('Error bulk updating status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memperbarui status events',
      });
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedEventIds.size === 0) return;
    
    setBulkLoading(true);
    try {
      const eventIdsArray = Array.from(selectedEventIds);
      
      // Delete related data first
      await supabase.from('winners').delete().in('event_id', eventIdsArray);
      await supabase.from('prizes').delete().in('event_id', eventIdsArray);
      await supabase.from('participants').delete().in('event_id', eventIdsArray);
      await supabase.from('prize_audit_logs').delete().in('event_id', eventIdsArray);
      
      // Delete event forms and related data
      const { data: forms } = await supabase
        .from('event_forms')
        .select('id')
        .in('event_id', eventIdsArray);
      
      if (forms && forms.length > 0) {
        const formIds = forms.map(f => f.id);
        await supabase.from('form_submissions').delete().in('form_id', formIds);
        await supabase.from('form_fields').delete().in('form_id', formIds);
        await supabase.from('event_forms').delete().in('event_id', eventIdsArray);
      }
      
      // Delete event payments
      await supabase.from('event_payments').delete().in('event_id', eventIdsArray);
      
      // Finally delete events
      const { error } = await supabase
        .from('events')
        .delete()
        .in('id', eventIdsArray);

      if (error) throw error;

      toast({
        title: 'Bulk Delete Berhasil',
        description: `${selectedEventIds.size} event berhasil dihapus`,
      });

      setSelectedEventIds(new Set());
      setBulkDeleteOpen(false);
      fetchEvents();
    } catch (error) {
      console.error('Error bulk deleting events:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menghapus events',
      });
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleDuplicateEvent(event: EventWithDetails) {
    setDuplicateLoading(event.id);
    
    try {
      // Create new event with same data
      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert({
          name: `${event.name} (Copy)`,
          description: event.description,
          event_date: event.event_date,
          location: event.location,
          organization_id: event.organization_id,
          tier: 'free',
          status: 'draft',
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Duplicate prizes
      const { data: originalPrizes } = await supabase
        .from('prizes')
        .select('*')
        .eq('event_id', event.id);

      if (originalPrizes && originalPrizes.length > 0) {
        const newPrizes = originalPrizes.map(prize => ({
          event_id: newEvent.id,
          name: prize.name,
          description: prize.description,
          category: prize.category,
          quantity: prize.quantity,
          remaining_quantity: prize.quantity,
          image_url: prize.image_url,
          sort_order: prize.sort_order,
        }));

        await supabase.from('prizes').insert(newPrizes);
      }

      toast({
        title: 'Event Berhasil Diduplikasi',
        description: `Event "${newEvent.name}" berhasil dibuat`,
      });

      fetchEvents();
    } catch (error) {
      console.error('Error duplicating event:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menduplikasi event',
      });
    } finally {
      setDuplicateLoading(null);
    }
  }

  async function handleExportWinnersCertificates() {
    if (selectedEventIds.size === 0) return;
    
    setBulkLoading(true);
    try {
      const eventIdsArray = Array.from(selectedEventIds);

      // Fetch certificate templates for selected events
      const { data: templates } = await supabase
        .from('certificate_templates')
        .select('*')
        .in('event_id', eventIdsArray);

      const templateMap = new Map(templates?.map(t => [t.event_id, t]) || []);

      // Fetch winners for selected events with event_id
      const { data: winners, error: winnersError } = await supabase
        .from('winners')
        .select(`
          id,
          drawn_at,
          event_id,
          participant:participants(name, email, ticket_number),
          prize:prizes(name, category),
          event:events(name, event_date, location)
        `)
        .in('event_id', eventIdsArray);

      if (winnersError) throw winnersError;

      if (!winners || winners.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Tidak Ada Pemenang',
          description: 'Event yang dipilih belum memiliki pemenang',
        });
        setBulkLoading(false);
        return;
      }

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Helper to convert hex to RGB
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
      };

      winners.forEach((winner, index) => {
        if (index > 0) {
          pdf.addPage();
        }

        const participant = winner.participant as any;
        const prize = winner.prize as any;
        const event = winner.event as any;
        const template = templateMap.get(winner.event_id);

        // Default template values
        const bgColor = hexToRgb(template?.background_color || '#FFFFFF');
        const borderColor = hexToRgb(template?.border_color || '#D4AF37');
        const titleColor = hexToRgb(template?.title_color || '#D4AF37');
        const subtitleColor = hexToRgb(template?.subtitle_color || '#666666');
        const nameColor = hexToRgb(template?.name_color || '#1a1a1a');
        const prizeColor = hexToRgb(template?.prize_color || '#333333');
        const footerColor = hexToRgb(template?.footer_color || '#888888');

        const titleText = template?.title_text || 'SERTIFIKAT PEMENANG';
        const subtitleText = template?.subtitle_text || 'Diberikan kepada:';
        const prizeLabelText = template?.prize_label_text || 'Sebagai Pemenang';
        const footerText = template?.footer_text || null;

        const titleFontSize = template?.title_font_size || 48;
        const subtitleFontSize = template?.subtitle_font_size || 18;
        const nameFontSize = template?.name_font_size || 36;
        const prizeFontSize = template?.prize_font_size || 24;
        const footerFontSize = template?.footer_font_size || 14;
        const borderWidth = template?.border_width || 3;

        const showTicketNumber = template?.show_ticket_number !== false;
        const showCategory = template?.show_category !== false;
        const showEventDate = template?.show_event_date !== false;
        const showDecorations = template?.show_decorations !== false;

        // Certificate background
        pdf.setFillColor(bgColor.r, bgColor.g, bgColor.b);
        pdf.rect(0, 0, 297, 210, 'F');

        // Border
        if (borderWidth > 0) {
          pdf.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
          pdf.setLineWidth(borderWidth);
          pdf.rect(10, 10, 277, 190);
          pdf.setLineWidth(1);
          pdf.rect(15, 15, 267, 180);
        }

        // Decorations
        if (showDecorations) {
          pdf.setFillColor(borderColor.r, borderColor.g, borderColor.b);
          pdf.circle(25, 25, 5, 'F');
          pdf.circle(272, 25, 5, 'F');
          pdf.circle(25, 185, 5, 'F');
          pdf.circle(272, 185, 5, 'F');
        }

        // Header/Title
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(Math.min(titleFontSize * 0.67, 32));
        pdf.setTextColor(titleColor.r, titleColor.g, titleColor.b);
        pdf.text(titleText, 148.5, 45, { align: 'center' });

        // Decorative line
        pdf.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
        pdf.setLineWidth(0.5);
        pdf.line(60, 55, 237, 55);

        // Subtitle
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(Math.min(subtitleFontSize * 0.78, 14));
        pdf.setTextColor(subtitleColor.r, subtitleColor.g, subtitleColor.b);
        pdf.text(subtitleText, 148.5, 75, { align: 'center' });

        // Winner name
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(Math.min(nameFontSize * 0.78, 28));
        pdf.setTextColor(nameColor.r, nameColor.g, nameColor.b);
        pdf.text(participant?.name || 'Unknown', 148.5, 95, { align: 'center' });

        // Ticket number
        if (showTicketNumber && participant?.ticket_number) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
          pdf.setTextColor(120, 120, 120);
          pdf.text(`No. Tiket: ${participant.ticket_number}`, 148.5, 103, { align: 'center' });
        }

        // Prize label
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(Math.min(prizeFontSize * 0.58, 14));
        pdf.setTextColor(prizeColor.r, prizeColor.g, prizeColor.b);
        pdf.text(prizeLabelText, 148.5, 118, { align: 'center' });

        // Prize name
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(Math.min(prizeFontSize * 0.92, 22));
        pdf.setTextColor(titleColor.r, titleColor.g, titleColor.b);
        pdf.text(prize?.name || 'Unknown Prize', 148.5, 132, { align: 'center' });

        // Category badge
        if (showCategory) {
          const categoryLabel = prize?.category === 'grand_prize' ? 'Grand Prize' : 
                               prize?.category === 'utama' ? 'Hadiah Utama' : 'Hadiah Hiburan';
          pdf.setFontSize(12);
          pdf.setTextColor(120, 120, 120);
          pdf.text(`Kategori: ${categoryLabel}`, 148.5, 144, { align: 'center' });
        }

        // Event info
        let yPos = showCategory ? 158 : 152;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        pdf.setTextColor(80, 80, 80);
        pdf.text(`Event: ${event?.name || 'Unknown Event'}`, 148.5, yPos, { align: 'center' });
        
        if (showEventDate) {
          const eventDate = event?.event_date ? 
            format(new Date(event.event_date), 'dd MMMM yyyy', { locale: localeId }) : '-';
          yPos += 8;
          pdf.text(`Tanggal: ${eventDate}`, 148.5, yPos, { align: 'center' });
        }
        
        if (event?.location) {
          yPos += 8;
          pdf.text(`Lokasi: ${event.location}`, 148.5, yPos, { align: 'center' });
        }

        // Footer text
        if (footerText) {
          pdf.setFontSize(Math.min(footerFontSize * 0.71, 10));
          pdf.setTextColor(footerColor.r, footerColor.g, footerColor.b);
          pdf.text(footerText, 148.5, 188, { align: 'center' });
        }

        // Generated timestamp
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 267, 195, { align: 'right' });
      });

      pdf.save(`sertifikat_pemenang_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);

      toast({
        title: 'Export Berhasil',
        description: `${winners.length} sertifikat berhasil diekspor ke PDF`,
      });

    } catch (error) {
      console.error('Error exporting certificates:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal mengekspor sertifikat pemenang',
      });
    } finally {
      setBulkLoading(false);
    }
  }

  function toggleSelectEvent(eventId: string) {
    setSelectedEventIds(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedEventIds.size === paginatedEvents.length) {
      setSelectedEventIds(new Set());
    } else {
      setSelectedEventIds(new Set(paginatedEvents.map(e => e.id)));
    }
  }

  function clearFilters() {
    setSearchQuery('');
    setStatusFilter('all');
    setTierFilter('all');
    setOrgFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setCurrentPage(1);
  }

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = searchQuery === '' ||
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.organization_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
      const matchesTier = tierFilter === 'all' || event.tier === tierFilter;
      const matchesOrg = orgFilter === 'all' || event.organization_id === orgFilter;
      
      const eventDate = new Date(event.event_date);
      const matchesDateFrom = !dateFrom || eventDate >= dateFrom;
      const matchesDateTo = !dateTo || eventDate <= dateTo;

      return matchesSearch && matchesStatus && matchesTier && matchesOrg && matchesDateFrom && matchesDateTo;
    });
  }, [events, searchQuery, statusFilter, tierFilter, orgFilter, dateFrom, dateTo]);

  // Pagination logic
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedEventIds(new Set());
  }, [searchQuery, statusFilter, tierFilter, orgFilter, dateFrom, dateTo]);

  const isAllSelected = paginatedEvents.length > 0 && selectedEventIds.size === paginatedEvents.length;
  const isSomeSelected = selectedEventIds.size > 0;

  // Stats
  const totalRevenue = events.reduce((sum, e) => sum + (e.total_revenue || 0), 0);
  const activeEvents = events.filter(e => e.status === 'active').length;
  const totalParticipants = events.reduce((sum, e) => sum + (e.participant_count || 0), 0);
  const totalWinners = events.reduce((sum, e) => sum + (e.winner_count || 0), 0);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || tierFilter !== 'all' || orgFilter !== 'all' || dateFrom || dateTo;

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
            <h1 className="text-3xl font-bold text-foreground">All Events</h1>
            <p className="text-muted-foreground mt-1">Monitor semua events dari semua organizations</p>
          </div>
          <div className="flex gap-2">
            <AdminCreateEventDialog onEventCreated={fetchEvents} />
            <Button onClick={exportToExcel} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Active Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeEvents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalParticipants.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Total Winners
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
                  placeholder="Cari event, organization, atau lokasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={orgFilter} onValueChange={setOrgFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Organization</SelectItem>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_payment">Pending Payment</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tier</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
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

              <Button variant="outline" onClick={fetchEvents} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            {/* Bulk Actions */}
            {isSomeSelected && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ListChecks className="h-4 w-4" />
                  <span>{selectedEventIds.size} event terpilih</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusChange('active')}
                    disabled={bulkLoading}
                    className="gap-1"
                  >
                    <Play className="h-3 w-3" />
                    Aktifkan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusChange('completed')}
                    disabled={bulkLoading}
                    className="gap-1"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Selesaikan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusChange('cancelled')}
                    disabled={bulkLoading}
                    className="gap-1"
                  >
                    <XCircle className="h-3 w-3" />
                    Batalkan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusChange('draft')}
                    disabled={bulkLoading}
                    className="gap-1"
                  >
                    Draft
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportWinnersCertificates}
                    disabled={bulkLoading}
                    className="gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    Export Sertifikat
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
                    onClick={() => setSelectedEventIds(new Set())}
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

        {/* Events Table */}
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
                  <TableHead>Event</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-center">
                    <Users className="h-4 w-4 inline-block mr-1" />
                    Participants
                  </TableHead>
                  <TableHead className="text-center">
                    <Gift className="h-4 w-4 inline-block mr-1" />
                    Prizes
                  </TableHead>
                  <TableHead className="text-center">
                    <Trophy className="h-4 w-4 inline-block mr-1" />
                    Winners
                  </TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      Tidak ada event ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEvents.map((event) => (
                    <TableRow key={event.id} className={selectedEventIds.has(event.id) ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEventIds.has(event.id)}
                          onCheckedChange={() => toggleSelectEvent(event.id)}
                          aria-label={`Select ${event.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <button
                            onClick={() => router.push(`/event/${event.id}`)}
                            className="font-medium text-left hover:text-primary hover:underline flex items-center gap-1"
                          >
                            {event.name}
                            <ExternalLink className="h-3 w-3 opacity-50" />
                          </button>
                          {event.location && (
                            <div className="text-xs text-muted-foreground">{event.location}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">{event.organization_name}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(event.event_date), 'dd MMM yyyy', { locale: localeId })}
                      </TableCell>
                      <TableCell>{getStatusBadge(event.status)}</TableCell>
                      <TableCell>{getTierBadge(event.tier)}</TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => router.push(`/event/${event.id}/participants`)}
                          className="hover:text-primary hover:underline"
                        >
                          {event.participant_count}
                        </button>
                      </TableCell>
                      <TableCell className="text-center">{event.prize_count}</TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => router.push(`/event/${event.id}/winners`)}
                          className="hover:text-primary hover:underline"
                        >
                          {event.winner_count}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {event.total_revenue && event.total_revenue > 0 ? formatCurrency(event.total_revenue) : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/event/${event.id}`)}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Buka Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setDetailEventId(event.id);
                                setDetailOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditEventId(event.id);
                                setEditOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicateEvent(event)}
                              disabled={duplicateLoading === event.id}
                            >
                              {duplicateLoading === event.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Copy className="h-4 w-4 mr-2" />
                              )}
                              Duplikasi
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setTemplateEventId(event.id);
                                setTemplateEventName(event.name);
                                setTemplateOpen(true);
                              }}
                            >
                              <Palette className="h-4 w-4 mr-2" />
                              Template Sertifikat
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setReportEventId(event.id);
                                setReportEventName(event.name);
                                setReportOpen(true);
                              }}
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Export Laporan PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {/* Quick Status Actions */}
                            {event.status === 'draft' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(event.id, 'active')}
                                className="text-primary"
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Aktifkan Event
                              </DropdownMenuItem>
                            )}
                            {event.status === 'active' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(event.id, 'completed')}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Selesaikan Event
                              </DropdownMenuItem>
                            )}
                            {(event.status === 'draft' || event.status === 'active') && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(event.id, 'cancelled')}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Batalkan Event
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setDeleteEventId(event.id);
                                setDeleteEventName(event.name);
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                  Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredEvents.length)} dari {filteredEvents.length} event
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

        {/* Dialogs */}
        <AdminEventDetailDialog
          eventId={detailEventId}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
        <AdminEditEventDialog
          eventId={editEventId}
          open={editOpen}
          onOpenChange={setEditOpen}
          onEventUpdated={fetchEvents}
        />
        <AdminDeleteEventDialog
          eventId={deleteEventId}
          eventName={deleteEventName}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onEventDeleted={fetchEvents}
        />
        
        {/* Certificate Template Dialog */}
        {templateEventId && (
          <CertificateTemplateDialog
            open={templateOpen}
            onOpenChange={setTemplateOpen}
            eventId={templateEventId}
            eventName={templateEventName}
          />
        )}

        {/* Event Report PDF Dialog */}
        {reportEventId && (
          <EventReportPDFDialog
            open={reportOpen}
            onOpenChange={setReportOpen}
            eventId={reportEventId}
            eventName={reportEventName}
          />
        )}

        <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus {selectedEventIds.size} Event?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini akan menghapus {selectedEventIds.size} event beserta semua data terkait
                (peserta, hadiah, pemenang, dll). Tindakan ini tidak dapat dibatalkan.
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
