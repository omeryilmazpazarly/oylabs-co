'use client';

import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = (localStorage.getItem('oy-theme') as Theme | null) ?? 'dark';
    setTheme(stored);
  }, []);

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('oy-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  return { theme, isDark: theme === 'dark', toggleTheme, mounted };
}
