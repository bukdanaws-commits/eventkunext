'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ticket, Search, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function TicketStatusPage() {
  const [ticketNumber, setTicketNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<{
    found: boolean;
    participant?: {
      name: string;
      event: string;
      status: string;
      checkedIn: boolean;
    };
  } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketNumber.trim()) return;

    setSearching(true);
    // Simulate search
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock result
    if (ticketNumber.toUpperCase().startsWith('TKT')) {
      setResult({
        found: true,
        participant: {
          name: 'John Doe',
          event: 'Grand Prize Festival 2025',
          status: 'registered',
          checkedIn: false,
        },
      });
    } else {
      setResult({ found: false });
    }
    setSearching(false);
  };

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="container max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Ticket className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold">Cek Status Tiket</h1>
          <p className="text-muted-foreground mt-2">
            Masukkan nomor tiket untuk melihat status pendaftaran Anda
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cari Tiket</CardTitle>
            <CardDescription>
              Masukkan nomor tiket yang Anda terima via email atau SMS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ticket">Nomor Tiket</Label>
                <div className="flex gap-2">
                  <Input
                    id="ticket"
                    placeholder="Contoh: TKT-ABC123"
                    value={ticketNumber}
                    onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
                  />
                  <Button type="submit" disabled={searching}>
                    {searching ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.found ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Tiket Ditemukan
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    Tiket Tidak Ditemukan
                  </>
                )}
              </CardTitle>
            </CardHeader>
            {result.found && result.participant && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nama</p>
                    <p className="font-medium">{result.participant.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Event</p>
                    <p className="font-medium">{result.participant.event}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{result.participant.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Check-in</p>
                    <p className="font-medium">
                      {result.participant.checkedIn ? 'Sudah Check-in' : 'Belum Check-in'}
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        <div className="mt-8 text-center">
          <Button variant="outline" asChild>
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
