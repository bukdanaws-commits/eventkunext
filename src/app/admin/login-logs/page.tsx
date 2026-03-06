'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  History, 
  Search, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Globe,
  Monitor,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface LoginLog {
  id: string;
  user_id: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  country: string | null;
  city: string | null;
  login_at: string;
}

interface LoginAttempt {
  id: string;
  ip_address: string;
  email: string | null;
  success: boolean;
  user_agent: string | null;
  attempted_at: string;
}

export default function AdminLoginLogs() {
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('logs');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch login logs
      const { data: logs, error: logsError } = await supabase
        .from('login_logs')
        .select('*')
        .order('login_at', { ascending: false })
        .limit(500);

      if (logsError) throw logsError;
      setLoginLogs((logs as LoginLog[]) || []);

      // Fetch login attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from('login_attempts')
        .select('*')
        .order('attempted_at', { ascending: false })
        .limit(500);

      if (attemptsError) throw attemptsError;
      setLoginAttempts((attempts as LoginAttempt[]) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data login');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = loginLogs.filter(
    (log) =>
      log.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ip_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAttempts = loginAttempts.filter(
    (attempt) =>
      attempt.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attempt.ip_address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const successfulLogins = loginLogs.length;
  const failedAttempts = loginAttempts.filter((a) => !a.success).length;
  const uniqueIPs = new Set(loginAttempts.map((a) => a.ip_address)).size;

  const getBrowserFromUserAgent = (ua: string | null) => {
    if (!ua) return 'Unknown';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <History className="h-8 w-8" />
              Log Login & Audit Trail
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor aktivitas login dan deteksi aktivitas mencurigakan
            </p>
          </div>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Login Sukses</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{successfulLogins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Login Gagal</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{failedAttempts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Percobaan</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loginAttempts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">IP Unik</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueIPs}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Riwayat Login</CardTitle>
                <CardDescription>
                  Log aktivitas login dan percobaan login yang tercatat
                </CardDescription>
              </div>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari email, IP, atau lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="logs">Login Sukses ({successfulLogins})</TabsTrigger>
                <TabsTrigger value="attempts">Semua Percobaan ({loginAttempts.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="logs">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Memuat data...
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'Tidak ada log yang cocok' : 'Belum ada log login'}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Lokasi</TableHead>
                        <TableHead>Browser</TableHead>
                        <TableHead>Waktu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.email}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.ip_address || '-'}
                          </TableCell>
                          <TableCell>
                            {log.country || log.city ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span>
                                  {[log.city, log.country].filter(Boolean).join(', ')}
                                </span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Monitor className="h-3 w-3 text-muted-foreground" />
                              <span>{getBrowserFromUserAgent(log.user_agent)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(log.login_at), 'dd MMM yyyy HH:mm:ss', {
                              locale: id,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="attempts">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Memuat data...
                  </div>
                ) : filteredAttempts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'Tidak ada log yang cocok' : 'Belum ada percobaan login'}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Browser</TableHead>
                        <TableHead>Waktu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAttempts.map((attempt) => (
                        <TableRow key={attempt.id}>
                          <TableCell>
                            <Badge variant={attempt.success ? 'default' : 'destructive'}>
                              {attempt.success ? (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Sukses</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" /> Gagal</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {attempt.email || '-'}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {attempt.ip_address}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Monitor className="h-3 w-3 text-muted-foreground" />
                              <span>{getBrowserFromUserAgent(attempt.user_agent)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(attempt.attempted_at), 'dd MMM yyyy HH:mm:ss', {
                              locale: id,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
