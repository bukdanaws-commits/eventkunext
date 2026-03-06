'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Gift,
  Trophy,
  QrCode,
  Settings,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventSidebarProps {
  event?: {
    id: string;
    name: string;
    slug?: string;
    status?: string;
  };
  basePath: string;
  pathname: string;
  collapsed?: boolean;
  onItemClick?: () => void;
}

const navItems = [
  { title: 'Overview', href: '', icon: LayoutDashboard },
  { title: 'Peserta', href: '/participants', icon: Users },
  { title: 'Hadiah', href: '/prizes', icon: Gift },
  { title: 'Undian', href: '/draw', icon: Trophy },
  { title: 'Check-in', href: '/checkin', icon: QrCode },
  { title: 'Form Builder', href: '/form', icon: FileText },
  { title: 'Pengaturan', href: '/settings', icon: Settings },
];

export function EventSidebar({
  event,
  basePath,
  pathname,
  collapsed = false,
  onItemClick,
}: EventSidebarProps) {
  return (
    <div className="p-4 space-y-6">
      {/* Event info */}
      {event && !collapsed && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Event Aktif
          </p>
          <p className="font-medium truncate">{event.name}</p>
          {event.slug && (
            <p className="text-xs text-muted-foreground truncate">
              /{event.slug}
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const href = basePath + item.href;
          const isActive = item.href
            ? pathname === href || pathname.startsWith(`${href}/`)
            : pathname === basePath;

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center'
              )}
              onClick={onItemClick}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
