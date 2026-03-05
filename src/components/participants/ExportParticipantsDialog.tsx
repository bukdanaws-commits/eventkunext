'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ExportColumn {
  key: string;
  label: string;
  defaultChecked?: boolean;
}

interface ExportParticipantsDialogProps {
  eventId: string;
  participantCount: number;
  columns?: ExportColumn[];
}

const defaultColumns: ExportColumn[] = [
  { key: 'name', label: 'Nama', defaultChecked: true },
  { key: 'email', label: 'Email', defaultChecked: true },
  { key: 'phone', label: 'Telepon', defaultChecked: true },
  { key: 'ticketNumber', label: 'Nomor Tiket', defaultChecked: true },
  { key: 'tier', label: 'Tipe Tiket', defaultChecked: true },
  { key: 'checkedIn', label: 'Status Check-in', defaultChecked: true },
  { key: 'checkedInAt', label: 'Waktu Check-in', defaultChecked: false },
  { key: 'createdAt', label: 'Tanggal Daftar', defaultChecked: false },
];

export function ExportParticipantsDialog({
  eventId,
  participantCount,
  columns = defaultColumns,
}: ExportParticipantsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.filter((c) => c.defaultChecked).map((c) => c.key)
  );
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
    );
  };

  const selectAll = () => {
    setSelectedColumns(columns.map((c) => c.key));
  };

  const deselectAll = () => {
    setSelectedColumns([]);
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast.error('Pilih minimal satu kolom');
      return;
    }

    setIsExporting(true);

    try {
      // Simulasi export
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate CSV content
      const headers = columns
        .filter((c) => selectedColumns.includes(c.key))
        .map((c) => c.label);
      const csvContent = [headers.join(',')].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participants-${eventId}.${exportFormat}`;
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
          Export Peserta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Peserta</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info */}
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-sm">
              <span className="font-medium">{participantCount}</span> peserta akan diekspor
            </p>
          </div>

          {/* Format selection */}
          <div className="space-y-3">
            <Label className="text-base">Format Export</Label>
            <div className="flex gap-2">
              <Button
                variant={exportFormat === 'csv' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExportFormat('csv')}
                className="flex-1"
              >
                <FileText className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button
                variant={exportFormat === 'xlsx' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExportFormat('xlsx')}
                className="flex-1"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
            </div>
          </div>

          {/* Column selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Kolom</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Pilih Semua
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  Hapus Pilihan
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {columns.map((column) => (
                <div
                  key={column.key}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                  onClick={() => toggleColumn(column.key)}
                >
                  <Checkbox
                    id={column.key}
                    checked={selectedColumns.includes(column.key)}
                    onCheckedChange={() => toggleColumn(column.key)}
                  />
                  <Label htmlFor={column.key} className="cursor-pointer">
                    {column.label}
                  </Label>
                </div>
              ))}
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
              disabled={isExporting || selectedColumns.length === 0}
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
