'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuditLog } from '@/hooks/useAdminAuditLog';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { SessionErrorAlert } from '@/components/admin/SessionErrorAlert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, UserPlus, Search, Trash2, Crown, Users, ShieldCheck, Loader2, RefreshCw, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

type AppRole = 'admin' | 'owner' | 'staff';

interface UserWithRoles {
  user_id: string;
  email: string;
  full_name: string | null;
  roles: { role: AppRole; id: string; organization_id: string | null }[];
  created_at: string;
}

const AdminRoles = () => {
  const { toast } = useToast();
  const { logAction } = useAdminAuditLog();
  const { isRefreshing, sessionError, clearSessionError, refreshSession, handleApiError } = useSessionRefresh();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('admin');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState<{ user_id: string; full_name: string | null; email: string } | null>(null);
  const [userNotFound, setUserNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | AppRole>('all');
  const [roleCounts, setRoleCounts] = useState({ admin: 0, owner: 0, staff: 0 });

  const fetchUsersWithRoles = async () => {
    setLoading(true);
    try {
      // Get all roles
      const { data: allRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role, organization_id, created_at');

      if (rolesError) throw rolesError;

      if (!allRoles || allRoles.length === 0) {
        setUsers([]);
        setRoleCounts({ admin: 0, owner: 0, staff: 0 });
        setLoading(false);
        return;
      }

      // Count roles
      const counts = { admin: 0, owner: 0, staff: 0 };
      allRoles.forEach(r => {
        if (r.role === 'admin') counts.admin++;
        else if (r.role === 'owner') counts.owner++;
        else if (r.role === 'staff') counts.staff++;
      });
      setRoleCounts(counts);

      // Get unique user IDs
      const userIds = [...new Set(allRoles.map(r => r.user_id))];
      
      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, created_at')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Build users with roles
      const usersWithRoles: UserWithRoles[] = userIds.map(userId => {
        const profile = profiles?.find(p => p.user_id === userId);
        const userRoles = allRoles
          .filter(r => r.user_id === userId)
          .map(r => ({ 
            role: r.role as AppRole, 
            id: r.id,
            organization_id: r.organization_id 
          }));
        
        return {
          user_id: userId,
          email: profile?.full_name || userId.substring(0, 8) + '...',
          full_name: profile?.full_name || null,
          roles: userRoles,
          created_at: profile?.created_at || new Date().toISOString(),
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      handleApiError(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat data roles',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersWithRoles();
  }, []);

  const searchUserByEmail = async () => {
    if (!emailInput.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Masukkan email atau nama yang valid',
      });
      return;
    }

    setSearchingUser(true);
    setFoundUser(null);
    setUserNotFound(false);

    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, created_at')
        .limit(100);

      if (profilesError) throw profilesError;

      const emailLower = emailInput.trim().toLowerCase();
      
      const matchedProfile = profiles?.find(p => 
        p.full_name?.toLowerCase() === emailLower ||
        p.full_name?.toLowerCase().includes(emailLower)
      );

      if (matchedProfile) {
        setFoundUser({
          user_id: matchedProfile.user_id,
          full_name: matchedProfile.full_name,
          email: emailInput.trim(),
        });
      } else {
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidPattern.test(emailInput.trim())) {
          const { data: profileById } = await supabase
            .from('user_profiles')
            .select('user_id, full_name')
            .eq('user_id', emailInput.trim())
            .maybeSingle();

          if (profileById) {
            setFoundUser({
              user_id: profileById.user_id,
              full_name: profileById.full_name,
              email: emailInput.trim(),
            });
          } else {
            setUserNotFound(true);
          }
        } else {
          setUserNotFound(true);
        }
      }
    } catch (error) {
      console.error('Error searching user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal mencari user',
      });
    } finally {
      setSearchingUser(false);
    }
  };

  const handleAddRole = async () => {
    if (!foundUser) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cari dan pilih user terlebih dahulu',
      });
      return;
    }

    setAdding(true);
    try {
      // Check if already has this role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', foundUser.user_id)
        .eq('role', selectedRole)
        .maybeSingle();

      if (existingRole) {
        toast({
          variant: 'destructive',
          title: 'Role Sudah Ada',
          description: `User sudah memiliki role ${selectedRole}`,
        });
        setAdding(false);
        return;
      }

      // Add role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: foundUser.user_id,
          role: selectedRole,
        });

      if (insertError) throw insertError;

      await logAction({
        action: 'user_role_changed' as const,
        targetType: 'user',
        targetId: foundUser.user_id,
        details: {
          role: selectedRole,
          target_user: foundUser.full_name,
          email: foundUser.email,
          action_type: 'add_role',
        },
      });

      toast({
        title: 'Berhasil',
        description: `Role ${selectedRole} berhasil ditambahkan untuk ${foundUser.full_name || foundUser.email}`,
      });

      setAddDialogOpen(false);
      setEmailInput('');
      setFoundUser(null);
      fetchUsersWithRoles();
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menambahkan role',
      });
    } finally {
      setAdding(false);
    }
  };

  const resetAddDialog = () => {
    setEmailInput('');
    setFoundUser(null);
    setUserNotFound(false);
    setSelectedRole('admin');
  };

  const handleRemoveRole = async (userId: string, roleId: string, role: AppRole, userName: string | null) => {
    setRemoving(roleId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      await logAction({
        action: 'user_role_changed' as const,
        targetType: 'user',
        targetId: userId,
        details: { 
          role, 
          action_type: 'remove_role',
          target_user: userName,
        },
      });

      toast({
        title: 'Berhasil',
        description: `Role ${role} berhasil dihapus`,
      });

      fetchUsersWithRoles();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menghapus role',
      });
    } finally {
      setRemoving(null);
    }
  };

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      case 'owner':
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
            <Crown className="h-3 w-3 mr-1" />
            Owner
          </Badge>
        );
      case 'staff':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            <Users className="h-3 w-3 mr-1" />
            Staff
          </Badge>
        );
    }
  };

  const getRoleDescription = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return 'Full access ke semua fitur admin';
      case 'owner':
        return 'Pemilik organisasi, dapat mengelola event';
      case 'staff':
        return 'Staff organisasi, akses terbatas';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.user_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && user.roles.some(r => r.role === activeTab);
  });

  if (sessionError) {
    return (
      <AdminLayout>
        <SessionErrorAlert
          error={sessionError}
          onRefresh={() => {
            clearSessionError();
            refreshSession().then(() => fetchUsersWithRoles());
          }}
          isRefreshing={isRefreshing}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-purple-600" />
              Kelola User Roles
            </h1>
            <p className="text-muted-foreground">
              Assign atau revoke role untuk user (Admin, Owner, Staff)
            </p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={(open) => {
            setAddDialogOpen(open);
            if (!open) resetAddDialog();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Tambah Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Assign Role Baru</DialogTitle>
                <DialogDescription>
                  Cari user berdasarkan email atau nama untuk memberikan role
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email atau Nama User</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Masukkan email atau nama user"
                      value={emailInput}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                        setFoundUser(null);
                        setUserNotFound(false);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && searchUserByEmail()}
                    />
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={searchUserByEmail}
                      disabled={searchingUser}
                    >
                      {searchingUser ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ketik email atau nama lengkap user, lalu klik tombol cari
                  </p>
                </div>

                {/* User Found Result */}
                {foundUser && (
                  <div className="p-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="font-medium">User Ditemukan!</span>
                    </div>
                    <div className="mt-2 text-sm">
                      <p><strong>Nama:</strong> {foundUser.full_name || '-'}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ID: {foundUser.user_id.substring(0, 8)}...
                      </p>
                    </div>
                  </div>
                )}

                {/* User Not Found */}
                {userNotFound && (
                  <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/10">
                    <div className="flex items-center gap-2 text-destructive">
                      <span className="font-medium">User tidak ditemukan</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pastikan email atau nama yang dimasukkan sudah benar
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Pilih Role</label>
                  <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-purple-600" />
                          <div>
                            <div className="font-medium">Admin</div>
                            <div className="text-xs text-muted-foreground">Full access ke dashboard admin</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="owner">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-600" />
                          <div>
                            <div className="font-medium">Owner</div>
                            <div className="text-xs text-muted-foreground">Pemilik organisasi</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="staff">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="font-medium">Staff</div>
                            <div className="text-xs text-muted-foreground">Staff dengan akses terbatas</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleAddRole} disabled={adding || !foundUser}>
                  {adding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Assign Role
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('admin')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Admin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold">{roleCounts.admin}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Full access ke dashboard admin</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 dark:border-amber-800 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('owner')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Owner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-600" />
                <span className="text-2xl font-bold">{roleCounts.owner}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Pemilik organisasi</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('staff')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">{roleCounts.staff}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Staff dengan akses terbatas</p>
            </CardContent>
          </Card>
        </div>

        {/* Role List with Tabs */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Daftar User Roles</CardTitle>
                <CardDescription>Kelola role untuk setiap user dengan aman</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari user..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-[200px]"
                  />
                </div>
                <Button variant="outline" size="icon" onClick={fetchUsersWithRoles}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | AppRole)} className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">Semua ({users.length})</TabsTrigger>
                <TabsTrigger value="admin" className="gap-1">
                  <Shield className="h-3 w-3" /> Admin ({roleCounts.admin})
                </TabsTrigger>
                <TabsTrigger value="owner" className="gap-1">
                  <Crown className="h-3 w-3" /> Owner ({roleCounts.owner})
                </TabsTrigger>
                <TabsTrigger value="staff" className="gap-1">
                  <Users className="h-3 w-3" /> Staff ({roleCounts.staff})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'Tidak ada user yang ditemukan' : 'Belum ada user dengan role ini'}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Roles</TableHead>
                          <TableHead>Tanggal Ditambahkan</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.user_id}>
                            <TableCell>
                              <div className="font-medium">{user.full_name || '-'}</div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {user.user_id.substring(0, 8)}...
                              </code>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {user.roles.map((roleData) => (
                                  <div key={roleData.id} className="flex items-center gap-1">
                                    {getRoleBadge(roleData.role)}
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                                          disabled={removing === roleData.id}
                                        >
                                          {removing === roleData.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-3 w-3" />
                                          )}
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Hapus Role {roleData.role}?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Role <strong>{roleData.role}</strong> akan dihapus dari user <strong>{user.full_name || user.user_id}</strong>.
                                            <br /><br />
                                            <span className="text-amber-600">
                                              {roleData.role === 'admin' && 'User tidak akan bisa mengakses dashboard admin lagi.'}
                                              {roleData.role === 'owner' && 'User tidak akan menjadi pemilik organisasi lagi.'}
                                              {roleData.role === 'staff' && 'User tidak akan memiliki akses staff lagi.'}
                                            </span>
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Batal</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleRemoveRole(user.user_id, roleData.id, roleData.role, user.full_name)}
                                            className="bg-destructive hover:bg-destructive/90"
                                          >
                                            Hapus Role
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(user.created_at), 'dd MMM yyyy', { locale: id })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Plus className="h-3 w-3 mr-1" />
                                    Role
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Tambah Role untuk {user.full_name || 'User'}</DialogTitle>
                                    <DialogDescription>
                                      Pilih role yang ingin ditambahkan
                                    </DialogDescription>
                                  </DialogHeader>
                                  <QuickAddRoleForm
                                    userId={user.user_id}
                                    userName={user.full_name}
                                    existingRoles={user.roles.map(r => r.role)}
                                    onSuccess={fetchUsersWithRoles}
                                    logAction={logAction}
                                  />
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

// Quick add role component for existing users
const QuickAddRoleForm = ({ 
  userId, 
  userName, 
  existingRoles, 
  onSuccess,
  logAction
}: { 
  userId: string; 
  userName: string | null;
  existingRoles: AppRole[];
  onSuccess: () => void;
  logAction: (params: any) => Promise<void>;
}) => {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<AppRole | ''>('');
  const [adding, setAdding] = useState(false);

  const availableRoles = (['admin', 'owner', 'staff'] as AppRole[]).filter(
    role => !existingRoles.includes(role)
  );

  const handleAdd = async () => {
    if (!selectedRole) return;
    
    setAdding(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: selectedRole,
        });

      if (error) throw error;

      await logAction({
        action: 'user_role_changed' as const,
        targetType: 'user',
        targetId: userId,
        details: {
          role: selectedRole,
          target_user: userName,
          action_type: 'add_role',
        },
      });

      toast({
        title: 'Berhasil',
        description: `Role ${selectedRole} berhasil ditambahkan`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menambahkan role',
      });
    } finally {
      setAdding(false);
    }
  };

  if (availableRoles.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        User sudah memiliki semua role
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
        <SelectTrigger>
          <SelectValue placeholder="Pilih role..." />
        </SelectTrigger>
        <SelectContent>
          {availableRoles.map((role) => (
            <SelectItem key={role} value={role}>
              <div className="flex items-center gap-2">
                {role === 'admin' && <Shield className="h-4 w-4 text-purple-600" />}
                {role === 'owner' && <Crown className="h-4 w-4 text-amber-600" />}
                {role === 'staff' && <Users className="h-4 w-4 text-blue-600" />}
                <span className="capitalize">{role}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DialogFooter>
        <Button onClick={handleAdd} disabled={adding || !selectedRole}>
          {adding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Tambah Role
        </Button>
      </DialogFooter>
    </div>
  );
};

export default AdminRoles;
