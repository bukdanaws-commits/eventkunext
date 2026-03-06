'use client'

import { useState } from 'react'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { useEvents } from '@/hooks/useEvents'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Loader2, 
  Plus, 
  Calendar, 
  Users, 
  Trophy, 
  Search,
  Gift,
  Sparkles, 
  ArrowRight, 
  Check,
  LayoutDashboard,
  Mail,
  BarChart3,
  QrCode,
  Home,
  Eye,
  EyeOff,
  LogOut,
  Settings,
  ExternalLink,
  MapPin,
  Clock,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// Landing Page Component
function LandingPage() {
  const features = [
    { icon: LayoutDashboard, title: 'Manajemen Event Terpusat', description: 'Kelola semua event dalam satu dashboard dengan informasi lengkap dan status real-time' },
    { icon: Users, title: 'Registrasi & Manajemen Peserta', description: 'Form pendaftaran online dengan validasi otomatis dan dukungan QR Code' },
    { icon: QrCode, title: 'Check-in Digital', description: 'Scan QR Code di lokasi untuk update kehadiran real-time dan mengurangi antrean' },
    { icon: Sparkles, title: 'Doorprize & Undian', description: 'Sistem undian digital dengan 4 animasi menarik: Spin Wheel, Slot Machine, dan lainnya' },
    { icon: Mail, title: 'Notifikasi & Email', description: 'Email konfirmasi peserta, pengumuman pemenang, dan notifikasi event otomatis' },
    { icon: BarChart3, title: 'Laporan & Insight', description: 'Data kehadiran, statistik peserta, dan laporan pasca event yang lengkap' }
  ]

  const pricingTiers = [
    { name: 'Free', price: 'Rp 0', description: 'Untuk event kecil', features: ['50 Peserta', '5 Hadiah Hiburan', '2 Hadiah Utama', '1 Grand Prize'], popular: false },
    { name: 'Basic', price: 'Rp 99.000', description: 'Untuk event menengah', features: ['200 Peserta', '15 Hadiah Hiburan', '5 Hadiah Utama', '2 Grand Prize'], popular: false },
    { name: 'Pro', price: 'Rp 299.000', description: 'Untuk event besar', features: ['500 Peserta', '30 Hadiah Hiburan', '10 Hadiah Utama', '5 Grand Prize'], popular: true },
    { name: 'Enterprise', price: 'Rp 799.000', description: 'Untuk event enterprise', features: ['2000 Peserta', '100 Hadiah Hiburan', '30 Hadiah Utama', '15 Grand Prize'], popular: false }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Eventku</span>
          </div>
          <Button onClick={() => {
            const authSection = document.getElementById('auth-section')
            authSection?.scrollIntoView({ behavior: 'smooth' })
          }}>
            Mulai Sekarang
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Platform Manajemen Event Modern
            <br />
            <span className="text-primary">untuk Event Organizer Indonesia</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground">
            Eventku hadir sebagai solusi all-in-one untuk membantu EO dan penyelenggara acara 
            mengelola event secara modern, efisien, dan scalable.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Button size="lg" onClick={() => {
              const authSection = document.getElementById('auth-section')
              authSection?.scrollIntoView({ behavior: 'smooth' })
            }}>
              Mulai Gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Fitur Utama Eventku</h2>
          <p className="mt-4 text-muted-foreground">Semua yang Anda butuhkan untuk mengelola event dalam satu platform</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="overflow-hidden">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Harga Per Event</h2>
            <p className="mt-4 text-muted-foreground">Bayar hanya untuk event yang Anda buat</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {pricingTiers.map((tier) => (
              <Card key={tier.name} className={tier.popular ? 'border-primary shadow-lg relative' : ''}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                      Paling Populer
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle>{tier.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">/event</span>
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6" 
                    variant={tier.popular ? 'default' : 'outline'}
                    onClick={() => {
                      const authSection = document.getElementById('auth-section')
                      authSection?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    Pilih {tier.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section id="auth-section" className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <AuthForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 Eventku. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

// Auth Form Component
function AuthForm() {
  const { signUp, signIn, loading: authLoading, isConfigured } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      toast.error('Mohon isi email dan password')
      return
    }
    setLoading(true)
    try {
      const { error } = await signIn(loginEmail, loginPassword)
      if (error) {
        toast.error(error.message || 'Gagal masuk. Periksa email dan password Anda.')
      } else {
        toast.success('Berhasil masuk!')
      }
    } catch {
      toast.error('Terjadi kesalahan saat login')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registerName || !registerEmail || !registerPassword || !registerConfirmPassword) {
      toast.error('Mohon lengkapi semua field')
      return
    }
    if (registerPassword !== registerConfirmPassword) {
      toast.error('Password tidak cocok')
      return
    }
    if (registerPassword.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }
    setLoading(true)
    try {
      const { error } = await signUp(registerEmail, registerPassword, registerName)
      if (error) {
        toast.error(error.message || 'Gagal mendaftar')
      } else {
        toast.success('Pendaftaran berhasil! Cek email untuk konfirmasi.')
      }
    } catch {
      toast.error('Terjadi kesalahan saat mendaftar')
    } finally {
      setLoading(false)
    }
  }

  if (!isConfigured) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle>Database Belum Terkonfigurasi</CardTitle>
          <CardDescription>
            Mohon hubungkan Supabase untuk menggunakan aplikasi
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>Pastikan file .env berisi:</p>
          <code className="block mt-2 p-2 bg-muted rounded text-xs text-left">
            NEXT_PUBLIC_SUPABASE_URL=your_url<br/>
            NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
          </code>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
          <Gift className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl font-bold">Eventku</CardTitle>
        <CardDescription>Platform undian & doorprize untuk event Anda</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Masuk</TabsTrigger>
            <TabsTrigger value="register">Daftar</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" placeholder="nama@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input id="login-password" type={showLoginPassword ? 'text' : 'password'} placeholder="Masukkan password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} disabled={loading} />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowLoginPassword(!showLoginPassword)}>
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Masuk
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Nama Lengkap</Label>
                <Input id="register-name" type="text" placeholder="Masukkan nama lengkap" value={registerName} onChange={(e) => setRegisterName(e.target.value)} disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input id="register-email" type="email" placeholder="nama@email.com" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <div className="relative">
                  <Input id="register-password" type={showRegisterPassword ? 'text' : 'password'} placeholder="Minimal 6 karakter" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} disabled={loading} />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowRegisterPassword(!showRegisterPassword)}>
                    {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-confirm-password">Konfirmasi Password</Label>
                <Input id="register-confirm-password" type="password" placeholder="Ulangi password" value={registerConfirmPassword} onChange={(e) => setRegisterConfirmPassword(e.target.value)} disabled={loading} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Daftar
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground">
          Dengan masuk, Anda menyetujui{' '}
          <span className="text-primary hover:underline cursor-pointer">Syarat & Ketentuan</span>
          {' '}dan{' '}
          <span className="text-primary hover:underline cursor-pointer">Kebijakan Privasi</span>
        </p>
      </CardContent>
    </Card>
  )
}

// Dashboard Component
function Dashboard() {
  const { user, profile, signOut, loading: authLoading, isConfigured } = useAuth()
  const { events, loading: eventsLoading, createEvent, deleteEvent, pricingTiers, isConfigured: eventsConfigured } = useEvents()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<{ id: string; name: string } | null>(null)
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    tier: 'free' as 'free' | 'basic' | 'pro' | 'enterprise'
  })

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <LandingPage />
  }

  const handleCreateEvent = async () => {
    if (!newEvent.name || !newEvent.event_date) {
      toast.error('Nama dan tanggal event wajib diisi')
      return
    }

    try {
      const { error } = await createEvent({
        name: newEvent.name,
        description: newEvent.description || null,
        event_date: newEvent.event_date,
        event_time: newEvent.event_time || null,
        location: newEvent.location || null,
        tier: newEvent.tier
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Event berhasil dibuat!')
        setCreateDialogOpen(false)
        setNewEvent({ name: '', description: '', event_date: '', event_time: '', location: '', tier: 'free' })
      }
    } catch (err) {
      toast.error('Gagal membuat event')
    }
  }

  const handleDeleteClick = (id: string, name: string) => {
    setSelectedEvent({ id, name })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (selectedEvent) {
      const { error } = await deleteEvent(selectedEvent.id)
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Event berhasil dihapus')
        setDeleteDialogOpen(false)
        setSelectedEvent(null)
      }
    }
  }

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalParticipants = events.reduce((sum, e) => sum + (e.participants_count || 0), 0)
  const totalPrizes = events.reduce((sum, e) => sum + (e.prizes_count || 0), 0)
  const activeEvents = events.filter(e => e.status === 'active').length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Eventku</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {profile?.full_name || user.email}
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Kelola event undian dan doorprize Anda</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Buat Event
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary-foreground/90">Total Events</CardTitle>
              <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{events.length}</div>
              <p className="text-sm text-primary-foreground/80 mt-1">{activeEvents} event aktif</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100">Total Peserta</CardTitle>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalParticipants.toLocaleString()}</div>
              <p className="text-sm text-emerald-100 mt-1">Dari semua event</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-100">Total Hadiah</CardTitle>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalPrizes.toLocaleString()}</div>
              <p className="text-sm text-amber-100 mt-1">Hadiah terdaftar</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        {events.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Cari event..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
          </div>
        )}

        {/* Events Grid or Empty State */}
        {eventsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="mb-2">Belum Ada Event</CardTitle>
              <CardDescription className="mb-4 text-center max-w-sm">
                Mulai buat event pertama Anda dan kelola undian doorprize dengan mudah
              </CardDescription>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Buat Event Pertama
              </Button>
            </CardContent>
          </Card>
        ) : filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Tidak ada event yang cocok</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="group overflow-hidden hover:shadow-lg transition-all duration-200">
                <div className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5">
                  {event.cover_image_url ? (
                    <img src={event.cover_image_url} alt={event.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Calendar className="h-12 w-12 text-primary/30" />
                    </div>
                  )}
                  <Badge className={cn(
                    'absolute top-3 right-3',
                    event.status === 'active' ? 'bg-green-500' :
                    event.status === 'draft' ? 'bg-gray-500' :
                    event.status === 'completed' ? 'bg-emerald-600' : 'bg-red-500'
                  )}>
                    {event.status === 'active' ? 'Aktif' : 
                     event.status === 'draft' ? 'Draft' : 
                     event.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-1">{event.name}</CardTitle>
                  <CardDescription className="line-clamp-1">{event.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    {event.event_time && (
                      <>
                        <span>•</span>
                        <Clock className="h-4 w-4" />
                        <span>{event.event_time}</span>
                      </>
                    )}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{event.participants_count || 0} peserta</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      <span>{event.prizes_count || 0} hadiah</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button asChild className="flex-1" variant="outline">
                      <Link href={`/dashboard/events/${event.id}`}>
                        Kelola
                      </Link>
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(event.id, event.name)}>
                      <span className="sr-only">Hapus</span>
                      <span>🗑️</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Event Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Event Baru</DialogTitle>
            <DialogDescription>Isi informasi event Anda</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-name">Nama Event *</Label>
              <Input id="event-name" placeholder="Contoh: Grand Prize Festival 2024" value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-desc">Deskripsi</Label>
              <Textarea id="event-desc" placeholder="Deskripsi singkat tentang event..." value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-date">Tanggal *</Label>
                <Input id="event-date" type="date" value={newEvent.event_date} onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-time">Waktu</Label>
                <Input id="event-time" type="time" value={newEvent.event_time} onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-location">Lokasi</Label>
              <Input id="event-location" placeholder="Contoh: Jakarta Convention Center" value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-tier">Paket</Label>
              <Select value={newEvent.tier} onValueChange={(value: any) => setNewEvent({ ...newEvent, tier: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pricingTiers.map((tier) => (
                    <SelectItem key={tier.tier} value={tier.tier}>
                      {tier.name} - Rp {tier.price.toLocaleString('id-ID')} ({tier.max_participants} peserta)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Batal</Button>
            <Button onClick={handleCreateEvent}>Buat Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Event?</DialogTitle>
            <DialogDescription>
              Anda akan menghapus event &quot;{selectedEvent?.name}&quot;. Tindakan ini tidak dapat dibatalkan. 
              Semua data termasuk peserta, hadiah, dan pemenang akan dihapus secara permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Ya, Hapus Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Main Page Component
export default function Page() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  )
}
