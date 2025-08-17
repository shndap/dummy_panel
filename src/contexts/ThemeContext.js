import React, { createContext, useContext, useState, useMemo } from 'react';
import { themes } from '../theme';

export const ThemeContext = createContext({
  theme: themes.light,
  currentTheme: 'light',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('light');

  const theme = useMemo(() => themes[currentTheme], [currentTheme]);

  const value = {
    theme,
    currentTheme,
    setTheme: (themeName) => {
      if (themes[themeName]) {
        setCurrentTheme(themeName);
      }
    },
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 