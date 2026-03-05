'use client';

import { useState } from 'react';
import { Plus, Calendar, Users, Gift, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface QuickAction {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color?: string;
}

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const quickActions: QuickAction[] = [
    {
      icon: Calendar,
      label: 'Buat Event',
      onClick: () => router.push('/dashboard'),
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      icon: Users,
      label: 'Peserta',
      onClick: () => router.push('/dashboard/participants'),
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      icon: Gift,
      label: 'Referral',
      onClick: () => router.push('/dashboard/referral'),
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      icon: Settings,
      label: 'Pengaturan',
      onClick: () => router.push('/dashboard/settings'),
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-center gap-3">
      {/* Quick action buttons */}
      {quickActions.map((action, index) => (
        <Tooltip key={action.label}>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className={cn(
                'h-12 w-12 rounded-full shadow-lg transition-all duration-300 text-white',
                action.color,
                isOpen
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-0 translate-y-4 pointer-events-none'
              )}
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
              }}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
            >
              <action.icon className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{action.label}</p>
          </TooltipContent>
        </Tooltip>
      ))}

      {/* Main FAB button */}
      <Button
        size="icon"
        className={cn(
          'h-14 w-14 rounded-full shadow-xl relative',
          'bg-primary hover:bg-primary/90',
          'hover:shadow-[0_0_25px_hsl(var(--primary)/0.6)]'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Plus
          className={cn(
            'h-6 w-6 transition-transform duration-300',
            isOpen && 'rotate-45'
          )}
        />
      </Button>
    </div>
  );
}
