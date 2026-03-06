'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DeleteEventDialogProps {
  eventId: string;
  eventName: string;
  trigger?: React.ReactNode;
  onDelete?: () => void;
}

export function DeleteEventDialog({
  eventId,
  eventName,
  trigger,
  onDelete,
}: DeleteEventDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      // Simulasi API call
      // await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      
      console.log('Deleting event:', eventId);
      
      toast.success('Event berhasil dihapus');
      setOpen(false);
      onDelete?.();
    } catch (error) {
      toast.error('Gagal menghapus event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle>Hapus Event?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-4">
            Anda akan menghapus event <strong>&quot;{eventName}&quot;</strong>. 
            Tindakan ini tidak dapat dibatalkan. Semua data termasuk peserta, 
            hadiah, dan pemenang akan dihapus secara permanen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Ya, Hapus Event
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
