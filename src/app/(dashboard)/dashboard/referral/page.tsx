'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Loader2, Copy, Share2, Users, DollarSign, TrendingUp, Check, Pencil, BarChart3, CreditCard, Crown, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ReferralCode {
  id: string;
  code: string;
  custom_code: string | null;
  total_clicks: number;
  total_signups: number;
  total_conversions: number;
}

interface Commission {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  payout_reference: string | null;
}

interface Referral {
  id: string;
  referee_id: string;
  created_at: string;
  converted_at: string | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary">Pending</Badge>;
    case 'confirmed':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Confirmed</Badge>;
    case 'paid':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Dibayar</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Dibatalkan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function ReferralPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [savingCode, setSavingCode] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      setLoading(true);

      // In a real app, this would fetch from an API
      // For demo, we'll set placeholder data
      setReferralCode({
        id: 'demo-code',
        code: 'REF123ABC',
        custom_code: null,
        total_clicks: 0,
        total_signups: 0,
        total_conversions: 0,
      });
      setCustomCode('');

      setCommissions([]);
      setReferrals([]);

      setLoading(false);
    }

    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Berhasil disalin!',
      description: 'Link referral sudah disalin ke clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCustomCode = async () => {
    if (!referralCode || !customCode.trim()) return;

    setSavingCode(true);

    // Validate custom code format
    const cleanCode = customCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    
    if (cleanCode.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Kode terlalu pendek',
        description: 'Kode referral minimal 3 karakter',
      });
      setSavingCode(false);
      return;
    }

    // In a real app, this would update via API
    setReferralCode({ ...referralCode, custom_code: cleanCode });
    setIsEditingCode(false);
    toast({
      title: 'Berhasil!',
      description: 'Kode referral custom berhasil disimpan',
    });

    setSavingCode(false);
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

  const activeCode = referralCode?.custom_code || referralCode?.code || '';
  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth?ref=${activeCode}`;

  const totalEarnings = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  const pendingEarnings = commissions
    .filter(c => c.status === 'pending' || c.status === 'confirmed')
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-card">
          <div className="h-16 flex items-center px-4 border-b">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
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
            <h1 className="font-semibold">Referral & Affiliate</h1>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Referral & Affiliate</h1>
                  <p className="text-muted-foreground">
                    Ajak teman bergabung dan dapatkan komisi 10% dari setiap pembayaran mereka
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/referral/stats">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Statistik
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/referral/profile">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Profil Rekening
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/referral/leaderboard">
                      <Crown className="h-4 w-4 mr-2" />
                      Leaderboard
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/affiliate/${activeCode}`} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Public Profile
                    </Link>
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Stats - Colorful Cards */}
                  <div className="grid gap-4 md:grid-cols-4">
                    {/* Total Signup - Primary/Teal */}
                    <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-primary-foreground/90">Total Signup</CardTitle>
                        <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{referralCode?.total_signups || 0}</div>
                        <p className="text-sm text-primary-foreground/80 mt-1">
                          Pengguna yang mendaftar
                        </p>
                      </CardContent>
                    </Card>

                    {/* Konversi - Blue */}
                    <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-100">Konversi</CardTitle>
                        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{referralCode?.total_conversions || 0}</div>
                        <p className="text-sm text-blue-100 mt-1">
                          Yang sudah bayar
                        </p>
                      </CardContent>
                    </Card>

                    {/* Komisi Pending - Amber/Orange */}
                    <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-100">Komisi Pending</CardTitle>
                        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-white" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          {formatCurrency(pendingEarnings)}
                        </div>
                        <p className="text-sm text-amber-100 mt-1">
                          Menunggu pembayaran
                        </p>
                      </CardContent>
                    </Card>

                    {/* Total Diterima - Emerald/Green */}
                    <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-100">Total Diterima</CardTitle>
                        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-white" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          {formatCurrency(totalEarnings)}
                        </div>
                        <p className="text-sm text-emerald-100 mt-1">
                          Sudah dibayarkan
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Referral Link */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        Link Referral Anda
                      </CardTitle>
                      <CardDescription>
                        Bagikan link ini untuk mendapatkan komisi 10% dari setiap pembayaran
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          value={referralLink}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          onClick={() => copyToClipboard(referralLink)}
                          variant="secondary"
                        >
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Kode Referral</Label>
                        <div className="flex gap-2">
                          {isEditingCode ? (
                            <>
                              <Input
                                value={customCode}
                                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                                placeholder="Masukkan kode custom"
                                className="font-mono uppercase"
                              />
                              <Button onClick={handleSaveCustomCode} disabled={savingCode}>
                                {savingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan'}
                              </Button>
                              <Button variant="outline" onClick={() => setIsEditingCode(false)}>
                                Batal
                              </Button>
                            </>
                          ) : (
                            <>
                              <Input
                                value={activeCode}
                                readOnly
                                className="font-mono text-lg font-bold"
                              />
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setCustomCode(referralCode?.custom_code || '');
                                  setIsEditingCode(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => copyToClipboard(activeCode)}
                                variant="secondary"
                              >
                                {copied ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Anda dapat membuat kode custom yang lebih mudah diingat
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Commissions Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Riwayat Komisi</CardTitle>
                      <CardDescription>
                        Daftar komisi yang Anda dapatkan dari referral
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {commissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="font-semibold text-lg mb-2">Belum Ada Komisi</h3>
                          <p className="text-muted-foreground">
                            Bagikan link referral Anda untuk mulai mendapatkan komisi
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Jumlah</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tanggal Bayar</TableHead>
                                <TableHead>Referensi</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {commissions.map((commission) => (
                                <TableRow key={commission.id}>
                                  <TableCell>
                                    {format(new Date(commission.created_at), 'dd MMM yyyy', { locale: id })}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {formatCurrency(commission.amount)}
                                  </TableCell>
                                  <TableCell>{getStatusBadge(commission.status)}</TableCell>
                                  <TableCell>
                                    {commission.paid_at
                                      ? format(new Date(commission.paid_at), 'dd MMM yyyy', { locale: id })
                                      : '-'}
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {commission.payout_reference || '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* How it works */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Cara Kerja</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="text-center p-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                            <Share2 className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="font-semibold mb-1">1. Bagikan Link</h3>
                          <p className="text-sm text-muted-foreground">
                            Bagikan link referral ke teman atau komunitas Anda
                          </p>
                        </div>
                        <div className="text-center p-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="font-semibold mb-1">2. Teman Mendaftar</h3>
                          <p className="text-sm text-muted-foreground">
                            Teman mendaftar melalui link dan melakukan pembayaran
                          </p>
                        </div>
                        <div className="text-center p-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                            <DollarSign className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="font-semibold mb-1">3. Dapatkan Komisi</h3>
                          <p className="text-sm text-muted-foreground">
                            Anda mendapat 10% komisi dari setiap pembayaran mereka
                          </p>
                        </div>
                      </div>
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
