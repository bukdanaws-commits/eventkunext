'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Gift, Loader2, CheckCircle, AlertCircle, Calendar, MapPin, Users, ImageIcon, Download, Mail, Search, Ticket, CreditCard, DollarSign, ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import QRCode from 'qrcode';
import { TierSelectionCard } from '@/components/tickets/TierSelectionCard';
import { getFormTheme, FormThemeId } from '@/constants/formThemes';
import { cn } from '@/lib/utils';
import { ManualPaymentSection } from '@/components/payment/ManualPaymentSection';

interface EventData {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  cover_image_url: string | null;
  tier: string;
  status: string;
  is_paid_event: boolean | null;
  ticket_price: number | null;
  registration_enabled: boolean;
  form_theme: string | null;
}

interface TicketTier {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quota: number | null;
  sold_count: number;
  is_active: boolean;
  benefits: { id: string; name: string; type: string }[];
  early_bird_price: number | null;
  early_bird_end_date: string | null;
}

interface ParticipantFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  division: string;
  address: string;
}

interface RegistrationResult {
  ticketNumber: string;
  participantName: string;
  participantId: string;
  requiresPayment: boolean;
  paymentUrl?: string;
}

export default function PublicRegistration() {
  const params = useParams();
  const slug = params.eventId as string;
  const [event, setEvent] = useState<EventData | null>(null);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [formData, setFormData] = useState<ParticipantFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    division: '',
    address: ''
  });
  const [errors, setErrors] = useState<Partial<ParticipantFormData>>({});
  const [currentStep, setCurrentStep] = useState<'info' | 'ticket' | 'form' | 'payment'>('info');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [paymentMethod, setPaymentMethod] = useState<'gateway' | 'transfer' | null>(null);

  useEffect(() => {
    if (slug) {
      fetchEvent();
    }
  }, [slug]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      // Find event by public_viewer_slug
      const { data, error } = await supabase
        .from('events')
        .select('id, name, description, event_date, event_time, location, cover_image_url, tier, status, is_paid_event, ticket_price, registration_enabled, form_theme')
        .eq('public_viewer_slug', slug)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setEvent(data);

      // Check if registration is closed
      if (data.registration_enabled === false) {
        setRegistrationClosed(true);
        setLoading(false);
        return;
      }

      // If paid event, fetch ticket tiers
      if (data.is_paid_event) {
        const { data: tiersData } = await supabase
          .from('ticket_tiers')
          .select(`
            id, name, description, price, quota, sold_count, is_active, early_bird_price, early_bird_end_date,
            benefit_items (id, name, type)
          `)
          .eq('event_id', data.id)
          .eq('is_active', true)
          .order('sort_order');

        if (tiersData) {
          const tiersWithBenefits = tiersData.map(tier => ({
            ...tier,
            benefits: tier.benefit_items || [],
            early_bird_price: tier.early_bird_price ?? null,
            early_bird_end_date: tier.early_bird_end_date ?? null
          }));
          setTicketTiers(tiersWithBenefits);
          
          // Auto-select first tier if only one
          if (tiersWithBenefits.length === 1) {
            setSelectedTierId(tiersWithBenefits[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Partial<ParticipantFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Format email tidak valid';
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor telepon wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    if (!event) return;

    // For paid events, require tier selection and payment method
    if (event.is_paid_event && ticketTiers.length > 0) {
      if (!selectedTierId) {
        toast.error('Silakan pilih kategori tiket terlebih dahulu');
        return;
      }
      if (!paymentMethod) {
        toast.error('Silakan pilih metode pembayaran');
        return;
      }
    }

    setSubmitting(true);
    try {
      const isPaidEvent = Boolean(event.is_paid_event && selectedTierId);

      const { data: registrationData, error: registrationError } = await supabase.functions.invoke(
        'public-register-participant',
        {
          body: {
            eventId: event.id,
            tierId: selectedTierId,
            participant: {
              name: formData.name,
              email: formData.email || null,
              phone: formData.phone || null,
              company: formData.company || null,
              division: formData.division || null,
              address: formData.address || null,
            },
          },
        }
      );

      if (registrationError) throw registrationError;

      const ticketNumber = registrationData?.ticketNumber as string | undefined;
      const participantId = registrationData?.participantId as string | undefined;

      if (!ticketNumber || !participantId) {
        throw new Error('Registration failed');
      }

      // If paid event with gateway payment method, try to create payment
      if (isPaidEvent && paymentMethod === 'gateway') {
        try {
          const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-participant-payment', {
            body: {
              participantId,
              eventId: event.id,
              tierId: selectedTierId,
            },
          });

          if (!paymentError && paymentData?.redirect_url) {
            // Payment created successfully - redirect to Midtrans
            setRegistrationResult({
              ticketNumber,
              participantName: formData.name.trim(),
              participantId,
              requiresPayment: true,
              paymentUrl: paymentData.redirect_url,
            });

            setSubmitted(true);
            toast.success('Registrasi berhasil! Silakan lanjutkan pembayaran.');

            // Auto-redirect to payment after 2 seconds
            setTimeout(() => {
              window.location.href = paymentData.redirect_url;
            }, 2000);
            return;
          }
        } catch (paymentErr) {
          console.error('Payment creation failed:', paymentErr);
          // Fall through to manual transfer flow
        }
      }

      // If paid event with manual transfer or gateway failed - create payment record for manual transfer
      if (isPaidEvent) {
        // Also create payment record for manual transfer (without redirect)
        try {
          await supabase.functions.invoke('create-participant-payment', {
            body: {
              participantId,
              eventId: event.id,
              tierId: selectedTierId,
              paymentMethod: 'manual_transfer',
            },
          });
        } catch (paymentErr) {
          console.error('Payment record creation failed:', paymentErr);
          // Continue anyway - the ManualPaymentSection will handle missing payment record
        }

        setRegistrationResult({
          ticketNumber,
          participantName: formData.name.trim(),
          participantId,
          requiresPayment: true,
        });

        setSubmitted(true);
        toast.success('Registrasi berhasil! Silakan upload bukti transfer.');
        return;
      }

      // Free event - generate QR code immediately
      const qrData = JSON.stringify({
        id: participantId,
        ticket: ticketNumber,
        event: event.id,
      });

      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      setQrCodeUrl(qrUrl);
      setRegistrationResult({
        ticketNumber,
        participantName: formData.name.trim(),
        participantId,
        requiresPayment: false,
      });

      // Send QR code email automatically if email is provided (in background)
      if (formData.email.trim()) {
        supabase.functions
          .invoke('send-participant-qr', {
            body: {
              participantId,
              eventName: event.name,
            },
          })
          .catch((emailError) => {
            console.error('Error sending QR email:', emailError);
          });
      }

      setSubmitted(true);
      toast.success('Registrasi berhasil!');
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast.error('Gagal mengirim registrasi. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ParticipantFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Event Tidak Ditemukan</h2>
            <p className="text-muted-foreground">
              Event yang Anda cari tidak ditemukan atau sudah tidak aktif.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (registrationClosed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Registrasi Ditutup</h2>
            <p className="text-muted-foreground mb-4">
              Pendaftaran untuk event <strong>{event?.name}</strong> sudah ditutup.
            </p>
            {event && (
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(event.event_date), 'EEEE, dd MMMM yyyy', { locale: localeId })}</span>
                </div>
                {event.location && (
                  <div className="flex items-center justify-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDownloadQR = () => {
    if (!qrCodeUrl || !registrationResult) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `tiket-${registrationResult.ticketNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR Code berhasil diunduh!');
  };

  if (submitted && registrationResult) {
    // Payment required - show payment redirect screen or manual payment info
    if (registrationResult.requiresPayment) {
      // If payment URL exists, show redirect screen
      if (registrationResult.paymentUrl) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-background to-muted py-8 px-4">
            <div className="max-w-lg mx-auto">
              <Card className="overflow-hidden">
                <div className="bg-primary/10 p-6 text-center border-b">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber-500/20 mb-3">
                    <CreditCard className="h-8 w-8 text-amber-500" />
                  </div>
                  <h2 className="text-2xl font-bold">Lanjutkan Pembayaran</h2>
                  <p className="text-muted-foreground mt-1">
                    Registrasi berhasil! Silakan selesaikan pembayaran.
                  </p>
                </div>
                
                <CardContent className="p-6 text-center">
                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Nomor Tiket</p>
                    <p className="font-mono font-bold text-lg">{registrationResult.ticketNumber}</p>
                  </div>

                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Mengalihkan ke halaman pembayaran...
                    </p>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={() => window.location.href = registrationResult.paymentUrl!}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Bayar Sekarang
                  </Button>

                  <p className="text-xs text-muted-foreground mt-4">
                    Tiket QR akan dikirim setelah pembayaran berhasil
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      }

      // No payment URL - show manual payment with bank info and upload form
      const selectedTier = ticketTiers.find(t => t.id === selectedTierId);
      const isEarlyBird = selectedTier?.early_bird_end_date && new Date(selectedTier.early_bird_end_date) > new Date();
      const tierPrice = isEarlyBird && selectedTier?.early_bird_price ? selectedTier.early_bird_price : (selectedTier?.price || 0);

      return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted py-8 px-4">
          <div className="max-w-lg mx-auto">
            <Card className="overflow-hidden">
              <div className="bg-primary/10 p-6 text-center border-b">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 mb-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold">Registrasi Berhasil!</h2>
                <p className="text-muted-foreground mt-1">
                  Silakan selesaikan pembayaran untuk mendapatkan tiket.
                </p>
              </div>
              
              <CardContent className="p-6">
                <div className="mb-6 p-4 bg-muted rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Nomor Tiket</p>
                  <p className="font-mono font-bold text-lg">{registrationResult.ticketNumber}</p>
                </div>

                {/* Manual Payment Section with Bank Info and Upload */}
                <ManualPaymentSection
                  participantId={registrationResult.participantId}
                  eventId={event?.id || ''}
                  ticketNumber={registrationResult.ticketNumber}
                  email={formData.email}
                  amount={tierPrice}
                  tierName={selectedTier?.name}
                />

                {formData.email && (
                  <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg text-sm mt-4">
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                    <p>
                      Konfirmasi akan dikirim ke <strong>{formData.email}</strong>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Free event - show QR code
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted py-8 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="overflow-hidden">
            {/* Success Header */}
            <div className="bg-primary/10 p-6 text-center border-b">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 mb-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold">Registrasi Berhasil!</h2>
              <p className="text-muted-foreground mt-1">
                Selamat datang, {registrationResult.participantName}
              </p>
            </div>
            
            <CardContent className="p-6">
              {/* QR Code Section */}
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Tunjukkan QR Code ini saat check-in di lokasi event
                </p>
                
                {qrCodeUrl && (
                  <div className="inline-block p-4 bg-white rounded-xl shadow-lg border">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code Tiket" 
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Nomor Tiket</p>
                  <p className="font-mono font-bold text-lg">{registrationResult.ticketNumber}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <Button 
                  onClick={handleDownloadQR} 
                  className="flex-1"
                  variant="default"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Unduh QR Code
                </Button>
              </div>

              {formData.email && (
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg text-sm">
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <p>
                    QR Code juga dikirim ke <strong>{formData.email}</strong>
                  </p>
                </div>
              )}

              {/* Event Info */}
              {event && (
                <div className="mt-6 pt-6 border-t space-y-2">
                  <h3 className="font-semibold text-sm mb-3">Detail Event</h3>
                  <div className="flex items-start gap-2 text-sm">
                    <Gift className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{event.name}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>
                      {format(new Date(event.event_date), 'EEEE, dd MMMM yyyy', { locale: localeId })}
                      {event.event_time && ` • ${event.event_time.slice(0, 5)}`}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-6 space-y-2">
            <p className="text-xs text-muted-foreground">
              Screenshot halaman ini sebagai cadangan tiket Anda
            </p>
            <Link href="/ticket-status">
              <Button variant="link" size="sm" className="text-xs">
                <Search className="h-3 w-3 mr-1" />
                Cek status tiket lainnya
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get theme based on event setting
  const theme = getFormTheme(event?.form_theme);

  // Determine total steps based on event type
  const isPaidEvent = event?.is_paid_event && ticketTiers.length > 0;
  const steps = isPaidEvent ? ['info', 'ticket', 'form', 'payment'] : ['info', 'form'];
  const currentStepIndex = steps.indexOf(currentStep);
  const totalSteps = steps.length;

  const stepLabels: Record<string, string> = {
    info: 'Info',
    ticket: 'Tiket',
    form: 'Data',
    payment: 'Bayar',
  };

  const goToNextStep = () => {
    setSlideDirection('right');
    if (currentStep === 'info') {
      setCurrentStep(isPaidEvent ? 'ticket' : 'form');
    } else if (currentStep === 'ticket') {
      setCurrentStep('form');
    } else if (currentStep === 'form' && isPaidEvent) {
      setCurrentStep('payment');
    }
  };

  const goToPreviousStep = () => {
    setSlideDirection('left');
    if (currentStep === 'payment') {
      setCurrentStep('form');
    } else if (currentStep === 'form') {
      setCurrentStep(isPaidEvent ? 'ticket' : 'info');
    } else if (currentStep === 'ticket') {
      setCurrentStep('info');
    }
  };

  // Animation classes
  const getSlideClass = () => {
    return slideDirection === 'right' ? 'animate-fade-in' : 'animate-fade-in';
  };

  return (
    <div className={cn(theme.classes.container, 'min-h-screen py-8 px-4')}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={cn(
            "inline-flex items-center justify-center h-16 w-16 rounded-full mb-4",
            theme.id === 'elegant' ? 'bg-yellow-600/20' : 'bg-primary/10'
          )}>
            <Gift className={cn(
              "h-8 w-8",
              theme.id === 'elegant' ? 'text-yellow-500' : 'text-primary'
            )} />
          </div>
          <h1 className={cn(
            "text-3xl font-bold",
            theme.id === 'elegant' ? 'text-zinc-100' : 'text-foreground'
          )}>
            Registrasi Event
          </h1>
          <p className={cn(
            "mt-2",
            theme.id === 'elegant' ? 'text-zinc-400' : 'text-muted-foreground'
          )}>
            Daftar untuk mengikuti event dan undian doorprize
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                  index <= currentStepIndex 
                    ? theme.id === 'elegant' 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-primary text-primary-foreground'
                    : theme.id === 'elegant'
                      ? 'bg-zinc-700 text-zinc-400'
                      : 'bg-muted text-muted-foreground'
                )}>
                  {index + 1}
                </div>
                <span className={cn(
                  "text-xs mt-1",
                  index <= currentStepIndex
                    ? theme.id === 'elegant' ? 'text-amber-400' : 'text-primary'
                    : theme.id === 'elegant' ? 'text-zinc-500' : 'text-muted-foreground'
                )}>
                  {stepLabels[step]}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-8 h-1 mx-2 rounded transition-all duration-300 mb-5",
                  index < currentStepIndex
                    ? theme.id === 'elegant' ? 'bg-amber-500' : 'bg-primary'
                    : theme.id === 'elegant' ? 'bg-zinc-700' : 'bg-muted'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Single Card with Steps */}
        <Card className={cn(theme.classes.card, 'overflow-hidden')}>
          {/* Step 1: Event Info */}
          {currentStep === 'info' && (
            <div key="info" className={getSlideClass()}>
              {/* QR Code Preview Section */}
              <div className={cn(
                "p-6",
                theme.id === 'elegant' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-primary to-primary/80'
              )}>
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-xl shadow-lg">
                    <div className="w-40 h-40 flex items-center justify-center">
                      <div className="relative w-full h-full">
                        {/* Placeholder QR Pattern */}
                        <div className="absolute inset-0 grid grid-cols-8 gap-0.5 p-2">
                          {Array.from({ length: 64 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={cn(
                                "aspect-square rounded-sm",
                                (i + Math.floor(i / 8)) % 3 === 0 ? 'bg-zinc-900' : 'bg-transparent'
                              )}
                            />
                          ))}
                        </div>
                        {/* Center Logo */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center shadow-lg",
                            theme.id === 'elegant' ? 'bg-amber-500' : 'bg-primary'
                          )}>
                            <Gift className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Event Info */}
              <CardContent className={cn(
                "p-6",
                theme.id === 'elegant' ? 'bg-zinc-800' : ''
              )}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className={cn(
                    theme.id === 'elegant' ? 'bg-amber-500 text-white border-0' : ''
                  )}>
                    {event?.tier?.toUpperCase()}
                  </Badge>
                  <Badge variant="default" className={cn(
                    theme.id === 'elegant' ? 'bg-green-500 text-white border-0' : ''
                  )}>
                    Aktif
                  </Badge>
                </div>
                
                <h3 className={cn(
                  "text-xl font-bold mb-1",
                  theme.id === 'elegant' ? 'text-zinc-100' : 'text-foreground'
                )}>
                  {event?.name}
                </h3>
                
                {event?.description && (
                  <p className={cn(
                    "text-sm mb-4",
                    theme.id === 'elegant' ? 'text-zinc-400' : 'text-muted-foreground'
                  )}>
                    {event.description}
                  </p>
                )}

                <div className="space-y-2 mb-6">
                  <div className={cn(
                    "flex items-center gap-2 text-sm",
                    theme.id === 'elegant' ? 'text-zinc-300' : 'text-muted-foreground'
                  )}>
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>
                      {event && format(new Date(event.event_date), 'EEEE, dd MMMM yyyy', { locale: localeId })}
                      {event?.event_time && ` • ${event.event_time.slice(0, 5)}`}
                    </span>
                  </div>
                  {event?.location && (
                    <div className={cn(
                      "flex items-center gap-2 text-sm",
                      theme.id === 'elegant' ? 'text-zinc-300' : 'text-muted-foreground'
                    )}>
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={goToNextStep}
                  className={cn(theme.classes.button, 'w-full')}
                  size="lg"
                >
                  Daftar Sekarang
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </div>
          )}

          {/* Step 2: Ticket Selection (for paid events) */}
          {currentStep === 'ticket' && isPaidEvent && (
            <div key="ticket" className={getSlideClass()}>
              <CardHeader className={theme.classes.header}>
                <CardTitle className={cn(theme.classes.title, 'flex items-center gap-2')}>
                  <Ticket className="h-5 w-5" />
                  Pilih Kategori Tiket
                </CardTitle>
                <CardDescription className={theme.classes.subtitle}>
                  Pilih kategori tiket yang sesuai dengan kebutuhan Anda
                </CardDescription>
              </CardHeader>
              <CardContent className={cn(
                "p-6",
                theme.id === 'elegant' ? 'bg-zinc-800' : ''
              )}>
                <TierSelectionCard
                  tiers={ticketTiers}
                  selectedTierId={selectedTierId}
                  onSelect={setSelectedTierId}
                  loading={submitting}
                />

                <div className="flex gap-3 mt-6">
                  <Button 
                    variant="outline"
                    onClick={goToPreviousStep}
                    className={cn(
                      "flex-1",
                      theme.id === 'elegant' ? 'border-zinc-600 text-zinc-300 hover:bg-zinc-700' : ''
                    )}
                    size="lg"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali
                  </Button>
                  <Button 
                    onClick={goToNextStep}
                    className={cn(theme.classes.button, 'flex-1')}
                    size="lg"
                    disabled={!selectedTierId}
                  >
                    Lanjutkan
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </div>
          )}

          {/* Step 3: Registration Form */}
          {currentStep === 'form' && (
            <div key="form" className={getSlideClass()}>
              <CardHeader className={theme.classes.header}>
                <CardTitle className={cn(theme.classes.title, 'flex items-center gap-2')}>
                  <Users className="h-5 w-5" />
                  Form Registrasi
                </CardTitle>
                <CardDescription className={theme.classes.subtitle}>
                  Isi data diri Anda untuk mengikuti event ini
                </CardDescription>
              </CardHeader>
              <CardContent className={cn(
                "p-6",
                theme.id === 'elegant' ? 'bg-zinc-800' : ''
              )}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className={theme.classes.label}>
                      Nama Lengkap <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Masukkan nama lengkap"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={cn(theme.classes.input, errors.name && 'border-destructive')}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className={theme.classes.label}>
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contoh@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={cn(theme.classes.input, errors.email && 'border-destructive')}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className={theme.classes.label}>
                      Nomor Telepon <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={cn(theme.classes.input, errors.phone && 'border-destructive')}
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive">{errors.phone}</p>
                    )}
                  </div>

                  {/* Company */}
                  <div className="space-y-2">
                    <Label htmlFor="company" className={theme.classes.label}>Perusahaan</Label>
                    <Input
                      id="company"
                      placeholder="Nama perusahaan (opsional)"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className={theme.classes.input}
                    />
                  </div>

                  {/* Division */}
                  <div className="space-y-2">
                    <Label htmlFor="division" className={theme.classes.label}>Divisi</Label>
                    <Input
                      id="division"
                      placeholder="Nama divisi (opsional)"
                      value={formData.division}
                      onChange={(e) => handleInputChange('division', e.target.value)}
                      className={theme.classes.input}
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address" className={theme.classes.label}>Alamat</Label>
                    <Textarea
                      id="address"
                      placeholder="Alamat lengkap (opsional)"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={2}
                      className={theme.classes.input}
                    />
                  </div>

                  {/* Selected Tier Summary for Paid Events */}
                  {isPaidEvent && selectedTierId && (
                    <div className={cn(
                      "p-4 rounded-lg border",
                      theme.id === 'elegant' ? 'bg-zinc-700/50 border-zinc-600' : 'bg-muted'
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4 text-primary" />
                          <span className={cn(
                            "text-sm font-medium",
                            theme.id === 'elegant' ? 'text-zinc-200' : ''
                          )}>
                            {ticketTiers.find(t => t.id === selectedTierId)?.name}
                          </span>
                        </div>
                        <span className={cn(
                          "font-bold",
                          theme.id === 'elegant' ? 'text-amber-400' : 'text-primary'
                        )}>
                          Rp {ticketTiers.find(t => t.id === selectedTierId)?.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={goToPreviousStep}
                      className={cn(
                        theme.id === 'elegant' ? 'border-zinc-600 text-zinc-300 hover:bg-zinc-700' : ''
                      )}
                      size="lg"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Kembali
                    </Button>
                    {isPaidEvent ? (
                      <Button 
                        type="button"
                        onClick={() => {
                          if (validateForm()) {
                            goToNextStep();
                          } else {
                            toast.error('Mohon lengkapi semua field yang wajib diisi');
                          }
                        }}
                        className={cn(theme.classes.button, 'flex-1')}
                        size="lg"
                      >
                        Lanjut ke Pembayaran
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        className={cn(theme.classes.button, 'flex-1')}
                        size="lg"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Mendaftar...
                          </>
                        ) : (
                          'Daftar Sekarang'
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </div>
          )}

          {/* Step 4: Payment Method Selection (for paid events) */}
          {currentStep === 'payment' && isPaidEvent && (
            <div key="payment" className={getSlideClass()}>
              <CardHeader className={theme.classes.header}>
                <CardTitle className={cn(theme.classes.title, 'flex items-center gap-2')}>
                  <CreditCard className="h-5 w-5" />
                  Pilih Metode Pembayaran
                </CardTitle>
                <CardDescription className={theme.classes.subtitle}>
                  Pilih cara pembayaran yang paling nyaman untuk Anda
                </CardDescription>
              </CardHeader>
              <CardContent className={cn(
                "p-6",
                theme.id === 'elegant' ? 'bg-zinc-800' : ''
              )}>
                {/* Order Summary */}
                <div className={cn(
                  "p-4 rounded-lg border mb-6",
                  theme.id === 'elegant' ? 'bg-zinc-700/50 border-zinc-600' : 'bg-muted'
                )}>
                  <h4 className={cn(
                    "text-sm font-medium mb-3",
                    theme.id === 'elegant' ? 'text-zinc-300' : 'text-muted-foreground'
                  )}>
                    Ringkasan Pesanan
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={theme.id === 'elegant' ? 'text-zinc-400' : 'text-muted-foreground'}>Nama</span>
                      <span className={cn("font-medium", theme.id === 'elegant' ? 'text-zinc-200' : '')}>{formData.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={theme.id === 'elegant' ? 'text-zinc-400' : 'text-muted-foreground'}>Kategori Tiket</span>
                      <span className={cn("font-medium", theme.id === 'elegant' ? 'text-zinc-200' : '')}>
                        {ticketTiers.find(t => t.id === selectedTierId)?.name}
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className={cn("font-medium", theme.id === 'elegant' ? 'text-zinc-200' : '')}>Total</span>
                        <span className={cn(
                          "text-lg font-bold",
                          theme.id === 'elegant' ? 'text-amber-400' : 'text-primary'
                        )}>
                          Rp {ticketTiers.find(t => t.id === selectedTierId)?.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3">
                  {/* Payment Gateway Option */}
                  <div
                    onClick={() => setPaymentMethod('gateway')}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all",
                      paymentMethod === 'gateway'
                        ? theme.id === 'elegant'
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-primary bg-primary/5'
                        : theme.id === 'elegant'
                          ? 'border-zinc-600 hover:border-zinc-500'
                          : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                        paymentMethod === 'gateway'
                          ? theme.id === 'elegant' ? 'bg-amber-500' : 'bg-primary'
                          : theme.id === 'elegant' ? 'bg-zinc-700' : 'bg-muted'
                      )}>
                        <CreditCard className={cn(
                          "h-5 w-5",
                          paymentMethod === 'gateway' ? 'text-white' : theme.id === 'elegant' ? 'text-zinc-400' : 'text-muted-foreground'
                        )} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={cn(
                            "font-medium",
                            theme.id === 'elegant' ? 'text-zinc-200' : ''
                          )}>
                            Bayar Online
                          </h4>
                          <Badge variant="secondary" className="text-xs">Rekomendasi</Badge>
                        </div>
                        <p className={cn(
                          "text-sm mt-1",
                          theme.id === 'elegant' ? 'text-zinc-400' : 'text-muted-foreground'
                        )}>
                          Transfer Bank, E-Wallet, QRIS, Kartu Kredit
                        </p>
                        <p className={cn(
                          "text-xs mt-2",
                          theme.id === 'elegant' ? 'text-green-400' : 'text-green-600'
                        )}>
                          ✓ Verifikasi otomatis & tiket langsung dikirim
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Manual Transfer Option */}
                  <div
                    onClick={() => setPaymentMethod('transfer')}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all",
                      paymentMethod === 'transfer'
                        ? theme.id === 'elegant'
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-primary bg-primary/5'
                        : theme.id === 'elegant'
                          ? 'border-zinc-600 hover:border-zinc-500'
                          : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                        paymentMethod === 'transfer'
                          ? theme.id === 'elegant' ? 'bg-amber-500' : 'bg-primary'
                          : theme.id === 'elegant' ? 'bg-zinc-700' : 'bg-muted'
                      )}>
                        <DollarSign className={cn(
                          "h-5 w-5",
                          paymentMethod === 'transfer' ? 'text-white' : theme.id === 'elegant' ? 'text-zinc-400' : 'text-muted-foreground'
                        )} />
                      </div>
                      <div className="flex-1">
                        <h4 className={cn(
                          "font-medium",
                          theme.id === 'elegant' ? 'text-zinc-200' : ''
                        )}>
                          Transfer Manual
                        </h4>
                        <p className={cn(
                          "text-sm mt-1",
                          theme.id === 'elegant' ? 'text-zinc-400' : 'text-muted-foreground'
                        )}>
                          Transfer ke rekening panitia & upload bukti
                        </p>
                        <p className={cn(
                          "text-xs mt-2",
                          theme.id === 'elegant' ? 'text-amber-400' : 'text-amber-600'
                        )}>
                          ⏱ Verifikasi manual 1x24 jam
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button 
                    variant="outline"
                    onClick={goToPreviousStep}
                    className={cn(
                      theme.id === 'elegant' ? 'border-zinc-600 text-zinc-300 hover:bg-zinc-700' : ''
                    )}
                    size="lg"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali
                  </Button>
                  <Button 
                    onClick={() => handleSubmit()}
                    className={cn(theme.classes.button, 'flex-1')}
                    size="lg"
                    disabled={submitting || !paymentMethod}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        {paymentMethod === 'gateway' ? 'Bayar Sekarang' : 'Daftar & Upload Bukti'}
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
