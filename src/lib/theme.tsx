'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'localradar-theme';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Apply theme onto <html>. Safe to call repeatedly. */
export function applyThemeClass(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  // Preserve non-theme classes (fonts, antialiased, etc.)
  const kept = Array.from(root.classList).filter((c) => c !== 'light' && c !== 'dark');
  root.className = [...kept, theme].join(' ');
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // ignore
  }
  return 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // SSR + first client render: dark (matches blocking script default).
  // Immediately after mount we sync from localStorage.
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    const stored = readStoredTheme();
    setThemeState(stored);
    applyThemeClass(stored);

    const root = document.documentElement;
    // React hydration / soft navigation can rewrite <html className> and drop theme.
    // Re-apply whenever the class attribute loses our theme token.
    const observer = new MutationObserver(() => {
      const current = root.dataset.theme as Theme | undefined;
      const expected = (current === 'light' || current === 'dark')
        ? current
        : readStoredTheme();
      if (!root.classList.contains(expected)) {
        applyThemeClass(expected);
      }
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // When theme state changes (user toggle), keep DOM + storage in sync
  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyThemeClass(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      applyThemeClass(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
