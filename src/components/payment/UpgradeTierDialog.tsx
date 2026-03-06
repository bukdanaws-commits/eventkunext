'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Sparkles } from 'lucide-react'
import type { Event, PricingTier } from '@/hooks/useEvents'

interface UpgradeTierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Event
  pricingTiers: PricingTier[]
  onSuccess: () => void
}

const tierLabels: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export function UpgradeTierDialog({ open, onOpenChange, event, pricingTiers, onSuccess }: UpgradeTierDialogProps) {
  const [selectedTier, setSelectedTier] = useState<string>(event.tier)
  const [processing, setProcessing] = useState(false)

  const handleUpgrade = async () => {
    if (selectedTier === event.tier) {
      onOpenChange(false)
      return
    }

    setProcessing(true)
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In real app, this would call an API to process payment and update event
    console.log('Upgrading to:', selectedTier)
    
    setProcessing(false)
    onSuccess()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatLimit = (limit: number) => limit === -1 ? 'Unlimited' : limit

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Upgrade Event Tier
          </DialogTitle>
          <DialogDescription>
            Pilih tier yang sesuai dengan kebutuhan event Anda
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 py-4">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.id}
              className={`cursor-pointer transition-all ${
                selectedTier === tier.tier
                  ? 'border-primary ring-2 ring-primary'
                  : 'hover:border-primary/50'
              } ${tier.tier === 'pro' ? 'relative' : ''}`}
              onClick={() => setSelectedTier(tier.tier)}
            >
              {tier.tier === 'pro' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Paling Populer
                  </span>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle>{tierLabels[tier.tier]}</CardTitle>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{formatCurrency(tier.price)}</span>
                  <span className="text-muted-foreground text-sm">/event</span>
                </div>
                <CardDescription>
                  {tier.max_participants === -1 ? 'Unlimited' : tier.max_participants} peserta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {formatLimit(tier.max_hiburan)} Hiburan
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {formatLimit(tier.max_utama)} Utama
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {tier.max_grand_prize === -1 ? 'Unlimited' : tier.max_grand_prize} Grand Prize
                  </li>
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleUpgrade} disabled={processing}>
            {processing ? 'Memproses...' : selectedTier === event.tier ? 'Tetap di Tier Ini' : 'Upgrade Sekarang'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
