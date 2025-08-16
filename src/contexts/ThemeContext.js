import React, { createContext, useContext, useState, useMemo } from 'react';
import { lightTheme, darkTheme, defaultTheme } from '../theme';

export const ThemeContext = createContext({
  theme: { ...lightTheme, tokens: defaultTheme.colors },
  isDarkMode: false,
  toggleTheme: () => {},
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = useMemo(() => {
    const base = isDarkMode ? darkTheme : lightTheme;
    // Always expose extended tokens from defaultTheme under theme.tokens
    return { ...base, tokens: defaultTheme.colors };
  }, [isDarkMode]);

  const value = {
    theme,
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 