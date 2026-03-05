'use client';

import { useAdminShortcut } from '@/hooks/useAdminShortcut';

interface AppShortcutsProps {
  children: React.ReactNode;
}

export function AppShortcuts({ children }: AppShortcutsProps) {
  // Initialize admin shortcut (Ctrl+Shift+A)
  useAdminShortcut();
  
  return <>{children}</>;
}
