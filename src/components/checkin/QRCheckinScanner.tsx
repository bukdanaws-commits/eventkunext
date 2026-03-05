'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { QrCode, Camera, SwitchCamera, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface QRCheckinScannerProps {
  eventId: string;
  onScanSuccess?: (participantId: string) => void;
  onScanError?: (error: string) => void;
}

export function QRCheckinScanner({
  eventId,
  onScanSuccess,
  onScanError,
}: QRCheckinScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopScanning = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing },
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
      }
    } catch (error) {
      toast.error('Tidak dapat mengakses kamera');
      onScanError?.('Camera access denied');
    }
  }, [cameraFacing, onScanError]);

  const toggleCamera = () => {
    stopScanning();
    setCameraFacing((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Start scanning when cameraFacing changes and was scanning
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const simulateScan = () => {
    // Simulasi QR scan berhasil
    const mockParticipantId = `participant-${Date.now()}`;
    setLastScanned(mockParticipantId);
    toast.success('Check-in berhasil!');
    onScanSuccess?.(mockParticipantId);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Scanner
          </div>
          {isScanning && (
            <Badge variant="default" className="animate-pulse">
              Scanning...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scanner view */}
        <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
          {isScanning ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white/50 rounded-lg relative">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary" />

                  {/* Scanning line animation */}
                  <div className="absolute inset-x-0 h-0.5 bg-primary animate-scan" />
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <Camera className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-sm text-white/70">Klik tombol di bawah untuk mulai scan</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {isScanning ? (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={toggleCamera}
              >
                <SwitchCamera className="mr-2 h-4 w-4" />
                Ganti Kamera
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={stopScanning}
              >
                Stop
              </Button>
            </>
          ) : (
            <Button className="w-full" onClick={startScanning}>
              <Camera className="mr-2 h-4 w-4" />
              Mulai Scan
            </Button>
          )}
        </div>

        {/* Demo button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={simulateScan}
        >
          Demo: Simulasi Scan Berhasil
        </Button>

        {/* Last scanned */}
        {lastScanned && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <p className="text-sm text-muted-foreground">Terakhir di-scan:</p>
            <p className="font-mono text-sm">{lastScanned}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
