'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CreditCard, Save, CheckCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BankInfo {
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
}

const INDONESIAN_BANKS = [
  'BCA',
  'BNI',
  'BRI',
  'Mandiri',
  'CIMB Niaga',
  'Danamon',
  'Permata',
  'OCBC NISP',
  'Panin',
  'Maybank',
  'BTN',
  'Bank Mega',
  'Bank Jago',
  'Bank Digital BCA',
  'SeaBank',
  'Jenius (BTPN)',
  'Lainnya',
];

export default function AffiliateProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bank_name: null,
    bank_account_number: null,
    bank_account_holder: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchBankInfo() {
      if (!user) return;

      setLoading(true);

      // In a real app, this would fetch from an API
      // For demo, we'll use placeholder data
      setBankInfo({
        bank_name: null,
        bank_account_number: null,
        bank_account_holder: null,
      });

      setLoading(false);
    }

    if (!authLoading && user) {
      fetchBankInfo();
    }
  }, [user, authLoading]);

  const handleSave = async () => {
    if (!user) return;

    if (!bankInfo.bank_name || !bankInfo.bank_account_number || !bankInfo.bank_account_holder) {
      toast({
        variant: 'destructive',
        title: 'Data Tidak Lengkap',
        description: 'Mohon lengkapi semua informasi rekening',
      });
      return;
    }

    setSaving(true);

    // In a real app, this would save to an API
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: 'Berhasil Disimpan',
      description: 'Informasi rekening berhasil diperbarui',
    });

    setSaving(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isComplete = bankInfo.bank_name && bankInfo.bank_account_number && bankInfo.bank_account_holder;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-card">
          <div className="h-16 flex items-center px-4 border-b">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <CreditCard className="h-6 w-6 text-primary" />
              <span>Prize Party</span>
            </Link>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/dashboard/billing" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              Billing
            </Link>
            <Link href="/dashboard/referral" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground">
              Referral
            </Link>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-background/95 backdrop-blur flex items-center px-4 md:px-6">
            <Link href="/dashboard/referral" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali</span>
            </Link>
            <h1 className="font-semibold ml-4">Profil Affiliate</h1>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="space-y-6 max-w-2xl">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Profil Affiliate</h1>
                <p className="text-muted-foreground">
                  Lengkapi informasi rekening bank untuk pembayaran komisi
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Status Card */}
                  <Card className={isComplete ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950' : 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950'}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        {isComplete ? (
                          <>
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <div>
                              <p className="font-medium text-green-800 dark:text-green-200">Rekening Terdaftar</p>
                              <p className="text-sm text-green-600 dark:text-green-300">
                                Informasi rekening Anda sudah lengkap untuk menerima pembayaran komisi
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-6 w-6 text-orange-600" />
                            <div>
                              <p className="font-medium text-orange-800 dark:text-orange-200">Rekening Belum Lengkap</p>
                              <p className="text-sm text-orange-600 dark:text-orange-300">
                                Lengkapi informasi rekening untuk menerima pembayaran komisi
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bank Info Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Informasi Rekening Bank
                      </CardTitle>
                      <CardDescription>
                        Rekening ini akan digunakan untuk pembayaran komisi affiliate
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bank_name">Nama Bank</Label>
                        <Select
                          value={bankInfo.bank_name || ''}
                          onValueChange={(value) => setBankInfo({ ...bankInfo, bank_name: value })}
                        >
                          <SelectTrigger id="bank_name">
                            <SelectValue placeholder="Pilih Bank" />
                          </SelectTrigger>
                          <SelectContent>
                            {INDONESIAN_BANKS.map((bank) => (
                              <SelectItem key={bank} value={bank}>
                                {bank}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bank_account_number">Nomor Rekening</Label>
                        <Input
                          id="bank_account_number"
                          type="text"
                          placeholder="Masukkan nomor rekening"
                          value={bankInfo.bank_account_number || ''}
                          onChange={(e) =>
                            setBankInfo({ ...bankInfo, bank_account_number: e.target.value.replace(/\D/g, '') })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bank_account_holder">Nama Pemilik Rekening</Label>
                        <Input
                          id="bank_account_holder"
                          type="text"
                          placeholder="Sesuai dengan buku tabungan"
                          value={bankInfo.bank_account_holder || ''}
                          onChange={(e) =>
                            setBankInfo({ ...bankInfo, bank_account_holder: e.target.value.toUpperCase() })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Pastikan nama sesuai dengan yang tertera di buku tabungan
                        </p>
                      </div>

                      <Button onClick={handleSave} disabled={saving} className="w-full">
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Simpan Informasi Rekening
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Info Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Catatan Penting</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <p>• Pastikan informasi rekening benar untuk menghindari kesalahan transfer.</p>
                      <p>• Pembayaran komisi akan diproses setelah mencapai minimum Rp 500.000.</p>
                      <p>• Waktu proses pembayaran 1-3 hari kerja setelah disetujui admin.</p>
                      <p>• Hubungi support jika ada pertanyaan terkait pembayaran komisi.</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
