'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save, Shield, Database, Mail, Globe } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(() => !user || authLoading)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    toast.success('Pengaturan berhasil disimpan')
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pengaturan Admin</h1>
          <p className="text-muted-foreground mt-1">Konfigurasi sistem dan pengaturan platform</p>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Pengaturan Umum
            </CardTitle>
            <CardDescription>Pengaturan dasar platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="site-name">Nama Platform</Label>
                <Input id="site-name" defaultValue="Eventku.co.id" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-email">Email Support</Label>
                <Input id="support-email" type="email" defaultValue="support@eventku.co.id" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Keamanan
            </CardTitle>
            <CardDescription>Pengaturan keamanan platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="max-login-attempts">Maksimal Percobaan Login</Label>
                <Input id="max-login-attempts" type="number" defaultValue="5" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (menit)</Label>
                <Input id="session-timeout" type="number" defaultValue="60" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email
            </CardTitle>
            <CardDescription>Konfigurasi email SMTP</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input id="smtp-host" placeholder="smtp.example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input id="smtp-port" type="number" defaultValue="587" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database
            </CardTitle>
            <CardDescription>Informasi koneksi database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Database berjalan dengan konfigurasi standar. Tidak ada pengaturan yang perlu diubah.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Simpan Pengaturan
          </Button>
        </div>
      </div>
    </AdminLayout>
  )
}
