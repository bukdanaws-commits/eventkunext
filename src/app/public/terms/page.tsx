'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="container max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle className="text-3xl">Syarat & Ketentuan</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p className="text-muted-foreground mb-4">
              Terakhir diperbarui: Januari 2025
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">1. Penerimaan Ketentuan</h2>
            <p className="text-muted-foreground mb-4">
              Dengan menggunakan layanan Eventku, Anda menyetujui untuk terikat oleh syarat dan ketentuan ini. 
              Jika Anda tidak menyetujui ketentuan ini, mohon untuk tidak menggunakan layanan kami.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">2. Deskripsi Layanan</h2>
            <p className="text-muted-foreground mb-4">
              Eventku menyediakan platform manajemen event yang mencakup registrasi peserta, check-in digital, 
              sistem undian doorprize, dan fitur lainnya untuk penyelenggara event.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">3. Pendaftaran Akun</h2>
            <p className="text-muted-foreground mb-4">
              Untuk menggunakan layanan tertentu, Anda perlu membuat akun. Anda bertanggung jawab untuk:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Memberikan informasi yang akurat dan lengkap</li>
              <li>Menjaga kerahasiaan kata sandi akun</li>
              <li>Semua aktivitas yang terjadi di akun Anda</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">4. Penggunaan yang Dilarang</h2>
            <p className="text-muted-foreground mb-4">
              Anda dilarang menggunakan layanan untuk:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Aktivitas ilegal atau tidak sah</li>
              <li>Mengganggu atau merusak layanan</li>
              <li>Mengumpulkan data pengguna tanpa izin</li>
              <li>Menyebarkan malware atau konten berbahaya</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">5. Pembayaran dan Refund</h2>
            <p className="text-muted-foreground mb-4">
              Pembayaran untuk paket berbayar dilakukan di muka. Kebijakan refund:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Refund tersedia dalam 7 hari setelah pembelian jika event belum dimulai</li>
              <li>Biaya admin sebesar 10% akan dikenakan untuk refund</li>
              <li>Event yang sudah selesai tidak dapat di-refund</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">6. Batasan Tanggung Jawab</h2>
            <p className="text-muted-foreground mb-4">
              Eventku tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial 
              yang timbul dari penggunaan layanan kami.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">7. Pengakhiran</h2>
            <p className="text-muted-foreground mb-4">
              Kami berhak untuk mengakhiri atau menangguhkan akun Anda jika melanggar ketentuan ini. 
              Anda dapat mengakhiri akun kapan saja dengan menghubungi support.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">8. Perubahan Ketentuan</h2>
            <p className="text-muted-foreground mb-4">
              Kami dapat mengubah ketentuan ini sewaktu-waktu. Perubahan akan diberitahukan melalui email 
              atau notifikasi di aplikasi.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">9. Hukum yang Berlaku</h2>
            <p className="text-muted-foreground mb-4">
              Ketentuan ini diatur oleh hukum Republik Indonesia. Sengketa akan diselesaikan melalui 
              pengadilan yang berwenang di Jakarta.
            </p>

            <div className="mt-8 flex justify-center">
              <Button asChild>
                <Link href="/">Kembali ke Beranda</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
