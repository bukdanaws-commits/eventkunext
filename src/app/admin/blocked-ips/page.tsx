'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Shield, Plus, Trash2, Edit, Search, Ban, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_by: string;
  blocked_at: string;
  expires_at: string | null;
  is_active: boolean;
  notes: string | null;
}

export default function AdminBlockedIPs() {
  const { user } = useAuth();
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIP, setEditingIP] = useState<BlockedIP | null>(null);
  
  // Form states
  const [formIpAddress, setFormIpAddress] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchBlockedIPs();
  }, []);

  const fetchBlockedIPs = async () => {
    try {
      const { data, error } = await supabase
        .from('blocked_ips')
        .select('*')
        .order('blocked_at', { ascending: false });

      if (error) throw error;
      setBlockedIPs((data as BlockedIP[]) || []);
    } catch (error) {
      console.error('Error fetching blocked IPs:', error);
      toast.error('Gagal memuat daftar IP yang diblokir');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIP = async () => {
    if (!formIpAddress || !formReason) {
      toast.error('IP address dan alasan wajib diisi');
      return;
    }

    // Validate IP format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(formIpAddress)) {
      toast.error('Format IP address tidak valid');
      return;
    }

    setFormSubmitting(true);
    try {
      const { error } = await supabase.from('blocked_ips').insert({
        ip_address: formIpAddress,
        reason: formReason,
        notes: formNotes || null,
        expires_at: formExpiresAt || null,
        blocked_by: user?.id,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('IP address ini sudah ada dalam daftar');
        } else {
          throw error;
        }
        return;
      }

      toast.success('IP berhasil diblokir');
      resetForm();
      setIsAddDialogOpen(false);
      fetchBlockedIPs();
    } catch (error) {
      console.error('Error blocking IP:', error);
      toast.error('Gagal memblokir IP');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateIP = async () => {
    if (!editingIP) return;

    setFormSubmitting(true);
    try {
      const { error } = await supabase
        .from('blocked_ips')
        .update({
          reason: formReason,
          notes: formNotes || null,
          expires_at: formExpiresAt || null,
        })
        .eq('id', editingIP.id);

      if (error) throw error;

      toast.success('Data IP berhasil diperbarui');
      resetForm();
      setEditingIP(null);
      fetchBlockedIPs();
    } catch (error) {
      console.error('Error updating IP:', error);
      toast.error('Gagal memperbarui data IP');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleActive = async (ip: BlockedIP) => {
    try {
      const { error } = await supabase
        .from('blocked_ips')
        .update({ is_active: !ip.is_active })
        .eq('id', ip.id);

      if (error) throw error;

      toast.success(ip.is_active ? 'IP berhasil diaktifkan kembali' : 'IP berhasil diblokir');
      fetchBlockedIPs();
    } catch (error) {
      console.error('Error toggling IP status:', error);
      toast.error('Gagal mengubah status IP');
    }
  };

  const handleDeleteIP = async (id: string) => {
    try {
      const { error } = await supabase.from('blocked_ips').delete().eq('id', id);

      if (error) throw error;

      toast.success('IP berhasil dihapus dari daftar');
      fetchBlockedIPs();
    } catch (error) {
      console.error('Error deleting IP:', error);
      toast.error('Gagal menghapus IP');
    }
  };

  const resetForm = () => {
    setFormIpAddress('');
    setFormReason('');
    setFormNotes('');
    setFormExpiresAt('');
  };

  const openEditDialog = (ip: BlockedIP) => {
    setEditingIP(ip);
    setFormIpAddress(ip.ip_address);
    setFormReason(ip.reason);
    setFormNotes(ip.notes || '');
    setFormExpiresAt(ip.expires_at ? ip.expires_at.split('T')[0] : '');
  };

  const filteredIPs = blockedIPs.filter(
    (ip) =>
      ip.ip_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ip.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = blockedIPs.filter((ip) => ip.is_active).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Kelola IP yang Diblokir
            </h1>
            <p className="text-muted-foreground mt-1">
              Blokir IP mencurigakan untuk mencegah akses tidak sah
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Blokir IP Baru
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Blokir IP Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="ip_address">IP Address *</Label>
                  <Input
                    id="ip_address"
                    placeholder="Contoh: 192.168.1.1"
                    value={formIpAddress}
                    onChange={(e) => setFormIpAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Alasan Blokir *</Label>
                  <Input
                    id="reason"
                    placeholder="Contoh: Aktivitas mencurigakan, brute force, dll"
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires_at">Blokir Sampai (Opsional)</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Kosongkan untuk blokir permanen
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan (Opsional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Catatan tambahan..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Batal</Button>
                </DialogClose>
                <Button onClick={handleAddIP} disabled={formSubmitting}>
                  {formSubmitting ? 'Menyimpan...' : 'Blokir IP'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total IP Diblokir</CardTitle>
              <Ban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{blockedIPs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blokir Aktif</CardTitle>
              <Shield className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{activeCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blokir Nonaktif</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{blockedIPs.length - activeCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar IP yang Diblokir</CardTitle>
            <CardDescription>
              Kelola IP address yang diblokir dari mengakses sistem
            </CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari IP address atau alasan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Memuat data...
              </div>
            ) : filteredIPs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery
                  ? 'Tidak ada IP yang cocok dengan pencarian'
                  : 'Belum ada IP yang diblokir'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Tanggal Blokir</TableHead>
                    <TableHead>Berakhir</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIPs.map((ip) => (
                    <TableRow key={ip.id}>
                      <TableCell className="font-mono font-medium">
                        {ip.ip_address}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{ip.reason}</p>
                          {ip.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {ip.notes}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(ip.blocked_at), 'dd MMM yyyy HH:mm', {
                          locale: id,
                        })}
                      </TableCell>
                      <TableCell>
                        {ip.expires_at
                          ? format(new Date(ip.expires_at), 'dd MMM yyyy', {
                              locale: id,
                            })
                          : 'Permanen'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={ip.is_active}
                            onCheckedChange={() => handleToggleActive(ip)}
                          />
                          <Badge variant={ip.is_active ? 'destructive' : 'secondary'}>
                            {ip.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog
                            open={editingIP?.id === ip.id}
                            onOpenChange={(open) => {
                              if (!open) {
                                setEditingIP(null);
                                resetForm();
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openEditDialog(ip)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Blokir IP</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>IP Address</Label>
                                  <Input value={formIpAddress} disabled />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_reason">Alasan Blokir *</Label>
                                  <Input
                                    id="edit_reason"
                                    value={formReason}
                                    onChange={(e) => setFormReason(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_expires_at">
                                    Blokir Sampai (Opsional)
                                  </Label>
                                  <Input
                                    id="edit_expires_at"
                                    type="date"
                                    value={formExpiresAt}
                                    onChange={(e) => setFormExpiresAt(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_notes">Catatan (Opsional)</Label>
                                  <Textarea
                                    id="edit_notes"
                                    value={formNotes}
                                    onChange={(e) => setFormNotes(e.target.value)}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Batal</Button>
                                </DialogClose>
                                <Button onClick={handleUpdateIP} disabled={formSubmitting}>
                                  {formSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus IP dari Daftar?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  IP {ip.ip_address} akan dihapus dari daftar blokir. IP
                                  ini akan dapat mengakses sistem kembali.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteIP(ip.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
