'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook untuk keyboard shortcut admin (Ctrl+Shift+A)
 */
export function useAdminShortcut() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+A untuk akses admin
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        router.push('/admin');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}
