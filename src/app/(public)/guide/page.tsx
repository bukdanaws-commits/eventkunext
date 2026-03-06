'use client';

import { PublicLayout } from "@/components/layout/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Globe,
  Palette,
  FormInput,
  Share2,
  Users,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  BookOpen,
  FileText,
  QrCode,
  Gift,
  BarChart3,
  Mail,
  Play,
  Clock,
} from "lucide-react";

const guideSteps = [
  {
    number: 1,
    title: "Akses Event Anda",
    icon: Settings,
    description: "Login ke dashboard dan pilih event yang ingin Anda kelola.",
    details: [
      "Buka dashboard Eventku",
      "Pilih event dari daftar event Anda",
      "Klik untuk masuk ke halaman detail event",
    ],
  },
  {
    number: 2,
    title: "Setup Public Viewer Slug",
    icon: Globe,
    description: "Buat URL unik untuk halaman registrasi publik event Anda.",
    details: [
      'Buka menu "Pengaturan" di sidebar event',
      "Cari bagian \"Public Viewer Slug\"",
      "Masukkan nama unik (contoh: konser-musik-2025)",
      'Klik "Simpan Pengaturan"',
      "Link registrasi akan tersedia di: eventku.co.id/register/[slug-anda]",
    ],
  },
  {
    number: 3,
    title: "Pilih Tema Form",
    icon: Palette,
    description: "Sesuaikan tampilan form registrasi dengan tema yang menarik.",
    themes: [
      { name: "Modern", desc: "Desain bersih dengan warna primary" },
      { name: "Gradient", desc: "Gradien ungu-pink yang eye-catching" },
      { name: "Corporate", desc: "Profesional dengan sentuhan slate" },
      { name: "Nature", desc: "Nuansa hijau segar dan natural" },
      { name: "Dark", desc: "Elegan dengan latar gelap" },
    ],
  },
  {
    number: 4,
    title: "Kelola Form Fields",
    icon: FormInput,
    description: "Atur field yang akan ditampilkan di form registrasi.",
    details: [
      "Field default: Nama, Email, Telepon, Perusahaan, Divisi, Alamat",
      "Semua field bisa di-enable/disable sesuai kebutuhan",
      "Tandai field yang wajib diisi dengan toggle \"Required\"",
      "Tambah custom field dengan berbagai tipe: Text, Email, Number, Select, dll",
      "Drag & drop untuk mengatur urutan field",
    ],
  },
  {
    number: 5,
    title: "Bagikan Link Registrasi",
    icon: Share2,
    description: "Sebarkan link registrasi ke calon peserta.",
    details: [
      "Salin link dari \"Link Registrasi Publik\"",
      "Bagikan via WhatsApp, Email, atau media sosial",
      "Peserta dapat langsung mengisi form tanpa login",
    ],
  },
  {
    number: 6,
    title: "Monitor Pendaftar",
    icon: Users,
    description: "Pantau dan kelola peserta yang sudah mendaftar.",
    details: [
      'Buka tab "Peserta" untuk melihat daftar pendaftar',
      "Data otomatis tersimpan dari form registrasi",
      "Export data ke Excel jika diperlukan",
      "Kirim QR Code ke peserta via email",
    ],
  },
];

const additionalFeatures = [
  {
    icon: QrCode,
    title: "QR Check-in",
    description: "Peserta dapat check-in dengan scan QR code di hari H event.",
  },
  {
    icon: Gift,
    title: "Door Prize",
    description: "Undi pemenang door prize dengan animasi menarik.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Lihat statistik pendaftaran dan check-in secara real-time.",
  },
  {
    icon: Mail,
    title: "Email Notifikasi",
    description: "Kirim email konfirmasi dan reminder otomatis ke peserta.",
  },
];

const videoTutorials = [
  {
    id: 1,
    title: "Membuat Event Baru",
    description: "Pelajari cara membuat event dari awal hingga siap digunakan.",
    duration: "5:30",
    comingSoon: true,
  },
  {
    id: 2,
    title: "Setup Form Registrasi",
    description: "Tutorial lengkap mengatur form dan custom fields.",
    duration: "8:15",
    comingSoon: true,
  },
  {
    id: 3,
    title: "Kelola Peserta & Check-in",
    description: "Cara import peserta, kirim QR, dan proses check-in.",
    duration: "7:45",
    comingSoon: true,
  },
  {
    id: 4,
    title: "Undian Door Prize",
    description: "Gunakan berbagai animasi undian yang menarik.",
    duration: "4:20",
    comingSoon: true,
  },
  {
    id: 5,
    title: "Laporan & Analytics",
    description: "Analisis data event dan export laporan.",
    duration: "6:00",
    comingSoon: true,
  },
  {
    id: 6,
    title: "Tips & Best Practices",
    description: "Tips untuk mengelola event dengan efektif.",
    duration: "10:00",
    comingSoon: true,
  },
];

export default function Guide() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4" variant="secondary">
            <BookOpen className="h-3 w-3 mr-1" />
            Panduan Pengguna
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Panduan Penggunaan Eventku
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Pelajari cara menggunakan fitur-fitur Eventku untuk mengelola event
            Anda dengan mudah dan efisien.
          </p>
        </div>
      </section>

      {/* Form Builder Guide */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              <FileText className="inline-block h-8 w-8 mr-2 text-primary" />
              Cara Menggunakan Form Registrasi
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ikuti langkah-langkah berikut untuk membuat dan mengelola form
              registrasi peserta event Anda.
            </p>
          </div>

          <div className="space-y-8 max-w-4xl mx-auto">
            {guideSteps.map((step, index) => (
              <Card key={step.number} className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-primary to-primary/50" />
                <CardHeader className="pl-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <step.icon className="h-5 w-5 text-primary" />
                        {step.title}
                      </CardTitle>
                      <p className="text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pl-8">
                  {step.details && (
                    <ul className="space-y-2 ml-16">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-sm">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {step.themes && (
                    <div className="ml-16 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {step.themes.map((theme, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg border bg-muted/30"
                        >
                          <p className="font-medium text-sm">{theme.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {theme.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                {index < guideSteps.length - 1 && (
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10">
                    <ArrowRight className="h-8 w-8 text-primary/30 rotate-90" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-6 w-6 text-amber-500" />
                  Tips Penting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0">
                      1
                    </Badge>
                    <span>
                      <strong>Form Builder Add-on:</strong> Fitur ini mungkin
                      perlu diaktifkan/dibeli tergantung tier event Anda. Cek
                      status di halaman Pengaturan.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0">
                      2
                    </Badge>
                    <span>
                      <strong>Slug Unik:</strong> Pastikan slug yang Anda pilih
                      mudah diingat dan relevan dengan event Anda.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0">
                      3
                    </Badge>
                    <span>
                      <strong>Test Form:</strong> Sebelum membagikan link, coba
                      isi form sebagai peserta untuk memastikan semua berfungsi
                      dengan baik.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0">
                      4
                    </Badge>
                    <span>
                      <strong>Email Peserta:</strong> Pastikan field email
                      selalu aktif untuk mengirim QR Code dan notifikasi ke
                      peserta.
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Video Tutorials Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline">
              <Play className="h-3 w-3 mr-1" />
              Video Tutorial
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Tutorial Video</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Pelajari fitur-fitur Eventku melalui video tutorial yang mudah
              diikuti.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {videoTutorials.map((video) => (
              <Card
                key={video.id}
                className="overflow-hidden hover:shadow-lg transition-shadow group"
              >
                {/* Video Thumbnail Placeholder */}
                <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  {video.comingSoon ? (
                    <div className="text-center">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <Play className="h-8 w-8 text-primary/50" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Coming Soon
                      </Badge>
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center cursor-pointer group-hover:scale-110 transition-transform">
                      <Play className="h-8 w-8 text-primary-foreground ml-1" />
                    </div>
                  )}
                  {/* Duration Badge */}
                  <div className="absolute bottom-2 right-2">
                    <Badge
                      variant="secondary"
                      className="bg-background/80 backdrop-blur-sm text-xs"
                    >
                      {video.duration}
                    </Badge>
                  </div>
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-semibold mb-1">{video.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {video.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Subscribe for Updates */}
          <div className="mt-12 text-center">
            <Card className="max-w-xl mx-auto border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="pt-6 pb-6">
                <Play className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">
                  Video Tutorial Segera Hadir!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Kami sedang menyiapkan video tutorial lengkap untuk membantu
                  Anda menggunakan Eventku dengan maksimal. Stay tuned!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Fitur Lainnya</h2>
            <p className="text-muted-foreground">
              Eksplorasi fitur-fitur powerful lainnya di Eventku
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {additionalFeatures.map((feature, idx) => (
              <Card
                key={idx}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
