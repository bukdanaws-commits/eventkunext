'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader2, Search, FileText, User, Calendar, CreditCard, Settings, Eye, RefreshCw, Download, FileSpreadsheet, FileDown } from 'lucide-react';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { SessionErrorAlert } from '@/components/admin/SessionErrorAlert';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { Json } from '@/integrations/supabase/types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Json;
  ip_address: string | null;
  created_at: string;
  admin_email?: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  user_role_changed: { label: 'Role Changed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  user_suspended: { label: 'User Suspended', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  refund_processed: { label: 'Refund Processed', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  event_status_changed: { label: 'Event Status Changed', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  tier_changed: { label: 'Tier Changed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  commission_paid: { label: 'Commission Paid', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  settings_updated: { label: 'Settings Updated', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300' },
  user_deleted: { label: 'User Deleted', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
};

const TARGET_ICONS: Record<string, React.ElementType> = {
  user: User,
  event: Calendar,
  payment: CreditCard,
  commission: CreditCard,
  settings: Settings,
};

export default function AdminAuditLog() {
  const { isRefreshing, sessionError, clearSessionError, refreshSession, handleApiError } = useSessionRefresh();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [targetFilter, setTargetFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, targetFilter, page]);

  async function fetchLogs() {
    setLoading(true);
    
    try {
      let query = supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (targetFilter !== 'all') {
        query = query.eq('target_type', targetFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch admin emails
      if (data && data.length > 0) {
        const adminIds = [...new Set(data.map(log => log.admin_user_id))];
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, full_name')
          .in('user_id', adminIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
        
        const logsWithAdmin = data.map(log => ({
          ...log,
          admin_email: profileMap.get(log.admin_user_id) || 'Unknown Admin'
        }));

        if (page === 1) {
          setLogs(logsWithAdmin);
        } else {
          setLogs(prev => [...prev, ...logsWithAdmin]);
        }

        setHasMore(data.length === pageSize);
      } else {
        if (page === 1) {
          setLogs([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.target_type.toLowerCase().includes(searchLower) ||
      log.admin_email?.toLowerCase().includes(searchLower) ||
      log.target_id?.toLowerCase().includes(searchLower)
    );
  });

  const resetFilters = () => {
    setSearchQuery('');
    setActionFilter('all');
    setTargetFilter('all');
    setPage(1);
  };

  const exportToExcel = () => {
    const exportData = filteredLogs.map(log => ({
      ID: log.id,
      Waktu: format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss', { locale: localeId }),
      Admin: log.admin_email || 'Unknown',
      Action: ACTION_LABELS[log.action]?.label || log.action,
      'Target Type': log.target_type,
      'Target ID': log.target_id || '-',
      Details: typeof log.details === 'object' ? JSON.stringify(log.details) : log.details || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Logs');
    XLSX.writeFile(wb, `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Audit Log Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm', { locale: localeId })}`, 14, 30);

    // Table data
    const tableData = filteredLogs.map(log => [
      format(new Date(log.created_at), 'dd/MM/yy HH:mm'),
      log.admin_email || 'Unknown',
      ACTION_LABELS[log.action]?.label || log.action,
      log.target_type,
      log.target_id ? log.target_id.slice(0, 8) + '...' : '-',
    ]);

    autoTable(doc, {
      head: [['Waktu', 'Admin', 'Action', 'Target', 'ID']],
      body: tableData,
      startY: 38,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [147, 51, 234] },
    });

    doc.save(`audit-logs-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const getActionBadge = (action: string) => {
    const actionInfo = ACTION_LABELS[action] || { label: action, color: 'bg-gray-100 text-gray-700' };
    return (
      <Badge className={actionInfo.color}>
        {actionInfo.label}
      </Badge>
    );
  };

  const getTargetIcon = (targetType: string) => {
    const Icon = TARGET_ICONS[targetType] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const formatDetails = (details: Json) => {
    if (!details) return 'No details';
    if (typeof details === 'string') return details;
    return JSON.stringify(details, null, 2);
  };

  if (loading && page === 1) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit Log</h1>
          <p className="text-muted-foreground mt-1">Lacak semua aktivitas admin di platform</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari berdasarkan action, target, atau admin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Action</SelectItem>
                  <SelectItem value="user_role_changed">Role Changed</SelectItem>
                  <SelectItem value="user_suspended">User Suspended</SelectItem>
                  <SelectItem value="refund_processed">Refund Processed</SelectItem>
                  <SelectItem value="event_status_changed">Event Status Changed</SelectItem>
                  <SelectItem value="tier_changed">Tier Changed</SelectItem>
                  <SelectItem value="commission_paid">Commission Paid</SelectItem>
                  <SelectItem value="settings_updated">Settings Updated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={targetFilter} onValueChange={(v) => { setTargetFilter(v); setPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter Target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Target</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="commission">Commission</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={resetFilters}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export ke Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export ke PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Logs</CardTitle>
            <CardDescription>
              {filteredLogs.length} log ditemukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Target ID</TableHead>
                    <TableHead className="text-right">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Memuat...
                          </div>
                        ) : (
                          'Tidak ada audit log ditemukan'
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="text-sm">
                            {format(new Date(log.created_at), 'dd MMM yyyy', { locale: localeId })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'HH:mm:ss')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                              <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="text-sm font-medium">{log.admin_email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getActionBadge(log.action)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTargetIcon(log.target_type)}
                            <span className="capitalize">{log.target_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {log.target_id ? log.target_id.slice(0, 8) + '...' : '-'}
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {hasMore && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Memuat...
                    </>
                  ) : (
                    'Muat Lebih Banyak'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detail Audit Log</DialogTitle>
              <DialogDescription>
                Informasi lengkap tentang aktivitas admin
              </DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID</label>
                    <p className="font-mono text-sm">{selectedLog.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Waktu</label>
                    <p className="text-sm">
                      {format(new Date(selectedLog.created_at), 'dd MMMM yyyy, HH:mm:ss', { locale: localeId })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Admin</label>
                    <p className="text-sm">{selectedLog.admin_email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Action</label>
                    <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Target Type</label>
                    <p className="text-sm capitalize">{selectedLog.target_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Target ID</label>
                    <p className="font-mono text-sm">{selectedLog.target_id || '-'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Details</label>
                  <ScrollArea className="h-48 mt-2">
                    <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
                      {formatDetails(selectedLog.details)}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
