'use client';

import { useState, useEffect, useCallback } from 'react';
import { Gift, Dices, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SpinWheelProps {
  prizes: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
  onSpinEnd?: (prizeId: string) => void;
  isSpinning?: boolean;
  disabled?: boolean;
}

const defaultColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4',
];

export function SpinWheel({
  prizes,
  onSpinEnd,
  isSpinning: externalSpinning,
  disabled,
}: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const spinning = externalSpinning ?? isSpinning;

  const spin = useCallback(() => {
    if (spinning || disabled || prizes.length === 0) return;

    setIsSpinning(true);
    setWinner(null);

    // Random number of full rotations + random position
    const fullRotations = 5 + Math.random() * 5; // 5-10 full rotations
    const randomAngle = Math.random() * 360;
    const totalRotation = fullRotations * 360 + randomAngle;

    setRotation((prev) => prev + totalRotation);

    // Calculate winner after spin
    setTimeout(() => {
      const normalizedAngle = (360 - (totalRotation % 360)) % 360;
      const segmentAngle = 360 / prizes.length;
      const winnerIndex = Math.floor(normalizedAngle / segmentAngle);
      const winningPrize = prizes[winnerIndex];

      setWinner(winningPrize.id);
      setIsSpinning(false);
      onSpinEnd?.(winningPrize.id);
    }, 5000); // Animation duration
  }, [spinning, disabled, prizes, onSpinEnd]);

  const renderWheel = () => {
    const segmentAngle = 360 / prizes.length;
    const radius = 120;

    return (
      <svg
        viewBox="0 0 300 300"
        className="w-full h-full max-w-[300px] max-h-[300px]"
      >
        {prizes.map((prize, index) => {
          const startAngle = index * segmentAngle - 90;
          const endAngle = startAngle + segmentAngle;
          const color = prize.color || defaultColors[index % defaultColors.length];

          // Calculate path for segment
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          const x1 = 150 + radius * Math.cos(startRad);
          const y1 = 150 + radius * Math.sin(startRad);
          const x2 = 150 + radius * Math.cos(endRad);
          const y2 = 150 + radius * Math.sin(endRad);

          const largeArcFlag = segmentAngle > 180 ? 1 : 0;

          const pathData = [
            `M 150 150`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `Z`,
          ].join(' ');

          // Text position
          const textAngle = startAngle + segmentAngle / 2;
          const textRad = (textAngle * Math.PI) / 180;
          const textX = 150 + (radius * 0.6) * Math.cos(textRad);
          const textY = 150 + (radius * 0.6) * Math.sin(textRad);

          return (
            <g key={prize.id}>
              <path
                d={pathData}
                fill={color}
                stroke="white"
                strokeWidth="2"
                className={cn(
                  'transition-opacity duration-300',
                  winner && winner !== prize.id && 'opacity-30'
                )}
              />
              <text
                x={textX}
                y={textY}
                fill="white"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                className="pointer-events-none"
              >
                {prize.name.length > 10
                  ? prize.name.substring(0, 10) + '...'
                  : prize.name}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="text-center pb-2">
        <CardTitle className="flex items-center justify-center gap-2">
          <Dices className="h-5 w-5" />
          Spin Wheel
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        {/* Pointer */}
        <div className="relative">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
            <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary" />
          </div>

          {/* Wheel */}
          <div
            className="transition-transform duration-[5000ms] ease-out"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {prizes.length > 0 ? (
              renderWheel()
            ) : (
              <div className="w-[300px] h-[300px] rounded-full border-4 border-dashed border-muted flex items-center justify-center">
                <p className="text-muted-foreground text-center px-4">
                  Tambahkan hadiah untuk memulai
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Spin button */}
        <Button
          size="lg"
          onClick={spin}
          disabled={spinning || disabled || prizes.length === 0}
          className="w-full max-w-[200px]"
        >
          {spinning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Berputar...
            </>
          ) : (
            <>
              <Dices className="mr-2 h-4 w-4" />
              PUTAR
            </>
          )}
        </Button>

        {/* Winner display */}
        {winner && !spinning && (
          <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 w-full">
            <p className="text-sm text-muted-foreground mb-1">Pemenang:</p>
            <p className="font-bold text-lg text-green-700 dark:text-green-400">
              {prizes.find((p) => p.id === winner)?.name}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
