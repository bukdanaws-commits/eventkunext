'use client';

import { useState } from 'react';
import { Mail, Send, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface SendEmailDialogProps {
  winners: Array<{
    id: string;
    name: string;
    email: string;
    prize: string;
  }>;
  eventName: string;
}

export function SendEmailDialog({ winners, eventName }: SendEmailDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [emailData, setEmailData] = useState({
    subject: `Selamat! Anda adalah pemenang ${eventName}`,
    message: `Selamat! Anda telah memenangkan hadiah dalam event ${eventName}. Silakan hubungi panitia untuk informasi lebih lanjut.`,
  });

  const handleSendEmails = async () => {
    setIsSending(true);
    setSentCount(0);

    try {
      // Simulasi pengiriman email satu per satu
      for (let i = 0; i < winners.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setSentCount(i + 1);
      }

      toast.success(`${winners.length} email berhasil dikirim!`);
      setOpen(false);
    } catch (error) {
      toast.error('Gagal mengirim email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Mail className="mr-2 h-4 w-4" />
          Kirim Email ke Pemenang
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Kirim Email ke Pemenang</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Winners list */}
          <div className="space-y-2">
            <Label>Penerima ({winners.length} pemenang)</Label>
            <div className="max-h-32 overflow-y-auto space-y-1 p-2 rounded border">
              {winners.map((winner) => (
                <div
                  key={winner.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{winner.name}</span>
                  <Badge variant="outline">{winner.prize}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Email form */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subjek</Label>
            <Input
              id="subject"
              value={emailData.subject}
              onChange={(e) =>
                setEmailData((prev) => ({ ...prev, subject: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Pesan</Label>
            <Textarea
              id="message"
              rows={4}
              value={emailData.message}
              onChange={(e) =>
                setEmailData((prev) => ({ ...prev, message: e.target.value }))
              }
            />
          </div>

          {/* Progress */}
          {isSending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Mengirim email...</span>
                <span>
                  {sentCount}/{winners.length}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${(sentCount / winners.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={isSending}
            >
              Batal
            </Button>
            <Button
              className="flex-1"
              onClick={handleSendEmails}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Kirim Email
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
