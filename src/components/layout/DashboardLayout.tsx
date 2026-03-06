'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Gift,
  Trophy,
  Settings,
  QrCode,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DashboardLayoutProps {
  children: ReactNode;
  eventId?: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const getNavItems = (eventId: string) => [
  { title: 'Overview', href: `/event/${eventId}`, icon: LayoutDashboard },
  { title: 'Peserta', href: `/event/${eventId}/participants`, icon: Users },
  { title: 'Hadiah', href: `/event/${eventId}/prizes`, icon: Gift },
  { title: 'Undian', href: `/event/${eventId}/draw`, icon: Trophy },
  { title: 'Check-in', href: `/event/${eventId}/checkin`, icon: QrCode },
  { title: 'Pembayaran', href: `/event/${eventId}/payments`, icon: CreditCard },
  { title: 'Pengaturan', href: `/event/${eventId}/settings`, icon: Settings },
];

export function DashboardLayout({ children, eventId, user }: DashboardLayoutProps) {
  const pathname = usePathname();
  const navItems = eventId ? getNavItems(eventId) : [];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        <div className="h-16 flex items-center px-4 border-b">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Calendar className="h-6 w-6 text-primary" />
            <span>Prize Party</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.image || ''} />
              <AvatarFallback>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-background/95 backdrop-blur flex items-center justify-between px-4 md:px-6">
          <div className="md:hidden">
            <Link href="/" className="font-bold text-lg">
              Prize Party
            </Link>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <ThemeToggle />
            <Button variant="outline" size="sm">
              Event ID: {eventId || 'N/A'}
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
