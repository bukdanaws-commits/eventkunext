'use client';

import PublicLayout from '@/components/layout/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Target, 
  Shield, 
  Zap,
  Building2,
  GraduationCap,
  Briefcase,
  Heart,
  Globe,
  Cloud,
  RefreshCw,
  Server,
  CheckCircle,
  QrCode,
  Gift,
  Mail,
  BarChart3,
  Linkedin,
  Twitter,
  Calendar,
  Trophy,
  TrendingUp
} from 'lucide-react';
import featureDashboard from '@/assets/feature-dashboard.jpg';
import featureCheckin from '@/assets/feature-checkin.jpg';
import featureDoorprize from '@/assets/feature-doorprize.jpg';
import featureAnalytics from '@/assets/feature-analytics.jpg';
import { ScrollReveal } from '@/hooks/useScrollReveal';
import { AnimatedCounter } from '@/components/about/AnimatedCounter';

const stats = [
  { icon: Calendar, label: 'Event Dikelola', value: 500, suffix: '+' },
  { icon: Users, label: 'Peserta Terdaftar', value: 150000, suffix: '+' },
  { icon: Building2, label: 'Klien Terpercaya', value: 200, suffix: '+' },
  { icon: Trophy, label: 'Doorprize Dibagikan', value: 25000, suffix: '+' },
];

const teamMembers = [
  {
    name: 'Wonted Team',
    role: 'Founder & CEO',
    bio: 'Berpengalaman 10+ tahun di industri event management. Visioner di balik transformasi digital event di Indonesia.',
    avatar: 'WT',
    linkedin: '#',
    twitter: '#',
  },
  {
    name: 'Wonted Team',
    role: 'Co-Founder & CTO',
    bio: 'Tech leader dengan background di perusahaan teknologi global. Ahli dalam membangun platform scalable.',
    avatar: 'WT',
    linkedin: '#',
    twitter: '#',
  },
  {
    name: 'Wonted Team',
    role: 'Head of Product',
    bio: 'Product strategist yang passionate tentang user experience. Memastikan setiap fitur memberikan value.',
    avatar: 'WT',
    linkedin: '#',
    twitter: '#',
  },
  {
    name: 'Wonted Team',
    role: 'Head of Customer Success',
    bio: 'Customer advocate dengan misi memastikan setiap klien sukses menggunakan Eventku.',
    avatar: 'WT',
    linkedin: '#',
    twitter: '#',
  },
];

const timeline = [
  {
    year: '2021',
    title: 'Ide Lahir',
    description: 'Konsep Eventku lahir dari pengalaman langsung menghadapi tantangan manajemen event manual.',
  },
  {
    year: '2022',
    title: 'MVP & Beta Launch',
    description: 'Peluncuran versi beta dengan fitur core: registrasi peserta dan check-in digital.',
  },
  {
    year: '2023',
    title: 'Fitur Doorprize & Ekspansi',
    description: 'Menambahkan sistem undian digital dan melayani 100+ event di berbagai kota.',
  },
  {
    year: '2024',
    title: 'Platform SaaS Lengkap',
    description: 'Evolusi menjadi platform SaaS komprehensif dengan tier pricing dan fitur enterprise.',
  },
  {
    year: '2025',
    title: 'Menuju #1 di Indonesia',
    description: 'Target menjadi platform manajemen event pilihan utama di seluruh Indonesia.',
  },
];

const targetAudience = [
  { icon: Briefcase, title: 'Event Organizer (EO)', description: 'Profesional yang mengelola berbagai jenis event' },
  { icon: Building2, title: 'Perusahaan & Korporasi', description: 'Corporate event dan gathering perusahaan' },
  { icon: Heart, title: 'Komunitas & Organisasi', description: 'Penyelenggara acara komunitas dan organisasi' },
  { icon: GraduationCap, title: 'Kampus & Institusi', description: 'Acara akademik dan institusional' },
];

const values = [
  { 
    icon: Target, 
    title: 'Sederhana', 
    description: 'Teknologi harus mempermudah, bukan mempersulit.' 
  },
  { 
    icon: Shield, 
    title: 'Andal', 
    description: 'Platform dirancang agar stabil dan siap digunakan di momen krusial event.' 
  },
  { 
    icon: Zap, 
    title: 'Skalabel', 
    description: 'Eventku tumbuh mengikuti skala event dan kebutuhan pengguna.' 
  },
  { 
    icon: Users, 
    title: 'Relevan untuk Indonesia', 
    description: 'Dibangun dengan memahami kebutuhan EO dan ekosistem event lokal.' 
  },
];

const saasFeatures = [
  { icon: Globe, text: 'Digunakan melalui internet' },
  { icon: Cloud, text: 'Tidak memerlukan instalasi software' },
  { icon: Server, text: 'Tidak membutuhkan server sendiri' },
  { icon: RefreshCw, text: 'Selalu mendapatkan pembaruan fitur' },
];

const solutions = [
  { icon: BarChart3, text: 'Manajemen event terpusat' },
  { icon: Users, text: 'Registrasi dan manajemen peserta' },
  { icon: QrCode, text: 'Check-in digital berbasis QR Code' },
  { icon: Gift, text: 'Sistem undian & doorprize digital' },
  { icon: Mail, text: 'Notifikasi dan email event' },
  { icon: CheckCircle, text: 'Laporan dan insight pasca event' },
];

const problems = [
  'Spreadsheet terpisah',
  'Pendaftaran via chat',
  'Check-in manual',
  'Laporan yang memakan waktu',
];

export default function About() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <ScrollReveal animation="fade-up">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <p className="text-primary font-medium mb-2">Tentang Kami</p>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                <span className="text-primary">Eventku.co.id</span> — Platform SaaS Manajemen Event
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Eventku.co.id adalah platform Software as a Service (SaaS) yang membantu Event Organizer (EO), 
                perusahaan, komunitas, dan institusi mengelola event secara modern, terstruktur, dan efisien — 
                tanpa perlu instalasi aplikasi atau infrastruktur teknis sendiri.
              </p>
              <p className="mt-4 text-muted-foreground">
                Eventku dapat diakses langsung melalui browser dan dirancang untuk mendukung seluruh siklus event, 
                mulai dari perencanaan, registrasi peserta, operasional di hari‑H, hingga laporan pasca acara.
              </p>
            </div>
            <div className="rounded-xl overflow-hidden shadow-xl">
              <img 
                src={featureDashboard} 
                alt="Eventku Dashboard" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <ScrollReveal animation="fade-up">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, index) => (
                <div 
                  key={stat.label} 
                  className="text-center text-primary-foreground"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-foreground/10">
                    <stat.icon className="h-8 w-8" />
                  </div>
                  <div className="text-4xl font-bold mb-2">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} duration={2500} />
                  </div>
                  <p className="text-primary-foreground/80">{stat.label}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Perjalanan Eventku</h2>
              <p className="mt-4 text-muted-foreground">
                Dari ide sederhana hingga platform manajemen event terdepan
              </p>
            </div>
          </ScrollReveal>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-primary/20 hidden md:block" />
            
            <div className="space-y-8 md:space-y-0">
              {timeline.map((item, index) => (
                <ScrollReveal 
                  key={item.year} 
                  animation={index % 2 === 0 ? 'fade-right' : 'fade-left'}
                  delay={index * 100}
                >
                  <div className={`relative flex items-center md:justify-${index % 2 === 0 ? 'start' : 'end'} md:mb-8`}>
                    <div className={`w-full md:w-5/12 ${index % 2 === 0 ? 'md:pr-8 md:text-right' : 'md:pl-8 md:ml-auto'}`}>
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className={`flex items-center gap-4 mb-3 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                            <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-xl font-bold shrink-0">
                              {item.year}
                            </span>
                            <h3 className="text-xl font-semibold">{item.title}</h3>
                          </div>
                          <p className="text-muted-foreground">{item.description}</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Center dot */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background hidden md:block" />
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Eventku Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <ScrollReveal animation="fade-up">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-center">Mengapa Eventku Dibangun?</h2>
              <p className="text-lg text-muted-foreground mb-6 text-center">
                Kami melihat banyak event masih dikelola dengan cara manual:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {problems.map((problem, index) => (
                  <ScrollReveal key={problem} animation="scale" delay={index * 100}>
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                      <span className="text-destructive text-lg">❌</span>
                      <span className="text-sm">{problem}</span>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
              <p className="text-center text-muted-foreground">
                Cara ini tidak lagi efektif untuk event modern yang menuntut kecepatan, akurasi, dan transparansi.
              </p>
              <p className="text-center font-medium mt-4">
                Eventku dibangun untuk menjawab kebutuhan tersebut melalui pendekatan SaaS yang fleksibel dan scalable.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* What is SaaS Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <ScrollReveal animation="fade-up">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="lg:order-2 rounded-xl overflow-hidden shadow-lg">
                <img src={featureAnalytics} alt="Eventku Analytics" className="w-full h-auto" />
              </div>
              <div className="lg:order-1">
                <h2 className="text-3xl font-bold mb-6">Apa Itu SaaS di Eventku?</h2>
                <p className="text-muted-foreground mb-6">
                  Sebagai platform Software as a Service (SaaS):
                </p>
                <div className="space-y-4">
                  {saasFeatures.map((feature, index) => (
                    <ScrollReveal key={feature.text} animation="fade-left" delay={index * 100}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <feature.icon className="h-5 w-5 text-primary" />
                        </div>
                        <span>{feature.text}</span>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
                <p className="mt-6 text-muted-foreground">
                  Pengguna cukup membuat akun, login, dan langsung dapat mengelola event dari mana saja.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Solusi yang Kami Tawarkan</h2>
              <p className="mt-4 text-muted-foreground">
                Eventku menyatukan berbagai kebutuhan event dalam satu platform
              </p>
            </div>
          </ScrollReveal>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {solutions.map((solution, index) => (
              <ScrollReveal key={solution.text} animation="scale" delay={index * 100}>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <solution.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">{solution.text}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal animation="fade" delay={600}>
            <p className="text-center text-muted-foreground mt-8">
              Semua fitur dirancang untuk mendukung event kecil hingga skala besar.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Tim Kami</h2>
              <p className="mt-4 text-muted-foreground">
                Orang-orang di balik kesuksesan Eventku
              </p>
            </div>
          </ScrollReveal>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((member, index) => (
              <ScrollReveal key={member.name} animation="fade-up" delay={index * 150}>
                <Card className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="pt-8 pb-6">
                    <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-primary/20">
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary font-semibold">
                        {member.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-lg font-semibold">{member.name}</h3>
                    <p className="text-sm text-primary font-medium mb-3">{member.role}</p>
                    <p className="text-sm text-muted-foreground mb-4">{member.bio}</p>
                    <div className="flex justify-center gap-3">
                      <a 
                        href={member.linkedin} 
                        className="p-2 rounded-full bg-muted hover:bg-primary/10 transition-colors"
                        aria-label={`LinkedIn ${member.name}`}
                      >
                        <Linkedin className="h-4 w-4 text-muted-foreground" />
                      </a>
                      <a 
                        href={member.twitter} 
                        className="p-2 rounded-full bg-muted hover:bg-primary/10 transition-colors"
                        aria-label={`Twitter ${member.name}`}
                      >
                        <Twitter className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Untuk Siapa Eventku?</h2>
              <p className="mt-4 text-muted-foreground">
                Eventku cocok digunakan oleh berbagai jenis penyelenggara
              </p>
            </div>
          </ScrollReveal>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {targetAudience.map((audience, index) => (
              <ScrollReveal key={audience.title} animation="fade-up" delay={index * 100}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6 text-center">
                    <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <audience.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{audience.title}</h3>
                    <p className="text-sm text-muted-foreground">{audience.description}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal animation="fade" delay={400}>
            <p className="text-center text-muted-foreground mt-8">
              Termasuk penyelenggara seminar, workshop, konser, dan pameran
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Nilai yang Kami Pegang</h2>
            </div>
          </ScrollReveal>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <ScrollReveal key={value.title} animation="scale" delay={index * 100}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights with Images */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Fitur Unggulan</h2>
            </div>
          </ScrollReveal>
          <div className="space-y-16">
            <ScrollReveal animation="fade-right">
              <div className="grid gap-8 lg:grid-cols-2 items-center">
                <div className="rounded-xl overflow-hidden shadow-lg">
                  <img src={featureCheckin} alt="Digital Check-in" className="w-full h-auto" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4">Check-in Digital dengan QR Code</h3>
                  <p className="text-muted-foreground">
                    Tingkatkan efisiensi operasional event Anda dengan sistem check-in digital. 
                    Peserta cukup scan QR Code untuk registrasi kehadiran secara real-time, 
                    mengurangi antrean panjang dan human error.
                  </p>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal animation="fade-left">
              <div className="grid gap-8 lg:grid-cols-2 items-center">
                <div className="lg:order-2 rounded-xl overflow-hidden shadow-lg">
                  <img src={featureDoorprize} alt="Digital Doorprize" className="w-full h-auto" />
                </div>
                <div className="lg:order-1">
                  <h3 className="text-2xl font-bold mb-4">Undian Digital yang Transparan</h3>
                  <p className="text-muted-foreground">
                    Sistem undian doorprize dengan animasi menarik seperti Spin Wheel dan Slot Machine. 
                    Proses transparan dan adil, cocok untuk event dengan ribuan peserta.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <ScrollReveal animation="scale">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Visi Kami</h2>
              <blockquote className="text-xl font-medium italic border-l-4 border-primary pl-6 text-left bg-background p-6 rounded-r-lg shadow-sm">
                "Menjadi platform SaaS manajemen event pilihan di Indonesia yang membantu penyelenggara event 
                bertransformasi dari sistem manual ke digital secara mudah dan terjangkau."
              </blockquote>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <ScrollReveal animation="fade-up">
            <h2 className="text-3xl font-bold">Eventku dalam Satu Kalimat</h2>
            <p className="mt-6 text-xl text-primary-foreground/90 max-w-3xl mx-auto">
              Eventku.co.id adalah SaaS manajemen event yang membantu Anda mengelola event dengan cara modern.
            </p>
            <p className="mt-8 text-primary-foreground/80 max-w-2xl mx-auto">
              Di era digital, pengelolaan event tidak lagi bisa mengandalkan cara lama. 
              Eventku.co.id hadir sebagai partner teknologi untuk membantu event berjalan lebih rapi, profesional, dan berdampak.
            </p>
          </ScrollReveal>
        </div>
      </section>
    </PublicLayout>
  );
}
