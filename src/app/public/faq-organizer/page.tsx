'use client';

import PublicLayout from "@/components/layout/PublicLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HelpCircle,
  Settings,
  Users,
  CreditCard,
  FileText,
  QrCode,
  Gift,
  Mail,
  Shield,
  BarChart3,
} from "lucide-react";

const faqCategories = [
  {
    id: "getting-started",
    title: "Memulai",
    icon: Settings,
    questions: [
      {
        q: "Bagaimana cara membuat event baru?",
        a: "Setelah login, klik tombol 'Buat Event' di dashboard. Isi informasi event seperti nama, tanggal, lokasi, dan deskripsi. Pilih tier yang sesuai dengan kebutuhan Anda (Free, Basic, Pro, atau Enterprise).",
      },
      {
        q: "Apa perbedaan tier Free, Basic, Pro, dan Enterprise?",
        a: "Setiap tier memiliki batasan berbeda:\n• **Free**: Maksimal 50 peserta, 5 hadiah hiburan\n• **Basic**: Maksimal 200 peserta, hadiah hiburan & utama\n• **Pro**: Maksimal 500 peserta, semua kategori hadiah\n• **Enterprise**: Unlimited peserta & hadiah\n\nCek halaman Harga untuk detail lengkap.",
      },
      {
        q: "Bagaimana cara mengupgrade tier event?",
        a: "Buka halaman 'Pengaturan' event Anda, lalu klik 'Upgrade Tier'. Pilih tier yang diinginkan dan lakukan pembayaran. Upgrade akan aktif setelah pembayaran dikonfirmasi.",
      },
      {
        q: "Apakah saya bisa membatalkan event?",
        a: "Ya, Anda bisa membatalkan event melalui halaman Pengaturan event. Namun, jika event berbayar, proses refund akan mengikuti kebijakan refund yang berlaku.",
      },
    ],
  },
  {
    id: "registration",
    title: "Registrasi & Form",
    icon: FileText,
    questions: [
      {
        q: "Bagaimana cara mengaktifkan form registrasi publik?",
        a: "1. Buka menu 'Pengaturan' di event Anda\n2. Aktifkan toggle 'Aktifkan Registrasi'\n3. Isi 'Public Viewer Slug' (contoh: konser-musik-2025)\n4. Simpan pengaturan\n5. Link registrasi akan tersedia di: eventku.co.id/register/[slug-anda]",
      },
      {
        q: "Bagaimana cara menambah custom field di form?",
        a: "Di halaman Pengaturan, scroll ke bagian 'Form Builder'. Klik 'Tambah Field' dan pilih tipe field yang diinginkan (Text, Email, Number, Select, dll). Anda bisa mengatur label, placeholder, dan apakah field tersebut wajib diisi.",
      },
      {
        q: "Apakah saya bisa mengubah tema form registrasi?",
        a: "Ya! Di halaman Pengaturan, pilih dari 5 tema yang tersedia: Modern, Gradient, Corporate, Nature, atau Dark. Tema akan langsung diterapkan ke form registrasi publik Anda.",
      },
      {
        q: "Bagaimana cara mengaktifkan Form Builder Add-on?",
        a: "Form Builder Add-on memungkinkan Anda membuat custom field. Untuk tier tertentu, fitur ini perlu dibeli terpisah. Buka Pengaturan > Form Builder Add-on > Beli Add-on.",
      },
      {
        q: "Data peserta apa saja yang bisa saya kumpulkan?",
        a: "Field default meliputi: Nama, Email, Telepon, Perusahaan, Divisi, dan Alamat. Dengan Form Builder Add-on, Anda bisa menambah field custom seperti dropdown, checkbox, date picker, dan lainnya.",
      },
    ],
  },
  {
    id: "participants",
    title: "Kelola Peserta",
    icon: Users,
    questions: [
      {
        q: "Bagaimana cara import peserta dari Excel/CSV?",
        a: "Di tab 'Peserta', klik tombol 'Import CSV'. Download template yang disediakan, isi data peserta, lalu upload file CSV tersebut. Sistem akan otomatis memvalidasi dan menambahkan peserta.",
      },
      {
        q: "Bagaimana cara mengirim QR Code ke peserta?",
        a: "Anda bisa mengirim QR Code dengan 2 cara:\n• **Individual**: Klik ikon email di baris peserta\n• **Bulk**: Pilih beberapa peserta, lalu klik 'Kirim QR Email'\n\nPastikan email peserta sudah terisi dengan benar.",
      },
      {
        q: "Bagaimana cara export data peserta?",
        a: "Di tab 'Peserta', klik tombol 'Export'. Pilih format yang diinginkan (Excel atau CSV). Data yang diekspor termasuk semua informasi peserta dan status check-in.",
      },
      {
        q: "Apakah saya bisa mengedit data peserta?",
        a: "Ya, klik ikon edit di baris peserta yang ingin diubah. Anda bisa mengubah nama, email, telepon, dan informasi lainnya. Perubahan akan langsung tersimpan.",
      },
      {
        q: "Bagaimana cara menghapus peserta?",
        a: "Klik ikon hapus di baris peserta, lalu konfirmasi penghapusan. Perhatian: peserta yang sudah menjadi pemenang tidak bisa dihapus.",
      },
    ],
  },
  {
    id: "checkin",
    title: "Check-in & QR Code",
    icon: QrCode,
    questions: [
      {
        q: "Bagaimana cara melakukan check-in peserta?",
        a: "Ada beberapa cara check-in:\n• **Scan QR**: Buka halaman Check-in, scan QR Code peserta\n• **Manual**: Cari nama peserta di tab Peserta, klik tombol Check-in\n• **Scanner App**: Gunakan akun scanner khusus untuk tim Anda",
      },
      {
        q: "Bagaimana cara menambah scanner/petugas check-in?",
        a: "Buka tab 'Scanners' di event Anda. Klik 'Tambah Scanner', masukkan nama dan email petugas. Sistem akan membuat akun scanner dan mengirimkan kredensial via email.",
      },
      {
        q: "Apakah scanner bisa digunakan offline?",
        a: "Saat ini scanner membutuhkan koneksi internet untuk memvalidasi QR Code dan menyimpan data check-in secara real-time.",
      },
      {
        q: "Bagaimana jika peserta kehilangan QR Code?",
        a: "Anda bisa mengirim ulang QR Code via email dari halaman Peserta. Atau, lakukan check-in manual dengan mencari nama peserta.",
      },
      {
        q: "Bisakah saya melihat statistik check-in real-time?",
        a: "Ya! Buka tab 'Attendance Monitor' untuk melihat statistik check-in secara real-time, termasuk grafik per jam dan persentase kehadiran.",
      },
    ],
  },
  {
    id: "prizes",
    title: "Hadiah & Door Prize",
    icon: Gift,
    questions: [
      {
        q: "Bagaimana cara menambah hadiah?",
        a: "Di tab 'Hadiah', klik 'Tambah Hadiah'. Isi nama hadiah, kategori (Hiburan/Utama/Grand Prize), jumlah, dan upload gambar jika ada. Klik Simpan.",
      },
      {
        q: "Apa perbedaan kategori hadiah?",
        a: "• **Hiburan**: Hadiah kecil, biasanya diundi di awal\n• **Utama**: Hadiah menengah\n• **Grand Prize**: Hadiah utama/terbesar, biasanya diundi terakhir\n\nSetiap tier event memiliki batasan jumlah hadiah per kategori.",
      },
      {
        q: "Bagaimana cara melakukan undian door prize?",
        a: "1. Buka tab 'Undian'\n2. Pilih hadiah yang akan diundi\n3. Pilih animasi undian (Spin Wheel, Slot Machine, Card Reveal, atau Random Number)\n4. Klik 'Mulai Undian'\n5. Pemenang akan otomatis tersimpan",
      },
      {
        q: "Apakah peserta bisa menang lebih dari sekali?",
        a: "Secara default, peserta yang sudah menang tidak akan masuk undian berikutnya. Ini memastikan hadiah terdistribusi merata.",
      },
      {
        q: "Bagaimana cara menampilkan undian di layar besar?",
        a: "Klik tombol 'Fullscreen Display' atau buka halaman Draw Display. Tampilan ini dioptimalkan untuk proyektor/layar besar dengan animasi yang menarik.",
      },
    ],
  },
  {
    id: "payments",
    title: "Pembayaran & Tiket",
    icon: CreditCard,
    questions: [
      {
        q: "Bagaimana cara membuat event berbayar?",
        a: "Di pengaturan event, aktifkan 'Event Berbayar' dan atur harga tiket. Anda juga bisa membuat beberapa tier tiket dengan harga berbeda (contoh: Regular, VIP, VVIP).",
      },
      {
        q: "Metode pembayaran apa saja yang tersedia?",
        a: "Kami mendukung berbagai metode pembayaran melalui Midtrans:\n• Transfer Bank (BCA, Mandiri, BNI, dll)\n• E-Wallet (GoPay, OVO, DANA)\n• Kartu Kredit/Debit\n• QRIS",
      },
      {
        q: "Kapan saya menerima pembayaran dari penjualan tiket?",
        a: "Pembayaran akan di-payout ke rekening Anda setelah event selesai, dikurangi biaya platform. Pastikan Anda sudah mengisi data rekening bank di Pengaturan.",
      },
      {
        q: "Bagaimana proses refund peserta?",
        a: "Peserta bisa mengajukan refund melalui halaman status tiket mereka. Anda akan menerima notifikasi dan bisa menyetujui/menolak permintaan refund dari halaman Pembayaran event.",
      },
      {
        q: "Bagaimana cara melihat laporan penjualan?",
        a: "Buka tab 'Pembayaran' di event Anda untuk melihat semua transaksi, status pembayaran, dan total revenue. Anda juga bisa export laporan ke Excel.",
      },
    ],
  },
  {
    id: "notifications",
    title: "Email & Notifikasi",
    icon: Mail,
    questions: [
      {
        q: "Email apa saja yang otomatis dikirim ke peserta?",
        a: "Sistem mengirim email otomatis untuk:\n• Konfirmasi pendaftaran\n• QR Code tiket\n• Konfirmasi pembayaran\n• Reminder H-1 event\n• Notifikasi pemenang door prize",
      },
      {
        q: "Bagaimana cara mengirim broadcast email ke semua peserta?",
        a: "Di tab 'Pengaturan' > 'Notifikasi', Anda bisa mengirim email broadcast ke semua peserta atau segmen tertentu (terdaftar, sudah check-in, dll).",
      },
      {
        q: "Apakah saya bisa customize template email?",
        a: "Saat ini template email menggunakan format standar dengan branding Eventku. Fitur custom template email akan segera hadir.",
      },
    ],
  },
  {
    id: "analytics",
    title: "Analytics & Laporan",
    icon: BarChart3,
    questions: [
      {
        q: "Data analytics apa saja yang tersedia?",
        a: "Dashboard analytics menampilkan:\n• Statistik pendaftaran per hari/minggu\n• Persentase check-in\n• Distribusi peserta per tier tiket\n• Grafik pembayaran\n• Aktivitas check-in per jam",
      },
      {
        q: "Bagaimana cara export laporan event?",
        a: "Di tab 'Analytics', klik 'Export Report' untuk mengunduh laporan lengkap dalam format PDF. Laporan mencakup semua statistik dan grafik.",
      },
    ],
  },
  {
    id: "security",
    title: "Keamanan",
    icon: Shield,
    questions: [
      {
        q: "Apakah data peserta saya aman?",
        a: "Ya, kami menggunakan enkripsi end-to-end dan menyimpan data di server yang aman. Kami mematuhi standar keamanan data dan tidak membagikan data peserta ke pihak ketiga.",
      },
      {
        q: "Siapa saja yang bisa mengakses data event saya?",
        a: "Hanya Anda (owner) dan scanner yang Anda tambahkan yang bisa mengakses data event. Scanner hanya memiliki akses terbatas untuk check-in.",
      },
      {
        q: "Bagaimana cara mengamankan akun saya?",
        a: "Gunakan password yang kuat dan unik. Jangan bagikan kredensial login Anda. Logout setelah selesai menggunakan platform, terutama di perangkat bersama.",
      },
    ],
  },
];

export default function FAQOrganizer() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4" variant="secondary">
            <HelpCircle className="h-3 w-3 mr-1" />
            FAQ Organizer
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            FAQ untuk Event Organizer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Temukan jawaban atas pertanyaan teknis seputar penggunaan platform
            Eventku untuk mengelola event Anda.
          </p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {faqCategories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <category.icon className="h-5 w-5 text-primary" />
                    </div>
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((item, idx) => (
                      <AccordionItem key={idx} value={`${category.id}-${idx}`}>
                        <AccordionTrigger className="text-left">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            {item.a.split("\n").map((line, i) => (
                              <p key={i} className="mb-2 last:mb-0">
                                {line.startsWith("•") ? (
                                  <span className="ml-2">{line}</span>
                                ) : line.match(/^\d\./) ? (
                                  <span className="ml-2">{line}</span>
                                ) : (
                                  line
                                )}
                              </p>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Masih Ada Pertanyaan?</h2>
          <p className="text-muted-foreground mb-6">
            Tim support kami siap membantu Anda
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Hubungi Kami
          </a>
        </div>
      </section>
    </PublicLayout>
  );
}
