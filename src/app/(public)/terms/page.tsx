'use client';

import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Mail } from 'lucide-react';

export default function TermsOfService() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Syarat dan <span className="text-primary">Ketentuan</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Terakhir diperbarui: Januari 2026
        </p>
      </section>

      {/* Content Section */}
      <section className="container mx-auto px-4 pb-20">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="pt-6 prose prose-sm max-w-none dark:prose-invert">
            <div className="space-y-8">
              {/* Intro */}
              <section>
                <p className="text-muted-foreground leading-relaxed">
                  Selamat datang di <strong>Eventku.co.id</strong> (selanjutnya disebut <strong>"Platform"</strong>). 
                  Dengan mengakses dan/atau menggunakan Platform ini, Anda menyatakan telah membaca, memahami, 
                  dan menyetujui seluruh <strong>Syarat dan Ketentuan Penggunaan</strong> di bawah ini.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Jika Anda tidak menyetujui salah satu, sebagian, atau seluruh ketentuan ini, mohon untuk tidak menggunakan Platform.
                </p>
              </section>

              <Separator />

              {/* 1. Definisi */}
              <section>
                <h2 className="text-xl font-semibold mb-4">1. Definisi</h2>
                <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
                  <li><strong>Eventku</strong> adalah platform manajemen event berbasis web yang dapat diakses melalui domain eventku.co.id.</li>
                  <li><strong>Pengguna</strong> adalah setiap individu atau badan hukum yang mengakses dan/atau menggunakan Platform.</li>
                  <li><strong>EO (Event Organizer)</strong> adalah pihak yang menyelenggarakan dan mengelola event melalui Platform.</li>
                  <li><strong>Peserta</strong> adalah individu yang mendaftar atau hadir dalam event yang dikelola melalui Platform.</li>
                  <li><strong>Layanan</strong> adalah seluruh fitur dan fungsi yang disediakan oleh Eventku.</li>
                </ol>
              </section>

              <Separator />

              {/* 2. Ruang Lingkup Layanan */}
              <section>
                <h2 className="text-xl font-semibold mb-4">2. Ruang Lingkup Layanan</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Eventku menyediakan layanan berupa:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Manajemen event</li>
                  <li>Registrasi dan pengelolaan peserta</li>
                  <li>Check-in digital</li>
                  <li>Sistem undian/doorprize</li>
                  <li>Notifikasi dan laporan event</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4 font-medium">
                  Eventku <strong>tidak bertanggung jawab atas isi, pelaksanaan, atau hasil event</strong> yang diselenggarakan oleh EO.
                </p>
              </section>

              <Separator />

              {/* 3. Akun dan Keamanan */}
              <section>
                <h2 className="text-xl font-semibold mb-4">3. Akun dan Keamanan</h2>
                <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
                  <li>Pengguna bertanggung jawab menjaga kerahasiaan akun dan kredensial login.</li>
                  <li>Segala aktivitas yang terjadi melalui akun Pengguna menjadi tanggung jawab Pengguna sepenuhnya.</li>
                  <li>Eventku berhak menonaktifkan akun jika ditemukan pelanggaran terhadap Syarat dan Ketentuan ini.</li>
                </ol>
              </section>

              <Separator />

              {/* 4. Kewajiban Pengguna */}
              <section>
                <h2 className="text-xl font-semibold mb-4">4. Kewajiban Pengguna</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Pengguna dilarang untuk:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Menggunakan Platform untuk tujuan yang melanggar hukum</li>
                  <li>Mengunggah data palsu, menyesatkan, atau tidak sah</li>
                  <li>Mengganggu atau merusak sistem Platform</li>
                  <li>Mengakses data Pengguna lain tanpa izin</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Pengguna bertanggung jawab penuh atas data dan konten yang dimasukkan ke dalam Platform.
                </p>
              </section>

              <Separator />

              {/* 5. Data dan Privasi */}
              <section>
                <h2 className="text-xl font-semibold mb-4">5. Data dan Privasi</h2>
                <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
                  <li>Pengguna menjamin bahwa data yang dimasukkan ke Platform diperoleh secara sah.</li>
                  <li>Eventku mengelola data sesuai dengan <strong>Kebijakan Privasi</strong> yang berlaku.</li>
                  <li>Eventku berhak menggunakan data secara agregat dan anonim untuk keperluan analisis dan pengembangan layanan.</li>
                </ol>
              </section>

              <Separator />

              {/* 6. Hak Kekayaan Intelektual */}
              <section>
                <h2 className="text-xl font-semibold mb-4">6. Hak Kekayaan Intelektual</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Seluruh konten, sistem, desain, logo, dan teknologi pada Platform merupakan milik Eventku dan dilindungi oleh hukum yang berlaku.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Pengguna dilarang menyalin, memodifikasi, atau mendistribusikan tanpa izin tertulis dari Eventku.
                </p>
              </section>

              <Separator />

              {/* 7. Pembatasan Tanggung Jawab */}
              <section>
                <h2 className="text-xl font-semibold mb-4">7. Pembatasan Tanggung Jawab</h2>
                <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
                  <li>Eventku tidak menjamin Platform akan selalu tersedia tanpa gangguan.</li>
                  <li>Eventku tidak bertanggung jawab atas kerugian langsung maupun tidak langsung yang timbul akibat penggunaan Platform.</li>
                  <li>Eventku tidak bertanggung jawab atas kegagalan event, kesalahan data, atau sengketa antara EO dan Peserta.</li>
                </ol>
              </section>

              <Separator />

              {/* 8. Penghentian Layanan */}
              <section>
                <h2 className="text-xl font-semibold mb-4">8. Penghentian Layanan</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Eventku berhak untuk:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Menghentikan atau membatasi layanan sewaktu-waktu</li>
                  <li>Menonaktifkan akun Pengguna yang melanggar ketentuan</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Penghentian layanan tidak menghapus kewajiban Pengguna yang telah timbul sebelumnya.
                </p>
              </section>

              <Separator />

              {/* 9. Perubahan Ketentuan */}
              <section>
                <h2 className="text-xl font-semibold mb-4">9. Perubahan Ketentuan</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Eventku berhak mengubah Syarat dan Ketentuan ini sewaktu-waktu. Perubahan akan diumumkan melalui Platform dan berlaku sejak tanggal pembaruan.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Penggunaan Platform secara berkelanjutan dianggap sebagai persetujuan atas perubahan tersebut.
                </p>
              </section>

              <Separator />

              {/* 10. Hukum yang Berlaku */}
              <section>
                <h2 className="text-xl font-semibold mb-4">10. Hukum yang Berlaku</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Syarat dan Ketentuan ini diatur dan ditafsirkan berdasarkan <strong>hukum Republik Indonesia</strong>.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Setiap sengketa yang timbul akan diselesaikan terlebih dahulu secara musyawarah. Apabila tidak tercapai, maka akan diselesaikan melalui jalur hukum sesuai peraturan perundang-undangan yang berlaku.
                </p>
              </section>

              <Separator />

              {/* 11. Kontak */}
              <section>
                <h2 className="text-xl font-semibold mb-4">11. Kontak</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Untuk pertanyaan atau keluhan terkait Syarat dan Ketentuan ini, silakan hubungi:
                </p>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <a 
                    href="mailto:admin@eventku.co.id" 
                    className="text-primary hover:underline font-medium"
                  >
                    admin@eventku.co.id
                  </a>
                </div>
              </section>

              <Separator />

              {/* Closing */}
              <section className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                <p className="text-center text-muted-foreground leading-relaxed">
                  Dengan menggunakan Platform Eventku, Anda menyatakan <strong className="text-foreground">setuju dan terikat</strong> dengan seluruh Syarat dan Ketentuan ini.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </section>
    </PublicLayout>
  );
}
