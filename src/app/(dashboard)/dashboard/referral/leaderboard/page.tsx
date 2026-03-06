'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Trophy, Medal, Award, TrendingUp, DollarSign, Crown, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  total_conversions: number;
  total_earnings: number;
  tier_name: string;
  rank: number;
}

interface AffiliateTier {
  id: string;
  name: string;
  min_conversions: number;
  commission_percentage: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
  if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />;
  return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
}

function getTierBadgeColor(tierName: string) {
  switch (tierName.toLowerCase()) {
    case 'platinum':
      return 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0';
    case 'gold':
      return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0';
    case 'silver':
      return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 border-0';
    default:
      return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-0';
  }
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function AffiliateLeaderboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [leaderboardByConversions, setLeaderboardByConversions] = useState<LeaderboardEntry[]>([]);
  const [leaderboardByEarnings, setLeaderboardByEarnings] = useState<LeaderboardEntry[]>([]);
  const [tiers, setTiers] = useState<AffiliateTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<{ conversions: number; earnings: number } | null>(null);

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
      // For demo, we'll use placeholder data
      const demoTiers: AffiliateTier[] = [
        { id: '1', name: 'Bronze', min_conversions: 0, commission_percentage: 10 },
        { id: '2', name: 'Silver', min_conversions: 10, commission_percentage: 12 },
        { id: '3', name: 'Gold', min_conversions: 25, commission_percentage: 15 },
        { id: '4', name: 'Platinum', min_conversions: 50, commission_percentage: 20 },
      ];
      setTiers(demoTiers);

      // Demo leaderboard entries
      const demoEntries: LeaderboardEntry[] = [
        { user_id: '1', full_name: 'Ahmad Rizki', total_conversions: 45, total_earnings: 4500000, tier_name: 'Gold', rank: 1 },
        { user_id: '2', full_name: 'Siti Nurhaliza', total_conversions: 38, total_earnings: 3800000, tier_name: 'Gold', rank: 2 },
        { user_id: '3', full_name: 'Budi Santoso', total_conversions: 32, total_earnings: 3200000, tier_name: 'Silver', rank: 3 },
        { user_id: '4', full_name: 'Dewi Lestari', total_conversions: 28, total_earnings: 2800000, tier_name: 'Silver', rank: 4 },
        { user_id: '5', full_name: 'Eko Prasetyo', total_conversions: 22, total_earnings: 2200000, tier_name: 'Silver', rank: 5 },
        { user_id: '6', full_name: 'Fitri Handayani', total_conversions: 18, total_earnings: 1800000, tier_name: 'Bronze', rank: 6 },
        { user_id: '7', full_name: 'Gunawan Wibowo', total_conversions: 15, total_earnings: 1500000, tier_name: 'Bronze', rank: 7 },
        { user_id: '8', full_name: 'Hesti Permata', total_conversions: 12, total_earnings: 1200000, tier_name: 'Bronze', rank: 8 },
        { user_id: '9', full_name: 'Irfan Hakim', total_conversions: 8, total_earnings: 800000, tier_name: 'Bronze', rank: 9 },
        { user_id: '10', full_name: 'Julia Anggraini', total_conversions: 5, total_earnings: 500000, tier_name: 'Bronze', rank: 10 },
      ];

      setLeaderboardByConversions(demoEntries);

      // Sort by earnings
      const byEarnings = [...demoEntries]
        .sort((a, b) => b.total_earnings - a.total_earnings)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
      setLeaderboardByEarnings(byEarnings);

      // Current user rank (assuming user is in the list)
      const userId = user.id;
      const userConversionRank = demoEntries.findIndex((e) => e.user_id === userId) + 1 || 11;
      const userEarningsRank = byEarnings.findIndex((e) => e.user_id === userId) + 1 || 11;
      setCurrentUserRank({
        conversions: userConversionRank,
        earnings: userEarningsRank,
      });

      setLoading(false);
    }

    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

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

  const renderLeaderboardTable = (entries: LeaderboardEntry[], type: 'conversions' | 'earnings') => (
    <div className="space-y-3">
      {entries.slice(0, 20).map((entry) => (
        <div
          key={entry.user_id}
          className={`flex items-center gap-4 p-4 rounded-lg border ${
            entry.user_id === user.id ? 'bg-primary/5 border-primary' : 'bg-card'
          }`}
        >
          <div className="flex items-center justify-center w-10">
            {getRankIcon(entry.rank)}
          </div>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(entry.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">
                {entry.full_name || 'Anonymous'}
                {entry.user_id === user.id && (
                  <span className="text-primary ml-2">(Anda)</span>
                )}
              </p>
              <Badge className={getTierBadgeColor(entry.tier_name)}>
                {entry.tier_name}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {entry.total_conversions} konversi
            </p>
          </div>
          <div className="text-right">
            {type === 'conversions' ? (
              <div className="flex items-center gap-1 text-primary font-bold">
                <TrendingUp className="h-4 w-4" />
                {entry.total_conversions}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-green-600 font-bold">
                <DollarSign className="h-4 w-4" />
                {formatCurrency(entry.total_earnings)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-card">
          <div className="h-16 flex items-center px-4 border-b">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <Crown className="h-6 w-6 text-primary" />
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
            <h1 className="font-semibold ml-4">Leaderboard Affiliate</h1>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                  <Crown className="h-8 w-8 text-yellow-500" />
                  Leaderboard Affiliate
                </h1>
                <p className="text-muted-foreground">
                  Ranking affiliate berdasarkan performa konversi dan pendapatan
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* User's Current Rank */}
                  {currentUserRank && (currentUserRank.conversions > 0 || currentUserRank.earnings > 0) && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Ranking Konversi Anda
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-primary">
                            #{currentUserRank.conversions}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            dari {leaderboardByConversions.length} affiliate
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Ranking Pendapatan Anda
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-green-600">
                            #{currentUserRank.earnings}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            dari {leaderboardByEarnings.length} affiliate
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Tier Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Tier Affiliate</CardTitle>
                      <CardDescription>
                        Dapatkan persentase komisi lebih tinggi dengan mencapai target konversi
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-4">
                        {tiers.map((tier) => (
                          <div
                            key={tier.id}
                            className={`p-4 rounded-lg border text-center ${
                              tier.name === 'Platinum'
                                ? 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200'
                                : tier.name === 'Gold'
                                ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200'
                                : tier.name === 'Silver'
                                ? 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 border-gray-200'
                                : 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200'
                            }`}
                          >
                            <Badge className={`${getTierBadgeColor(tier.name)} mb-2`}>
                              {tier.name}
                            </Badge>
                            <div className="text-2xl font-bold text-primary mt-2">
                              {tier.commission_percentage}%
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Min. {tier.min_conversions} konversi
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Leaderboard Tabs */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top 20 Affiliate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="conversions">
                        <TabsList className="mb-4">
                          <TabsTrigger value="conversions" className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Berdasarkan Konversi
                          </TabsTrigger>
                          <TabsTrigger value="earnings" className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Berdasarkan Pendapatan
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="conversions">
                          {leaderboardByConversions.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                              Belum ada data leaderboard
                            </div>
                          ) : (
                            renderLeaderboardTable(leaderboardByConversions, 'conversions')
                          )}
                        </TabsContent>
                        <TabsContent value="earnings">
                          {leaderboardByEarnings.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                              Belum ada data leaderboard
                            </div>
                          ) : (
                            renderLeaderboardTable(leaderboardByEarnings, 'earnings')
                          )}
                        </TabsContent>
                      </Tabs>
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
