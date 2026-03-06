'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="container max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle className="text-3xl">Kebijakan Privasi</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p className="text-muted-foreground mb-4">
              Terakhir diperbarui: Januari 2025
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">1. Informasi yang Kami Kumpulkan</h2>
            <p className="text-muted-foreground mb-4">
              Kami mengumpulkan informasi yang Anda berikan secara langsung, seperti nama, email, nomor telepon, 
              dan informasi lain saat mendaftar atau menggunakan layanan kami.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">2. Penggunaan Informasi</h2>
            <p className="text-muted-foreground mb-4">
              Informasi yang kami kumpulkan digunakan untuk:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Menyediakan dan mengelola layanan Eventku</li>
              <li>Mengirim notifikasi terkait event dan akun Anda</li>
              <li>Meningkatkan pengalaman pengguna</li>
              <li>Keperluan analitik dan penelitian</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">3. Keamanan Data</h2>
            <p className="text-muted-foreground mb-4">
              Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi informasi pribadi Anda 
              dari akses yang tidak sah, perubahan, pengungkapan, atau penghancuran.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">4. Berbagi Informasi</h2>
            <p className="text-muted-foreground mb-4">
              Kami tidak menjual, memperdagangkan, atau mentransfer informasi pribadi Anda kepada pihak ketiga 
              tanpa persetujuan Anda, kecuali diwajibkan oleh hukum.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">5. Hak Pengguna</h2>
            <p className="text-muted-foreground mb-4">
              Anda berhak untuk mengakses, memperbarui, atau menghapus informasi pribadi Anda. 
              Hubungi kami untuk permintaan terkait data pribadi.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">6. Perubahan Kebijakan</h2>
            <p className="text-muted-foreground mb-4">
              Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan akan diberitahukan 
              melalui email atau notifikasi di aplikasi.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">7. Hubungi Kami</h2>
            <p className="text-muted-foreground mb-4">
              Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami di:
            </p>
            <p className="text-muted-foreground mb-4">
              Email: privacy@eventku.com
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
