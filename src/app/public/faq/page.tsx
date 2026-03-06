'use client';

import { useState, useMemo } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const faqs = [
  // Umum
  {
    category: 'Umum',
    question: 'Apa yang membedakan Eventku dengan tools event lainnya?',
    answer: 'Eventku dirancang khusus untuk kebutuhan Event Organizer (EO) Indonesia. Tidak hanya fokus ke penjualan tiket, Eventku mencakup operasional event secara menyeluruh: manajemen peserta, check-in, doorprize, hingga laporan pasca acara.',
  },
  {
    category: 'Umum',
    question: 'Kenapa tidak pakai spreadsheet atau tools gratis saja?',
    answer: 'Spreadsheet cocok untuk event kecil, tapi tidak scalable dan rawan error. Eventku menyediakan data terpusat & real-time, akses multi-user dengan role, minim human error, dan laporan otomatis. Sehingga EO bisa fokus ke eksekusi event, bukan administrasi.',
  },
  {
    category: 'Umum',
    question: 'Apakah Eventku cocok untuk event skala kecil?',
    answer: 'Ya. Eventku fleksibel dan bisa digunakan untuk event kecil hingga besar. EO bisa mulai dari kebutuhan dasar, lalu berkembang seiring skala event meningkat.',
  },
  {
    category: 'Umum',
    question: 'Apakah Eventku bisa menangani ribuan peserta?',
    answer: 'Bisa. Eventku dibangun dengan arsitektur modern dan scalable, sehingga siap menangani ribuan hingga puluhan ribu peserta dengan performa tetap stabil.',
  },
  {
    category: 'Umum',
    question: 'Apakah Eventku aman untuk data peserta?',
    answer: 'Keamanan data adalah prioritas. Eventku menggunakan database terstruktur, kontrol akses berbasis role, dan infrastruktur cloud modern. Data peserta dikelola secara profesional dan bertanggung jawab.',
  },
  {
    category: 'Umum',
    question: 'Apakah perlu tim IT untuk menggunakan Eventku?',
    answer: 'Tidak. Eventku dirancang agar mudah digunakan oleh tim non-teknis. Dashboard intuitif dan alur kerja dibuat sesuai kebiasaan EO di lapangan.',
  },
  {
    category: 'Umum',
    question: 'Apakah Eventku bisa digunakan tanpa website sendiri?',
    answer: 'Bisa. Eventku berbasis web dan siap digunakan langsung tanpa perlu setup teknis yang rumit.',
  },
  {
    category: 'Umum',
    question: 'Apakah Eventku mendukung doorprize dan undian digital?',
    answer: 'Ya. Eventku menyediakan sistem undian digital yang transparan dan adil, cocok untuk event dengan peserta besar. Tersedia 4 pilihan animasi: Spin Wheel, Slot Machine, Card Reveal, dan Random Number.',
  },
  {
    category: 'Umum',
    question: 'Siapa yang paling cocok menggunakan Eventku?',
    answer: 'Eventku cocok untuk Event Organizer (EO), perusahaan, komunitas, kampus & institusi, serta penyelenggara seminar, workshop, konser, dan pameran.',
  },
  {
    category: 'Umum',
    question: 'Kenapa harus memilih Eventku?',
    answer: 'Karena Eventku bukan sekadar aplikasi, tapi partner digital untuk membantu event berjalan lebih rapi, profesional, dan berdampak.',
  },
  // Pembayaran & Pricing
  {
    category: 'Pembayaran & Pricing',
    question: 'Berapa biaya menggunakan Eventku?',
    answer: 'Eventku menyediakan beberapa paket: Free (gratis dengan fitur terbatas), Basic, Pro, dan Enterprise. Setiap paket memiliki batasan jumlah peserta dan hadiah yang berbeda. Anda bisa melihat detail harga di halaman Pricing.',
  },
  {
    category: 'Pembayaran & Pricing',
    question: 'Apakah ada paket gratis?',
    answer: 'Ya! Eventku menyediakan paket Free yang bisa digunakan tanpa biaya. Paket ini cocok untuk event kecil dengan jumlah peserta dan hadiah terbatas. Anda bisa upgrade kapan saja jika membutuhkan fitur lebih.',
  },
  {
    category: 'Pembayaran & Pricing',
    question: 'Metode pembayaran apa saja yang diterima?',
    answer: 'Eventku menerima berbagai metode pembayaran melalui Midtrans, termasuk transfer bank (BCA, Mandiri, BNI, BRI, dll), e-wallet (GoPay, OVO, DANA, ShopeePay), kartu kredit/debit, dan virtual account.',
  },
  {
    category: 'Pembayaran & Pricing',
    question: 'Apakah pembayaran per event atau berlangganan?',
    answer: 'Pembayaran Eventku bersifat per event. Setiap kali Anda membuat event baru, Anda bisa memilih paket yang sesuai dengan kebutuhan event tersebut. Tidak ada biaya berlangganan bulanan.',
  },
  {
    category: 'Pembayaran & Pricing',
    question: 'Bagaimana jika saya ingin upgrade paket di tengah event?',
    answer: 'Anda bisa melakukan upgrade paket kapan saja selama event masih berlangsung. Sistem akan menghitung selisih harga antara paket lama dan baru. Upgrade akan aktif segera setelah pembayaran berhasil.',
  },
  {
    category: 'Pembayaran & Pricing',
    question: 'Apakah ada biaya tambahan tersembunyi?',
    answer: 'Tidak ada biaya tersembunyi. Harga yang tertera sudah termasuk semua fitur dalam paket tersebut. Biaya tambahan hanya ada jika Anda membeli add-on seperti Form Builder.',
  },
  {
    category: 'Pembayaran & Pricing',
    question: 'Apa itu Form Builder Add-on?',
    answer: 'Form Builder adalah fitur tambahan yang memungkinkan Anda membuat formulir pendaftaran custom untuk peserta. Fitur ini tersedia sebagai add-on terpisah yang bisa dibeli bersamaan dengan paket apapun.',
  },
  {
    category: 'Pembayaran & Pricing',
    question: 'Apakah pembayaran bisa dikembalikan (refund)?',
    answer: 'Pembayaran yang sudah dilakukan tidak dapat dikembalikan. Pastikan Anda memilih paket yang sesuai dengan kebutuhan event Anda. Jika ragu, mulailah dengan paket Free atau Basic terlebih dahulu.',
  },
  {
    category: 'Pembayaran & Pricing',
    question: 'Berapa lama waktu aktivasi setelah pembayaran?',
    answer: 'Aktivasi paket dilakukan secara otomatis segera setelah pembayaran dikonfirmasi. Untuk transfer bank manual, proses verifikasi biasanya memakan waktu 1-15 menit.',
  },
  {
    category: 'Pembayaran & Pricing',
    question: 'Apakah ada diskon untuk event besar atau berulang?',
    answer: 'Ya! Eventku menyediakan program referral yang memberikan diskon untuk setiap referensi berhasil. Untuk event besar atau kebutuhan khusus, silakan hubungi tim kami untuk penawaran Enterprise.',
  },
  // Fitur Teknis
  {
    category: 'Fitur Teknis',
    question: 'Bagaimana cara kerja sistem check-in QR Code?',
    answer: 'Setiap peserta yang terdaftar akan mendapatkan QR Code unik. Pada hari event, panitia cukup scan QR Code menggunakan smartphone atau tablet. Status kehadiran akan terupdate secara real-time di dashboard.',
  },
  {
    category: 'Fitur Teknis',
    question: 'Apakah check-in bisa dilakukan offline?',
    answer: 'Check-in membutuhkan koneksi internet untuk update data real-time. Namun, sistem dirancang untuk bekerja dengan koneksi minimal. Pastikan ada koneksi internet yang stabil di lokasi event.',
  },
  {
    category: 'Fitur Teknis',
    question: 'Berapa jenis animasi undian yang tersedia?',
    answer: 'Eventku menyediakan 4 jenis animasi undian: Spin Wheel (roda putar), Slot Machine (mesin slot), Card Reveal (buka kartu), dan Random Number (angka acak). Semua animasi bisa ditampilkan di layar besar untuk pengalaman yang lebih menarik.',
  },
  {
    category: 'Fitur Teknis',
    question: 'Apakah sistem undian benar-benar acak dan adil?',
    answer: 'Ya! Sistem undian Eventku menggunakan algoritma random yang teruji. Setiap peserta yang eligible memiliki peluang yang sama untuk menang. Hasil undian juga tercatat di sistem untuk transparansi.',
  },
  {
    category: 'Fitur Teknis',
    question: 'Bisakah peserta yang sudah menang diundi lagi?',
    answer: 'Secara default, peserta yang sudah menang akan dikeluarkan dari pool undian berikutnya. Ini memastikan hadiah terdistribusi merata kepada peserta yang berbeda.',
  },
  {
    category: 'Fitur Teknis',
    question: 'Apakah bisa melakukan undian untuk kategori hadiah tertentu?',
    answer: 'Ya! Anda bisa mengatur hadiah dalam kategori: Hiburan, Utama, dan Grand Prize. Setiap kategori bisa diundi secara terpisah sesuai urutan yang Anda inginkan.',
  },
  {
    category: 'Fitur Teknis',
    question: 'Bagaimana cara mengirim notifikasi ke peserta?',
    answer: 'Eventku mendukung notifikasi email otomatis. Peserta bisa menerima email berisi QR Code setelah registrasi, dan pemenang undian juga bisa dikirimkan email notifikasi secara otomatis.',
  },
  {
    category: 'Fitur Teknis',
    question: 'Apakah bisa mengirim QR Code ke semua peserta sekaligus?',
    answer: 'Ya! Fitur Bulk Send QR memungkinkan Anda mengirim email QR Code ke banyak peserta sekaligus. Anda bisa memilih peserta tertentu atau semua peserta yang belum menerima email.',
  },
  {
    category: 'Fitur Teknis',
    question: 'Apakah ada fitur public viewer untuk menampilkan di layar?',
    answer: 'Ya! Eventku menyediakan Public Viewer yang bisa ditampilkan di layar besar saat event. Tampilan ini menunjukkan proses undian dan pemenang secara real-time tanpa perlu login.',
  },
  {
    category: 'Fitur Teknis',
    question: 'Bagaimana cara membuat formulir pendaftaran custom?',
    answer: 'Dengan Form Builder Add-on, Anda bisa membuat formulir dengan berbagai jenis field: text, email, phone, dropdown, checkbox, dan lainnya. Field bisa dimapping ke data peserta secara otomatis.',
  },
  {
    category: 'Fitur Teknis',
    question: 'Apakah data peserta bisa diexport?',
    answer: 'Ya! Semua data peserta, kehadiran, dan pemenang bisa diexport ke format Excel/CSV. Ini memudahkan untuk dokumentasi dan pelaporan pasca event.',
  },
  {
    category: 'Fitur Teknis',
    question: 'Apakah Eventku bisa diakses dari mobile?',
    answer: 'Ya! Eventku adalah web app yang responsive, sehingga bisa diakses dari browser smartphone, tablet, maupun desktop. Tidak perlu install aplikasi tambahan.',
  },
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    
    const query = searchQuery.toLowerCase();
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const categories = ['Umum', 'Pembayaran & Pricing', 'Fitur Teknis'];

  const getCategoryFaqs = (category: string) => {
    return filteredFaqs.filter((faq) => faq.category === category);
  };

  const hasResults = filteredFaqs.length > 0;

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Pertanyaan yang <span className="text-primary">Sering Diajukan</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Temukan jawaban untuk pertanyaan umum tentang Eventku. 
          Jika tidak menemukan yang Anda cari, jangan ragu untuk menghubungi kami.
        </p>

        {/* Search Bar */}
        <div className="mt-8 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari pertanyaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-muted-foreground">
              {hasResults 
                ? `Ditemukan ${filteredFaqs.length} hasil untuk "${searchQuery}"`
                : `Tidak ada hasil untuk "${searchQuery}"`
              }
            </p>
          )}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-3xl mx-auto space-y-8">
          {hasResults ? (
            categories.map((category) => {
              const categoryFaqs = getCategoryFaqs(category);
              if (categoryFaqs.length === 0) return null;

              return (
                <div key={category}>
                  <h2 className="text-2xl font-bold mb-4">
                    {category === 'Umum' ? 'Pertanyaan Umum' : category}
                  </h2>
                  <Accordion type="single" collapsible className="space-y-3">
                    {categoryFaqs.map((faq, index) => (
                      <AccordionItem 
                        key={`${category}-${index}`} 
                        value={`${category}-${index}`}
                        className="border rounded-lg px-6"
                      >
                        <AccordionTrigger className="text-left hover:no-underline">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Tidak ada pertanyaan yang cocok dengan pencarian Anda.
              </p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-4 text-primary hover:underline"
              >
                Tampilkan semua pertanyaan
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Masih punya pertanyaan?</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Tim kami siap membantu menjawab pertanyaan Anda. 
            Hubungi kami dan kami akan merespons secepatnya.
          </p>
          <div className="mt-8">
            <a href="/contact">
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                Hubungi Kami
              </button>
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
