'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Image,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const eventSchema = z.object({
  name: z.string().min(3, 'Nama event minimal 3 karakter'),
  slug: z.string().min(3, 'Slug minimal 3 karakter').regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip'),
  description: z.string().optional(),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  time: z.string().min(1, 'Waktu wajib diisi'),
  location: z.string().optional(),
  maxParticipants: z.number().min(1).optional(),
  ticketPrice: z.number().min(0).optional(),
  currency: z.enum(['IDR', 'USD']),
  isPublic: z.boolean(),
  requiresPayment: z.boolean(),
  allowRegistration: z.boolean(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface CreateEventDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: (eventId: string) => void;
}

export function CreateEventDialog({ trigger, onSuccess }: CreateEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      date: '',
      time: '',
      location: '',
      maxParticipants: 100,
      ticketPrice: 0,
      currency: 'IDR',
      isPublic: true,
      requiresPayment: false,
      allowRegistration: true,
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    try {
      // Simulasi API call
      // const response = await fetch('/api/events', {
      //   method: 'POST',
      //   body: JSON.stringify(data),
      // });
      
      console.log('Creating event:', data);
      
      toast.success('Event berhasil dibuat!');
      setOpen(false);
      form.reset();
      
      if (onSuccess) {
        onSuccess('new-event-id');
      } else {
        router.push('/events/new-event-id');
      }
    } catch (error) {
      toast.error('Gagal membuat event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Buat Event
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Event Baru</DialogTitle>
          <DialogDescription>
            Isi informasi di bawah untuk membuat event baru
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Informasi</TabsTrigger>
                <TabsTrigger value="details">Detail</TabsTrigger>
                <TabsTrigger value="settings">Pengaturan</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Event *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Grand Prize Festival 2024"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (!form.getValues('slug')) {
                              form.setValue('slug', generateSlug(e.target.value));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug URL *</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <span className="text-muted-foreground text-sm mr-2">
                            prize.party/event/
                          </span>
                          <Input placeholder="grand-prize-festival" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        URL unik untuk event Anda
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Deskripsi singkat tentang event..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Waktu *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lokasi</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Jakarta Convention Center" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="details" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Kapasitas & Harga</CardTitle>
                    <CardDescription>
                      Tentukan kapasitas dan harga tiket
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="maxParticipants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maksimal Peserta</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ticketPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Harga Tiket</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <FormField
                                control={form.control}
                                name="currency"
                                render={({ field }) => (
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <SelectTrigger className="w-24">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="IDR">IDR</SelectItem>
                                      <SelectItem value="USD">USD</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Isi 0 untuk event gratis
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Pengaturan Event</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="isPublic"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Event Publik</FormLabel>
                            <FormDescription>
                              Event dapat dilihat dan diakses publik
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requiresPayment"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Memerlukan Pembayaran</FormLabel>
                            <FormDescription>
                              Peserta harus membayar untuk mendaftar
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="allowRegistration"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Buka Registrasi</FormLabel>
                            <FormDescription>
                              Peserta dapat mendaftar ke event
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Event
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
