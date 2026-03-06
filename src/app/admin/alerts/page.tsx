'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, ShieldAlert, CreditCard, UserX, RefreshCw, CheckCircle, Ban } from 'lucide-react';
import { format, subDays, subHours } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuditLog } from '@/hooks/useAdminAuditLog';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { SessionErrorAlert } from '@/components/admin/SessionErrorAlert';

interface Alert {
  id: string;
  type: 'failed_payment' | 'multiple_failures' | 'unusual_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  details: Record<string, any>;
  timestamp: string;
  resolved: boolean;
  userId?: string;
  organizationId?: string;
}

interface BlockedUser {
  id: string;
  user_id: string;
  reason: string;
  blocked_at: string;
  is_active: boolean;
}

export default function AdminAlerts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { logAction } = useAdminAuditLog();
  const { isRefreshing, sessionError, clearSessionError, refreshSession, handleApiError } = useSessionRefresh();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [stats, setStats] = useState({
    totalAlerts: 0,
    criticalAlerts: 0,
    failedPayments24h: 0,
    suspiciousUsers: 0,
    blockedUsers: 0,
  });

  // Block dialog states
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockingAlert, setBlockingAlert] = useState<Alert | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    fetchAlerts();
    fetchBlockedUsers();

    // Subscribe to blocked users updates
    const channel = supabase
      .channel('blocked-users-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocked_users',
        },
        () => {
          fetchBlockedUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchBlockedUsers() {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('*')
        .eq('is_active', true)
        .order('blocked_at', { ascending: false });

      if (error) throw error;
      setBlockedUsers(data || []);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  }

  async function fetchAlerts() {
    setLoading(true);
    try {
      const now = new Date();
      const twentyFourHoursAgo = subHours(now, 24);
      const sevenDaysAgo = subDays(now, 7);

      // Fetch blocked users count
      const { count: blockedCount } = await supabase
        .from('blocked_users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch failed payments in last 24 hours
      const { data: failedPayments } = await supabase
        .from('event_payments')
        .select('*, events(name)')
        .eq('payment_status', 'failed')
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: false });

      // Fetch expired payments
      const { data: expiredPayments } = await supabase
        .from('event_payments')
        .select('*, events(name)')
        .eq('payment_status', 'expired')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      // Find users with multiple failed payments
      const failedByUser: Record<string, any[]> = {};
      failedPayments?.forEach((payment) => {
        if (!failedByUser[payment.organization_id]) {
          failedByUser[payment.organization_id] = [];
        }
        failedByUser[payment.organization_id].push(payment);
      });

      // Generate alerts
      const generatedAlerts: Alert[] = [];

      // Single failed payments
      failedPayments?.forEach((payment) => {
        generatedAlerts.push({
          id: `failed-${payment.id}`,
          type: 'failed_payment',
          severity: 'medium',
          title: 'Pembayaran Gagal',
          description: `Pembayaran untuk event "${payment.events?.name || 'Unknown'}" gagal`,
          details: {
            eventName: payment.events?.name,
            amount: payment.total_amount,
            paymentMethod: payment.payment_method,
            orderId: payment.midtrans_order_id,
          },
          timestamp: payment.created_at,
          resolved: false,
          organizationId: payment.organization_id,
        });
      });

      // Multiple failed payments from same org (suspicious)
      Object.entries(failedByUser).forEach(([orgId, payments]) => {
        if (payments.length >= 3) {
          generatedAlerts.push({
            id: `multi-fail-${orgId}`,
            type: 'multiple_failures',
            severity: 'critical',
            title: 'Aktivitas Mencurigakan: Multiple Failed Payments',
            description: `${payments.length} kegagalan pembayaran dari satu organisasi dalam 24 jam terakhir`,
            details: {
              organizationId: orgId,
              failureCount: payments.length,
              totalAttemptedAmount: payments.reduce((sum, p) => sum + p.total_amount, 0),
              payments: payments.map(p => ({
                id: p.id,
                amount: p.total_amount,
                time: p.created_at,
              })),
            },
            timestamp: payments[0].created_at,
            resolved: false,
            organizationId: orgId,
          });
        }
      });

      // Expired payments (may indicate abandoned carts or technical issues)
      if (expiredPayments && expiredPayments.length >= 5) {
        generatedAlerts.push({
          id: 'high-expired-rate',
          type: 'unusual_activity',
          severity: 'high',
          title: 'Tingkat Expired Payments Tinggi',
          description: `${expiredPayments.length} pembayaran expired dalam 7 hari terakhir`,
          details: {
            count: expiredPayments.length,
            totalAmount: expiredPayments.reduce((sum, p) => sum + p.total_amount, 0),
          },
          timestamp: new Date().toISOString(),
          resolved: false,
        });
      }

      // Sort by severity and timestamp
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      generatedAlerts.sort((a, b) => {
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      setAlerts(generatedAlerts);
      setStats({
        totalAlerts: generatedAlerts.length,
        criticalAlerts: generatedAlerts.filter(a => a.severity === 'critical').length,
        failedPayments24h: failedPayments?.length || 0,
        suspiciousUsers: Object.keys(failedByUser).filter(k => failedByUser[k].length >= 3).length,
        blockedUsers: blockedCount || 0,
      });
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  const openBlockDialog = (alert: Alert) => {
    setBlockingAlert(alert);
    setBlockReason(`Suspicious activity detected: ${alert.title}`);
    setBlockDialogOpen(true);
  };

  const handleBlockUser = async () => {
    if (!blockingAlert?.organizationId || !blockReason.trim()) return;

    setBlocking(true);
    try {
      // Get user_id from organization
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('organization_id', blockingAlert.organizationId)
        .single();

      if (!profile) {
        toast({ variant: 'destructive', title: 'Error', description: 'User tidak ditemukan' });
        return;
      }

      // Insert blocked user record
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          user_id: profile.user_id,
          reason: blockReason,
          blocked_by: user?.id,
        });

      if (error) throw error;

      // Log the action
      await logAction({
        action: 'user_blocked',
        targetType: 'user',
        targetId: profile.user_id,
        details: {
          reason: blockReason,
          alertType: blockingAlert.type,
          alertId: blockingAlert.id,
        },
      });

      toast({ title: 'User diblokir', description: 'Notifikasi telah dikirim ke admin lain' });
      setBlockDialogOpen(false);
      setBlockingAlert(null);
      setBlockReason('');
      fetchAlerts();
      fetchBlockedUsers();
    } catch (error: any) {
      console.error('Error blocking user:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblockUser = async (blockedUser: BlockedUser) => {
    if (!confirm('Unblock user ini?')) return;

    try {
      const { error } = await supabase
        .from('blocked_users')
        .update({
          is_active: false,
          unblocked_at: new Date().toISOString(),
        })
        .eq('id', blockedUser.id);

      if (error) throw error;

      await logAction({
        action: 'user_unblocked',
        targetType: 'user',
        targetId: blockedUser.user_id,
        details: { previousReason: blockedUser.reason },
      });

      toast({ title: 'User di-unblock' });
      fetchBlockedUsers();
      fetchAlerts();
    } catch (error: any) {
      console.error('Error unblocking user:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const getSeverityBadge = (severity: Alert['severity']) => {
    const styles = {
      critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-300',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300',
      low: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-300',
    };
    return <Badge className={styles[severity]}>{severity.toUpperCase()}</Badge>;
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'failed_payment':
        return <CreditCard className="h-5 w-5 text-orange-500" />;
      case 'multiple_failures':
        return <ShieldAlert className="h-5 w-5 text-red-500" />;
      case 'unusual_activity':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Security Alerts</h1>
            <p className="text-muted-foreground mt-1">Monitor aktivitas mencurigakan dan failed payments</p>
          </div>
          <Button onClick={fetchAlerts} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardDescription>Total Alerts</CardDescription>
              <CardTitle className="text-3xl">{stats.totalAlerts}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardDescription>Critical Alerts</CardDescription>
              <CardTitle className="text-3xl text-red-600">{stats.criticalAlerts}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardDescription>Failed Payments (24h)</CardDescription>
              <CardTitle className="text-3xl">{stats.failedPayments24h}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
              <CardDescription>Suspicious Users</CardDescription>
              <CardTitle className="text-3xl">{stats.suspiciousUsers}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-gray-500">
            <CardHeader className="pb-2">
              <CardDescription>Blocked Users</CardDescription>
              <CardTitle className="text-3xl">{stats.blockedUsers}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Alerts List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                Active Alerts
              </CardTitle>
              <CardDescription>
                Peringatan yang memerlukan perhatian
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium">Tidak Ada Alert</h3>
                  <p className="text-muted-foreground">Semua sistem berjalan normal</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <Card key={alert.id} className={`border-l-4 ${
                        alert.severity === 'critical' ? 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20' :
                        alert.severity === 'high' ? 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20' :
                        alert.severity === 'medium' ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20' :
                        'border-l-blue-500'
                      }`}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-4">
                            <div className="p-2 rounded-full bg-background border">
                              {getAlertIcon(alert.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {getSeverityBadge(alert.severity)}
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(alert.timestamp), 'dd MMM yyyy, HH:mm', { locale: localeId })}
                                </span>
                              </div>
                              <h4 className="font-semibold text-foreground">{alert.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                              
                              {/* Alert Details */}
                              <div className="mt-3 p-3 rounded-lg bg-muted/50">
                                {alert.type === 'failed_payment' && (
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Event:</span>{' '}
                                      <span className="font-medium">{alert.details.eventName}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Amount:</span>{' '}
                                      <span className="font-medium">{formatCurrency(alert.details.amount)}</span>
                                    </div>
                                  </div>
                                )}
                                {alert.type === 'multiple_failures' && (
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Failed Attempts:</span>
                                      <span className="font-medium text-red-600">{alert.details.failureCount}x</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Total Amount:</span>
                                      <span className="font-medium">{formatCurrency(alert.details.totalAttemptedAmount)}</span>
                                    </div>
                                  </div>
                                )}
                                {alert.type === 'unusual_activity' && (
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Count:</span>{' '}
                                      <span className="font-medium">{alert.details.count}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Total:</span>{' '}
                                      <span className="font-medium">{formatCurrency(alert.details.totalAmount)}</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Block User Button */}
                              {(alert.type === 'multiple_failures' || alert.severity === 'critical') && alert.organizationId && (
                                <div className="mt-3">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => openBlockDialog(alert)}
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Block User
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Blocked Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-gray-500" />
                Blocked Users
              </CardTitle>
              <CardDescription>Users yang diblokir karena aktivitas mencurigakan</CardDescription>
            </CardHeader>
            <CardContent>
              {blockedUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada user yang diblokir
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {blockedUsers.map((blocked) => (
                      <div
                        key={blocked.id}
                        className="p-3 rounded-lg border bg-red-50/50 dark:bg-red-950/20"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              User ID: {blocked.user_id.slice(0, 8)}...
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {blocked.reason}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(blocked.blocked_at), 'dd MMM yyyy, HH:mm', { locale: localeId })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnblockUser(blocked)}
                          >
                            Unblock
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Block User Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block User</DialogTitle>
            <DialogDescription>
              Block user ini karena aktivitas mencurigakan. Notifikasi akan dikirim ke admin lain.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Alasan Block</Label>
              <Textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Jelaskan alasan block user..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlockUser}
              disabled={blocking || !blockReason.trim()}
            >
              {blocking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Block User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
