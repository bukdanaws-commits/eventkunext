'use client';

import { useState, useEffect, useRef } from 'react';
import { Dices, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RandomNumberProps {
  min?: number;
  max?: number;
  onResult?: (number: number) => void;
  isRolling?: boolean;
  disabled?: boolean;
}

export function RandomNumber({
  min = 1,
  max = 100,
  onResult,
  isRolling: externalRolling,
  disabled,
}: RandomNumberProps) {
  const [currentNumber, setCurrentNumber] = useState(min);
  const [isRolling, setIsRolling] = useState(false);
  const [finalNumber, setFinalNumber] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const rolling = externalRolling ?? isRolling;

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const roll = () => {
    if (rolling || disabled) return;

    setIsRolling(true);
    setFinalNumber(null);

    // Quick number changes
    intervalRef.current = setInterval(() => {
      setCurrentNumber(Math.floor(Math.random() * (max - min + 1)) + min);
    }, 50);

    // Stop after random duration
    const duration = 2000 + Math.random() * 2000;

    setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Final number
      const result = Math.floor(Math.random() * (max - min + 1)) + min;
      setCurrentNumber(result);
      setFinalNumber(result);
      setIsRolling(false);
      onResult?.(result);
    }, duration);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="text-center pb-2">
        <CardTitle className="flex items-center justify-center gap-2">
          <Dices className="h-5 w-5" />
          Random Number
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        {/* Number display */}
        <div
          className={cn(
            'relative w-48 h-32 rounded-xl',
            'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900',
            'border-4 border-gray-300 dark:border-gray-600',
            'flex items-center justify-center',
            'overflow-hidden'
          )}
        >
          {/* Digital display effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

          <span
            className={cn(
              'text-5xl font-mono font-bold',
              'transition-all duration-100',
              rolling && 'blur-sm',
              finalNumber && 'text-green-600 dark:text-green-400'
            )}
          >
            {currentNumber}
          </span>

          {/* Corner decorations */}
          <div className="absolute top-1 left-1 w-2 h-2 border-l-2 border-t-2 border-gray-400" />
          <div className="absolute top-1 right-1 w-2 h-2 border-r-2 border-t-2 border-gray-400" />
          <div className="absolute bottom-1 left-1 w-2 h-2 border-l-2 border-b-2 border-gray-400" />
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-400" />
        </div>

        {/* Range display */}
        <p className="text-sm text-muted-foreground">
          Range: {min} - {max}
        </p>

        {/* Roll button */}
        <Button
          size="lg"
          onClick={roll}
          disabled={rolling || disabled}
          className="w-full max-w-[200px]"
        >
          {rolling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mengocok...
            </>
          ) : (
            <>
              <Dices className="mr-2 h-4 w-4" />
              KOCOK
            </>
          )}
        </Button>

        {/* Result display */}
        {finalNumber && !rolling && (
          <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 w-full">
            <p className="text-sm text-muted-foreground mb-1">Hasil:</p>
            <p className="font-bold text-2xl text-green-700 dark:text-green-400">
              {finalNumber}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
