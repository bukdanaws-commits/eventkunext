'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, DollarSign, Package, Users, Gift, Crown, Pencil, RefreshCw, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuditLog } from '@/hooks/useAdminAuditLog';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { SessionErrorAlert } from '@/components/admin/SessionErrorAlert';
import { Badge } from '@/components/ui/badge';
import type { Database } from '@/integrations/supabase/types';

type EventTier = Database['public']['Enums']['event_tier'];

interface PricingTier {
  id: string;
  tier: EventTier;
  name: string;
  price: number;
  max_participants: number;
  max_hiburan: number;
  max_utama: number;
  max_grand_prize: number;
  form_addon_price: number;
  created_at: string;
}

export default function AdminPricing() {
  const { toast } = useToast();
  const { logAction } = useAdminAuditLog();
  const { isRefreshing, sessionError, clearSessionError, refreshSession, handleApiError } = useSessionRefresh();
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editMaxParticipants, setEditMaxParticipants] = useState('');
  const [editMaxHiburan, setEditMaxHiburan] = useState('');
  const [editMaxUtama, setEditMaxUtama] = useState('');
  const [editMaxGrandPrize, setEditMaxGrandPrize] = useState('');
  const [editFormAddonPrice, setEditFormAddonPrice] = useState('');

  useEffect(() => {
    fetchTiers();
  }, []);

  async function fetchTiers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pricing_tiers')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setTiers(data || []);
    } catch (error) {
      console.error('Error fetching pricing tiers:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat data pricing tiers',
      });
    } finally {
      setLoading(false);
    }
  }

  const openEditDialog = (tier: PricingTier) => {
    setSelectedTier(tier);
    setEditName(tier.name);
    setEditPrice(tier.price.toString());
    setEditMaxParticipants(tier.max_participants.toString());
    setEditMaxHiburan(tier.max_hiburan.toString());
    setEditMaxUtama(tier.max_utama.toString());
    setEditMaxGrandPrize(tier.max_grand_prize.toString());
    setEditFormAddonPrice(tier.form_addon_price.toString());
    setEditDialogOpen(true);
  };

  const handleSaveTier = async () => {
    if (!selectedTier) return;

    setSaving(true);
    try {
      const updates = {
        name: editName.trim(),
        price: parseInt(editPrice) || 0,
        max_participants: parseInt(editMaxParticipants) || 0,
        max_hiburan: parseInt(editMaxHiburan) || 0,
        max_utama: parseInt(editMaxUtama) || 0,
        max_grand_prize: parseInt(editMaxGrandPrize) || 0,
        form_addon_price: parseInt(editFormAddonPrice) || 0,
      };

      const { error } = await supabase
        .from('pricing_tiers')
        .update(updates)
        .eq('id', selectedTier.id);

      if (error) throw error;

      await logAction({
        action: 'settings_updated',
        targetType: 'settings',
        targetId: selectedTier.id,
        details: {
          type: 'pricing_tier',
          tier: selectedTier.tier,
          changes: updates,
        },
      });

      toast({
        title: 'Berhasil',
        description: `Pricing tier ${editName} berhasil diperbarui`,
      });

      setEditDialogOpen(false);
      fetchTiers();
    } catch (error) {
      console.error('Error updating tier:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menyimpan perubahan',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getTierBadge = (tier: EventTier) => {
    const tierConfig: Record<EventTier, { label: string; className: string; icon: typeof Crown }> = {
      free: { label: 'Free', className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200', icon: Gift },
      basic: { label: 'Basic', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Package },
      pro: { label: 'Pro', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: TrendingUp },
      enterprise: { label: 'Enterprise', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200', icon: Crown },
    };
    const config = tierConfig[tier];
    const Icon = config.icon;
    return (
      <Badge className={`${config.className} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Calculate stats
  const totalTiers = tiers.length;
  const avgPrice = tiers.length > 0 
    ? Math.round(tiers.reduce((sum, t) => sum + t.price, 0) / tiers.length)
    : 0;
  const maxParticipantsTotal = Math.max(...tiers.map(t => t.max_participants), 0);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pricing Management</h1>
            <p className="text-muted-foreground mt-1">Kelola pricing tiers dan form builder settings</p>
          </div>
          <Button onClick={fetchTiers} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Total Tiers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalTiers}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Rata-rata Harga
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(avgPrice)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Max Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {maxParticipantsTotal.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Tiers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing Tiers</CardTitle>
            <CardDescription>
              Kelola harga dan batasan untuk setiap tier event
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Max Peserta</TableHead>
                  <TableHead>Max Hiburan</TableHead>
                  <TableHead>Max Utama</TableHead>
                  <TableHead>Max Grand Prize</TableHead>
                  <TableHead>Form Addon</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiers.map((tier) => (
                  <TableRow key={tier.id}>
                    <TableCell>{getTierBadge(tier.tier)}</TableCell>
                    <TableCell className="font-medium">{tier.name}</TableCell>
                    <TableCell>{formatCurrency(tier.price)}</TableCell>
                    <TableCell>{tier.max_participants.toLocaleString()}</TableCell>
                    <TableCell>{tier.max_hiburan}</TableCell>
                    <TableCell>{tier.max_utama}</TableCell>
                    <TableCell>{tier.max_grand_prize}</TableCell>
                    <TableCell>{formatCurrency(tier.form_addon_price)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(tier)}
                        className="gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Form Builder Settings Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-600" />
              Form Builder Addon
            </CardTitle>
            <CardDescription>
              Fitur form builder tersedia sebagai addon berbayar untuk setiap tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {tiers.map((tier) => (
                <Card key={tier.id} className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      {getTierBadge(tier.tier)}
                    </div>
                    <p className="text-2xl font-bold">
                      {tier.form_addon_price === 0 
                        ? 'Gratis' 
                        : formatCurrency(tier.form_addon_price)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Form builder addon price
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Edit Tier Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5" />
                Edit Pricing Tier
              </DialogTitle>
              <DialogDescription>
                Edit pengaturan untuk tier {selectedTier?.tier}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama Tier</Label>
                <Input
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nama tier"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Harga (IDR)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="formAddon">Form Addon Price (IDR)</Label>
                  <Input
                    id="formAddon"
                    type="number"
                    value={editFormAddonPrice}
                    onChange={(e) => setEditFormAddonPrice(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="maxParticipants">Max Peserta</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={editMaxParticipants}
                    onChange={(e) => setEditMaxParticipants(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxHiburan">Max Hadiah Hiburan</Label>
                  <Input
                    id="maxHiburan"
                    type="number"
                    value={editMaxHiburan}
                    onChange={(e) => setEditMaxHiburan(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="maxUtama">Max Hadiah Utama</Label>
                  <Input
                    id="maxUtama"
                    type="number"
                    value={editMaxUtama}
                    onChange={(e) => setEditMaxUtama(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxGrandPrize">Max Grand Prize</Label>
                  <Input
                    id="maxGrandPrize"
                    type="number"
                    value={editMaxGrandPrize}
                    onChange={(e) => setEditMaxGrandPrize(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSaveTier} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
