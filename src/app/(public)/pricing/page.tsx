'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Zap, Building2, Users, Crown, Quote, Star, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const testimonials = [
  {
    name: 'Sarah Anderson',
    role: 'Event Manager',
    company: 'ABC Corporation',
    content: 'Eventku sangat membantu kami mengelola event tahunan dengan 800+ peserta. Proses check-in jadi super cepat dan doorprize berjalan lancar tanpa drama!',
    rating: 5,
    tier: 'Pro',
    eventType: 'Corporate Gathering',
  },
  {
    name: 'John Smith',
    role: 'Ketua Panitia',
    company: 'XYZ University',
    content: 'Awalnya ragu karena baru pertama kali pakai tools event. Ternyata Eventku sangat mudah dipelajari. Tim non-teknis kami bisa langsung paham dalam 30 menit.',
    rating: 5,
    tier: 'Basic',
    eventType: 'Wisuda & Seminar',
  },
  {
    name: 'Lisa Chen',
    role: 'Community Lead',
    company: 'Tech Community Hub',
    content: 'Fitur undian dengan animasi spin wheel bikin acara kami makin seru! Peserta antusias dan terkesan profesional. Worth every penny!',
    rating: 5,
    tier: 'Basic',
    eventType: 'Community Meetup',
  },
  {
    name: 'Michael Brown',
    role: 'HR Director',
    company: 'Global Finance Ltd',
    content: 'Kami sudah 3x menggunakan Eventku untuk event internal. Laporan otomatis dan data peserta yang rapi sangat membantu untuk evaluasi pasca event.',
    rating: 5,
    tier: 'Enterprise',
    eventType: 'Employee Gathering',
  },
  {
    name: 'Emma Wilson',
    role: 'Wedding Organizer',
    company: 'Dream Wedding Co',
    content: 'Klien kami terkesan dengan sistem doorprize digital. Tidak perlu lagi ribet dengan kupon manual. Check-in tamu juga jadi lebih cepat dan terorganisir.',
    rating: 5,
    tier: 'Pro',
    eventType: 'Wedding Reception',
  },
  {
    name: 'David Lee',
    role: 'Marketing Manager',
    company: 'Auto Motors Inc',
    content: 'Public viewer yang bisa ditampilkan di layar besar sangat membantu saat launching produk. Peserta bisa melihat proses undian secara live dan transparan.',
    rating: 5,
    tier: 'Enterprise',
    eventType: 'Product Launch',
  },
];

const clientLogos = [
  { name: 'ABC Corporation', initials: 'ABC' },
  { name: 'XYZ University', initials: 'XYZ' },
  { name: 'Tech Community Hub', initials: 'TCH' },
  { name: 'Global Finance Ltd', initials: 'GFL' },
  { name: 'Dream Wedding Co', initials: 'DWC' },
  { name: 'Auto Motors Inc', initials: 'AMI' },
  { name: 'Prime Solutions', initials: 'PS' },
  { name: 'Delta Group', initials: 'DG' },
];

const pricingTiers = [
  {
    name: 'Free',
    price: 'Rp 0',
    description: 'Untuk event kecil & mencoba platform',
    icon: Users,
    features: ['30 Peserta', '1 Hadiah Hiburan', '1 Hadiah Utama', '1 Grand Prize'],
    popular: false,
    color: 'text-muted-foreground'
  },
  {
    name: 'Basic',
    price: 'Rp 1.000.000',
    description: 'Untuk event menengah dengan fitur lengkap',
    icon: Zap,
    features: ['100 Peserta', '20 Hadiah Hiburan', '5 Hadiah Utama', '1 Grand Prize', 'Form Builder (+Rp 300rb)'],
    popular: false,
    color: 'text-blue-500'
  },
  {
    name: 'Pro',
    price: 'Rp 1.500.000',
    description: 'Untuk event besar dengan kebutuhan advanced',
    icon: Crown,
    features: ['500 Peserta', '50 Hadiah Hiburan', '30 Hadiah Utama', 'Unlimited Grand Prize', 'Form Builder (+Rp 500rb)'],
    popular: true,
    color: 'text-primary'
  },
  {
    name: 'Enterprise',
    price: 'Rp 2.000.000',
    description: 'Untuk event enterprise & korporasi',
    icon: Building2,
    features: ['1000+ Peserta', 'Unlimited Hadiah Hiburan', 'Unlimited Hadiah Utama', 'Unlimited Grand Prize', 'Form Builder (+Rp 750rb)'],
    popular: false,
    color: 'text-amber-500'
  }
];

const featureComparison = [
  {
    category: 'Kapasitas',
    features: [
      { name: 'Maksimal Peserta', free: '30', basic: '100', pro: '500', enterprise: '1000+' },
      { name: 'Hadiah Hiburan', free: '1', basic: '20', pro: '50', enterprise: 'Unlimited' },
      { name: 'Hadiah Utama', free: '1', basic: '5', pro: '30', enterprise: 'Unlimited' },
      { name: 'Grand Prize', free: '1', basic: '1', pro: 'Unlimited', enterprise: 'Unlimited' },
    ],
  },
  {
    category: 'Manajemen Peserta',
    features: [
      { name: 'Dashboard Peserta', free: true, basic: true, pro: true, enterprise: true },
      { name: 'Import CSV', free: true, basic: true, pro: true, enterprise: true },
      { name: 'Export Data', free: true, basic: true, pro: true, enterprise: true },
      { name: 'QR Code Peserta', free: true, basic: true, pro: true, enterprise: true },
      { name: 'Bulk Send QR Email', free: false, basic: true, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Check-in',
    features: [
      { name: 'QR Code Check-in', free: true, basic: true, pro: true, enterprise: true },
      { name: 'Real-time Status', free: true, basic: true, pro: true, enterprise: true },
      { name: 'Statistik Kehadiran', free: true, basic: true, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Undian & Doorprize',
    features: [
      { name: 'Spin Wheel Animation', free: true, basic: true, pro: true, enterprise: true },
      { name: 'Slot Machine Animation', free: true, basic: true, pro: true, enterprise: true },
      { name: 'Card Reveal Animation', free: true, basic: true, pro: true, enterprise: true },
      { name: 'Random Number Animation', free: true, basic: true, pro: true, enterprise: true },
      { name: 'Public Viewer', free: true, basic: true, pro: true, enterprise: true },
      { name: 'Bulk Draw', free: false, basic: true, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Notifikasi',
    features: [
      { name: 'Email QR Code', free: false, basic: true, pro: true, enterprise: true },
      { name: 'Email Pemenang', free: false, basic: true, pro: true, enterprise: true },
      { name: 'Custom Email Template', free: false, basic: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Form Builder',
    features: [
      { name: 'Form Pendaftaran Custom', free: 'Add-on', basic: '+Rp 300rb', pro: '+Rp 500rb', enterprise: '+Rp 750rb' },
      { name: 'Multi Field Type', free: 'Add-on', basic: '+Rp 300rb', pro: '+Rp 500rb', enterprise: '+Rp 750rb' },
      { name: 'Auto Mapping Data', free: 'Add-on', basic: '+Rp 300rb', pro: '+Rp 500rb', enterprise: '+Rp 750rb' },
    ],
  },
  {
    category: 'Laporan & Statistik',
    features: [
      { name: 'Dashboard Analytics', free: true, basic: true, pro: true, enterprise: true },
      { name: 'Export Report', free: true, basic: true, pro: true, enterprise: true },
      { name: 'Statistik Real-time', free: true, basic: true, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Support',
    features: [
      { name: 'Email Support', free: true, basic: true, pro: true, enterprise: true },
      { name: 'Priority Support', free: false, basic: false, pro: true, enterprise: true },
      { name: 'Dedicated Account Manager', free: false, basic: false, pro: false, enterprise: true },
    ],
  },
];

const renderFeatureValue = (value: boolean | string) => {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-5 w-5 text-primary mx-auto" />
    ) : (
      <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />
    );
  }
  return <span className="text-sm font-medium">{value}</span>;
};

export default function Pricing() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const itemsPerSlide = 3;
  const totalSlides = Math.ceil(testimonials.length / itemsPerSlide);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  const getCurrentTestimonials = () => {
    const start = currentSlide * itemsPerSlide;
    return testimonials.slice(start, start + itemsPerSlide);
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Harga <span className="text-primary">Per Event</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Bayar hanya untuk event yang Anda buat. Pilih paket yang sesuai dengan kebutuhan dan skala event Anda.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {pricingTiers.map((tier) => {
            const IconComponent = tier.icon;
            return (
              <Card key={tier.name} className={tier.popular ? 'border-primary shadow-lg relative' : ''}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                      Paling Populer
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className={`mx-auto mb-2 ${tier.color}`}>
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <CardTitle>{tier.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">/event</span>
                  </div>
                  <CardDescription className="min-h-[40px]">{tier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth" className="block mt-6">
                    <Button className="w-full" variant={tier.popular ? 'default' : 'outline'}>
                      Pilih {tier.name}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Client Logos Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-muted-foreground text-sm uppercase tracking-wider font-medium">
              Dipercaya oleh perusahaan terkemuka
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {clientLogos.map((client, index) => (
              <div 
                key={index} 
                className="flex items-center justify-center w-24 h-16 rounded-lg bg-background border hover:border-primary/50 transition-colors group"
              >
                <div className="text-center">
                  <div className="text-xl font-bold text-muted-foreground group-hover:text-primary transition-colors">
                    {client.initials}
                  </div>
                  <div className="text-[8px] text-muted-foreground/70 mt-0.5 leading-tight px-1">
                    {client.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Perbandingan Fitur Lengkap</h2>
            <p className="mt-4 text-muted-foreground">
              Lihat detail fitur yang tersedia di setiap paket
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Fitur</TableHead>
                    <TableHead className="text-center">Free</TableHead>
                    <TableHead className="text-center">Basic</TableHead>
                    <TableHead className="text-center bg-primary/5">Pro</TableHead>
                    <TableHead className="text-center">Enterprise</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featureComparison.map((category) => (
                    <>
                      <TableRow key={category.category} className="bg-muted/50">
                        <TableCell colSpan={5} className="font-semibold text-foreground">
                          {category.category}
                        </TableCell>
                      </TableRow>
                      {category.features.map((feature) => (
                        <TableRow key={feature.name}>
                          <TableCell className="text-muted-foreground">{feature.name}</TableCell>
                          <TableCell className="text-center">{renderFeatureValue(feature.free)}</TableCell>
                          <TableCell className="text-center">{renderFeatureValue(feature.basic)}</TableCell>
                          <TableCell className="text-center bg-primary/5">{renderFeatureValue(feature.pro)}</TableCell>
                          <TableCell className="text-center">{renderFeatureValue(feature.enterprise)}</TableCell>
                        </TableRow>
                      ))}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Carousel Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Apa Kata Mereka?</h2>
            <p className="mt-4 text-muted-foreground">
              Testimoni dari Event Organizer yang sudah menggunakan Eventku
            </p>
          </div>

          <div 
            className="relative"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {/* Carousel Container */}
            <div className="overflow-hidden">
              <div 
                className="grid gap-6 md:grid-cols-3 transition-opacity duration-300"
              >
                {getCurrentTestimonials().map((testimonial, index) => (
                  <Card key={index} className="relative animate-fade-in">
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {testimonial.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-base">{testimonial.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {testimonial.role}
                          </CardDescription>
                          <p className="text-xs text-muted-foreground mt-0.5">{testimonial.company}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Quote className="h-6 w-6 text-primary/20 mb-2" />
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {testimonial.content}
                      </p>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: testimonial.rating }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                            {testimonial.tier}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {testimonial.eventType}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            <button 
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-background border rounded-full p-2 shadow-lg hover:bg-muted transition-colors hidden md:block"
              aria-label="Previous testimonials"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button 
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-background border rounded-full p-2 shadow-lg hover:bg-muted transition-colors hidden md:block"
              aria-label="Next testimonials"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    currentSlide === index ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Link to Case Studies */}
          <div className="text-center mt-10">
            <Link href="/case-studies">
              <Button variant="outline">
                Lihat Semua Case Study
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Included */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Semua Paket Termasuk</h2>
            <p className="mt-4 text-muted-foreground">
              Fitur-fitur dasar yang tersedia di semua paket
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {[
              'Dashboard manajemen event',
              'QR Code check-in',
              '4 animasi undian menarik',
              'Manajemen peserta real-time',
              'Import & Export data',
              'Laporan & statistik',
              'Multi-user access',
              'Support via email',
              'Update fitur gratis',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Summary */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Pertanyaan Umum Tentang Harga</h2>
            <div className="space-y-6">
              <div className="bg-background rounded-lg p-6 border">
                <h3 className="font-semibold mb-2">Apakah harga per event atau berlangganan?</h3>
                <p className="text-muted-foreground">Pembayaran bersifat per event. Setiap kali Anda membuat event baru, Anda bisa memilih paket yang sesuai. Tidak ada biaya berlangganan bulanan.</p>
              </div>
              <div className="bg-background rounded-lg p-6 border">
                <h3 className="font-semibold mb-2">Bisa upgrade paket di tengah event?</h3>
                <p className="text-muted-foreground">Ya, Anda bisa upgrade kapan saja. Sistem akan menghitung selisih harga dan upgrade aktif segera setelah pembayaran berhasil.</p>
              </div>
              <div className="bg-background rounded-lg p-6 border">
                <h3 className="font-semibold mb-2">Metode pembayaran apa saja yang diterima?</h3>
                <p className="text-muted-foreground">Kami menerima transfer bank (BCA, Mandiri, BNI, BRI, dll), e-wallet (GoPay, OVO, DANA, ShopeePay), kartu kredit/debit, dan virtual account.</p>
              </div>
            </div>
            <div className="text-center mt-8">
              <Link href="/faq">
                <Button variant="outline">Lihat Semua FAQ</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold">Belum yakin paket mana yang cocok?</h2>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          Mulai dengan paket Free untuk mencoba platform kami. 
          Anda bisa upgrade kapan saja sesuai kebutuhan event.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
          <Link href="/auth">
            <Button size="lg">Mulai Gratis</Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline">Hubungi Kami</Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
