'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Loader2, Search, RefreshCw, Users, Shield, UserCog, Calendar, Mail, Phone, Building, Download, UserPlus, Ban, Trash2, Pencil, ShieldOff, AlertTriangle, Key, CheckSquare, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuditLog } from '@/hooks/useAdminAuditLog';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { SessionErrorAlert } from '@/components/admin/SessionErrorAlert';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

interface UserWithDetails {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  organization_id: string | null;
  organization_name?: string;
  created_at: string;
  role: string;
  event_count?: number;
  email?: string;
  is_blocked?: boolean;
}

export default function AdminUsers() {
  const router = useRouter();
  const { toast } = useToast();
  const { logAction } = useAdminAuditLog();
  const { 
    refreshSession, 
    getValidSession, 
    handleApiError, 
    isRefreshing, 
    sessionError, 
    clearSessionError 
  } = useSessionRefresh();

  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventCountFilter, setEventCountFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<string>('owner');
  const [creatingUser, setCreatingUser] = useState(false);

  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blocking, setBlocking] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkBlockDialogOpen, setBulkBlockDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkBlockReason, setBulkBlockReason] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: blockedUsers } = await supabase
        .from('blocked_users')
        .select('user_id')
        .eq('is_active', true);
      
      const blockedUserIds = new Set(blockedUsers?.map(b => b.user_id) || []);

      const enrichedUsers: UserWithDetails[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          let orgName = 'No Organization';
          if (profile.organization_id) {
            const { data: org } = await supabase
              .from('organizations')
              .select('name')
              .eq('id', profile.organization_id)
              .maybeSingle();
            orgName = org?.name || 'Unknown';
          }

          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id)
            .maybeSingle();

          let eventCount = 0;
          if (profile.organization_id) {
            const { count } = await supabase
              .from('events')
              .select('*', { count: 'exact', head: true })
              .eq('organization_id', profile.organization_id);
            eventCount = count || 0;
          }

          return {
            ...profile,
            organization_name: orgName,
            role: roleData?.role || 'user',
            event_count: eventCount,
            is_blocked: blockedUserIds.has(profile.user_id),
            email: profile.email || 'No email',
          };
        })
      );

      setUsers(enrichedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      const result = await handleApiError(error, fetchUsers);
      if (!result.handled) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Gagal memuat data users',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [handleApiError, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAssignRole = async () => {
    if (!selectedUser || !newRole) return;

    setProcessing(true);
    const previousRole = selectedUser.role;
    
    try {
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', selectedUser.user_id)
        .maybeSingle();

      if (existingRole) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole as 'admin' | 'owner' | 'staff' })
          .eq('user_id', selectedUser.user_id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: selectedUser.user_id,
            organization_id: selectedUser.organization_id,
            role: newRole as 'admin' | 'owner' | 'staff',
          });
        
        if (error) throw error;
      }

      await logAction({
        action: 'user_role_changed',
        targetType: 'user',
        targetId: selectedUser.user_id,
        details: {
          user_name: selectedUser.full_name,
          previous_role: previousRole,
          new_role: newRole,
          organization_id: selectedUser.organization_id,
          organization_name: selectedUser.organization_name,
        },
      });

      setUsers(prev =>
        prev.map(u => u.user_id === selectedUser.user_id ? { ...u, role: newRole } : u)
      );

      toast({
        title: 'Role Updated',
        description: `Role berhasil diubah menjadi ${newRole}`,
      });

      setRoleDialogOpen(false);
      setSelectedUser(null);
      setNewRole('');
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal mengubah role',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Email dan password wajib diisi' });
      return;
    }

    if (newUserPassword.length < 6) {
      toast({ variant: 'destructive', title: 'Error', description: 'Password minimal 6 karakter' });
      return;
    }

    setCreatingUser(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            email: newUserEmail,
            password: newUserPassword,
            fullName: newUserFullName,
            phone: newUserPhone,
            role: newUserRole,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal membuat user');
      }

      await logAction({
        action: 'user_created',
        targetType: 'user',
        targetId: result.user?.id,
        details: { email: newUserEmail, full_name: newUserFullName, role: newUserRole },
      });

      toast({ title: 'User Berhasil Dibuat', description: `User ${newUserEmail} berhasil ditambahkan` });

      setAddUserDialogOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
      setNewUserPhone('');
      setNewUserRole('owner');
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Gagal membuat user' });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleBlockUser = async () => {
    if (!selectedUser) return;
    setBlocking(true);
    const isCurrentlyBlocked = selectedUser.is_blocked;

    try {
      if (isCurrentlyBlocked) {
        const { error } = await supabase
          .from('blocked_users')
          .update({ is_active: false, unblocked_at: new Date().toISOString() })
          .eq('user_id', selectedUser.user_id)
          .eq('is_active', true);
        if (error) throw error;
        await logAction({ action: 'user_unblocked', targetType: 'user', targetId: selectedUser.user_id, details: { user_name: selectedUser.full_name, email: selectedUser.email } });
        toast({ title: 'User Unblocked', description: `${selectedUser.full_name || selectedUser.email} berhasil di-unblock` });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('blocked_users').insert({
          user_id: selectedUser.user_id,
          blocked_by: user?.id,
          reason: blockReason || 'No reason provided',
        });
        if (error) throw error;
        await logAction({ action: 'user_blocked', targetType: 'user', targetId: selectedUser.user_id, details: { user_name: selectedUser.full_name, email: selectedUser.email, reason: blockReason } });
        toast({ title: 'User Blocked', description: `${selectedUser.full_name || selectedUser.email} berhasil diblokir` });
      }

      setUsers(prev => prev.map(u => u.user_id === selectedUser.user_id ? { ...u, is_blocked: !isCurrentlyBlocked } : u));
      setBlockDialogOpen(false);
      setBlockReason('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error blocking/unblocking user:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal mengubah status block user' });
    } finally {
      setBlocking(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setDeleting(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Sesi login sudah habis. Silakan login ulang.');

      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: selectedUser.user_id },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (error) throw new Error(error.message || 'Gagal menghapus user');
      if (data?.error) throw new Error(data.error);

      await logAction({ action: 'user_deleted', targetType: 'user', targetId: selectedUser.user_id, details: { user_name: selectedUser.full_name, email: selectedUser.email } });
      toast({ title: 'User Dihapus', description: `${selectedUser.full_name || selectedUser.email} berhasil dihapus` });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Gagal menghapus user' });
    } finally {
      setDeleting(false);
    }
  };

  const handleEditProfile = async () => {
    if (!selectedUser) return;
    setSaving(true);

    try {
      const { error } = await supabase.from('user_profiles').update({ full_name: editFullName, phone: editPhone }).eq('user_id', selectedUser.user_id);
      if (error) throw error;
      await logAction({ action: 'user_profile_updated', targetType: 'user', targetId: selectedUser.user_id, details: { previous_name: selectedUser.full_name, new_name: editFullName, previous_phone: selectedUser.phone, new_phone: editPhone } });
      setUsers(prev => prev.map(u => u.user_id === selectedUser.user_id ? { ...u, full_name: editFullName, phone: editPhone } : u));
      toast({ title: 'Profile Updated', description: 'Profile user berhasil diperbarui' });
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal memperbarui profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Password dan konfirmasi password tidak sama' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: 'destructive', title: 'Error', description: 'Password minimal 6 karakter' });
      return;
    }
    setResettingPassword(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ userId: selectedUser.user_id, newPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal reset password');
      await logAction({ action: 'user_profile_updated', targetType: 'user', targetId: selectedUser.user_id, details: { user_name: selectedUser.full_name, email: selectedUser.email, action: 'password_reset' } });
      toast({ title: 'Password Berhasil Direset', description: `Password untuk ${selectedUser.full_name || selectedUser.email} berhasil diubah` });
      setResetPasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Gagal reset password' });
    } finally {
      setResettingPassword(false);
    }
  };

  const handleBulkBlock = async () => {
    if (selectedUsers.size === 0) return;
    setBulkProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const usersToBlock = users.filter(u => selectedUsers.has(u.user_id) && !u.is_blocked);
      
      for (const userToBlock of usersToBlock) {
        await supabase.from('blocked_users').insert({
          user_id: userToBlock.user_id,
          blocked_by: user?.id,
          reason: bulkBlockReason || 'Bulk block action',
        });
        await logAction({ action: 'user_blocked', targetType: 'user', targetId: userToBlock.user_id, details: { user_name: userToBlock.full_name, email: userToBlock.email, reason: bulkBlockReason || 'Bulk block action' } });
      }

      toast({ title: 'Users Diblokir', description: `${usersToBlock.length} user berhasil diblokir` });
      setSelectedUsers(new Set());
      setBulkBlockDialogOpen(false);
      setBulkBlockReason('');
      fetchUsers();
    } catch (error) {
      console.error('Error bulk blocking users:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal memblokir users' });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    setBulkProcessing(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Sesi login sudah habis. Silakan login ulang.');

      const usersToDelete = users.filter(u => selectedUsers.has(u.user_id));
      let successCount = 0;

      for (const userToDelete of usersToDelete) {
        const { data, error } = await supabase.functions.invoke('delete-user', {
          body: { userId: userToDelete.user_id },
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!error && !data?.error) {
          successCount++;
          await logAction({ action: 'user_deleted', targetType: 'user', targetId: userToDelete.user_id, details: { user_name: userToDelete.full_name, email: userToDelete.email, action: 'bulk_delete' } });
        }
      }

      toast({ title: 'Users Dihapus', description: `${successCount} user berhasil dihapus` });
      setSelectedUsers(new Set());
      setBulkDeleteDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus users' });
    } finally {
      setBulkProcessing(false);
    }
  };

  const toggleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) newSelected.delete(userId);
    else newSelected.add(userId);
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) setSelectedUsers(new Set());
    else setSelectedUsers(new Set(filteredUsers.map(u => u.user_id)));
  };

  const exportToExcel = () => {
    const exportData = filteredUsers.map(u => ({
      'Name': u.full_name || '-',
      'Email': u.email || '-',
      'Phone': u.phone || '-',
      'Organization': u.organization_name,
      'Role': u.role,
      'Events': u.event_count,
      'Joined': format(new Date(u.created_at), 'dd MMM yyyy', { locale: localeId }),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, `users_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    toast({ title: 'Export Berhasil', description: 'File Excel berhasil diunduh' });
  };

  function getRoleBadge(role: string) {
    const roleMap: Record<string, { label: string; className: string }> = {
      admin: { label: 'Admin', className: 'bg-red-100 text-red-800' },
      owner: { label: 'Owner', className: 'bg-purple-100 text-purple-800' },
      staff: { label: 'Staff', className: 'bg-blue-100 text-blue-800' },
      user: { label: 'User', className: 'bg-slate-100 text-slate-800' },
    };
    const config = roleMap[role] || roleMap.user;
    return <Badge className={`${config.className} hover:${config.className}`}>{config.label}</Badge>;
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.organization_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'blocked' && user.is_blocked) || (statusFilter === 'active' && !user.is_blocked);
    const matchesEventCount = eventCountFilter === 'all' ||
      (eventCountFilter === '0' && (user.event_count || 0) === 0) ||
      (eventCountFilter === '1-5' && (user.event_count || 0) >= 1 && (user.event_count || 0) <= 5) ||
      (eventCountFilter === '6-10' && (user.event_count || 0) >= 6 && (user.event_count || 0) <= 10) ||
      (eventCountFilter === '10+' && (user.event_count || 0) > 10);
    const userDate = new Date(user.created_at);
    const matchesDateFrom = !dateFrom || userDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || userDate <= new Date(dateTo + 'T23:59:59');
    return matchesSearch && matchesRole && matchesStatus && matchesEventCount && matchesDateFrom && matchesDateTo;
  });

  const adminCount = users.filter(u => u.role === 'admin').length;
  const ownerCount = users.filter(u => u.role === 'owner').length;
  const totalOrgs = new Set(users.map(u => u.organization_id).filter(Boolean)).size;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-1">Kelola semua users dan assign roles</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setAddUserDialogOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
            <Button onClick={exportToExcel} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        <SessionErrorAlert error={sessionError} isRefreshing={isRefreshing} onRefresh={refreshSession} onDismiss={clearSessionError} />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2"><Users className="h-4 w-4" />Total Users</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{users.length}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950 border-red-200 dark:border-red-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2"><Shield className="h-4 w-4" />Admins</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-700 dark:text-red-300">{adminCount}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-2"><UserCog className="h-4 w-4" />Owners</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{ownerCount}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2"><Building className="h-4 w-4" />Organizations</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{totalOrgs}</div></CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari nama, email, atau organization..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Role</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchUsers} className="gap-2"><RefreshCw className="h-4 w-4" />Refresh</Button>
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap">Events:</Label>
                  <Select value={eventCountFilter} onValueChange={setEventCountFilter}>
                    <SelectTrigger className="w-[120px]"><SelectValue placeholder="Event Count" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="0">0 Events</SelectItem>
                      <SelectItem value="1-5">1-5 Events</SelectItem>
                      <SelectItem value="6-10">6-10 Events</SelectItem>
                      <SelectItem value="10+">10+ Events</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap">Joined:</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" />
                  <span className="text-muted-foreground">-</span>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" />
                </div>
                {(statusFilter !== 'all' || eventCountFilter !== 'all' || dateFrom || dateTo) && (
                  <Button variant="ghost" size="sm" onClick={() => { setStatusFilter('all'); setEventCountFilter('all'); setDateFrom(''); setDateTo(''); }} className="text-muted-foreground">Clear Filters</Button>
                )}
              </div>
              {filteredUsers.length !== users.length && (
                <div className="text-sm text-muted-foreground">Menampilkan {filteredUsers.length} dari {users.length} users</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bulk Action Bar */}
        {selectedUsers.size > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  <span className="font-medium">{selectedUsers.size} user dipilih</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setBulkBlockDialogOpen(true)} className="gap-2 text-orange-600 hover:text-orange-700 border-orange-300 hover:bg-orange-50"><Ban className="h-4 w-4" />Block Selected</Button>
                  <Button variant="outline" size="sm" onClick={() => setBulkDeleteDialogOpen(true)} className="gap-2 text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"><Trash2 className="h-4 w-4" />Delete Selected</Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedUsers(new Set())}>Clear Selection</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"><Checkbox checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0} onCheckedChange={toggleSelectAll} /></TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Tidak ada user ditemukan</TableCell></TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className={selectedUsers.has(user.user_id) ? 'bg-primary/5' : ''}>
                      <TableCell><Checkbox checked={selectedUsers.has(user.user_id)} onCheckedChange={() => toggleSelectUser(user.user_id)} /></TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.full_name || 'No Name'}</div>
                          {user.email && <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{user.email}</div>}
                          {user.phone && <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{user.phone}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">{user.organization_name}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.is_blocked ? (
                          <Badge variant="destructive" className="gap-1"><Ban className="h-3 w-3" />Blocked</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>{user.event_count}</TableCell>
                      <TableCell className="text-sm">{format(new Date(user.created_at), 'dd MMM yyyy', { locale: localeId })}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/users/${user.user_id}`)} className="gap-1"><Eye className="h-3 w-3" />Detail</Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => { setSelectedUser(user); setEditFullName(user.full_name || ''); setEditPhone(user.phone || ''); setEditDialogOpen(true); }} title="Edit Profile"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50" onClick={() => { setSelectedUser(user); setNewRole(user.role); setRoleDialogOpen(true); }} title="Change Role"><UserCog className="h-4 w-4" /></Button>
                          <Button variant="outline" size="icon" className={`h-8 w-8 ${user.is_blocked ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'}`} onClick={() => { setSelectedUser(user); setBlockReason(''); setBlockDialogOpen(true); }} title={user.is_blocked ? 'Unblock User' : 'Block User'}>{user.is_blocked ? <ShieldOff className="h-4 w-4" /> : <Ban className="h-4 w-4" />}</Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => { setSelectedUser(user); setNewPassword(''); setConfirmPassword(''); setResetPasswordDialogOpen(true); }} title="Reset Password"><Key className="h-4 w-4" /></Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true); }} title="Delete User"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialogs - condensed for brevity */}
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Assign Role</DialogTitle><DialogDescription>Ubah role untuk user: {selectedUser?.full_name || 'Unknown'}</DialogDescription></DialogHeader>
            <div className="py-4">
              <Label htmlFor="role">Select Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="mt-2"><SelectValue placeholder="Pilih role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin"><div className="flex items-center gap-2"><Shield className="h-4 w-4 text-red-600" /><span>Admin</span><span className="text-xs text-muted-foreground">- Full access</span></div></SelectItem>
                  <SelectItem value="owner"><div className="flex items-center gap-2"><UserCog className="h-4 w-4 text-purple-600" /><span>Owner</span><span className="text-xs text-muted-foreground">- Organization owner</span></div></SelectItem>
                  <SelectItem value="staff"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-600" /><span>Staff</span><span className="text-xs text-muted-foreground">- Limited access</span></div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>Batal</Button>
              <Button onClick={handleAssignRole} disabled={processing || !newRole} className="bg-purple-600 hover:bg-purple-700">{processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Role</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" />Add New User</DialogTitle><DialogDescription>Buat akun user baru. User akan otomatis ter-verifikasi.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label htmlFor="email">Email *</Label><Input id="email" type="email" placeholder="user@example.com" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} /></div>
              <div className="grid gap-2"><Label htmlFor="password">Password *</Label><Input id="password" type="password" placeholder="Minimal 6 karakter" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} /></div>
              <div className="grid gap-2"><Label htmlFor="fullName">Nama Lengkap</Label><Input id="fullName" placeholder="John Doe" value={newUserFullName} onChange={(e) => setNewUserFullName(e.target.value)} /></div>
              <div className="grid gap-2"><Label htmlFor="phone">No. Telepon</Label><Input id="phone" placeholder="08123456789" value={newUserPhone} onChange={(e) => setNewUserPhone(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Role</Label><Select value={newUserRole} onValueChange={setNewUserRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="owner">Owner</SelectItem><SelectItem value="staff">Staff</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setAddUserDialogOpen(false)}>Batal</Button><Button onClick={handleCreateUser} disabled={creatingUser}>{creatingUser ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create User'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader><DialogTitle>{selectedUser?.is_blocked ? 'Unblock User' : 'Block User'}</DialogTitle><DialogDescription>{selectedUser?.is_blocked ? `Buka blokir ${selectedUser?.full_name || 'user ini'}` : `Blokir ${selectedUser?.full_name || 'user ini'}`}</DialogDescription></DialogHeader>
            {!selectedUser?.is_blocked && <div className="space-y-2"><Label>Alasan Blokir</Label><Textarea placeholder="Masukkan alasan..." value={blockReason} onChange={(e) => setBlockReason(e.target.value)} /></div>}
            <DialogFooter><Button variant="outline" onClick={() => setBlockDialogOpen(false)}>Batal</Button><Button variant={selectedUser?.is_blocked ? 'default' : 'destructive'} onClick={handleBlockUser} disabled={blocking}>{blocking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}{selectedUser?.is_blocked ? 'Unblock' : 'Block'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Profile</DialogTitle><DialogDescription>Edit profil untuk {selectedUser?.full_name || 'user'}</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} /></div>
              <div className="space-y-2"><Label>No. Telepon</Label><Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setEditDialogOpen(false)}>Batal</Button><Button onClick={handleEditProfile} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Reset Password</DialogTitle><DialogDescription>Reset password untuk {selectedUser?.full_name || 'user'}</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Password Baru</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
              <div className="space-y-2"><Label>Konfirmasi Password</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>Batal</Button><Button onClick={handleResetPassword} disabled={resettingPassword}>{resettingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Reset Password</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Hapus User?</AlertDialogTitle><AlertDialogDescription>User {selectedUser?.full_name || selectedUser?.email} akan dihapus permanen.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">{deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Hapus</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={bulkBlockDialogOpen} onOpenChange={setBulkBlockDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Blokir {selectedUsers.size} User?</AlertDialogTitle><AlertDialogDescription>User yang dipilih akan diblokir.</AlertDialogDescription></AlertDialogHeader>
            <div className="py-2"><Label>Alasan</Label><Textarea value={bulkBlockReason} onChange={(e) => setBulkBlockReason(e.target.value)} /></div>
            <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={handleBulkBlock}>{bulkProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Block</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Hapus {selectedUsers.size} User?</AlertDialogTitle><AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">{bulkProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Hapus</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
