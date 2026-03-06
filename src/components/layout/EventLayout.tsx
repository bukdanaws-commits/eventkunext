'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Gift,
  Trophy,
  QrCode,
  Settings,
  Menu,
  X,
  ChevronLeft,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeToggle } from '@/components/ThemeToggle';
import { EventSidebar } from './EventSidebar';

interface EventLayoutProps {
  children: ReactNode;
  event?: {
    id: string;
    name: string;
    slug?: string;
    status?: string;
  };
}

const navItems = [
  { title: 'Overview', href: '', icon: LayoutDashboard },
  { title: 'Peserta', href: '/participants', icon: Users },
  { title: 'Hadiah', href: '/prizes', icon: Gift },
  { title: 'Undian', href: '/draw', icon: Trophy },
  { title: 'Check-in', href: '/checkin', icon: QrCode },
  { title: 'Pengaturan', href: '/settings', icon: Settings },
];

export function EventLayout({ children, event }: EventLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const basePath = event ? `/event/${event.id}` : '/event';

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <Link href="/" className="font-bold text-lg">
            Prize Party
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <EventSidebar
            event={event}
            basePath={basePath}
            pathname={pathname}
            onItemClick={() => setMobileMenuOpen(false)}
          />
        </ScrollArea>
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:fixed top-0 left-0 h-full bg-card border-r transition-all duration-200 z-30',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {sidebarOpen && (
            <Link href="/" className="font-bold text-lg">
              Prize Party
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(!sidebarOpen && 'mx-auto')}
          >
            <ChevronLeft
              className={cn(
                'h-5 w-5 transition-transform',
                !sidebarOpen && 'rotate-180'
              )}
            />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <EventSidebar
            event={event}
            basePath={basePath}
            pathname={pathname}
            collapsed={!sidebarOpen}
          />
        </ScrollArea>
      </aside>

      {/* Main content */}
      <div
        className={cn(
          'transition-all duration-200',
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-16'
        )}
      >
        {/* Header */}
        <header className="h-16 border-b bg-background/95 backdrop-blur flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold">{event?.name || 'Event'}</h1>
              {event?.status && (
                <span className="text-xs text-muted-foreground">
                  Status: {event.status}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/">
              <Button variant="outline" size="sm">
                Kembali ke Dashboard
              </Button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
