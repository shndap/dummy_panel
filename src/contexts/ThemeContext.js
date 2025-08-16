import React, { createContext, useContext, useState } from 'react';

const defaultTheme = {
  primary: '',
  secondary: '',
  background: '',
  text: '',
};

export const ThemeContext = createContext({
  colors: defaultTheme,
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
  const [colors, setColors] = useState(defaultTheme);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const value = {
    colors,
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 