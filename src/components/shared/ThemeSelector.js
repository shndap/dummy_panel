import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgba } from '../../utils/color';

const ThemeSelector = () => {
  const { theme, currentTheme, setTheme } = useTheme();

  const options = [
    { value: 'light', label: '🌞 Light', icon: '🌞' },
    { value: 'dark', label: '🌙 Dark', icon: '🌙' },
    { value: 'purpleRaindrops', label: '💜 Purple Raindrops', icon: '💜' },
    { value: 'earthyGray', label: '🌲 Earthy Gray', icon: '🌲' },
    { value: 'pastelDreamland', label: '🌸 Pastel Dreamland', icon: '🌸' },
    { value: 'candyPop', label: '🍭 Candy Pop', icon: '🍭' },
    { value: 'midnightMagic', label: '✨ Midnight Magic', icon: '✨' },
  ];

  return (
    <div style={{
      position: 'relative',
      display: 'inline-block',
    }}>
      <select
        value={currentTheme}
        onChange={(e) => setTheme(e.target.value)}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          padding: '8px 36px 8px 16px',
          fontSize: '14px',
          fontWeight: '500',
          color: theme.colors.text.primary,
          backgroundColor: theme.colors.background.paper,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: theme.shadows.sm,
          transition: 'all 0.2s ease',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(theme.colors.text.secondary)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          backgroundSize: '16px',
          '&:hover': {
            borderColor: theme.colors.primary.main,
            boxShadow: `0 0 0 3px ${hexToRgba(theme.colors.primary.main, 0.1)}`,
          },
          '&:focus': {
            outline: 'none',
            borderColor: theme.colors.primary.main,
            boxShadow: `0 0 0 3px ${hexToRgba(theme.colors.primary.main, 0.2)}`,
          },
        }}
      >
        {options.map(option => (
          <option 
            key={option.value} 
            value={option.value}
            style={{
              padding: '8px 12px',
              backgroundColor: theme.colors.background.paper,
              color: theme.colors.text.primary,
            }}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ThemeSelector; 