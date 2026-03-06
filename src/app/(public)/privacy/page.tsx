'use client';

import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Kebijakan <span className="text-primary">Privasi</span>
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
                  Kebijakan Privasi ini menjelaskan bagaimana <strong>Eventku.co.id</strong> (selanjutnya disebut <strong>"Eventku"</strong>, <strong>"Kami"</strong>) mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi Pengguna sesuai dengan peraturan perundang-undangan yang berlaku di Indonesia, termasuk <strong>Undang-Undang Perlindungan Data Pribadi (UU PDP)</strong>.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Dengan menggunakan Platform Eventku, Anda menyatakan telah membaca, memahami, dan menyetujui Kebijakan Privasi ini.
                </p>
              </section>

              <Separator />

              {/* 1. Informasi yang Kami Kumpulkan */}
              <section>
                <h2 className="text-xl font-semibold mb-4">1. Informasi yang Kami Kumpulkan</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Kami dapat mengumpulkan informasi berikut:
                </p>
                
                <h3 className="font-medium mb-2 text-foreground">1.1 Data Pribadi</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Nama lengkap</li>
                  <li>Alamat email</li>
                  <li>Nomor telepon</li>
                  <li>Informasi akun pengguna</li>
                </ul>

                <h3 className="font-medium mb-2 text-foreground">1.2 Data Event</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Data pendaftaran peserta</li>
                  <li>Data kehadiran dan check-in</li>
                  <li>Data undian/doorprize</li>
                </ul>

                <h3 className="font-medium mb-2 text-foreground">1.3 Data Teknis</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Alamat IP</li>
                  <li>Jenis perangkat dan browser</li>
                  <li>Log aktivitas sistem</li>
                </ul>
              </section>

              <Separator />

              {/* 2. Cara Penggunaan Informasi */}
              <section>
                <h2 className="text-xl font-semibold mb-4">2. Cara Penggunaan Informasi</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Informasi yang kami kumpulkan digunakan untuk:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Menyediakan dan mengelola layanan Eventku</li>
                  <li>Memverifikasi identitas Pengguna</li>
                  <li>Mengelola event dan peserta</li>
                  <li>Mengirim notifikasi dan komunikasi terkait layanan</li>
                  <li>Analisis dan pengembangan fitur</li>
                  <li>Kepatuhan terhadap hukum yang berlaku</li>
                </ul>
              </section>

              <Separator />

              {/* 3. Dasar Hukum Pemrosesan Data */}
              <section>
                <h2 className="text-xl font-semibold mb-4">3. Dasar Hukum Pemrosesan Data</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Pemrosesan data pribadi dilakukan berdasarkan:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Persetujuan Pengguna</li>
                  <li>Pelaksanaan perjanjian layanan</li>
                  <li>Kewajiban hukum</li>
                  <li>Kepentingan sah Eventku</li>
                </ul>
              </section>

              <Separator />

              {/* 4. Penyimpanan dan Keamanan Data */}
              <section>
                <h2 className="text-xl font-semibold mb-4">4. Penyimpanan dan Keamanan Data</h2>
                <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
                  <li>Data disimpan pada infrastruktur cloud yang aman.</li>
                  <li>Kami menerapkan langkah-langkah teknis dan organisasi untuk melindungi data dari akses tidak sah, kebocoran, atau penyalahgunaan.</li>
                  <li>Akses data dibatasi hanya kepada pihak yang berwenang.</li>
                </ol>
              </section>

              <Separator />

              {/* 5. Pembagian Data kepada Pihak Ketiga */}
              <section>
                <h2 className="text-xl font-semibold mb-4">5. Pembagian Data kepada Pihak Ketiga</h2>
                <p className="text-muted-foreground leading-relaxed mb-4 font-medium">
                  Eventku <strong>tidak menjual data pribadi Pengguna</strong>.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Data dapat dibagikan kepada pihak ketiga terbatas untuk:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Penyedia infrastruktur teknologi</li>
                  <li>Layanan email dan notifikasi</li>
                  <li>Kewajiban hukum atau permintaan resmi pemerintah</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Semua pihak ketiga wajib menjaga kerahasiaan data.
                </p>
              </section>

              <Separator />

              {/* 6. Hak Pengguna */}
              <section>
                <h2 className="text-xl font-semibold mb-4">6. Hak Pengguna</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Sesuai dengan UU PDP, Pengguna memiliki hak untuk:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Mengakses data pribadi</li>
                  <li>Memperbaiki data yang tidak akurat</li>
                  <li>Menarik persetujuan pemrosesan data</li>
                  <li>Menghapus data pribadi tertentu</li>
                  <li>Mengajukan keberatan atas pemrosesan data</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Permintaan dapat diajukan melalui kontak resmi Eventku.
                </p>
              </section>

              <Separator />

              {/* 7. Retensi Data */}
              <section>
                <h2 className="text-xl font-semibold mb-4">7. Retensi Data</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Data pribadi disimpan selama:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Akun Pengguna masih aktif, atau</li>
                  <li>Diperlukan untuk memenuhi kewajiban hukum</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Setelah tidak diperlukan, data akan dihapus atau dianonimkan.
                </p>
              </section>

              <Separator />

              {/* 8. Cookie dan Teknologi Pelacakan */}
              <section>
                <h2 className="text-xl font-semibold mb-4">8. Cookie dan Teknologi Pelacakan</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Eventku dapat menggunakan cookie atau teknologi serupa untuk:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Menjaga sesi login</li>
                  <li>Meningkatkan pengalaman pengguna</li>
                  <li>Analitik penggunaan platform</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Pengguna dapat mengatur preferensi cookie melalui browser masing-masing.
                </p>
              </section>

              <Separator />

              {/* 9. Perubahan Kebijakan Privasi */}
              <section>
                <h2 className="text-xl font-semibold mb-4">9. Perubahan Kebijakan Privasi</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Eventku berhak mengubah Kebijakan Privasi ini sewaktu-waktu. Perubahan akan diumumkan melalui Platform dan berlaku sejak tanggal pembaruan.
                </p>
              </section>

              <Separator />

              {/* 10. Kontak */}
              <section>
                <h2 className="text-xl font-semibold mb-4">10. Kontak</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Untuk pertanyaan, permintaan, atau keluhan terkait Kebijakan Privasi ini, silakan hubungi:
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
                  Dengan menggunakan Platform Eventku, Anda menyatakan <strong className="text-foreground">setuju dan memberikan persetujuan</strong> atas pengumpulan dan penggunaan data pribadi sesuai Kebijakan Privasi ini.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </section>
    </PublicLayout>
  );
}
