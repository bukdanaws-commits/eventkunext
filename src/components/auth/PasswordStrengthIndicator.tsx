'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Check, X, AlertCircle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  { label: 'Minimal 8 karakter', test: (p) => p.length >= 8 },
  { label: 'Huruf besar (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'Huruf kecil (a-z)', test: (p) => /[a-z]/.test(p) },
  { label: 'Angka (0-9)', test: (p) => /\d/.test(p) },
  { label: 'Karakter khusus (!@#$%^&*)', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    if (!password) return 0;
    const passed = requirements.filter((req) => req.test(password)).length;
    return (passed / requirements.length) * 100;
  }, [password]);

  const getStrengthLabel = () => {
    if (strength === 0) return { label: '', color: 'bg-muted' };
    if (strength < 40) return { label: 'Lemah', color: 'bg-red-500' };
    if (strength < 70) return { label: 'Sedang', color: 'bg-yellow-500' };
    if (strength < 100) return { label: 'Kuat', color: 'bg-green-500' };
    return { label: 'Sangat Kuat', color: 'bg-emerald-500' };
  };

  const { label, color } = getStrengthLabel();

  return (
    <div className={cn('space-y-3', className)}>
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Kekuatan Password</span>
          <span className={cn('font-medium', color.replace('bg-', 'text-'))}>
            {label}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300', color)}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      {/* Requirements list */}
      <div className="grid grid-cols-2 gap-2">
        {requirements.map((req, index) => {
          const passed = req.test(password);
          return (
            <div
              key={index}
              className={cn(
                'flex items-center gap-1.5 text-xs',
                password ? (passed ? 'text-green-600' : 'text-red-500') : 'text-muted-foreground'
              )}
            >
              {password ? (
                passed ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              <span>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
