'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link, QrCode, Users, Mail, Copy, Check, ExternalLink, Loader2, Share2, Eye, MessageCircle, UserCheck, DollarSign } from 'lucide-react';
import { ManageScannersDialog } from '@/components/scanners/ManageScannersDialog';
import { TicketTierManagement } from '@/components/tickets/TicketTierManagement';
import { FormThemeSelector } from '@/components/form/FormThemeSelector';
import { FormBuilder } from '@/components/form/FormBuilder';
import { FormThemeId } from '@/constants/formThemes';
import { EventLayout } from '@/components/layout/EventLayout';

interface Event {
  id: string;
  name: string;
  public_viewer_slug?: string;
  qr_checkin_enabled?: boolean;
  checkin_required_for_draw?: boolean;
  email_notification_enabled?: boolean;
  is_paid_event?: boolean;
  registration_enabled?: boolean;
  form_theme?: string;
  form_addon_purchased?: boolean;
}

export default function EventSettingsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const formBuilderRef = useRef<HTMLDivElement>(null);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [slugInput, setSlugInput] = useState('');
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showScannersDialog, setShowScannersDialog] = useState(false);
  const [registrationCopied, setRegistrationCopied] = useState(false);

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Gagal memuat data event'
        });
      } else {
        setEvent(data);
        setSlugInput(data.public_viewer_slug || '');
      }
      setLoading(false);
    };

    fetchEvent();
  }, [id, toast]);

  // Auto-scroll to form builder if hash is #form-builder
  useEffect(() => {
    if (pathname?.includes('#form-builder') && formBuilderRef.current) {
      setTimeout(() => {
        formBuilderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [pathname]);

  const handleSaveSlug = async () => {
    if (!event) return;
    setIsGeneratingSlug(true);
    const { error } = await supabase
      .from('events')
      .update({ public_viewer_slug: slugInput })
      .eq('id', event.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal menyimpan',
        description: error.message
      });
    } else {
      setEvent(prev => prev ? { ...prev, public_viewer_slug: slugInput } : null);
      toast({
        title: 'Berhasil',
        description: 'Link public viewer telah diaktifkan'
      });
    }
    setIsGeneratingSlug(false);
  };

  const handleToggleQR = async (checked: boolean) => {
    if (!event) return;
    const { error } = await supabase
      .from('events')
      .update({ qr_checkin_enabled: checked })
      .eq('id', event.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal mengubah pengaturan',
        description: error.message
      });
    } else {
      setEvent(prev => prev ? { ...prev, qr_checkin_enabled: checked } : null);
      toast({
        title: checked ? 'QR Check-in Diaktifkan' : 'QR Check-in Dinonaktifkan',
        description: checked
          ? 'Peserta sekarang dapat check-in menggunakan QR code'
          : 'Fitur QR check-in telah dinonaktifkan'
      });
    }
  };

  const handleToggleCheckinRequired = async (checked: boolean) => {
    if (!event) return;
    const { error } = await supabase
      .from('events')
      .update({ checkin_required_for_draw: checked })
      .eq('id', event.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal mengubah pengaturan',
        description: error.message
      });
    } else {
      setEvent(prev => prev ? { ...prev, checkin_required_for_draw: checked } : null);
      toast({
        title: 'Pengaturan Disimpan',
        description: checked
          ? 'Hanya peserta yang sudah check-in yang dapat ikut undian'
          : 'Semua peserta dapat ikut undian tanpa perlu check-in'
      });
    }
  };

  const handleToggleEmailNotification = async (checked: boolean) => {
    if (!event) return;
    const { error } = await supabase
      .from('events')
      .update({ email_notification_enabled: checked })
      .eq('id', event.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal mengubah pengaturan',
        description: error.message
      });
    } else {
      setEvent(prev => prev ? { ...prev, email_notification_enabled: checked } : null);
      toast({
        title: checked ? 'Notifikasi Email Diaktifkan' : 'Notifikasi Email Dinonaktifkan',
        description: checked
          ? 'Pemenang akan menerima email notifikasi'
          : 'Notifikasi email untuk pemenang dinonaktifkan'
      });
    }
  };

  const handleTogglePaidEvent = async (checked: boolean) => {
    if (!event) return;
    const { error } = await supabase
      .from('events')
      .update({ is_paid_event: checked })
      .eq('id', event.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal mengubah pengaturan',
        description: error.message
      });
    } else {
      setEvent(prev => prev ? { ...prev, is_paid_event: checked } : null);
      toast({
        title: checked ? 'Event Berbayar Diaktifkan' : 'Event Gratis',
        description: checked
          ? 'Event ini sekarang memerlukan pembayaran tiket'
          : 'Event ini sekarang gratis untuk semua peserta'
      });
    }
  };

  const handleToggleRegistration = async (checked: boolean) => {
    if (!event) return;
    const { error } = await supabase
      .from('events')
      .update({ registration_enabled: checked })
      .eq('id', event.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal mengubah pengaturan',
        description: error.message
      });
    } else {
      setEvent(prev => prev ? { ...prev, registration_enabled: checked } : null);
      toast({
        title: checked ? 'Registrasi Dibuka' : 'Registrasi Ditutup',
        description: checked
          ? 'Peserta sekarang dapat mendaftar ke event ini'
          : 'Pendaftaran peserta baru telah ditutup'
      });
    }
  };

  const copyLink = () => {
    if (!event) return;
    navigator.clipboard.writeText(`${window.location.origin}/live/${event.public_viewer_slug}`);
    setCopied(true);
    toast({
      title: 'Link disalin',
      description: 'Link public viewer telah disalin ke clipboard'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Registration link functions
  const registrationLink = event ? `${window.location.origin}/register/${event.public_viewer_slug}` : '';

  const copyRegistrationLink = () => {
    navigator.clipboard.writeText(registrationLink);
    setRegistrationCopied(true);
    toast({
      title: 'Link disalin',
      description: 'Link registrasi telah disalin ke clipboard'
    });
    setTimeout(() => setRegistrationCopied(false), 2000);
  };

  const shareToWhatsApp = () => {
    if (!event) return;
    const text = encodeURIComponent(`Daftar sekarang untuk ${event.name}!\n\n${registrationLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(registrationLink)}`, '_blank');
  };

  const shareToTwitter = () => {
    if (!event) return;
    const text = encodeURIComponent(`Daftar sekarang untuk ${event.name}!`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(registrationLink)}`, '_blank');
  };

  const previewRegistration = () => {
    if (!event) return;
    window.open(`/register/${event.public_viewer_slug}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Event tidak ditemukan</p>
      </div>
    );
  }

  return (
    <EventLayout event={event}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pengaturan</h1>
          <p className="text-muted-foreground">Kelola pengaturan event</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Public Viewer Link */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Public Viewer
              </CardTitle>
              <CardDescription>
                Bagikan link ini untuk menampilkan hasil undian secara real-time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Masukkan slug (contoh: acara-2024)"
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  disabled={isGeneratingSlug || !slugInput}
                  onClick={handleSaveSlug}
                >
                  {isGeneratingSlug ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Simpan'
                  )}
                </Button>
              </div>

              {event.public_viewer_slug && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="flex-1 text-sm truncate">
                    {window.location.origin}/live/{event.public_viewer_slug}
                  </code>
                  <Button variant="ghost" size="icon" onClick={copyLink}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(`/live/${event.public_viewer_slug}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registration Link & Share */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Link Registrasi Publik
                  </CardTitle>
                  <CardDescription>
                    Bagikan link registrasi untuk peserta mendaftar ke event
                  </CardDescription>
                </div>
                {event.public_viewer_slug && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="registration-toggle" className="text-sm">
                      {event.registration_enabled ? 'Buka' : 'Tutup'}
                    </Label>
                    <Switch
                      id="registration-toggle"
                      checked={event.registration_enabled ?? true}
                      onCheckedChange={handleToggleRegistration}
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.public_viewer_slug ? (
                <>
                  {!event.registration_enabled && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive font-medium">
                        Registrasi sedang ditutup. Peserta tidak dapat mendaftar.
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <code className="flex-1 text-sm truncate">
                      {registrationLink}
                    </code>
                    <Button variant="ghost" size="icon" onClick={copyRegistrationLink}>
                      {registrationCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={previewRegistration}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={shareToWhatsApp}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={shareToFacebook}>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={shareToTwitter}>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Twitter
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Simpan slug Public Viewer terlebih dahulu untuk mengaktifkan link registrasi
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Check-in
              </CardTitle>
              <CardDescription>
                Aktifkan QR code untuk check-in peserta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="qr-toggle" className="flex flex-col gap-1">
                  <span>Status QR Check-in</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {event.qr_checkin_enabled ? 'Peserta dapat check-in dengan QR' : 'QR check-in dinonaktifkan'}
                  </span>
                </Label>
                <Switch
                  id="qr-toggle"
                  checked={event.qr_checkin_enabled}
                  onCheckedChange={handleToggleQR}
                />
              </div>
              {event.qr_checkin_enabled && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/dashboard/events/${id}/checkin`)}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Buka QR Scanner
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Eligibilitas Undian
              </CardTitle>
              <CardDescription>
                Atur syarat peserta untuk ikut undian
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="checkin-required-toggle" className="flex flex-col gap-1">
                  <span>Wajib Check-in untuk Undian</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {event.checkin_required_for_draw
                      ? 'Hanya peserta checked-in yang eligible'
                      : 'Semua peserta dapat ikut undian'}
                  </span>
                </Label>
                <Switch
                  id="checkin-required-toggle"
                  checked={event.checkin_required_for_draw}
                  onCheckedChange={handleToggleCheckinRequired}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Notifikasi Email
              </CardTitle>
              <CardDescription>
                Kirim email otomatis ke pemenang
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="email-toggle" className="flex flex-col gap-1">
                  <span>Email Pemenang</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {event.email_notification_enabled
                      ? 'Pemenang akan menerima email'
                      : 'Notifikasi email dinonaktifkan'}
                  </span>
                </Label>
                <Switch
                  id="email-toggle"
                  checked={event.email_notification_enabled}
                  onCheckedChange={handleToggleEmailNotification}
                />
              </div>
            </CardContent>
          </Card>

          {/* Scanner Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Scanner Kehadiran
              </CardTitle>
              <CardDescription>
                Kelola user yang bertugas scan kehadiran peserta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Tambahkan user scanner yang dapat mengakses halaman check-in dan melihat statistik kehadiran.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowScannersDialog(true)}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Kelola Scanner
                </Button>
                {event.public_viewer_slug && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Link halaman scanner:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs flex-1 truncate">
                        {window.location.origin}/scanner/{id}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/scanner/${id}`);
                          toast({
                            title: 'Link disalin',
                            description: 'Link halaman scanner telah disalin'
                          });
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/scanner/${id}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Paid Event Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Event Berbayar
              </CardTitle>
              <CardDescription>
                Aktifkan untuk menjual tiket dengan berbagai kategori
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="paid-toggle" className="flex flex-col gap-1">
                  <span>Status Event Berbayar</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {event.is_paid_event
                      ? 'Peserta harus membeli tiket'
                      : 'Event gratis untuk semua peserta'}
                  </span>
                </Label>
                <Switch
                  id="paid-toggle"
                  checked={event.is_paid_event || false}
                  onCheckedChange={handleTogglePaidEvent}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Theme Selector - Full Width */}
        {event.public_viewer_slug && (
          <FormThemeSelector
            eventId={event.id}
            currentTheme={event.form_theme as FormThemeId}
            onThemeChange={(theme) => setEvent(prev => prev ? { ...prev, form_theme: theme } : null)}
          />
        )}

        {/* Form Builder - Full Width */}
        {event.public_viewer_slug && (
          <div ref={formBuilderRef} id="form-builder">
            <FormBuilder
              eventId={event.id}
              formAddonPurchased={event.form_addon_purchased || false}
            />
          </div>
        )}

        {/* Ticket Tier Management - Full Width */}
        {event.is_paid_event && (
          <TicketTierManagement eventId={event.id} isPaidEvent={event.is_paid_event || false} />
        )}

        {/* Manage Scanners Dialog */}
        <ManageScannersDialog
          open={showScannersDialog}
          onOpenChange={setShowScannersDialog}
          eventId={event.id}
          eventName={event.name}
        />
      </div>
    </EventLayout>
  );
}
