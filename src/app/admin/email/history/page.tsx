'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Mail, CheckCircle, XCircle, Clock, Search, RefreshCw, Eye } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EmailLog {
  id: string;
  email_type: string;
  recipient_email: string;
  subject: string;
  status: string;
  error_message: string | null;
  related_id: string | null;
  related_type: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const AdminEmailHistory = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Using raw query since email_logs table is new and types not yet generated
      const { data, error } = await supabase
        .from('email_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      
      let filteredData = ((data || []) as unknown) as EmailLog[];
      
      if (statusFilter !== "all") {
        filteredData = filteredData.filter(l => l.status === statusFilter);
      }

      if (typeFilter !== "all") {
        filteredData = filteredData.filter(l => l.email_type === typeFilter);
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredData = filteredData.filter(l => 
          l.recipient_email?.toLowerCase().includes(term) ||
          l.subject?.toLowerCase().includes(term)
        );
      }

      setLogs(filteredData);

      // Calculate stats from all data
      const allLogs = ((data || []) as unknown) as EmailLog[];
      setStats({
        total: allLogs.length,
        sent: allLogs.filter(l => l.status === 'sent').length,
        failed: allLogs.filter(l => l.status === 'failed').length,
        pending: allLogs.filter(l => l.status === 'pending').length
      });
    } catch (error) {
      console.error('Error fetching email logs:', error);
      toast.error("Gagal memuat riwayat email");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Terkirim</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Gagal</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      'payment_verification': { label: 'Verifikasi Pembayaran', variant: 'default' },
      'payment_reminder': { label: 'Pengingat Pembayaran', variant: 'secondary' },
      'winner_notification': { label: 'Notifikasi Pemenang', variant: 'default' },
      'event_reminder': { label: 'Pengingat Event', variant: 'secondary' },
      'qr_code': { label: 'QR Code', variant: 'outline' },
      'broadcast': { label: 'Broadcast', variant: 'secondary' },
      'ticket_confirmation': { label: 'Konfirmasi Tiket', variant: 'default' },
      'commission': { label: 'Komisi', variant: 'outline' },
    };

    const config = typeLabels[type] || { label: type, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const uniqueTypes = [...new Set(logs.map(l => l.email_type))];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Riwayat Email</h1>
            <p className="text-muted-foreground">Tracking status pengiriman email ke user</p>
          </div>
          <Button onClick={fetchLogs} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Email</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Terkirim</p>
                  <p className="text-2xl font-bold text-green-500">{stats.sent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-destructive/10">
                  <XCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gagal</p>
                  <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari email atau subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="sent">Terkirim</SelectItem>
                  <SelectItem value="failed">Gagal</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Tipe Email" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Email Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Log Email ({logs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada riwayat email</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Penerima</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(log.created_at), "dd MMM yyyy HH:mm", { locale: idLocale })}
                        </TableCell>
                        <TableCell>{getTypeBadge(log.email_type)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {log.recipient_email}
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate">
                          {log.subject}
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detail Email</DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Waktu Kirim</p>
                    <p className="font-medium">
                      {format(new Date(selectedLog.created_at), "dd MMMM yyyy HH:mm:ss", { locale: idLocale })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipe Email</p>
                  <div className="mt-1">{getTypeBadge(selectedLog.email_type)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Penerima</p>
                  <p className="font-medium">{selectedLog.recipient_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <p className="font-medium">{selectedLog.subject}</p>
                </div>
                {selectedLog.error_message && (
                  <div>
                    <p className="text-sm text-muted-foreground">Error Message</p>
                    <p className="text-destructive text-sm bg-destructive/10 p-2 rounded">
                      {selectedLog.error_message}
                    </p>
                  </div>
                )}
                {selectedLog.related_type && selectedLog.related_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">Related</p>
                    <p className="font-medium">{selectedLog.related_type}: {selectedLog.related_id}</p>
                  </div>
                )}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Metadata</p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminEmailHistory;
