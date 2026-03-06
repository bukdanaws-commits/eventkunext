'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { useAuth } from '@/hooks/useAuth'

export default function AdminRolesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [roleCounts, setRoleCounts] = useState({ admin: 0, owner: 0, staff: 0 })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Kelola User Roles</h1>
            <p className="text-muted-foreground">
              Assign atau revoke role untuk user (Admin, Owner, Staff)
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('admin')}>
            <div className="text-sm font-medium text-muted-foreground">Total Admin</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold">{roleCounts.admin}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Full access ke dashboard admin</p>
          </div>
          <div className="rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('owner')}>
            <div className="text-sm font-medium text-muted-foreground">Total Owner</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold">{roleCounts.owner}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pemilik organisasi</p>
          </div>
          <div className="rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('staff')}>
            <div className="text-sm font-medium text-muted-foreground">Total Staff</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold">{roleCounts.staff}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Staff dengan akses terbatas</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-lg border">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center gap-4">
              <input
                type="text"
                placeholder="Cari user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 max-w-sm px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>
          <div className="p-4">
            <p className="text-center text-muted-foreground py-8">
              Fitur manajemen roles memerlukan integrasi database.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
