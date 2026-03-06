'use client';

import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollReveal } from '@/hooks/useScrollReveal';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  Building2, 
  GraduationCap, 
  Heart, 
  Briefcase, 
  PartyPopper,
  Car,
  Quote,
  ArrowRight
} from 'lucide-react';
import caseStudyCorporateGathering from '@/assets/case-study-corporate-gathering.jpg';
import caseStudyUniversityGraduation from '@/assets/case-study-university-graduation.jpg';
import caseStudyCommunityMeetup from '@/assets/case-study-community-meetup.jpg';
import caseStudyBankGathering from '@/assets/case-study-bank-gathering.jpg';
import caseStudyWeddingReception from '@/assets/case-study-wedding-reception.jpg';
import caseStudyProductLaunch from '@/assets/case-study-product-launch.jpg';

const caseStudies = [
  {
    id: 'sinnay-karya',
    company: 'PT Sinnay Karya Untuk Bangsa',
    industry: 'Technology',
    icon: Building2,
    title: 'Annual Corporate Gathering dengan 800+ Peserta',
    description: 'Bagaimana Eventku membantu PT Sinnay Karya Untuk Bangsa mengelola event tahunan mereka dengan efisien dan profesional.',
    image: caseStudyCorporateGathering,
    tier: 'Pro',
    stats: {
      participants: '850',
      checkInTime: '< 5 detik',
      prizes: '45',
      satisfaction: '98%'
    },
    challenge: 'PT Sinnay Karya Untuk Bangsa mengadakan gathering tahunan dengan 850+ karyawan dari berbagai cabang. Tantangan utama adalah proses check-in yang lambat (rata-rata 2 menit/orang) dan doorprize manual yang memakan waktu lama serta sering menimbulkan kecurigaan peserta.',
    solution: 'Menggunakan Eventku paket Pro untuk mengelola seluruh peserta dengan QR Code check-in dan sistem undian digital yang transparan. Tim HR melakukan import data karyawan via CSV dan mengirimkan QR Code ke email masing-masing peserta.',
    results: [
      'Check-in berkurang dari 2 menit menjadi kurang dari 5 detik per orang',
      'Proses doorprize 45 hadiah selesai dalam 30 menit (sebelumnya 2+ jam)',
      'Zero komplain dari peserta tentang transparansi undian',
      'Data kehadiran real-time memudahkan monitoring HR'
    ],
    testimonial: {
      quote: 'Eventku sangat membantu kami mengelola event tahunan dengan 800+ peserta. Proses check-in jadi super cepat dan doorprize berjalan lancar tanpa drama!',
      name: 'Cut Fara',
      role: 'Event Manager'
    }
  },
  {
    id: 'universitas-darul-ulum',
    company: 'Universitas Darul Ulum',
    industry: 'Education',
    icon: GraduationCap,
    title: 'Wisuda dan Seminar Kampus yang Terorganisir',
    description: 'Universitas Darul Ulum menggunakan Eventku untuk berbagai acara kampus dari wisuda hingga seminar akademik.',
    image: caseStudyUniversityGraduation,
    tier: 'Basic',
    stats: {
      participants: '500',
      checkInTime: '< 3 detik',
      prizes: '25',
      satisfaction: '95%'
    },
    challenge: 'Tim panitia kampus yang sebagian besar non-teknis kesulitan menggunakan tools event yang kompleks. Sebelumnya menggunakan spreadsheet manual yang rawan error dan membutuhkan waktu lama untuk rekap data.',
    solution: 'Eventku paket Basic dipilih karena interface yang sederhana dan mudah dipelajari. Tim panitia berhasil memahami seluruh fitur dalam waktu 30 menit tanpa training khusus.',
    results: [
      'Tim non-teknis bisa mengoperasikan sendiri dalam 30 menit',
      'Eliminasi human error dari input manual',
      'Laporan kehadiran otomatis untuk dokumentasi kampus',
      'Penghematan waktu rekap data hingga 70%'
    ],
    testimonial: {
      quote: 'Awalnya ragu karena baru pertama kali pakai tools event. Ternyata Eventku sangat mudah dipelajari. Tim non-teknis kami bisa langsung paham dalam 30 menit.',
      name: 'Helmy YF',
      role: 'Ketua Panitia'
    }
  },
  {
    id: 'startup-bandung',
    company: 'Komunitas Startup Bandung',
    industry: 'Community',
    icon: PartyPopper,
    title: 'Community Meetup yang Memorable',
    description: 'Komunitas Startup Bandung menciptakan pengalaman meetup yang berkesan dengan fitur doorprize interaktif Eventku.',
    image: caseStudyCommunityMeetup,
    tier: 'Basic',
    stats: {
      participants: '150',
      checkInTime: '< 3 detik',
      prizes: '20',
      satisfaction: '99%'
    },
    challenge: 'Meetup komunitas sebelumnya terasa biasa-biasa saja. Doorprize dengan kupon kertas tidak memberikan experience yang menarik dan peserta kurang antusias.',
    solution: 'Menggunakan fitur Spin Wheel animation untuk doorprize yang ditampilkan di layar besar. Semua peserta bisa melihat proses undian secara live dan transparan.',
    results: [
      'Antusiasme peserta meningkat signifikan',
      'Sesi doorprize menjadi highlight acara',
      'Feedback positif dari sponsor karena branding yang profesional',
      'Registrasi event berikutnya meningkat 40%'
    ],
    testimonial: {
      quote: 'Fitur undian dengan animasi spin wheel bikin acara kami makin seru! Peserta antusias dan terkesan profesional. Worth every penny!',
      name: 'Dewi Kusuma',
      role: 'Community Lead'
    }
  },
  {
    id: 'bank',
    company: 'Bank',
    industry: 'Banking',
    icon: Briefcase,
    title: 'Employee Gathering Skala Enterprise',
    description: 'Bank menggunakan Eventku untuk multiple event internal sepanjang tahun dengan hasil yang konsisten.',
    image: caseStudyBankGathering,
    tier: 'Enterprise',
    stats: {
      participants: '1200',
      checkInTime: '< 5 detik',
      prizes: '100+',
      satisfaction: '97%'
    },
    challenge: 'Sebagai institusi perbankan, Bank membutuhkan sistem yang reliable, secure, dan mampu menangani volume peserta yang besar. Juga membutuhkan laporan detail untuk evaluasi pasca event.',
    solution: 'Paket Enterprise dengan dedicated support memastikan setiap event berjalan lancar. Export data dan laporan otomatis memenuhi kebutuhan dokumentasi korporasi.',
    results: [
      '3 event besar dalam setahun berjalan tanpa kendala teknis',
      'Laporan otomatis menghemat waktu tim HR 80%',
      'Data peserta terkelola dengan aman dan terstruktur',
      'ROI positif dari efisiensi waktu dan resources'
    ],
    testimonial: {
      quote: 'Kami sudah 3x menggunakan Eventku untuk event internal. Laporan otomatis dan data peserta yang rapi sangat membantu untuk evaluasi pasca event.',
      name: 'Ahmad Fauzi',
      role: 'HR Director'
    }
  },
  {
    id: 'elegant-wedding',
    company: 'Elegant Wedding Planner',
    industry: 'Wedding',
    icon: Heart,
    title: 'Wedding Reception Modern dan Elegan',
    description: 'Wedding organizer menggunakan Eventku untuk mengelola tamu undangan dan doorprize di resepsi pernikahan.',
    image: caseStudyWeddingReception,
    tier: 'Pro',
    stats: {
      participants: '400',
      checkInTime: '< 3 detik',
      prizes: '30',
      satisfaction: '100%'
    },
    challenge: 'Pengelolaan tamu undangan dengan cara tradisional (buku tamu) kurang efisien dan tidak memberikan kesan modern yang diinginkan klien. Doorprize dengan kupon juga terkesan old-fashioned.',
    solution: 'QR Code invitation yang dikirim ke undangan digital, check-in cepat di meja registrasi, dan doorprize digital yang elegan untuk hiburan tamu.',
    results: [
      'Klien terkesan dengan sistem yang modern',
      'Check-in tamu 10x lebih cepat dari cara manual',
      'Doorprize menjadi entertainment yang memorable',
      'Data tamu hadir tersimpan rapi untuk ucapan terima kasih'
    ],
    testimonial: {
      quote: 'Klien kami terkesan dengan sistem doorprize digital. Tidak perlu lagi ribet dengan kupon manual. Check-in tamu juga jadi lebih cepat dan terorganisir.',
      name: 'Siti Nurhaliza',
      role: 'Wedding Organizer'
    }
  },
  {
    id: 'sinnay-eo',
    company: 'Sinnay EO',
    industry: 'Event Organizer',
    icon: Car,
    title: 'Product Launch yang Impactful',
    description: 'Sinnay EO menggunakan Public Viewer Eventku untuk launching produk baru dengan pengalaman interaktif.',
    image: caseStudyProductLaunch,
    tier: 'Enterprise',
    stats: {
      participants: '500',
      checkInTime: '< 5 detik',
      prizes: '50',
      satisfaction: '98%'
    },
    challenge: 'Launching produk baru membutuhkan experience yang impressive untuk dealer dan media. Doorprize harus terlihat transparan dan profesional untuk menjaga kredibilitas brand.',
    solution: 'Public Viewer ditampilkan di LED screen besar untuk proses undian yang bisa dilihat semua peserta secara real-time. Animasi premium menciptakan momen yang memorable.',
    results: [
      'Media coverage positif tentang event yang inovatif',
      'Dealer impressed dengan profesionalisme acara',
      'Engagement peserta meningkat dengan animasi interaktif',
      'Brand image sebagai perusahaan yang modern terjaga'
    ],
    testimonial: {
      quote: 'Public viewer yang bisa ditampilkan di layar besar sangat membantu saat launching produk. Peserta bisa melihat proses undian secara live dan transparan.',
      name: 'Hendra Gunawan',
      role: 'Marketing Manager'
    }
  }
];

const industries = [
  { name: 'Semua', value: 'all' },
  { name: 'Technology', value: 'Technology' },
  { name: 'Education', value: 'Education' },
  { name: 'Community', value: 'Community' },
  { name: 'Banking', value: 'Banking' },
  { name: 'Wedding', value: 'Wedding' },
  { name: 'Event Organizer', value: 'Event Organizer' },
];

export default function CaseStudies() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <ScrollReveal animation="fade">
          <Badge variant="outline" className="mb-4">Case Studies</Badge>
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={100}>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Kisah Sukses <span className="text-primary">Pengguna Eventku</span>
          </h1>
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={200}>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Pelajari bagaimana berbagai perusahaan dan organisasi menggunakan Eventku 
            untuk mengelola event mereka dengan lebih efisien dan profesional.
          </p>
        </ScrollReveal>
      </section>

      {/* Stats Overview */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-4">
          <ScrollReveal animation="fade-up" delay={0}>
            <Card className="text-center h-full">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary">50+</div>
                <p className="text-muted-foreground mt-2">Event Sukses</p>
              </CardContent>
            </Card>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={100}>
            <Card className="text-center h-full">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary">10,000+</div>
                <p className="text-muted-foreground mt-2">Total Peserta</p>
              </CardContent>
            </Card>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={200}>
            <Card className="text-center h-full">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary">98%</div>
                <p className="text-muted-foreground mt-2">Kepuasan Klien</p>
              </CardContent>
            </Card>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={300}>
            <Card className="text-center h-full">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary">500+</div>
                <p className="text-muted-foreground mt-2">Hadiah Diundi</p>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="container mx-auto px-4 pb-20">
        <div className="space-y-12">
          {caseStudies.map((study, index) => {
            const IconComponent = study.icon;
            const isEven = index % 2 === 0;
            
            return (
              <ScrollReveal key={study.id} animation={isEven ? "fade-left" : "fade-right"} delay={100}>
                <Card className="overflow-hidden">
                <div className={`grid md:grid-cols-2 ${!isEven ? 'md:flex-row-reverse' : ''}`}>
                  {/* Image/Visual Side */}
                  <div className={`relative overflow-hidden ${!isEven ? 'md:order-2' : ''}`}>
                    <img 
                      src={study.image} 
                      alt={study.title}
                      className="w-full h-64 md:h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/90 mb-3">
                        <IconComponent className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <Badge variant="secondary" className="mb-2">{study.industry}</Badge>
                      <h3 className="text-lg font-bold text-foreground">{study.company}</h3>
                      <Badge className="mt-2">Paket {study.tier}</Badge>
                      
                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        <div className="bg-background/90 rounded-lg p-2">
                          <Users className="h-4 w-4 mx-auto text-primary mb-1" />
                          <div className="text-sm font-bold">{study.stats.participants}</div>
                          <div className="text-[10px] text-muted-foreground">Peserta</div>
                        </div>
                        <div className="bg-background/90 rounded-lg p-2">
                          <Clock className="h-4 w-4 mx-auto text-primary mb-1" />
                          <div className="text-sm font-bold">{study.stats.checkInTime}</div>
                          <div className="text-[10px] text-muted-foreground">Check-in</div>
                        </div>
                        <div className="bg-background/90 rounded-lg p-2">
                          <PartyPopper className="h-4 w-4 mx-auto text-primary mb-1" />
                          <div className="text-sm font-bold">{study.stats.prizes}</div>
                          <div className="text-[10px] text-muted-foreground">Hadiah</div>
                        </div>
                        <div className="bg-background/90 rounded-lg p-2">
                          <TrendingUp className="h-4 w-4 mx-auto text-primary mb-1" />
                          <div className="text-sm font-bold">{study.stats.satisfaction}</div>
                          <div className="text-[10px] text-muted-foreground">Kepuasan</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Side */}
                  <div className={`p-8 ${!isEven ? 'md:order-1' : ''}`}>
                    <CardHeader className="px-0 pt-0">
                      <CardTitle className="text-2xl">{study.title}</CardTitle>
                      <CardDescription className="text-base">{study.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="px-0">
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-semibold text-destructive mb-2">Tantangan</h4>
                          <p className="text-muted-foreground text-sm">{study.challenge}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-primary mb-2">Solusi</h4>
                          <p className="text-muted-foreground text-sm">{study.solution}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-green-600 mb-2">Hasil</h4>
                          <ul className="space-y-2">
                            {study.results.map((result, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">{result}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Testimonial */}
                        <div className="bg-muted/50 rounded-lg p-4 mt-4">
                          <Quote className="h-5 w-5 text-primary/40 mb-2" />
                          <p className="text-sm italic text-muted-foreground mb-3">
                            "{study.testimonial.quote}"
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                              {study.testimonial.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{study.testimonial.name}</p>
                              <p className="text-xs text-muted-foreground">{study.testimonial.role}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                  </div>
                </Card>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <ScrollReveal animation="fade-up">
            <h2 className="text-3xl font-bold">Siap Menjadi Kisah Sukses Berikutnya?</h2>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={100}>
            <p className="mt-4 max-w-2xl mx-auto opacity-90">
              Bergabung dengan ratusan Event Organizer yang sudah menggunakan Eventku 
              untuk mengelola event mereka dengan lebih profesional.
            </p>
          </ScrollReveal>
          <ScrollReveal animation="scale" delay={200}>
            <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
              <Link href="/auth">
                <Button size="lg" variant="secondary">
                  Mulai Gratis Sekarang
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                  Konsultasi Gratis
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </PublicLayout>
  );
}
