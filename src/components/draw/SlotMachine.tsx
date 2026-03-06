'use client';

import { useState, useEffect, useRef } from 'react';
import { Dices, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SlotMachineProps {
  items: string[];
  onSpinEnd?: (result: string) => void;
  isSpinning?: boolean;
  disabled?: boolean;
}

export function SlotMachine({
  items,
  onSpinEnd,
  isSpinning: externalSpinning,
  disabled,
}: SlotMachineProps) {
  const [displayItems, setDisplayItems] = useState<string[]>(['?', '?', '?']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

  const spinning = externalSpinning ?? isSpinning;

  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(clearInterval);
    };
  }, []);

  const spin = () => {
    if (spinning || disabled || items.length === 0) return;

    setIsSpinning(true);
    setWinner(null);
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];

    // Pick random winner
    const winnerItem = items[Math.floor(Math.random() * items.length)];

    // Spin each reel with different durations
    const durations = [2000, 3000, 4000];

    durations.forEach((duration, index) => {
      const interval = setInterval(() => {
        setDisplayItems((prev) => {
          const newItems = [...prev];
          newItems[index] = items[Math.floor(Math.random() * items.length)];
          return newItems;
        });
      }, 100);

      intervalsRef.current.push(interval);

      setTimeout(() => {
        clearInterval(interval);
        setDisplayItems((prev) => {
          const newItems = [...prev];
          newItems[index] = winnerItem;
          return newItems;
        });

        if (index === durations.length - 1) {
          setIsSpinning(false);
          setWinner(winnerItem);
          onSpinEnd?.(winnerItem);
        }
      }, duration);
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="text-center pb-2">
        <CardTitle className="flex items-center justify-center gap-2">
          <Dices className="h-5 w-5" />
          Slot Machine
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        {/* Slot display */}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-xl shadow-inner border-4 border-yellow-500">
          <div className="flex gap-2">
            {displayItems.map((item, index) => (
              <div
                key={index}
                className={cn(
                  'w-24 h-24 bg-white rounded-lg flex items-center justify-center',
                  'border-4 border-yellow-400 shadow-lg',
                  'transition-all duration-100',
                  spinning && 'animate-pulse'
                )}
              >
                <span className={cn(
                  'text-2xl font-bold text-center px-2',
                  !spinning && winner && 'text-green-600'
                )}>
                  {item.length > 8 ? item.substring(0, 8) + '...' : item}
                </span>
              </div>
            ))}
          </div>

          {/* Decorative lights */}
          <div className="flex justify-center gap-4 mt-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-3 h-3 rounded-full',
                  spinning
                    ? 'animate-ping'
                    : winner
                    ? 'bg-green-500'
                    : 'bg-red-500'
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Spin button */}
        <Button
          size="lg"
          onClick={spin}
          disabled={spinning || disabled || items.length === 0}
          className="w-full max-w-[200px] bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
        >
          {spinning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Berputar...
            </>
          ) : (
            <>
              <Dices className="mr-2 h-4 w-4" />
              SPIN
            </>
          )}
        </Button>

        {/* Winner display */}
        {winner && !spinning && (
          <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 w-full">
            <p className="text-sm text-muted-foreground mb-1">Hasil:</p>
            <p className="font-bold text-lg text-green-700 dark:text-green-400">
              {winner}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
