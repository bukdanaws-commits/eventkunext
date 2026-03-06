'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, DollarSign, Edit, Save, Check } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminPricingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(() => !user || authLoading)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  const tiers = [
    { id: 'free', name: 'Free', price: 0, participants: 30, hiburan: 1, utama: 1, grand: 1 },
    { id: 'basic', name: 'Basic', price: 1000000, participants: 100, hiburan: 20, utama: 5, grand: 1 },
    { id: 'pro', name: 'Pro', price: 1500000, participants: 500, hiburan: 50, utama: 30, grand: -1 },
    { id: 'enterprise', name: 'Enterprise', price: 2000000, participants: -1, hiburan: -1, utama: -1, grand: 1 },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    toast.success('Pengaturan pricing berhasil disimpan')
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pengaturan Pricing</h1>
            <p className="text-muted-foreground mt-1">Kelola harga dan batasan tier event</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Simpan Perubahan
          </Button>
        </div>

        {/* Pricing Tiers */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => (
            <Card key={tier.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{tier.name}</CardTitle>
                  <Badge variant={tier.id === 'pro' ? 'default' : 'outline'}>
                    {tier.id === 'pro' && 'Popular'}
                  </Badge>
                </div>
                <CardDescription>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrency(tier.price)}
                  </div>
                  <div className="text-sm">per event</div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`${tier.id}-price`}>Harga (IDR)</Label>
                  <Input
                    id={`${tier.id}-price`}
                    type="number"
                    defaultValue={tier.price}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${tier.id}-participants`}>Maks Peserta</Label>
                  <Input
                    id={`${tier.id}-participants`}
                    type="number"
                    defaultValue={tier.participants === -1 ? 'Unlimited' : tier.participants}
                    placeholder={tier.participants === -1 ? 'Unlimited' : undefined}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Hiburan</Label>
                    <Input
                      type="number"
                      defaultValue={tier.hiburan === -1 ? -1 : tier.hiburan}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Utama</Label>
                    <Input
                      type="number"
                      defaultValue={tier.utama === -1 ? -1 : tier.utama}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Grand Prize</Label>
                    <Input
                      type="number"
                      defaultValue={tier.grand}
                      className="h-8"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Tambahan</CardTitle>
            <CardDescription>Pengaturan harga untuk fitur tambahan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="form-builder-price">Form Builder Add-on</Label>
                <Input
                  id="form-builder-price"
                  type="number"
                  defaultValue="300000"
                />
                <p className="text-xs text-muted-foreground">
                  Harga tambahan untuk fitur form builder
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-domain-price">Custom Domain</Label>
                <Input
                  id="custom-domain-price"
                  type="number"
                  defaultValue="500000"
                />
                <p className="text-xs text-muted-foreground">
                  Harga tambahan untuk custom domain
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
