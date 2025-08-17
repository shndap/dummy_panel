import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { themes } from '../theme';

export const ThemeContext = createContext({
  theme: themes.light,
  currentTheme: 'light',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function resolveSavedTheme() {
  try {
    const raw = localStorage.getItem('dashboard.theme') || localStorage.getItem('theme');
    if (!raw) return null;
    const key = String(raw).trim();
    if (themes[key]) return key;
    // try case-normalized
    const lowered = key.toLowerCase();
    if (themes[lowered]) return lowered;
  } catch (_) {}
  return null;
}

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = resolveSavedTheme();
    if (saved) return saved;
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (_) {}
    return 'light';
  });

  // Rehydrate on mount (covers edge cases where storage becomes available post-init)
  useEffect(() => {
    const saved = resolveSavedTheme();
    if (saved && saved !== currentTheme) {
      setCurrentTheme(saved);
    }
  }, []);

  // Persist and reflect on document
  useEffect(() => {
    try {
      localStorage.setItem('dashboard.theme', currentTheme);
      localStorage.setItem('theme', currentTheme); // legacy compat
    } catch (_) {}
    try {
      document.documentElement.setAttribute('data-theme', currentTheme);
    } catch (_) {}
  }, [currentTheme]);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e) => {
      if ((e.key === 'dashboard.theme' || e.key === 'theme') && e.newValue) {
        const next = String(e.newValue).trim();
        if (themes[next]) setCurrentTheme(next);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const theme = useMemo(() => themes[currentTheme] || themes.light, [currentTheme]);

  const value = {
    theme,
    currentTheme,
    setTheme: (themeName) => {
      const key = String(themeName || '').trim();
      if (themes[key]) {
        setCurrentTheme(key);
        try {
          localStorage.setItem('dashboard.theme', key);
          localStorage.setItem('theme', key); // legacy compat
        } catch (_) {}
      }
    },
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 