'use client';

import { useState } from 'react';
import { Gift, MoreVertical, Edit, Trash2, ImageIcon, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

interface PrizeCardProps {
  prize: {
    id: string;
    name: string;
    description?: string;
    quantity: number;
    remaining: number;
    image?: string;
    category?: string;
    value?: number;
    sponsor?: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onImageUpload?: () => void;
  showActions?: boolean;
}

export function PrizeCard({
  prize,
  onEdit,
  onDelete,
  onImageUpload,
  showActions = true,
}: PrizeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isDepleted = prize.remaining === 0;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200',
        'hover:shadow-lg hover:border-primary/20',
        isDepleted && 'opacity-60'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Prize image */}
      <div className="relative h-40 bg-gradient-to-br from-primary/10 to-primary/5">
        {prize.image ? (
          <img
            src={prize.image}
            alt={`Hadiah: ${prize.name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Gift className="h-16 w-16 text-primary/20" />
          </div>
        )}

        {/* Category badge */}
        {prize.category && (
          <Badge className="absolute top-3 left-3" variant="secondary">
            {prize.category}
          </Badge>
        )}

        {/* Depleted overlay */}
        {isDepleted && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Badge variant="destructive">Habis</Badge>
          </div>
        )}

        {/* Image upload button */}
        {isHovered && onImageUpload && !prize.image && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-3 right-3"
            onClick={onImageUpload}
          >
            <ImageIcon className="h-4 w-4 mr-1" />
            Upload
          </Button>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold line-clamp-1">{prize.name}</h3>
            {prize.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {prize.description}
              </p>
            )}
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {onImageUpload && (
                  <DropdownMenuItem onClick={onImageUpload}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Upload Gambar
                  </DropdownMenuItem>
                )}
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
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              <span>{prize.remaining}/{prize.quantity}</span>
            </div>
            {prize.value && (
              <span className="font-medium text-foreground">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(prize.value)}
              </span>
            )}
          </div>

          {prize.sponsor && (
            <Badge variant="outline" className="text-xs">
              {prize.sponsor}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
