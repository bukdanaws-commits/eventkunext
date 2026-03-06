'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import Link from 'next/link';

const pricingTiers = [
  {
    name: 'Free',
    price: 'Rp 0',
    description: 'Untuk event kecil',
    features: ['50 Peserta', '5 Hadiah Hiburan', '2 Hadiah Utama', '1 Grand Prize'],
    popular: false,
  },
  {
    name: 'Basic',
    price: 'Rp 99.000',
    description: 'Untuk event menengah',
    features: ['200 Peserta', '15 Hadiah Hiburan', '5 Hadiah Utama', '2 Grand Prize'],
    popular: false,
  },
  {
    name: 'Pro',
    price: 'Rp 299.000',
    description: 'Untuk event besar',
    features: ['500 Peserta', '30 Hadiah Hiburan', '10 Hadiah Utama', '5 Grand Prize'],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Rp 799.000',
    description: 'Untuk event enterprise',
    features: ['2000 Peserta', '100 Hadiah Hiburan', '30 Hadiah Utama', '15 Grand Prize'],
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Harga Per Event</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Pilih paket yang sesuai dengan kebutuhan event Anda
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {pricingTiers.map((tier) => (
            <Card key={tier.name} className={tier.popular ? 'border-primary shadow-lg relative' : ''}>
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Paling Populer
                  </span>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle>{tier.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">/event</span>
                </div>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={tier.popular ? 'default' : 'outline'}
                  asChild
                >
                  <Link href="/auth">Pilih {tier.name}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Butuh paket khusus? Hubungi kami untuk penawaran khusus
          </p>
          <Button variant="outline" asChild>
            <Link href="/public/contact">Hubungi Sales</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
