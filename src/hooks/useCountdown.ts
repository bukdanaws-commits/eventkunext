'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseCountdownOptions {
  seconds: number;
  onComplete?: () => void;
}

/**
 * Hook untuk countdown timer
 */
export function useCountdown({ seconds, onComplete }: UseCountdownOptions) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (timeLeft <= 0 && onComplete) {
        onComplete();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setTimeLeft(seconds);
    setIsRunning(false);
  }, [seconds]);

  return {
    timeLeft,
    isRunning,
    start,
    pause,
    reset,
    formattedTime: formatTime(timeLeft),
  };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
