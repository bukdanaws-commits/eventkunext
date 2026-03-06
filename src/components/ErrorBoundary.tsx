'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error untuk debugging
    console.error('[ErrorBoundary] Error caught:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    });

    // Simpan ke localStorage untuk debugging
    try {
      const errorLog = {
        message: error.message,
        stack: error.stack?.slice(0, 500),
        componentStack: errorInfo.componentStack?.slice(0, 500),
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : ''
      };
      
      const existingLogs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      existingLogs.unshift(errorLog);
      // Simpan maksimal 10 error terakhir
      localStorage.setItem('error_logs', JSON.stringify(existingLogs.slice(0, 10)));
    } catch (e) {
      console.warn('Failed to save error log:', e);
    }
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleClearAndRefresh = () => {
    // Clear cache dan refresh
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    localStorage.removeItem('error_logs');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Terjadi Kesalahan</CardTitle>
              <CardDescription>
                Aplikasi mengalami error yang tidak terduga. Silakan coba refresh halaman.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="font-medium text-destructive mb-1">Detail Error:</p>
                  <p className="text-muted-foreground font-mono text-xs break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleRefresh} className="w-full gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Halaman
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="w-full gap-2">
                  <Home className="h-4 w-4" />
                  Kembali ke Beranda
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={this.handleClearAndRefresh} 
                  className="w-full text-muted-foreground text-sm"
                >
                  Clear Cache & Refresh
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Jika masalah terus berlanjut, silakan hubungi support.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
