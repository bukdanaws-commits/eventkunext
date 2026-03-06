'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import { Loader2, QrCode, Scan } from 'lucide-react';

interface ScannerEvent {
  id: string;
  name: string;
  event_date: string;
}

export default function ScannerLogin() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [checkingScanner, setCheckingScanner] = useState(false);
  const [scannerEvents, setScannerEvents] = useState<ScannerEvent[]>([]);

  useEffect(() => {
    if (user && !authLoading) {
      checkScannerAccess(user.id);
    }
  }, [user, authLoading]);

  const checkScannerAccess = async (userId: string) => {
    setCheckingScanner(true);
    try {
      const { data: scannerData, error } = await supabase
        .from('event_scanners')
        .select(`
          event_id,
          events:event_id (
            id,
            name,
            event_date,
            status
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      const events: ScannerEvent[] = (scannerData || [])
        .filter((s: any) => s.events && s.events.status === 'active')
        .map((s: any) => ({
          id: s.events.id,
          name: s.events.name,
          event_date: s.events.event_date
        }));

      if (events.length === 1) {
        router.push(`/scanner/${events[0].id}`);
      } else if (events.length > 1) {
        setScannerEvents(events);
      } else {
        toast.error('Anda tidak terdaftar sebagai scanner untuk event aktif manapun');
      }
    } catch (error) {
      console.error('Error checking scanner access:', error);
      toast.error('Gagal memeriksa akses scanner');
    } finally {
      setCheckingScanner(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error('Gagal login dengan Google');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Gagal login');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checkingScanner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {checkingScanner ? 'Memeriksa akses scanner...' : 'Memuat...'}
          </p>
        </div>
      </div>
    );
  }

  if (user && scannerEvents.length > 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto rounded-full bg-primary/10 p-4 w-fit mb-4">
              <Scan className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Pilih Event</CardTitle>
            <CardDescription>
              Anda terdaftar sebagai scanner untuk beberapa event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {scannerEvents.map((event) => (
              <Button
                key={event.id}
                variant="outline"
                className="w-full justify-start h-auto py-3"
                onClick={() => router.push(`/scanner/${event.id}`)}
              >
                <QrCode className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{event.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.event_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto rounded-full bg-primary/10 p-4 w-fit mb-4">
            <QrCode className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Login Scanner</CardTitle>
          <CardDescription>
            Masuk dengan akun Google untuk melakukan check-in peserta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full h-12 text-base gap-3"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Masuk dengan Google
          </Button>
          
          <div className="pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Khusus untuk petugas check-in event.
              <br />
              Hubungi admin jika Anda tidak memiliki akun.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
