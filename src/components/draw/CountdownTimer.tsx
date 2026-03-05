'use client';

import { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  initialSeconds?: number;
  onComplete?: () => void;
  autoStart?: boolean;
  showControls?: boolean;
  variant?: 'default' | 'large' | 'compact';
}

export function CountdownTimer({
  initialSeconds = 60,
  onComplete,
  autoStart = false,
  showControls = true,
  variant = 'default',
}: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onComplete]);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  const toggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSeconds(initialSeconds);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const progress = ((initialSeconds - seconds) / initialSeconds) * 100;

  // Large variant for draw events
  if (variant === 'large') {
    return (
      <div className="text-center">
        <div
          className={cn(
            'text-8xl font-mono font-bold tabular-nums',
            seconds <= 10 && 'text-red-500 animate-pulse',
            seconds <= 30 && seconds > 10 && 'text-yellow-500'
          )}
        >
          {formatTime(seconds)}
        </div>
        {showControls && (
          <div className="flex justify-center gap-4 mt-6">
            <Button
              size="lg"
              variant="outline"
              onClick={toggleTimer}
              disabled={seconds === 0}
            >
              {isRunning ? (
                <>
                  <Pause className="mr-2 h-5 w-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Start
                </>
              )}
            </Button>
            <Button size="lg" variant="outline" onClick={resetTimer}>
              <RotateCcw className="mr-2 h-5 w-5" />
              Reset
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
        <Timer className="h-4 w-4 text-muted-foreground" />
        <span
          className={cn(
            'font-mono font-medium',
            seconds <= 10 && 'text-red-500'
          )}
        >
          {formatTime(seconds)}
        </span>
      </div>
    );
  }

  // Default variant
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Countdown Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time display */}
        <div className="text-center">
          <div
            className={cn(
              'text-5xl font-mono font-bold tabular-nums',
              seconds <= 10 && 'text-red-500 animate-pulse',
              seconds <= 30 && seconds > 10 && 'text-yellow-500'
            )}
          >
            {formatTime(seconds)}
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={progress} className="h-2" />

        {/* Controls */}
        {showControls && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTimer}
              disabled={seconds === 0}
            >
              {isRunning ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={resetTimer}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
