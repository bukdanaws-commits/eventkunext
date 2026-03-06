'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const mockLeaderboard = [
  { rank: 1, name: 'Ahmad Rizki', referrals: 150, earnings: 1500000 },
  { rank: 2, name: 'Siti Nurhaliza', referrals: 120, earnings: 1200000 },
  { rank: 3, name: 'Budi Santoso', referrals: 100, earnings: 1000000 },
  { rank: 4, name: 'Dewi Lestari', referrals: 85, earnings: 850000 },
  { rank: 5, name: 'Eko Prasetyo', referrals: 70, earnings: 700000 },
];

export default function AffiliateLeaderboardPage() {
  const [loading] = useState(false);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground">{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leaderboard Afiliasi</h1>
            <p className="text-muted-foreground">Top affiliate bulan ini</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/">Kembali</Link>
          </Button>
        </div>

        {/* Top 3 */}
        <div className="grid gap-4 md:grid-cols-3">
          {mockLeaderboard.slice(0, 3).map((item, index) => (
            <Card key={item.rank} className={index === 0 ? 'border-yellow-500' : ''}>
              <CardHeader className="text-center">
                <div className="mx-auto mb-2">
                  {getRankIcon(item.rank)}
                </div>
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <CardDescription>{item.referrals} referral</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold text-primary">
                  Rp {item.earnings.toLocaleString('id-ID')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>Peringkat Lengkap</CardTitle>
            <CardDescription>Top affiliate berdasarkan jumlah referral</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="text-center">Referral</TableHead>
                    <TableHead className="text-right">Pendapatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLeaderboard.map((item) => (
                    <TableRow key={item.rank}>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {getRankIcon(item.rank)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{item.referrals}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        Rp {item.earnings.toLocaleString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
