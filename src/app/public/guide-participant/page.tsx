'use client';

import PublicLayout from "@/components/layout/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  QrCode,
  CheckCircle,
  Gift,
  Mail,
  Smartphone,
  ArrowRight,
  Lightbulb,
  BookOpen,
  Ticket,
  CreditCard,
  PartyPopper,
  Clock,
  MapPin,
  Play,
} from "lucide-react";

const registrationSteps = [
  {
    number: 1,
    title: "Buka Link Registrasi",
    icon: Smartphone,
    description: "Akses link registrasi yang diberikan oleh Event Organizer.",
    details: [
      "Link biasanya dibagikan via WhatsApp, Email, atau media sosial",
      "Format link: eventku.co.id/register/[nama-event]",
      "Pastikan Anda membuka link yang benar dari penyelenggara resmi",
    ],
  },
  {
    number: 2,
    title: "Isi Data Diri",
    icon: UserPlus,
    description: "Lengkapi form registrasi dengan data yang diminta.",
    details: [
      "Isi nama lengkap sesuai KTP/identitas resmi",
      "Masukkan email aktif (untuk menerima tiket)",
      "Isi nomor telepon yang bisa dihubungi",
      "Lengkapi data lain yang diminta (perusahaan, alamat, dll)",
    ],
  },
  {
    number: 3,
    title: "Lakukan Pembayaran (Jika Event Berbayar)",
    icon: CreditCard,
    description: "Selesaikan pembayaran sesuai instruksi.",
    details: [
      "Pilih tier tiket yang diinginkan (jika ada opsi)",
      "Pilih metode pembayaran (Transfer Bank, E-Wallet, QRIS)",
      "Selesaikan pembayaran sebelum batas waktu",
      "Simpan bukti pembayaran sebagai referensi",
    ],
  },
  {
    number: 4,
    title: "Terima Email Konfirmasi & QR Code",
    icon: Mail,
    description: "Cek email untuk menerima tiket digital Anda.",
    details: [
      "Email berisi konfirmasi pendaftaran",
      "QR Code tiket terlampir di email",
      "Simpan atau screenshot QR Code untuk check-in",
      "Cek folder Spam jika email tidak masuk",
    ],
  },
];

const checkinSteps = [
  {
    number: 1,
    title: "Datang ke Lokasi Event",
    icon: MapPin,
    description: "Hadir di lokasi sesuai waktu yang ditentukan.",
    tips: "Datang lebih awal untuk menghindari antrian panjang saat check-in.",
  },
  {
    number: 2,
    title: "Siapkan QR Code",
    icon: QrCode,
    description: "Buka QR Code tiket di smartphone Anda.",
    tips: "Pastikan layar cukup terang agar mudah di-scan oleh petugas.",
  },
  {
    number: 3,
    title: "Scan QR Code di Counter",
    icon: CheckCircle,
    description: "Tunjukkan QR Code ke petugas untuk di-scan.",
    tips: "Proses scan hanya butuh beberapa detik. Anda akan mendapat konfirmasi check-in berhasil.",
  },
  {
    number: 4,
    title: "Masuk ke Area Event",
    icon: PartyPopper,
    description: "Selamat! Anda sudah terdaftar hadir di event.",
    tips: "Setelah check-in, Anda berhak mengikuti undian door prize!",
  },
];

const prizeClaimSteps = [
  {
    number: 1,
    title: "Ikuti Sesi Undian",
    icon: Gift,
    description: "Perhatikan sesi undian door prize yang diadakan panitia.",
    details: [
      "Undian biasanya dilakukan di akhir acara",
      "Pastikan Anda sudah check-in untuk eligible",
      "Nomor tiket Anda akan diundi secara acak",
    ],
  },
  {
    number: 2,
    title: "Cek Pengumuman Pemenang",
    icon: PartyPopper,
    description: "Perhatikan layar atau pengumuman MC saat nama/nomor dipanggil.",
    details: [
      "Pemenang ditampilkan di layar besar",
      "MC akan mengumumkan nama dan nomor tiket pemenang",
      "Anda juga akan menerima email notifikasi jika menang",
    ],
  },
  {
    number: 3,
    title: "Konfirmasi & Klaim Hadiah",
    icon: Ticket,
    description: "Tunjukkan tiket/identitas Anda ke panitia.",
    details: [
      "Datang ke booth klaim hadiah dengan menunjukkan QR Code",
      "Tunjukkan identitas (KTP) untuk verifikasi",
      "Tanda tangan form penerimaan hadiah",
      "Terima hadiah Anda!",
    ],
  },
];

const tips = [
  {
    icon: Mail,
    title: "Cek Email Secara Berkala",
    description:
      "Email penting seperti konfirmasi, reminder, dan notifikasi pemenang dikirim ke alamat email Anda.",
  },
  {
    icon: QrCode,
    title: "Simpan QR Code",
    description:
      "Screenshot QR Code tiket untuk berjaga-jaga jika tidak ada koneksi internet saat check-in.",
  },
  {
    icon: Clock,
    title: "Datang Tepat Waktu",
    description:
      "Datang sesuai waktu yang ditentukan agar tidak ketinggalan sesi penting atau undian.",
  },
  {
    icon: Smartphone,
    title: "Charge Smartphone",
    description:
      "Pastikan baterai smartphone cukup untuk menampilkan QR Code saat check-in.",
  },
];

const videoTutorials = [
  {
    id: 1,
    title: "Cara Registrasi Event",
    description: "Panduan lengkap mendaftar ke event melalui Eventku.",
    duration: "3:00",
    comingSoon: true,
  },
  {
    id: 2,
    title: "Proses Pembayaran Tiket",
    description: "Tutorial pembayaran tiket event berbayar.",
    duration: "4:30",
    comingSoon: true,
  },
  {
    id: 3,
    title: "Check-in dengan QR Code",
    description: "Cara check-in di lokasi event menggunakan QR Code.",
    duration: "2:15",
    comingSoon: true,
  },
  {
    id: 4,
    title: "Klaim Hadiah Door Prize",
    description: "Langkah-langkah klaim hadiah jika Anda menang.",
    duration: "3:45",
    comingSoon: true,
  },
];

export default function GuideParticipant() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4" variant="secondary">
            <BookOpen className="h-3 w-3 mr-1" />
            Panduan Peserta
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Panduan untuk Peserta Event
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Pelajari cara mendaftar, check-in, dan klaim hadiah di event yang
            menggunakan platform Eventku.
          </p>
        </div>
      </section>

      {/* Registration Guide */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              <UserPlus className="inline-block h-8 w-8 mr-2 text-primary" />
              Cara Registrasi Event
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ikuti langkah-langkah berikut untuk mendaftar ke event.
            </p>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            {registrationSteps.map((step, index) => (
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
                  <ul className="space-y-2 ml-16">
                    {step.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                {index < registrationSteps.length - 1 && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10">
                    <ArrowRight className="h-6 w-6 text-primary/30 rotate-90" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Check-in Guide */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              <QrCode className="inline-block h-8 w-8 mr-2 text-primary" />
              Cara Check-in di Event
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Proses check-in cepat dan mudah dengan QR Code.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {checkinSteps.map((step) => (
              <Card key={step.number} className="text-center">
                <CardContent className="pt-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-2xl mx-auto mb-4">
                    {step.number}
                  </div>
                  <step.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {step.description}
                  </p>
                  <p className="text-xs text-primary/80 italic">
                    💡 {step.tips}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Prize Claim Guide */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              <Gift className="inline-block h-8 w-8 mr-2 text-primary" />
              Cara Klaim Hadiah Door Prize
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Jika Anda beruntung menjadi pemenang, ikuti langkah berikut.
            </p>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            {prizeClaimSteps.map((step, index) => (
              <Card key={step.number} className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-500 to-amber-500/50" />
                <CardHeader className="pl-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-lg">
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <step.icon className="h-5 w-5 text-amber-500" />
                        {step.title}
                      </CardTitle>
                      <p className="text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pl-8">
                  <ul className="space-y-2 ml-16">
                    {step.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        <span className="text-sm">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                {index < prizeClaimSteps.length - 1 && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10">
                    <ArrowRight className="h-6 w-6 text-amber-500/30 rotate-90" />
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
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              <Lightbulb className="inline-block h-8 w-8 mr-2 text-amber-500" />
              Tips untuk Peserta
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {tips.map((tip, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <tip.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-center mb-2">{tip.title}</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {tip.description}
                  </p>
                </CardContent>
              </Card>
            ))}
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
              Pelajari cara menggunakan Eventku sebagai peserta melalui video
              tutorial yang mudah diikuti.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {videoTutorials.map((video) => (
              <Card
                key={video.id}
                className="overflow-hidden hover:shadow-lg transition-shadow group"
              >
                {/* Video Thumbnail Placeholder */}
                <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  {video.comingSoon ? (
                    <div className="text-center">
                      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <Play className="h-6 w-6 text-primary/50" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Coming Soon
                      </Badge>
                    </div>
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center cursor-pointer group-hover:scale-110 transition-transform">
                      <Play className="h-6 w-6 text-primary-foreground ml-1" />
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
                  <h3 className="font-semibold text-sm mb-1">{video.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {video.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Subscribe for Updates */}
          <div className="mt-10 text-center">
            <Card className="max-w-xl mx-auto border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="pt-6 pb-6">
                <Play className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">
                  Video Tutorial Segera Hadir!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Kami sedang menyiapkan video tutorial untuk membantu Anda
                  memahami cara menggunakan Eventku. Stay tuned!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <Card className="max-w-2xl mx-auto border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="pt-8 pb-8">
              <Ticket className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Cek Status Tiket Anda</h2>
              <p className="text-muted-foreground mb-6">
                Gunakan fitur Cek Tiket untuk melihat status registrasi dan
                tiket Anda.
              </p>
              <a
                href="/ticket-status"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Cek Status Tiket
              </a>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
