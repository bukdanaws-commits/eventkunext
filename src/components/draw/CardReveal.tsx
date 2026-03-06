'use client';

import { useState } from 'react';
import { Gift, Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CardRevealProps {
  prizes: Array<{
    id: string;
    name: string;
    image?: string;
  }>;
  onReveal?: (prizeId: string) => void;
  isRevealing?: boolean;
  disabled?: boolean;
}

export function CardReveal({
  prizes,
  onReveal,
  isRevealing: externalRevealing,
  disabled,
}: CardRevealProps) {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedPrize, setRevealedPrize] = useState<string | null>(null);
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());

  const revealing = externalRevealing ?? isRevealing;

  const handleCardClick = (index: number) => {
    if (revealing || disabled || prizes.length === 0) return;
    if (revealedCards.has(index)) return;

    setSelectedCard(index);
    setIsRevealing(true);

    // Random prize
    const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];

    setTimeout(() => {
      setRevealedPrize(randomPrize.id);
      setRevealedCards(new Set([...revealedCards, index]));
      setIsRevealing(false);
      onReveal?.(randomPrize.id);
    }, 2000);
  };

  const resetCards = () => {
    setSelectedCard(null);
    setRevealedPrize(null);
    setRevealedCards(new Set());
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="text-center pb-2">
        <CardTitle className="flex items-center justify-center gap-2">
          <Gift className="h-5 w-5" />
          Card Reveal
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        {/* Cards grid */}
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, index) => {
            const isSelected = selectedCard === index;
            const isRevealed = revealedCards.has(index);
            const prize = isRevealed
              ? prizes[Math.floor(Math.random() * prizes.length)]
              : null;

            return (
              <motion.button
                key={index}
                className={cn(
                  'relative w-24 h-32 rounded-lg cursor-pointer perspective-1000',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
                onClick={() => handleCardClick(index)}
                whileHover={!disabled && !isRevealed ? { scale: 1.05 } : {}}
                whileTap={!disabled && !isRevealed ? { scale: 0.95 } : {}}
              >
                <motion.div
                  className="relative w-full h-full"
                  style={{ transformStyle: 'preserve-3d' }}
                  animate={{ rotateY: isSelected || isRevealed ? 180 : 0 }}
                  transition={{ duration: 0.6, type: 'spring' }}
                >
                  {/* Card front */}
                  <div
                    className={cn(
                      'absolute w-full h-full rounded-lg backface-hidden',
                      'bg-gradient-to-br from-primary to-primary/80',
                      'flex items-center justify-center',
                      'border-2 border-primary/20 shadow-lg'
                    )}
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <Gift className="w-10 h-10 text-white" />
                    <span className="absolute bottom-2 text-white text-xs font-medium">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Card back */}
                  <div
                    className={cn(
                      'absolute w-full h-full rounded-lg backface-hidden',
                      'bg-white dark:bg-gray-800',
                      'flex flex-col items-center justify-center p-2',
                      'border-2 border-green-500 shadow-lg'
                    )}
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    {isRevealed && prize ? (
                      <>
                        {prize.image ? (
                          <img
                            src={prize.image}
                            alt={prize.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center">
                            <Check className="w-6 h-6 text-green-600" />
                          </div>
                        )}
                        <span className="text-xs font-medium text-center mt-1 line-clamp-2">
                          {prize.name}
                        </span>
                      </>
                    ) : (
                      <Gift className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                </motion.div>
              </motion.button>
            );
          })}
        </div>

        {/* Status */}
        {revealing && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Mengungkap kartu...</span>
          </div>
        )}

        {/* Revealed prize */}
        {revealedPrize && !revealing && (
          <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 w-full">
            <p className="text-sm text-muted-foreground mb-1">Selamat!</p>
            <p className="font-bold text-lg text-green-700 dark:text-green-400">
              {prizes.find((p) => p.id === revealedPrize)?.name}
            </p>
          </div>
        )}

        {/* Reset button */}
        {revealedCards.size > 0 && (
          <Button variant="outline" onClick={resetCards} className="w-full">
            Reset Kartu
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
