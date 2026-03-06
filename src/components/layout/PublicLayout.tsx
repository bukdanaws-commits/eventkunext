'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Gift, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Gift className="h-6 w-6 text-primary" />
            <span>Prize Party</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Fitur
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Harga
            </Link>
            <Link
              href="/about"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Tentang
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden md:flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Masuk
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Daftar</Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <nav className="container py-4 flex flex-col gap-4">
              <Link
                href="/features"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Fitur
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Harga
              </Link>
              <Link
                href="/about"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tentang
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t">
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Masuk
                  </Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Daftar</Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container py-8 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 font-bold">
                <Gift className="h-5 w-5 text-primary" />
                <span>Prize Party</span>
              </Link>
              <p className="mt-2 text-sm text-muted-foreground">
                Platform undian dan manajemen event terbaik untuk acara Anda.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Produk</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><Link href="/features">Fitur</Link></li>
                <li><Link href="/pricing">Harga</Link></li>
                <li><Link href="/integrations">Integrasi</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Perusahaan</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><Link href="/about">Tentang</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/careers">Karir</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Dukungan</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><Link href="/help">Pusat Bantuan</Link></li>
                <li><Link href="/contact">Kontak</Link></li>
                <li><Link href="/privacy">Privasi</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Prize Party. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
