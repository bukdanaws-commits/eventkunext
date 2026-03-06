'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Trash2, DollarSign, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuditLog } from '@/hooks/useAdminAuditLog';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { SessionErrorAlert } from '@/components/admin/SessionErrorAlert';
import { PushSubscriptionCard } from '@/components/admin/PushSubscriptionCard';
import type { Database } from '@/integrations/supabase/types';

type PricingTier = Database['public']['Tables']['pricing_tiers']['Row'];
type AffiliateTier = Database['public']['Tables']['affiliate_tiers']['Row'];
type EventTier = Database['public']['Enums']['event_tier'];

export default function AdminSettings() {
  const { toast } = useToast();
  const { logAction } = useAdminAuditLog();
  const { isRefreshing, sessionError, clearSessionError, refreshSession, handleApiError } = useSessionRefresh();
  const [loading, setLoading] = useState(true);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [affiliateTiers, setAffiliateTiers] = useState<AffiliateTier[]>([]);
  
  // Pricing tier dialog
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<PricingTier | null>(null);
  const [pricingForm, setPricingForm] = useState({
    name: '',
    tier: 'basic' as EventTier,
    price: 0,
    max_participants: 100,
    max_hiburan: 10,
    max_utama: 5,
    max_grand_prize: 1,
    form_addon_price: 0,
  });
  
  // Affiliate tier dialog
  const [affiliateDialogOpen, setAffiliateDialogOpen] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<AffiliateTier | null>(null);
  const [affiliateForm, setAffiliateForm] = useState({
    name: '',
    commission_percentage: 10,
    min_conversions: 0,
  });
  
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'pricing' | 'affiliate'; id: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [pricingRes, affiliateRes] = await Promise.all([
        supabase.from('pricing_tiers').select('*').order('price', { ascending: true }),
        supabase.from('affiliate_tiers').select('*').order('min_conversions', { ascending: true }),
      ]);

      if (pricingRes.data) setPricingTiers(pricingRes.data);
      if (affiliateRes.data) setAffiliateTiers(affiliateRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const openPricingDialog = (tier?: PricingTier) => {
    if (tier) {
      setEditingPricing(tier);
      setPricingForm({
        name: tier.name,
        tier: tier.tier,
        price: tier.price,
        max_participants: tier.max_participants,
        max_hiburan: tier.max_hiburan,
        max_utama: tier.max_utama,
        max_grand_prize: tier.max_grand_prize,
        form_addon_price: tier.form_addon_price,
      });
    } else {
      setEditingPricing(null);
      setPricingForm({
        name: '',
        tier: 'basic',
        price: 0,
        max_participants: 100,
        max_hiburan: 10,
        max_utama: 5,
        max_grand_prize: 1,
        form_addon_price: 0,
      });
    }
    setPricingDialogOpen(true);
  };

  const openAffiliateDialog = (tier?: AffiliateTier) => {
    if (tier) {
      setEditingAffiliate(tier);
      setAffiliateForm({
        name: tier.name,
        commission_percentage: tier.commission_percentage,
        min_conversions: tier.min_conversions,
      });
    } else {
      setEditingAffiliate(null);
      setAffiliateForm({
        name: '',
        commission_percentage: 10,
        min_conversions: 0,
      });
    }
    setAffiliateDialogOpen(true);
  };

  const savePricingTier = async () => {
    setSaving(true);
    try {
      if (editingPricing) {
        const { error } = await supabase
          .from('pricing_tiers')
          .update(pricingForm)
          .eq('id', editingPricing.id);

        if (error) throw error;

        await logAction({
          action: 'settings_updated',
          targetType: 'settings',
          targetId: editingPricing.id,
          details: { type: 'pricing_tier', changes: pricingForm },
        });

        toast({ title: 'Pricing tier berhasil diupdate' });
      } else {
        const { error } = await supabase
          .from('pricing_tiers')
          .insert([pricingForm]);

        if (error) throw error;

        await logAction({
          action: 'settings_updated',
          targetType: 'settings',
          details: { type: 'pricing_tier_created', data: pricingForm },
        });

        toast({ title: 'Pricing tier berhasil ditambahkan' });
      }

      fetchData();
      setPricingDialogOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const saveAffiliateTier = async () => {
    setSaving(true);
    try {
      if (editingAffiliate) {
        const { error } = await supabase
          .from('affiliate_tiers')
          .update(affiliateForm)
          .eq('id', editingAffiliate.id);

        if (error) throw error;

        await logAction({
          action: 'settings_updated',
          targetType: 'settings',
          targetId: editingAffiliate.id,
          details: { type: 'affiliate_tier', changes: affiliateForm },
        });

        toast({ title: 'Affiliate tier berhasil diupdate' });
      } else {
        const { error } = await supabase
          .from('affiliate_tiers')
          .insert([affiliateForm]);

        if (error) throw error;

        await logAction({
          action: 'settings_updated',
          targetType: 'settings',
          details: { type: 'affiliate_tier_created', data: affiliateForm },
        });

        toast({ title: 'Affiliate tier berhasil ditambahkan' });
      }

      fetchData();
      setAffiliateDialogOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    setSaving(true);
    try {
      if (itemToDelete.type === 'pricing') {
        const { error } = await supabase
          .from('pricing_tiers')
          .delete()
          .eq('id', itemToDelete.id);

        if (error) throw error;
        toast({ title: 'Pricing tier berhasil dihapus' });
      } else {
        const { error } = await supabase
          .from('affiliate_tiers')
          .delete()
          .eq('id', itemToDelete.id);

        if (error) throw error;
        toast({ title: 'Affiliate tier berhasil dihapus' });
      }

      await logAction({
        action: 'settings_updated',
        targetType: 'settings',
        targetId: itemToDelete.id,
        details: { type: `${itemToDelete.type}_tier_deleted` },
      });

      fetchData();
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold text-foreground">Admin Settings</h1>
          <p className="text-muted-foreground mt-1">Kelola pricing tiers, affiliate commission rates, dan notifikasi</p>
        </div>

        {/* Push Notifications */}
        <PushSubscriptionCard />

        {/* Pricing Tiers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Pricing Tiers
              </CardTitle>
              <CardDescription>Kelola harga dan limit untuk setiap tier</CardDescription>
            </div>
            <Button onClick={() => openPricingDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Tier
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Max Peserta</TableHead>
                    <TableHead>Hiburan</TableHead>
                    <TableHead>Utama</TableHead>
                    <TableHead>Grand Prize</TableHead>
                    <TableHead>Form Addon</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingTiers.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell className="font-medium">{tier.name}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 capitalize">
                          {tier.tier}
                        </span>
                      </TableCell>
                      <TableCell>{formatCurrency(tier.price)}</TableCell>
                      <TableCell>{tier.max_participants.toLocaleString()}</TableCell>
                      <TableCell>{tier.max_hiburan}</TableCell>
                      <TableCell>{tier.max_utama}</TableCell>
                      <TableCell>{tier.max_grand_prize}</TableCell>
                      <TableCell>{formatCurrency(tier.form_addon_price)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openPricingDialog(tier)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setItemToDelete({ type: 'pricing', id: tier.id });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Affiliate Tiers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-blue-600" />
                Affiliate Commission Tiers
              </CardTitle>
              <CardDescription>Kelola persentase komisi affiliate berdasarkan jumlah konversi</CardDescription>
            </div>
            <Button onClick={() => openAffiliateDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Tier
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Tier</TableHead>
                    <TableHead>Komisi (%)</TableHead>
                    <TableHead>Min. Konversi</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliateTiers.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell className="font-medium">{tier.name}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {tier.commission_percentage}%
                        </span>
                      </TableCell>
                      <TableCell>{tier.min_conversions} konversi</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openAffiliateDialog(tier)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setItemToDelete({ type: 'affiliate', id: tier.id });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Tier Dialog */}
        <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPricing ? 'Edit Pricing Tier' : 'Tambah Pricing Tier'}
              </DialogTitle>
              <DialogDescription>
                {editingPricing ? 'Update detail pricing tier' : 'Tambahkan pricing tier baru'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nama</Label>
                <Input
                  value={pricingForm.name}
                  onChange={(e) => setPricingForm({ ...pricingForm, name: e.target.value })}
                  placeholder="Basic Plan"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Harga (IDR)</Label>
                  <Input
                    type="number"
                    value={pricingForm.price}
                    onChange={(e) => setPricingForm({ ...pricingForm, price: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Form Addon (IDR)</Label>
                  <Input
                    type="number"
                    value={pricingForm.form_addon_price}
                    onChange={(e) => setPricingForm({ ...pricingForm, form_addon_price: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Max Peserta</Label>
                <Input
                  type="number"
                  value={pricingForm.max_participants}
                  onChange={(e) => setPricingForm({ ...pricingForm, max_participants: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Hiburan</Label>
                  <Input
                    type="number"
                    value={pricingForm.max_hiburan}
                    onChange={(e) => setPricingForm({ ...pricingForm, max_hiburan: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Utama</Label>
                  <Input
                    type="number"
                    value={pricingForm.max_utama}
                    onChange={(e) => setPricingForm({ ...pricingForm, max_utama: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Grand Prize</Label>
                  <Input
                    type="number"
                    value={pricingForm.max_grand_prize}
                    onChange={(e) => setPricingForm({ ...pricingForm, max_grand_prize: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPricingDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={savePricingTier} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingPricing ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Affiliate Tier Dialog */}
        <Dialog open={affiliateDialogOpen} onOpenChange={setAffiliateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAffiliate ? 'Edit Affiliate Tier' : 'Tambah Affiliate Tier'}
              </DialogTitle>
              <DialogDescription>
                {editingAffiliate ? 'Update detail affiliate tier' : 'Tambahkan affiliate tier baru'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nama Tier</Label>
                <Input
                  value={affiliateForm.name}
                  onChange={(e) => setAffiliateForm({ ...affiliateForm, name: e.target.value })}
                  placeholder="Bronze, Silver, Gold..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Komisi (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={affiliateForm.commission_percentage}
                    onChange={(e) => setAffiliateForm({ ...affiliateForm, commission_percentage: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Min. Konversi</Label>
                  <Input
                    type="number"
                    min="0"
                    value={affiliateForm.min_conversions}
                    onChange={(e) => setAffiliateForm({ ...affiliateForm, min_conversions: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAffiliateDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={saveAffiliateTier} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingAffiliate ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus Tier</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus tier ini? Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
