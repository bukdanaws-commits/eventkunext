'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Send, 
  Eye,
  RefreshCw,
  Banknote,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface BankSetting {
  id: string;
  organization_id: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_holder_name: string;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  organizations?: {
    name: string;
  };
}

interface Payout {
  id: string;
  event_id: string;
  organization_id: string;
  participant_payment_id: string;
  gross_amount: number;
  platform_fee: number;
  platform_fee_percentage: number;
  net_amount: number;
  status: string;
  iris_reference_no: string | null;
  iris_status: string | null;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
  events?: {
    name: string;
  };
  organizations?: {
    name: string;
  };
}

export default function AdminEOPayouts() {
  const { toast } = useToast();
  const [bankSettings, setBankSettings] = useState<BankSetting[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [selectedBank, setSelectedBank] = useState<BankSetting | null>(null);
  const [showBankDialog, setShowBankDialog] = useState(false);
  
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [payoutNotes, setPayoutNotes] = useState('');
  const [manualReference, setManualReference] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchBankSettings(), fetchPayouts()]);
    setLoading(false);
  };

  const fetchBankSettings = async () => {
    const { data, error } = await supabase
      .from('eo_bank_settings')
      .select(`
        *,
        organizations (name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setBankSettings(data || []);
    }
  };

  const fetchPayouts = async () => {
    const { data, error } = await supabase
      .from('eo_payouts')
      .select(`
        *,
        events (name),
        organizations (name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setPayouts(data || []);
    }
  };

  const handleVerifyBank = async (bankId: string, verify: boolean) => {
    setProcessingId(bankId);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('eo_bank_settings')
      .update({
        is_verified: verify,
        verified_at: verify ? new Date().toISOString() : null,
        verified_by: verify ? user?.id : null
      })
      .eq('id', bankId);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ 
        title: verify ? 'Rekening Diverifikasi' : 'Verifikasi Dibatalkan',
        description: verify ? 'Rekening bank EO telah diverifikasi' : 'Verifikasi rekening telah dibatalkan'
      });
      fetchBankSettings();
    }
    
    setProcessingId(null);
    setShowBankDialog(false);
  };

  const handleProcessPayout = async (payoutId: string) => {
    setProcessingId(payoutId);
    
    try {
      const response = await supabase.functions.invoke('process-eo-payout', {
        body: { payout_id: payoutId }
      });
      
      if (response.error) throw response.error;
      
      toast({ 
        title: 'Payout Diproses',
        description: response.data.message || 'Payout sedang diproses'
      });
      
      fetchPayouts();
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message 
      });
    }
    
    setProcessingId(null);
  };

  const handleManualPayout = async () => {
    if (!selectedPayout) return;
    
    setProcessingId(selectedPayout.id);
    
    const { error } = await supabase
      .from('eo_payouts')
      .update({
        status: 'completed',
        iris_status: 'manual',
        iris_reference_no: manualReference || `MANUAL-${Date.now()}`,
        notes: payoutNotes,
        paid_at: new Date().toISOString()
      })
      .eq('id', selectedPayout.id);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ 
        title: 'Payout Manual Berhasil',
        description: 'Status payout telah diupdate menjadi completed'
      });
      fetchPayouts();
    }
    
    setProcessingId(null);
    setShowPayoutDialog(false);
    setPayoutNotes('');
    setManualReference('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0 
    }).format(amount);
  };

  const pendingPayouts = payouts.filter(p => p.status === 'pending');
  const completedPayouts = payouts.filter(p => p.status === 'completed');
  const unverifiedBanks = bankSettings.filter(b => !b.is_verified);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">EO Payouts Management</h1>
            <p className="text-muted-foreground">Verifikasi rekening bank dan kelola payout ke Event Organizer</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Verifikasi</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unverifiedBanks.length}</div>
              <p className="text-xs text-muted-foreground">Rekening menunggu verifikasi</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
              <Banknote className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPayouts.length}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(pendingPayouts.reduce((sum, p) => sum + p.net_amount, 0))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedPayouts.length}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(completedPayouts.reduce((sum, p) => sum + p.net_amount, 0))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Fee</CardTitle>
              <Building2 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(completedPayouts.reduce((sum, p) => sum + p.platform_fee, 0))}
              </div>
              <p className="text-xs text-muted-foreground">Platform fee collected</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="banks">
          <TabsList>
            <TabsTrigger value="banks">
              Rekening Bank {unverifiedBanks.length > 0 && `(${unverifiedBanks.length})`}
            </TabsTrigger>
            <TabsTrigger value="payouts">
              Payouts {pendingPayouts.length > 0 && `(${pendingPayouts.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="banks" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Rekening Bank EO</CardTitle>
                <CardDescription>Verifikasi rekening bank sebelum payout dapat diproses</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : bankSettings.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Belum ada rekening bank terdaftar</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organisasi</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>No. Rekening</TableHead>
                        <TableHead>Atas Nama</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bankSettings.map((bank) => (
                        <TableRow key={bank.id}>
                          <TableCell className="font-medium">
                            {bank.organizations?.name || '-'}
                          </TableCell>
                          <TableCell>{bank.bank_name} ({bank.bank_code})</TableCell>
                          <TableCell className="font-mono">{bank.account_number}</TableCell>
                          <TableCell>{bank.account_holder_name}</TableCell>
                          <TableCell>
                            {bank.is_verified ? (
                              <Badge className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedBank(bank);
                                  setShowBankDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {!bank.is_verified && (
                                <Button
                                  size="sm"
                                  onClick={() => handleVerifyBank(bank.id, true)}
                                  disabled={processingId === bank.id}
                                >
                                  {processingId === bank.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
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

          <TabsContent value="payouts" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Payout</CardTitle>
                <CardDescription>Kelola disbursement ke Event Organizer</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : payouts.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Belum ada payout</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Organisasi</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">Fee</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell>
                            {format(new Date(payout.created_at), 'dd MMM yyyy', { locale: id })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {payout.events?.name || '-'}
                          </TableCell>
                          <TableCell>{payout.organizations?.name || '-'}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(payout.gross_amount)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            -{formatCurrency(payout.platform_fee)} ({payout.platform_fee_percentage}%)
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payout.net_amount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(payout.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {payout.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleProcessPayout(payout.id)}
                                    disabled={processingId === payout.id}
                                  >
                                    {processingId === payout.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Send className="h-4 w-4 mr-1" />
                                        Process
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedPayout(payout);
                                      setShowPayoutDialog(true);
                                    }}
                                  >
                                    Manual
                                  </Button>
                                </>
                              )}
                              {payout.status === 'completed' && payout.iris_reference_no && (
                                <span className="text-xs text-muted-foreground font-mono">
                                  {payout.iris_reference_no}
                                </span>
                              )}
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
        </Tabs>

        {/* Bank Detail Dialog */}
        <Dialog open={showBankDialog} onOpenChange={setShowBankDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detail Rekening Bank</DialogTitle>
              <DialogDescription>Informasi rekening bank EO</DialogDescription>
            </DialogHeader>
            {selectedBank && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Organisasi</Label>
                    <p className="font-medium">{selectedBank.organizations?.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <p>
                      {selectedBank.is_verified ? (
                        <Badge className="bg-green-500">Verified</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Bank</Label>
                    <p className="font-medium">{selectedBank.bank_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Kode Bank</Label>
                    <p className="font-mono">{selectedBank.bank_code}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Nomor Rekening</Label>
                    <p className="font-mono text-lg">{selectedBank.account_number}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Atas Nama</Label>
                    <p className="font-medium">{selectedBank.account_holder_name}</p>
                  </div>
                </div>
                {selectedBank.verified_at && (
                  <div className="pt-2 border-t">
                    <Label className="text-muted-foreground">Diverifikasi pada</Label>
                    <p>{format(new Date(selectedBank.verified_at), 'dd MMMM yyyy HH:mm', { locale: id })}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              {selectedBank && !selectedBank.is_verified && (
                <Button 
                  onClick={() => handleVerifyBank(selectedBank.id, true)}
                  disabled={processingId === selectedBank.id}
                >
                  {processingId === selectedBank.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Verifikasi
                </Button>
              )}
              {selectedBank && selectedBank.is_verified && (
                <Button 
                  variant="destructive"
                  onClick={() => handleVerifyBank(selectedBank.id, false)}
                  disabled={processingId === selectedBank.id}
                >
                  {processingId === selectedBank.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Batalkan Verifikasi
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manual Payout Dialog */}
        <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payout Manual</DialogTitle>
              <DialogDescription>
                Tandai payout sebagai completed jika sudah diproses secara manual
              </DialogDescription>
            </DialogHeader>
            {selectedPayout && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Event:</div>
                    <div className="font-medium">{selectedPayout.events?.name}</div>
                    <div>Organisasi:</div>
                    <div className="font-medium">{selectedPayout.organizations?.name}</div>
                    <div>Net Amount:</div>
                    <div className="font-medium">{formatCurrency(selectedPayout.net_amount)}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Nomor Referensi (opsional)</Label>
                  <Input
                    id="reference"
                    value={manualReference}
                    onChange={(e) => setManualReference(e.target.value)}
                    placeholder="Contoh: TRF-123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                    placeholder="Catatan payout manual..."
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
                Batal
              </Button>
              <Button 
                onClick={handleManualPayout}
                disabled={processingId === selectedPayout?.id}
              >
                {processingId === selectedPayout?.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Tandai Selesai
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
