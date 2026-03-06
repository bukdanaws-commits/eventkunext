'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  start?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  onStart?: () => void;
  onComplete?: () => void;
}

export function AnimatedCounter({
  end,
  duration = 2000,
  start = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
  onComplete,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(start);
  const countRef = useRef(start);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = timestamp - startTimeRef.current;
      const progressPercent = Math.min(progress / duration, 1);

      // Easing function (ease-out-cubic)
      const easeOutCubic = 1 - Math.pow(1 - progressPercent, 3);

      const currentCount = start + (end - start) * easeOutCubic;
      countRef.current = currentCount;
      setCount(currentCount);

      if (progressPercent < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
        onComplete?.();
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [end, duration, start, onComplete]);

  const formatNumber = (num: number) => {
    return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  );
}

// Komponen untuk menampilkan statistik dengan animasi
interface StatCardProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  prefix,
  suffix,
  duration,
  className,
}: StatCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border bg-card p-6 shadow-sm transition-all duration-300',
        'hover:shadow-md hover:border-primary/20',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">
            {isVisible ? (
              <AnimatedCounter
                end={value}
                prefix={prefix}
                suffix={suffix}
                duration={duration}
              />
            ) : (
              `${prefix || ''}0${suffix || ''}`
            )}
          </p>
        </div>
        {icon && (
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
