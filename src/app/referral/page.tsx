'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, Users, Share2, Copy, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import Link from 'next/link';

export default function ReferralPage() {
  const { user, profile, loading } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralCode = profile?.referral_code || `REF-${user?.id?.substring(0, 8).toUpperCase() || 'DEMO'}`;
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${referralCode}` : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link referral berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Gagal menyalin link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Diperlukan Login</CardTitle>
            <CardDescription>Silakan login untuk mengakses halaman referral</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/auth">Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Program Referral</h1>
            <p className="text-muted-foreground">Bagikan dan dapatkan reward</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/">Kembali</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kode Referral</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{referralCode}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referral</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.referral_count || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Komisi</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {(profile?.referral_earnings || 0).toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Share Card */}
        <Card>
          <CardHeader>
            <CardTitle>Bagikan Link Referral</CardTitle>
            <CardDescription>
              Bagikan link ini kepada teman untuk mendapatkan komisi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="referral-link" className="sr-only">Link Referral</Label>
                <Input
                  id="referral-link"
                  value={referralLink}
                  readOnly
                  className="font-mono text-sm"
                />
              </div>
              <Button onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => {
                if (typeof window !== 'undefined') {
                  window.open(`https://wa.me/?text=${encodeURIComponent(`Daftar event di Eventku: ${referralLink}`)}`, '_blank');
                }
              }}>
                WhatsApp
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => {
                if (typeof window !== 'undefined') {
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Daftar event di Eventku!')}&url=${encodeURIComponent(referralLink)}`, '_blank');
                }
              }}>
                Twitter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
