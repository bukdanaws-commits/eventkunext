'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Winner {
  id: string;
  name: string;
  email: string;
  prize: string;
  drawnAt: string;
}

interface WinnersExportProps {
  winners: Winner[];
  eventName: string;
}

export function WinnersExport({ winners, eventName }: WinnersExportProps) {
  const [open, setOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Generate content based on format
      let content = '';
      let mimeType = 'text/csv';
      let extension = 'csv';

      if (exportFormat === 'csv') {
        const headers = ['Nama', 'Email', 'Hadiah', 'Waktu Undian'];
        const rows = winners.map((w) => [
          w.name,
          w.email,
          w.prize,
          new Date(w.drawnAt).toLocaleString('id-ID'),
        ]);
        content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      }

      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `winners-${eventName.replace(/\s+/g, '-')}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Export berhasil!');
      setOpen(false);
    } catch (error) {
      toast.error('Gagal mengekspor data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Pemenang
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Daftar Pemenang</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Winners count */}
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-sm">
              <span className="font-medium">{winners.length}</span> pemenang akan diekspor
            </p>
          </div>

          {/* Format selection */}
          <div className="space-y-3">
            <Label className="text-base">Format Export</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={exportFormat === 'csv' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExportFormat('csv')}
              >
                <FileText className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button
                variant={exportFormat === 'xlsx' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExportFormat('xlsx')}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button
                variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExportFormat('pdf')}
              >
                PDF
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-base">Preview</Label>
            <div className="max-h-40 overflow-y-auto space-y-1 p-2 rounded border">
              {winners.slice(0, 5).map((winner) => (
                <div
                  key={winner.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{winner.name}</span>
                  <span className="text-muted-foreground">{winner.prize}</span>
                </div>
              ))}
              {winners.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  ...dan {winners.length - 5} lainnya
                </p>
              )}
            </div>
          </div>

          {/* Export button */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button
              className="flex-1"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                'Mengexport...'
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
