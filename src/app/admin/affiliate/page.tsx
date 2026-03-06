'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Loader2,
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  Crown,
  Star,
  Download,
  RefreshCcw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LeaderboardEntry {
  userId: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  totalCommission: number;
  paidCommission: number;
  conversions: number;
  totalReferrals: number;
  tierName: string | null;
  rank: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
  if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
  return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
}

function getTierBadgeColor(tierName: string | null) {
  switch (tierName?.toLowerCase()) {
    case 'bronze':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'silver':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    case 'gold':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'platinum':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default function AdminAffiliateLeaderboard() {
  const { toast } = useToast();
  const router = useRouter();
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'commission' | 'conversions'>('commission');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    
    try {
      // Get all affiliate tiers
      const { data: tiers } = await supabase
        .from('affiliate_tiers')
        .select('*')
        .order('min_conversions', { ascending: true });
      
      // Get all referral codes with user info
      const { data: referralCodes } = await supabase
        .from('referral_codes')
        .select('*, affiliate_tiers(name)')
        .gt('total_conversions', 0);
      
      if (!referralCodes || referralCodes.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }
      
      // Get all commissions
      const { data: commissions } = await supabase
        .from('commissions')
        .select('*');
      
      // Get all referrals
      const { data: referrals } = await supabase
        .from('referrals')
        .select('*');
      
      // Build leaderboard entries
      const entries: LeaderboardEntry[] = await Promise.all(
        referralCodes.map(async (code) => {
          // Get user profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name, avatar_url')
            .eq('user_id', code.user_id)
            .single();
          
          // Get user email
          const { data: authData } = await supabase.auth.admin.getUserById(code.user_id);
          
          // Calculate total commission (all statuses except cancelled)
          const userCommissions = (commissions || []).filter(
            c => c.referrer_id === code.user_id && c.status !== 'cancelled'
          );
          const totalCommission = userCommissions.reduce((sum, c) => sum + c.amount, 0);
          const paidCommission = userCommissions
            .filter(c => c.status === 'paid')
            .reduce((sum, c) => sum + c.amount, 0);
          
          // Get conversions count
          const conversions = code.total_conversions || 0;
          
          // Get total referrals
          const userReferrals = (referrals || []).filter(
            r => r.referrer_id === code.user_id
          );
          
          // Get tier name
          const tierName = (code.affiliate_tiers as any)?.name || null;
          
          return {
            userId: code.user_id,
            name: profile?.full_name || null,
            email: authData?.user?.email || null,
            avatarUrl: profile?.avatar_url || null,
            totalCommission,
            paidCommission,
            conversions,
            totalReferrals: userReferrals.length,
            tierName,
            rank: 0,
          };
        })
      );
      
      setLeaderboard(entries);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat data leaderboard',
      });
    } finally {
      setLoading(false);
    }
  };

  // Sort and rank
  const sortedLeaderboard = [...leaderboard]
    .sort((a, b) => {
      if (sortBy === 'commission') {
        return b.totalCommission - a.totalCommission;
      }
      return b.conversions - a.conversions;
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  // Stats
  const totalAffiliates = leaderboard.length;
  const totalCommissions = leaderboard.reduce((sum, e) => sum + e.totalCommission, 0);
  const totalPaidCommissions = leaderboard.reduce((sum, e) => sum + e.paidCommission, 0);
  const totalConversions = leaderboard.reduce((sum, e) => sum + e.conversions, 0);

  const exportToExcel = () => {
    const data = sortedLeaderboard.map(e => ({
      'Rank': e.rank,
      'Nama': e.name || '-',
      'Email': e.email || '-',
      'Tier': e.tierName || '-',
      'Total Komisi': e.totalCommission,
      'Komisi Dibayar': e.paidCommission,
      'Conversions': e.conversions,
      'Total Referrals': e.totalReferrals,
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leaderboard');
    XLSX.writeFile(wb, `affiliate-leaderboard-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    
    toast({ title: 'Export berhasil', description: 'File Excel telah diunduh' });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Leaderboard Affiliate', 14, 22);
    doc.setFontSize(10);
    doc.text(`Tanggal: ${format(new Date(), 'dd MMMM yyyy', { locale: id })}`, 14, 30);
    doc.text(`Diurutkan berdasarkan: ${sortBy === 'commission' ? 'Total Komisi' : 'Conversions'}`, 14, 36);
    
    autoTable(doc, {
      startY: 42,
      head: [['#', 'Nama', 'Tier', 'Total Komisi', 'Conversions']],
      body: sortedLeaderboard.slice(0, 50).map(e => [
        e.rank,
        e.name || e.email || '-',
        e.tierName || '-',
        formatCurrency(e.totalCommission),
        e.conversions,
      ]),
    });
    
    doc.save(`affiliate-leaderboard-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast({ title: 'Export berhasil', description: 'File PDF telah diunduh' });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Leaderboard Affiliate
            </h1>
            <p className="text-muted-foreground mt-1">Ranking affiliate berdasarkan performa</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchLeaderboard}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" onClick={exportToPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Affiliate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAffiliates}</div>
              <p className="text-xs text-muted-foreground">dengan konversi</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Komisi</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalCommissions)}</div>
              <p className="text-xs text-muted-foreground">dari semua affiliate</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Dibayar</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaidCommissions)}</div>
              <p className="text-xs text-muted-foreground">komisi cair</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalConversions}</div>
              <p className="text-xs text-muted-foreground">pembayaran berhasil</p>
            </CardContent>
          </Card>
        </div>

        {/* Top 3 Podium */}
        {sortedLeaderboard.length >= 3 && (
          <div className="grid md:grid-cols-3 gap-4">
            {/* Second Place */}
            <Card className="border-gray-300 dark:border-gray-600 order-1 md:order-1">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-4">
                  <Medal className="h-12 w-12 text-gray-400" />
                </div>
                <Avatar className="h-16 w-16 mx-auto mb-3">
                  <AvatarImage src={sortedLeaderboard[1]?.avatarUrl || undefined} />
                  <AvatarFallback>{getInitials(sortedLeaderboard[1]?.name)}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">{sortedLeaderboard[1]?.name || sortedLeaderboard[1]?.email || '-'}</h3>
                <Badge className={getTierBadgeColor(sortedLeaderboard[1]?.tierName)}>
                  {sortedLeaderboard[1]?.tierName || 'Starter'}
                </Badge>
                <div className="mt-4 space-y-1">
                  <p className="text-2xl font-bold text-primary">
                    {sortBy === 'commission' 
                      ? formatCurrency(sortedLeaderboard[1]?.totalCommission || 0)
                      : `${sortedLeaderboard[1]?.conversions || 0} conversions`
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {sortBy === 'commission' 
                      ? `${sortedLeaderboard[1]?.conversions || 0} conversions`
                      : formatCurrency(sortedLeaderboard[1]?.totalCommission || 0)
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* First Place */}
            <Card className="border-yellow-400 dark:border-yellow-600 bg-gradient-to-b from-yellow-50 to-background dark:from-yellow-950 order-0 md:order-2 md:-mt-4">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-4">
                  <Crown className="h-16 w-16 text-yellow-500" />
                </div>
                <Avatar className="h-20 w-20 mx-auto mb-3 ring-4 ring-yellow-400">
                  <AvatarImage src={sortedLeaderboard[0]?.avatarUrl || undefined} />
                  <AvatarFallback className="text-xl">{getInitials(sortedLeaderboard[0]?.name)}</AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-xl">{sortedLeaderboard[0]?.name || sortedLeaderboard[0]?.email || '-'}</h3>
                <Badge className={getTierBadgeColor(sortedLeaderboard[0]?.tierName)}>
                  {sortedLeaderboard[0]?.tierName || 'Starter'}
                </Badge>
                <div className="mt-4 space-y-1">
                  <p className="text-3xl font-bold text-primary">
                    {sortBy === 'commission' 
                      ? formatCurrency(sortedLeaderboard[0]?.totalCommission || 0)
                      : `${sortedLeaderboard[0]?.conversions || 0} conversions`
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {sortBy === 'commission' 
                      ? `${sortedLeaderboard[0]?.conversions || 0} conversions`
                      : formatCurrency(sortedLeaderboard[0]?.totalCommission || 0)
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Third Place */}
            <Card className="border-amber-400 dark:border-amber-700 order-2 md:order-3">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-4">
                  <Medal className="h-12 w-12 text-amber-600" />
                </div>
                <Avatar className="h-16 w-16 mx-auto mb-3">
                  <AvatarImage src={sortedLeaderboard[2]?.avatarUrl || undefined} />
                  <AvatarFallback>{getInitials(sortedLeaderboard[2]?.name)}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">{sortedLeaderboard[2]?.name || sortedLeaderboard[2]?.email || '-'}</h3>
                <Badge className={getTierBadgeColor(sortedLeaderboard[2]?.tierName)}>
                  {sortedLeaderboard[2]?.tierName || 'Starter'}
                </Badge>
                <div className="mt-4 space-y-1">
                  <p className="text-2xl font-bold text-primary">
                    {sortBy === 'commission' 
                      ? formatCurrency(sortedLeaderboard[2]?.totalCommission || 0)
                      : `${sortedLeaderboard[2]?.conversions || 0} conversions`
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {sortBy === 'commission' 
                      ? `${sortedLeaderboard[2]?.conversions || 0} conversions`
                      : formatCurrency(sortedLeaderboard[2]?.totalCommission || 0)
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Ranking Lengkap
                </CardTitle>
                <CardDescription>Semua affiliate dengan konversi</CardDescription>
              </div>
              <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as 'commission' | 'conversions')}>
                <TabsList>
                  <TabsTrigger value="commission" className="gap-1">
                    <DollarSign className="h-4 w-4" />
                    Komisi
                  </TabsTrigger>
                  <TabsTrigger value="conversions" className="gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Conversions
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {sortedLeaderboard.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada affiliate dengan konversi</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead className="text-right">Total Komisi</TableHead>
                      <TableHead className="text-right">Dibayar</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Referrals</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedLeaderboard.map((entry) => (
                      <TableRow 
                        key={entry.userId}
                        className={entry.rank <= 3 ? 'bg-muted/30' : ''}
                      >
                        <TableCell className="text-center">
                          {getRankIcon(entry.rank)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={entry.avatarUrl || undefined} />
                              <AvatarFallback>{getInitials(entry.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{entry.name || '-'}</p>
                              <p className="text-sm text-muted-foreground">{entry.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTierBadgeColor(entry.tierName)}>
                            {entry.tierName || 'Starter'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(entry.totalCommission)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(entry.paidCommission)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {entry.conversions}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {entry.totalReferrals}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.push(`/admin/affiliates/${entry.userId}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
