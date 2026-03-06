'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Loader2, Users, TrendingUp, DollarSign, Award, Star, Target, Zap, Crown, Shield, Sparkles, Trophy, Medal, Rocket, Diamond } from 'lucide-react';
import { PublicLayout } from '@/components/layout/PublicLayout';

interface AffiliateProfile {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  referralCode: string;
  totalSignups: number;
  totalConversions: number;
  totalCommission: number;
  tierName: string;
  joinedAt: string;
}

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
  color: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getBadges(conversions: number, totalCommission: number): BadgeItem[] {
  return [
    {
      id: 'first-conversion',
      name: 'First Blood',
      description: 'Mendapatkan konversi pertama',
      icon: <Zap className="h-6 w-6" />,
      earned: conversions >= 1,
      color: 'text-blue-500',
    },
    {
      id: 'five-conversions',
      name: 'Rising Star',
      description: 'Mencapai 5 konversi',
      icon: <Star className="h-6 w-6" />,
      earned: conversions >= 5,
      color: 'text-yellow-500',
    },
    {
      id: 'ten-conversions',
      name: 'Affiliate Pro',
      description: 'Mencapai 10 konversi',
      icon: <Award className="h-6 w-6" />,
      earned: conversions >= 10,
      color: 'text-purple-500',
    },
    {
      id: 'twentyfive-conversions',
      name: 'Top Performer',
      description: 'Mencapai 25 konversi',
      icon: <Trophy className="h-6 w-6" />,
      earned: conversions >= 25,
      color: 'text-orange-500',
    },
    {
      id: 'fifty-conversions',
      name: 'Elite Affiliate',
      description: 'Mencapai 50 konversi',
      icon: <Crown className="h-6 w-6" />,
      earned: conversions >= 50,
      color: 'text-amber-500',
    },
    {
      id: 'hundred-conversions',
      name: 'Legend',
      description: 'Mencapai 100 konversi',
      icon: <Diamond className="h-6 w-6" />,
      earned: conversions >= 100,
      color: 'text-cyan-500',
    },
    {
      id: 'millionaire',
      name: 'Millionaire',
      description: 'Total komisi Rp 1.000.000+',
      icon: <Sparkles className="h-6 w-6" />,
      earned: totalCommission >= 1000000,
      color: 'text-green-500',
    },
    {
      id: 'super-earner',
      name: 'Super Earner',
      description: 'Total komisi Rp 10.000.000+',
      icon: <Rocket className="h-6 w-6" />,
      earned: totalCommission >= 10000000,
      color: 'text-red-500',
    },
  ];
}

export default function AffiliatePublicProfile() {
  const params = useParams();
  const code = params.code as string;
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent double fetch in React StrictMode
    if (hasFetched.current) return;
    if (!code) return;
    hasFetched.current = true;

    let mounted = true;

    async function loadProfile() {
      // Find referral code
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('*, affiliate_tiers(name)')
        .or(`code.eq.${code},custom_code.eq.${code}`)
        .single();

      if (!mounted) return;

      if (codeError || !codeData) {
        setError('Affiliate tidak ditemukan');
        setLoading(false);
        return;
      }

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_url, created_at')
        .eq('user_id', codeData.user_id)
        .single();

      if (!mounted) return;

      // Fetch total commission
      const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, status')
        .eq('referrer_id', codeData.user_id);

      if (!mounted) return;

      const totalCommission = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0;

      setProfile({
        userId: codeData.user_id,
        fullName: profileData?.full_name || 'Affiliate',
        avatarUrl: profileData?.avatar_url,
        referralCode: codeData.custom_code || codeData.code,
        totalSignups: codeData.total_signups,
        totalConversions: codeData.total_conversions,
        totalCommission,
        tierName: codeData.affiliate_tiers?.name || 'Starter',
        joinedAt: profileData?.created_at || codeData.created_at,
      });

      setLoading(false);
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [code]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PublicLayout>
    );
  }

  if (error || !profile) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
          <Shield className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Affiliate Tidak Ditemukan</h1>
          <p className="text-muted-foreground">
            Kode affiliate yang Anda cari tidak tersedia atau sudah tidak aktif.
          </p>
        </div>
      </PublicLayout>
    );
  }

  const badges = getBadges(profile.totalConversions, profile.totalCommission);
  const earnedBadges = badges.filter(b => b.earned);
  const nextBadge = badges.find(b => !b.earned);

  // Calculate progress to next badge
  let progressToNext = 100;
  let nextMilestone = '';
  if (nextBadge) {
    if (nextBadge.id.includes('conversion')) {
      const milestones = [1, 5, 10, 25, 50, 100];
      const target = milestones.find(m => m > profile.totalConversions) || 100;
      progressToNext = (profile.totalConversions / target) * 100;
      nextMilestone = `${target} konversi`;
    } else if (nextBadge.id === 'millionaire') {
      progressToNext = (profile.totalCommission / 1000000) * 100;
      nextMilestone = 'Rp 1.000.000 komisi';
    } else if (nextBadge.id === 'super-earner') {
      progressToNext = (profile.totalCommission / 10000000) * 100;
      nextMilestone = 'Rp 10.000.000 komisi';
    }
  }

  return (
    <PublicLayout>
      <div className="container max-w-4xl py-8 space-y-8">
        {/* Profile Header */}
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary to-primary/60" />
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarImage src={profile.avatarUrl || undefined} />
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {profile.fullName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left sm:pb-2 flex-1">
                <h1 className="text-2xl font-bold">{profile.fullName}</h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                  <Badge variant="secondary" className="font-mono">
                    @{profile.referralCode}
                  </Badge>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                    {profile.tierName}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Signup</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.totalSignups}</div>
              <p className="text-xs text-muted-foreground">Pengguna yang mendaftar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Konversi</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.totalConversions}</div>
              <p className="text-xs text-muted-foreground">Yang sudah bayar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Komisi</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(profile.totalCommission)}
              </div>
              <p className="text-xs text-muted-foreground">Pendapatan total</p>
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-primary" />
              Badge & Achievement
            </CardTitle>
            <CardDescription>
              {earnedBadges.length} dari {badges.length} badge diperoleh
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Earned Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center p-4 rounded-lg border transition-all ${
                    badge.earned
                      ? 'bg-muted/50 border-primary/20'
                      : 'opacity-40 grayscale'
                  }`}
                >
                  <div className={badge.earned ? badge.color : 'text-muted-foreground'}>
                    {badge.icon}
                  </div>
                  <span className="font-medium text-sm mt-2 text-center">{badge.name}</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    {badge.description}
                  </span>
                </div>
              ))}
            </div>

            {/* Progress to Next Badge */}
            {nextBadge && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Badge Selanjutnya: {nextBadge.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{nextMilestone}</span>
                  </div>
                  <Progress value={progressToNext} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {progressToNext.toFixed(0)}% tercapai - {nextBadge.description}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Join CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-bold mb-2">Tertarik Menjadi Affiliate?</h2>
            <p className="text-muted-foreground mb-4">
              Daftar sekarang menggunakan kode <span className="font-mono font-bold">{profile.referralCode}</span> dan mulai dapatkan komisi!
            </p>
            <a
              href={`/auth?ref=${profile.referralCode}`}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Daftar Sekarang
            </a>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
