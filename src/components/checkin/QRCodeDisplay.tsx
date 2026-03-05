'use client';

import { useState } from 'react';
import { QrCode, Download, Share2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QRCodeDisplayProps {
  value: string;
  participantName?: string;
  eventName?: string;
  size?: number;
  downloadable?: boolean;
  shareable?: boolean;
}

export function QRCodeDisplay({
  value,
  participantName,
  eventName,
  size = 200,
  downloadable = true,
  shareable = true,
}: QRCodeDisplayProps) {
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Generate QR code URL using a QR code API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
  const qrCodeLargeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(value)}`;

  const handleDownload = async () => {
    try {
      const response = await fetch(qrCodeLargeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${participantName || 'ticket'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download QR code:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Code - ${participantName}`,
          text: `QR Code untuk ${eventName}`,
          url: qrCodeLargeUrl,
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-4 w-4" />
            QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* QR Code image */}
          <div
            className="flex justify-center cursor-pointer"
            onClick={() => setShowFullscreen(true)}
          >
            <div className="p-4 bg-white rounded-lg shadow-inner">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="mx-auto"
                width={size}
                height={size}
              />
            </div>
          </div>

          {/* Info */}
          {participantName && (
            <div className="text-center">
              <p className="font-medium">{participantName}</p>
              {eventName && (
                <p className="text-sm text-muted-foreground">{eventName}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {downloadable && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
            {shareable && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleShare}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="p-6 bg-white rounded-lg shadow-inner">
              <img
                src={qrCodeLargeUrl}
                alt="QR Code"
                className="mx-auto"
                width={300}
                height={300}
              />
            </div>
            {participantName && (
              <div className="text-center">
                <p className="font-semibold text-lg">{participantName}</p>
                {eventName && (
                  <p className="text-muted-foreground">{eventName}</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
