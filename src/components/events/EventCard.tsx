'use client';

import { useState } from 'react';
import { Calendar, MapPin, Users, Clock, MoreVertical, Edit, Trash2, Eye, QrCode } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface EventCardProps {
  event: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    date: string;
    time?: string;
    location?: string;
    status: 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    participantCount: number;
    maxParticipants?: number;
    coverImage?: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-500' },
  upcoming: { label: 'Akan Datang', color: 'bg-blue-500' },
  ongoing: { label: 'Sedang Berlangsung', color: 'bg-green-500' },
  completed: { label: 'Selesai', color: 'bg-emerald-600' },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-500' },
};

export function EventCard({
  event,
  onEdit,
  onDelete,
  onDuplicate,
}: EventCardProps) {
  const [showQR, setShowQR] = useState(false);
  const status = statusConfig[event.status];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const capacityPercentage = event.maxParticipants
    ? Math.min((event.participantCount / event.maxParticipants) * 100, 100)
    : 0;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200">
      {/* Cover image */}
      <div className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="h-12 w-12 text-primary/30" />
          </div>
        )}
        
        {/* Status badge */}
        <Badge
          className={cn('absolute top-3 right-3', status.color)}
        >
          {status.label}
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1">
              <Link
                href={`/event/${event.id}`}
                className="hover:text-primary transition-colors"
              >
                {event.name}
              </Link>
            </CardTitle>
            <CardDescription className="line-clamp-1">
              /{event.slug}
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/event/${event.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Lihat Detail
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <QrCode className="mr-2 h-4 w-4" />
                Duplikat
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Date & Time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(event.date)}</span>
          {event.time && (
            <>
              <span>•</span>
              <Clock className="h-4 w-4" />
              <span>{event.time}</span>
            </>
          )}
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {/* Participants */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
                {event.participantCount}
                {event.maxParticipants && ` / ${event.maxParticipants}`} peserta
              </span>
            </div>
            {event.maxParticipants && (
              <span className="text-muted-foreground">
                {capacityPercentage.toFixed(0)}%
              </span>
            )}
          </div>
          {event.maxParticipants && (
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  capacityPercentage >= 90
                    ? 'bg-red-500'
                    : capacityPercentage >= 70
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                )}
                style={{ width: `${capacityPercentage}%` }}
              />
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button asChild className="w-full" variant="outline">
          <Link href={`/event/${event.id}`}>
            Kelola Event
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
