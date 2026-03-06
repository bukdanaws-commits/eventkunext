'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, X, Check, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface Participant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  ticketNumber: string;
  checkedIn: boolean;
  checkedInAt?: string;
  tier?: string;
}

interface ParticipantSearchProps {
  participants: Participant[];
  onCheckIn?: (participantId: string) => void;
  onSelect?: (participant: Participant) => void;
}

export function ParticipantSearch({
  participants,
  onCheckIn,
  onSelect,
}: ParticipantSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked-in' | 'not-checked-in'>('all');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchesSearch =
        !debouncedSearch ||
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.ticketNumber.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'checked-in' && p.checkedIn) ||
        (statusFilter === 'not-checked-in' && !p.checkedIn);

      return matchesSearch && matchesStatus;
    });
  }, [participants, debouncedSearch, statusFilter]);

  const handleParticipantClick = (participant: Participant) => {
    setSelectedParticipant(participant);
    onSelect?.(participant);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Cari Peserta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, email, atau nomor tiket..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filters */}
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger>
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="checked-in">Sudah Check-in</SelectItem>
            <SelectItem value="not-checked-in">Belum Check-in</SelectItem>
          </SelectContent>
        </Select>

        {/* Results count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {filteredParticipants.length} peserta ditemukan
          </span>
        </div>

        {/* Participant list */}
        <ScrollArea className="h-[400px] -mx-6">
          <div className="px-6 space-y-2">
            {filteredParticipants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada peserta ditemukan
              </div>
            ) : (
              filteredParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                    'hover:bg-muted',
                    selectedParticipant?.id === participant.id && 'bg-muted'
                  )}
                  onClick={() => handleParticipantClick(participant)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {participant.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{participant.name}</p>
                      {participant.tier && (
                        <Badge variant="outline" className="text-xs">
                          {participant.tier}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {participant.ticketNumber} • {participant.email}
                    </p>
                  </div>

                  <div>
                    {participant.checkedIn ? (
                      <Badge variant="default" className="bg-green-500">
                        <Check className="h-3 w-3 mr-1" />
                        Check-in
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Belum
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Selected participant actions */}
        {selectedParticipant && !selectedParticipant.checkedIn && onCheckIn && (
          <div className="pt-4 border-t">
            <Button
              className="w-full"
              onClick={() => onCheckIn(selectedParticipant.id)}
            >
              <Check className="mr-2 h-4 w-4" />
              Check-in {selectedParticipant.name}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
