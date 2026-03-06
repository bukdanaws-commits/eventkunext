'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Loader2, Home, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';

export default function Auth() {
  const router = useRouter();
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  useEffect(() => {
    const checkBlockedIP = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-blocked-ip', {
          method: 'POST',
        });
        if (error && error.message?.includes('403')) {
          setIsBlocked(true);
          setBlockReason('IP Anda telah diblokir dari sistem');
        } else if (data?.blocked) {
          setIsBlocked(true);
          setBlockReason(data.reason || 'IP Anda telah diblokir dari sistem');
        }
      } catch (err) {
        console.error('Error checking IP block status:', err);
      }
    };
    checkBlockedIP();
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const isCustomDomain =
        !window.location.hostname.includes('lovable.app') &&
        !window.location.hostname.includes('lovableproject.com');

      if (isCustomDomain) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/dashboard`,
            skipBrowserRedirect: true,
          },
        });
        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
        }
      } else {
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
        });
        if (result.error) {
          console.error('Google sign-in error:', result.error);
        }
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Mohon isi email dan password');
      return;
    }
    setLoading(true);
    try {
      const { error } = await signIn(loginEmail, loginPassword);
      if (error) {
        toast.error(error.message || 'Gagal masuk. Periksa email dan password Anda.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword || !registerConfirmPassword) {
      toast.error('Mohon lengkapi semua field');
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      toast.error('Password tidak cocok');
      return;
    }
    if (registerPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    setLoading(true);
    try {
      const { error } = await signUp(registerEmail, registerPassword, registerName);
      if (error) {
        toast.error(error.message || 'Gagal mendaftar');
      } else {
        toast.success('Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat mendaftar');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive">
              <ShieldAlert className="h-6 w-6 text-destructive-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold text-destructive">Akses Diblokir</CardTitle>
            <CardDescription className="text-destructive/80">
              {blockReason}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground text-sm">
              IP address Anda telah diblokir dari mengakses sistem ini karena aktivitas mencurigakan.
            </p>
            <p className="text-muted-foreground text-sm">
              Jika Anda merasa ini adalah kesalahan, silakan hubungi administrator.
            </p>
            <Link href="/">
              <Button variant="outline" className="mt-4">
                <Home className="mr-2 h-4 w-4" />
                Kembali ke Beranda
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Gift className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Doorprize Platform</CardTitle>
          <CardDescription>
            Platform undian & doorprize untuk event Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="register">Daftar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="Masukkan password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Masuk
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">atau</span>
                </div>
              </div>

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
            </TabsContent>

            <TabsContent value="register" className="space-y-4 mt-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Nama Lengkap</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showRegisterPassword ? 'text' : 'password'}
                      placeholder="Minimal 6 karakter"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    >
                      {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Konfirmasi Password</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    placeholder="Ulangi password"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Daftar
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">atau</span>
                </div>
              </div>

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
                Daftar dengan Google
              </Button>
            </TabsContent>
          </Tabs>

          <p className="text-center text-sm text-muted-foreground">
            Dengan masuk, Anda menyetujui{' '}
            <Link href="/terms" className="text-primary hover:underline">Syarat & Ketentuan</Link>
            {' '}dan{' '}
            <Link href="/privacy" className="text-primary hover:underline">Kebijakan Privasi</Link>
          </p>
          
          <div className="text-center">
            <Link href="/">
              <Button variant="ghost" className="text-muted-foreground">
                <Home className="mr-2 h-4 w-4" />
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
