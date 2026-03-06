'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SessionErrorAlert } from '@/components/admin/SessionErrorAlert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, User, Building, Lock, Eye, EyeOff, Landmark, CheckCircle2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';

interface UserProfile {
  full_name: string | null;
  phone: string | null;
  organization_name: string | null;
  organization_id: string | null;
}

interface BankSettings {
  id?: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_holder_name: string;
  is_verified: boolean;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const BANK_LIST = [
  { code: 'bca', name: 'Bank Central Asia (BCA)' },
  { code: 'bni', name: 'Bank Negara Indonesia (BNI)' },
  { code: 'bri', name: 'Bank Rakyat Indonesia (BRI)' },
  { code: 'mandiri', name: 'Bank Mandiri' },
  { code: 'cimb', name: 'CIMB Niaga' },
  { code: 'danamon', name: 'Bank Danamon' },
  { code: 'permata', name: 'Bank Permata' },
  { code: 'bsi', name: 'Bank Syariah Indonesia (BSI)' },
  { code: 'mega', name: 'Bank Mega' },
  { code: 'btn', name: 'Bank Tabungan Negara (BTN)' },
  { code: 'ocbc', name: 'OCBC NISP' },
  { code: 'panin', name: 'Bank Panin' },
  { code: 'maybank', name: 'Maybank Indonesia' },
  { code: 'dbs', name: 'DBS Indonesia' },
  { code: 'uob', name: 'UOB Indonesia' },
];

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { isRefreshing, sessionError, refreshSession, clearSessionError, handleApiError } = useSessionRefresh();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    phone: '',
    organization_name: '',
    organization_id: null,
  });
  const [bankSettings, setBankSettings] = useState<BankSettings>({
    bank_name: '',
    bank_code: '',
    account_number: '',
    account_holder_name: '',
    is_verified: false,
  });
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('full_name, phone, organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        let orgName = '';
        if (profileData.organization_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', profileData.organization_id)
            .maybeSingle();
          orgName = orgData?.name || '';

          // Fetch bank settings
          const { data: bankData } = await supabase
            .from('eo_bank_settings')
            .select('*')
            .eq('organization_id', profileData.organization_id)
            .maybeSingle();

          if (bankData) {
            setBankSettings({
              id: bankData.id,
              bank_name: bankData.bank_name,
              bank_code: bankData.bank_code,
              account_number: bankData.account_number,
              account_holder_name: bankData.account_holder_name,
              is_verified: bankData.is_verified,
            });
          }
        }

        setProfile({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          organization_name: orgName,
          organization_id: profileData.organization_id,
        });
      }

      setLoading(false);
    }

    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Berhasil!',
        description: 'Profil berhasil disimpan',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal menyimpan',
        description: 'Terjadi kesalahan saat menyimpan profil',
      });
    }
    setSaving(false);
  };

  const handleSaveBank = async () => {
    if (!profile.organization_id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Organization not found',
      });
      return;
    }

    if (!bankSettings.bank_code || !bankSettings.account_number || !bankSettings.account_holder_name) {
      toast({
        variant: 'destructive',
        title: 'Data tidak lengkap',
        description: 'Mohon lengkapi semua data rekening bank',
      });
      return;
    }

    setSavingBank(true);
    try {
      const bankData = {
        organization_id: profile.organization_id,
        bank_name: BANK_LIST.find(b => b.code === bankSettings.bank_code)?.name || bankSettings.bank_code,
        bank_code: bankSettings.bank_code,
        account_number: bankSettings.account_number,
        account_holder_name: bankSettings.account_holder_name,
        is_verified: false, // Reset verification when details change
      };

      if (bankSettings.id) {
        // Update existing
        const { error } = await supabase
          .from('eo_bank_settings')
          .update(bankData)
          .eq('id', bankSettings.id);
        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('eo_bank_settings')
          .insert(bankData)
          .select()
          .single();
        if (error) throw error;
        setBankSettings(prev => ({ ...prev, id: data.id }));
      }

      toast({
        title: 'Berhasil!',
        description: 'Data rekening bank berhasil disimpan. Menunggu verifikasi admin.',
      });
    } catch (error) {
      console.error('Error saving bank settings:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal menyimpan',
        description: 'Terjadi kesalahan saat menyimpan data rekening',
      });
    }
    setSavingBank(false);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Password wajib diisi',
        description: 'Masukkan password baru dan konfirmasi password',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Password terlalu pendek',
        description: 'Password minimal 6 karakter',
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Password tidak cocok',
        description: 'Password baru dan konfirmasi password harus sama',
      });
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      toast({
        title: 'Berhasil!',
        description: 'Password berhasil diubah',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal mengubah password',
        description: error.message || 'Terjadi kesalahan saat mengubah password',
      });
    }
    setSavingPassword(false);
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const handleRefresh = async () => {
    await refreshSession();
    if (user) {
      setLoading(true);
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('full_name, phone, organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        let orgName = '';
        if (profileData.organization_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', profileData.organization_id)
            .maybeSingle();
          orgName = orgData?.name || '';
        }

        setProfile({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          organization_name: orgName,
          organization_id: profileData.organization_id,
        });
      }
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <SessionErrorAlert
          error={sessionError}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onDismiss={clearSessionError}
        />
        <div>
          <h1 className="text-3xl font-bold">Pengaturan</h1>
          <p className="text-muted-foreground">Kelola profil dan pengaturan akun</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profil
              </CardTitle>
              <CardDescription>
                Informasi dasar akun Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Nama Lengkap</Label>
                <Input
                  id="full_name"
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                  id="phone"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Contoh: 08123456789"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Organisasi
              </CardTitle>
              <CardDescription>
                Informasi organisasi Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="organization">Nama Organisasi</Label>
                <Input
                  id="organization"
                  value={profile.organization_name || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Nama organisasi tidak dapat diubah
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Password Change Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Ubah Password
              </CardTitle>
              <CardDescription>
                Perbarui password akun Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Minimal 6 karakter"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <PasswordStrengthIndicator password={passwordForm.newPassword} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Ulangi password baru"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={savingPassword}
                    variant="outline"
                    className="w-full"
                  >
                    {savingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mengubah...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Ubah Password
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Settings Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5" />
                Rekening Bank Payout
                {bankSettings.is_verified ? (
                  <Badge variant="default" className="ml-2">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Terverifikasi
                  </Badge>
                ) : bankSettings.id ? (
                  <Badge variant="secondary" className="ml-2">
                    <Clock className="mr-1 h-3 w-3" />
                    Menunggu Verifikasi
                  </Badge>
                ) : null}
              </CardTitle>
              <CardDescription>
                Rekening bank untuk menerima pembayaran dari peserta event (90% dari total pembayaran)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bank">Bank</Label>
                  <Select
                    value={bankSettings.bank_code}
                    onValueChange={(value) => setBankSettings(prev => ({ ...prev, bank_code: value }))}
                  >
                    <SelectTrigger id="bank">
                      <SelectValue placeholder="Pilih bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANK_LIST.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_number">Nomor Rekening</Label>
                  <Input
                    id="account_number"
                    value={bankSettings.account_number}
                    onChange={(e) => setBankSettings(prev => ({ ...prev, account_number: e.target.value }))}
                    placeholder="Contoh: 1234567890"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="account_holder">Nama Pemilik Rekening</Label>
                  <Input
                    id="account_holder"
                    value={bankSettings.account_holder_name}
                    onChange={(e) => setBankSettings(prev => ({ ...prev, account_holder_name: e.target.value }))}
                    placeholder="Nama sesuai rekening bank"
                  />
                  <p className="text-xs text-muted-foreground">
                    Pastikan nama sama persis dengan yang tertera di buku tabungan
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveBank} disabled={savingBank}>
                  {savingBank ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Landmark className="mr-2 h-4 w-4" />
                      Simpan Rekening Bank
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
