'use client';

import { useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Theme {
  id: string;
  name: string;
  primaryColor: string;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
}

const themes: Theme[] = [
  {
    id: 'default',
    name: 'Default',
    primaryColor: 'hsl(var(--primary))',
    backgroundColor: 'hsl(var(--background))',
    cardColor: 'hsl(var(--card))',
    textColor: 'hsl(var(--foreground))',
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    primaryColor: '#0ea5e9',
    backgroundColor: '#f0f9ff',
    cardColor: '#ffffff',
    textColor: '#0c4a6e',
  },
  {
    id: 'forest',
    name: 'Forest Green',
    primaryColor: '#22c55e',
    backgroundColor: '#f0fdf4',
    cardColor: '#ffffff',
    textColor: '#14532d',
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    primaryColor: '#f97316',
    backgroundColor: '#fff7ed',
    cardColor: '#ffffff',
    textColor: '#7c2d12',
  },
  {
    id: 'lavender',
    name: 'Lavender Purple',
    primaryColor: '#a855f7',
    backgroundColor: '#faf5ff',
    cardColor: '#ffffff',
    textColor: '#581c87',
  },
  {
    id: 'rose',
    name: 'Rose Pink',
    primaryColor: '#ec4899',
    backgroundColor: '#fdf2f8',
    cardColor: '#ffffff',
    textColor: '#831843',
  },
];

interface FormThemeSelectorProps {
  value?: string;
  onChange?: (themeId: string) => void;
}

export function FormThemeSelector({ value = 'default', onChange }: FormThemeSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState(value);

  const handleSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    onChange?.(themeId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Tema Form
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleSelect(theme.id)}
              className={cn(
                'relative rounded-lg border-2 p-3 transition-all hover:scale-105',
                selectedTheme === theme.id
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-transparent hover:border-muted'
              )}
            >
              {/* Theme preview */}
              <div
                className="rounded-md overflow-hidden mb-2"
                style={{ backgroundColor: theme.backgroundColor }}
              >
                <div className="p-3 space-y-2">
                  <div
                    className="h-2 w-12 rounded"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <div
                    className="h-6 rounded"
                    style={{ backgroundColor: theme.cardColor }}
                  />
                  <div
                    className="h-8 rounded"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                </div>
              </div>

              <p
                className="text-sm font-medium text-center"
                style={{ color: theme.textColor }}
              >
                {theme.name}
              </p>

              {selectedTheme === theme.id && (
                <div className="absolute -top-1 -right-1 p-1 rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
