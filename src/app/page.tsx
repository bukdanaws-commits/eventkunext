'use client'

import { useState } from 'react'
import { AuthProvider } from '@/hooks/useAuth'
import { useAuth } from '@/hooks/useAuth'
import { useEvents, type Event, type PricingTier } from '@/hooks/useEvents'
import { useSessionRefresh } from '@/hooks/useSessionRefresh'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { CreateEventDialog } from '@/components/events/CreateEventDialog'
import { DeleteEventDialog } from '@/components/events/DeleteEventDialog'
import { SessionErrorAlert } from '@/components/admin/SessionErrorAlert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
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
  MapPin,
  Clock,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// Landing Page Component
function LandingPage() {
  const features = [
    {
      icon: LayoutDashboard,
      title: 'Manajemen Event Terpusat',
      description: 'Kelola semua event dalam satu dashboard dengan informasi lengkap dan status real-time'
    },
    {
      icon: Users,
      title: 'Registrasi & Manajemen Peserta',
      description: 'Form pendaftaran online dengan validasi otomatis dan dukungan QR Code'
    },
    {
      icon: QrCode,
      title: 'Check-in Digital',
      description: 'Scan QR Code di lokasi untuk update kehadiran real-time dan mengurangi antrean'
    },
    {
      icon: Sparkles,
      title: 'Doorprize & Undian',
      description: 'Sistem undian digital dengan 4 animasi menarik: Spin Wheel, Slot Machine, dan lainnya'
    },
    {
      icon: Mail,
      title: 'Notifikasi & Email',
      description: 'Email konfirmasi peserta, pengumuman pemenang, dan notifikasi event otomatis'
    },
    {
      icon: BarChart3,
      title: 'Laporan & Insight',
      description: 'Data kehadiran, statistik peserta, dan laporan pasca event yang lengkap'
    }
  ]

  const testimonials = [
    {
      name: 'Heri Kurniawan Ngalup',
      role: 'Event Manager, PT Josan Buana Jaya',
      content: 'Eventku sangat membantu kami mengelola event dengan 5000+ peserta. Check-in digital dan sistem undian digitalnya sangat smooth!',
      avatar: 'HK'
    },
    {
      name: 'Budi Santoso',
      role: 'Ketua Panitia, Komunitas Tech Jakarta',
      content: 'Sebelumnya kami pakai spreadsheet, sekarang semua data terpusat dan real-time. Sangat recommended untuk EO manapun.',
      avatar: 'BS'
    },
    {
      name: 'Sarah Putri',
      role: 'Corporate Event Specialist',
      content: 'Fitur doorprize dengan animasi spin wheel jadi highlight di setiap event kami. Peserta sangat antusias!',
      avatar: 'SP'
    }
  ]

  const pricingTiers = [
    {
      name: 'Free',
      price: 'Rp 0',
      description: 'Untuk event kecil',
      features: ['30 Peserta', '1 Hadiah Hiburan', '1 Hadiah Utama', '1 Grand Prize'],
      popular: false
    },
    {
      name: 'Basic',
      price: 'Rp 1.000.000',
      description: 'Untuk event menengah',
      features: ['100 Peserta', '20 Hadiah Hiburan', '5 Hadiah Utama', '1 Grand Prize', 'Form Builder (+Rp 300rb)'],
      popular: false
    },
    {
      name: 'Pro',
      price: 'Rp 1.500.000',
      description: 'Untuk event besar',
      features: ['500 Peserta', '50 Hadiah Hiburan', '30 Hadiah Utama', 'Unlimited Grand Prize', 'Form Builder (+Rp 500rb)'],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Rp 2.000.000',
      description: 'Untuk event enterprise',
      features: ['1000+ Peserta', 'Unlimited Hadiah Hiburan', 'Unlimited Hadiah Utama', '1 Grand Prize', 'Form Builder (+Rp 750rb)'],
      popular: false
    }
  ]

  return (
    <PublicLayout>
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
            mengelola event secara modern, efisien, dan scalable. Dari perencanaan hingga laporan pasca acara.
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

      {/* Problem Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Masalah yang Sering Dihadapi EO</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Banyak Event Organizer masih mengandalkan spreadsheet, chat WhatsApp, dan tools yang terpisah-pisah
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {[
              'Data peserta tersebar di banyak file',
              'Registrasi manual & rawan error',
              'Sulit mengelola doorprize & undian',
              'Tidak ada data real-time saat event',
              'Laporan pasca event lama & tidak akurat',
              'Koordinasi tim yang tidak efisien',
            ].map((problem) => (
              <div key={problem} className="flex items-center gap-3 p-4 bg-background rounded-lg border">
                <span className="text-destructive text-xl">❌</span>
                <span className="text-sm">{problem}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-lg font-medium mt-8">
            Eventku dibangun untuk menghilangkan semua hambatan ini.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Fitur Utama Eventku</h2>
          <p className="mt-4 text-muted-foreground">
            Semua yang Anda butuhkan untuk mengelola event dalam satu platform
          </p>
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

      {/* Why Choose Us */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Kenapa Memilih Eventku?</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {[
              { title: 'All-in-One', desc: 'Tidak perlu banyak tools. Semua kebutuhan event ada dalam satu platform.' },
              { title: 'Siap Skala Besar', desc: 'Dirancang untuk ribuan hingga puluhan ribu peserta.' },
              { title: 'Aman & Andal', desc: 'Arsitektur modern dengan keamanan data sebagai prioritas.' },
              { title: 'Dibuat untuk EO Indonesia', desc: 'Fitur dan alur kerja disesuaikan dengan realita lapangan EO lokal.' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Harga Per Event</h2>
          <p className="mt-4 text-muted-foreground">
            Bayar hanya untuk event yang Anda buat
          </p>
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
      </section>

      {/* Testimonials Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Apa Kata Mereka?</h2>
            <p className="mt-4 text-muted-foreground">
              Testimoni dari pengguna Eventku
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic">&quot;{testimonial.content}&quot;</p>
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

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Siap Mengelola Event dengan Cara Modern?</h2>
          <p className="mt-4 text-primary-foreground/80 max-w-2xl mx-auto">
            Event lebih terstruktur. Data lebih rapi. Pengalaman lebih baik.
            Daftar gratis sekarang dan buat event pertama Anda.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="mt-8"
            onClick={() => {
              const authSection = document.getElementById('auth-section')
              authSection?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Daftar Gratis Sekarang
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </PublicLayout>
  )
}

// Auth Form Component
function AuthForm() {
  const { signIn, signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  // Register form
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
        toast.success('Pendaftaran berhasil!')
      }
    } catch {
      toast.error('Terjadi kesalahan saat mendaftar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground">
          Dengan masuk, Anda menyetujui{' '}
          <span className="text-primary hover:underline cursor-pointer">Syarat & Ketentuan</span>
          {' '}dan{' '}
          <span className="text-primary hover:underline cursor-pointer">Kebijakan Privasi</span>
        </p>
        
        <div className="text-center">
          <Button variant="ghost" className="text-muted-foreground" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Home className="mr-2 h-4 w-4" />
            Kembali ke Beranda
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Simple Event Card for Dashboard
function DashboardEventCard({ 
  event, 
  onDelete 
}: { 
  event: Event
  onDelete: (id: string) => void 
}) {
  const statusConfig = {
    draft: { label: 'Draft', color: 'bg-gray-500' },
    pending_payment: { label: 'Menunggu Pembayaran', color: 'bg-yellow-500' },
    active: { label: 'Aktif', color: 'bg-green-500' },
    completed: { label: 'Selesai', color: 'bg-emerald-600' },
    cancelled: { label: 'Dibatalkan', color: 'bg-red-500' },
  }

  const status = statusConfig[event.status]

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200">
      {/* Cover image */}
      <div className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="h-12 w-12 text-primary/30" />
          </div>
        )}
        
        {/* Status badge */}
        <Badge className={cn('absolute top-3 right-3', status.color)}>
          {status.label}
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1">
              <Link
                href={`/dashboard/events/${event.id}`}
                className="hover:text-primary transition-colors"
              >
                {event.name}
              </Link>
            </CardTitle>
            {event.description && (
              <CardDescription className="line-clamp-1">
                {event.description}
              </CardDescription>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/events/${event.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Lihat Detail
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/events/${event.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Kelola
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(event.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Date & Time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(event.event_date)}</span>
          {event.event_time && (
            <>
              <span>•</span>
              <Clock className="h-4 w-4" />
              <span>{event.event_time}</span>
            </>
          )}
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{event.participants_count} peserta</span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <span>{event.prizes_count} hadiah</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Dashboard Component
function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { events, loading: eventsLoading, deleteEvent, refetch } = useEvents()
  const { isRefreshing, sessionError, refreshSession, clearSessionError } = useSessionRefresh()

  const [selectedEvent, setSelectedEvent] = useState<{ id: string; name: string } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleDeleteClick = (id: string) => {
    const event = events.find(e => e.id === id)
    if (event) {
      setSelectedEvent({ id, name: event.name })
      setDeleteDialogOpen(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (selectedEvent) {
      await deleteEvent(selectedEvent.id)
      setDeleteDialogOpen(false)
      setSelectedEvent(null)
    }
  }

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Stats
  const totalParticipants = events.reduce((sum, e) => sum + e.participants_count, 0)
  const totalPrizes = events.reduce((sum, e) => sum + e.prizes_count, 0)
  const activeEvents = events.filter(e => e.status === 'active').length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <SessionErrorAlert
          error={sessionError}
          isRefreshing={isRefreshing}
          onRefresh={async () => {
            await refreshSession()
            refetch?.()
          }}
          onDismiss={clearSessionError}
        />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Events</h1>
            <p className="text-muted-foreground">
              Kelola event undian dan doorprize Anda
            </p>
          </div>
          <div className="flex gap-2">
            <CreateEventDialog onSuccess={(eventId) => console.log('Created event:', eventId)} />
            <Button variant="outline" onClick={signOut}>
              Keluar
            </Button>
          </div>
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
              <p className="text-sm text-primary-foreground/80 mt-1">
                {activeEvents} event aktif
              </p>
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
              <p className="text-sm text-emerald-100 mt-1">
                Dari semua event
              </p>
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
              <p className="text-sm text-amber-100 mt-1">
                Hadiah terdaftar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        {events.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
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
              <CreateEventDialog onSuccess={(eventId) => console.log('Created event:', eventId)} />
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
              <DashboardEventCard
                key={event.id}
                event={event}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      {selectedEvent && (
        <DeleteEventDialog
          eventId={selectedEvent.id}
          eventName={selectedEvent.name}
          onDelete={() => {
            setDeleteDialogOpen(false)
            setSelectedEvent(null)
            refetch?.()
          }}
        />
      )}
    </DashboardLayout>
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
